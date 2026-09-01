// Militair (M7, hoofdstuk 6): Soldaat-eenheden rekruteren (zelfde
// wachtrij-patroon als groei, zie groeiEnRekrutering.ts) bouwt legerwaarde
// op, samen met de passieve verdedigingsbonus van actieve, bemande
// Wachttoren-tiles en de Legerkamp-toewijzing tegen een Bezette Streek. Een
// confrontatie vergelijkt die legerwaarde met de dreiging op de doelstreek via
// een winkans-formule (geen gegarandeerde uitkomst, `WINKANS_MIN`/
// `WINKANS_MAX` hieronder) — winst levert buit/opruiming op, verlies kost de
// strijder die de beschermende Wachttoren bemande blijvend (issue: "laatste
// confrontatie tweaken" — een eerdere versie liet ook de Wachttoren zelf een
// ruïne worden; dat werd als te zware straf ervaren voor een actie die de
// speler zelf bewust initieert, zie `confrontatieBezetteStreek` hieronder).

import { SOLDAAT } from "./improvements";
import { legerwaardeBonusPerStrijder } from "./techTree";
import { ConfrontatieResultaat, GameState, Settler, Strijder, Streek } from "./types";
import { isTileVerbondenMetStad } from "./wegen";
import { isWachttorenBemand } from "./indringersEnDieren";
import { metActieveStad } from "./stad";

// Militair-tuning (M7, hoofdstuk 6/14): net als de verval-tuning bewuste
// MVP-placeholders. `WINKANS_MIN`/`WINKANS_MAX` zorgen dat een confrontatie
// nooit een gegarandeerde uitkomst is, ook bij extreme krachtsverschillen.
// Hergebruikt door `confrontatieBezetteStreek` hieronder (Deel 5) — dezelfde
// winkans-formule, alleen een andere eigen-legerwaarde-berekening.
const WINKANS_MIN = 0.05;
const WINKANS_MAX = 0.95;

// Alle actieve, nog onbemande Wachttoren-tiles over alle streken heen (nieuwe
// Wachttoren-functie, hoofdstuk 6) — precies de tiles die `bemanWachttoren`
// hieronder daadwerkelijk accepteert.
export function onbemandeWachttorenPosities(state: GameState): Settler[] {
  const posities: Settler[] = [];
  for (const streek of state.streken) {
    for (const tile of streek.tiles) {
      if (
        tile.status === "actief" &&
        tile.improvement?.id === "wachttoren" &&
        !isWachttorenBemand(state.stad.strijders, streek.hoogte, tile.positieInStreek)
      ) {
        posities.push({ hoogte: streek.hoogte, positieInStreek: tile.positieInStreek });
      }
    }
  }
  return posities;
}

// Aantal actieve, bemande Wachttoren-tiles over alle streken heen (hoofdstuk
// 6/11/14): de basis voor het bemannings-voedselverbruik in `voedselVerbruik`
// hierboven. Telt bewust ook niet-wegverbonden bemande torens mee — de
// bemanning moet gevoed worden ongeacht of de toren op dit moment ook
// daadwerkelijk beschermt (wegverbinding is alleen een eis voor de
// indringers-bescherming zelf, zie `heeftBeschermendeWachttoren` verderop).
export function telBemandeWachttorens(state: GameState): number {
  let aantal = 0;
  for (const streek of state.streken) {
    for (const tile of streek.tiles) {
      if (
        tile.status === "actief" &&
        tile.improvement?.id === "wachttoren" &&
        isWachttorenBemand(state.stad.strijders, streek.hoogte, tile.positieInStreek)
      ) {
        aantal += 1;
      }
    }
  }
  return aantal;
}

