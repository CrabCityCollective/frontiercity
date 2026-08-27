// Resource-productie (M3, hoofdstuk 5): per-beurt opbrengst van alle actieve,
// (voor land-improvements) wegverbonden tiles en city improvements —
// bouwmateriaal/goud tegen de gedeelde opslag-cap, cultuur/wetenschap als
// voortgangs-valuta zonder cap, en voedsel als een echte, per beurt
// verbruikte voorraad (zie `verwerkProductie` hieronder). Losgetrokken uit
// economie.ts zodat de productieformules (boerderij-/steenopbrengst,
// voedselbalans, cultuur-frontier-halvering) op één plek staan, gedeeld door
// zowel `volgendeBeurt` (economie.ts) als de modules die dezelfde
// berekeningen hergebruiken (uitputtingEnVerval.ts: voedseltekort-voorspelling,
// streekOntgrendeling.ts: belegeringsvoortgang).

import {
  boerderijOpbrengstFactor,
  steenOpbrengstFactor,
  voedselVerbruikVermindering,
} from "./techTree";
import { City, GameState, ResourceType, Streek, TechId } from "./types";
import { hoogsteOntgrendeldeStreek } from "./world";
import { isTileVerbondenMetStad } from "./wegen";
import { isMateriaalType } from "./materiaal";
import { telBemandeWachttorens } from "./militair";
import { stadEffectiviteit } from "./stad";
import { onrustOpStreek, onrustProductieMultiplier } from "./onrust";
import { SMEDERIJ, SMEDERIJ_GEREEDSCHAP_OPBRENGST } from "./improvements";

// Onrust-productiepenalty (issue: "Onrust, Saloon en Courthouse") is
// Going West-exclusief (zie onrust.ts) — buiten die campagne (dus ook in de
// tutorial) altijd multiplier 1, zodat bestaande content ongewijzigd blijft.
function onrustMultiplierVoorStreek(state: GameState, streek: Streek): number {
  if (state.campagneId !== "going-west") return 1;
  return onrustProductieMultiplier(onrustOpStreek(state.streken, state.stad.rechters, streek));
}

// Voedseltekort-tuning (M6, hoofdstuk 4/14; issue: "stad instort of verlaten
// alleen als er te weinig voedsel is"): bewuste MVP-placeholders, net als de
// overige nog niet vastgelegde balansgetallen. Een grotere stad verbruikt
// meer voedsel per beurt (hoofdstuk 10, streek 10-flavor: "meer monden, minder
// plek om ze allemaal te voeden"). De waarschuwing verschijnt zodra de
// voorraad — bij het huidige productie/verbruikstempo — naar verwachting
// binnen `VOEDSEL_WAARSCHUWING_BEURTEN` beurten op zou raken.
const VOEDSEL_VERBRUIK: Record<City["grootte"], number> = {
  klein: 2,
  middel: 4,
  groot: 6,
};

// Bemannings-voedselverbruik (hoofdstuk 6/11/14, issue: "wachttorens,
// bemanning en bevoorrading"): elke bemande Wachttoren kost 1 voedsel/beurt
// bovenop het stadsverbruik hierboven — een wachtpost moet ook gevoed worden,
// niet alleen bevoorraad met bouwmateriaal. Doorgerekend tegen de
// boerderij-opbrengst (4 voedsel/beurt, zie ECONOMISCH_LAND_IMPROVEMENTS):
// zelfs een kleine stad met maar 1 actieve boerderij houdt na het eigen
// verbruik (2) nog 2 voedsel/beurt over, genoeg voor 2 bemande wachttorens
// zonder in de min te komen; een speler die gaandeweg de tutorial (12 streken)
// een paar boerderijen bijbouwt, houdt ruim voldoende marge over voor alle
// wachttorens die realistisch nodig zijn (hoofdstuk 11 heeft de volledige
// onderbouwing, hoofdstuk 14 de cijfers) — vandaar geen aanpassing elders in
// de voedseleconomie nodig.
export const WACHTTOREN_VOEDSEL_VERBRUIK = 1;

