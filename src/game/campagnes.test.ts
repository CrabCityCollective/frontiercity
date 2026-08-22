import test from "node:test";
import assert from "node:assert/strict";
import { campagneConfig, GOING_WEST_CAMPAGNE } from "./campagnes";
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
