import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus, OPSLAG_CAP, volgendeBeurt } from "./economie";
import { STERRENCIRKEL } from "./improvements";
import { kiesTech } from "./tech";
import { wetenschapKostenVoorDrempel } from "./techTree";
import { metWerkendeSterrencirkel } from "./testHelpers";

test("bij drempel 1 opent een technologie-keuze met de twee vaste startrichtingen", () => {
  let state = metWerkendeSterrencirkel();
  const beurtenTotDrempel1 = Math.ceil(wetenschapKostenVoorDrempel(1) / (STERRENCIRKEL.effect.waarde ?? 1));

  for (let i = 0; i < beurtenTotDrempel1; i++) {
    assert.equal(state.techKeuzeEvent, undefined, `nog geen keuze vóór drempel 1 (beurt ${i})`);
    state = volgendeBeurt(state);
  }

  assert.deepEqual(state.techKeuzeEvent, { drempel: 1, opties: ["vuur-temmen", "spoor-lezen"] });
  assert.equal(state.technologieen.length, 0, "nog niets gekozen, alleen de keuze staat open");
});

test("kiesTech legt de keuze vast en het niet-gekozen pad blijft daarna onbereikbaar bij de volgende drempel", () => {
  let state = metWerkendeSterrencirkel();
  state = { ...state, wetenschap: wetenschapKostenVoorDrempel(1) };
  state = volgendeBeurt(state);
  assert.deepEqual(state.techKeuzeEvent?.opties, ["vuur-temmen", "spoor-lezen"]);

  // Een ongeldige keuze (niet één van de twee getoonde opties) heeft geen effect.
  const naOngeldigeKeuze = kiesTech(state, "wiel");
  assert.equal(naOngeldigeKeuze, state);

  state = kiesTech(state, "vuur-temmen");
  assert.deepEqual(state.technologieen, ["vuur-temmen"]);
  assert.equal(state.techKeuzeEvent, undefined);

  // Drempel 2 vanuit "vuur-temmen" toont alleen A1/A2 — nooit B1/B2 (het
  // pad onder "spoor-lezen" is nu permanent onbereikbaar deze run).
  state = { ...state, wetenschap: wetenschapKostenVoorDrempel(2) };
  state = volgendeBeurt(state);
  assert.deepEqual(state.techKeuzeEvent, { drempel: 2, opties: ["aardewerk", "zaadselectie"] });
});

test('"weven" verhoogt de opslag-cap direct bij het kiezen, zonder wachtrij of wegverbinding', () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, technologieen: ["vuur-temmen", "aardewerk"], techKeuzeEvent: { drempel: 3, opties: ["weven", "kalkoven"] } };

  state = kiesTech(state, "weven");

  assert.deepEqual(state.technologieen, ["vuur-temmen", "aardewerk", "weven"]);
  assert.equal(state.opslagCap, OPSLAG_CAP + 10);
});
