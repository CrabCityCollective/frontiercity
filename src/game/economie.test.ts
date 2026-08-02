import test from "node:test";
import assert from "node:assert/strict";
import {
  bemanWachttoren,
  heeftGenoegVoorStichten,
  kanStichten,
  maakInitieleSpelStatus,
  OPSLAG_CAP,
  resterendeBouwBeurten,
  startOpslagplaats,
  startRecrutering,
  STICHTING_KOSTEN,
  stichtStad,
  volgendeBeurt,
} from "./economie";
import { ECONOMISCH_LAND_IMPROVEMENTS, MILITAIR_LAND_IMPROVEMENTS, SOLDAAT } from "./improvements";
import { GameState } from "./types";

const HOUTKAP = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "houtkap")!;
const MIJN = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "mijn")!;
const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;
const WACHTTOREN = MILITAIR_LAND_IMPROVEMENTS.find((i) => i.id === "wachttoren")!;

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

test("een tijdelijk tekort aan één grondstof blokkeert niet de voortgang op een andere", () => {
  let state = maakInitieleSpelStatus();
  // Genoeg hout, geen erts: vóór de fix bevroor dit de hele teller op de
  // volle starttijd, ook voor het hout-aandeel dat wél betaalbaar was.
  state = { ...state, voorraad: { ...state.voorraad, hout: 10, erts: 0 } };
  state = startRecrutering(state);

  const voorVoortgang = state.stad.legerInAanbouw!.voortgang;
  state = volgendeBeurt(state);
  const naVoortgang = state.stad.legerInAanbouw!.voortgang;

  assert.equal(naVoortgang.hout, 0, "het hout-aandeel had al betaald moeten zijn");
  assert.equal(voorVoortgang.erts, naVoortgang.erts, "het erts-aandeel blijft terecht stokken zonder voorraad");

  // Zodra er erts binnenkomt, maakt de opleiding alsnog af (nog twee beurten:
  // het erts-aandeel is nog geen cent betaald).
  state = { ...state, voorraad: { ...state.voorraad, erts: 10 } };
  state = volgendeBeurt(state);
  state = volgendeBeurt(state);
  assert.equal(state.stad.legerInAanbouw, undefined);
  assert.equal(state.stad.strijders.length, 1);
});

test("de opslag-cap geldt per grondstof, niet als gezamenlijke som (basis van de STICHTING_KOSTEN-doorrekening)", () => {
  let state = maakInitieleSpelStatus();
  // Hout en steen zitten al op de cap; erts staat op 0. Als de cap gedeeld
  // was (som van alle vier), zou hout/steen-productie hier geblokkeerd
  // moeten zijn — met een cap per grondstof heeft dat geen invloed op erts.
  state = {
    ...state,
    voorraad: { hout: OPSLAG_CAP, steen: OPSLAG_CAP, erts: 0, goud: 0 },
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 6) {
                return { ...tile, status: "actief" as const, improvement: MIJN, heeftWeg: true, beurtenTotUitputting: MIJN.uitputtingBeurten };
              }
              if (tile.positieInLaag === 5) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };

  state = volgendeBeurt(state);

  assert.equal(state.voorraad.hout, OPSLAG_CAP, "hout blijft op de cap, produceert niets deze beurt");
  assert.equal(state.voorraad.steen, OPSLAG_CAP, "steen blijft op de cap, produceert niets deze beurt");
  assert.equal(state.voorraad.erts, MIJN.effect.waarde, "erts is onafhankelijk van de (volle) hout/steen-cap");
});

test("een Opslagplaats verhoogt de opslag-cap met haar effect-waarde na voltooiing", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: 20, steen: 20, erts: 20, goud: 20 } };
  state = startOpslagplaats(state);
  const kosten = state.stad.opslagplaatsInAanbouw!.improvement.kosten;
  const bouwtijd = state.stad.opslagplaatsInAanbouw!.improvement.bouwtijdBeurten;

  for (let i = 0; i < bouwtijd; i++) {
    state = volgendeBeurt(state);
  }

  assert.equal(state.stad.opslagplaatsInAanbouw, undefined);
  assert.equal(state.opslagCap, OPSLAG_CAP + 20);
  // Kosten zijn ook echt betaald.
  for (const [type, bedrag] of Object.entries(kosten)) {
    assert.equal(state.voorraad[type as keyof typeof state.voorraad], 20 - (bedrag ?? 0));
  }
});

test("stichtStad vereist een geschikte locatie én genoeg grondstoffen, en verbruikt daarna de settler", () => {
  let state = maakInitieleSpelStatus();
  // Laag 10, positie 0 is in world.ts vastgelegd als een vers-water-vakje
  // (TUTORIAL_VERS_WATER) — de settler moet er wel eerst kunnen staan, dus
  // die laag moet ontgrendeld zijn.
  state = {
    ...state,
    settler: { hoogte: 10, positieInLaag: 0 },
    lagen: state.lagen.map((laag) => (laag.hoogte === 10 ? { ...laag, ontgrendeld: true } : laag)),
  };

  assert.equal(kanStichten(state), true, "een leeg, vers-water-vakje met de settler erop is een geldig doel");
  assert.equal(heeftGenoegVoorStichten(state), false, "de startvoorraad is niet genoeg om te stichten");
  assert.equal(stichtStad(state), state, "stichtStad heeft geen effect zolang de kosten niet betaald kunnen worden");

  state = {
    ...state,
    voorraad: { ...state.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  assert.equal(heeftGenoegVoorStichten(state), true);

  const naStichten = stichtStad(state);
  assert.equal(naStichten.settler, undefined, "de settler verdwijnt bij het stichten");
  assert.equal(naStichten.stadGesticht, true);
  assert.equal(naStichten.voorraad.hout, 0);
  assert.equal(naStichten.voorraad.steen, 0);
  assert.equal(naStichten.voorraad.erts, 0);
  assert.equal(naStichten.voedsel, 0);

  const gestichteTile = naStichten.lagen.find((l) => l.hoogte === 10)!.tiles[0];
  assert.equal(gestichteTile.status, "actief");
  assert.equal(gestichteTile.improvement?.soort, "city");

  // Geen automatische nieuwe settler meer via het bestaande "settler
  // verschijnt bij beurt 2"-vangnet, ook niet een aantal beurten later.
  const naVolgendeBeurt = volgendeBeurt(naStichten);
  assert.equal(naVolgendeBeurt.settler, undefined);
});

test("kanStichten is false op een vakje zonder vers water, of als het vakje al bebouwd is", () => {
  let state = maakInitieleSpelStatus();
  // Startlaag/positie (STAD_POSITIE) heeft geen vers water in de tutorial-data.
  state = { ...state, settler: { hoogte: 1, positieInLaag: 0 } };
  assert.equal(kanStichten(state), false);

  state = {
    ...state,
    settler: { hoogte: 10, positieInLaag: 0 },
    lagen: state.lagen.map((laag) =>
      laag.hoogte === 10
        ? {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 0 ? { ...tile, status: "actief" as const, improvement: HOUTKAP } : tile
            ),
          }
        : laag
    ),
  };
  assert.equal(kanStichten(state), false, "een al bebouwd vakje is geen geldig stichtingsdoel, ook al ligt het aan water");
});
