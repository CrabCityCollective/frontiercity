// Gedeelde test-fixtures voor de per-module *.test.ts-bestanden in deze map
// (opgesplitst uit het voorheen monolithische economie.test.ts — issue:
// "Economie.test.ts ook logisch opdelen", zelfde aanpak als de opsplitsing
// van economie.ts zelf, zie het bestandshoofd daar). Alleen fixtures die door
// twee of meer van die bestanden gebruikt worden staan hier; fixtures die
// maar in één bestand nodig zijn, staan lokaal in dat bestand.
import { GameState, Improvement } from "./types";
import {
  CULTUREEL_LAND_IMPROVEMENTS,
  ECONOMISCH_LAND_IMPROVEMENTS,
  MILITAIR_LAND_IMPROVEMENTS,
  STERRENCIRKEL,
  VERKENNER,
} from "./improvements";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { BEZETTE_STREEK_HOOGTE, cultuurKostenVoorStreek } from "./world";
import { WAMPANOAG_STREEK_HOOGTE } from "./worldGoingWest";
import { stuurVerkennerWampanoag, verwerkWampanoagVerkenningInGang } from "./wampanoag";

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

// Genoeg wetenschap en grondstoffen om `stuurVerkenner` te kunnen aanroepen
// (issue: "Bezette streek scherm" — vervangt de eerdere Verkenner-eenheid: er
// hoeft geen aparte unit meer getraind te worden, alleen de kosten moeten
// betaalbaar zijn).
export function metBezetteStreekEnVoorraadVoorVerkenning(): GameState {
  const state = metBezetteStreekInBeeld();
  return { ...state, wetenschap: 100, voorraad: { hout: 100, steen: 100, erts: 100, goud: 100 } };
}

// Onthult direct één vakje van de actieve Bezette Streek met een specifieke
// improvement (issue: "Bezette streek scherm" — vervangt de eerdere `verken`-
// actie-aanroep in tests die niet zelf de Verkenner-flow testen, maar alleen
// een al-onthuld vakje nodig hebben om verder te bouwen).
export function metOnthuldeBezetteStreekTile(state: GameState, positieInStreek: number, improvement: Improvement): GameState {
  const bezetteStreek = state.streken.find((l) => l.bezet)!;
  return {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte !== bezetteStreek.hoogte
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile, index) =>
              index !== positieInStreek ? tile : { ...tile, verhuld: false, status: "actief" as const, improvement }
            ),
          }
    ),
  };
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
// = 13 — verschoven van 11/12 door "jagen en farmen omdraaien"): een
// voltooid, wegverbonden eigen Legerkamp (issue: "Bezette streek scherm" —
// vervangt de eerdere Wachttoren-eis voor een Confrontatie tegen een Bezette
// Streek). Geen bemanning nodig voor de gate zelf (`heeftWerkendeLegerkampOpStreek`
// in militair.ts) — tests die ook legerwaarde nodig hebben, wijzen zelf een
// strijder toe via `bemanLegerkamp`.
export function metLegerkampOpStreek12(state: GameState): GameState {
  let s = metWegCorridorNaarStreek(state, 12);
  s = {
    ...s,
    streken: s.streken.map((streek) =>
      streek.hoogte !== 12
        ? streek
        : {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 4 ? { ...tile, status: "actief" as const, improvement: LEGERKAMP } : tile
            ),
          }
    ),
  };
  return s;
}

// Duwt de Going West-cultuur naar de drempel van WAMPANOAG_STREEK_HOOGTE en
// verwerkt één beurt, zodat de streek "in beeld" komt als blokkerende streek
// en de Wampanoag-laag geïnitialiseerd wordt (M21e, opdracht-wampanoag-
// opening.md §5; blokkerend gemaakt door issue "Wampanoag streek
// blokkerend") — gedeelde opzet voor de Wampanoag-Verkenning-tests, zelfde
// patroon als `metBezetteStreekInBeeld` hierboven. Sinds issue "Weer gewoon
// cultuur voor ontgrendeling" loopt streek-ontgrendeling ook in Going West op
// cultuur, niet meer op wetenschap.
export function metWampanoagLaagInBeeld(): GameState {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, cultuur: cultuurKostenVoorStreek(WAMPANOAG_STREEK_HOOGTE), voedsel: 10_000 };
  return volgendeBeurt(state);
}

// Genoeg wetenschap en grondstoffen om `stuurVerkennerWampanoag` te kunnen
// aanroepen — zelfde patroon als `metBezetteStreekEnVoorraadVoorVerkenning`
// hierboven.
export function metWampanoagLaagEnVoorraadVoorVerkenning(): GameState {
  const state = metWampanoagLaagInBeeld();
  return { ...state, wetenschap: 100, voorraad: { hout: 100, steen: 100, erts: 100, goud: 100 } };
}

// De drie Wampanoag-handelsvakjes onthuld (waarmee, sinds issue "Wampanoag
// streek blokkerend", ook de zes neutrale vakjes automatisch mee onthullen en
// de streek zelf weer normaal ontgrendelt — zie `verwerkWampanoagVerkenningInGang`),
// met genoeg gereedschap/goud om meteen te kunnen handelen (issue "Smederij
// inactief zetten": erts is geen geldige Wampanoag-handelskeuze meer) —
// gedeelde opzet voor de M21f-handelstests (opdracht-wampanoag-opening.md §6), bouwt
// voort op `metWampanoagLaagEnVoorraadVoorVerkenning` hierboven. Stuurt op
// elke positie een verkenner en telt zijn tellertje meteen volledig af, met
// de 1x-per-beurt-limiet telkens teruggezet — zelfde volgorde als de
// M21e-tests in wampanoag.test.ts.
export function metWampanoagLaagOnthuld(): GameState {
  let state = metWampanoagLaagEnVoorraadVoorVerkenning();
  state = { ...state, gereedschap: 100 };
  for (const positieInStreek of [0, 1, 2]) {
    state = stuurVerkennerWampanoag(state, positieInStreek);
    for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) state = verwerkWampanoagVerkenningInGang(state);
    state = { ...state, verkenningGedaanDitBeurt: false };
  }
  return state;
}
