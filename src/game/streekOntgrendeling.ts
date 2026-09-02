// Cultuur & streek-ontgrendeling (M5): cultuur is een voortgangs-valuta zonder
// opslag-cap (hoofdstuk 5). Zodra de cumulatieve cultuur de drempel van de
// eerstvolgende vergrendelde streek haalt, ontgrendelt die streek automatisch
// (fog of war verdwijnt — hoofdstuk 2).
//
// Bezette Streek, Verkenning & wololo (hoofdstuk 6, issue: "De Bezette Streek,
// missionaris en verkenner", herzien door "Bezette streek scherm"): sommige
// streken komen in plaats daarvan "in beeld" met verhulde vakjes. Een klik op
// een verhuld vakje stuurt direct een verkenner (kost grondstoffen +
// wetenschap, telt een aantal beurten af voordat het vakje onthuld wordt).
// Een klik op een onthuld vijandelijk Heiligdom stuurt een beschikbare
// Missionaris daarheen — die vult een eigen wololo-meter voor dát Heiligdom,
// die het bij het bereiken van de drempel verovert (i.p.v. vernietigt).

import {
  BEZETTE_STREEK_HUISJE,
  HEILIGDOM,
  VERKENNER,
  VIJANDELIJK_HEILIGDOM,
  VIJANDELIJKE_WACHTTOREN,
} from "./improvements";
import { GameState, Settler, Tile } from "./types";
import {
  GOUD_ONTDEKKING_STREEK,
  GOUD_ONTDEKKING_STREEK_2,
  cultuurKostenVoorStreek,
  hoogsteOntgrendeldeStreek,
  initialiseerBezetteStreek,
  isBezetteStreekHoogte,
  kuddeJachtBeurtenVoorStreek,
  ROOFDIER_MIN_STREEK,
  ROOFDIER_STREEK_KUDDE_POSITIE,
} from "./world";
import { initialiseerWampanoagLaag, WAMPANOAG_STREEK_HOOGTE } from "./worldGoingWest";
import { metActieveStad } from "./stad";

// Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
// verkenner"): kosten van één Verkenning (Deel 3, hergebruikt `VERKENNER`
// hierboven voor de grondstofkosten en het aantal beurten tot onthulling) en
// de wololo-drempel tegen een vijandelijk Heiligdom (Deel 4, per Heiligdom
// i.p.v. streek-breed sinds "Bezette streek scherm") — beide MVP-richtwaarden,
// expliciet tunebaar genoemd in het issue (hoofdstuk 14).
export const VERKENNING_KOSTEN_WETENSCHAP = 10;
export const BELEGERINGSDREMPEL = 30;
// Wololo-inkomen per aan een Heiligdom toegewezen Missionaris, per beurt
// (issue: "Bezette streek scherm"): een vaste waarde i.p.v. omgeleide
// cultuurproductie — met één Heiligdom als doel is er geen streek-brede
// cultuurproductie meer om om te leiden, dus dit is een eigen, losstaande
// bron. Bij `BELEGERINGSDREMPEL` (30) vult één Missionaris de meter in 6
// beurten, een tweede Missionaris op hetzelfde doel in 3 — zelfde
// "meer Missionarissen = sneller"-principe als voorheen (issue: "laatste
// confrontatie tweaken").
export const WOLOLO_INKOMEN_PER_MISSIONARIS = 5;

