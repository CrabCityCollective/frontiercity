import test from "node:test";
import assert from "node:assert/strict";
import { resterendeBouwBeurten } from "./bouwwachtrij";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { startRecrutering } from "./groeiEnRekrutering";
import { verken } from "./laagOntgrendeling";
import {
  bemanLegerkamp,
  bemanWachttoren,
  berekenLegerkampLegerwaarde,
  confrontatieBezetteLaag,
  haalStrijderTerug,
  kanConfrontatieBezetteLaag,
  onbemandeLegerkampPosities,
  onbemandeWachttorenPosities,
  vijandelijkeWachttorenPosities,
} from "./militair";
import { ECONOMISCH_LAND_IMPROVEMENTS, SOLDAAT } from "./improvements";
import { GameState } from "./types";
import { BEZETTE_LAAG_HOOGTE } from "./world";
import {
  HOUTKAP,
  LEGERKAMP,
  metBeschermendeWachttorenOpLaag11,
  metBezetteLaagEnVerkenner,
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
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 2) {
                return { ...tile, status: "actief" as const, improvement: HOUTKAP, heeftWeg: true, beurtenTotUitputting: HOUTKAP.uitputtingBeurten };
              }
              if (tile.positieInLaag === 6) {
                return { ...tile, status: "actief" as const, improvement: MIJN, heeftWeg: true, beurtenTotUitputting: MIJN.uitputtingBeurten };
              }
              if (tile.positieInLaag === 0) {
                return { ...tile, status: "actief" as const, improvement: BOERDERIJ, heeftWeg: true, beurtenTotUitputting: BOERDERIJ.uitputtingBeurten };
              }
              if ([1, 3, 5].includes(tile.positieInLaag)) {
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
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 8 ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true } : tile
            ),
          }
    ),
  };
  const strijderId = state.stad.strijders[0].id;
  state = bemanWachttoren(state, strijderId, 1, 8);
  assert.deepEqual(state.stad.strijders[0].wachttoren, { hoogte: 1, positieInLaag: 8 });
});

test("haalStrijderTerug maakt een strijder meteen weer inzetbaar op een andere wachttoren, zonder beurten te wachten (issue: wachttoren tweaks)", () => {
  let state = metWerkendeEconomie();
  state = {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 7 || tile.positieInLaag === 8
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
  assert.deepEqual(state.stad.strijders[0].wachttoren, { hoogte: 1, positieInLaag: 7 });
});

test("onbemandeWachttorenPosities geeft alleen actieve, nog niet-bemande wachttorens terug", () => {
  let state = metWerkendeEconomie();
  state = {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 7 || tile.positieInLaag === 8) {
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
    onbemandeWachttorenPosities(state).sort((a, b) => a.positieInLaag - b.positieInLaag),
    [
      { hoogte: 1, positieInLaag: 7 },
      { hoogte: 1, positieInLaag: 8 },
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
  assert.deepEqual(onbemandeWachttorenPosities(state), [{ hoogte: 1, positieInLaag: 7 }]);
});

test("kanConfrontatieBezetteLaag vereist een voltooide, bemande, wegverbonden eigen Wachttoren op de laag direct onder de Bezette Laag", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 0); // onthult de vijandelijke Wachttoren op positie 0

  assert.equal(kanConfrontatieBezetteLaag(state, 0), false, "geen eigen Wachttoren op laag 11: nog niet beschikbaar");

  state = metBeschermendeWachttorenOpLaag11(state);
  assert.equal(kanConfrontatieBezetteLaag(state, 0), true);
  // Een niet-onthuld of niet-vijandelijk-Wachttoren-vakje is nooit een geldig doel.
  assert.equal(kanConfrontatieBezetteLaag(state, 3), false);
});

test("confrontatieBezetteLaag: winst ruimt de vijandelijke Wachttoren-tile op (geen dreiging/doel meer)", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 0);
  state = metBeschermendeWachttorenOpLaag11(state);

  const naWinst = metVasteRandom(0, () => confrontatieBezetteLaag(state, 0));
  assert.equal(naWinst.laatsteConfrontatieBezetteLaag?.gewonnen, true);
  const doelTile = naWinst.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!.tiles[0];
  assert.equal(doelTile.status, "leeg");
  assert.equal(doelTile.improvement, undefined);
  // De eigen Wachttoren en zijn bemanning blijven bij winst gewoon intact.
  const wachttorenTile = naWinst.lagen.find((l) => l.hoogte === 11)!.tiles[4];
  assert.equal(wachttorenTile.status, "actief");
  assert.equal(naWinst.stad.strijders.length, 1);
});

