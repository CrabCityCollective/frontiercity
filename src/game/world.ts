// Bouwt de initiële wereldstaat voor de tutorial ("De Eerste Vuren", lagen 1-12).
// Zie frontier-city-design-doc.md hoofdstuk 2 (ruimtelijk model) en hoofdstuk 10 (tutorial-opzet).

import { Layer, Tile } from "./types";

export const BAND_WIDTH_TILES = 9;
export const STAD_POSITIE = 4; // middelste vakje van de band = stad
export const TUTORIAL_LAAG_AANTAL = 12;

// Vaste (niet-procedurele) terreintypes voor de tutorial-lagen — de tutorial is
// vastgelegde inhoud, geen random worldgen zoals bij latere campagnes (hoofdstuk 8).
const TUTORIAL_TERREINTYPES = [
  "oevervlakte",
  "rietmoeras",
  "bosrand",
  "loofbos",
  "heuvelvoet",
  "heuvels",
  "rotsrichel",
  "hooggebergte-voet",
  "naaldwoud",
  "kale hoogvlakte",
  "besneeuwde flank",
  "bergkam",
];

function terreinTypeVoorLaag(hoogte: number): string {
  return TUTORIAL_TERREINTYPES[hoogte - 1] ?? "onbekend";
}

function maakLegeTiles(): Tile[] {
  return Array.from({ length: BAND_WIDTH_TILES }, (_, positieInLaag) => ({
    positieInLaag,
    status: "leeg" as const,
  }));
}

function maakStartLaag(): Layer {
  const tiles = maakLegeTiles();
  tiles[STAD_POSITIE] = {
    positieInLaag: STAD_POSITIE,
    status: "actief",
    improvement: {
      id: "hertenpad-kamp",
      naam: "Het Hertenpad-kamp",
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
    terreinType: terreinTypeVoorLaag(1),
  };
}

function maakVergrendeldeLaag(hoogte: number): Layer {
  return {
    hoogte,
    ontgrendeld: false,
    tiles: maakLegeTiles(),
    terreinType: terreinTypeVoorLaag(hoogte),
  };
}

// De startwereld: laag 1 (startstad) ontgrendeld, lagen 2-12 nog achter fog of war.
export function maakInitieleWereld(): Layer[] {
  return Array.from({ length: TUTORIAL_LAAG_AANTAL }, (_, i) =>
    i === 0 ? maakStartLaag() : maakVergrendeldeLaag(i + 1)
  );
}

// Hoogste ontgrendelde laag = de huidige frontier-grens (hoofdstuk 2).
export function hoogsteOntgrendeldeLaag(lagen: Layer[]): number {
  return lagen.reduce(
    (max, laag) => (laag.ontgrendeld ? Math.max(max, laag.hoogte) : max),
    0
  );
}

// Standaard vooruitkijk = 1 laag verder dan de ontgrendelde grens (terreintype
// zichtbaar, maar geen tile-details) — zie hoofdstuk 2, "Vooruitkijken".
export function isVooruitkijkLaag(laag: Layer, lagen: Layer[]): boolean {
  return laag.hoogte === hoogsteOntgrendeldeLaag(lagen) + 1;
}

// Cultuurdrempel om laag `hoogte` te ontgrendelen (M5, hoofdstuk 5: "cultuur →
// laag-ontgrendeling"). Loopt op naarmate je hoger komt. Exacte cijfers zijn
// nog niet vastgelegd in het design-document (hoofdstuk 14) — dit is een
// bewuste MVP-placeholder, geen definitieve balans. Laag 1 is de startlaag en
// heeft dus geen drempel.
export function cultuurKostenVoorLaag(hoogte: number): number {
  return 10 + (hoogte - 2) * 6;
}
