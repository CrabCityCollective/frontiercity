import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus } from "./economie";
import { cityImprovementEffectiviteit, frontierAfstand, stadEffectiviteit, stadVervalZone } from "./stad";

// Ontgrendelt alle streken t/m `hoogte`, zodat `hoogsteOntgrendeldeStreek`
// (en dus `frontierAfstand`) een gekozen waarde aanneemt — zelfde patroon als
// `metWegCorridorNaarStreek` in testHelpers.ts, maar dan voor `ontgrendeld`.
function metFrontierOp(hoogte: number) {
  const state = maakInitieleSpelStatus();
  return {
    ...state,
    streken: state.streken.map((streek) => (streek.hoogte <= hoogte ? { ...streek, ontgrendeld: true } : streek)),
  };
}

test("cityImprovementEffectiviteit volgt de vier afstandszones uit hoofdstuk 9/14 (0-4=100%, 5-8=65%, 9-12=30%, 13+=0%)", () => {
  assert.equal(cityImprovementEffectiviteit(0), 1);
  assert.equal(cityImprovementEffectiviteit(4), 1);
  assert.equal(cityImprovementEffectiviteit(5), 0.65);
  assert.equal(cityImprovementEffectiviteit(8), 0.65);
  assert.equal(cityImprovementEffectiviteit(9), 0.3);
  assert.equal(cityImprovementEffectiviteit(12), 0.3);
  assert.equal(cityImprovementEffectiviteit(13), 0);
  assert.equal(cityImprovementEffectiviteit(20), 0);
});

test("stadVervalZone geeft het bijbehorende zone-label per afstand", () => {
  assert.equal(stadVervalZone(0), "gezond");
  assert.equal(stadVervalZone(6), "verminderd");
  assert.equal(stadVervalZone(10), "flink-verminderd");
  assert.equal(stadVervalZone(13), "uitgeput");
});

test("frontierAfstand groeit mee met de hoogst ontgrendelde streek, vanaf de streekHoogte van de stad", () => {
  const state = metFrontierOp(9);
  assert.equal(frontierAfstand(state, state.stad), 9);
});

test("stadEffectiviteit blijft 100% zolang een run nog nooit meer dan 1 stad heeft gehad, ook ver voorbij de frontier (hoofdstuk 11: geen 'achtergelaten stad' zonder een tweede stad)", () => {
  const state = metFrontierOp(13);
  assert.equal(state.steden.length, 1, "voorwaarde: nog geen tweede stad gesticht");
  assert.equal(frontierAfstand(state, state.stad), 13, "voorwaarde: de afstand zelf ligt wél al in de 0%-zone");
  assert.equal(stadEffectiviteit(state, state.stad), 1, "maar de effectiviteit blijft 100% zonder tweede stad");
});

test("stadEffectiviteit volgt cityImprovementEffectiviteit zodra een run meer dan 1 stad heeft (per stad apart, hoofdstuk 9 Deel 1)", () => {
  const eersteStad = { ...maakInitieleSpelStatus().stad, streekHoogte: 0 };
  const tweedeStad = { ...eersteStad, naam: "Tweede stad", streekHoogte: 8 };
  const state = { ...metFrontierOp(13), steden: [eersteStad, tweedeStad], stad: tweedeStad };

  assert.equal(frontierAfstand(state, eersteStad), 13);
  assert.equal(stadEffectiviteit(state, eersteStad), 0, "13+ streken van de frontier: volledig uitgeput");

  assert.equal(frontierAfstand(state, tweedeStad), 5);
  assert.equal(stadEffectiviteit(state, tweedeStad), 0.65, "5 streken van de frontier: begint te verminderen");
});
