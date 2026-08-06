// Resource-productie (M3, hoofdstuk 5): per-beurt opbrengst van alle actieve,
// (voor land-improvements) wegverbonden tiles en city improvements —
// bouwmateriaal/goud tegen de gedeelde opslag-cap, cultuur/wetenschap als
// voortgangs-valuta zonder cap, en voedsel als een echte, per beurt
// verbruikte voorraad (zie `verwerkProductie` hieronder). Losgetrokken uit
// economie.ts zodat de productieformules (boerderij-/steenopbrengst,
// voedselbalans, cultuur-frontier-halvering) op één plek staan, gedeeld door
// zowel `volgendeBeurt` (economie.ts) als de modules die dezelfde
// berekeningen hergebruiken (uitputtingEnVerval.ts: voedseltekort-voorspelling,
// laagOntgrendeling.ts: belegeringsvoortgang).

import {
  boerderijOpbrengstFactor,
  steenOpbrengstFactor,
  voedselVerbruikVermindering,
} from "./techTree";
import { City, GameState, Improvement, ResourceType, TechId } from "./types";
import { hoogsteOntgrendeldeLaag } from "./world";
import { isTileVerbondenMetStad } from "./wegen";
import { isMateriaalType } from "./materiaal";
import { telBemandeWachttorens } from "./militair";

// Voedseltekort-tuning (M6, hoofdstuk 4/14; issue: "stad instort of verlaten
// alleen als er te weinig voedsel is"): bewuste MVP-placeholders, net als de
// overige nog niet vastgelegde balansgetallen. Een grotere stad verbruikt
// meer voedsel per beurt (hoofdstuk 10, laag 10-flavor: "meer monden, minder
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
// zonder in de min te komen; een speler die gaandeweg de tutorial (12 lagen)
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

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || effect.resource !== "voedsel" || !effect.waarde) {
        continue;
      }
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)) {
        continue;
      }
      productie +=
        tile.improvement?.id === "boerderij" ? boerderijOpbrengst(effect.waarde, state.technologieen) : effect.waarde;
    }
  }

  return productie;
}

// Netto voedselverbruik per beurt (issue: "stad instort of verlaten alleen
// als er te weinig voedsel is"): een grotere stad heeft meer monden te voeden
// (hoofdstuk 10, laag 10-flavor), plus 1 voedsel per bemande Wachttoren
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
// de frontier-laag (de hoogst ontgrendelde laag) zelf, en voor de helft op
// elke laag daaronder — uitbeelding van een Heiligdom dat vooral nabije,
// nog niet "eigen" stammen omtovert, een effect dat afneemt naarmate de laag
// verder van het actieve grensgebied ligt. De Sterrencirkel (hoofdstuk 3/9,
// issue: "tech tree toevoegen" Deel 1) volgt voor wetenschap exact hetzelfde
// patroon — "zelfde patroon als Heiligdom voor cultuur", inclusief deze
// frontier-halvering.
// Totale cultuurproductie van dit beurt: alle actieve, (voor land-
// improvements) wegverbonden tiles met een cultuur-productie-effect, met
// dezelfde frontier-halvering als hieronder in `verwerkProductie`. Los van
// `verwerkProductie` zodat `verwerkBelegering` (hoofdstuk 6, issue: "De
// Bezette Laag, missionaris en verkenner", Deel 4) dezelfde berekening kan
// hergebruiken om te bepalen hoeveel cultuur-inkomen er deze beurt naar de
// belegeringsmeter omgeleid wordt zodra een Bezette Laag actief is — zelfde
// patroon als `berekenVoedselProductie` hierboven.
export function berekenCultuurProductieDitBeurt(state: GameState): number {
  let productie = 0;
  const frontierHoogte = hoogsteOntgrendeldeLaag(state.lagen);

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (
        tile.status !== "actief" ||
        effect?.type !== "productie" ||
        effect.resource !== "cultuur" ||
        !effect.waarde
      ) {
        continue;
      }
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)) {
        continue;
      }
      productie += laag.hoogte === frontierHoogte ? effect.waarde : effect.waarde / 2;
    }
  }

  // Tempel/Grote Tempel (hoofdstuk 3/4/11/14, issue: "city improvements" Deel
  // 3): een city improvement staat niet op een specifieke laag, dus geen
  // frontier-halvering — altijd de volle opbrengst, net als Opslagplaats
  // geen wegverbinding nodig heeft.
  productie += cityImprovementProductie(state.stad.cityImprovements, "cultuur");

  return productie;
}

// Opgetelde productie van alle gebouwde city improvements (hoofdstuk 3/4/11/
// 14, issue: "city improvements" Deel 3) voor één specifieke resource —
// Bibliotheek (wetenschap), Markt (goud), Tempel/Grote Tempel (cultuur).
// Gedeeld tussen `berekenCultuurProductieDitBeurt`/`verwerkProductie`
// hieronder, net als `berekenVoedselProductie` voor land-tiles.
function cityImprovementProductie(cityImprovements: Improvement[], resource: ResourceType): number {
  let productie = 0;
  for (const improvement of cityImprovements) {
    const effect = improvement.effect;
    if (effect.type === "productie" && effect.resource === resource && effect.waarde) {
      productie += effect.waarde;
    }
  }
  return productie;
}

