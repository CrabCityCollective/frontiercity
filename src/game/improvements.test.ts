import test from "node:test";
import assert from "node:assert/strict";
import { ECONOMISCH_LAND_IMPROVEMENTS, beschikbareOpties, improvementPastOpTile } from "./improvements";
import { maakInitieleSpelStatus } from "./economie";

const RANCH = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "ranch")!;

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

// Issue "Ranch": de Ranch mag alleen op een vakje met een actieve wilde
// kudde staan (`improvementPastOpTile`), net zoals de Goudader alleen op een
// vakje met een goudader mag — geen `terreinEisen`, dus zonder deze check zou
// de Ranch overal op elk terreintype geplaatst kunnen worden.
test("improvementPastOpTile staat de Ranch alleen toe op een vakje met een wilde kudde", () => {
  const state = maakInitieleSpelStatus("going-west");
  const tileZonderKudde = state.streken[0].tiles[0];
  const tileMetKudde = { ...state.streken[0].tiles[0], kudde: { beurtenResterend: 4 } };

  assert.equal(improvementPastOpTile(RANCH, tileZonderKudde), false);
  assert.equal(improvementPastOpTile(RANCH, tileMetKudde), true);
});

// Issue "Ranch": bouwbaar zodra de speler "veeteelt" gekozen heeft (Going
// West-exclusief, `vereisteCampagneId`), én alleen als er ook daadwerkelijk
// een leeg vakje met een kudde op de streek staat.
test("beschikbareOpties toont Ranch alleen in Going West, met veeteelt gekozen én een kudde-vakje beschikbaar", () => {
  const state = maakInitieleSpelStatus("going-west");
  const streekMetKudde = {
    ...state.streken[0],
    tiles: state.streken[0].tiles.map((tile, index) =>
      index === 0 ? { ...tile, kudde: { beurtenResterend: 4 } } : tile
    ),
  };
  const streken = state.streken.map((streek) => (streek.hoogte === streekMetKudde.hoogte ? streekMetKudde : streek));

  const zonderTech = beschikbareOpties("economisch", streekMetKudde, streken, [], "going-west");
  assert.ok(!zonderTech.some((i) => i.id === "ranch"), "zonder veeteelt is de Ranch nog niet ontgrendeld");

  const metTech = beschikbareOpties("economisch", streekMetKudde, streken, ["veeteelt"], "going-west");
  assert.ok(metTech.some((i) => i.id === "ranch"), "met veeteelt en een kudde-vakje is de Ranch bouwbaar");

  const tutorialMetTech = beschikbareOpties("economisch", streekMetKudde, streken, ["veeteelt"], undefined);
  assert.ok(!tutorialMetTech.some((i) => i.id === "ranch"), "de Ranch blijft Going West-exclusief, ook met veeteelt");

  const zonderKuddeVakje = beschikbareOpties("economisch", state.streken[0], state.streken, ["veeteelt"], "going-west");
  assert.ok(!zonderKuddeVakje.some((i) => i.id === "ranch"), "zonder kudde-vakje is de Ranch nergens plaatsbaar");
});
