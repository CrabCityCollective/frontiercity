import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus } from "./economie";
import { beschikbareOpties, COURTHOUSE, SALOON } from "./improvements";
import { bemanCourthouse, haalRechterTerug, onrustOpStreek, onrustProductieMultiplier } from "./onrust";
import { metActieveStad } from "./stad";
import { GameState, Improvement, Rechter, Streek, Tile } from "./types";
import { HOUTKAP, MIJN, STEENGROEVE } from "./testHelpers";
import { verwerkProductie } from "./productie";

// Bouwt een minimale, losstaande Streek-fixture met 9 vakjes — vakje `i` uit
// `improvementen` (0-8) krijgt, indien aanwezig, dat improvement als actief;
// de rest blijft leeg. Los van `maakInitieleSpelStatus`/`GameState` omdat
// `onrustOpStreek` puur op `Streek[]`/`Rechter[]` werkt.
function maakStreek(hoogte: number, improvementen: Record<number, Improvement>): Streek {
  const tiles: Tile[] = Array.from({ length: 9 }, (_, positieInStreek) => {
    const improvement = improvementen[positieInStreek];
    return improvement
      ? { positieInStreek, terrein: "vlak", status: "actief" as const, improvement }
      : { positieInStreek, terrein: "vlak", status: "leeg" as const };
  });
  return { hoogte, ontgrendeld: true, tiles, terreinType: "test" };
}

// Zet `heeftWeg: true` op de opgegeven posities van `streek` — gebruikt om een
// wegverbinding met de (hardcoded) stad-positie (`STAD_POSITIE`, hoogte 1) te
// simuleren voor de Saloon/Courthouse-effect-tests hieronder (issue "Weg naar
// saloon": hun effect vereist nu, net als elk ander niet-productie
// land-improvement, `isTileVerbondenMetStad`).
function metWeg(streek: Streek, ...posities: number[]): Streek {
  const set = new Set(posities);
  return { ...streek, tiles: streek.tiles.map((tile) => (set.has(tile.positieInStreek) ? { ...tile, heeftWeg: true } : tile)) };
}

test("onrustOpStreek is 0 zolang een streek 4 of minder improvements draagt", () => {
  const streek = maakStreek(1, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP });
  assert.equal(onrustOpStreek([streek], [], streek), 0);
});

test("onrustOpStreek telt vanaf het 5e improvement, lineair", () => {
  const streek5 = maakStreek(1, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN });
  assert.equal(onrustOpStreek([streek5], [], streek5), 1);

  const streek6 = maakStreek(1, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN, 5: STEENGROEVE });
  assert.equal(onrustOpStreek([streek6], [], streek6), 2);
});

test("een ghost-town-tile telt niet mee voor de onrust-drempel", () => {
  const streek = maakStreek(1, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN });
  const metGhostTown: Streek = {
    ...streek,
    tiles: streek.tiles.map((tile) => (tile.positieInStreek === 4 ? { ...tile, status: "ghost_town" as const } : tile)),
  };
  assert.equal(onrustOpStreek([metGhostTown], [], metGhostTown), 0);
});

test("een actieve, wegverbonden Saloon verlaagt de onrust met 1 en telt zelf niet mee als onrust-veroorzakend improvement", () => {
  // 5 gewone improvements + Saloon = 6 tiles, maar de Saloon telt niet mee
  // voor de drempel — dus nog steeds maar 5 onrust-veroorzakende improvements
  // (onrust 1), en de Saloon trekt daar nog eens 1 vanaf. Positie 5 ligt naast
  // de (hardcoded) stad-positie 4, dus alleen de Saloon-tile zelf heeft een
  // weg nodig om verbonden te zijn.
  const streek = metWeg(maakStreek(1, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN, 5: SALOON }), 5);
  assert.equal(onrustOpStreek([streek], [], streek), 0);
});