// Vaste, stad-brede legerwaarde-bonus van de Barakken (hoofdstuk 3/4/6/11/
//14, issue: "city improvements" Deel 3) — anders dan de Wachttoren-bonus
// hieronder geen bemanning nodig, en telt daarom hier los mee bij zowel de
// gewone Confrontatie (`berekenLegerwaarde`) als de Confrontatie tegen een
// Bezette Streek (`confrontatieBezetteStreek`).
function stadLegerwaardeBonus(state: GameState): number {
  let bonus = 0;
  for (const improvement of state.stad.cityImprovements) {
    if (improvement.effect.type === "stad-legerwaarde" && improvement.effect.waarde) {
      bonus += improvement.effect.waarde;
    }
  }
  return bonus;
}

// Totale legerwaarde (hoofdstuk 6: "units + muur/wachttoren-bonus"): elke
// opgeleide strijder telt mee (ongeacht of hij een Wachttoren bemant), plus
// de passieve verdedigingsbonus van elke actieve, bemande Wachttoren-tile
// (nieuwe Wachttoren-functie hierboven: onbemand levert geen bonus),
// ongeacht op welke streek die staat (er is in de MVP maar één actieve stad,
// hoofdstuk 13), plus de vaste Barakken-bonus hierboven.
export function berekenLegerwaarde(state: GameState): number {
  // "B2b. Verharde speren" (hoofdstuk 3/9, techTree.ts): een lichte
  // legerwaarde-bonus per strijder, bovenop de vaste SOLDAAT-waarde.
  let waarde =
    state.stad.strijders.length * ((SOLDAAT.effect.waarde ?? 0) + legerwaardeBonusPerStrijder(state.technologieen)) +
    stadLegerwaardeBonus(state);

  for (const streek of state.streken) {
    for (const tile of streek.tiles) {
      const effect = tile.improvement?.effect;
      if (
        tile.status === "actief" &&
        effect?.type === "verdediging" &&
        effect.waarde &&
        isWachttorenBemand(state.stad.strijders, streek.hoogte, tile.positieInStreek)
      ) {
        waarde += effect.waarde;
      }
    }
  }

  return waarde;
}

function berekenWinkans(eigenLegerwaarde: number, tegenstanderSterkte: number): number {
  const totaal = eigenLegerwaarde + tegenstanderSterkte;
  const ruweKans = totaal === 0 ? 0.5 : eigenLegerwaarde / totaal;
  return Math.min(WINKANS_MAX, Math.max(WINKANS_MIN, ruweKans));
}

// Legerkamp-toewijzing (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 5) — zelfde soort interactie als Wachttoren-bemanning
// hierboven (`isWachttorenBemand`/`onbemandeWachttorenPosities`/
// `bemanWachttoren`), maar voor het Legerkamp: elke toegewezen Soldaat telt
// mee als extra legerwaarde bij een Confrontatie tegen een Bezette Streek,
// ongeacht op welke streek het Legerkamp staat.
export function isLegerkampBemand(strijders: Strijder[], hoogte: number, positieInStreek: number): boolean {
  return strijders.some(
    (strijder) => strijder.legerkamp?.hoogte === hoogte && strijder.legerkamp?.positieInStreek === positieInStreek
  );
}

export function onbemandeLegerkampPosities(state: GameState): Settler[] {
  const posities: Settler[] = [];
  for (const streek of state.streken) {
    for (const tile of streek.tiles) {
      if (
        tile.status === "actief" &&
        tile.improvement?.id === "legerkamp" &&
        !isLegerkampBemand(state.stad.strijders, streek.hoogte, tile.positieInStreek)
      ) {
        posities.push({ hoogte: streek.hoogte, positieInStreek: tile.positieInStreek });
      }
    }
  }
  return posities;
}

// Wijst een strijder toe aan een Legerkamp — een strijder heeft hoogstens
// één toewijzing tegelijk (Wachttoren óf Legerkamp), net als de gewone
// Wachttoren-bemanning omkeerbaar en instant via `haalStrijderTerug`
// hieronder.
export function bemanLegerkamp(state: GameState, strijderId: string, hoogte: number, positieInStreek: number): GameState {
  const strijder = state.stad.strijders.find((s) => s.id === strijderId);
  if (!strijder || strijder.wachttoren || strijder.legerkamp) return state;

  const streek = state.streken.find((l) => l.hoogte === hoogte);
  const tile = streek?.tiles[positieInStreek];
  if (!tile || tile.status !== "actief" || tile.improvement?.id !== "legerkamp") return state;
  if (isLegerkampBemand(state.stad.strijders, hoogte, positieInStreek)) return state;

  const strijders = state.stad.strijders.map((s) =>
    s.id === strijderId ? { ...s, legerkamp: { hoogte, positieInStreek } } : s
  );

  return metActieveStad(state, { ...state.stad, strijders });
}

