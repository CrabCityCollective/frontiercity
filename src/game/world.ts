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

// Dreigingsniveau per laag (M7, hoofdstuk 6): de tegenstandersterkte bij een
// militaire confrontatie op die laag, gebruikt door `confrontatie` in
// economie.ts. Vastgelegde tutorial-waarden, oplopend met de hoogte — net
// als cultuurKostenVoorLaag een bewuste MVP-placeholder (hoofdstuk 14: de
// exacte winkans-formule ligt nog niet vast). Laag 1 is de startlaag en dus
// dreigingsvrij.
function dreigingsniveauVoorLaag(hoogte: number): number {
  return Math.max(0, (hoogte - 1) * 2);
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
      id: "holenrots",
      naam: "Holenrots",
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
    dreigingsniveau: dreigingsniveauVoorLaag(1),
  };
}

function maakVergrendeldeLaag(hoogte: number): Layer {
  return {
    hoogte,
    ontgrendeld: false,
    tiles: maakLegeTiles(),
    terreinType: terreinTypeVoorLaag(hoogte),
    dreigingsniveau: dreigingsniveauVoorLaag(hoogte),
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

// Hoeveel nog-onontdekte mist-lagen we, naast de ene vooruitkijk-laag, boven
// de frontier tonen (issue: "haal een paar onontdekte tegels weg, die zijn
// voor nu niet relevant"). Zonder deze grens rendert de canvas alle 12
// tutorial-lagen vanaf het begin, wat de stad onderaan ver buiten beeld
// scrollt — met deze grens blijft de zichtbare kaart beperkt tot wat relevant
// is: de ontgrendelde lagen, de vooruitkijk-laag, en een klein stukje mist
// erboven zodat de kaart niet abrupt afgesneden oogt.
const ZICHTBARE_MIST_LAGEN_BOVEN_VOORUITKIJK = 2;

// Het deel van `lagen` dat daadwerkelijk op de canvas gerenderd wordt (zie
// GameCanvas/tekenWereld). Snijdt simpelweg de bovenste, (nog) niet-relevante
// mist-lagen af — de resterende hoogtes blijven 1..N zonder gaten, dus de
// bestaande rij-geometrie (hoogte → canvas-rij) blijft ongewijzigd werken.
export function zichtbareLagen(lagen: Layer[]): Layer[] {
  const frontier = hoogsteOntgrendeldeLaag(lagen);
  const maxHoogte = Math.min(
    lagen.length,
    frontier + 1 + ZICHTBARE_MIST_LAGEN_BOVEN_VOORUITKIJK
  );
  return lagen.filter((laag) => laag.hoogte <= maxHoogte);
}

// Cultuurdrempel om laag `hoogte` te ontgrendelen (M5, hoofdstuk 5: "cultuur →
// laag-ontgrendeling"). Loopt op naarmate je hoger komt. Exacte cijfers zijn
// nog niet vastgelegd in het design-document (hoofdstuk 14) — dit is een
// bewuste MVP-placeholder, geen definitieve balans. Laag 1 is de startlaag en
// heeft dus geen drempel.
export function cultuurKostenVoorLaag(hoogte: number): number {
  return 10 + (hoogte - 2) * 6;
}

// Voedseldrempel om de groei-tier klein→middel te mogen starten (M6,
// hoofdstuk 4/5: "voedsel verzameld richting groei-drempels"). Bereiken van
// de drempel ontgrendelt alleen de keuze — groei start pas als de speler dit
// bewust kiest (hoofdstuk 11: "een bewuste gok, geen gratis extra beloning"),
// in tegenstelling tot de automatische laag-ontgrendeling bij cultuur (M5).
// Net als cultuurKostenVoorLaag een bewuste MVP-placeholder (hoofdstuk 14);
// de MVP-scope beperkt zich tot deze ene groei-stap (hoofdstuk 13), dus geen
// aparte formule per grootte-tier nodig.
export const VOEDSEL_DREMPEL_GROEI = 40;
