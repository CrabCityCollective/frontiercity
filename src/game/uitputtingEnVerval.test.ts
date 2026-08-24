// Tests voor de ineenstorting-reset in `verwerkVerval` (issue: "Bij game
// over moet de save verwijderd worden"). De autosave in useGameEngine.ts
// verwijdert de save van `state.campagneId` zodra `laatsteIneenstorting`
// gezet wordt — dat moet dus wél de campagne zijn waarin de speler zat, niet
// stilzwijgend terugvallen op de tutorial (`campagneId: undefined`).
import test from "node:test";
import assert from "node:assert/strict";
import { verwerkVerval } from "./uitputtingEnVerval";
import { maakInitieleSpelStatus } from "./initieleSpelStatus";

test("verwerkVerval: een ineenstorting in Going West behoudt campagneId op de resetstatus", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, voedsel: 0 };

  const naVerval = verwerkVerval(state);

  assert.equal(naVerval.laatsteIneenstorting, true);
  assert.equal(naVerval.campagneId, "going-west", "anders reset een Going West-ineenstorting stilzwijgend naar de tutorial");
});

test("verwerkVerval: een ineenstorting in de tutorial houdt campagneId op undefined", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voedsel: 0 };

  const naVerval = verwerkVerval(state);

  assert.equal(naVerval.laatsteIneenstorting, true);
  assert.equal(naVerval.campagneId, undefined);
});