// Boerderij-opbrengst (hoofdstuk 3/9, "A. Vuur temmen": +20%, techTree.ts) —
// `Math.ceil` in plaats van `Math.round` zodat de bonus bij de kleine
// MVP-basiswaarden (4 voedsel/beurt) altijd zichtbaar is, ook al rondt een
// exacte 20%-verhoging soms af naar beneden.
function boerderijOpbrengst(waarde: number, technologieen: TechId[]): number {
  return Math.ceil(waarde * boerderijOpbrengstFactor(technologieen));
}

// Totale voedselproductie van dit beurt: alle actieve, (voor land-improvements)
// wegverbonden tiles met een voedsel-productie-effect (hoofdstuk 16: een
// Boerderij zonder wegverbinding levert nog niets op). Los van
// `verwerkProductie` hieronder zodat `verwerkVerval` dezelfde berekening kan
// hergebruiken om het voedseltekort een paar beurten vooruit te voorspellen.
function berekenVoedselProductie(state: GameState): number {
  let productie = 0;

  for (const streek of state.streken) {
    const onrustMultiplier = onrustMultiplierVoorStreek(state, streek);
    for (const tile of streek.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || effect.resource !== "voedsel" || !effect.waarde) {
        continue;
      }
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.streken, streek.hoogte, tile.positieInStreek)) {
        continue;
      }
      const opbrengst =
        tile.improvement?.id === "boerderij" ? boerderijOpbrengst(effect.waarde, state.technologieen) : effect.waarde;
      productie += opbrengst * onrustMultiplier;
    }
  }

  return productie;
}

// Netto voedselverbruik per beurt (issue: "stad instort of verlaten alleen
// als er te weinig voedsel is"): een grotere stad heeft meer monden te voeden
// (hoofdstuk 10, streek 10-flavor), plus 1 voedsel per bemande Wachttoren
// (hoofdstuk 6/11/14, `WACHTTOREN_VOEDSEL_VERBRUIK` hierboven). Nog geen
// aparte multiplier per campagne nodig in de MVP (hoofdstuk 13).
// "A2b. Voorraadschuur" (techTree.ts): verlaagt alleen het stadsverbruik
// zelf, niet de bemannings-kosten van Wachttorens hieronder — nooit onder de
// 1 (een stad van 0 monden bestaat niet).
function voedselVerbruik(state: GameState): number {
  const stadVerbruik = Math.max(
    1,
    VOEDSEL_VERBRUIK[state.stad.grootte] - voedselVerbruikVermindering(state.technologieen)
  );
  return stadVerbruik + telBemandeWachttorens(state) * WACHTTOREN_VOEDSEL_VERBRUIK;
}

// Netto voedselverandering deze beurt: productie min verbruik. Negatief
// betekent dat de voorraad slinkt — gebruikt door zowel `verwerkProductie`
// (om de voorraad bij te werken) als `verwerkVerval` (om te voorspellen
// wanneer de voorraad op raakt).
export function berekenVoedselNetto(state: GameState): number {
  return berekenVoedselProductie(state) - voedselVerbruik(state);
}

// Steen-opbrengst (hoofdstuk 3/9, "A1b. Kalkoven": +20%, techTree.ts) —
// zelfde `Math.ceil`-redenering als `boerderijOpbrengst` hierboven.
function steenOpbrengst(waarde: number, technologieen: TechId[]): number {
  return Math.ceil(waarde * steenOpbrengstFactor(technologieen));
}

