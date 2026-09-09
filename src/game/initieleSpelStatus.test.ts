import test from "node:test";
import assert from "node:assert/strict";
import { maakDebugSpelStatusGoingWest, maakInitieleSpelStatus } from "./initieleSpelStatus";
import { GOING_WEST_STREEK_AANTAL, GOING_WEST_STARTSTAD_NAAM } from "./worldGoingWest";
import { TUTORIAL_STREEK_AANTAL, cultuurKostenVoorStreek, hoogsteOntgrendeldeStreek } from "./world";
import { wetenschapKostenVoorDrempel } from "./techTree";

// M20d deelstap 1 (hoofdstuk 9/13/15): `maakInitieleSpelStatus()` bouwt nog
// altijd de tutorial-start zonder argument (backwards-compatibel met
// `useState(maakInitieleSpelStatus)` in useGameEngine.ts), maar kan nu ook al
// een Going West-run opzetten — nog niet aangeroepen vanuit de UI, zie de
// modulekop van worldGoingWest.ts.
test("maakInitieleSpelStatus() zonder argument blijft de tutorial-start geven, met campagneId undefined", () => {
  const state = maakInitieleSpelStatus();
  assert.equal(state.campagneId, undefined);
  assert.equal(state.stad.naam, "Oer-stad");
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

// Issue: "Uitleg pop-ups standaard uit" — bij de tutorial staan de
// uitleg-pop-ups standaard aan, bij Going West staan ze standaard uit (de
// speler heeft de basismechanismen dan al via de tutorial gezien).
test("maakInitieleSpelStatus() start de tutorial met uitlegPopupsAan op true", () => {
  const state = maakInitieleSpelStatus();
  assert.equal(state.uitlegPopupsAan, true);
});

test('maakInitieleSpelStatus("going-west") start met uitlegPopupsAan op false', () => {
  const state = maakInitieleSpelStatus("going-west");
  assert.equal(state.uitlegPopupsAan, false);
});

// Issue "Test start streek": debug/test-ingang om Going West op een latere
// streek te kunnen beginnen (bijv. om de campagne verderop te testen zonder
// eerst alle tussenliggende streken te moeten spelen).
test("maakDebugSpelStatusGoingWest(9) zet de stad + settler op streek 9, met de streken erna nog gewoon vergrendeld", () => {
  const state = maakDebugSpelStatusGoingWest(9);
  assert.equal(state.campagneId, "going-west");
  assert.equal(state.stad.naam, GOING_WEST_STARTSTAD_NAAM);
  assert.equal(state.stad.streekHoogte, 9);
  assert.equal(state.steden.length, 1);
  assert.equal(state.steden[0], state.stad);
  assert.equal(state.streken.length, GOING_WEST_STREEK_AANTAL);
  assert.equal(hoogsteOntgrendeldeStreek(state.streken), 9);
  assert.deepEqual(state.settler, { hoogte: 9, positieInStreek: state.stad.positieInStreek });
  assert.equal(state.streken[8].tiles[state.stad.positieInStreek].improvement?.soort, "city");
  assert.equal(state.streken[9].ontgrendeld, false);
});

test("maakDebugSpelStatusGoingWest geeft dezelfde startgrondstoffen/-voedsel als een gewone Going West-start", () => {
  const gewoon = maakInitieleSpelStatus("going-west");
  const debug = maakDebugSpelStatusGoingWest(9);
  assert.deepEqual(debug.voorraad, gewoon.voorraad);
  assert.equal(debug.voedsel, gewoon.voedsel);
  assert.equal(debug.uitlegPopupsAan, gewoon.uitlegPopupsAan);
});

// Issue "Genoeg cultuur voor test run": zonder dit bleven cultuur/wetenschap
// op 0 staan bij een debug-start, waardoor het ontgrendelen van de
// eerstvolgende streek vanaf nul moest — net zo lang als een volledige
// normale run tot die hoogte, in plaats van alleen het gebruikelijke restje
// tot de volgende drempel.
test("maakDebugSpelStatusGoingWest(9) start met cultuur/wetenschap op het niveau van streek 9", () => {
  const debug = maakDebugSpelStatusGoingWest(9);
  assert.equal(debug.cultuur, cultuurKostenVoorStreek(9));
  assert.equal(debug.wetenschap, wetenschapKostenVoorDrempel(3));
});

test("maakDebugSpelStatusGoingWest schaalt de cultuur mee met de opgegeven streekhoogte", () => {
  const laag = maakDebugSpelStatusGoingWest(2);
  const hoog = maakDebugSpelStatusGoingWest(20);
  assert.equal(laag.cultuur, cultuurKostenVoorStreek(2));
  assert.equal(hoog.cultuur, cultuurKostenVoorStreek(20));
  assert.ok(hoog.cultuur > laag.cultuur);
});
