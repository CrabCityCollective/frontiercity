import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus, OPSLAG_CAP, volgendeBeurt } from "./economie";
import { ECONOMISCH_LAND_IMPROVEMENTS, STERRENCIRKEL } from "./improvements";
import { metWerkendeSterrencirkel, MIJN } from "./testHelpers";

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

test("een Sterrencirkel produceert wetenschap per beurt zonder uit te putten", () => {
  let state = metWerkendeSterrencirkel();
  const tile = () => state.lagen[0].tiles[2];

  assert.equal(tile().beurtenTotUitputting, undefined, "de Sterrencirkel put niet uit");

  state = volgendeBeurt(state);
  assert.equal(state.wetenschap, STERRENCIRKEL.effect.waarde);
  assert.equal(tile().status, "actief", "blijft actief in plaats van ooit een ghost town te worden");

  state = volgendeBeurt(state);
  assert.equal(state.wetenschap, (STERRENCIRKEL.effect.waarde ?? 0) * 2);
});

test('"vuur-temmen" verhoogt de boerderij-opbrengst met 20%', () => {
  let state = maakInitieleSpelStatus();
  const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;
  state = {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 0) {
                return { ...tile, status: "actief" as const, improvement: BOERDERIJ, heeftWeg: true };
              }
              // Bruggetje naar de stad-tile (positie 4), zie ook hierboven.
              if ([1, 2, 3].includes(tile.positieInLaag)) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };

  const zonderTech = volgendeBeurt(state);
  const voedselZonderTech = zonderTech.voedsel - state.voedsel;

  state = { ...state, technologieen: ["vuur-temmen"] };
  const metTech = volgendeBeurt(state);
  const voedselMetTech = metTech.voedsel - state.voedsel;

  assert.ok(voedselMetTech > voedselZonderTech, "de boerderij-opbrengst met 'vuur-temmen' moet hoger liggen");
});
