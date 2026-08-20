import test from "node:test";
import assert from "node:assert/strict";
import { resterendeBouwBeurten } from "./bouwwachtrij";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { startRecrutering } from "./groeiEnRekrutering";
import {
  bemanLegerkamp,
  bemanWachttoren,
  berekenLegerkampLegerwaarde,
  confrontatieBezetteStreek,
  haalStrijderTerug,
  kanConfrontatieBezetteStreek,
  onbemandeLegerkampPosities,
  onbemandeWachttorenPosities,
  vijandelijkeWachttorenPosities,
} from "./militair";
import { ECONOMISCH_LAND_IMPROVEMENTS, SOLDAAT, VIJANDELIJKE_WACHTTOREN } from "./improvements";
import { GameState } from "./types";
import { BEZETTE_STREEK_HOOGTE } from "./world";
import {
  HOUTKAP,
  LEGERKAMP,
  metBezetteStreekInBeeld,
  metLegerkampOpStreek12,
  metOnthuldeBezetteStreekTile,
  metVasteRandom,
  MIJN,
  WACHTTOREN,
} from "./testHelpers";

const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;

// Bouwt een startstatus met een Houtkap (positie 2), Mijn (positie 6) en
// Boerderij (positie 0) al actief en wegverbonden met de stad (positie 4),
// zodat een test zich puur kan richten op productie/rekrutering zonder de
// settler/wegen-mechniek erbij te betrekken.
function metWerkendeEconomie(): GameState {
  const state = maakInitieleSpelStatus();
  return {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) => {
              if (tile.positieInStreek === 2) {
                return { ...tile, status: "actief" as const, improvement: HOUTKAP, heeftWeg: true, beurtenTotUitputting: HOUTKAP.uitputtingBeurten };
              }
              if (tile.positieInStreek === 6) {
                return { ...tile, status: "actief" as const, improvement: MIJN, heeftWeg: true, beurtenTotUitputting: MIJN.uitputtingBeurten };
              }
              if (tile.positieInStreek === 0) {
                return { ...tile, status: "actief" as const, improvement: BOERDERIJ, heeftWeg: true, beurtenTotUitputting: BOERDERIJ.uitputtingBeurten };
              }
              if ([1, 3, 5].includes(tile.positieInStreek)) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };
}

test("een soldaat in opleiding is na SOLDAAT.bouwtijdBeurten beurten een inzetbare strijder", () => {
  let state = metWerkendeEconomie();
  state = startRecrutering(state);
  assert.equal(state.stad.legerInAanbouw?.improvement.id, "soldaat");
  assert.equal(
    resterendeBouwBeurten(state.stad.legerInAanbouw!.improvement, state.stad.legerInAanbouw!.voortgang),
    SOLDAAT.bouwtijdBeurten
  );

  for (let i = 0; i < SOLDAAT.bouwtijdBeurten; i++) {
    assert.equal(state.stad.strijders.length, 0, `mag pas na ${SOLDAAT.bouwtijdBeurten} beurten klaar zijn`);
    state = volgendeBeurt(state);
  }

  assert.equal(state.stad.legerInAanbouw, undefined);
  assert.equal(state.stad.strijders.length, 1);

  // De voltooide strijder moet ook echt een wachttoren kunnen bemannen.
  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 8 ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true } : tile
            ),
          }
    ),
  };
  const strijderId = state.stad.strijders[0].id;
  state = bemanWachttoren(state, strijderId, 1, 8);
  assert.deepEqual(state.stad.strijders[0].wachttoren, { hoogte: 1, positieInStreek: 8 });
});

