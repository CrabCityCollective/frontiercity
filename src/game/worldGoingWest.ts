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

import { Streek, TerreinType, Tile, WampanoagInhoud } from "./types";

export const BAND_WIDTH_TILES = 9;
export const STAD_POSITIE = 4; // middelste vakje van de band = stad — zelfde conventie als de tutorial

// "Normaal"-lengte uit hoofdstuk 14 (30-40 streken); Makkelijk/Moeilijk-
// varianten zijn expliciet geen harde M20b-eis (hoofdstuk 13) en volgen als
// latere uitbreiding.
export const GOING_WEST_STREEK_AANTAL = 35;

// Streek-hoogte van de Wampanoag-laag (M21e, opdracht-wampanoag-opening.md
// §5) — het einde van de openingsfase (streek 1-3 lopen op wetenschap, zie
// `wetenschapKostenVoorStreekOntgrendeling` in world.ts). Gedeeld met
// streekOntgrendeling.ts (de trigger, in de wetenschap-gedreven
// ontgrendel-lus) en wampanoag.ts (de Verkenning-flow zelf) zodat beide
// dezelfde hoogte hanteren.
export const WAMPANOAG_STREEK_HOOGTE = 4;

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

// Geëxporteerd (M20f, hoofdstuk 9/19 design-doc): `goingWestContent.ts`
// hergebruikt deze namen als streek-`naam` zolang er nog geen echte
// flavor-tekst per streek geschreven is (issue #278, blocker 1 vervolg).
export function terreinTypeVoorStreek(hoogte: number): string {
  return GOING_WEST_TERREINTYPES[hoogte - 1] ?? "onbekend";
}

