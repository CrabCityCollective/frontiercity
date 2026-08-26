import test from "node:test";
import assert from "node:assert/strict";
import {
  campagneConfig,
  GOING_WEST_CAMPAGNE,
  introContentVoorCampagne,
  oceaanUitlegVoorCampagne,
  popupContent,
  streekContentVoorCampagne,
} from "./campagnes";
import { INTRO_TITEL, OCEAAN_UITLEG_TITEL, streekContent } from "./tutorialContent";
import { GOING_WEST_STREEK_AANTAL } from "./worldGoingWest";
import {
  AMBERADER,
  BARAKKEN,
  BIBLIOTHEEK,
  GROTE_TEMPEL,
  GROTE_WOONWIJK,
  HEILIGDOM,
  LEGERKAMP,
  MARKT,
  MILITAIR_LAND_IMPROVEMENTS,
  MISSIONARIS,
  OFFER_ALTAAR,
  OPSLAGPLAATS,
  STERRENCIRKEL,
  TEMPEL,
  VERKENNER,
  VOORRAADKUIL,
  WOONWIJK,
  improvementNaam,
} from "./improvements";

const WACHTTOREN = MILITAIR_LAND_IMPROVEMENTS.find((i) => i.id === "wachttoren")!;

test("GOING_WEST_CAMPAGNE volgt de weergavenamen-tabel uit hoofdstuk 9 van het design-document", () => {
  assert.equal(GOING_WEST_CAMPAGNE.id, "going-west");
  assert.equal(GOING_WEST_CAMPAGNE.naam, "Going West");

  // Land improvements
  assert.equal(improvementNaam(STERRENCIRKEL, GOING_WEST_CAMPAGNE), "Observatorium");
  assert.equal(improvementNaam(AMBERADER, GOING_WEST_CAMPAGNE), "Goudmijn");
  assert.equal(improvementNaam(WACHTTOREN, GOING_WEST_CAMPAGNE), "Blokhuis");
  assert.equal(improvementNaam(LEGERKAMP, GOING_WEST_CAMPAGNE), "Fort");
  assert.equal(improvementNaam(HEILIGDOM, GOING_WEST_CAMPAGNE), "Kapel");
  assert.equal(improvementNaam(OFFER_ALTAAR, GOING_WEST_CAMPAGNE), "Opwekkingstent");

  // City improvements
  assert.equal(improvementNaam(MARKT, GOING_WEST_CAMPAGNE), "Handelspost");
  assert.equal(improvementNaam(OPSLAGPLAATS, GOING_WEST_CAMPAGNE), "Pakhuis");
  assert.equal(improvementNaam(BIBLIOTHEEK, GOING_WEST_CAMPAGNE), "Schoolhuis");
  assert.equal(improvementNaam(BARAKKEN, GOING_WEST_CAMPAGNE), "Garnizoen");
  assert.equal(improvementNaam(TEMPEL, GOING_WEST_CAMPAGNE), "Kerk");
  assert.equal(improvementNaam(GROTE_TEMPEL, GOING_WEST_CAMPAGNE), "Kathedraal");
  assert.equal(improvementNaam(WOONWIJK, GOING_WEST_CAMPAGNE), "Hoofdstraat");
  assert.equal(improvementNaam(GROTE_WOONWIJK, GOING_WEST_CAMPAGNE), "Spoorwegstation");

  // Units
  assert.equal(improvementNaam(VERKENNER, GOING_WEST_CAMPAGNE), "Spoorzoeker");
  assert.equal(improvementNaam(MISSIONARIS, GOING_WEST_CAMPAGNE), "Prediker");
});

test("generieke land improvements zonder Amerikaanse naam vallen terug op de tutorial-naam", () => {
  assert.equal(improvementNaam(VOORRAADKUIL, GOING_WEST_CAMPAGNE), VOORRAADKUIL.naam);
});

test("zonder campagne (tutorial) blijft improvementNaam altijd de tutorial-naam geven", () => {
  assert.equal(improvementNaam(STERRENCIRKEL), "Sterrencirkel");
});

test("campagneConfig zoekt een CampaignConfig op via GameState.campagneId, undefined/onbekend geeft undefined (M20d deelstap 1)", () => {
  assert.equal(campagneConfig("going-west"), GOING_WEST_CAMPAGNE);
  assert.equal(campagneConfig(undefined), undefined);
  assert.equal(campagneConfig("onbekende-campagne"), undefined);
});

test("streekContentVoorCampagne geeft de tutorial-content terug zonder campagne (hoofdstuk 19, blocker 1 vervolg, issue #278)", () => {
  assert.deepEqual(streekContentVoorCampagne(undefined, 1), streekContent(1));
  assert.equal(streekContentVoorCampagne(undefined, 999), undefined);
});

