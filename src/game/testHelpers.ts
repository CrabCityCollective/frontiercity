// Gedeelde test-fixtures voor de per-module *.test.ts-bestanden in deze map
// (opgesplitst uit het voorheen monolithische economie.test.ts — issue:
// "Economie.test.ts ook logisch opdelen", zelfde aanpak als de opsplitsing
// van economie.ts zelf, zie het bestandshoofd daar). Alleen fixtures die door
// twee of meer van die bestanden gebruikt worden staan hier; fixtures die
// maar in één bestand nodig zijn, staan lokaal in dat bestand.
import { GameState } from "./types";
import {
  CULTUREEL_LAND_IMPROVEMENTS,
  ECONOMISCH_LAND_IMPROVEMENTS,
  MILITAIR_LAND_IMPROVEMENTS,
  STERRENCIRKEL,
} from "./improvements";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { BEZETTE_STREEK_HOOGTE, cultuurKostenVoorStreek } from "./world";

export const HOUTKAP = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "houtkap")!;
export const STEENGROEVE = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "steengroeve")!;
export const MIJN = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "mijn")!;
export const WACHTTOREN = MILITAIR_LAND_IMPROVEMENTS.find((i) => i.id === "wachttoren")!;
export const LEGERKAMP = MILITAIR_LAND_IMPROVEMENTS.find((i) => i.id === "legerkamp")!;
export const HEILIGDOM = CULTUREEL_LAND_IMPROVEMENTS.find((i) => i.id === "heiligdom")!;

// Vervangt `Math.random` tijdelijk door een vaste waarde, zodat de
// kans-gedreven roofdier-/kuddelogica deterministisch te testen is — altijd
// hersteld in een `finally` zodat een falende assertie andere tests niet kan
// laten meeliften op een gemanipuleerde random.
export function metVasteRandom<T>(waarde: number, fn: () => T): T {
  const origineel = Math.random;
  Math.random = () => waarde;
  try {
    return fn();
  } finally {
    Math.random = origineel;
  }
}

// Zelfde opzet als `metVasteRandom` hierboven, maar met een eigen waarde per
// opeenvolgende `Math.random()`-aanroep — nodig om de kans-trekking (is er
// een incident?) los te zetten van de daaropvolgende streek-trekking (welke
// streek?). Extra aanroepen voorbij `waarden` hergebruiken de laatste waarde.
export function metRandomReeks<T>(waarden: number[], fn: () => T): T {
  const origineel = Math.random;
  let i = 0;
  Math.random = () => waarden[Math.min(i++, waarden.length - 1)];
  try {
    return fn();
  } finally {
    Math.random = origineel;
  }
}

// Bouwt een status met de settler op een kudde-vakje van de opgegeven streek
// (ontgrendeld, indien nodig) — gedeelde opzet voor de jaag-/roofdier-tests.
export function metSettlerOpKuddeVakje(hoogte: number, positieInStreek = 0): GameState {
  const state = maakInitieleSpelStatus();
  return {
    ...state,
    settler: { hoogte, positieInStreek },
    streken: state.streken.map((streek) =>
      streek.hoogte === hoogte
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === positieInStreek ? { ...tile, kudde: { beurtenResterend: 4 } } : tile
            ),
          }
        : streek
    ),
  };
}

// Bouwt een startstatus met een actieve, wegverbonden Sterrencirkel op de
// frontier-streek (streek 1) — gedeelde opzet voor de technologie-boom-tests.
export function metWerkendeSterrencirkel(): GameState {
  const state = maakInitieleSpelStatus();
  return {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) => {
              if (tile.positieInStreek === 2) {
                return { ...tile, status: "actief" as const, improvement: STERRENCIRKEL, heeftWeg: true };
              }
              // Bruggetje naar de stad-tile (positie 4): zonder dit tussenliggende
              // wegvakje is positie 2 niet daadwerkelijk verbonden (zie wegen.ts).
              if (tile.positieInStreek === 3) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };
}

// Duwt de cultuur naar de drempel van BEZETTE_STREEK_HOOGTE en verwerkt één
// beurt, zodat de streek "in beeld komt" (Deel 2) — gedeelde opzet voor de
// Bezette-Streek-tests.
export function metBezetteStreekInBeeld(): GameState {
  let state = maakInitieleSpelStatus();
  state = { ...state, cultuur: cultuurKostenVoorStreek(BEZETTE_STREEK_HOOGTE), voedsel: 10_000 };
  return volgendeBeurt(state);
}

export function metBezetteStreekEnVerkenner(): GameState {
  const state = metBezetteStreekInBeeld();
  return { ...state, wetenschap: 100, stad: { ...state.stad, verkenners: [{ id: "verkenner-0" }] } };
}

// Zet een actieve, wegverbonden Heiligdom op streek 1 (positie 2, met een
// brugvakje naar de stad), voor tests die cultuur-inkomen nodig hebben.
export function metActiefHeiligdomOpStreek1(state: GameState): GameState {
  return {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte !== 1
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) => {
              if (tile.positieInStreek === 2) {
                return { ...tile, status: "actief" as const, improvement: HEILIGDOM, heeftWeg: true };
              }
              if (tile.positieInStreek === 3) return { ...tile, heeftWeg: true };
              return tile;
            }),
          }
    ),
  };
}

// Bouwt een vaste, wegverbonden corridor (positie 4, elke streek 1..totHoogte)
// zodat een improvement op `totHoogte` als wegverbonden geldt (zie
// wegen.ts: de stad zelf is alleen op hoogte 1 automatisch "doorgang").
export function metWegCorridorNaarStreek(state: GameState, totHoogte: number): GameState {
  return {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte >= 1 && streek.hoogte <= totHoogte
        ? { ...streek, tiles: streek.tiles.map((t) => (t.positieInStreek === 4 ? { ...t, heeftWeg: true } : t)) }
        : streek
    ),
  };
}

// Streek 12 (de streek direct onder de Bezette Streek, BEZETTE_STREEK_HOOGTE
// = 13 — verschoven van 11/12 door "jagen en farmen omdraaien").
export function metBeschermendeWachttorenOpStreek12(state: GameState): GameState {
  let s = metWegCorridorNaarStreek(state, 12);
  s = {
    ...s,
    stad: { ...s.stad, strijders: [{ id: "strijder-wachter", wachttoren: { hoogte: 12, positieInStreek: 4 } }] },
    streken: s.streken.map((streek) =>
      streek.hoogte !== 12
        ? streek
        : {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 4 ? { ...tile, status: "actief" as const, improvement: WACHTTOREN } : tile
            ),
          }
    ),
  };
  return s;
}
