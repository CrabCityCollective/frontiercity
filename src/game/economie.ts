// Resource-economie (M3): gedeelde opslag met cap voor hout/steen/erts/goud,
// een losse voedselvoorraad, en een productiewachtrij die per beurt
// bouwmateriaal verbruikt tot een improvement voltooid is. Zie
// frontier-city-design-doc.md hoofdstuk 5.
//
// Uitputting & ghost towns (M4): elke actieve land-improvement telt af vanaf
// `uitputtingBeurten` (hoofdstuk 4/7). Bij nul wordt de tile een permanente,
// onbebouwbare ghost-town-tile die niet meer produceert.
//
// Cultuur & laag-ontgrendeling (M5): cultuur is een voortgangs-valuta zonder
// opslag-cap (hoofdstuk 5). Zodra de cumulatieve cultuur de drempel van de
// eerstvolgende vergrendelde laag haalt, ontgrendelt die laag automatisch
// (fog of war verdwijnt — hoofdstuk 2).
//
// Groei & verval (M6): zodra voedsel de groeidrempel haalt kan de speler
// bewust de groei-tier klein→middel starten (geen automatische ontgrendeling
// zoals cultuur, hoofdstuk 11), die net als een land-improvement een aantal
// beurten rijptijd kost. Raakt het gebouwde land grotendeels uitgeput, dan
// verschijnt een "kritiek"-waarschuwing; blijft dat zo, dan stort de stad in
// en gaan de groei-tier en alle relics verloren (permadeath-risico op
// stadsniveau, hoofdstuk 4).
//
// Exacte getallen (opslag-cap, kosten, productiesnelheden, uitputtingssnelheid)
// zijn nog niet vastgelegd in het design-document (hoofdstuk 14) — de waarden
// hieronder zijn bewuste MVP-placeholders, geen definitieve balans.

import { WOONWIJK } from "./improvements";
import { GameState, Improvement, MateriaalType, ResourceType, Tile } from "./types";
import {
  cultuurKostenVoorLaag,
  hoogsteOntgrendeldeLaag,
  maakInitieleWereld,
  VOEDSEL_DREMPEL_GROEI,
} from "./world";

export const OPSLAG_CAP = 30;

// Verval-tuning (M6, hoofdstuk 4/14): bewuste MVP-placeholders, net als de
// overige nog niet vastgelegde balansgetallen. Een minimum-aantal ghost towns
// naast de ratio voorkomt dat de allereerste uitgeputte tile al meteen een
// crisis veroorzaakt.
const KRITIEK_MIN_UITGEPUTTE_TILES = 3;
const KRITIEK_UITPUTTINGSRATIO = 0.6;
const VERVAL_BEURTEN = 5;

const STARTVOORRAAD: Record<MateriaalType, number> = {
  hout: 8,
  steen: 6,
  erts: 0,
  goud: 0,
};

export function maakInitieleSpelStatus(): GameState {
  return {
    stad: {
      naam: "Het Hertenpad-kamp",
      grootte: "klein",
      relics: [],
      vervalStatus: "gezond",
    },
    lagen: maakInitieleWereld(),
    voorraad: { ...STARTVOORRAAD },
    opslagCap: OPSLAG_CAP,
    voedsel: 0,
    cultuur: 0,
    beurt: 1,
  };
}

function isMateriaalType(resource: string): resource is MateriaalType {
  return resource === "hout" || resource === "steen" || resource === "erts" || resource === "goud";
}

type ResourceKey = keyof Improvement["kosten"];

// Past productie toe van elke actieve land-improvement met een "productie"-effect.
// Bouwmaterialen lopen tegen de gedeelde opslag-cap aan; voedsel niet (hoofdstuk 5).
function verwerkProductie(state: GameState): GameState {
  const voorraad = { ...state.voorraad };
  let voedsel = state.voedsel;
  let cultuur = state.cultuur;

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || !effect.resource || !effect.waarde) {
        continue;
      }

      if (effect.resource === "voedsel") {
        voedsel += effect.waarde;
      } else if (effect.resource === "cultuur") {
        cultuur += effect.waarde;
      } else if (isMateriaalType(effect.resource)) {
        voorraad[effect.resource] = Math.min(
          state.opslagCap,
          voorraad[effect.resource] + effect.waarde
        );
      }
    }
  }

  return { ...state, voorraad, voedsel, cultuur };
}

// Ontgrendelt de eerstvolgende vergrendelde laag zodra de cumulatieve cultuur
// de drempel haalt (M5, hoofdstuk 2/5). Cultuur wordt niet "uitgegeven" —
// het blijft een oplopende teller, dus bij een grote overschot ontgrendelen
// meteen meerdere lagen na elkaar in dezelfde beurt.
function verwerkLaagOntgrendeling(state: GameState): GameState {
  let lagen = state.lagen;
  let volgendeHoogte = hoogsteOntgrendeldeLaag(lagen) + 1;

  while (
    volgendeHoogte <= lagen.length &&
    state.cultuur >= cultuurKostenVoorLaag(volgendeHoogte)
  ) {
    lagen = lagen.map((laag) =>
      laag.hoogte === volgendeHoogte ? { ...laag, ontgrendeld: true } : laag
    );
    volgendeHoogte += 1;
  }

  return lagen === state.lagen ? state : { ...state, lagen };
}

