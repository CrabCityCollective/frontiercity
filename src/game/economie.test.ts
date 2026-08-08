// Tests voor de per-beurt orchestrator zelf (`volgendeBeurt`/
// `beurtMagAutomatischDoorgaan`). De spelmechaniek per domein wordt getest in
// de losse *.test.ts-bestanden naast de bijbehorende modules (zie het
// bestandshoofd van economie.ts voor de volledige lijst) — dit bestand test
// alleen wat economie.ts zelf toevoegt: de beurtvolgorde-orchestratie en de
// automatische-beurtwissel-logica.
import test from "node:test";
import assert from "node:assert/strict";
import { verplaatsSettlerNaar } from "./acties";
import { beurtMagAutomatischDoorgaan, maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { sluitBouwKeuze } from "./infrastructuurEnBouw";

test("beurtMagAutomatischDoorgaan: vóór beurt 2 (nog geen settler) telt alleen de bouwkeuze van beurt 1 mee (issue: beurt button helemaal weg)", () => {
  const state = maakInitieleSpelStatus();
  assert.equal(state.settler, undefined);
  assert.equal(beurtMagAutomatischDoorgaan(state), false, "de bouwkeuze van beurt 1 staat nog open");

  const naBouwkeuze = { ...state, bouwKeuzeGedaanDitBeurt: true };
  assert.equal(beurtMagAutomatischDoorgaan(naBouwkeuze), true);
});

test("beurtMagAutomatischDoorgaan: vanaf beurt 2 gaat de beurt pas automatisch door zodra de settler zijn actie heeft gebruikt", () => {
  let state = maakInitieleSpelStatus();
  // Bouwkeuze van beurt 1 alvast afgehandeld, zodat beurt 2 zelf geen
  // bouwmoment meer is (hoofdstuk 16: om de 3 beurten) en alleen de
  // settler-actie deze test bepaalt.
  state = sluitBouwKeuze(state);
  state = volgendeBeurt(state);
  assert.ok(state.settler, "de settler is verschenen zodra beurt 2 begint");
  assert.equal(beurtMagAutomatischDoorgaan(state), false, "de settler heeft deze beurt nog niets gedaan");

  const naVerplaatsing = verplaatsSettlerNaar(state, state.settler!.hoogte, state.settler!.positieInStreek + 1);
  assert.equal(naVerplaatsing.settlerActieGedaanDitBeurt, true);
  assert.equal(beurtMagAutomatischDoorgaan(naVerplaatsing), true);
});

test("beurtMagAutomatischDoorgaan: op een bouwmoment moet zowel de settler-actie als de bouwkeuze gebruikt zijn", () => {
  let state = maakInitieleSpelStatus();
  state = volgendeBeurt(state);
  assert.ok(state.beurt >= (state.volgendeBouwBeurt ?? 1), "beurt 2 is (net als beurt 1) een bouwmoment");

  const naSettlerActie = verplaatsSettlerNaar(state, state.settler!.hoogte, state.settler!.positieInStreek + 1);
  assert.equal(
    beurtMagAutomatischDoorgaan(naSettlerActie),
    false,
    "de bouwkeuze staat nog open, de settler-actie alleen is niet genoeg"
  );

  const naBeide = { ...naSettlerActie, bouwKeuzeGedaanDitBeurt: true };
  assert.equal(beurtMagAutomatischDoorgaan(naBeide), true);
});
