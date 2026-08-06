// Technologie-boom (hoofdstuk 3/9/11, issue: "tech tree toevoegen"):
// wetenschap is, net als cultuur, een voortgangs-valuta zonder opslag-cap,
// geproduceerd door de Sterrencirkel (improvements.ts, zelfde niet-uitputtende
// patroon als het Heiligdom). Zodra de cumulatieve wetenschap een drempel
// haalt (`verwerkTechDrempel`), opent dit — anders dan cultuur — geen
// automatische ontgrendeling maar een keuze tussen twee technologieën
// (`kiesTech`); de niet-gekozen tech en alles daaronder in de boom wordt
// daarmee voor de rest van de run permanent onbereikbaar (dezelfde
// vertakkingslogica als de Anker-verhalen, hoofdstuk 9/11). De effecten zelf
// (boerderij-opbrengst, jachtopbrengst, opslag-cap, enz.) staan als pure
// helpers in techTree.ts en worden op de relevante plek elders toegepast.

import { GameState, TechDrempel, TechId } from "./types";
import { OPSLAGCAP_BONUS_WEVEN, techKinderen, wetenschapKostenVoorDrempel } from "./techTree";

// Technologie-boom (hoofdstuk 3/9/11, issue: "tech tree toevoegen" Deel 2):
// zodra de cumulatieve wetenschap de eerstvolgende drempel haalt, opent dit
// een keuze tussen twee technologieën — anders dan `verwerkLaagOntgrendeling`
// (laagOntgrendeling.ts) ontgrendelt dit niet automatisch, want de speler
// moet zelf kiezen (zelfde blokkerende meldings-vorm als `verwerkIndringers`
// in indringersEnDieren.ts: geen nieuwe gebeurtenis zolang een vorige nog
// openstaat). Rolt hoogstens één drempel per aanroep: staat er na het
// oplossen van deze keuze (`kiesTech` hieronder) meteen alweer genoeg
// wetenschap voor de volgende drempel, dan pakt de eerstvolgende
// `volgendeBeurt`-aanroep die op — net zo lang als de speler er niet eerder
// voor kiest.
export function verwerkTechDrempel(state: GameState): GameState {
  if (state.techKeuzeEvent) return state;

  const volgendeDrempel = (state.technologieen.length + 1) as TechDrempel;
  if (volgendeDrempel > 3) return state;
  if (state.wetenschap < wetenschapKostenVoorDrempel(volgendeDrempel)) return state;

  const ouder = state.technologieen[state.technologieen.length - 1];
  return {
    ...state,
    techKeuzeEvent: { drempel: volgendeDrempel, opties: techKinderen(ouder) },
  };
}

// Legt de keuze van de speler vast op de openstaande drempel (hoofdstuk 3/9):
// de niet-gekozen tech (en alles wat daaronder in de boom hangt) wordt
// hiermee voor de rest van de run permanent onbereikbaar — `techKinderen` in
// techTree.ts kan bij de volgende drempel immers alleen nog de kinderen van
// de hier gekozen `techId` teruggeven. Negeert een ongeldige aanroep (geen
// openstaande keuze, of een `techId` die niet één van de twee getoonde opties
// is) — zelfde veilige-aanroep-conventie als `startBouw`/`bemanWachttoren`.
//
// "Weven" (A1a, techTree.ts) verhoogt de opslag-cap direct bij het kiezen,
// net als de Opslagplaats-improvement bij voltooiing (hoofdstuk 3/5) — het is
// een keuze, geen gebouwd improvement, dus er is geen wachtrij of
// wegverbinding om op te wachten.
export function kiesTech(state: GameState, techId: TechId): GameState {
  const event = state.techKeuzeEvent;
  if (!event || !event.opties.includes(techId)) return state;

  return {
    ...state,
    technologieen: [...state.technologieen, techId],
    opslagCap: techId === "weven" ? state.opslagCap + OPSLAGCAP_BONUS_WEVEN : state.opslagCap,
    techKeuzeEvent: undefined,
  };
}