interface BouwInvestering {
  nieuweVoortgang: Partial<Record<ResourceType, number>>;
  voltooid: boolean;
}

// Investeert dit beurt-aandeel van de resterende bouwkosten vanuit de
// gedeelde opslag, als er voldoende voorraad is. Bij onvoldoende voorraad
// stokt de bouw deze beurt (geen gedeeltelijke betaling) — zie hoofdstuk 5,
// "geen instant-klik, maar een productiewachtrij". Gedeeld tussen de
// land-tile-bouwwachtrij (M3) en de stadsgroei-bouwwachtrij (M6), die verder
// los van elkaar staan (tile vs. stad).
function investeerInBouwkosten(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>,
  voorraad: Record<MateriaalType, number>
): BouwInvestering | null {
  const teBetalen: Partial<Record<ResourceKey, number>> = {};
  for (const key of Object.keys(voortgang) as ResourceKey[]) {
    const resterend = voortgang[key] ?? 0;
    if (resterend <= 0) continue;
    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    teBetalen[key] = Math.min(perBeurt, resterend);
  }

  const kanBetalen = (Object.keys(teBetalen) as ResourceKey[]).every((key) => {
    if (!isMateriaalType(key)) return true; // niet-materiaalkosten komen hier nog niet voor
    return voorraad[key] >= (teBetalen[key] ?? 0);
  });

  if (!kanBetalen) return null;

  const nieuweVoortgang = { ...voortgang };
  for (const key of Object.keys(teBetalen) as ResourceKey[]) {
    const bedrag = teBetalen[key] ?? 0;
    if (isMateriaalType(key)) voorraad[key] -= bedrag;
    nieuweVoortgang[key] = (nieuweVoortgang[key] ?? 0) - bedrag;
  }

  const voltooid = (Object.values(nieuweVoortgang) as number[]).every((rest) => rest <= 0);
  return { nieuweVoortgang, voltooid };
}

function verwerkTileInAanbouw(tile: Tile, voorraad: Record<MateriaalType, number>): Tile {
  const improvement = tile.improvement;
  if (!improvement || !tile.bouwVoortgang) return tile;

  const resultaat = investeerInBouwkosten(improvement, tile.bouwVoortgang, voorraad);
  if (!resultaat) return tile;

  if (resultaat.voltooid) {
    return {
      ...tile,
      status: "actief",
      bouwVoortgang: undefined,
      beurtenTotUitputting: improvement.uitputtingBeurten,
    };
  }

  return { ...tile, bouwVoortgang: resultaat.nieuweVoortgang };
}

// Telt de resterende levensduur van elke actieve land-improvement af. Bij nul
// wordt de tile een permanente ghost-town-tile: onbebouwbaar en stopt met
// produceren (zie verwerkProductie, die alleen "actief"-tiles meetelt).
// City-tiles en tiles zonder `uitputtingBeurten` slaan we over (hoofdstuk 4:
// alleen land-improvements putten uit).
function verwerkUitputting(state: GameState): GameState {
  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) => {
      if (tile.status !== "actief" || tile.beurtenTotUitputting === undefined) {
        return tile;
      }

      const resterend = tile.beurtenTotUitputting - 1;
      if (resterend <= 0) {
        return { ...tile, status: "ghost_town" as const, beurtenTotUitputting: undefined };
      }

      return { ...tile, beurtenTotUitputting: resterend };
    }),
  }));

  return { ...state, lagen };
}

function verwerkBouwwachtrij(state: GameState): GameState {
  const voorraad = { ...state.voorraad };

  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) =>
      tile.status === "in_aanbouw" ? verwerkTileInAanbouw(tile, voorraad) : tile
    ),
  }));

  return { ...state, lagen, voorraad };
}

// Telt de gebouwde land-tiles (actief + ghost_town) en hoeveel daarvan al
// zijn uitgeput — de basis voor de "kritiek"-verval-drempel (M6, hoofdstuk 4).
// City-tiles tellen niet mee (alleen land put uit, zie ook verwerkUitputting).
function telLandTiles(state: GameState): { totaal: number; ghostTowns: number } {
  let totaal = 0;
  let ghostTowns = 0;

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const isGebouwdeLandTile =
        tile.improvement?.soort === "land" &&
        (tile.status === "actief" || tile.status === "ghost_town");
      if (!isGebouwdeLandTile) continue;

      totaal += 1;
      if (tile.status === "ghost_town") ghostTowns += 1;
    }
  }

  return { totaal, ghostTowns };
}

