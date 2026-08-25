import test from "node:test";
import assert from "node:assert/strict";
import { beschikbareOpties } from "./improvements";
import { maakInitieleSpelStatus } from "./economie";

// Issue "Weer gewoon cultuur voor ontgrendeling": een eerdere versie
// verborg de Cultureel-categorie tijdens de Going West-openingsfase tot de
// 3-3-3-Wampanoag-handelsdrempel gehaald was (`categorieZichtbaar()`,
// opdracht-wampanoag-opening.md §4/§7). Dat bleek nodeloos ingewikkeld en is
// teruggedraaid — Cultureel-improvements (bijv. Heiligdom) zijn nu, net als
// in de tutorial, gewoon bouwbaar vanaf streek 1, ongeacht `cultureelOntgrendeld`.
test("beschikbareOpties toont Cultureel-improvements al vanaf streek 1 in Going West, ongeacht cultureelOntgrendeld", () => {
  const goingWest = maakInitieleSpelStatus("going-west");
  assert.equal(goingWest.cultureelOntgrendeld, false, "Going West start nog in de openingsfase");

  const opties = beschikbareOpties("cultureel", goingWest.streken[0], goingWest.streken, [], goingWest.campagneId);
  assert.ok(opties.some((i) => i.id === "heiligdom"), "Heiligdom is al bouwbaar vóór de 3-3-3-handelsdrempel");
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