// Ontgrendelt de eerstvolgende vergrendelde streek zodra de cumulatieve
// cultuur de drempel haalt (M5, hoofdstuk 2/5) — geldt ongewijzigd voor elke
// campagne, inclusief de Going West-openingsfase (issue "Weer gewoon cultuur
// voor ontgrendeling": een eerdere versie liet de openingsfase op wetenschap
// draaien via `GameState.ontgrendelResource`/`wetenschapKostenVoorStreekOntgrendeling`
// — dat bleek nodeloos ingewikkeld en is teruggedraaid; wetenschap drijft nu
// alleen nog de technologieboom en de Verkenner-actie hieronder/in
// wampanoag.ts). Cultuur wordt niet "uitgegeven" — het blijft een oplopende
// teller, dus bij een groot overschot ontgrendelen meteen meerdere streken na
// elkaar in dezelfde beurt.
export function verwerkStreekOntgrendeling(state: GameState): GameState {
  let streken = state.streken;
  let volgendeHoogte = hoogsteOntgrendeldeStreek(streken) + 1;
  let goudOntdektEvent = state.goudOntdektEvent;
  let tweedeGoudOntdektEvent = state.tweedeGoudOntdektEvent;
  let bezetteStreekOntdektEvent = state.bezetteStreekOntdektEvent;
  let wampanoagLaagOntdektEvent = state.wampanoagLaagOntdektEvent;
  let stichtingskansOntdektEvent = state.stichtingskansOntdektEvent;

  const heeftDrempelGehaald = (hoogte: number) => state.cultuur >= cultuurKostenVoorStreek(hoogte);

  while (volgendeHoogte <= streken.length && heeftDrempelGehaald(volgendeHoogte)) {
    const huidigeStreek = streken.find((streek) => streek.hoogte === volgendeHoogte)!;

    // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
    // verkenner", Deel 2): in plaats van normaal te ontgrendelen, komt deze
    // streek "in beeld" — dezelfde soort trigger als de gegarandeerde
    // Goudader-vondst hieronder. De streek blijft `ontgrendeld: false` (dus
    // de frontier blijft op de streek eronder staan) tot alle vijandelijke
    // Heiligdommen vernietigd zijn (`verwerkBelegering` hieronder in de
    // `volgendeBeurt`-pijplijn) — de `while`-lus stopt hier dus altijd,
    // zowel de eerste keer (initialisatie) als op elke latere beurt zolang
    // de streek nog bezet is.
    if (isBezetteStreekHoogte(volgendeHoogte)) {
      if (!huidigeStreek.bezet) {
        streken = streken.map((streek) => (streek.hoogte === volgendeHoogte ? initialiseerBezetteStreek(streek) : streek));
        bezetteStreekOntdektEvent = true;
      }
      break;
    }

    // Wampanoag-laag (Going West, M21e, opdracht-wampanoag-opening.md §5;
    // blokkerend gemaakt door issue "Wampanoag streek blokkerend"): zelfde
    // bevriezings-patroon als de Bezette Streek hierboven — de streek komt
    // "in beeld" met alle negen vakjes verhuld (`initialiseerWampanoagLaag`,
    // worldGoingWest.ts) en blijft `ontgrendeld: false` (dus geen
    // frontier-voortgang, geen verdere cultuur-gedreven streek-ontgrendeling)
    // tot de drie handelsvakjes onthuld zijn (`verwerkWampanoagVerkenningInGang`,
    // wampanoag.ts, dat op dat moment ook `ontgrendeld: true` zet). Een eigen
    // `Streek.wampanoagBezet`-vlag i.p.v. `Streek.bezet` hergebruiken: die
    // laatste wordt hieronder door `verwerkBelegering` opgelost aan de hand
    // van vijandelijke Heiligdom-/Wachttoren-inhoud, die een Wampanoag-streek
    // niet heeft. De `campagneId`-check is nodig omdat de tutorial toevallig
    // ook een streek met dezelfde hoogte heeft (ontgrendeld via de gewone
    // cultuurdrempel) — zonder deze check zou die tutorial-streek hier per
    // ongeluk ook bevroren worden.
    if (volgendeHoogte === WAMPANOAG_STREEK_HOOGTE && state.campagneId === "going-west") {
      if (!huidigeStreek.wampanoagBezet) {
        streken = streken.map((streek) =>
          streek.hoogte === WAMPANOAG_STREEK_HOOGTE ? initialiseerWampanoagLaag(streek) : streek
        );
        wampanoagLaagOntdektEvent = true;
      }
      break;
    }

    streken = streken.map((streek) =>
      streek.hoogte === volgendeHoogte ? { ...streek, ontgrendeld: true } : streek
    );
    // Nieuwe stichtingskans ontdekt (Going West, issue #459): een net
    // ontgrendelde streek met een vers-water-vakje is één van de drie
    // gegarandeerde stichtingskansen uit het herhalende
    // drie-stichtingsmomenten-patroon (hoofdstuk 9 Deel 2,
    // `gegarandeerdeStichtingskansHoogten()` in stad.ts) — de speler kan hier
    // met de settler een nieuwe stad stichten, maar kan ook wachten tot de
    // huidige stad "groot" is voor de Boon-beloning (boons.ts). Alleen voor
    // Going West: de tutorial heeft precies één vers-water-vakje en kent geen
    // herhalend patroon of Boon-systeem (zelfde `campagneId`-check als de
    // Wampanoag-laag hierboven).
    if (state.campagneId === "going-west" && huidigeStreek.tiles.some((tile) => tile.versWater)) {
      stichtingskansOntdektEvent = true;
    }
    // Goudader-ontdekking (hoofdstuk 3/14, issue: "toevoeging Goud"): de
    // gegarandeerde eerste Goudader-locatie ligt op `GOUD_ONTDEKKING_STREEK`
    // (world.ts) — deze `while`-lus loopt precies één keer door die hoogte
    // heen op het moment dat hij ontgrendelt, dus dit triggert vanzelf maar
    // één keer per run, net als de streek-ontgrendeling zelf.
    if (volgendeHoogte === GOUD_ONTDEKKING_STREEK) {
      goudOntdektEvent = true;
    }
    // Tweede Goudader-ontdekking (hoofdstuk 3/11/14, issue: "Goudader
    // sowieso op streek 12"): zelfde eenmalige trigger als hierboven, maar op
    // `GOUD_ONTDEKKING_STREEK_2` — de softlock-preventie vlak vóór de Bezette
    // Streek.
    if (volgendeHoogte === GOUD_ONTDEKKING_STREEK_2) {
      tweedeGoudOntdektEvent = true;
    }
    // Gegarandeerde kudde op de roofdier-introductiestreek (hoofdstuk 14/17,
    // issue: "Eerste streek geen roofdieren", vervolgvraag): zodra
    // `ROOFDIER_MIN_STREEK` voor het eerst ontgrendelt, staat er meteen een
    // kudde op `ROOFDIER_STREEK_KUDDE_POSITIE` — de speler hoeft niet op de
    // gewone, willekeurige `verwerkKuddes`-trekking te wachten om het net
    // uitgelegde roofdier-risico ook meteen in de praktijk te kunnen
    // ervaren. Zelfde eenmalige trigger als de Goudader-ontdekkingen
    // hierboven: deze `while`-lus loopt precies één keer door deze hoogte
    // heen op het moment van ontgrendelen.
    if (volgendeHoogte === ROOFDIER_MIN_STREEK) {
      streken = streken.map((streek) =>
        streek.hoogte !== ROOFDIER_MIN_STREEK
          ? streek
          : {
              ...streek,
              tiles: streek.tiles.map((tile, index) =>
                index === ROOFDIER_STREEK_KUDDE_POSITIE
                  ? { ...tile, kudde: { beurtenResterend: kuddeJachtBeurtenVoorStreek(ROOFDIER_MIN_STREEK) } }
                  : tile
              ),
            }
      );
    }
    volgendeHoogte += 1;
  }

  return streken === state.streken &&
    bezetteStreekOntdektEvent === state.bezetteStreekOntdektEvent &&
    wampanoagLaagOntdektEvent === state.wampanoagLaagOntdektEvent &&
    stichtingskansOntdektEvent === state.stichtingskansOntdektEvent
    ? state
    : {
        ...state,
        streken,
        goudOntdektEvent,
        tweedeGoudOntdektEvent,
        bezetteStreekOntdektEvent,
        wampanoagLaagOntdektEvent,
        stichtingskansOntdektEvent,
      };
}

