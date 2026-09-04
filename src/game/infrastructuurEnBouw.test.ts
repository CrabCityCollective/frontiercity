import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus } from "./economie";
import { infrastructuurVoortgang, sloopImprovement, startBouw } from "./infrastructuurEnBouw";
import { GOUDADER, BARAKKEN, GROTE_TEMPEL, OFFER_ALTAAR } from "./improvements";
import { GameState, Improvement } from "./types";
import { HEILIGDOM, HOUTKAP, LEGERKAMP, WACHTTOREN, metWerkendeSterrencirkel } from "./testHelpers";

// Streek 8, positie 0 is in world.ts vastgelegd als de gegarandeerde eerste
// goudader-vondst (TUTORIAL_GOUD); positie 1 op diezelfde streek is ook
// heuvel/berg-terrein maar zonder goudader.
test("Goudader mag alleen gebouwd worden op een vakje met een goudader-vondst, niet op elk heuvel/bergvakje", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    streken: state.streken.map((streek) => (streek.hoogte === 8 ? { ...streek, ontgrendeld: true } : streek)),
  };
  const streek8 = state.streken.find((l) => l.hoogte === 8)!;
  assert.equal(streek8.tiles[0].goud, true);
  assert.equal(streek8.tiles[1].goud, false, "heuvel/berg-terrein zonder goudader-vondst");

  const nietGeplaatst = startBouw(state, 8, GOUDADER, 1);
  assert.equal(
    nietGeplaatst.streken.find((l) => l.hoogte === 8)!.tiles[1].status,
    "leeg",
    "een gewoon heuvel/bergvakje zonder goudader is geen geldig Goudader-doel"
  );

  const welGeplaatst = startBouw(state, 8, GOUDADER, 0);
  assert.equal(welGeplaatst.streken.find((l) => l.hoogte === 8)!.tiles[0].status, "in_aanbouw");
});

test("GOUDADER.uitputtingBeurten valt binnen de 'gewoon'-range uit het issue (10-14 beurten)", () => {
  assert.ok(GOUDADER.uitputtingBeurten! >= 10 && GOUDADER.uitputtingBeurten! <= 14);
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

// Zet een actieve `improvement` direct op één specifieke tile — zonder de
// tussenstap van `startBouw`/wegverbinding, die voor `sloopImprovement` niet
// relevant is (sloop kijkt alleen naar `status`/`improvement.id`).
function metActieveImprovementOpTile(
  state: GameState,
  hoogte: number,
  positieInStreek: number,
  improvement: Improvement
): GameState {
  return {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte !== hoogte
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile, i) =>
              i !== positieInStreek ? tile : { ...tile, status: "actief" as const, improvement }
            ),
          },
    ),
  };
}

test("sloopImprovement: geeft de bouwkosten terug en maakt de tile weer leeg (Wachttoren, Heiligdom, Sterrencirkel)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: 10, steen: 10, erts: 10, goud: 10 } };

  const metWachttoren = metActieveImprovementOpTile(state, 1, 0, WACHTTOREN);
  const naWachttorenSloop = sloopImprovement(metWachttoren, 1, 0);
  const wachttorenTile = naWachttorenSloop.streken.find((s) => s.hoogte === 1)!.tiles[0];
  assert.equal(wachttorenTile.status, "leeg");
  assert.equal(wachttorenTile.improvement, undefined);
  assert.equal(naWachttorenSloop.voorraad.hout, 10 + WACHTTOREN.kosten.hout!);
  assert.equal(naWachttorenSloop.voorraad.steen, 10 + WACHTTOREN.kosten.steen!);

  const metHeiligdom = metActieveImprovementOpTile(state, 1, 1, HEILIGDOM);
  const naHeiligdomSloop = sloopImprovement(metHeiligdom, 1, 1);
  const heiligdomTile = naHeiligdomSloop.streken.find((s) => s.hoogte === 1)!.tiles[1];
  assert.equal(heiligdomTile.status, "leeg");
  assert.equal(heiligdomTile.improvement, undefined);
  assert.equal(naHeiligdomSloop.voorraad.hout, 10 + HEILIGDOM.kosten.hout!);
  assert.equal(naHeiligdomSloop.voorraad.steen, 10 + HEILIGDOM.kosten.steen!);

  const metSterrencirkel = { ...metWerkendeSterrencirkel(), voorraad: { hout: 10, steen: 10, erts: 10, goud: 10 } };
  const sterrencirkelImprovement = metSterrencirkel.streken.find((s) => s.hoogte === 1)!.tiles[2].improvement!;
  const naSterrencirkelSloop = sloopImprovement(metSterrencirkel, 1, 2);
  const sterrencirkelTile = naSterrencirkelSloop.streken.find((s) => s.hoogte === 1)!.tiles[2];
  assert.equal(sterrencirkelTile.status, "leeg");
  assert.equal(sterrencirkelTile.improvement, undefined);
  assert.equal(naSterrencirkelSloop.voorraad.hout, 10 + sterrencirkelImprovement.kosten.hout!);
  assert.equal(naSterrencirkelSloop.voorraad.steen, 10 + sterrencirkelImprovement.kosten.steen!);
});

test("sloopImprovement: stuurt een strijder die de gesloopte Wachttoren bemande automatisch naar huis", () => {
  let state = maakInitieleSpelStatus();
  state = metActieveImprovementOpTile(state, 1, 0, WACHTTOREN);
  const strijders = [{ id: "s1", wachttoren: { hoogte: 1, positieInStreek: 0 } }];
  state = { ...state, stad: { ...state.stad, strijders }, steden: [{ ...state.stad, strijders }] };

  const naSloop = sloopImprovement(state, 1, 0);
  assert.equal(naSloop.stad.strijders[0].wachttoren, undefined, "strijder is vrij zodra zijn Wachttoren weg is");
});

test("sloopImprovement: geen effect op een niet-sloopbare improvement (Houtkap put vanzelf uit, mag niet gesloopt worden)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: 10, steen: 10, erts: 10, goud: 10 } };
  state = metActieveImprovementOpTile(state, 1, 0, HOUTKAP);

  const naPoging = sloopImprovement(state, 1, 0);
  assert.equal(naPoging, state, "Houtkap staat niet in SLOOPBARE_IMPROVEMENT_IDS, dus geen wijziging");
});

test("sloopImprovement: geen effect op een Wachttoren die nog 'in_aanbouw' is (nog niet 'actief')", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte !== 1
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile, i) =>
              i !== 0 ? tile : { ...tile, status: "in_aanbouw" as const, improvement: WACHTTOREN, bouwVoortgang: { ...WACHTTOREN.kosten } }
            ),
          }
    ),
  };

  const naPoging = sloopImprovement(state, 1, 0);
  assert.equal(naPoging, state, "nog in aanbouw, dus (nog) niet sloopbaar");
});

test("sloopImprovement: gerefundeerde bouwmaterialen worden gekapt aan opslagCap, net als reguliere productie", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: state.opslagCap - 2, steen: state.opslagCap - 1, erts: 0, goud: 0 } };
  state = metActieveImprovementOpTile(state, 1, 0, WACHTTOREN);

  const naSloop = sloopImprovement(state, 1, 0);
  assert.equal(naSloop.voorraad.hout, state.opslagCap);
  assert.equal(naSloop.voorraad.steen, state.opslagCap);
});