// Past productie toe van elke actieve land-improvement met een "productie"-effect.
// Bouwmaterialen lopen tegen de gedeelde opslag-cap aan; voedsel niet (hoofdstuk 5),
// maar wordt wel per beurt verbruikt (zie `voedselVerbruik` hierboven) — de
// voorraad kan dus, anders dan bouwmateriaal, ook weer afnemen. Nooit onder
// nul: zodra de voorraad nul bereikt, ziet `verwerkVerval` dat als een
// voedseltekort.
//
// Heiligdom & de frontier (hoofdstuk 6): cultuurproductie telt voluit mee op
// de frontier-streek (de hoogst ontgrendelde streek) zelf, en voor de helft op
// elke streek daaronder — uitbeelding van een Heiligdom dat vooral nabije,
// nog niet "eigen" stammen omtovert, een effect dat afneemt naarmate de streek
// verder van het actieve grensgebied ligt. De Sterrencirkel (hoofdstuk 3/9,
// issue: "tech tree toevoegen" Deel 1) volgt voor wetenschap exact hetzelfde
// patroon — "zelfde patroon als Heiligdom voor cultuur", inclusief deze
// frontier-halvering.
// Totale cultuurproductie van dit beurt: alle actieve, (voor land-
// improvements) wegverbonden tiles met een cultuur-productie-effect, met
// dezelfde frontier-halvering als hieronder in `verwerkProductie`. Los van
// `verwerkProductie` zodat `verwerkBelegering` (hoofdstuk 6, issue: "De
// Bezette Streek, missionaris en verkenner", Deel 4) dezelfde berekening kan
// hergebruiken om te bepalen hoeveel cultuur-inkomen er deze beurt naar de
// belegeringsmeter omgeleid wordt zodra een Bezette Streek actief is — zelfde
// patroon als `berekenVoedselProductie` hierboven.
export function berekenCultuurProductieDitBeurt(state: GameState): number {
  let productie = 0;
  const frontierHoogte = hoogsteOntgrendeldeStreek(state.streken);

  for (const streek of state.streken) {
    const onrustMultiplier = onrustMultiplierVoorStreek(state, streek);
    for (const tile of streek.tiles) {
      const effect = tile.improvement?.effect;
      if (
        tile.status !== "actief" ||
        effect?.type !== "productie" ||
        effect.resource !== "cultuur" ||
        !effect.waarde
      ) {
        continue;
      }
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.streken, streek.hoogte, tile.positieInStreek)) {
        continue;
      }
      const basis = streek.hoogte === frontierHoogte ? effect.waarde : effect.waarde / 2;
      productie += basis * onrustMultiplier;
    }
  }

  // Tempel/Grote Tempel (hoofdstuk 3/4/11/14, issue: "city improvements" Deel
  // 3): een city improvement staat niet op een specifieke streek, dus geen
  // frontier-halvering — altijd de volle opbrengst, net als Opslagplaats
  // geen wegverbinding nodig heeft. Wél onderhevig aan het afstandsverval
  // hieronder (hoofdstuk 9/11/14, Deel 1).
  productie += cityImprovementProductie(state, "cultuur");

  return productie;
}

// Opgetelde productie van alle gebouwde city improvements van de actieve
// stad (hoofdstuk 3/4/11/14, issue: "city improvements" Deel 3) voor één
// specifieke resource — Bibliotheek (wetenschap), Markt (goud), Tempel/Grote
// Tempel (cultuur) — vermenigvuldigd met het afstandsverval-percentage van
// die stad (hoofdstuk 9/11/14, issue: "Eerste bouwsteen van de Amerikaanse
// frontier-campagne" Deel 1, `stadEffectiviteit` in stad.ts). Gebruikt door
// `berekenCultuurProductieDitBeurt` hierboven; `verwerkProductie` hieronder
// herhaalt dezelfde effectiviteit voor de overige resource-types.
function cityImprovementProductie(state: GameState, resource: ResourceType): number {
  let productie = 0;
  for (const improvement of state.stad.cityImprovements) {
    const effect = improvement.effect;
    if (effect.type === "productie" && effect.resource === resource && effect.waarde) {
      productie += effect.waarde;
    }
  }
  return productie * stadEffectiviteit(state, state.stad);
}

