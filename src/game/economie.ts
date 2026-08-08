// Resource-economie (M3): gedeelde opslag met cap voor hout/steen/erts/goud,
// een losse voedselvoorraad, en een productiewachtrij die per beurt
// bouwmateriaal verbruikt tot een improvement voltooid is. Zie
// frontier-city-design-doc.md hoofdstuk 5.
//
// Dit bestand is de per-beurt orchestrator (`volgendeBeurt` hieronder) plus
// de per-run uitleg-pop-ups-instelling (`zetUitlegPopups`). De eigenlijke
// spelmechaniek per domein staat in losse modules, elk met hun eigen
// milestone-/hoofdstuk-context in de eigen bestandskop:
//
// - initieleSpelStatus.ts — opslag-cap & de startstatus van een nieuwe run
//   (M3, hoofdstuk 5), hier doorgegeven (zie `export ... from` hieronder)
// - materiaal.ts — de grondstof-typegids (`isMateriaalType`, hoofdstuk 5)
// - productie.ts — resource-productie (M3, hoofdstuk 5)
// - uitputtingEnVerval.ts — land-uitputting & ghost towns (M4), voedselverval
//   en stad-ineenstorting (M6, hoofdstuk 4)
// - streekOntgrendeling.ts — cultuur-gedreven streek-ontgrendeling (M5,
//   hoofdstuk 2/5) en de Bezette Streek/Verkenning/belegering (hoofdstuk 6)
// - tech.ts — de technologie-boom (hoofdstuk 3/9/11)
// - bouwwachtrij.ts — bouwkosten-investering & goud-rush (M3/M10)
// - groeiEnRekrutering.ts — groei-tiers, settler/opslagplaats/
//   stadsverbetering/rekruterings-wachtrijen (M6/M7, hoofdstuk 11)
// - militair.ts — legerwaarde, Wachttoren-/Legerkamp-bemanning, confrontatie
//   tegen een Bezette Streek (M7, hoofdstuk 6)
// - indringersEnDieren.ts — indringers & tribuut, kuddes, roofdieren
//   (hoofdstuk 6/14/16/17)
// - infrastructuurEnBouw.ts — infrastructuur-eisen en land-tile-plaatsing
//   (hoofdstuk 4/6/11/14, M10 bouw-ritme)
// - acties.ts — losse settler-acties: bewegen, weg aanleggen, jagen, hout
//   hakken, stad stichten (hoofdstuk 16/17, 2/10)
//
// Exacte getallen (opslag-cap, kosten, productiesnelheden, uitputtingssnelheid,
// winkans-formule) zijn nog niet vastgelegd in het design-document
// (hoofdstuk 14) — de waarden in deze modules zijn bewuste MVP-placeholders,
// geen definitieve balans.

import { GameState } from "./types";
import { STAD_POSITIE } from "./world";
import { verwerkUitputting, verwerkVerval } from "./uitputtingEnVerval";
import { verwerkBouwwachtrij } from "./bouwwachtrij";
import { verwerkProductie } from "./productie";
import { verwerkBelegering, verwerkStreekOntgrendeling } from "./streekOntgrendeling";
import { verwerkTechDrempel } from "./tech";
import {
  verwerkCityVerbetering,
  verwerkCivielInAanbouw,
  verwerkMissionarisRecrutering,
  verwerkOpslagplaats,
  verwerkRecrutering,
  verwerkVerkennerRecrutering,
} from "./groeiEnRekrutering";
import { verwerkIndringers, verwerkKuddes, verwerkRoofdieren } from "./indringersEnDieren";

// Opslag-cap, startstatus en de city-improvement-cap staan inhoudelijk in
// eigen modules (initieleSpelStatus.ts resp. improvements.ts) in plaats van
// hier, en worden hieronder alleen doorgegeven zodat bestaande imports van
// `./economie` (useGameEngine.ts, economie.test.ts) blijven werken — beide
// worden ook door een submodule geïmporteerd die zelf weer door déze
// orchestrator wordt aangeroepen; zonder deze knip zou dat een circulaire
// afhankelijkheid met economie.ts vormen.
export { OPSLAG_CAP, maakInitieleSpelStatus } from "./initieleSpelStatus";
export { CITY_IMPROVEMENT_CAP, cityImprovementCap } from "./improvements";

// Zet de per-run uitleg-pop-ups-instelling (issue: "een setting waarmee je
// deze uitleg pop-ups aan en uit kunt zetten ... voor deze run specifiek"),
// via een nieuwe optie in het hoofdmenu. Wijzigt uitsluitend deze lopende
// run — de globale standaard-instelling (save.ts: `standaardUitlegAan`)
// blijft ongemoeid.
export function zetUitlegPopups(state: GameState, aan: boolean): GameState {
  return { ...state, uitlegPopupsAan: aan };
}

