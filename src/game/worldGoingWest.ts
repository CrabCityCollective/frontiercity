// Vaste (niet-procedurele) campagnewereld voor de Amerikaanse frontier-campagne
// ("Going West", hoofdstuk 8/9/14 design-doc) — M20b (hoofdstuk 13/15). Zelfde
// patroon als de tutorial-worldgen (world.ts): losse `Record<hoogte, ...>`-
// tabellen voor terreintype/subtype/vers-water/amberader/dreigingsniveau,
// hier volledig losstaand van de tutorial-tabellen gehouden zodat die
// ongewijzigd blijven (CLAUDE.md). Besloten (issue #247, hoofdstuk 8/11): een
// handgeschreven, vaste kaart in plaats van seeded-RNG/procedurele
// streek-generatie — dezelfde reden als de tutorial-kaart, nu bewust ook
// gekozen voor een veel langere campagne.
//
// Scope-grens (hoofdstuk 13, milestone-tabel): M20b levert alleen de
// kaartdata; de vers-water-dichtheid hieronder is sinds M20c geverifieerd
// tegen `gegarandeerdeStichtingskansHoogten()` (`vindStichtingskansGaten()`,
// stad.ts — zie worldGoingWest.test.ts) en bleek zonder aanpassingen al aan
// de garantie te voldoen. Sinds M20d deelstap 1 kan `maakInitieleSpelStatus()`
// (initieleSpelStatus.ts) hier al doorheen bouwen (via een expliciete
// `campagneId`-parameter), en sinds M20d deelstap 3 loopt die `campagneId`
// ook al helemaal door van `CampagneSelectScherm` (via AppRoot/GameRoot) tot
// aan `useGameEngine()`. `CampagneSelectScherm` toont Going West voorlopig
// echter nog altijd als `beschikbaar: false` ("Binnenkort beschikbaar") —
// pas de laatste M20d-deelstap zet die knop aan, zie het M20d-issue.

import { Streek, TerreinType, Tile } from "./types";

export const BAND_WIDTH_TILES = 9;
export const STAD_POSITIE = 4; // middelste vakje van de band = stad — zelfde conventie als de tutorial

// "Normaal"-lengte uit hoofdstuk 14 (30-40 streken); Makkelijk/Moeilijk-
// varianten zijn expliciet geen harde M20b-eis (hoofdstuk 13) en volgen als
// latere uitbreiding.
export const GOING_WEST_STREEK_AANTAL = 35;

// Vaste, beschrijvende terreinnaam per streek (flavor, geen invloed op
// spelmechaniek — zelfde rol als TUTORIAL_TERREINTYPES in world.ts). Volgt de
// reisroute van rivierdelta/prairie, via canyons/mesa's, over het hooggebergte,
// en weer naar beneden richting de Pacifische kust.
const GOING_WEST_TERREINTYPES = [
  "rivierdelta",
  "grasvlakte",
  "prairie",
  "wilgenbosjes",
  "rollende heuvels",
  "korenvelden",
  "essenbos",
  "heuvelrug",
  "kalksteenrichel",
  "droge vlakte",
  "canyonrand",
  "mesa",
  "zandsteenplateau",
  "ravijn",
  "cottonwood-oase",
  "steppegras",
  "rotsformaties",
  "voorgebergte",
  "dennenwoud",
  "granietrichel",
  "bergpas",
  "alpenweide",
  "sneeuwgrens",
  "gletsjerrand",
  "hooggebergte",
  "bergmeeroever",
  "keienveld",
  "wolkenkam",
  "westhelling",
  "dennenbos-afdaling",
  "beekdal",
  "goudgraversvallei",
  "populierenbos",
  "rivierbocht",
  "pacifische kust",
];

function terreinTypeVoorStreek(hoogte: number): string {
  return GOING_WEST_TERREINTYPES[hoogte - 1] ?? "onbekend";
}

