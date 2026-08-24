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

import { EenmaligeUitlegKey, GameState, ResourceType } from "./types";
import { STAD_POSITIE } from "./world";
import { verwerkUitputting, verwerkVerval } from "./uitputtingEnVerval";
import { verwerkBouwwachtrij } from "./bouwwachtrij";
import { verwerkProductie } from "./productie";
import { verwerkBelegering, verwerkStreekOntgrendeling, verwerkVerkenningInGang } from "./streekOntgrendeling";
import { verwerkWampanoagFaseAfsluiting, verwerkWampanoagHandel, verwerkWampanoagVerkenningInGang } from "./wampanoag";
import { verwerkTechDrempel } from "./tech";
import {
  verwerkCityVerbetering,
  verwerkCivielInAanbouw,
  verwerkMissionarisRecrutering,
  verwerkOpslagplaats,
  verwerkRecrutering,
  verwerkSmederij,
  verwerkTweedeSettlerInAanbouw,
} from "./groeiEnRekrutering";
import {
  verwerkConfrontatieKuddes,
  verwerkEersteKudde,
  verwerkIndringers,
  verwerkKuddes,
  verwerkRoofdieren,
} from "./indringersEnDieren";

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

// Markeert één van de eenmalige uitleg-pop-ups als gezien (issue: "Bij laden
// niet alle pop-ups tonen") — aangeroepen vanuit GameRoot's `onDoorgaan`-
// handlers in plaats van de vroegere lokale `useState`-setters, zodat de
// "al gezien"-status meegaat in de save (zie types.ts:
// `gezieneEenmaligeUitleg`).
export function markeerUitlegGezien(state: GameState, key: EenmaligeUitlegKey): GameState {
  if (state.gezieneEenmaligeUitleg.includes(key)) return state;
  return { ...state, gezieneEenmaligeUitleg: [...state.gezieneEenmaligeUitleg, key] };
}

// Onthoudt tot en met welke streek de speler de streek-pop-up (StreekPopup)
// al heeft weggeklikt — zelfde reden als `markeerUitlegGezien` hierboven,
// vervangt de vroegere lokale `useState(1)` in GameRoot.
export function bevestigStreekPopup(state: GameState, hoogte: number): GameState {
  return { ...state, laatstBevestigdeStreek: Math.max(state.laatstBevestigdeStreek, hoogte) };
}

// Onthoudt voor hoeveel steden de speler de Stichtingsmoment-pop-up
// (StichtingsMomentPopup, Going West) al heeft weggeklikt — zelfde reden en
// patroon als `bevestigStreekPopup` hierboven.
export function bevestigStichtingsMomentPopup(state: GameState, stedenAantal: number): GameState {
  return { ...state, laatsteBevestigdeStedenAantal: Math.max(state.laatsteBevestigdeStedenAantal, stedenAantal) };
}

// Economie-overzicht (issue: "Economie overzicht" — "hoeveel resources er
// volgende beurt vanaf of en bij komen ... alle grondstoffen, voedsel,
// cultuur en wetenschap"): een read-only voorspelling van de netto
// resource-verandering komende beurt, bereikbaar via het hoofdmenu
// (EconomieOverzichtPaneel). Herhaalt exact de deterministische,
// resource-rakende stappen van `volgendeBeurt` hieronder — uitputting (kan
// productie deze beurt al stopzetten), de land-tile-bouwwachtrij, productie,
// en de stad-brede bouwwachtrijen (civiel/tweede settler/opslagplaats/
// stadsverbetering/rekrutering/missionaris) — maar laat de kans-gebaseerde
// stappen (streek-ontgrendeling, tech-drempel, verval, indringers, kuddes,
// roofdieren) bewust achterwege: die veranderen deze zeven resources zelf
// niet direct (streek-ontgrendeling/tech-drempel tonen alleen een
// keuze-pop-up; indringers-tribuut wordt pas verrekend zodra de speler daar
// zelf voor kiest, zie `verwerkIndringers` in indringersEnDieren.ts) — en
// zouden de uitkomst door hun `Math.random()` bij elke render laten
// wisselen.
export function berekenEconomieOverzicht(state: GameState): Record<ResourceType, number> {
  const naUitputting = verwerkUitputting(state);
  const naBouw = verwerkBouwwachtrij(naUitputting);
  const naProductie = verwerkProductie(naBouw);
  const naCiviel = verwerkCivielInAanbouw(naProductie);
  const naTweedeSettler = verwerkTweedeSettlerInAanbouw(naCiviel);
  const naOpslagplaats = verwerkOpslagplaats(naTweedeSettler);
  const naSmederij = verwerkSmederij(naOpslagplaats);
  const naCityVerbetering = verwerkCityVerbetering(naSmederij);
  const naRecrutering = verwerkRecrutering(naCityVerbetering);
  const uitkomst = verwerkMissionarisRecrutering(naRecrutering);

  return {
    hout: uitkomst.voorraad.hout - state.voorraad.hout,
    steen: uitkomst.voorraad.steen - state.voorraad.steen,
    erts: uitkomst.voorraad.erts - state.voorraad.erts,
    goud: uitkomst.voorraad.goud - state.voorraad.goud,
    voedsel: uitkomst.voedsel - state.voedsel,
    cultuur: uitkomst.cultuur - state.cultuur,
    wetenschap: uitkomst.wetenschap - state.wetenschap,
  };
}

