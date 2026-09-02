// Tests voor de per-beurt orchestrator zelf (`volgendeBeurt`/
// `beurtMagAutomatischDoorgaan`). De spelmechaniek per domein wordt getest in
// de losse *.test.ts-bestanden naast de bijbehorende modules (zie het
// bestandshoofd van economie.ts voor de volledige lijst) — dit bestand test
// alleen wat economie.ts zelf toevoegt: de beurtvolgorde-orchestratie en de
// automatische-beurtwissel-logica.
import test from "node:test";
import assert from "node:assert/strict";
import { verplaatsSettlerNaar } from "./acties";
import { beurtMagAutomatischDoorgaan, berekenEconomieOverzicht, maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { sluitBouwKeuze } from "./infrastructuurEnBouw";
import { metActiefHeiligdomOpStreek1 } from "./testHelpers";

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

// Tweede settler (issue: "Altijd 2e settler" #236): telt onafhankelijk mee
// naast de eerste settler — beide moeten hun actie gebruikt hebben.
test("beurtMagAutomatischDoorgaan: een onbenutte actie van de tweede settler houdt de beurt ook tegen", () => {
  let state = maakInitieleSpelStatus();
  state = sluitBouwKeuze(state);
  state = volgendeBeurt(state);
  state = { ...state, tweedeSettler: { hoogte: 1, positieInStreek: 0 } };

  const naEersteSettlerActie = verplaatsSettlerNaar(state, state.settler!.hoogte, state.settler!.positieInStreek + 1);
  assert.equal(
    beurtMagAutomatischDoorgaan(naEersteSettlerActie),
    false,
    "de tweede settler heeft deze beurt nog niets gedaan"
  );

  const naBeide = { ...naEersteSettlerActie, tweedeSettlerActieGedaanDitBeurt: true };
  assert.equal(beurtMagAutomatischDoorgaan(naBeide), true);
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

// Economie-overzicht (issue: "Economie overzicht" — "hoeveel resources er
// volgende beurt vanaf of en bij komen"): puur informatief, `state` zelf mag
// niet muteren.
test("berekenEconomieOverzicht: op de startstatus is er alleen voedselverbruik, verder nog geen productie", () => {
  const state = maakInitieleSpelStatus();
  const overzicht = berekenEconomieOverzicht(state);

  assert.deepEqual(overzicht, { hout: 0, steen: 0, erts: 0, goud: 0, voedsel: -2, cultuur: 0, wetenschap: 0 });
  // Geen mutatie van de meegegeven status (issue: puur een voorspelling).
  assert.equal(state.voedsel, 20);
});

test("berekenEconomieOverzicht: telt de opbrengst van een actieve, wegverbonden improvement mee (Heiligdom, +3 cultuur)", () => {
  const state = metActiefHeiligdomOpStreek1(maakInitieleSpelStatus());
  const overzicht = berekenEconomieOverzicht(state);

  assert.equal(overzicht.cultuur, 3);
});