// Of er een voltooide, wegverbonden eigen Legerkamp-tile op `streek` staat
// (issue: "Bezette streek scherm" — vervangt de eerdere harde Wachttoren-eis:
// thematisch logischer, een legerkamp confronteert, geen wachtpost). Anders
// dan een Wachttoren hoeft een Legerkamp niet bemand te zijn om als "aanwezig"
// te tellen — de bemanning telt al apart mee via `berekenLegerkampLegerwaarde`
// hieronder, ongeacht op welke streek dat Legerkamp staat (hoofdstuk 6/11:
// "Legerkamp overal bouwbaar").
export function heeftWerkendeLegerkampOpStreek(state: GameState, streek: Streek): boolean {
  return streek.tiles.some(
    (tile) =>
      tile.status === "actief" &&
      tile.improvement?.id === "legerkamp" &&
      isTileVerbondenMetStad(state.streken, streek.hoogte, tile.positieInStreek)
  );
}

// Opgetelde legerwaarde van alle Legerkamp-toegewezen Soldaten (Deel 5) —
// dezelfde per-strijder-waarde als de gewone `berekenLegerwaarde` hierboven,
// maar losstaand: alleen toegewezen strijders tellen hier mee, in
// tegenstelling tot de gewone legerwaarde die altijd alle strijders meetelt.
export function berekenLegerkampLegerwaarde(state: GameState): number {
  const aantal = state.stad.strijders.filter((s) => s.legerkamp).length;
  return aantal * ((SOLDAAT.effect.waarde ?? 0) + legerwaardeBonusPerStrijder(state.technologieen));
}

// Alle onthulde, nog niet vernietigde vijandelijke Wachttoren-tiles van de
// actieve Bezette Streek (Deel 5) — de mogelijke Confrontatie-doelen.
export function vijandelijkeWachttorenPosities(state: GameState): Settler[] {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return [];
  return bezetteStreek.tiles
    .filter((tile) => tile.status === "actief" && tile.improvement?.id === "vijandelijke-wachttoren")
    .map((tile) => ({ hoogte: bezetteStreek.hoogte, positieInStreek: tile.positieInStreek }));
}

// Of een Confrontatie tegen deze specifieke vijandelijke Wachttoren-tile
// mogelijk is (Deel 5, herzien door "Bezette streek scherm"): vereist een
// voltooid, wegverbonden eigen Legerkamp op de streek direct onder de Bezette
// Streek (i.p.v. de eerdere Wachttoren-eis — thematisch logischer: een
// legerkamp confronteert, geen wachtpost, zie hoofdstuk 11) — zonder dat
// Legerkamp is de actie niet beschikbaar (uitgegrijsd/geblokkeerd), geen
// mislukte poging.
export function kanConfrontatieBezetteStreek(state: GameState, positieInStreek: number): boolean {
  // Cooldown (issue: "Militaire confrontatie" — na een verlies pas volgende
  // beurt weer beschikbaar, zie `confrontatieGeblokkeerdTotVolgendeBeurt`
  // hieronder in `confrontatieBezetteStreek`).
  if (state.confrontatieGeblokkeerdTotVolgendeBeurt) return false;

  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return false;
  const tile = bezetteStreek.tiles[positieInStreek];
  if (tile?.status !== "actief" || tile.improvement?.id !== "vijandelijke-wachttoren") return false;

  const streekOnder = state.streken.find((l) => l.hoogte === bezetteStreek.hoogte - 1);
  return streekOnder !== undefined && heeftWerkendeLegerkampOpStreek(state, streekOnder);
}