// Verwerkt één spelbeurt: eerst uitputting van de actieve tiles (M4), dan
// verbruik/voortgang van de land-tile-bouwwachtrij — een tile die deze beurt
// klaar is, wordt hier al "actief" en begint pas volgende beurt met
// aftellen (vandaar vóór de productiestap hieronder) — dan de gegarandeerde
// eerste kudde op streek 1 zodra de Steengroeve daar net "actief" is geworden
// (issue: "genoeg hout om ook boerderij te bouwen", `verwerkEersteKudde` in
// indringersEnDieren.ts), dan productie van
// alle (incl. deze beurt net voltooide) actieve improvements (incl.
// voedselverbruik en cultuur), dan streek-ontgrendeling op basis van die
// cultuur (M5), dan de technologie-boom op basis van diezelfde-beurt
// wetenschap (hoofdstuk 3/9, `verwerkTechDrempel` — opent hoogstens één
// keuze-pop-up per aanroep, ontgrendelt niet automatisch zoals cultuur), dan
// pas verval op basis van een dreigend voedseltekort (M6)
// (issue: "eerst de grondstoffen binnenkomen, en daarna wordt gecheckt of je
// afgaat" — een tile/weg die deze beurt klaarkomt telt zo al mee vóór de
// instort-check), dan de civiele stadsbouwwachtrij (M6/hoofdstuk 16: groei óf
// een nieuwe settler), de tweede-settler-wachtrij (issue: "Altijd 2e
// settler" #236 — eigen, onafhankelijke wachtrij), de Opslagplaats-wachtrij
// (hoofdstuk 14), de Smederij-wachtrij (Going West, M21d, eigen wachtrij,
// zelfde "buiten de cap"-uitzondering als Opslagplaats), de
// stadsverbeteringen-wachtrij (Bibliotheek/Markt/Barakken/
// Tempel/Grote Tempel, hoofdstuk 3/4/11/14) en de Soldaat-rekruteringswachtrij
// (M7), dan de indringers-kans (hoofdstuk 6) en
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
  // Gegarandeerde eerste kudde (issue: "genoeg hout om ook boerderij te
  // bouwen"): direct na de bouwwachtrij, zodat een Steengroeve die deze beurt
  // net voltooid is (`naBouw`) meteen dezelfde beurt de kudde nog oplevert.
  const naEersteKudde = verwerkEersteKudde(naBouw);
  const naProductie = verwerkProductie(naEersteKudde);
  const naOntgrendeling = verwerkStreekOntgrendeling(naProductie);
  // Verkenning-in-gang (issue: "Bezette streek scherm"): telt elk lopend
  // verkennings-tellertje van een actieve Bezette Streek één beurt af, en
  // onthult een vakje zodra het op 0 staat — vóór de wololo-verwerking
  // hieronder, zodat een deze-beurt-onthuld vijandelijk Heiligdom nog
  // dezelfde beurt kan meetellen als er al een Missionaris naartoe gestuurd
  // stond te wachten (kan in de praktijk niet, want sturen vereist een al
  // onthuld doel — puur een consistente volgorde).
  const naVerkenningInGang = verwerkVerkenningInGang(naOntgrendeling);
  // Wampanoag-verkenning (Going West, M21e, opdracht-wampanoag-opening.md
  // §5): een eigen, parallel aftellend tellertje, los van de Bezette-Streek-
  // verkenning hierboven — raakt nooit dezelfde streek (Bezette Streek is
  // tutorial-only, Wampanoag Going-West-only op de Wampanoag-streek), dus de volgorde
  // t.o.v. `naVerkenningInGang`/`naBelegering` maakt niet uit.
  const naWampanoagVerkenningInGang = verwerkWampanoagVerkenningInGang(naVerkenningInGang);
  // Wampanoag-handel (Going West, M21f, opdracht-wampanoag-opening.md §6):
  // past elke beurt de lopende grondstofkeuzes toe op alle al onthulde
  // Wampanoag-vakjes — los van de Verkenning-in-gang hierboven (die is voor
  // de onthulling zelf), dus de volgorde ertussen maakt niet uit: een vakje
  // is op elk moment óf nog aan het onthullen óf al handelbaar, nooit beide.
  const naWampanoagHandel = verwerkWampanoagHandel(naWampanoagVerkenningInGang);
  // Wampanoag-fase-afsluiting (Going West, M21g, opdracht-wampanoag-opening.md
  // §7): controleert de 3-3-3-drempel op de zojuist bijgewerkte
  // bevervellen/maïs/wampum-voorraad hierboven — moet dus ná
  // `verwerkWampanoagHandel` draaien, anders zou de drempel pas een beurt te
  // laat gecontroleerd worden.
  const naWampanoagFaseAfsluiting = verwerkWampanoagFaseAfsluiting(naWampanoagHandel);
  // Wololo (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 4, herzien door "Bezette streek scherm"): direct na
  // Verkenning-in-gang — zie `verwerkBelegering` hierboven.
  const naBelegering = verwerkBelegering(naWampanoagFaseAfsluiting);
  const naTechDrempel = verwerkTechDrempel(naBelegering);
  const naVerval = verwerkVerval(naTechDrempel);
  if (naVerval.laatsteIneenstorting) return naVerval;

  const naCiviel = verwerkCivielInAanbouw(naVerval);
  // Tweede-settler-wachtrij (hoofdstuk 11/13/16, issue: "Altijd 2e settler"
  // #236): eigen, onafhankelijke wachtrij, dus los van `naCiviel` hierboven
  // verwerkt — de speler kan groei/de eerste settler én de tweede settler
  // tegelijk laten lopen.
  const naTweedeSettler = verwerkTweedeSettlerInAanbouw(naCiviel);
  const naOpslagplaats = verwerkOpslagplaats(naTweedeSettler);
  // Smederij (Going West, M21d, opdracht-wampanoag-opening.md §3): eigen
  // wachtrij, los van civiel/opslagplaats hierboven — zelfde uitzondering als
  // Opslagplaats.
  const naSmederij = verwerkSmederij(naOpslagplaats);
  // Stadsverbeteringen (hoofdstuk 3/4/11/14, issue: "city improvements" Deel
  // 1/3): eigen wachtrij, los van civiel/opslagplaats/smederij hierboven.
  const naCityVerbetering = verwerkCityVerbetering(naSmederij);
  const naRecrutering = verwerkRecrutering(naCityVerbetering);
  const naMissionarisRecrutering = verwerkMissionarisRecrutering(naRecrutering);
  const naIndringers = verwerkIndringers(naMissionarisRecrutering);
  const naKuddes = verwerkKuddes(naIndringers);
  // Gegarandeerde kuddes tijdens de Confrontatie (issue: "kuddes op de laatste
  // laag"): direct ná de gewone kans-gebaseerde spawn hierboven, zie
  // `verwerkConfrontatieKuddes` in indringersEnDieren.ts.
  const naConfrontatieKuddes = verwerkConfrontatieKuddes(naKuddes);
  const naRoofdieren = verwerkRoofdieren(naConfrontatieKuddes);
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
    settlerGratisBewogenDitBeurt: false,
    // Tweede settler (issue #236): geen val-terug-verschijning zoals
    // `settler` hierboven — hij bestaat alleen via `tweedeSettler` op
    // `naRoofdieren`, hier wordt alleen zijn actie-vlag weer teruggezet.
    tweedeSettlerActieGedaanDitBeurt: false,
    tweedeSettlerGratisBewogenDitBeurt: false,
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
  // Tweede settler (issue #236): telt onafhankelijk mee — beide settlers
  // moeten hun actie voor deze beurt gebruikt (of niet meer beschikbaar)
  // hebben voordat de beurt vanzelf doorgaat.
  const tweedeSettlerHeeftNogActie = Boolean(state.tweedeSettler) && !state.tweedeSettlerActieGedaanDitBeurt;
  const kanBouwen = state.beurt >= (state.volgendeBouwBeurt ?? 1);
  const magNogBouwen = kanBouwen && !state.bouwKeuzeGedaanDitBeurt;
  return !settlerHeeftNogActie && !tweedeSettlerHeeftNogActie && !magNogBouwen;
}