// Sluit de "Bezette Streek ontdekt"-melding (Deel 2) — puur een
// UI-bevestiging, zelfde patroon als `sluitGoudOntdektMelding` hieronder.
export function sluitBezetteStreekOntdektMelding(state: GameState): GameState {
  return { ...state, bezetteStreekOntdektEvent: undefined };
}

// Sluit de "Wampanoag-laag ontdekt"-melding (Going West, M21e) — puur een
// UI-bevestiging, zelfde patroon als `sluitBezetteStreekOntdektMelding`
// hierboven. Nog door geen enkele pop-up-component aangeroepen (§8: de
// narratieve `eersteContactPopup`-UI zelf is M21g), alvast aanwezig voor die
// latere UI.
export function sluitWampanoagLaagOntdektMelding(state: GameState): GameState {
  return { ...state, wampanoagLaagOntdektEvent: undefined };
}

// Sluit de Goudader-ontdekkingsmelding (hoofdstuk 3/14) — puur een
// UI-bevestiging, zelfde patroon als `sluitKuddeMelding` hierboven.
export function sluitGoudOntdektMelding(state: GameState): GameState {
  return { ...state, goudOntdektEvent: undefined };
}

// Sluit de "nieuwe stichtingskans ontdekt"-melding (Going West, issue #459)
// — puur een UI-bevestiging, zelfde patroon als `sluitWampanoagLaagOntdektMelding`
// hierboven.
export function sluitStichtingskansOntdektMelding(state: GameState): GameState {
  return { ...state, stichtingskansOntdektEvent: undefined };
}