// Vast terrein-subtype per vakje binnen elke streek — zelfde conventie als
// TUTORIAL_TILE_TERREIN in world.ts (index = `positieInStreek`, 0-8; index 4
// is het stad-vakje op streek 1, elders een gewoon vakje). Elke streek houdt
// bewust minstens één vakje van elk van `bos`, `heuvel`/`berg` en `vlak` aan
// (zelfde mix-conventie als de tutorial), terwijl de verhouding duidelijk
// verschuift met de hoogte: vlakke prairie (streek 1-9) → canyons/mesa's
// (10-18) → hooggebergte (19-27) → afdaling naar de kust (28-35).
const GOING_WEST_TILE_TERREIN: Record<number, TerreinType[]> = {
  1: ["vlak", "vlak", "vlak", "bos", "vlak", "vlak", "heuvel", "vlak", "vlak"],
  2: ["vlak", "bos", "vlak", "vlak", "heuvel", "vlak", "vlak", "bos", "vlak"],
  3: ["bos", "vlak", "vlak", "heuvel", "vlak", "vlak", "vlak", "bos", "vlak"],
  4: ["vlak", "vlak", "bos", "vlak", "heuvel", "vlak", "bos", "vlak", "vlak"],
  5: ["vlak", "bos", "vlak", "vlak", "bos", "heuvel", "vlak", "vlak", "bos"],
  6: ["bos", "vlak", "heuvel", "vlak", "vlak", "bos", "vlak", "heuvel", "vlak"],
  7: ["vlak", "heuvel", "vlak", "bos", "vlak", "heuvel", "vlak", "vlak", "bos"],
  8: ["heuvel", "vlak", "bos", "vlak", "heuvel", "vlak", "bos", "vlak", "vlak"],
  9: ["vlak", "bos", "heuvel", "vlak", "vlak", "heuvel", "vlak", "bos", "vlak"],
  10: ["heuvel", "vlak", "heuvel", "bos", "vlak", "heuvel", "vlak", "berg", "vlak"],
  11: ["berg", "heuvel", "vlak", "heuvel", "bos", "vlak", "heuvel", "vlak", "berg"],
  12: ["heuvel", "berg", "vlak", "heuvel", "vlak", "bos", "berg", "heuvel", "vlak"],
  13: ["vlak", "heuvel", "berg", "heuvel", "bos", "heuvel", "vlak", "berg", "heuvel"],
  14: ["berg", "heuvel", "vlak", "berg", "heuvel", "bos", "heuvel", "vlak", "berg"],
  15: ["heuvel", "berg", "heuvel", "vlak", "bos", "heuvel", "berg", "heuvel", "vlak"],
  16: ["berg", "vlak", "heuvel", "berg", "bos", "heuvel", "vlak", "berg", "heuvel"],
  17: ["heuvel", "berg", "heuvel", "bos", "heuvel", "vlak", "berg", "heuvel", "berg"],
  18: ["berg", "heuvel", "berg", "heuvel", "bos", "heuvel", "berg", "vlak", "heuvel"],
  19: ["berg", "berg", "heuvel", "bos", "vlak", "berg", "heuvel", "berg", "berg"],
  20: ["berg", "vlak", "berg", "berg", "vlak", "heuvel", "berg", "bos", "berg"],
  21: ["heuvel", "berg", "berg", "bos", "berg", "heuvel", "berg", "vlak", "berg"],
  22: ["berg", "berg", "heuvel", "berg", "vlak", "berg", "bos", "berg", "heuvel"],
  23: ["berg", "heuvel", "berg", "vlak", "berg", "bos", "berg", "berg", "heuvel"],
  24: ["heuvel", "berg", "berg", "berg", "bos", "berg", "heuvel", "vlak", "berg"],
  25: ["berg", "berg", "vlak", "berg", "heuvel", "berg", "bos", "berg", "berg"],
  26: ["berg", "bos", "berg", "heuvel", "berg", "vlak", "berg", "berg", "heuvel"],
  27: ["heuvel", "berg", "berg", "vlak", "berg", "berg", "bos", "berg", "berg"],
  28: ["berg", "heuvel", "berg", "bos", "vlak", "heuvel", "berg", "vlak", "heuvel"],
  29: ["heuvel", "berg", "bos", "heuvel", "vlak", "berg", "heuvel", "vlak", "bos"],
  30: ["berg", "bos", "heuvel", "vlak", "heuvel", "bos", "vlak", "berg", "heuvel"],
  31: ["bos", "heuvel", "vlak", "bos", "heuvel", "vlak", "berg", "bos", "vlak"],
  32: ["vlak", "bos", "heuvel", "vlak", "bos", "vlak", "heuvel", "bos", "vlak"],
  33: ["bos", "vlak", "bos", "heuvel", "vlak", "bos", "vlak", "heuvel", "vlak"],
  34: ["vlak", "bos", "vlak", "bos", "heuvel", "vlak", "bos", "vlak", "bos"],
  35: ["bos", "vlak", "bos", "vlak", "bos", "vlak", "heuvel", "bos", "vlak"],
};

function terreinVoorTile(hoogte: number, positieInStreek: number): TerreinType {
  return GOING_WEST_TILE_TERREIN[hoogte]?.[positieInStreek] ?? "vlak";
}

