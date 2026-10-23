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
// als de tutorial blijft gelden (hoofdstuk 9 "Weergavenamen").

import { StreekContent } from "./tutorialContent";
import { GOING_WEST_STREEK_AANTAL, terreinTypeVoorStreek } from "./worldGoingWest";

function metHoofdletter(woord: string): string {
  return woord.charAt(0).toUpperCase() + woord.slice(1);
}

// Korte verhalende streekteksten (issue #571) voor streek 1 t/m 16. Streek 1 =
// verloren in de Nieuwe Wereld, 2-5 = de kust en het bos rond de Wampanoag,
// 6 = hun maisvelden, 7-11 = de weg naar het westen, 12 = de rivier waar de
// brug moet komen, 13-15 = de aanloop, 16 = de Black Hills. Streken zonder
// tekst houden "todo" totdat de speler die zelf aanvult.
const GOING_WEST_FLAVOR_TEKST: Record<number, string> = {
  1: "Het schip is weg, de kust is vreemd. Verloren in een nieuwe wereld hebben we alleen elkaar — en de vraag waar we beginnen.",
  2: "Zout en modder tot aan onze enkels. Dit land is niet leeg, zeggen de sporen in de klei.",
  3: "Het cederswamp is stil en donker. Ergens tussen de stammen kijkt iemand mee.",
  4: "Onder de eiken liggen oude paden, plat gelopen door voeten die dit bos beter kennen dan wij.",
  5: "Vanaf de heuvelrug zien we rook stijgen. We zijn niet de eersten die hier vuur maken.",
  6: "Rook boven de maisvelden. De Wampanoag kijken zwijgend toe — vreemden die hun land betreden, en misschien toch bondgenoten.",
  7: "De Wampanoag leerden ons zaaien en wachten. Zonder hen was de eerste winter ook de laatste geweest.",
  8: "Achter ons wordt het bekende kleiner. Voor ons ligt een heuvelrug die niemand van ons ooit zag.",
  9: "Kalksteen onder onze laarzen, geruchten over een grote rivier in onze oren.",
  10: "Het bos maakt plaats voor droog gras. Hier lijkt de wereld eindeloos, en wij heel klein.",
  11: "Aan de rand van de canyon valt de wind weg. De diepte roept, maar we durven niet te kijken.",
  12: "Een brede, trage rivier snijdt de weg af. Wie naar het westen wil, moet een manier vinden om over te steken.",
  13: "Aan de overkant is het anders. Hout en steen liggen klaar; de brug was een idee, nu draagt hij ons.",
  14: "Een ruiter op de mesa, onbeweeglijk tegen de lucht. Een Lakota-scout — hij wist al lang dat we kwamen.",
  15: "Bij de cottonwood-oase drinken we, en horen we verhalen over donkere bergen aan de horizon.",
  16: "De Black Hills rijzen donker op uit de vlakte. Heilige grond, zeggen de verhalen — wie hier doorheen trekt, doet dat met respect.",
};

export const GOING_WEST_STREEK_CONTENT: Record<number, StreekContent> = Object.fromEntries(
  Array.from({ length: GOING_WEST_STREEK_AANTAL }, (_, i) => {
    const hoogte = i + 1;
    const content: StreekContent = {
      naam: metHoofdletter(terreinTypeVoorStreek(hoogte)),
      mechaniek: "todo",
      flavorTekst: GOING_WEST_FLAVOR_TEKST[hoogte] ?? "todo",
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
