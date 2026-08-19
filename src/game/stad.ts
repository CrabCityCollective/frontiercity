// Meerdere-steden-fundering (hoofdstuk 9/13, issue: "Eerste bouwsteen van de
// Amerikaanse frontier-campagne"). `GameState.steden` is de brontabel van
// alle gestichte steden van deze run; `GameState.stad` blijft de actieve/
// laatst-gestichte stad (`steden[steden.length - 1]`) voor de bestaande
// MVP-code, die tot en met M17/M18 altijd van precies één actieve stad
// uitgaat. `metActieveStad` is de enige plek die beide velden muteert, zodat
// ze nooit uit elkaar kunnen lopen — de honderden bestaande leesplekken
// (`state.stad.x`) blijven daardoor ongewijzigd werken.
//
// Nieuwe code die van meerdere steden bewust is (M17: afstandsverval, M18:
// herhalend stichtingspatroon) gebruikt `actieveStad`/`frontierAfstand`
// hieronder in plaats van `state.stad` rechtstreeks.

import { City, GameState } from "./types";
import { hoogsteOntgrendeldeStreek } from "./world";

export function actieveStad(state: GameState): City {
  return state.stad;
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
// tutorial (die altijd op precies 1 stad blijft, hoofdstuk 13, M18 nog niet
// gebouwd) exact ongewijzigd, en de effectiviteit gaat pas echt meebewegen
// met de afstand zodra het herhalende stichtingspatroon (Deel 2, M18) een
// speler ooit een tweede stad laat stichten.
export function stadEffectiviteit(state: GameState, stad: City): number {
  if (state.steden.length <= 1) return 1;
  return cityImprovementEffectiviteit(frontierAfstand(state, stad));
}