// Winkans-preview vóór bevestiging (issue: "Militaire confrontatie" — "op die
// pop-up wil ik graag de kans zien van winnen en verlies"): dezelfde formule
// als `confrontatieBezetteStreek` hieronder daadwerkelijk gebruikt, zodat de
// pop-up nooit een ander percentage toont dan wat het gevecht zelf toepast.
// Geeft 0 terug zolang er geen actieve Bezette Streek is (geen zinvol doel).
export function winkansConfrontatieBezetteStreek(state: GameState): number {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return 0;

  const tegenstanderSterkte = bezetteStreek.dreigingsniveau ?? 0;
  const eigenLegerwaarde = berekenLegerkampLegerwaarde(state) + stadLegerwaardeBonus(state);
  return berekenWinkans(eigenLegerwaarde, tegenstanderSterkte);
}

// Confrontatie tegen een vijandelijke Wachttoren op een Bezette Streek
// (hoofdstuk 6, issue: "De Bezette Streek, missionaris en verkenner", Deel 5,
// herzien door "Bezette streek scherm") — een apart systeem van de gewone
// Wachttoren-/indringers-mechaniek hierboven, met een eigen
// eigen-legerwaarde-formule: de opgetelde legerwaarde van alle
// Legerkamp-toegewezen Soldaten (ongeacht op welke streek het Legerkamp
// staat) plus de vaste Barakken-bonus — gebruikt verder dezelfde
// winkans-formule (`berekenWinkans` hierboven, hoofdstuk 14: geclamped
// 5%-95%). Tegenstandersterkte = `Streek.dreigingsniveau` van de Bezette
// Streek zelf — dezelfde precedent-waarde als de bestaande, oplopende
// dreigingsniveau-formule (world.ts) elders al gebruikt, en daardoor
// automatisch vergelijkbaar met de zwaarste tegenstander die de speler tot
// dan toe in de tutorial is tegengekomen.
//
// Winst: de vijandelijke Wachttoren-tile wordt "opgeruimd" (leeg, geen
// dreiging/doel meer). Verlies: het eigen Legerkamp op de streek eronder
// blijft intact — alleen één van de eraan toegewezen strijders (de eerste,
// bij gebrek aan een aparte "wie voerde het bevel"-notie) is blijvend
// verloren (moet als nieuwe Soldaat volledig opnieuw opgeleid worden, geen
// reassignment, anders dan de normale, omkeerbare toewijs-regel in hoofdstuk
// 6) — dezelfde lichtere straf als voorheen (issue: "laatste confrontatie
// tweaken": alleen de bemanning, niet de infrastructuur zelf). Zonder
// toegewezen Legerkamp-strijders (de legerwaarde kwam dan puur van de
// Barakken-bonus) is er niemand om te verliezen. Verlies zet ook
// `confrontatieGeblokkeerdTotVolgendeBeurt` (issue: "Militaire confrontatie"
// — "als je verliest dan mag je volgende beurt pas weer een confrontatie
// proberen"): `kanConfrontatieBezetteStreek` hierboven blokkeert een nieuwe
// poging tot `volgendeBeurt` (economie.ts) de vlag weer terugzet.
export function confrontatieBezetteStreek(state: GameState, positieInStreek: number): GameState {
  if (!kanConfrontatieBezetteStreek(state, positieInStreek)) return state;

  const bezetteStreek = state.streken.find((l) => l.bezet)!;

  const tegenstanderSterkte = bezetteStreek.dreigingsniveau ?? 0;
  const eigenLegerwaarde = berekenLegerkampLegerwaarde(state) + stadLegerwaardeBonus(state);
  const winkans = winkansConfrontatieBezetteStreek(state);
  const gewonnen = Math.random() < winkans;

  const laatsteConfrontatieBezetteStreek: ConfrontatieResultaat = {
    winkans,
    gewonnen,
    eigenLegerwaarde,
    tegenstanderSterkte,
  };

  if (gewonnen) {
    const streken = state.streken.map((streek) =>
      streek.hoogte !== bezetteStreek.hoogte
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((t, i) =>
              i === positieInStreek ? { ...t, status: "leeg" as const, improvement: undefined } : t
            ),
          }
    );
    return { ...state, streken, laatsteConfrontatieBezetteStreek };
  }

  const verlorenStrijder = state.stad.strijders.find((s) => s.legerkamp);
  const strijders = verlorenStrijder
    ? state.stad.strijders.filter((s) => s.id !== verlorenStrijder.id)
    : state.stad.strijders;

  return {
    ...metActieveStad(state, { ...state.stad, strijders }),
    laatsteConfrontatieBezetteStreek,
    confrontatieGeblokkeerdTotVolgendeBeurt: true,
  };
}