// Sluit de tweede Goudader-ontdekkingsmelding (hoofdstuk 3/11/14, issue:
// "Goudader sowieso op streek 12") — puur een UI-bevestiging, zelfde patroon
// als `sluitGoudOntdektMelding` hierboven.
export function sluitTweedeGoudOntdektMelding(state: GameState): GameState {
  return { ...state, tweedeGoudOntdektEvent: undefined };
}

// Of er een voltooid Offer Altaar staat (Deel 4) — net als
// `heeftGebouwdeMijn` verderop telt hier niet mee of het wegverbonden is:
// het gaat om het moment van bouwen zelf, niet om lopende productie (het
// Offer Altaar produceert toch niets, zie improvements.ts).
export function heeftOfferAltaar(state: GameState): boolean {
  return state.streken.some((streek) =>
    streek.tiles.some((tile) => tile.status === "actief" && tile.improvement?.id === "offer-altaar")
  );
}

// Onthult één vakje van `bezetteStreek` op basis van zijn vaste
// `bezetteStreekInhoud` (Wachttoren, Heiligdom, cosmetisch huisje, of — op het
// neutrale middelste vakje — gewoon leeg). Gedeeld door `verwerkVerkenningInGang`
// (een vakje waarvan de verkenner is aangekomen) en `verwerkBelegering`
// (de streekbrede onthulling zodra alles opgelost is, Deel 6).
function onthuldImprovementVoorInhoud(tile: Tile) {
  return tile.bezetteStreekInhoud === "wachttoren"
    ? VIJANDELIJKE_WACHTTOREN
    : tile.bezetteStreekInhoud === "heiligdom"
      ? VIJANDELIJK_HEILIGDOM
      : tile.bezetteStreekInhoud === "huisje"
        ? BEZETTE_STREEK_HUISJE
        : undefined;
}

