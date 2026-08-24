import test from "node:test";
import assert from "node:assert/strict";
import { categorieZichtbaar } from "./improvements";

// M21c, opdracht-wampanoag-opening.md §4/§7: tijdens de Wampanoag-openingsfase
// (`cultureelOntgrendeld: false`) blijven Militair en Cultureel verborgen in
// de land-improvement-categoriekeuze; Economisch/Wetenschappelijk/Civiel
// blijven zichtbaar (Civiel toont sowieso al geen opties, zie
// IMPROVEMENT_POOLS.civiel in improvements.ts).
test("categorieZichtbaar verbergt Militair en Cultureel tijdens de openingsfase (cultureelOntgrendeld: false)", () => {
  assert.equal(categorieZichtbaar("militair", false), false);
  assert.equal(categorieZichtbaar("cultureel", false), false);
  assert.equal(categorieZichtbaar("economisch", false), true);
  assert.equal(categorieZichtbaar("wetenschappelijk", false), true);
  assert.equal(categorieZichtbaar("civiel", false), true);
});

// Zodra de 3-3-3-drempel gehaald is (`cultureelOntgrendeld: true`, gezet
// door een latere M21-stap) — en, ongewijzigd, in de tutorial die altijd op
// `true` start — zijn weer alle categorieën zichtbaar.
test("categorieZichtbaar toont elke categorie zodra cultureelOntgrendeld true is (tutorial-gedrag, en Going West na de drempel)", () => {
  assert.equal(categorieZichtbaar("militair", true), true);
  assert.equal(categorieZichtbaar("cultureel", true), true);
  assert.equal(categorieZichtbaar("economisch", true), true);
  assert.equal(categorieZichtbaar("wetenschappelijk", true), true);
  assert.equal(categorieZichtbaar("civiel", true), true);
});