// Verwerkt één spelbeurt: eerst uitputting van de actieve tiles (M4), dan
// verbruik/voortgang van de land-tile-bouwwachtrij — een tile die deze beurt
// klaar is, wordt hier al "actief" en begint pas volgende beurt met
// aftellen (vandaar vóór de productiestap hieronder) — dan productie van
// alle (incl. deze beurt net voltooide) actieve improvements (incl.
// voedselverbruik en cultuur), dan streek-ontgrendeling op basis van die
// cultuur (M5), dan de technologie-boom op basis van diezelfde-beurt
// wetenschap (hoofdstuk 3/9, `verwerkTechDrempel` — opent hoogstens één
// keuze-pop-up per aanroep, ontgrendelt niet automatisch zoals cultuur), dan
// pas verval op basis van een dreigend voedseltekort (M6)
// (issue: "eerst de grondstoffen binnenkomen, en daarna wordt gecheckt of je
// afgaat" — een tile/weg die deze beurt klaarkomt telt zo al mee vóór de
// instort-check), dan de civiele stadsbouwwachtrij (M6/hoofdstuk 16: groei óf
// een nieuwe settler), de Opslagplaats-wachtrij (hoofdstuk 14), de
// stadsverbeteringen-wachtrij (Bibliotheek/Markt/Barakken/Tempel/Grote
// Tempel, hoofdstuk 3/4/11/14) en de Soldaat-rekruteringswachtrij (M7), dan
// de indringers-kans (hoofdstuk 6) en
// de kuddes-kans (hoofdstuk 16/17), dan de beurtteller ophogen. Zet ook de
// bouwkeuze-vlag (hoofdstuk 11) weer terug, zodat de bouw-pop-up bij het
// begin van de nieuwe beurt weer verschijnt.
//
// Stort de stad deze beurt volledig in, dan geeft `verwerkVerval` al een
// verse, gereset spelstatus terug (issue: "run eindigen wanneer stad
// uitgeput is") — de resterende stappen (groei/rekrutering, indringers,
// kuddes, beurtteller) slaan we dan over, anders zou de net herstarte
// tutorial meteen op beurt 2 beginnen.
export function volgendeBeurt(state: GameState): GameState {
  const naUitputting = verwerkUitputting(state);
  const naBouw = verwerkBouwwachtrij(naUitputting);
  const naProductie = verwerkProductie(naBouw);
  const naOntgrendeling = verwerkStreekOntgrendeling(naProductie);
  // Belegering (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 4): direct na de streek-ontgrendeling, op dezelfde
  // cultuurproductie van deze beurt — zie `verwerkBelegering` hierboven.
  const naBelegering = verwerkBelegering(naOntgrendeling);
  const naTechDrempel = verwerkTechDrempel(naBelegering);
  const naVerval = verwerkVerval(naTechDrempel);
  if (naVerval.laatsteIneenstorting) return naVerval;

  const naCiviel = verwerkCivielInAanbouw(naVerval);
  const naOpslagplaats = verwerkOpslagplaats(naCiviel);
  // Stadsverbeteringen (hoofdstuk 3/4/11/14, issue: "city improvements" Deel
  // 1/3): eigen wachtrij, los van civiel/opslagplaats hierboven.
  const naCityVerbetering = verwerkCityVerbetering(naOpslagplaats);
  const naRecrutering = verwerkRecrutering(naCityVerbetering);
  const naVerkennerRecrutering = verwerkVerkennerRecrutering(naRecrutering);
  const naMissionarisRecrutering = verwerkMissionarisRecrutering(naVerkennerRecrutering);
  const naIndringers = verwerkIndringers(naMissionarisRecrutering);
  const naKuddes = verwerkKuddes(naIndringers);
  const naRoofdieren = verwerkRoofdieren(naKuddes);
  const nieuweBeurt = naRoofdieren.beurt + 1;

  // De settler verschijnt bij de stad zodra beurt 2 begint (hoofdstuk 16) —
  // en blijft daarna gewoon staan waar de speler 'm laatst neerzette. Niet
  // opnieuw laten verschijnen ná het stichten van een stad (hoofdstuk
  // 9/10/16, issue: "stad stichten op de frontier" deel 4): `stichtStad`
  // zet `settler` bewust op `undefined` ("de huifkar wordt de stad") — zonder
  // deze uitzondering zou deze val-terug-regel daar per ongeluk elke beurt
  // weer een gratis nieuwe settler van maken. Dezelfde uitzondering geldt
  // sinds hoofdstuk 17 (issue: "roofdieren toevoegen") voor een settler die
  // aan een roofdier is verloren — ook dan moet een vervanging via de
  // civiele improvement-pool (`startNieuweSettler`), niet gratis terugkomen.
  const settler =
    naRoofdieren.settler ??
    (!naRoofdieren.stadGesticht && !naRoofdieren.settlerVerlorenAanRoofdier && nieuweBeurt >= 2
      ? { hoogte: 1, positieInStreek: STAD_POSITIE }
      : undefined);

  return {
    ...naRoofdieren,
    beurt: nieuweBeurt,
    bouwKeuzeGedaanDitBeurt: false,
    settlerActieGedaanDitBeurt: false,
    verkenningGedaanDitBeurt: false,
    settler,
  };
}

// Automatische beurtwissel (issue: "beurt button helemaal weg"): er is geen
// handmatige "Volgende beurt"-knop meer (en dus ook geen waarschuwing meer
// die daarvóór stond, hoofdstuk 11/18) — zodra er voor deze beurt niets meer
// te doen valt, gaat de beurt vanzelf door. "Niets meer te doen" is dezelfde
// combinatie die eerder de waarschuwing bepaalde: de settler heeft geen
// ongebruikte actie (bewegen/weg aanleggen/jagen/hout hakken) meer, én er
// staat geen bouwkeuze meer open (of dit is toch al geen bouwmoment). Vóór
// beurt 2 bestaat er nog geen settler (hoofdstuk 16), dus telt alleen de
// bouwkeuze van beurt 1 mee — zonder deze functie zou de allereerste beurt
// dan nooit vanzelf doorgaan. Gebruikt door useGameEngine.ts na elke
// settler-actie en na elke bouwkeuze.
export function beurtMagAutomatischDoorgaan(state: GameState): boolean {
  const settlerHeeftNogActie = Boolean(state.settler) && !state.settlerActieGedaanDitBeurt;
  const kanBouwen = state.beurt >= (state.volgendeBouwBeurt ?? 1);
  const magNogBouwen = kanBouwen && !state.bouwKeuzeGedaanDitBeurt;
  return !settlerHeeftNogActie && !magNogBouwen;
}
