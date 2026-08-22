// Startstatus van een nieuwe run (M3, hoofdstuk 5) — losstaand van economie.ts
// zodat zowel de orchestrator (`volgendeBeurt`, economie.ts) als
// `verwerkVerval` (uitputtingEnVerval.ts, die bij een volledige ineenstorting
// terugvalt op een verse startstatus) dit kunnen importeren zonder dat de
// twee bestanden op elkaar circulair zouden moeten leunen.

import { standaardUitlegAan } from "./save";
import { GameState, MateriaalType } from "./types";
import { maakInitieleWereld } from "./world";
import { GOING_WEST_STARTSTAD_NAAM, maakInitieleWereldGoingWest } from "./worldGoingWest";

export const OPSLAG_CAP = 30;

// Startgrondstoffen (issue: "jagen en farmen omdraaien" — Houtkap schuift
// naar streek 2, dus op streek 1 is alleen Steengroeve en Heiligdom
// bouwbaar): genoeg hout en steen voor precies die twee (Steengroeve
// `hout: 6`, Heiligdom `hout: 4, steen: 4` — samen hout 10, steen 4), plus
// (issue: "genoeg hout om ook boerderij te bouwen") nog eens de Boerderij
// erbovenop (`hout: 4`, zie improvements.ts) — samen hout 14, steen 4. Zonder
// een Houtkap is er op streek 1 geen lopende hout-productie, dus dit bedrag
// moet in zijn geheel uit de startvoorraad komen. Zo kan de speler, zodra
// streek 2 ontgrendelt, de Boerderij daar meteen neerzetten in plaats van
// eerst op houtproductie te moeten wachten.
//
// Gedeeld met Going West (M20d deelstap 1, hoofdstuk 13/15): dit bedrag is
// afgeleid van de streek-1-tegelmix (1 bos, 1 heuvel/berg, de rest vlak — de
// enige terreinen waar Steengroeve/Heiligdom/Boerderij op mogen, zie
// `terreinEisen` in improvements.ts) en van `minStreek`-gates die niet per
// campagne verschillen. `GOING_WEST_TILE_TERREIN[1]` (worldGoingWest.ts)
// heeft exact dezelfde mix (1 bos, 1 heuvel, rest vlak) als
// `TUTORIAL_TILE_TERREIN[1]` (world.ts) — op streek 1 zijn dus in beide
// campagnes precies dezelfde twee improvements bouwbaar, ongeacht dat Going
// West in totaal 35 in plaats van 14 streken telt. Deze balans hoeft dus
// (nog) niet apart afgestemd te worden; mocht `GOING_WEST_TILE_TERREIN[1]`
// ooit wijzigen, dan moet deze aanname opnieuw gecontroleerd worden.
const STARTVOORRAAD: Record<MateriaalType, number> = {
  hout: 14,
  steen: 4,
  erts: 0,
  goud: 0,
};

// Startvoedsel: overbrugt de openingsbeurten tot de jacht op gang komt (de
// enige voedselbron tot de Boerderij op streek 2, issue: "Tweede streek
// boerderij" — verschoven van streek 3) — de settler moet eerst de Steengroeve
// bouwen (waarna de gegarandeerde startkudde verschijnt, zie
// `verwerkEersteKudde` in indringersEnDieren.ts en STARTKUDDE_POSITIE in
// world.ts), er dan naartoe lopen en bejagen, waarna de
// voedselwaarschuwing-pop-up bijspringt als het toch krap wordt. Verhoogd van
// 14 naar 20 (issue: "Eerste streek gegarandeerd een kudde") — de settler
// staat pas vanaf beurt 2 klaar (hoofdstuk 16) en heeft daarna nog meerdere
// beurten nodig om te lopen vóór de eerste jachtbeurt iets oplevert; 14 liet
// daarvoor nauwelijks marge over voor een extra beurt (bv. eerst een weg
// aanleggen, of pech met een roofdier onderweg).
const VOEDSEL_START = 20;

// `campagneId` (M20d deelstap 1, hoofdstuk 9/13/15): `undefined` (of elke
// onbekende id) geeft de bestaande tutorial-start; `"going-west"` bouwt in
// plaats daarvan de Going West-wereld (`maakInitieleWereldGoingWest()`,
// worldGoingWest.ts) met de bijbehorende startnederzetting-naam. Nog niet
// aangeroepen met `"going-west"` vanuit de UI (`useGameEngine`/GameRoot
// initialiseren nog altijd zonder argument) — dat volgt in een latere M20d-
// deelstap zodra `CampagneSelectScherm` een campagne laat kiezen.
export function maakInitieleSpelStatus(campagneId?: string): GameState {
  const isGoingWest = campagneId === "going-west";
  const stad: GameState["stad"] = {
    naam: isGoingWest ? GOING_WEST_STARTSTAD_NAAM : "Oer-stad",
    grootte: "klein",
    relics: [],
    vervalStatus: "gezond",
    streekHoogte: 0,
    strijders: [],
    missionarissen: [],
    cityImprovements: [],
  };

  return {
    stad,
    steden: [stad],
    streken: isGoingWest ? maakInitieleWereldGoingWest() : maakInitieleWereld(),
    voorraad: { ...STARTVOORRAAD },
    opslagCap: OPSLAG_CAP,
    voedsel: VOEDSEL_START,
    cultuur: 0,
    wetenschap: 0,
    technologieen: [],
    beurt: 1,
    campagneId,
    bouwKeuzeGedaanDitBeurt: false,
    bouwPopupAfgehandeldTellerPerStreek: {},
    settlerActieGedaanDitBeurt: false,
    settlerGratisBewogenDitBeurt: false,
    // Tweede settler (issue: "Altijd 2e settler" #236): begint altijd leeg —
    // pas via `tweedeSettlerInAanbouw` te krijgen zodra streek 7 ontgrendeld
    // is, zie `kanTweedeSettlerBouwen` (groeiEnRekrutering.ts).
    tweedeSettlerActieGedaanDitBeurt: false,
    tweedeSettlerGratisBewogenDitBeurt: false,
    verkenningGedaanDitBeurt: false,
    volgendeBouwBeurt: 1,
    // Geen `kuddeEvent` bij de start meer (issue: "genoeg hout om ook
    // boerderij te bouwen"): de gegarandeerde startkudde zelf, en de
    // bijbehorende melding, verschijnen nu pas zodra `verwerkEersteKudde`
    // (indringersEnDieren.ts) de Steengroeve op streek 1 voltooid ziet.
    // Standaard-instelling (issue: "een setting waarmee je deze uitleg
    // pop-ups aan en uit kunt zetten ... standaard voor alle nieuwe potjes")
    // bepaalt de startwaarde; de per-run toggle in het hoofdmenu wijzigt
    // daarna alleen deze ene run.
    uitlegPopupsAan: standaardUitlegAan(),
    // Zie types.ts: `IndringersStatistieken` — begint leeg bij elke nieuwe run.
    indringersStatistieken: {
      aanvallenTotaal: 0,
      aanvallenAfgeslagen: 0,
      wachttorensGesloopt: 0,
      tribuutGegevenAantal: 0,
      tribuutGegeven: { hout: 0, steen: 0, erts: 0, goud: 0 },
    },
  };
}