// Verval (M6, hoofdstuk 4): zodra het gebouwde land grotendeels is uitgeput
// verschijnt een zichtbare "kritiek"-waarschuwing voor meerdere beurten.
// Reageert de speler op tijd (bijv. nieuw land ontsluiten door een laag te
// ontgrendelen, wat de uitputtingsratio weer verlaagt) dan wordt de stad
// weer "gezond" en blijft alles behouden. Blijft de ratio kritiek tot de
// aftelling nul bereikt, dan stort de stad in: de groei-tier en alle relics
// gaan verloren (permadeath-risico op stadsniveau) — de centrale
// risk/reward-gok van elke stad-episode.
function verwerkVerval(state: GameState): GameState {
  const { totaal, ghostTowns } = telLandTiles(state);
  const isKritiekeUitputting =
    ghostTowns >= KRITIEK_MIN_UITGEPUTTE_TILES &&
    totaal > 0 &&
    ghostTowns / totaal >= KRITIEK_UITPUTTINGSRATIO;

  if (state.stad.vervalStatus === "gezond") {
    if (!isKritiekeUitputting) return state;
    return {
      ...state,
      stad: { ...state.stad, vervalStatus: "kritiek", vervalBeurtenResterend: VERVAL_BEURTEN },
    };
  }

  if (!isKritiekeUitputting) {
    return {
      ...state,
      stad: { ...state.stad, vervalStatus: "gezond", vervalBeurtenResterend: undefined },
    };
  }

  const resterend = (state.stad.vervalBeurtenResterend ?? VERVAL_BEURTEN) - 1;
  if (resterend > 0) {
    return { ...state, stad: { ...state.stad, vervalBeurtenResterend: resterend } };
  }

  return {
    ...state,
    stad: {
      ...state.stad,
      grootte: "klein",
      relics: [],
      groeiInAanbouw: undefined,
      vervalStatus: "gezond",
      vervalBeurtenResterend: undefined,
    },
  };
}

// Betaalt de bouwkosten van een lopende stadsgroei (M6). Los van de
// land-tile-bouwwachtrij omdat groei de stad zelf upgradet, geen land-vakje.
function verwerkGroei(state: GameState): GameState {
  const groeiInAanbouw = state.stad.groeiInAanbouw;
  if (!groeiInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(groeiInAanbouw.improvement, groeiInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      stad: { ...state.stad, grootte: "middel", groeiInAanbouw: undefined },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      groeiInAanbouw: { ...groeiInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Start de groei-tier klein→middel (M6), als de voedseldrempel gehaald is en
// er niet al een groei loopt. Dit is een bewuste spelerskeuze, geen
// automatische ontgrendeling zoals cultuur (M5) — hoofdstuk 11: "doorgroeien
// ... is een bewuste gok, geen gratis extra beloning". Voedsel wordt niet
// "uitgegeven": net als cultuur blijft het een oplopende teller die de
// drempel markeert (hoofdstuk 5).
export function startGroei(state: GameState): GameState {
  if (
    state.stad.grootte !== "klein" ||
    state.stad.groeiInAanbouw ||
    state.voedsel < VOEDSEL_DREMPEL_GROEI
  ) {
    return state;
  }

  return {
    ...state,
    stad: {
      ...state.stad,
      groeiInAanbouw: { improvement: WOONWIJK, voortgang: { ...WOONWIJK.kosten } },
    },
  };
}

// Start de bouw van een land improvement op de eerstvolgende lege tile van
// de gegeven laag. Geeft de ongewijzigde status terug als er geen lege tile is.
export function startBouw(
  state: GameState,
  laagHoogte: number,
  improvement: Improvement
): GameState {
  const lagen = state.lagen.map((laag) => {
    if (laag.hoogte !== laagHoogte) return laag;

    const legeTileIndex = laag.tiles.findIndex((tile) => tile.status === "leeg");
    if (legeTileIndex === -1) return laag;

    const tiles = laag.tiles.map((tile, index) => {
      if (index !== legeTileIndex) return tile;
      return {
        ...tile,
        status: "in_aanbouw" as const,
        improvement,
        bouwVoortgang: { ...improvement.kosten },
      };
    });

    return { ...laag, tiles };
  });

  return { ...state, lagen };
}

// Verwerkt één spelbeurt: eerst productie van actieve improvements (incl.
// cultuur), dan laag-ontgrendeling op basis van die cultuur (M5), dan
// uitputting van de actieve tiles (M4), dan verval op basis van die
// uitputting (M6), dan verbruik/voortgang van de land-tile-bouwwachtrij en de
// stadsgroei-bouwwachtrij (M6), dan de beurtteller ophogen. Een tile die deze
// beurt net voltooid wordt, begint pas volgende beurt met aftellen.
export function volgendeBeurt(state: GameState): GameState {
  const naProductie = verwerkProductie(state);
  const naOntgrendeling = verwerkLaagOntgrendeling(naProductie);
  const naUitputting = verwerkUitputting(naOntgrendeling);
  const naVerval = verwerkVerval(naUitputting);
  const naBouw = verwerkBouwwachtrij(naVerval);
  const naGroei = verwerkGroei(naBouw);
  return { ...naGroei, beurt: naGroei.beurt + 1 };
}
