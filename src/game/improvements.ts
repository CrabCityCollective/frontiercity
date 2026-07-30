// Pool van bouwbare land improvements voor de categorie-keuze-UI (M2) en de
// productiewachtrij (M3). Alleen de Economische categorie is voor nu gevuld:
// dat is de categorie die de drie bouwmaterialen en voedsel oplevert, en dus
// nodig is om de resource-economie (M3) daadwerkelijk te kunnen testen. De
// overige vier categorieën krijgen hun opties pas zodra de mechaniek die ze
// ontsluiten aan de beurt is (wetenschap/cultuur: M5, groei: M6, militair:
// M7) — zie hoofdstuk 3 en hoofdstuk 13 van het design-document.

import { Improvement } from "./types";

export const ECONOMISCH_LAND_IMPROVEMENTS: Improvement[] = [
  {
    id: "houtkap",
    naam: "Houtkap",
    categorie: "economisch",
    soort: "land",
    kosten: { steen: 3 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "hout", waarde: 3 },
  },
  {
    id: "steengroeve",
    naam: "Steengroeve",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 3 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "steen", waarde: 2 },
  },
  {
    id: "mijn",
    naam: "Mijn",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 4, steen: 2 },
    bouwtijdBeurten: 3,
    effect: { type: "productie", resource: "erts", waarde: 2 },
  },
  {
    id: "boerderij",
    naam: "Boerderij",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 2 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "voedsel", waarde: 4 },
  },
];

const IMPROVEMENT_POOLS: Record<Improvement["categorie"], Improvement[]> = {
  economisch: ECONOMISCH_LAND_IMPROVEMENTS,
  wetenschappelijk: [],
  militair: [],
  civiel: [],
  cultureel: [],
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