// Wololo tegen de vijandelijke Heiligdommen van een Bezette Streek (hoofdstuk
// 6, issue: "De Bezette Streek, missionaris en verkenner", Deel 4, herzien
// door "Bezette streek scherm": niet langer een streek-brede meter gevoed
// door omgeleide cultuurproductie, maar een eigen meter per Heiligdom, gevuld
// door de Missionarissen die de speler daar specifiek naartoe gestuurd heeft
// (`stuurMissionaris` hieronder). Elke toegewezen Missionaris levert
// `WOLOLO_INKOMEN_PER_MISSIONARIS` per beurt op dát ene doel — een tweede
// Missionaris op hetzelfde Heiligdom verdubbelt dus de snelheid (zelfde
// principe als voorheen, issue: "laatste confrontatie tweaken"), maar een
// Missionaris op een ánder Heiligdom draagt niets bij aan dit doel. Bereikt de
// meter de drempel, dan wordt dat Heiligdom geen ruïne maar eigen bezit (het
// wordt een gewoon Heiligdom, `HEILIGDOM`) — het produceert cultuur zodra het,
// net als elk ander land improvement, wegverbonden is (pas mogelijk nadat de
// hele streek opengaat, zie "Einde van de Bezette Streek" hieronder). De
// toegewezen Missionarissen komen daarna vrij voor een volgend doel.
//
// Los van wololo wordt bij elke beurt ook gecontroleerd of de streek
// inmiddels volledig is opgelost (issue: "laatste confrontatie tweaken" —
// zie "Einde van de Bezette Streek" hieronder): dat mag ook via een
// Confrontatie-actie in militair.ts gebeuren, die zelf geen Missionaris
// vereist, dus die check mag niet achter de wololo-verwerking hierboven
// verstopt zitten.
export function verwerkBelegering(state: GameState): GameState {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return state;

  let tiles = bezetteStreek.tiles;
  let missionarissen = state.stad.missionarissen;
  let vijandelijkHeiligdomVeroverdEvent = state.vijandelijkHeiligdomVeroverdEvent;

  for (const heiligdomTile of bezetteStreek.tiles) {
    if (heiligdomTile.status !== "actief" || heiligdomTile.improvement?.id !== "vijandelijk-heiligdom") continue;

    const toegewezenAantal = missionarissen.filter(
      (m) =>
        m.doelHeiligdom?.hoogte === bezetteStreek.hoogte &&
        m.doelHeiligdom?.positieInStreek === heiligdomTile.positieInStreek
    ).length;
    if (toegewezenAantal === 0) continue;

    const nieuweVoortgang = (heiligdomTile.wololoVoortgang ?? 0) + WOLOLO_INKOMEN_PER_MISSIONARIS * toegewezenAantal;

    if (nieuweVoortgang < BELEGERINGSDREMPEL) {
      tiles = tiles.map((t) =>
        t.positieInStreek === heiligdomTile.positieInStreek ? { ...t, wololoVoortgang: nieuweVoortgang } : t
      );
      continue;
    }

    tiles = tiles.map((t) =>
      t.positieInStreek === heiligdomTile.positieInStreek
        ? { ...t, improvement: HEILIGDOM, wololoVoortgang: undefined }
        : t
    );
    missionarissen = missionarissen.map((m) =>
      m.doelHeiligdom?.hoogte === bezetteStreek.hoogte && m.doelHeiligdom?.positieInStreek === heiligdomTile.positieInStreek
        ? { ...m, doelHeiligdom: undefined }
        : m
    );
    vijandelijkHeiligdomVeroverdEvent = true;
  }

  // Einde van de Bezette Streek (Deel 6, uitgebreid — issue: "laatste
  // confrontatie tweaken"): pas zodra zowel geen vijandelijk Heiligdom als
  // geen vijandelijke Wachttoren meer over is — noch onthuld-en-actief, noch
  // nog verhuld — wordt de hele streek in één keer volledig onthuld (ook nog
  // niet individueel verkende vakjes), eindigt de Bezette-status en telt de
  // streek vanaf dan als normaal ontgrendeld (en dus pas vanaf dan betreedbaar
  // voor de settler en bebouwbaar, zie `magSettlerNaar`/`hoogsteOntgrendeldeStreek`
  // in wegen.ts/world.ts en de `streek.ontgrendeld`-eis in
  // infrastructuurEnBouw.ts — geen apart nieuw slot nodig, de bestaande
  // ontgrendel-gate dekt beide al). Een veroverd Heiligdom (`improvement.id`
  // "heiligdom" i.p.v. "vijandelijk-heiligdom") telt hier vanzelf niet meer
  // mee als "nog vijandelijk" — geen apart veld nodig.
  const heeftNogHeiligdom = tiles.some(
    (tile) =>
      (tile.status === "actief" && tile.improvement?.id === "vijandelijk-heiligdom") ||
      (tile.verhuld && tile.bezetteStreekInhoud === "heiligdom")
  );
  const heeftNogWachttoren = tiles.some(
    (tile) =>
      (tile.status === "actief" && tile.improvement?.id === "vijandelijke-wachttoren") ||
      (tile.verhuld && tile.bezetteStreekInhoud === "wachttoren")
  );
  // `bezetteStreek` (hierboven) bestaat alleen zolang `streek.bezet` nog waar is
  // — deze functie draait dus nooit meer opnieuw op een al opgeloste streek,
  // dus geen aparte "was dit al opgelost?"-check nodig.
  const opgelost = !heeftNogHeiligdom && !heeftNogWachttoren;

  if (opgelost) {
    tiles = tiles.map((tile) =>
      !tile.verhuld
        ? tile
        : {
            ...tile,
            verhuld: false,
            verkenningInGang: undefined,
            improvement: onthuldImprovementVoorInhoud(tile),
            status:
              tile.bezetteStreekInhoud === "wachttoren" || tile.bezetteStreekInhoud === "huisje"
                ? ("actief" as const)
                : tile.status,
          }
    );
  }

  // Niets veranderd (geen wololo-voortgang deze beurt, en nog niet opgelost)
  // — geef dezelfde state terug, zelfde no-op-conventie als
  // `verwerkStreekOntgrendeling` hierboven.
  if (tiles === bezetteStreek.tiles && missionarissen === state.stad.missionarissen && !opgelost) {
    return state;
  }

  const streken = state.streken.map((streek) =>
    streek.hoogte === bezetteStreek.hoogte
      ? {
          ...streek,
          tiles,
          bezet: opgelost ? false : streek.bezet,
          ontgrendeld: opgelost ? true : streek.ontgrendeld,
        }
      : streek
  );

  return {
    ...metActieveStad(state, { ...state.stad, missionarissen }),
    streken,
    vijandelijkHeiligdomVeroverdEvent,
  };
}