export function verwerkProductie(state: GameState): GameState {
  const voorraad = { ...state.voorraad };
  let voedsel = state.voedsel;
  let cultuur = state.cultuur;
  let wetenschap = state.wetenschap;
  const frontierHoogte = hoogsteOntgrendeldeStreek(state.streken);
  // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 2): zolang er een actieve Bezette Streek is, bevriest de
  // cumulatieve cultuurteller volledig — nieuwe cultuurproductie wordt hier
  // dus bewust overgeslagen (niet toegevoegd aan `cultuur`). `verwerkBelegering`
  // hieronder in de `volgendeBeurt`-pijplijn bepaalt zelf, via
  // `berekenCultuurProductieDitBeurt`, of diezelfde productie (met Missionaris)
  // alsnog naar de belegeringsmeter omgeleid wordt, of (zonder Missionaris)
  // gewoon verloren gaat — "bevroren, maar niet verloren" geldt alleen voor
  // de reeds opgebouwde `cultuur`-waarde zelf, niet voor nieuwe productie.
  const bezetteStreek = state.streken.find((l) => l.bezet);

  for (const streek of state.streken) {
    // Onrust-productiepenalty (issue: "Onrust, Saloon en Courthouse", Going
    // West-exclusief, zie onrust.ts): eenmaal per streek berekend, geldt voor
    // alle land-improvement-productie op die streek hieronder.
    const onrustMultiplier = onrustMultiplierVoorStreek(state, streek);
    for (const tile of streek.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || !effect.resource || !effect.waarde) {
        continue;
      }

      // Wegverbinding (M10, hoofdstuk 16): een land improvement produceert
      // pas zodra zijn vakje via een wegennetwerk met de stad verbonden is —
      // de stad zelf heeft geen `soort: "land"`-improvement, dus die blijft
      // hierdoor ongemoeid.
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.streken, streek.hoogte, tile.positieInStreek)) {
        continue;
      }

      if (effect.resource === "cultuur") {
        if (!bezetteStreek) {
          cultuur += (streek.hoogte === frontierHoogte ? effect.waarde : effect.waarde / 2) * onrustMultiplier;
        }
      } else if (effect.resource === "wetenschap") {
        wetenschap += (streek.hoogte === frontierHoogte ? effect.waarde : effect.waarde / 2) * onrustMultiplier;
      } else if (isMateriaalType(effect.resource)) {
        const opbrengst =
          effect.resource === "steen" && tile.improvement?.id === "steengroeve"
            ? steenOpbrengst(effect.waarde, state.technologieen)
            : effect.waarde;
        voorraad[effect.resource] = Math.min(
          state.opslagCap,
          voorraad[effect.resource] + Math.floor(opbrengst * onrustMultiplier)
        );
      }
      // Voedsel-productie wordt hieronder in één keer verrekend met het
      // verbruik (niet per tile), zie `berekenVoedselProductie`.
    }
  }

  // City improvements (hoofdstuk 3/4/11/14, issue: "city improvements" Deel
  // 3): Bibliotheek/Markt/Tempel/Grote Tempel produceren, net als
  // Opslagplaats, zonder wegverbinding en zonder frontier-halvering — een
  // city improvement staat niet op een land-vakje. De Bezette-Streek-
  // cultuurbevriezing hierboven geldt onverkort ook voor Tempel/Grote Tempel.
  // `effectiviteit` is het afstandsverval van de actieve stad (hoofdstuk
  // 9/11/14, Deel 1, `stadEffectiviteit` in stad.ts) — 100% zolang deze run
  // nog nooit meer dan 1 stad heeft gehad (dus altijd tijdens de tutorial).
  // `Math.floor` op bouwmateriaal/goud houdt de voorraad geheeltallig, net
  // als overal elders in deze module; cultuur/wetenschap blijven fractioneel
  // toegestaan, net als de frontier-halvering hierboven.
  const effectiviteit = stadEffectiviteit(state, state.stad);
  for (const improvement of state.stad.cityImprovements) {
    const effect = improvement.effect;
    if (effect.type !== "productie" || !effect.resource || !effect.waarde) continue;

    if (effect.resource === "cultuur") {
      if (!bezetteStreek) cultuur += effect.waarde * effectiviteit;
    } else if (effect.resource === "wetenschap") {
      wetenschap += effect.waarde * effectiviteit;
    } else if (isMateriaalType(effect.resource)) {
      voorraad[effect.resource] = Math.min(
        state.opslagCap,
        voorraad[effect.resource] + Math.floor(effect.waarde * effectiviteit)
      );
    }
  }

  // `Math.floor` houdt voedsel geheeltallig, net als de materiaal-voorraad
  // hierboven (issue: "Voedsel hele getallen") — zonder deze afronding kon de
  // onrust-productiemultiplier (onrust.ts, fractioneel tussen 0.4 en 1) een
  // niet-geheel getal in `state.voedsel` laten belanden.
  voedsel = Math.max(0, Math.floor(voedsel + berekenVoedselNetto(state)));

  // Smederij (Going West, M21d, opdracht-wampanoag-opening.md §3): 2 erts → 1
  // gereedschap per beurt, zolang er genoeg erts voorradig is — anders geen
  // conversie die beurt en nooit een negatieve voorraad (opdracht §3, "zelfde
  // regel als tribuut-afhandeling"). Los van de gewone "productie"-lus
  // hierboven (een ander effect-type), en bewust zonder het afstandsverval/
  // `stadEffectiviteit` van de overige city improvements: de conversie trekt
  // rechtstreeks uit de lokale erts-voorraad van de actieve stad, geen
  // productie op een land-vakje. `smederijActief` (issue: "Smederij inactief
  // zetten") legt de conversie stil zonder het gebouw zelf kwijt te raken —
  // zolang de speler 'm pauzeert, blijft de erts-voorraad ongemoeid.
  let gereedschap = state.gereedschap;
  // "Ontvangen"-vlag voor de ResourceHud (issue: "Alle voorraden tonen in
  // resource block") — pas op `true` gezet zodra hier daadwerkelijk
  // gereedschap bij komt, blijft daarna permanent staan (types.ts).
  let gereedschapOntvangen = state.gereedschapOntvangen;
  const ertsKosten = SMEDERIJ.effect.waarde ?? 0;
  if (state.stad.heeftSmederij && state.stad.smederijActief && voorraad.erts >= ertsKosten) {
    voorraad.erts -= ertsKosten;
    gereedschap += SMEDERIJ_GEREEDSCHAP_OPBRENGST;
    gereedschapOntvangen = true;
  }

  return { ...state, voorraad, voedsel, cultuur, wetenschap, gereedschap, gereedschapOntvangen };
}

