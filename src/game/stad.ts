// Meerdere-steden-fundering (hoofdstuk 9/13, issue: "Eerste bouwsteen van de
// Amerikaanse frontier-campagne"). `GameState.steden` is de brontabel van
// alle gestichte steden van deze run; `GameState.stad` blijft de actieve/
// laatst-gestichte stad (`steden[steden.length - 1]`). `stichtStad`
// (acties.ts, M18) hangt een nieuwe stad aan `steden` en maakt haar actief
// zodra de speler daadwerkelijk sticht — vóór die stichting (en in de
// tutorial, die nooit meer dan één stichting kent) blijft er dus precies één
// stad. `metActieveStad` is de enige plek die een bestaande stad muteert
// (niet: toevoegt) in zowel `steden` als `stad` tegelijk, zodat ze nooit uit
// elkaar kunnen lopen — de honderden bestaande leesplekken (`state.stad.x`)
// blijven daardoor ongewijzigd werken.
//
// Nieuwe code die van meerdere steden bewust is (M17: afstandsverval, M18:
// herhalend stichtingspatroon) gebruikt `actieveStad`/`frontierAfstand`
// hieronder in plaats van `state.stad` rechtstreeks.

import { City, GameState } from "./types";
import { hoogsteOntgrendeldeStreek } from "./world";

export function actieveStad(state: GameState): City {
  return state.stad;
}

// Streek-hoogte waar de stad-tegel van `stad` daadwerkelijk staat (issue:
// "Tweede stad") — bijna altijd gelijk aan `City.streekHoogte`, behalve voor
// de allereerste stad van een run: die heeft `streekHoogte: 0` ("vóór streek
// 1", zie de toelichting in types.ts), terwijl haar tegel altijd op streek 1
// staat (`maakStartStreek`/`maakInitieleWereldGoingWest`). Gebruikt om een
// nieuw gebouwde settler (M6, groeiEnRekrutering.ts) bij de juiste — actieve —
// stad te laten verschijnen in plaats van altijd terug bij streek 1.
export function stadTileHoogte(stad: City): number {
  return stad.streekHoogte === 0 ? 1 : stad.streekHoogte;
}

// Vervangt de actieve (laatst-gestichte) stad, in `steden` én in `stad`
// tegelijk. Gebruik dit in plaats van `{ ...state, stad: {...} }` zodra een
// aanroepplek de actieve stad muteert.
export function metActieveStad(state: GameState, nieuweStad: City): GameState {
  const steden = state.steden.slice();
  steden[steden.length - 1] = nieuweStad;
  return { ...state, stad: nieuweStad, steden };
}

// Afstand (in aantal streken) tussen een stad en de huidige frontier
// (hoofdstuk 9/14, issue: "Eerste bouwsteen van de Amerikaanse
// frontier-campagne", Deel 1) — kan alleen groeien, want de frontier
// beweegt alleen vooruit. Puur afgeleid uit `City.streekHoogte` (vastgelegd
// bij stichting) en de hoogst ontgrendelde streek, dus geen apart
// bijgehouden/te synchroniseren veld. Het bijbehorende
// effectiviteitspercentage (100/65/30/0%, hoofdstuk 14) volgt in M17.
export function frontierAfstand(state: GameState, stad: City): number {
  return hoogsteOntgrendeldeStreek(state.streken) - stad.streekHoogte;
}

// Zone-naam voor de afstand tot de frontier (hoofdstuk 9/14, Deel 1) — puur
// voor UI-weergave (StadMenuPopup e.d.): welk label/waarschuwingsniveau een
// stad op dit moment heeft.
export type StadVervalZone = "gezond" | "verminderd" | "flink-verminderd" | "uitgeput";

export function stadVervalZone(afstand: number): StadVervalZone {
  if (afstand <= 4) return "gezond";
  if (afstand <= 8) return "verminderd";
  if (afstand <= 12) return "flink-verminderd";
  return "uitgeput";
}

// Effectiviteitspercentage van de doorlopende city-improvement-productie van
// een stad op basis van haar afstand tot de frontier (hoofdstuk 9/11/14,
// issue: "Eerste bouwsteen van de Amerikaanse frontier-campagne" Deel 1):
// 100% tot afstand 4, 65% van 5-8, 30% van 9-12, 0% vanaf 13 ("de grens").
// MVP-richtwaarden, tunebaar (hoofdstuk 14). Raakt uitsluitend de stad-brede
// productie van CAPPED_CITY_IMPROVEMENTS (Bibliotheek/Markt/Barakken/Tempel/
// Grote Tempel) — land improvements vallen hier expliciet buiten (hoofdstuk
// 9/16) en blijven normaal produceren zolang ze wegverbonden zijn.
export function cityImprovementEffectiviteit(afstand: number): number {
  switch (stadVervalZone(afstand)) {
    case "gezond":
      return 1;
    case "verminderd":
      return 0.65;
    case "flink-verminderd":
      return 0.3;
    case "uitgeput":
      return 0;
  }
}