// Vakjes die aan vers water liggen (hoofdstuk 2: alleen hier mag gesticht
// worden). In tegenstelling tot de tutorial (precies één, uitsluitend op de
// allerlaatste streek — de tutorial laat het herhalende stichtingspatroon
// bewust nooit meer dan die ene keer zien, hoofdstuk 9/13) heeft de Going
// West-kaart hier meerdere, over de hele route verspreide vakjes nodig zodra
// het stichtingspatroon speelbaar wordt. Interval hier is ruwweg om de 3-4
// streken, met het laatste vakje op de laatste streek (35) — M20c
// (`vindStichtingskansGaten()`, stad.ts, getoetst in worldGoingWest.test.ts)
// bevestigt dat deze dichtheid alle drie de kans-vensters uit
// `gegarandeerdeStichtingskansHoogten()` een treffer geeft, ongeacht op welke
// van deze hoogten daadwerkelijk gesticht wordt. Op een `vlak`-vakje gekozen
// (nooit het stad-centrum, positie 4), zelfde reden als de tutorial: ook
// bruikbaar als Boerderij-kandidaat.
const GOING_WEST_VERS_WATER: Record<number, number[]> = {
  4: [1],
  8: [3],
  12: [2],
  16: [1],
  20: [1],
  24: [7],
  28: [7],
  32: [3],
  35: [8],
};

function versWaterVoorTile(hoogte: number, positieInStreek: number): boolean {
  return GOING_WEST_VERS_WATER[hoogte]?.includes(positieInStreek) ?? false;
}

// Amberader/goudmijn-vondsten (hoofdstuk 3/14) — vast en niet-procedureel,
// net als TUTORIAL_AMBER in world.ts. Altijd op een heuvel/bergvakje (de
// gewone mijn-terreineis, zie `improvementPastOpTile` in improvements.ts),
// verspreid over de canyon/mesa- en hooggebergte-zones waar die vakjes
// veruit het talrijkst zijn.
const GOING_WEST_AMBER: Record<number, number[]> = {
  11: [0],
  15: [1],
  19: [2],
  23: [1],
  27: [0],
  31: [6],
};

function amberVoorTile(hoogte: number, positieInStreek: number): boolean {
  return GOING_WEST_AMBER[hoogte]?.includes(positieInStreek) ?? false;
}

// Dreigingsniveau per streek (hoofdstuk 6) — zelfde MVP-placeholder-formule
// als de tutorial (`dreigingsniveauVoorStreek` in world.ts): exacte
// winkans-cijfers liggen nog niet vast (hoofdstuk 14), oplopend met de
// hoogte. Streek 1 is de startstreek en dus dreigingsvrij.
function dreigingsniveauVoorStreek(hoogte: number): number {
  return Math.max(0, (hoogte - 1) * 2);
}

function maakLegeTiles(hoogte: number): Tile[] {
  return Array.from({ length: BAND_WIDTH_TILES }, (_, positieInStreek) => ({
    positieInStreek,
    terrein: terreinVoorTile(hoogte, positieInStreek),
    status: "leeg" as const,
    versWater: versWaterVoorTile(hoogte, positieInStreek),
    amber: amberVoorTile(hoogte, positieInStreek),
  }));
}

// Placeholder-startnederzetting (naam/flavor is bewust nog geen inhoudelijke
// content — dat hoort bij de Anker-uitwerking, hoofdstuk 9/15, niet bij deze
// kaart-milestone). Zelfde tile-opzet als `maakStartStreek` in world.ts.
export const GOING_WEST_STARTSTAD_NAAM = "Startkamp";

function maakStartStreek(): Streek {
  const tiles = maakLegeTiles(1);
  tiles[STAD_POSITIE] = {
    positieInStreek: STAD_POSITIE,
    terrein: terreinVoorTile(1, STAD_POSITIE),
    status: "actief",
    heeftWeg: true,
    improvement: {
      id: "startkamp",
      naam: GOING_WEST_STARTSTAD_NAAM,
      categorie: "civiel",
      soort: "city",
      kosten: {},
      bouwtijdBeurten: 0,
      effect: { type: "stad" },
    },
  };
  return {
    hoogte: 1,
    ontgrendeld: true,
    tiles,
    terreinType: terreinTypeVoorStreek(1),
    dreigingsniveau: dreigingsniveauVoorStreek(1),
  };
}

function maakVergrendeldeStreek(hoogte: number): Streek {
  return {
    hoogte,
    ontgrendeld: false,
    tiles: maakLegeTiles(hoogte),
    terreinType: terreinTypeVoorStreek(hoogte),
    dreigingsniveau: dreigingsniveauVoorStreek(hoogte),
  };
}

// De startwereld voor de Going West-campagne: streek 1 (startstad)
// ontgrendeld, de rest nog achter fog of war — zelfde opzet als
// `maakInitieleWereld` in world.ts, nog niet aangesloten op een daadwerkelijke
// run (zie modulekop).
export function maakInitieleWereldGoingWest(): Streek[] {
  return Array.from({ length: GOING_WEST_STREEK_AANTAL }, (_, i) =>
    i === 0 ? maakStartStreek() : maakVergrendeldeStreek(i + 1)
  );
}