// Vast terrein-subtype per vakje binnen elke streek — zelfde conventie als
// TUTORIAL_TILE_TERREIN in world.ts (index = `positieInStreek`, 0-8; index 4
// is het stad-vakje op streek 1, elders een gewoon vakje). Elke streek houdt
// bewust minstens één vakje van elk van `bos`, `heuvel`/`berg` en `vlak` aan
// (zelfde mix-conventie als de tutorial), terwijl de verhouding duidelijk
// verschuift met de hoogte: vlakke prairie (streek 1-9) → canyons/mesa's
// (10-18) → hooggebergte (19-27) → afdaling naar de kust (28-35).
// Streek 1-4 (opdracht-wampanoag-opening.md, de openingsfase vóór de eerste
// Anker) kregen oorspronkelijk vrijwel dezelfde krappe mix als de tutorial —
// op elke streek maar één heuvel-vakje en (voor streek 1) helemaal geen
// berg-vakje. Sinds `beschikbareOpties` (improvements.ts) de tutorial-
// `minStreek`-tempobeperking niet meer toepast op Going West (issue: "Going
// west campaign geen tutorial") kan de speler daardoor al vanaf streek 1
// tegelijk Steengroeve, Mijn, Amberader en Wachttoren willen bouwen, terwijl
// er maar één geschikt vakje voor was. Streek 1-4 hebben daarom hier een
// ruimere heuvel/berg-mix (3 in plaats van 1) gekregen, zodat "alle
// grondstoffen komen in principe al op streek 1 voor" ook daadwerkelijk
// tegelijk bouwbaar is — zie ook `GOING_WEST_AMBER` hieronder voor de
// bijbehorende amber-vondst op streek 1. Streek 4 houdt positie 0/1/2 bewust
// ongewijzigd (vlak/vlak/bos): die liggen vast voor de Wampanoag-laag
// (`WAMPANOAG_STREEK_INHOUD` hieronder). Streek 5 en verder blijven
// ongewijzigd — de kaart verschuift daar toch al vanzelf naar meer
// heuvel/berg (canyons/mesa's, zie de modulekop).
const GOING_WEST_TILE_TERREIN: Record<number, TerreinType[]> = {
  1: ["heuvel", "bos", "vlak", "bos", "vlak", "vlak", "heuvel", "vlak", "berg"],
  2: ["heuvel", "bos", "vlak", "heuvel", "bos", "vlak", "berg", "bos", "vlak"],
  3: ["bos", "heuvel", "vlak", "bos", "berg", "vlak", "heuvel", "bos", "vlak"],
  4: ["vlak", "vlak", "bos", "heuvel", "berg", "vlak", "bos", "heuvel", "vlak"],
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

// Vaste inhoud-verdeling van de Wampanoag-laag (M21e, opdracht-wampanoag-
// opening.md §5): drie vaste vakjes op `WAMPANOAG_STREEK_HOOGTE` (streek 4),
// met het terrein-subtype van dat vakje (`GOING_WEST_TILE_TERREIN` hierboven)
// bepalend voor welk gebouw er ligt zodra het onthuld wordt (opdracht:
// "terrein bepaalt welk van de drie gebouwen ergens kán liggen ... geen
// aparte trekking/keuze-UI nodig"):
// - Beverjachthut vereist vers water — `GOING_WEST_VERS_WATER[4]` heeft maar
//   één zo'n vakje (positie 1), dus die ligt hier vast.
// - Maïsboerderij vereist vlakke grond — positie 0 (`vlak`, geen vers water).
// - Opperhoofdtent heeft geen terrein-eis (Cultureel/diplomatiek van aard,
//   opdracht §2) — positie 2 (toevallig `bos`, maakt voor dit gebouw niet uit).
// Positie 4 (het middelste vakje) blijft bewust neutraal, zelfde conventie
// als `TUTORIAL_BEZETTE_STREEK_INHOUD` in world.ts: niet elk vakje van een
// verhullingslaag hoeft bijzondere inhoud te dragen.
const WAMPANOAG_STREEK_INHOUD: Record<number, WampanoagInhoud> = {
  0: "maisboerderij",
  1: "beverjachthut",
  2: "opperhoofdtent",
};

// Initialiseert de Wampanoag-laag zodra streek 4 ontgrendelt tijdens de
// Going West-openingsfase (streekOntgrendeling.ts:
// `verwerkStreekOntgrendeling`) — mirroring van `initialiseerBezetteStreek`
// (world.ts), maar bewust géén `Streek.bezet`-achtige vlag: streek 4 blijft
// in elk ander opzicht een heel normale, ontgrendelde streek (M21e,
// opdracht-wampanoag-opening.md §5 — "eigen, parallelle onthullings-flow, los
// van de bestaande Bezette-Streek-toestandsmachine"). Alleen de drie vakjes
// uit `WAMPANOAG_STREEK_INHOUD` hierboven krijgen `wampanoagVerhuld: true` —
// de overige zes vakjes blijven ongewijzigd, gewoon meteen bebouwbaar zodra
// de speler ze bereikt.
export function initialiseerWampanoagLaag(streek: Streek): Streek {
  return {
    ...streek,
    tiles: streek.tiles.map((tile) => {
      const inhoud = WAMPANOAG_STREEK_INHOUD[tile.positieInStreek];
      return inhoud ? { ...tile, wampanoagVerhuld: true, wampanoagInhoud: inhoud } : tile;
    }),
  };
}

// Amberader/goudmijn-vondsten (hoofdstuk 3/14) — vast en niet-procedureel,
// net als TUTORIAL_AMBER in world.ts. Altijd op een heuvel/bergvakje (de
// gewone mijn-terreineis, zie `improvementPastOpTile` in improvements.ts).
// Streek 1 heeft, anders dan de tutorial (waar Amberader pas op streek 8
// verschijnt, zie AMBER_ONTDEKKING_STREEK in world.ts), meteen al een vondst
// op het berg-vakje (positie 8, GOING_WEST_TILE_TERREIN hierboven) — issue:
// "Going west campaign geen tutorial", "alle grondstoffen moeten in principe
// voorkomen op streek 1" (dus ook goud). De rest van de vondsten blijft
// verspreid over de canyon/mesa- en hooggebergte-zones waar heuvel/berg-
// vakjes veruit het talrijkst zijn.
const GOING_WEST_AMBER: Record<number, number[]> = {
  1: [8],
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
