// Pool van bouwbare land improvements voor de categorie-keuze-UI (M2) en de
// productiewachtrij (M3). Economisch en Cultureel zijn gevuld: economisch
// levert de drie bouwmaterialen en voedsel (M3), cultureel levert cultuur
// voor laag-ontgrendeling (M5). De overige drie categorieën krijgen hun
// opties pas zodra de mechaniek die ze ontsluiten aan de beurt is (groei:
// M6, militair: M7) — zie hoofdstuk 3 en hoofdstuk 13 van het design-document.

import { Improvement } from "./types";

// `uitputtingBeurten` (hoofdstuk 4/14: exacte cijfers nog niet vastgelegd in
// het design-document — dit zijn bewuste MVP-placeholders) bepaalt hoeveel
// beurten een land-improvement actief blijft voordat het een permanente
// ghost-town-tile wordt (M4). Mijnen putten het snelst uit (erts is het
// zeldzaamst), boerderijen het langzaamst.
export const ECONOMISCH_LAND_IMPROVEMENTS: Improvement[] = [
  {
    id: "houtkap",
    naam: "Houtkap",
    categorie: "economisch",
    soort: "land",
    kosten: { steen: 3 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "hout", waarde: 3 },
    uitputtingBeurten: 14,
  },
  {
    id: "steengroeve",
    naam: "Steengroeve",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 3 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "steen", waarde: 2 },
    uitputtingBeurten: 10,
  },
  {
    id: "mijn",
    naam: "Mijn",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 4, steen: 2 },
    bouwtijdBeurten: 3,
    effect: { type: "productie", resource: "erts", waarde: 2 },
    uitputtingBeurten: 6,
  },
  {
    id: "boerderij",
    naam: "Boerderij",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 2 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "voedsel", waarde: 4 },
    uitputtingBeurten: 18,
  },
];

// Cultureel land improvement (hoofdstuk 3: "Heiligdom") — de eerste optie in
// deze categorie, nodig om cultuur te produceren voor laag-ontgrendeling (M5).
export const CULTUREEL_LAND_IMPROVEMENTS: Improvement[] = [
  {
    id: "heiligdom",
    naam: "Heiligdom",
    categorie: "cultureel",
    soort: "land",
    kosten: { hout: 2, steen: 2 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "cultuur", waarde: 2 },
    uitputtingBeurten: 16,
  },
];

const IMPROVEMENT_POOLS: Record<Improvement["categorie"], Improvement[]> = {
  economisch: ECONOMISCH_LAND_IMPROVEMENTS,
  wetenschappelijk: [],
  militair: [],
  civiel: [],
  cultureel: CULTUREEL_LAND_IMPROVEMENTS,
};

// Opties voor de categorie-keuze-UI (hoofdstuk 11: eerst categorie, dan 2-3
// concrete opties). Sluit improvements uit die al op deze laag gebouwd zijn.
export function beschikbareOpties(
  categorie: Improvement["categorie"],
  reedsGebouwdeIds: string[]
): Improvement[] {
  return IMPROVEMENT_POOLS[categorie].filter(
    (improvement) => !reedsGebouwdeIds.includes(improvement.id)
  );
}