test("een actieve maar niet-wegverbonden Saloon vermindert de onrust niet", () => {
  // Zelfde opstelling als hierboven, maar zonder de weg op positie 5 — de
  // Saloon telt nog steeds niet mee als onrust-veroorzaker (dat blijft altijd
  // zo), maar haar -1-effect blijft uit zolang ze niet wegverbonden is.
  const streek = maakStreek(1, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN, 5: SALOON });
  assert.equal(onrustOpStreek([streek], [], streek), 1);
});

test("onrust kan door de Saloon niet onder 0 zakken", () => {
  const streek = metWeg(maakStreek(1, { 0: HOUTKAP, 1: SALOON }), 1, 2, 3);
  assert.equal(onrustOpStreek([streek], [], streek), 0);
});

test("een bemand, wegverbonden Courthouse houdt de onrust op zijn eigen streek en de 2 streken direct erboven op 0", () => {
  const drukkeStreek = (hoogte: number) =>
    maakStreek(hoogte, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN, 5: STEENGROEVE });
  // Weg van de (hardcoded) stad-positie (hoogte 1, positie 4) recht omhoog
  // naar en over de Courthouse-tile: (2,4) → (2,5) → (2,6).
  const courthouseStreek = metWeg(maakStreek(2, { 6: COURTHOUSE }), 4, 5, 6);
  const rechters: Rechter[] = [{ id: "rechter-0", courthouse: { hoogte: 2, positieInStreek: 6 } }];
  const streken = [drukkeStreek(1), courthouseStreek, drukkeStreek(3), drukkeStreek(4), drukkeStreek(5)];

  assert.equal(onrustOpStreek(streken, rechters, streken[0]), 2); // eronder: buiten bereik, gewoon onrust
  assert.equal(onrustOpStreek(streken, rechters, streken[1]), 0); // eigen streek
  assert.equal(onrustOpStreek(streken, rechters, streken[2]), 0); // 1 erboven
  assert.equal(onrustOpStreek(streken, rechters, streken[3]), 0); // 2 erboven
  assert.equal(onrustOpStreek(streken, rechters, streken[4]), 2); // 3 erboven: buiten bereik, gewoon onrust
});

test("een bemand maar niet-wegverbonden Courthouse onderdrukt geen onrust", () => {
  // Zelfde opstelling als de vorige test, maar zonder de weg naar/op de
  // Courthouse-tile — het bemannen alleen is niet genoeg zolang de tile niet
  // via het wegennetwerk met de stad verbonden is, dus blijft de eigen,
  // boven-de-drempel onrust (5 improvements → 1) gewoon staan.
  const courthouseStreek = maakStreek(2, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN, 6: COURTHOUSE });
  const rechters: Rechter[] = [{ id: "rechter-0", courthouse: { hoogte: 2, positieInStreek: 6 } }];

  assert.equal(onrustOpStreek([courthouseStreek], rechters, courthouseStreek), 1);
});

test("een onbemand Courthouse onderdrukt geen onrust", () => {
  const drukkeStreek = maakStreek(1, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN, 6: COURTHOUSE });
  assert.equal(onrustOpStreek([drukkeStreek], [], drukkeStreek), 1);
});

test("onrustProductieMultiplier daalt lineair maar zakt nooit onder het plafond", () => {
  assert.equal(onrustProductieMultiplier(0), 1);
  assert.equal(onrustProductieMultiplier(1), 0.9);
  assert.equal(onrustProductieMultiplier(20), 0.4);
});

// Bouwt een Going West-status met een actief, wegverbonden Courthouse op
// streek 1 (positie 4, de stad-positie zelf blijft door `metActieveStad`
// ongemoeid — hier gebruiken we gewoon een losstaand land-vakje) en een
// opgeleide, nog niet toegewezen Rechter.
function metCourthouseEnRechter(): GameState {
  const state = metActieveStad(maakInitieleSpelStatus("going-west"), {
    ...maakInitieleSpelStatus("going-west").stad,
    rechters: [{ id: "rechter-0" }],
  });
  return {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 2 ? { ...tile, status: "actief" as const, improvement: COURTHOUSE, heeftWeg: true } : tile
            ),
          }
    ),
  };
}

