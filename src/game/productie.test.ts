import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus, OPSLAG_CAP, volgendeBeurt } from "./economie";
import { BIBLIOTHEEK, ECONOMISCH_LAND_IMPROVEMENTS, MARKT, SMEDERIJ, STERRENCIRKEL } from "./improvements";
import {
  berekenBoerderijOpbrengstRuw,
  berekenStadVoedselVerbruik,
  berekenWachttorenVoedselVerbruik,
  WACHTTOREN_VOEDSEL_VERBRUIK,
} from "./productie";
import { metActieveStad } from "./stad";
import { metWerkendeSterrencirkel, MIJN, WACHTTOREN } from "./testHelpers";

test("de opslag-cap geldt per grondstof, niet als gezamenlijke som (basis van de STICHTING_KOSTEN-doorrekening)", () => {
  let state = maakInitieleSpelStatus();
  // Hout en steen zitten al op de cap; erts staat op 0. Als de cap gedeeld
  // was (som van alle vier), zou hout/steen-productie hier geblokkeerd
  // moeten zijn — met een cap per grondstof heeft dat geen invloed op erts.
  state = {
    ...state,
    voorraad: { hout: OPSLAG_CAP, steen: OPSLAG_CAP, erts: 0, goud: 0 },
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) => {
              if (tile.positieInStreek === 6) {
                return { ...tile, status: "actief" as const, improvement: MIJN, heeftWeg: true, beurtenTotUitputting: MIJN.uitputtingBeurten };
              }
              if (tile.positieInStreek === 5) {
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
  const tile = () => state.streken[0].tiles[2];

  assert.equal(tile().beurtenTotUitputting, undefined, "de Sterrencirkel put niet uit");

  state = volgendeBeurt(state);
  assert.equal(state.wetenschap, STERRENCIRKEL.effect.waarde);
  assert.equal(tile().status, "actief", "blijft actief in plaats van ooit een ghost town te worden");

  state = volgendeBeurt(state);
  assert.equal(state.wetenschap, (STERRENCIRKEL.effect.waarde ?? 0) * 2);
});

test('"vuur-temmen" verhoogt de boerderij-opbrengst met 15%', () => {
  let state = maakInitieleSpelStatus();
  const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;
  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) => {
              if (tile.positieInStreek === 0) {
                return { ...tile, status: "actief" as const, improvement: BOERDERIJ, heeftWeg: true };
              }
              // Bruggetje naar de stad-tile (positie 4), zie ook hierboven.
              if ([1, 2, 3].includes(tile.positieInStreek)) {
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

test("berekenBoerderijOpbrengstRuw telt de basisopbrengst van elke actieve, wegverbonden boerderij op, zonder tech-/onrust-modifiers", () => {
  let state = maakInitieleSpelStatus();
  const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;
  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) => {
              if (tile.positieInStreek === 0) {
                return { ...tile, status: "actief" as const, improvement: BOERDERIJ, heeftWeg: true };
              }
              // Bruggetje naar de stad-tile (positie 4), zie ook hierboven.
              if ([1, 2, 3].includes(tile.positieInStreek)) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };

  assert.equal(berekenBoerderijOpbrengstRuw(state), BOERDERIJ.effect.waarde, "raw opbrengst = de ongemodificeerde basiswaarde");

  // "vuur-temmen" verhoogt de daadwerkelijke productie (zie test hierboven),
  // maar deze ruwe versie is er bewust nog blind voor.
  const metTech = { ...state, technologieen: ["vuur-temmen" as const] };
  assert.equal(
    berekenBoerderijOpbrengstRuw(metTech),
    BOERDERIJ.effect.waarde,
    "tech-modifiers tellen (nog) niet mee in de ruwe opbrengst"
  );
});

test("berekenBoerderijOpbrengstRuw negeert een boerderij die niet actief of niet wegverbonden is", () => {
  let state = maakInitieleSpelStatus();
  const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;

  // In aanbouw, nog niet actief.
  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 0
                ? { ...tile, status: "in_aanbouw" as const, improvement: BOERDERIJ, heeftWeg: true }
                : tile
            ),
          }
    ),
  };
  assert.equal(berekenBoerderijOpbrengstRuw(state), 0, "een boerderij in aanbouw levert nog niets op");

  // Actief, maar zonder wegverbinding naar de stad.
  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 0
                ? { ...tile, status: "actief" as const, improvement: BOERDERIJ, heeftWeg: false }
                : tile
            ),
          }
    ),
  };
  assert.equal(berekenBoerderijOpbrengstRuw(state), 0, "een niet-wegverbonden boerderij levert nog niets op");
});

