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

// Stichtingsmoment-pop-up (issue #278, antwoord op vraag 2): eigen, kortere
// Going West-versie van `TutorialVoltooidPopup`, maar dan bij élke stichting
// binnen het herhalende drie-stichtingsmomenten-patroon (hoofdstuk 9 Deel 2),
// niet alleen de allerlaatste — en zonder de run te beëindigen, zoals
// expliciet gevraagd ("het verschil met de tutorial is dat het spel niet
// eindigt dan"). De tekst is voor nu placeholder ("todo"); de speler vult die
// later zelf verder in, samen met een eigen plaatje per stichting.
export const STICHTINGSMOMENT_TEKST = "todo";
