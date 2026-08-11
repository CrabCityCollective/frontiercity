import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus } from "./economie";
import { infrastructuurVoortgang, startBouw } from "./infrastructuurEnBouw";
import { AMBERADER, BARAKKEN, GROTE_TEMPEL, OFFER_ALTAAR } from "./improvements";
import { GameState, Improvement } from "./types";
import { HEILIGDOM, LEGERKAMP, WACHTTOREN } from "./testHelpers";

// Streek 8, positie 0 is in world.ts vastgelegd als de gegarandeerde eerste
// amberader-vondst (TUTORIAL_AMBER); positie 1 op diezelfde streek is ook
// heuvel/berg-terrein maar zonder amberader.
test("Amberader mag alleen gebouwd worden op een vakje met een amberader-vondst, niet op elk heuvel/bergvakje", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    streken: state.streken.map((streek) => (streek.hoogte === 8 ? { ...streek, ontgrendeld: true } : streek)),
  };
  const streek8 = state.streken.find((l) => l.hoogte === 8)!;
  assert.equal(streek8.tiles[0].amber, true);
  assert.equal(streek8.tiles[1].amber, false, "heuvel/berg-terrein zonder amberader-vondst");

  const nietGeplaatst = startBouw(state, 8, AMBERADER, 1);
  assert.equal(
    nietGeplaatst.streken.find((l) => l.hoogte === 8)!.tiles[1].status,
    "leeg",
    "een gewoon heuvel/bergvakje zonder amberader is geen geldig Amberader-doel"
  );

  const welGeplaatst = startBouw(state, 8, AMBERADER, 0);
  assert.equal(welGeplaatst.streken.find((l) => l.hoogte === 8)!.tiles[0].status, "in_aanbouw");
});

test("AMBERADER.uitputtingBeurten valt binnen de 'gewoon'-range uit het issue (10-14 beurten)", () => {
  assert.ok(AMBERADER.uitputtingBeurten! >= 10 && AMBERADER.uitputtingBeurten! <= 14);
});

// Plaatst `aantal` actieve land-tiles met `improvement` over de eerste
// beschikbare (niet-stad, nog lege) vakjes van de opeenvolgende streken —
// genoeg voor de infrastructuur-eis-tellingen (Deel 4), die alleen
// `status === "actief"` controleren, geen wegverbinding.
function metActieveLandImprovements(state: GameState, improvement: Improvement, aantal: number): GameState {
  let resterend = aantal;
  const streken = state.streken.map((streek) => ({
    ...streek,
    tiles: streek.tiles.map((tile) => {
      if (resterend <= 0 || tile.positieInStreek === 4 || tile.status !== "leeg") return tile;
      resterend -= 1;
      return { ...tile, status: "actief" as const, improvement };
    }),
  }));
  return { ...state, streken };
}

test("Legerkamp en Offer Altaar blijven geblokkeerd door startBouw tot hun infrastructuur-eis vervuld is (Deel 4)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, streken: state.streken.map((streek) => ({ ...streek, ontgrendeld: true })) };

  const legerkampVoortgang = infrastructuurVoortgang(state.streken, state.stad.cityImprovements, LEGERKAMP);
  assert.deepEqual(legerkampVoortgang, {
    aantalLandImprovement: 0,
    benodigdAantal: 5,
    heeftCityImprovement: false,
    vervuld: false,
  });

  // Positie 6 blijft leeg: `metActieveLandImprovements` vult hierna eerst de
  // posities 0,1,2,3,5 van streek 1 (positie 4 is de stad), zodat het Legerkamp
  // zelf ergens anders neergezet kan worden dan de 5 Wachttorens die de eis
  // vervullen.
  const naPoging = startBouw(state, 1, LEGERKAMP, 6);
  assert.equal(naPoging, state, "geen effect: nog geen 5 Wachttorens en geen Barakken");

  // 5 actieve Wachttorens, maar nog geen Barakken.
  let metWachttorens = metActieveLandImprovements(state, WACHTTOREN, 5);
  assert.equal(
    infrastructuurVoortgang(metWachttorens.streken, metWachttorens.stad.cityImprovements, LEGERKAMP)?.vervuld,
    false
  );
  assert.equal(startBouw(metWachttorens, 1, LEGERKAMP, 6), metWachttorens);

  // Met Barakken erbij is de eis vervuld en mag het Legerkamp gebouwd worden.
  const metBarakken: GameState = {
    ...metWachttorens,
    stad: { ...metWachttorens.stad, cityImprovements: [BARAKKEN] },
  };
  assert.equal(infrastructuurVoortgang(metBarakken.streken, metBarakken.stad.cityImprovements, LEGERKAMP)?.vervuld, true);
  const naGeldigeBouw = startBouw(metBarakken, 1, LEGERKAMP, 6);
  assert.equal(naGeldigeBouw.streken[0].tiles[6].improvement?.id, "legerkamp");
  assert.equal(naGeldigeBouw.streken[0].tiles[6].status, "in_aanbouw");

  // Offer Altaar volgt exact hetzelfde patroon met Heiligdommen/Grote Tempel.
  const metHeiligdommen = metActieveLandImprovements(state, HEILIGDOM, 5);
  assert.equal(startBouw(metHeiligdommen, 1, OFFER_ALTAAR, 6), metHeiligdommen, "nog geen Grote Tempel");
  const metGroteTempel: GameState = {
    ...metHeiligdommen,
    stad: { ...metHeiligdommen.stad, cityImprovements: [GROTE_TEMPEL] },
  };
  const naOfferAltaar = startBouw(metGroteTempel, 1, OFFER_ALTAAR, 6);
  assert.equal(naOfferAltaar.streken[0].tiles[6].improvement?.id, "offer-altaar");
});