test("haalStrijderTerug maakt een strijder meteen weer inzetbaar op een andere wachttoren, zonder beurten te wachten (issue: wachttoren tweaks)", () => {
  let state = metWerkendeEconomie();
  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 7 || tile.positieInStreek === 8
                ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true }
                : tile
            ),
          }
    ),
  };
  state = startRecrutering(state);
  for (let i = 0; i < SOLDAAT.bouwtijdBeurten; i++) state = volgendeBeurt(state);
  const strijderId = state.stad.strijders[0].id;

  state = bemanWachttoren(state, strijderId, 1, 8);
  state = haalStrijderTerug(state, strijderId);
  assert.equal(state.stad.strijders[0].wachttoren, undefined);

  // Geen tussenliggende beurt nodig: meteen op een andere wachttoren zetten
  // moet meteen lukken.
  state = bemanWachttoren(state, strijderId, 1, 7);
  assert.deepEqual(state.stad.strijders[0].wachttoren, { hoogte: 1, positieInStreek: 7 });
});

test("onbemandeWachttorenPosities geeft alleen actieve, nog niet-bemande wachttorens terug", () => {
  let state = metWerkendeEconomie();
  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) => {
              if (tile.positieInStreek === 7 || tile.positieInStreek === 8) {
                return { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };

  // Vóór er een strijder is, moeten beide gebouwde wachttorens als onbemand
  // (dus beschikbaar) gelden.
  assert.deepEqual(
    onbemandeWachttorenPosities(state).sort((a, b) => a.positieInStreek - b.positieInStreek),
    [
      { hoogte: 1, positieInStreek: 7 },
      { hoogte: 1, positieInStreek: 8 },
    ]
  );

  state = startRecrutering(state);
  for (let i = 0; i < SOLDAAT.bouwtijdBeurten; i++) state = volgendeBeurt(state);
  const strijderId = state.stad.strijders[0].id;
  state = bemanWachttoren(state, strijderId, 1, 8);

  // Zodra positie 8 bemand is, blijft alleen positie 7 nog beschikbaar —
  // precies de lijst die de kaart-highlight (issue: "de wachttorens die
  // beschikbaar zijn dan allemaal worden gehighlight") en de klik-validatie
  // in GameRoot gebruiken.
  assert.deepEqual(onbemandeWachttorenPosities(state), [{ hoogte: 1, positieInStreek: 7 }]);
});

test("kanConfrontatieBezetteStreek vereist een voltooid, wegverbonden eigen Legerkamp op de streek direct onder de Bezette Streek (issue: Bezette streek scherm)", () => {
  let state = metBezetteStreekInBeeld();
  state = metOnthuldeBezetteStreekTile(state, 0, VIJANDELIJKE_WACHTTOREN); // onthult de vijandelijke Wachttoren op positie 0

  assert.equal(kanConfrontatieBezetteStreek(state, 0), false, "geen eigen Legerkamp op streek 12: nog niet beschikbaar");

  state = metLegerkampOpStreek12(state);
  assert.equal(kanConfrontatieBezetteStreek(state, 0), true);
  // Een niet-onthuld of niet-vijandelijk-Wachttoren-vakje is nooit een geldig doel.
  assert.equal(kanConfrontatieBezetteStreek(state, 3), false);
});

test("confrontatieBezetteStreek: winst ruimt de vijandelijke Wachttoren-tile op (geen dreiging/doel meer)", () => {
  let state = metBezetteStreekInBeeld();
  state = metOnthuldeBezetteStreekTile(state, 0, VIJANDELIJKE_WACHTTOREN);
  state = metLegerkampOpStreek12(state);

  const naWinst = metVasteRandom(0, () => confrontatieBezetteStreek(state, 0));
  assert.equal(naWinst.laatsteConfrontatieBezetteStreek?.gewonnen, true);
  const doelTile = naWinst.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!.tiles[0];
  assert.equal(doelTile.status, "leeg");
  assert.equal(doelTile.improvement, undefined);
  // Het eigen Legerkamp blijft bij winst gewoon intact.
  const legerkampTile = naWinst.streken.find((l) => l.hoogte === 12)!.tiles[4];
  assert.equal(legerkampTile.status, "actief");
  assert.equal(legerkampTile.improvement?.id, "legerkamp");
});

test("confrontatieBezetteStreek: verlies kost één Legerkamp-toegewezen strijder permanent, maar Wachttoren-bemanning elders blijft ongemoeid — lichtere straf (issue: laatste confrontatie tweaken)", () => {
  let state = metBezetteStreekInBeeld();
  state = metOnthuldeBezetteStreekTile(state, 0, VIJANDELIJKE_WACHTTOREN);
  state = metLegerkampOpStreek12(state);
  state = {
    ...state,
    stad: {
      ...state.stad,
      strijders: [
        { id: "strijder-legerkamp", legerkamp: { hoogte: 12, positieInStreek: 4 } },
        { id: "strijder-wachttoren", wachttoren: { hoogte: 1, positieInStreek: 0 } },
      ],
    },
  };

  const naVerlies = metVasteRandom(0.999999, () => confrontatieBezetteStreek(state, 0));
  assert.equal(naVerlies.laatsteConfrontatieBezetteStreek?.gewonnen, false);

  assert.equal(naVerlies.stad.strijders.length, 1, "de Legerkamp-strijder is blijvend verloren");
  assert.equal(naVerlies.stad.strijders[0].id, "strijder-wachttoren", "een Wachttoren-bemanning elders blijft ongemoeid");

  // Het eigen Legerkamp zelf blijft gewoon staan (geen ruïne).
  const legerkampTile = naVerlies.streken.find((l) => l.hoogte === 12)!.tiles[4];
  assert.equal(legerkampTile.status, "actief");
  assert.equal(legerkampTile.improvement?.id, "legerkamp");

  // De vijandelijke Wachttoren-tile zelf blijft gewoon staan (geen doel meer
  // beschadigd of opgeruimd) — alleen de eigen bemanning is geraakt.
  const vijandTile = naVerlies.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!.tiles[0];
  assert.equal(vijandTile.improvement?.id, "vijandelijke-wachttoren");
});

test("bemanLegerkamp en onbemandeLegerkampPosities: dezelfde soort omkeerbare toewijzing als bij een Wachttoren", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    stad: { ...state.stad, strijders: [{ id: "strijder-0" }] },
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 0 ? { ...tile, status: "actief" as const, improvement: LEGERKAMP } : tile
            ),
          }
    ),
  };

  assert.deepEqual(onbemandeLegerkampPosities(state), [{ hoogte: 1, positieInStreek: 0 }]);
  assert.equal(berekenLegerkampLegerwaarde(state), 0, "nog niemand toegewezen");

  state = bemanLegerkamp(state, "strijder-0", 1, 0);
  assert.deepEqual(state.stad.strijders[0].legerkamp, { hoogte: 1, positieInStreek: 0 });
  assert.deepEqual(onbemandeLegerkampPosities(state), []);
  assert.equal(berekenLegerkampLegerwaarde(state), SOLDAAT.effect.waarde);

  state = haalStrijderTerug(state, "strijder-0");
  assert.equal(state.stad.strijders[0].legerkamp, undefined);
  assert.equal(berekenLegerkampLegerwaarde(state), 0);
});

test("vijandelijkeWachttorenPosities geeft alleen onthulde, nog niet opgeruimde vijandelijke Wachttoren-tiles terug", () => {
  let state = metBezetteStreekInBeeld();
  assert.deepEqual(vijandelijkeWachttorenPosities(state), []);

  state = metOnthuldeBezetteStreekTile(state, 0, VIJANDELIJKE_WACHTTOREN);
  assert.deepEqual(vijandelijkeWachttorenPosities(state), [{ hoogte: BEZETTE_STREEK_HOOGTE, positieInStreek: 0 }]);

  state = metLegerkampOpStreek12(state);
  state = metVasteRandom(0, () => confrontatieBezetteStreek(state, 0));
  assert.deepEqual(vijandelijkeWachttorenPosities(state), [], "na winst telt de tile niet meer mee als doel");
});