// Effectiviteit van déze stad in de huidige run (hoofdstuk 9/11/14, Deel 1).
// Hoofdstuk 11 legt uit waarom dit verval de oude "geen inkomsten van
// achtergelaten steden"-regel vervangt: die regel gold in de praktijk nooit
// écht, want er bestond nooit meer dan één stad tegelijk — dus nooit een
// "achtergelaten stad" om hem op toe te passen. Zodra een run nog nooit meer
// dan één stad heeft gehad, is er dus nog niets om te vervallen: dit houdt de
// tutorial (die altijd bij precies 1 stad blijft, want er is maar één
// vers-water-vakje) exact ongewijzigd. Sinds M18 (`stichtStad`, acties.ts)
// een tweede stad daadwerkelijk kan aanmaken, gaat de effectiviteit voor
// zo'n run vanaf dat moment echt meebewegen met de afstand.
export function stadEffectiviteit(state: GameState, stad: City): number {
  if (state.steden.length <= 1) return 1;
  return cityImprovementEffectiviteit(frontierAfstand(state, stad));
}

// Drie gegarandeerde vers-water-stichtingskansen per stichtingscyclus
// (hoofdstuk 9/14, Deel 2): worldgen garandeert, gemeten vanaf de
// streek-hoogte waarop een stad gesticht is, telkens één vers-water-vakje
// binnen elk van de drie kans-vensters die hieronder samen de vier
// afstandszones (Deel 1) overspannen. Vaste, deterministische keuzes binnen
// elk venster — geen willekeur, zelfde MVP-conventie als de vaste tutorial-
// worldgen in world.ts (TUTORIAL_VERS_WATER e.d.):
// - kans1 op +3 (binnen 0-4, de "gezonde" zone): vroeg genoeg voor een
//   gezonde buffer, maar niet zo vroeg dat er geen ruimte meer over is om
//   ook nog kans2 en kans3 te plaatsen.
// - kans2 op +8 (binnen 5-12, het midden van beide verval-zones).
// - kans3 op +13 (exact de drempel van "uitgeput"): "zodra afstand 13+
//   bereikt wordt" (hoofdstuk 9) is per definitie de eerst mogelijke streek
//   in die zone.
// Puur de hoogte-berekening — de daadwerkelijke worldgen-plaatsing (welke
// positie-in-streek, ingebed in een campagnelengte van 30-60 streken) hoort
// bij de nog te bouwen Amerikaanse-campagne-wereld (hoofdstuk 13/15); de
// tutorial-wereld is vast en te kort (14 streken) om deze drie kansen ooit
// alle drie te tonen.
export interface StichtingsKansHoogten {
  kans1: number;
  kans2: number;
  kans3: number;
}

export function gegarandeerdeStichtingskansHoogten(streekHoogteStad: number): StichtingsKansHoogten {
  return {
    kans1: streekHoogteStad + 3,
    kans2: streekHoogteStad + 8,
    kans3: streekHoogteStad + 13,
  };
}

// M20c: koppelt bovenstaande formule aan een vaste (handgeschreven, niet-
// procedurele) campagnekaart. Zo'n kaart kan niet, zoals procedurele
// generatie zou kunnen, ná een stichting dynamisch een vers-water-vakje op
// exact de berekende hoogte neerzetten — de garantie moet daarom vooraf
// gehaald worden via voldoende dichtheid van vooraf geplaatste vakjes
// (hoofdstuk 13, M20c-omschrijving). Deze functie maakt dat toetsbaar: voor
// elke hoogte waar een stad zou kúnnen staan (de starthoogte plus elke
// vers-water-hoogte op de kaart — dat zijn de enige hoogten waarop
// daadwerkelijk gesticht kan worden) moet elk van de drie kans-vensters die
// samen de vier afstandszones overspannen ((hoogte, +4], (+4, +12], (+12,
// einde-kaart]) minstens één ándere vers-water-hoogte bevatten — ongeacht op
// welke van die bereikbare hoogten de speler daadwerkelijk sticht. Een
// venster dat al voorbij het einde van de kaart begint, wordt overgeslagen:
// de run is dan sowieso al voorbij (M18: stichten op de laatste streek
// beëindigt de run) vóórdat die kans nog een rol kan spelen.
export interface StichtingskansGat {
  vanafHoogte: number;
  kans: keyof StichtingsKansHoogten;
  venster: [number, number];
}

export function vindStichtingskansGaten(
  startHoogte: number,
  versWaterHoogten: number[],
  streekAantal: number
): StichtingskansGat[] {
  const referentieHoogten = [startHoogte, ...versWaterHoogten];
  const gaten: StichtingskansGat[] = [];

  for (const hoogte of referentieHoogten) {
    const vensters: [keyof StichtingsKansHoogten, number, number][] = [
      ["kans1", hoogte + 1, hoogte + 4],
      ["kans2", hoogte + 5, hoogte + 12],
      ["kans3", hoogte + 13, streekAantal],
    ];

    for (const [kans, begin, eind] of vensters) {
      if (begin > streekAantal) continue;
      const clampEind = Math.min(eind, streekAantal);
      const heeftTreffer = versWaterHoogten.some((h) => h >= begin && h <= clampEind);
      if (!heeftTreffer) gaten.push({ vanafHoogte: hoogte, kans, venster: [begin, clampEind] });
    }
  }

  return gaten;
}
