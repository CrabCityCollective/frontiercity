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
import { GameState, Improvement, Streek } from "./types";
import { hoogsteOntgrendeldeStreek } from "./world";

// Bouw-ritme (M10, hoofdstuk 16): na een bouwkeuze (of het bewust overslaan
// ervan) mag pas na zoveel beurten weer een nieuw bouwproject gestart worden
// — de tussenliggende beurten zijn voor de settler (wegen aanleggen).
const BOUW_RITME_BEURTEN = 3;

// Telt, per streek, hoe vaak de bouw-pop-up op die streek al is afgehandeld
// (gebouwd óf bewust overgeslagen, issue: "Teksten aanpassen (nog meer)") —
// gebruikt door GameRoot om een aantal eenmalige tutorial-pop-ups (Heiligdom/
// Niet-bouwen op streek 1, Boerderij/Houtkap op streek 2) op de juiste
// bouw-beurt te tonen in plaats van de gewone bouw-pop-up. Telt altijd de
// frontier-streek (`hoogsteOntgrendeldeStreek`), niet het (voor de Wachttoren
// mogelijk oudere) plaatsingsdoel van `startBouw` hieronder — de bouw-pop-up
// zelf gaat altijd over de frontier-streek.
function metOpgehoogdeBouwPopupTeller(state: GameState): Pick<GameState, "bouwPopupAfgehandeldTellerPerStreek"> {
  // `?? {}` (net als `volgendeBouwBeurt`s `?? 1` elders): een opgeslagen save
  // van vóór dit veld bestond, mist het na `JSON.parse` (save.ts) volledig.
  const bestaandeTellers = state.bouwPopupAfgehandeldTellerPerStreek ?? {};
  const frontierHoogte = hoogsteOntgrendeldeStreek(state.streken);
  const huidig = bestaandeTellers[frontierHoogte] ?? 0;
  return {
    bouwPopupAfgehandeldTellerPerStreek: {
      ...bestaandeTellers,
      [frontierHoogte]: huidig + 1,
    },
  };
}

// Aantal actieve (niet vernietigde/ruïne) land-tiles met dit improvement-id,
// over alle streken heen — de basis van `infrastructuurVoortgang` hieronder.
// Bemand/onbemand maakt voor deze telling niet uit (hoofdstuk 4/6/11/14,
// issue: "city improvements" Deel 4: "bemand of onbemand maakt voor deze
// telling niet uit").
function telActieveLandImprovement(alleStreken: Streek[], id: string): number {
  let aantal = 0;
  for (const streek of alleStreken) {
    for (const tile of streek.tiles) {
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
// infrastructuur-eis heeft. Puur op basis van `alleStreken`/`cityImprovements`
// (geen volledige `GameState` nodig) zodat zowel `voldoetAanInfrastructuurEis`
// hieronder als BouwPopup.tsx (voor de voortgangstekst) dezelfde berekening
// kunnen hergebruiken.
export function infrastructuurVoortgang(
  alleStreken: Streek[],
  cityImprovements: Improvement[],
  improvement: Improvement
): InfrastructuurVoortgang | undefined {
  const eis = improvement.infrastructuurEis;
  if (!eis) return undefined;

  const aantalLandImprovement = telActieveLandImprovement(alleStreken, eis.landImprovementId);
  const heeftCityImprovement = cityImprovements.some((ci) => ci.id === eis.cityImprovementId);
  return {
    aantalLandImprovement,
    benodigdAantal: eis.minAantal,
    heeftCityImprovement,
    vervuld: aantalLandImprovement >= eis.minAantal && heeftCityImprovement,
  };
}

function voldoetAanInfrastructuurEis(state: GameState, improvement: Improvement): boolean {
  return infrastructuurVoortgang(state.streken, state.stad.cityImprovements, improvement)?.vervuld ?? true;
}

// Start de bouw van een land improvement op de tile die de speler zelf heeft
// aangewezen (klik-op-tile plaatsing, zie GameRoot: `plaatsingsImprovement`).
// Geeft de ongewijzigde status terug als die streek niet ontgrendeld is, de
// tile niet (meer) leeg is, of als het terrein niet aan de eis van de
// improvement voldoet (issue: "houtkap alleen op bos" e.d.) — de aanroeper
// controleert dit al vóór het tonen van de "hier bouwen?"-vraag, dit is een
// tweede, veilige check. Bewust geen aparte "is dit de frontier-streek?"-check
// hier: alleen de UI (GameRoot) beperkt normale improvements tot de
// frontier-streek, terwijl `bouwbaarBuitenFrontier`-improvements (hoofdstuk
// 6/11, momenteel alleen de Wachttoren) op elke ontgrendelde streek mogen —
// deze functie staat dus élke ontgrendelde streek toe en vertrouwt op de
// aanroeper voor de rest van die keuze. Verbruikt altijd de bouwkeuze van
// deze beurt (hoofdstuk 11: hoogstens 1 bouwkeuze per beurt).
export function startBouw(
  state: GameState,
  streekHoogte: number,
  improvement: Improvement,
  positieInStreek: number
): GameState {
  // Infrastructuur-eis (hoofdstuk 4/6/11/14, issue: "city improvements" Deel
  // 4): Legerkamp/Offer Altaar blijven uitgegrijsd zolang de eis niet vervuld
  // is, ook al toont BouwPopup.tsx ze (met voortgangstekst) gewoon als optie
  // — deze server-side check is de daadwerkelijke blokkade.
  if (!voldoetAanInfrastructuurEis(state, improvement)) return state;

  const streken = state.streken.map((streek) => {
    if (streek.hoogte !== streekHoogte) return streek;
    if (!streek.ontgrendeld) return streek;

    const doelTile = streek.tiles[positieInStreek];
    // Een "ruine"-vakje (Deel 5: een verloren Confrontatie tegen een Bezette
    // Streek) is net zo herbouwbaar als een gewoon leeg vakje.
    if (!doelTile || !isBebouwbaarLeeg(doelTile)) return streek;
    if (!improvementPastOpTile(improvement, doelTile)) return streek;

    const tiles = streek.tiles.map((tile, index) => {
      if (index !== positieInStreek) return tile;
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

    return { ...streek, tiles };
  });

  return {
    ...state,
    streken,
    bouwKeuzeGedaanDitBeurt: true,
    volgendeBouwBeurt: state.beurt + BOUW_RITME_BEURTEN,
    ...metOpgehoogdeBouwPopupTeller(state),
  };
}

// Sluit de bouw-pop-up zonder te bouwen (hoofdstuk 11: de speler mag een
// beurt ook overslaan) — verbruikt, net als `startBouw`, de bouwkeuze van
// deze beurt én het eerstvolgende bouwmoment (hoofdstuk 16: bouw-ritme).
export function sluitBouwKeuze(state: GameState): GameState {
  return {
    ...state,
    bouwKeuzeGedaanDitBeurt: true,
    volgendeBouwBeurt: state.beurt + BOUW_RITME_BEURTEN,
    ...metOpgehoogdeBouwPopupTeller(state),
  };
}