test("berekenStadVoedselVerbruik geeft het stadsverbruik voor de huidige stadsgrootte, onafhankelijk van wachttorens", () => {
  const state = maakInitieleSpelStatus();
  assert.equal(state.stad.grootte, "klein");
  assert.equal(berekenStadVoedselVerbruik(state), 2, "een kleine stad verbruikt 2 voedsel/beurt");

  const groteStad = metActieveStad(state, { ...state.stad, grootte: "groot" });
  assert.equal(berekenStadVoedselVerbruik(groteStad), 6, "een grote stad verbruikt 6 voedsel/beurt");
});

test("berekenWachttorenVoedselVerbruik telt alleen bemande wachttorens, los van het stadsverbruik", () => {
  let state = maakInitieleSpelStatus();
  assert.equal(berekenWachttorenVoedselVerbruik(state), 0, "geen wachttorens = geen verbruik");

  state = {
    ...state,
    stad: { ...state.stad, strijders: [{ id: "strijder-1", wachttoren: { hoogte: 2, positieInStreek: 4 } }] },
    streken: state.streken.map((streek) =>
      streek.hoogte === 2
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 4
                ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true }
                : tile
            ),
          }
        : streek
    ),
  };

  assert.equal(
    berekenWachttorenVoedselVerbruik(state),
    WACHTTOREN_VOEDSEL_VERBRUIK,
    "1 bemande wachttoren = 1x het verbruik per wachttoren"
  );
  assert.equal(
    berekenStadVoedselVerbruik(state),
    2,
    "het stadsverbruik zelf blijft ongewijzigd door een bemande wachttoren"
  );
});

test("city-improvement-productie blijft onaangetast zolang een run maar 1 stad heeft, ook ver voorbij afstand 13 (hoofdstuk 9/11/14, M17: geen 'achtergelaten stad' zonder een tweede stad)", () => {
  let state = maakInitieleSpelStatus();
  state = metActieveStad(state, { ...state.stad, cityImprovements: [BIBLIOTHEEK, MARKT] });
  // Ontgrendel tot ver voorbij de 0%-zone (13+) — zonder een tweede stad
  // (M18 nog niet gebouwd) verandert dat niets aan de productie.
  state = { ...state, streken: state.streken.map((streek) => (streek.hoogte <= 13 ? { ...streek, ontgrendeld: true } : streek)) };

  state = volgendeBeurt(state);

  assert.equal(state.wetenschap, BIBLIOTHEEK.effect.waarde, "Bibliotheek produceert nog voluit");
  assert.equal(state.voorraad.goud, MARKT.effect.waarde, "Markt produceert nog voluit");
});

test("city-improvement-productie van de actieve stad vervalt met het afstandspercentage zodra een run meer dan 1 stad heeft (hoofdstuk 9/11/14, M17 Deel 1)", () => {
  let state = maakInitieleSpelStatus();
  const eersteStad = { ...state.stad, streekHoogte: 0 };
  const actieveStad = { ...state.stad, naam: "Nieuwe stad", cityImprovements: [BIBLIOTHEEK, MARKT], streekHoogte: 6 };
  state = {
    ...state,
    steden: [eersteStad, actieveStad],
    stad: actieveStad,
    // Frontier op 14: actieveStad (gesticht op streekHoogte 6) zit op afstand
    // 8 → 65%-zone ("verminderd").
    streken: state.streken.map((streek) => (streek.hoogte <= 14 ? { ...streek, ontgrendeld: true } : streek)),
  };

  state = volgendeBeurt(state);

  assert.equal(state.wetenschap, (BIBLIOTHEEK.effect.waarde ?? 0) * 0.65, "afstand 8 → 65% effectiviteit");
  assert.equal(
    state.voorraad.goud,
    Math.floor((MARKT.effect.waarde ?? 0) * 0.65),
    "materiaal-productie wordt naar beneden afgerond na het afstandsverval"
  );
});