test("bemanCourthouse wijst een vrije rechter toe, haalRechterTerug maakt het weer instant ongedaan", () => {
  let state = metCourthouseEnRechter();
  state = bemanCourthouse(state, "rechter-0", 1, 2);
  assert.deepEqual(state.stad.rechters[0].courthouse, { hoogte: 1, positieInStreek: 2 });

  state = haalRechterTerug(state, "rechter-0");
  assert.equal(state.stad.rechters[0].courthouse, undefined);
});

test("bemanCourthouse weigert een tile die geen actief Courthouse is, of een rechter die al is toegewezen", () => {
  let state = metCourthouseEnRechter();
  // Geen Courthouse op deze positie.
  const onveranderd = bemanCourthouse(state, "rechter-0", 1, 5);
  assert.equal(onveranderd.stad.rechters[0].courthouse, undefined);

  state = bemanCourthouse(state, "rechter-0", 1, 2);
  // Al toegewezen — een tweede toewijzing mag hem niet "stelen".
  const staatVerandertNiet = bemanCourthouse(state, "rechter-0", 1, 2);
  assert.deepEqual(staatVerandertNiet.stad.rechters[0].courthouse, { hoogte: 1, positieInStreek: 2 });
});

test("Saloon en Courthouse zijn uitgesloten van de tutorial", () => {
  const state = maakInitieleSpelStatus();
  const opties = beschikbareOpties("civiel", state.streken[0], state.streken, [], undefined);
  assert.equal(opties.some((o) => o.id === "saloon"), false);
  assert.equal(opties.some((o) => o.id === "courthouse"), false);
});

test("Saloon en Courthouse zijn direct vanaf streek 1 beschikbaar in Going West", () => {
  const state = maakInitieleSpelStatus("going-west");
  const vroeg = beschikbareOpties("civiel", state.streken[0], state.streken.slice(0, 1), [], "going-west");
  assert.equal(vroeg.some((o) => o.id === "saloon"), true);
  assert.equal(vroeg.some((o) => o.id === "courthouse"), true);
});

test("onrust verlaagt productie in Going West, maar niet in de tutorial", () => {
  const drukkeTiles = (state: GameState): GameState => ({
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) => {
              if (tile.positieInStreek === 0) return { ...tile, status: "actief" as const, improvement: HOUTKAP, heeftWeg: true };
              if (tile.positieInStreek === 1) return { ...tile, status: "actief" as const, improvement: MIJN, heeftWeg: true };
              if (tile.positieInStreek === 2) return { ...tile, status: "actief" as const, improvement: STEENGROEVE, heeftWeg: true };
              if (tile.positieInStreek === 3) return { ...tile, status: "actief" as const, improvement: HOUTKAP, heeftWeg: true };
              if (tile.positieInStreek === 5) return { ...tile, status: "actief" as const, improvement: HOUTKAP, heeftWeg: true };
              return tile;
            }),
          }
    ),
  });

  const tutorial = drukkeTiles(maakInitieleSpelStatus());
  const naProductieTutorial = verwerkProductie(tutorial);
  // 3 Houtkap-tiles leveren normaal 3x hun waarde op zonder onrust-penalty.
  const houtkapWaarde = HOUTKAP.effect.waarde ?? 0;
  assert.equal(naProductieTutorial.voorraad.hout - tutorial.voorraad.hout, houtkapWaarde * 3);

  const goingWest = drukkeTiles(maakInitieleSpelStatus("going-west"));
  const naProductieGoingWest = verwerkProductie(goingWest);
  // 5 improvements op de streek: onrust = 5 - 4 = 1 → multiplier 0.9.
  const verwachtGoingWest = Math.floor(houtkapWaarde * onrustProductieMultiplier(1)) * 3;
  assert.equal(naProductieGoingWest.voorraad.hout - goingWest.voorraad.hout, verwachtGoingWest);
  assert.ok(naProductieGoingWest.voorraad.hout - goingWest.voorraad.hout < naProductieTutorial.voorraad.hout - tutorial.voorraad.hout);
});