test("streekContentVoorCampagne geeft Going West-content voor alle 35 streken, met placeholder-flavor-tekst (issue #278, vraag 1)", () => {
  for (let hoogte = 1; hoogte <= GOING_WEST_STREEK_AANTAL; hoogte++) {
    const content = streekContentVoorCampagne(GOING_WEST_CAMPAGNE.id, hoogte);
    assert.ok(content, `streek ${hoogte} moet content hebben`);
    assert.equal(content!.flavorTekst, "todo");
    assert.notEqual(content!.naam, "");
  }
  assert.equal(streekContentVoorCampagne(GOING_WEST_CAMPAGNE.id, GOING_WEST_STREEK_AANTAL + 1), undefined);
});

test("introContentVoorCampagne geeft de tutorial-content terug zonder campagne, en eigen Going West-content met de campagne-id (hoofdstuk 19, blocker 1 afronding)", () => {
  assert.equal(introContentVoorCampagne(undefined).titel, INTRO_TITEL);

  const goingWestIntro = introContentVoorCampagne(GOING_WEST_CAMPAGNE.id);
  assert.equal(goingWestIntro.titel, "Going West");
  assert.notEqual(goingWestIntro.titel, INTRO_TITEL);
  // De langere, koloniale-openingssituatie-tekst staat expliciet niet op het
  // introscherm maar in een eigen pop-up (`campagneOpeningPopup`, zie de
  // `popupContent`-test hieronder) — issue "Pop-up teksten Wampanoag": "die
  // langere tekst moest in een nieuwe pop-up aan het begin van de campaign,
  // niet de introtekst".
  assert.ok(!goingWestIntro.flavorTekst.includes("Wampanoag"));
  assert.ok(!goingWestIntro.flavorTekst.includes("Massasoit"));
});

test("oceaanUitlegVoorCampagne geeft de tutorial-content terug zonder campagne, en eigen Going West-content met de campagne-id (hoofdstuk 19, blocker 1 afronding)", () => {
  assert.equal(oceaanUitlegVoorCampagne(undefined).titel, OCEAAN_UITLEG_TITEL);

  const goingWestOceaanUitleg = oceaanUitlegVoorCampagne(GOING_WEST_CAMPAGNE.id);
  assert.notEqual(goingWestOceaanUitleg.titel, OCEAAN_UITLEG_TITEL);
  assert.equal(goingWestOceaanUitleg.tekst, "todo");
});

// M21g (opdracht-wampanoag-opening.md §7/§8): `popupContent` is de
// "laag 2"-lookup uit de driedeling — campagne-gebonden, geen tutorial-
// terugval (in tegenstelling tot `introContentVoorCampagne`/
// `oceaanUitlegVoorCampagne` hierboven).
test("popupContent geeft het titel/tekst-paar van GOING_WEST_CAMPAGNE.popupTeksten terug voor de Wampanoag-narratieve pop-ups", () => {
  const campagneOpening = popupContent(GOING_WEST_CAMPAGNE, "campagneOpeningPopup");
  assert.equal(campagneOpening?.titel, GOING_WEST_CAMPAGNE.popupTeksten!.campagneOpeningPopupTitel);
  assert.equal(campagneOpening?.tekst, GOING_WEST_CAMPAGNE.popupTeksten!.campagneOpeningPopupTekst);
  assert.ok(campagneOpening?.tekst.includes("Wampanoag"));
  assert.ok(!campagneOpening?.tekst.includes("Massasoit"));

  const eersteContact = popupContent(GOING_WEST_CAMPAGNE, "eersteContactPopup");
  assert.equal(eersteContact?.titel, GOING_WEST_CAMPAGNE.popupTeksten!.eersteContactPopupTitel);
  assert.equal(eersteContact?.tekst, GOING_WEST_CAMPAGNE.popupTeksten!.eersteContactPopupTekst);

  const relatieGelegd = popupContent(GOING_WEST_CAMPAGNE, "wampanoagRelatieGelegdPopup");
  assert.equal(relatieGelegd?.titel, GOING_WEST_CAMPAGNE.popupTeksten!.wampanoagRelatieGelegdPopupTitel);
  assert.equal(relatieGelegd?.tekst, GOING_WEST_CAMPAGNE.popupTeksten!.wampanoagRelatieGelegdPopupTekst);
});

test("popupContent geeft undefined terug zonder campagne of bij een onbekende sleutel — geen tutorial-lek/andere-campagne-flavor", () => {
  assert.equal(popupContent(undefined, "eersteContactPopup"), undefined);
  assert.equal(popupContent(GOING_WEST_CAMPAGNE, "onbekendeSleutel"), undefined);
});