// Sluit de "vijandelijk Heiligdom veroverd"-melding (Deel 4) — puur een
// UI-bevestiging.
export function sluitVijandelijkHeiligdomVeroverdMelding(state: GameState): GameState {
  return { ...state, vijandelijkHeiligdomVeroverdEvent: undefined };
}

// Sluit de "vijandelijk Heiligdom onthuld"-melding (Deel 3/4), gezet door
// `verwerkVerkenningInGang` zodra een onthuld vakje een vijandelijk Heiligdom
// blijkt te zijn.
export function sluitVijandelijkHeiligdomOnthuldMelding(state: GameState): GameState {
  return { ...state, vijandelijkHeiligdomOnthuldEvent: undefined };
}

// Alle nog verhulde vakjes van de actieve Bezette Streek — gebruikt door de
// canvas om ze als klikbaar te markeren (issue: "Bezette streek scherm": de
// bezette laag zelf is klikbaar, geen losse Verkenning-modus meer nodig).
export function verhuldeBezetteStreekPosities(state: GameState): Settler[] {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return [];
  return bezetteStreek.tiles
    .filter((tile) => tile.verhuld)
    .map((tile) => ({ hoogte: bezetteStreek.hoogte, positieInStreek: tile.positieInStreek }));
}

// Of een klik op dit verhulde vakje een verkenner mag sturen (issue: "Bezette
// streek scherm" — vervangt `kanVerkennen`/de losse Verkenner-rekrutering):
// het vakje moet nog verhuld zijn en niet al een verkenner onderweg hebben,
// de 1x-per-beurt-limiet (zelfde soort limiet als de settler-acties) mag nog
// niet gebruikt zijn, en de speler moet zowel de grondstoffen (dezelfde
// kosten als de vroegere Verkenner-eenheid, `VERKENNER.kosten`) als de
// wetenschap (`VERKENNING_KOSTEN_WETENSCHAP`) kunnen betalen.
export function kanStuurVerkenner(state: GameState, positieInStreek: number): boolean {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return false;
  const tile = bezetteStreek.tiles[positieInStreek];
  if (!tile?.verhuld || tile.verkenningInGang) return false;
  if (state.verkenningGedaanDitBeurt) return false;
  if (state.wetenschap < VERKENNING_KOSTEN_WETENSCHAP) return false;

  return Object.entries(VERKENNER.kosten).every(
    ([resource, aantal]) => (state.voorraad[resource as keyof typeof state.voorraad] ?? 0) >= (aantal ?? 0)
  );
}

// Stuurt een verkenner naar `positieInStreek` (issue: "Bezette streek
// scherm"): betaalt meteen de grondstoffen + wetenschap, en zet een aftellend
// tellertje (`Tile.verkenningInGang`) i.p.v. het vakje meteen te onthullen —
// zie `verwerkVerkenningInGang` hieronder voor het daadwerkelijk onthullen
// zodra het tellertje op 0 staat. Negeert de aanroep stilzwijgend bij een
// ongeldige aanroep — zelfde veilige-aanroep-conventie als
// `startBouw`/`bemanWachttoren`.
export function stuurVerkenner(state: GameState, positieInStreek: number): GameState {
  if (!kanStuurVerkenner(state, positieInStreek)) return state;

  const bezetteStreek = state.streken.find((l) => l.bezet)!;
  const voorraad = { ...state.voorraad };
  for (const [resource, aantal] of Object.entries(VERKENNER.kosten)) {
    voorraad[resource as keyof typeof voorraad] -= aantal ?? 0;
  }

  const streken = state.streken.map((streek) =>
    streek.hoogte !== bezetteStreek.hoogte
      ? streek
      : {
          ...streek,
          tiles: streek.tiles.map((t, index) =>
            index !== positieInStreek ? t : { ...t, verkenningInGang: { beurtenResterend: VERKENNER.bouwtijdBeurten } }
          ),
        }
  );

  return {
    ...state,
    streken,
    voorraad,
    wetenschap: state.wetenschap - VERKENNING_KOSTEN_WETENSCHAP,
    verkenningGedaanDitBeurt: true,
  };
}