export function verwerkProductie(state: GameState): GameState {
  const voorraad = { ...state.voorraad };
  let voedsel = state.voedsel;
  let cultuur = state.cultuur;
  let wetenschap = state.wetenschap;
  const frontierHoogte = hoogsteOntgrendeldeLaag(state.lagen);
  // Bezette Laag (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
  // verkenner", Deel 2): zolang er een actieve Bezette Laag is, bevriest de
  // cumulatieve cultuurteller volledig — nieuwe cultuurproductie wordt hier
  // dus bewust overgeslagen (niet toegevoegd aan `cultuur`). `verwerkBelegering`
  // hieronder in de `volgendeBeurt`-pijplijn bepaalt zelf, via
  // `berekenCultuurProductieDitBeurt`, of diezelfde productie (met Missionaris)
  // alsnog naar de belegeringsmeter omgeleid wordt, of (zonder Missionaris)
  // gewoon verloren gaat — "bevroren, maar niet verloren" geldt alleen voor
  // de reeds opgebouwde `cultuur`-waarde zelf, niet voor nieuwe productie.
  const bezetteLaag = state.lagen.find((l) => l.bezet);

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || !effect.resource || !effect.waarde) {
        continue;
      }

      // Wegverbinding (M10, hoofdstuk 16): een land improvement produceert
      // pas zodra zijn vakje via een wegennetwerk met de stad verbonden is —
      // de stad zelf heeft geen `soort: "land"`-improvement, dus die blijft
      // hierdoor ongemoeid.
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)) {
        continue;
      }

      if (effect.resource === "cultuur") {
        if (!bezetteLaag) {
          cultuur += laag.hoogte === frontierHoogte ? effect.waarde : effect.waarde / 2;
        }
      } else if (effect.resource === "wetenschap") {
        wetenschap += laag.hoogte === frontierHoogte ? effect.waarde : effect.waarde / 2;
      } else if (isMateriaalType(effect.resource)) {
        const opbrengst =
          effect.resource === "steen" && tile.improvement?.id === "steengroeve"
            ? steenOpbrengst(effect.waarde, state.technologieen)
            : effect.waarde;
        voorraad[effect.resource] = Math.min(state.opslagCap, voorraad[effect.resource] + opbrengst);
      }
      // Voedsel-productie wordt hieronder in één keer verrekend met het
      // verbruik (niet per tile), zie `berekenVoedselProductie`.
    }
  }

  // City improvements (hoofdstuk 3/4/11/14, issue: "city improvements" Deel
  // 3): Bibliotheek/Markt/Tempel/Grote Tempel produceren, net als
  // Opslagplaats, zonder wegverbinding en zonder frontier-halvering — een
  // city improvement staat niet op een land-vakje. De Bezette-Laag-
  // cultuurbevriezing hierboven geldt onverkort ook voor Tempel/Grote Tempel.
  for (const improvement of state.stad.cityImprovements) {
    const effect = improvement.effect;
    if (effect.type !== "productie" || !effect.resource || !effect.waarde) continue;

    if (effect.resource === "cultuur") {
      if (!bezetteLaag) cultuur += effect.waarde;
    } else if (effect.resource === "wetenschap") {
      wetenschap += effect.waarde;
    } else if (isMateriaalType(effect.resource)) {
      voorraad[effect.resource] = Math.min(state.opslagCap, voorraad[effect.resource] + effect.waarde);
    }
  }

  voedsel = Math.max(0, voedsel + berekenVoedselNetto(state));

  return { ...state, voorraad, voedsel, cultuur, wetenschap };
}

// Of er al een actieve, wegverbonden boerderij meeproduceert (issue: "uitleg
// pop-ups dynamisch tonen" — trigger voor BoerderijKlaarUitlegPopup): gebruikt
// dezelfde wegverbindingsregel als `verwerkProductie` hierboven, zodat de
// pop-up pas verschijnt zodra de boerderij daadwerkelijk voedsel oplevert.
export function heeftWerkendeBoerderij(state: GameState): boolean {
  return state.lagen.some((laag) =>
    laag.tiles.some(
      (tile) =>
        tile.status === "actief" &&
        tile.improvement?.id === "boerderij" &&
        isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)
    )
  );
}

// Of er al een voltooide mijn staat (issue: "pop-ups wijzigen" — trigger voor
// STRIJDERS_OPLEIDEN_TEKST in tutorialContent.ts). Anders dan
// `heeftWerkendeBoerderij` hierboven telt hier niet mee of de mijn al
// wegverbonden is: het gaat om het moment van bouwen zelf, niet om erts dat
// al daadwerkelijk de stad bereikt.
export function heeftGebouwdeMijn(state: GameState): boolean {
  return state.lagen.some((laag) =>
    laag.tiles.some((tile) => tile.status === "actief" && tile.improvement?.id === "mijn")
  );
}