// Of er al een actieve, wegverbonden boerderij meeproduceert (issue: "uitleg
// pop-ups dynamisch tonen" — trigger voor BoerderijKlaarUitlegPopup): gebruikt
// dezelfde wegverbindingsregel als `verwerkProductie` hierboven, zodat de
// pop-up pas verschijnt zodra de boerderij daadwerkelijk voedsel oplevert.
export function heeftWerkendeBoerderij(state: GameState): boolean {
  return state.streken.some((streek) =>
    streek.tiles.some(
      (tile) =>
        tile.status === "actief" &&
        tile.improvement?.id === "boerderij" &&
        isTileVerbondenMetStad(state.streken, streek.hoogte, tile.positieInStreek)
    )
  );
}

// Of er al een voltooide mijn staat (issue: "pop-ups wijzigen" — trigger voor
// STRIJDERS_OPLEIDEN_TEKST in tutorialContent.ts). Anders dan
// `heeftWerkendeBoerderij` hierboven telt hier niet mee of de mijn al
// wegverbonden is: het gaat om het moment van bouwen zelf, niet om erts dat
// al daadwerkelijk de stad bereikt.
export function heeftGebouwdeMijn(state: GameState): boolean {
  return state.streken.some((streek) =>
    streek.tiles.some((tile) => tile.status === "actief" && tile.improvement?.id === "mijn")
  );
}

// Of de Steengroeve al geplaatst is (issue: "Teksten aanpassen (nog meer)" —
// trigger voor BEURTENSYSTEEM_UITLEG_TEKST in tutorialContent.ts). Telt, anders
// dan `heeftGebouwdeMijn` hierboven, ook een tile die nog "in_aanbouw" is mee:
// het gaat om het moment van plaatsen zelf (de klik op het vakje), niet om een
// voltooide bouw.
export function heeftGeplaatsteSteengroeve(state: GameState): boolean {
  return state.streken.some((streek) => streek.tiles.some((tile) => tile.improvement?.id === "steengroeve"));
}
