// Going West-content (M20f, hoofdstuk 9/19 design-doc, vervolg op blocker 1):
// eigen, van de tutorial losstaand bestand voor de Amerikaanse
// frontier-campagne (CLAUDE.md: tutorial- en Going West-content blijven
// gescheiden, ook al delen ze dezelfde `StreekContent`-vorm). Issue #278,
// antwoord op vraag 1: flavor-tekst is voor de eerste versie overal "todo" —
// wordt later gaandeweg aangevuld. De streek-`naam` hergebruikt het al
// bestaande terreintype per streek (`worldGoingWest.ts`) zodat de
// streek-pop-up niet kaal oogt zolang de echte flavor-tekst er nog niet is.
// `mechaniek` is ook "todo": Going West introduceert geen eigen, nieuwe
// mechaniek-volgorde per streek — dezelfde functionele improvement-gating
// als de tutorial blijft gelden (hoofdstuk 9 "Weergavenamen"). De drie
// Anker-verhalen (hoofdstuk 9) horen hier nog niet bij (issue #278, vraag 3,
// bewust nog open).

import { StreekContent } from "./tutorialContent";
import { GOING_WEST_STREEK_AANTAL, terreinTypeVoorStreek } from "./worldGoingWest";

function metHoofdletter(woord: string): string {
  return woord.charAt(0).toUpperCase() + woord.slice(1);
}

export const GOING_WEST_STREEK_CONTENT: Record<number, StreekContent> = Object.fromEntries(
  Array.from({ length: GOING_WEST_STREEK_AANTAL }, (_, i) => {
    const hoogte = i + 1;
    const content: StreekContent = {
      naam: metHoofdletter(terreinTypeVoorStreek(hoogte)),
      mechaniek: "todo",
      flavorTekst: "todo",
    };
    return [hoogte, content];
  })
);

export function goingWestStreekContent(hoogte: number): StreekContent | undefined {
  return GOING_WEST_STREEK_CONTENT[hoogte];
}

// Introscherm & oceaan-uitleg-pop-up (hoofdstuk 19 design-doc, blocker 1,
// laatste twee openstaande stukken): de titel/subtitel hergebruiken de al
// vastgelegde campagnenaam (`GOING_WEST_CAMPAGNE`/`CampagneSelectScherm`,
// hier als losse string herhaald i.p.v. geïmporteerd om een circulaire
// import met campagnes.ts te vermijden). De langere, koloniale-openingssituatie
// -tekst (issue "Pop-up teksten Wampanoag") staat expliciet niet hier, maar in
// een eigen pop-up bij het begin van beurt 1 (`campagneOpeningPopup`,
// `CampaignConfig.popupTeksten` in campagnes.ts) — dit introscherm-blurbje
// blijft kort, zelfde stijl/lengte als de tutorial-versie (`INTRO_FLAVOR_TEKST`,
// tutorialContent.ts). De oceaan-uitleg-pop-up hieronder is nog niet ingevuld
// en blijft "todo" totdat de speler die zelf aanvult (issue #278, vraag 1).
export const GOING_WEST_INTRO_TITEL = "Going West";
export const GOING_WEST_INTRO_SUBTITEL = "American Expansion";
export const GOING_WEST_INTRO_FLAVOR_TEKST =
  "De Pilgrims kunnen niet meer in Engeland blijven, maar de Nieuwe Wereld biedt ook nieuwe avonturen. De Frontier wacht niet, laten we de wildernis intrekken.";
// Eigen sfeerbeeld voor het Going West-introscherm (issue "Scène beelden"),
// i.p.v. het tutorial-plaatje (`intro.jpg`) — zelfde Diablo II-achtige stijl
// als de rest van de campagne-assets (CLAUDE.md, hoofdstuk 12 design-doc).
export const GOING_WEST_INTRO_AFBEELDING = "/assets/scenes/going-west-campaign-intro.png";

// De laatste streek van de Going West-kaart is een afdaling naar de kust
// (`worldGoingWest.ts`, streek 28-35) — net als de tutorial dus de enige
// plek met vers water waar de afsluitende stad gesticht kan worden.
export const GOING_WEST_OCEAAN_UITLEG_TITEL = "De kust van de Stille Oceaan";
export const GOING_WEST_OCEAAN_UITLEG_TEKST = "todo";

// Stichtingsmoment-pop-up (issue #278, antwoord op vraag 2): eigen, kortere
// Going West-versie van `TutorialVoltooidPopup`, maar dan bij élke stichting
// binnen het herhalende drie-stichtingsmomenten-patroon (hoofdstuk 9 Deel 2),
// niet alleen de allerlaatste — en zonder de run te beëindigen, zoals
// expliciet gevraagd ("het verschil met de tutorial is dat het spel niet
// eindigt dan"). De tekst is voor nu placeholder ("todo"); de speler vult die
// later zelf verder in, samen met een eigen plaatje per stichting.
export const STICHTINGSMOMENT_TEKST = "todo";
