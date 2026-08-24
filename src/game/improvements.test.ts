import test from "node:test";
import assert from "node:assert/strict";
import { beschikbareOpties, categorieZichtbaar } from "./improvements";
import { maakInitieleSpelStatus } from "./economie";

// Issue "Going west campaign geen tutorial": tijdens de Wampanoag-openingsfase
// (`cultureelOntgrendeld: false`) blijft alleen Cultureel verborgen in de
// land-improvement-categoriekeuze — Militair stond hier eerder ook bij
// (opdracht-wampanoag-opening.md §4), maar dat bleek een ongewenste
// tutorial-achtige beperking: de speler moet vanaf streek 1 alles kunnen
// bouwen, op Cultureel na. Economisch/Wetenschappelijk/Militair/Civiel
// blijven zichtbaar (Civiel toont sowieso al geen opties, zie
// IMPROVEMENT_POOLS.civiel in improvements.ts).
test("categorieZichtbaar verbergt alleen Cultureel tijdens de openingsfase (cultureelOntgrendeld: false)", () => {
  assert.equal(categorieZichtbaar("militair", false), true);
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

// Issue "Going west campaign geen tutorial": Houtkap/Mijn (minStreek 2/3, zie
// improvements.ts) blijven in de tutorial gated, maar Going West (elke
// `campagneId` anders dan `undefined`) mag ze al vanaf streek 1 bouwen — de
// tutorial-tempobeperking hoort niet automatisch ook voor andere campagnes te
// gelden.
test("beschikbareOpties negeert minStreek zodra er een campagne actief is, maar niet in de tutorial", () => {
  const tutorial = maakInitieleSpelStatus();
  const goingWest = maakInitieleSpelStatus("going-west");

  const tutorialOpties = beschikbareOpties(
    "economisch",
    tutorial.streken[0],
    tutorial.streken,
    [],
    tutorial.campagneId
  );
  const goingWestOpties = beschikbareOpties(
    "economisch",
    goingWest.streken[0],
    goingWest.streken,
    [],
    goingWest.campagneId
  );

  assert.ok(!tutorialOpties.some((i) => i.id === "houtkap"), "tutorial houdt Houtkap gated tot streek 2");
  assert.ok(!tutorialOpties.some((i) => i.id === "mijn"), "tutorial houdt Mijn gated tot streek 3");
  assert.ok(goingWestOpties.some((i) => i.id === "houtkap"), "Going West laat Houtkap al op streek 1 bouwen");
  assert.ok(goingWestOpties.some((i) => i.id === "mijn"), "Going West laat Mijn al op streek 1 bouwen");
});