// Bemant een Wachttoren met een specifieke strijder (nieuwe Wachttoren-functie,
// hoofdstuk 6): via het militaire paneel kiest de speler eerst een nog
// onbemande strijder, dan een actieve, nog onbemande Wachttoren-tile op de
// kaart. Geeft de ongewijzigde status terug bij een ongeldige combinatie
// (strijder bestaat niet, is al bemand, of het doel is geen actieve,
// onbemande Wachttoren). Toewijzen is sinds hoofdstuk 6/11 omkeerbaar (issue:
// "wachttorens, bemanning en bevoorrading") via `haalStrijderTerug` hieronder
// — net als bemannen zelf gebeurt dat instant, zonder beurten te kosten
// (issue: "wachttoren tweaks").
export function bemanWachttoren(
  state: GameState,
  strijderId: string,
  hoogte: number,
  positieInStreek: number
): GameState {
  const strijder = state.stad.strijders.find((s) => s.id === strijderId);
  if (!strijder || strijder.wachttoren) return state;

  const streek = state.streken.find((l) => l.hoogte === hoogte);
  const tile = streek?.tiles[positieInStreek];
  if (!tile || tile.status !== "actief" || tile.improvement?.id !== "wachttoren") return state;
  if (isWachttorenBemand(state.stad.strijders, hoogte, positieInStreek)) return state;

  const strijders = state.stad.strijders.map((s) =>
    s.id === strijderId ? { ...s, wachttoren: { hoogte, positieInStreek } } : s
  );

  return metActieveStad(state, { ...state.stad, strijders });
}

// Haalt een bemande strijder terug van zijn Wachttoren (hoofdstuk 6/11, issue:
// "wachttorens, bemanning en bevoorrading" — vervangt de eerdere onomkeerbare
// toewijzing). De Wachttoren zelf raakt meteen onbemand (en dus, tenzij een
// andere strijder hem overneemt, onbeschermd — zie `heeftBeschermendeWachttoren`),
// en de strijder is meteen weer elders inzetbaar: verplaatsen tussen
// wachttorens kost geen beurten (issue: "wachttoren tweaks" — een eerdere
// versie liet de strijder hier nog een paar beurten "onderweg" zijn, maar dat
// voegde alleen wachttijd toe zonder de keuze zelf interessanter te maken).
// Geen effect op een strijder die niet bemand is.
// Sinds "De Bezette Streek" (Deel 5) kan een strijder ook aan een Legerkamp
// toegewezen zijn (`legerkamp` i.p.v. `wachttoren`, zie `bemanLegerkamp`
// hierboven) — deze functie haalt hem sowieso terug van wélke toewijzing hij
// ook heeft, net zo omkeerbaar en instant als de oorspronkelijke Wachttoren-
// only-versie.
export function haalStrijderTerug(state: GameState, strijderId: string): GameState {
  const strijder = state.stad.strijders.find((s) => s.id === strijderId);
  if (!strijder || (!strijder.wachttoren && !strijder.legerkamp)) return state;

  const strijders = state.stad.strijders.map((s) =>
    s.id === strijderId ? { ...s, wachttoren: undefined, legerkamp: undefined } : s
  );

  return metActieveStad(state, { ...state.stad, strijders });
}
