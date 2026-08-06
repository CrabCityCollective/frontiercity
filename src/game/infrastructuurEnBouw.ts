// Infrastructuur-eisen & land-tile-plaatsing (hoofdstuk 4/6/11/14, issue:
// "city improvements" Deel 4): sommige improvements (Legerkamp, Offer
// Altaar) vereisen eerst een minimum aantal van een specifieke land-
// improvement én een specifieke city improvement voordat ze bouwbaar worden
// — `infrastructuurVoortgang` hieronder is de gedeelde berekening die zowel
// de server-side blokkade in `startBouw` als de voortgangstekst in
// BouwPopup.tsx voedt.
//
// Bouw-ritme (M10, hoofdstuk 16): na een bouwkeuze (of het bewust overslaan
// ervan) mag pas na zoveel beurten weer een nieuw bouwproject gestart worden
// — de tussenliggende beurten zijn voor de settler (wegen aanleggen).

import { improvementPastOpTile, isBebouwbaarLeeg } from "./improvements";
import { GameState, Improvement, Layer } from "./types";

// Bouw-ritme (M10, hoofdstuk 16): na een bouwkeuze (of het bewust overslaan
// ervan) mag pas na zoveel beurten weer een nieuw bouwproject gestart worden
// — de tussenliggende beurten zijn voor de settler (wegen aanleggen).
const BOUW_RITME_BEURTEN = 3;

// Aantal actieve (niet vernietigde/ruïne) land-tiles met dit improvement-id,
// over alle lagen heen — de basis van `infrastructuurVoortgang` hieronder.
// Bemand/onbemand maakt voor deze telling niet uit (hoofdstuk 4/6/11/14,
// issue: "city improvements" Deel 4: "bemand of onbemand maakt voor deze
// telling niet uit").
function telActieveLandImprovement(alleLagen: Layer[], id: string): number {
  let aantal = 0;
  for (const laag of alleLagen) {
    for (const tile of laag.tiles) {
      if (tile.status === "actief" && tile.improvement?.id === id) aantal += 1;
    }
  }
  return aantal;
}

export interface InfrastructuurVoortgang {
  aantalLandImprovement: number;
  benodigdAantal: number;
  heeftCityImprovement: boolean;
  vervuld: boolean;
}

// Voortgang t.o.v. `improvement.infrastructuurEis` (hoofdstuk 4/6/11/14,
// issue: "city improvements" Deel 4) — `undefined` als dit improvement geen
// infrastructuur-eis heeft. Puur op basis van `alleLagen`/`cityImprovements`
// (geen volledige `GameState` nodig) zodat zowel `voldoetAanInfrastructuurEis`
// hieronder als BouwPopup.tsx (voor de voortgangstekst) dezelfde berekening
// kunnen hergebruiken.
export function infrastructuurVoortgang(
  alleLagen: Layer[],
  cityImprovements: Improvement[],
  improvement: Improvement
): InfrastructuurVoortgang | undefined {
  const eis = improvement.infrastructuurEis;
  if (!eis) return undefined;

  const aantalLandImprovement = telActieveLandImprovement(alleLagen, eis.landImprovementId);
  const heeftCityImprovement = cityImprovements.some((ci) => ci.id === eis.cityImprovementId);
  return {
    aantalLandImprovement,
    benodigdAantal: eis.minAantal,
    heeftCityImprovement,
    vervuld: aantalLandImprovement >= eis.minAantal && heeftCityImprovement,
  };
}

function voldoetAanInfrastructuurEis(state: GameState, improvement: Improvement): boolean {
  return infrastructuurVoortgang(state.lagen, state.stad.cityImprovements, improvement)?.vervuld ?? true;
}

// Start de bouw van een land improvement op de tile die de speler zelf heeft
// aangewezen (klik-op-tile plaatsing, zie GameRoot: `plaatsingsImprovement`).
// Geeft de ongewijzigde status terug als die laag niet ontgrendeld is, de
// tile niet (meer) leeg is, of als het terrein niet aan de eis van de
// improvement voldoet (issue: "houtkap alleen op bos" e.d.) — de aanroeper
// controleert dit al vóór het tonen van de "hier bouwen?"-vraag, dit is een
// tweede, veilige check. Bewust geen aparte "is dit de frontier-laag?"-check
// hier: alleen de UI (GameRoot) beperkt normale improvements tot de
// frontier-laag, terwijl `bouwbaarBuitenFrontier`-improvements (hoofdstuk
// 6/11, momenteel alleen de Wachttoren) op elke ontgrendelde laag mogen —
// deze functie staat dus élke ontgrendelde laag toe en vertrouwt op de
// aanroeper voor de rest van die keuze. Verbruikt altijd de bouwkeuze van
// deze beurt (hoofdstuk 11: hoogstens 1 bouwkeuze per beurt).
export function startBouw(
  state: GameState,
  laagHoogte: number,
  improvement: Improvement,
  positieInLaag: number
): GameState {
  // Infrastructuur-eis (hoofdstuk 4/6/11/14, issue: "city improvements" Deel
  // 4): Legerkamp/Offer Altaar blijven uitgegrijsd zolang de eis niet vervuld
  // is, ook al toont BouwPopup.tsx ze (met voortgangstekst) gewoon als optie
  // — deze server-side check is de daadwerkelijke blokkade.
  if (!voldoetAanInfrastructuurEis(state, improvement)) return state;

  const lagen = state.lagen.map((laag) => {
    if (laag.hoogte !== laagHoogte) return laag;
    if (!laag.ontgrendeld) return laag;

    const doelTile = laag.tiles[positieInLaag];
    // Een "ruine"-vakje (Deel 5: een verloren Confrontatie tegen een Bezette
    // Laag) is net zo herbouwbaar als een gewoon leeg vakje.
    if (!doelTile || !isBebouwbaarLeeg(doelTile)) return laag;
    if (!improvementPastOpTile(improvement, doelTile)) return laag;

    const tiles = laag.tiles.map((tile, index) => {
      if (index !== positieInLaag) return tile;
      return {
        ...tile,
        status: "in_aanbouw" as const,
        improvement,
        bouwVoortgang: { ...improvement.kosten },
        // Een kudde trekt verder zodra hier gebouwd wordt (hoofdstuk 16/17)
        // — anders zou `jaag` (acties.ts) op een inmiddels bebouwd vakje
        // kunnen blijven jagen. Een eventueel roofdier op ditzelfde vakje
        // (hoofdstuk 17) verliest hiermee ook zijn doel.
        kudde: undefined,
        roofdier: undefined,
      };
    });

    return { ...laag, tiles };
  });

  return {
    ...state,
    lagen,
    bouwKeuzeGedaanDitBeurt: true,
    volgendeBouwBeurt: state.beurt + BOUW_RITME_BEURTEN,
  };
}

// Sluit de bouw-pop-up zonder te bouwen (hoofdstuk 11: de speler mag een
// beurt ook overslaan) — verbruikt, net als `startBouw`, de bouwkeuze van
// deze beurt én het eerstvolgende bouwmoment (hoofdstuk 16: bouw-ritme).
export function sluitBouwKeuze(state: GameState): GameState {
  return { ...state, bouwKeuzeGedaanDitBeurt: true, volgendeBouwBeurt: state.beurt + BOUW_RITME_BEURTEN };
}
