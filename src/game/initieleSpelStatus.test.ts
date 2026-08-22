import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus } from "./initieleSpelStatus";
import { GOING_WEST_STREEK_AANTAL, GOING_WEST_STARTSTAD_NAAM } from "./worldGoingWest";
import { TUTORIAL_STREEK_AANTAL } from "./world";

// M20d deelstap 1 (hoofdstuk 9/13/15): `maakInitieleSpelStatus()` bouwt nog
// altijd de tutorial-start zonder argument (backwards-compatibel met
// `useState(maakInitieleSpelStatus)` in useGameEngine.ts), maar kan nu ook al
// een Going West-run opzetten — nog niet aangeroepen vanuit de UI, zie de
// modulekop van worldGoingWest.ts.
test("maakInitieleSpelStatus() zonder argument blijft de tutorial-start geven, met campagneId undefined", () => {
  const state = maakInitieleSpelStatus();
  assert.equal(state.campagneId, undefined);
  assert.equal(state.stad.naam, "Holenrots");
  assert.equal(state.streken.length, TUTORIAL_STREEK_AANTAL);
});

test('maakInitieleSpelStatus("going-west") bouwt de Going West-wereld i.p.v. de tutorial', () => {
  const state = maakInitieleSpelStatus("going-west");
  assert.equal(state.campagneId, "going-west");
  assert.equal(state.stad.naam, GOING_WEST_STARTSTAD_NAAM);
  assert.equal(state.streken.length, GOING_WEST_STREEK_AANTAL);
  assert.equal(state.streken[0].ontgrendeld, true);
  assert.equal(state.steden.length, 1);
  assert.equal(state.steden[0], state.stad);
});

test("een onbekende campagneId valt terug op de tutorial-wereld, maar bewaart wel de opgegeven id", () => {
  const state = maakInitieleSpelStatus("onbekende-campagne");
  assert.equal(state.campagneId, "onbekende-campagne");
  assert.equal(state.streken.length, TUTORIAL_STREEK_AANTAL);
});