// Telt elk lopend verkennings-tellertje van de actieve Bezette Streek één
// beurt af (issue: "Bezette streek scherm") — op 0 wordt het vakje onthuld
// (zelfde inhoud-resolutie als voorheen `verken`). Meerdere vakjes kunnen
// tegelijk onderweg zijn (elk op een andere beurt gestart, zie
// `kanStuurVerkenner`), dus dit loopt over alle tiles, niet slechts één.
export function verwerkVerkenningInGang(state: GameState): GameState {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek || !bezetteStreek.tiles.some((t) => t.verkenningInGang)) return state;

  let vijandelijkHeiligdomOnthuldEvent = state.vijandelijkHeiligdomOnthuldEvent;

  const tiles = bezetteStreek.tiles.map((tile) => {
    if (!tile.verkenningInGang) return tile;

    const beurtenResterend = tile.verkenningInGang.beurtenResterend - 1;
    if (beurtenResterend > 0) return { ...tile, verkenningInGang: { beurtenResterend } };

    if (tile.bezetteStreekInhoud === "heiligdom") vijandelijkHeiligdomOnthuldEvent = true;
    const inhoudImprovement = onthuldImprovementVoorInhoud(tile);
    return {
      ...tile,
      verhuld: false,
      verkenningInGang: undefined,
      improvement: inhoudImprovement,
      status: inhoudImprovement ? ("actief" as const) : tile.status,
    };
  });

  const streken = state.streken.map((streek) => (streek.hoogte === bezetteStreek.hoogte ? { ...streek, tiles } : streek));
  return { ...state, streken, vijandelijkHeiligdomOnthuldEvent };
}

// Missionarissen die nog niet aan een Heiligdom toegewezen zijn — vrij
// inzetbaar (issue: "Bezette streek scherm").
export function beschikbareMissionarissen(state: GameState) {
  return state.stad.missionarissen.filter((m) => !m.doelHeiligdom);
}

// Of een klik op dit onthulde vijandelijke Heiligdom een Missionaris mag
// sturen: het vakje moet een actief vijandelijk Heiligdom zijn, en er moet
// minstens één nog niet toegewezen Missionaris zijn.
export function kanStuurMissionaris(state: GameState, positieInStreek: number): boolean {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return false;
  const tile = bezetteStreek.tiles[positieInStreek];
  if (tile?.status !== "actief" || tile.improvement?.id !== "vijandelijk-heiligdom") return false;
  return beschikbareMissionarissen(state).length > 0;
}

// Wijst een specifieke, nog niet toegewezen Missionaris toe aan het
// vijandelijke Heiligdom op `positieInStreek` (issue: "Bezette streek
// scherm") — zelfde soort omkeerbaar-toewijs-patroon als
// `bemanWachttoren`/`bemanLegerkamp` in militair.ts, alleen hier niet
// omkeerbaar (de toewijzing eindigt vanzelf zodra het Heiligdom veroverd is,
// zie `verwerkBelegering` hierboven — een bewuste vereenvoudiging, geen
// "terugroepen"-actie nodig voor de MVP-scope van dit issue).
export function stuurMissionaris(state: GameState, missionarisId: string, positieInStreek: number): GameState {
  if (!kanStuurMissionaris(state, positieInStreek)) return state;

  const bezetteStreek = state.streken.find((l) => l.bezet)!;
  const missionaris = state.stad.missionarissen.find((m) => m.id === missionarisId);
  if (!missionaris || missionaris.doelHeiligdom) return state;

  const missionarissen = state.stad.missionarissen.map((m) =>
    m.id === missionarisId ? { ...m, doelHeiligdom: { hoogte: bezetteStreek.hoogte, positieInStreek } } : m
  );

  return metActieveStad(state, { ...state.stad, missionarissen });
}