test("confrontatieBezetteLaag: verlies kost de bemannende strijder permanent, maar de eigen Wachttoren blijft intact — lichtere straf (issue: laatste confrontatie tweaken), en Legerkamp-strijders blijven sowieso gespaard", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 0);
  state = metBeschermendeWachttorenOpLaag11(state);
  // Een tweede, aan een Legerkamp toegewezen strijder — moet bij verlies
  // gewoon behouden blijven (alleen de Wachttoren-bemanning gaat verloren).
  state = {
    ...state,
    stad: {
      ...state.stad,
      strijders: [
        ...state.stad.strijders,
        { id: "strijder-legerkamp", legerkamp: { hoogte: 1, positieInLaag: 0 } },
      ],
    },
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 0 ? { ...tile, status: "actief" as const, improvement: LEGERKAMP } : tile
            ),
          }
    ),
  };

  const naVerlies = metVasteRandom(0.999999, () => confrontatieBezetteLaag(state, 0));
  assert.equal(naVerlies.laatsteConfrontatieBezetteLaag?.gewonnen, false);

  // De eigen beschermende Wachttoren zelf blijft gewoon staan (geen ruïne
  // meer) — alleen de bemanning is kwijt, dus de toren staat er nu onbemand
  // bij (`isWachttorenBemand` zou hier false geven).
  const wachttorenTile = naVerlies.lagen.find((l) => l.hoogte === 11)!.tiles[4];
  assert.equal(wachttorenTile.status, "actief");
  assert.equal(wachttorenTile.improvement?.id, "wachttoren");

  assert.equal(naVerlies.stad.strijders.length, 1, "de Wachttoren-bemanning is blijvend verloren");
  assert.equal(naVerlies.stad.strijders[0].id, "strijder-legerkamp", "de Legerkamp-strijder blijft behouden");

  // De vijandelijke Wachttoren-tile zelf blijft gewoon staan (geen doel meer
  // beschadigd of opgeruimd) — alleen de eigen bemanning is geraakt.
  const vijandTile = naVerlies.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!.tiles[0];
  assert.equal(vijandTile.improvement?.id, "vijandelijke-wachttoren");
});

test("bemanLegerkamp en onbemandeLegerkampPosities: dezelfde soort omkeerbare toewijzing als bij een Wachttoren", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    stad: { ...state.stad, strijders: [{ id: "strijder-0" }] },
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 0 ? { ...tile, status: "actief" as const, improvement: LEGERKAMP } : tile
            ),
          }
    ),
  };

  assert.deepEqual(onbemandeLegerkampPosities(state), [{ hoogte: 1, positieInLaag: 0 }]);
  assert.equal(berekenLegerkampLegerwaarde(state), 0, "nog niemand toegewezen");

  state = bemanLegerkamp(state, "strijder-0", 1, 0);
  assert.deepEqual(state.stad.strijders[0].legerkamp, { hoogte: 1, positieInLaag: 0 });
  assert.deepEqual(onbemandeLegerkampPosities(state), []);
  assert.equal(berekenLegerkampLegerwaarde(state), SOLDAAT.effect.waarde);

  state = haalStrijderTerug(state, "strijder-0");
  assert.equal(state.stad.strijders[0].legerkamp, undefined);
  assert.equal(berekenLegerkampLegerwaarde(state), 0);
});

test("vijandelijkeWachttorenPosities geeft alleen onthulde, nog niet opgeruimde vijandelijke Wachttoren-tiles terug", () => {
  let state = metBezetteLaagEnVerkenner();
  assert.deepEqual(vijandelijkeWachttorenPosities(state), []);

  state = verken(state, 0);
  assert.deepEqual(vijandelijkeWachttorenPosities(state), [{ hoogte: BEZETTE_LAAG_HOOGTE, positieInLaag: 0 }]);

  state = metBeschermendeWachttorenOpLaag11(state);
  state = metVasteRandom(0, () => confrontatieBezetteLaag(state, 0));
  assert.deepEqual(vijandelijkeWachttorenPosities(state), [], "na winst telt de tile niet meer mee als doel");
});
