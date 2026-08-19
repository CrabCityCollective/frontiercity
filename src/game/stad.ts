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
