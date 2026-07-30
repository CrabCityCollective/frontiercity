// Resource-economie (M3): gedeelde opslag met cap voor hout/steen/erts/goud,
// een losse voedselvoorraad, en een productiewachtrij die per beurt
// bouwmateriaal verbruikt tot een improvement voltooid is. Zie
// frontier-city-design-doc.md hoofdstuk 5.
//
// Uitputting & ghost towns (M4): elke actieve land-improvement telt af vanaf
// `uitputtingBeurten` (hoofdstuk 4/7). Bij nul wordt de tile een permanente,
// onbebouwbare ghost-town-tile die niet meer produceert.
//
// Exacte getallen (opslag-cap, kosten, productiesnelheden, uitputtingssnelheid)
// zijn nog niet vastgelegd in het design-document (hoofdstuk 14) — de waarden
// hieronder zijn bewuste MVP-placeholders, geen definitieve balans.

import { GameState, Improvement, MateriaalType, Tile } from "./types";
import { maakInitieleWereld } from "./world";

export const OPSLAG_CAP = 30;

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

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || !effect.resource || !effect.waarde) {
        continue;
      }

      if (effect.resource === "voedsel") {
        voedsel += effect.waarde;
      } else if (isMateriaalType(effect.resource)) {
        voorraad[effect.resource] = Math.min(
          state.opslagCap,
          voorraad[effect.resource] + effect.waarde
        );
      }
    }
  }

  return { ...state, voorraad, voedsel };
}

// Investeert dit beurt-aandeel van de kosten van een tile-in-aanbouw, als er
// voldoende voorraad is. Bij onvoldoende voorraad stokt de bouw deze beurt
// (geen gedeeltelijke betaling) — zie hoofdstuk 5, "geen instant-klik, maar
// een productiewachtrij".
function verwerkTileInAanbouw(tile: Tile, voorraad: Record<MateriaalType, number>): Tile {
  const improvement = tile.improvement;
  if (!improvement || !tile.bouwVoortgang) return tile;

  const teBetalen: Partial<Record<ResourceKey, number>> = {};
  for (const key of Object.keys(tile.bouwVoortgang) as ResourceKey[]) {
    const resterend = tile.bouwVoortgang[key] ?? 0;
    if (resterend <= 0) continue;
    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    teBetalen[key] = Math.min(perBeurt, resterend);
  }

  const kanBetalen = (Object.keys(teBetalen) as ResourceKey[]).every((key) => {
    if (!isMateriaalType(key)) return true; // niet-materiaalkosten komen hier nog niet voor
    return voorraad[key] >= (teBetalen[key] ?? 0);
  });

  if (!kanBetalen) return tile;

  const nieuweVoortgang = { ...tile.bouwVoortgang };
  for (const key of Object.keys(teBetalen) as ResourceKey[]) {
    const bedrag = teBetalen[key] ?? 0;
    if (isMateriaalType(key)) voorraad[key] -= bedrag;
    nieuweVoortgang[key] = (nieuweVoortgang[key] ?? 0) - bedrag;
  }

  const voltooid = (Object.values(nieuweVoortgang) as number[]).every((rest) => rest <= 0);
  if (voltooid) {
    return {
      ...tile,
      status: "actief",
      bouwVoortgang: undefined,
      beurtenTotUitputting: improvement.uitputtingBeurten,
    };
  }

  return { ...tile, bouwVoortgang: nieuweVoortgang };
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

// Verwerkt één spelbeurt: eerst productie van actieve improvements, dan
// uitputting van diezelfde tiles (M4), dan verbruik/voortgang van de
// bouwwachtrij, dan de beurtteller ophogen. Een tile die deze beurt net
// voltooid wordt, begint pas volgende beurt met aftellen.
export function volgendeBeurt(state: GameState): GameState {
  const naProductie = verwerkProductie(state);
  const naUitputting = verwerkUitputting(naProductie);
  const naBouw = verwerkBouwwachtrij(naUitputting);
  return { ...naBouw, beurt: naBouw.beurt + 1 };
}