test("city-improvement-productie van de actieve stad valt volledig weg vanaf afstand 13 (0%-zone, 'volledig uitgeput')", () => {
  let state = maakInitieleSpelStatus();
  const eersteStad = { ...state.stad, streekHoogte: 0 };
  const actieveStad = { ...state.stad, naam: "Nieuwe stad", cityImprovements: [BIBLIOTHEEK, MARKT], streekHoogte: 0 };
  state = {
    ...state,
    steden: [eersteStad, actieveStad],
    stad: actieveStad,
    streken: state.streken.map((streek) => (streek.hoogte <= 13 ? { ...streek, ontgrendeld: true } : streek)),
  };

  state = volgendeBeurt(state);

  assert.equal(state.wetenschap, 0, "afstand 13 → 0% effectiviteit: geen wetenschap");
  assert.equal(state.voorraad.goud, 0, "afstand 13 → 0% effectiviteit: geen goud");
});

test("een Smederij zet elke beurt 2 erts om in 1 gereedschap, zolang er genoeg erts voorradig is (Going West, M21d)", () => {
  let state = maakInitieleSpelStatus();
  state = metActieveStad(state, { ...state.stad, heeftSmederij: true });
  state = { ...state, voorraad: { ...state.voorraad, erts: 5 } };

  state = volgendeBeurt(state);

  assert.equal(state.gereedschap, 1);
  assert.equal(state.voorraad.erts, 3, "2 erts gaat elke beurt van de voorraad af");

  state = volgendeBeurt(state);

  assert.equal(state.gereedschap, 2);
  assert.equal(state.voorraad.erts, 1);
});

test("de erts→gereedschap-conversie slaat een beurt over zonder genoeg erts, en de erts-voorraad wordt nooit negatief", () => {
  let state = maakInitieleSpelStatus();
  state = metActieveStad(state, { ...state.stad, heeftSmederij: true });
  state = { ...state, voorraad: { ...state.voorraad, erts: 1 } };

  state = volgendeBeurt(state);

  assert.equal(state.gereedschap, 0, "1 erts is niet genoeg voor de conversie (2 erts nodig)");
  assert.equal(state.voorraad.erts, 1, "erts blijft ongemoeid, geen negatieve voorraad");
});

test("zonder Smederij vindt er nooit een erts→gereedschap-conversie plaats", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { ...state.voorraad, erts: 10 } };

  state = volgendeBeurt(state);

  assert.equal(state.gereedschap, 0);
  assert.equal(state.voorraad.erts, 10);
});

test("een inactief gezette Smederij zet geen erts meer om (issue: 'Smederij inactief zetten')", () => {
  let state = maakInitieleSpelStatus();
  state = metActieveStad(state, { ...state.stad, heeftSmederij: true, smederijActief: false });
  state = { ...state, voorraad: { ...state.voorraad, erts: 5 } };

  state = volgendeBeurt(state);

  assert.equal(state.gereedschap, 0, "geen conversie zolang de Smederij inactief staat");
  assert.equal(state.voorraad.erts, 5, "erts blijft ongemoeid");
});

test("Smederij-conversie is niet gevoelig voor het afstandsverval van een tweede stad (bewuste keuze, opdracht-wampanoag-opening.md §3)", () => {
  let state = maakInitieleSpelStatus();
  const eersteStad = { ...state.stad, streekHoogte: 0 };
  const actieveStad = { ...state.stad, naam: "Nieuwe stad", heeftSmederij: true, streekHoogte: 0 };
  state = {
    ...state,
    steden: [eersteStad, actieveStad],
    stad: actieveStad,
    voorraad: { ...state.voorraad, erts: 5 },
    streken: state.streken.map((streek) => (streek.hoogte <= 13 ? { ...streek, ontgrendeld: true } : streek)),
  };

  state = volgendeBeurt(state);

  assert.equal(SMEDERIJ.effect.waarde, 2, "aanname van deze test: 2 erts input, ongeacht 0% effectiviteit hier");
  assert.equal(state.gereedschap, 1, "de conversie loopt voluit door, ook op afstand 13 (0%-zone)");
  assert.equal(state.voorraad.erts, 3);
});
