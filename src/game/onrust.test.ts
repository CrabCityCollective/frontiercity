import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus } from "./economie";
import { beschikbareOpties, COURTHOUSE, ONRUST_MIN_STREEK, SALOON } from "./improvements";
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

test("een actieve Saloon verlaagt de onrust met 1 en telt zelf niet mee als onrust-veroorzakend improvement", () => {
  // 5 gewone improvements + Saloon = 6 tiles, maar de Saloon telt niet mee
  // voor de drempel — dus nog steeds maar 5 onrust-veroorzakende improvements
  // (onrust 1), en de Saloon trekt daar nog eens 1 vanaf.
  const streek = maakStreek(1, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN, 5: SALOON });
  assert.equal(onrustOpStreek([streek], [], streek), 0);
});

test("onrust kan door de Saloon niet onder 0 zakken", () => {
  const streek = maakStreek(1, { 0: HOUTKAP, 1: SALOON });
  assert.equal(onrustOpStreek([streek], [], streek), 0);
});

test("een bemand Courthouse houdt de onrust op zijn eigen streek en de 2 streken direct erboven op 0", () => {
  const drukkeStreek = (hoogte: number) =>
    maakStreek(hoogte, { 0: HOUTKAP, 1: MIJN, 2: STEENGROEVE, 3: HOUTKAP, 4: MIJN, 5: STEENGROEVE });
  const courthouseStreek = { ...maakStreek(2, { 6: COURTHOUSE }) };
  const rechters: Rechter[] = [{ id: "rechter-0", courthouse: { hoogte: 2, positieInStreek: 6 } }];
  const streken = [drukkeStreek(1), courthouseStreek, drukkeStreek(3), drukkeStreek(4), drukkeStreek(5)];

  assert.equal(onrustOpStreek(streken, rechters, streken[0]), 2); // eronder: buiten bereik, gewoon onrust
  assert.equal(onrustOpStreek(streken, rechters, streken[1]), 0); // eigen streek
  assert.equal(onrustOpStreek(streken, rechters, streken[2]), 0); // 1 erboven
  assert.equal(onrustOpStreek(streken, rechters, streken[3]), 0); // 2 erboven
  assert.equal(onrustOpStreek(streken, rechters, streken[4]), 2); // 3 erboven: buiten bereik, gewoon onrust
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

test("Saloon en Courthouse zijn pas beschikbaar vanaf ONRUST_MIN_STREEK in Going West", () => {
  const state = maakInitieleSpelStatus("going-west");
  const vroeg = beschikbareOpties("civiel", state.streken[0], state.streken.slice(0, 1), [], "going-west");
  assert.equal(vroeg.some((o) => o.id === "saloon"), false);
  assert.equal(vroeg.some((o) => o.id === "courthouse"), false);

  const vanafOnrustStreek = state.streken.slice(0, ONRUST_MIN_STREEK).map((streek) => ({ ...streek, ontgrendeld: true }));
  const laat = beschikbareOpties("civiel", vanafOnrustStreek[ONRUST_MIN_STREEK - 1], vanafOnrustStreek, [], "going-west");
  assert.equal(laat.some((o) => o.id === "saloon"), true);
  assert.equal(laat.some((o) => o.id === "courthouse"), true);
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
