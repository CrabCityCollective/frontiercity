import test from "node:test";
import assert from "node:assert/strict";
import { bereikbarePosities } from "./wegen";
import { verplaatsSettlerNaar } from "./acties";
import { maakInitieleSpelStatus } from "./economie";
import { GameState } from "./types";
import { metWegCorridorNaarStreek } from "./testHelpers";

// Ontgrendelt een streek zonder de rest van de wereldstatus aan te raken —
// gedeelde opzet voor de tests hieronder (de settler mag alleen naar
// ontgrendeld gebied, zie wegen.ts: `magSettlerNaar`).
function metOntgrendeldeStreek(state: GameState, hoogte: number): GameState {
  return {
    ...state,
    streken: state.streken.map((streek) => (streek.hoogte === hoogte ? { ...streek, ontgrendeld: true } : streek)),
  };
}

test("bereikbarePosities: een volledig over de weg lopende route van 2 vakjes is ook bereikbaar (issue: 'Settlers verplaatsen sneller over wegen')", () => {
  let state = maakInitieleSpelStatus();
  state = metOntgrendeldeStreek(state, 2);
  state = metOntgrendeldeStreek(state, 3);
  // Weg op positie 4 (STAD_POSITIE) van streek 1 t/m 3 — de stadstegel zelf
  // (hoogte 1) telt al als weg (world.ts: `heeftWeg: true`).
  state = metWegCorridorNaarStreek(state, 3);

  const posities = bereikbarePosities(state.streken, { hoogte: 1, positieInStreek: 4 });

  assert.ok(
    posities.some((p) => p.hoogte === 2 && p.positieInStreek === 4),
    "het gewone buurvakje blijft ook gewoon bereikbaar"
  );
  assert.ok(
    posities.some((p) => p.hoogte === 3 && p.positieInStreek === 4),
    "het vakje 2 stappen verderop is bereikbaar omdat de hele route over de weg loopt"
  );
});

test("bereikbarePosities: geen extra stap als de weg halverwege ophoudt", () => {
  let state = maakInitieleSpelStatus();
  state = metOntgrendeldeStreek(state, 2);
  state = metOntgrendeldeStreek(state, 3);
  // Weg ligt alleen tot streek 2 — streek 3 zelf heeft geen weg.
  state = metWegCorridorNaarStreek(state, 2);

  const posities = bereikbarePosities(state.streken, { hoogte: 1, positieInStreek: 4 });

  assert.ok(!posities.some((p) => p.hoogte === 3 && p.positieInStreek === 4), "geen weg op het eindvakje, dus geen extra stap");
});

test("bereikbarePosities: geen extra stap als het vakje waar de settler op staat zelf geen weg heeft", () => {
  let state = maakInitieleSpelStatus();
  state = metOntgrendeldeStreek(state, 2);
  state = metOntgrendeldeStreek(state, 3);
  // Weg ligt op positie 3, van streek 2 t/m 3 — niet op het vakje waar de
  // settler hieronder op staat (hoogte 1, positie 3).
  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === 2 || streek.hoogte === 3
        ? { ...streek, tiles: streek.tiles.map((t) => (t.positieInStreek === 3 ? { ...t, heeftWeg: true } : t)) }
        : streek
    ),
  };

  const posities = bereikbarePosities(state.streken, { hoogte: 1, positieInStreek: 3 });

  assert.ok(
    !posities.some((p) => p.hoogte === 3 && p.positieInStreek === 3),
    "de route begint niet op een weg, dus telt niet als 'volledig over de weg'"
  );
});

test("verplaatsSettlerNaar: een klik op een vakje 2 stappen verderop over de weg verplaatst de settler in 1 beurt", () => {
  let state = maakInitieleSpelStatus();
  state = metOntgrendeldeStreek(state, 2);
  state = metOntgrendeldeStreek(state, 3);
  state = metWegCorridorNaarStreek(state, 3);
  state = { ...state, settler: { hoogte: 1, positieInStreek: 4 } };

  const naVerplaatsing = verplaatsSettlerNaar(state, 3, 4);

  assert.deepEqual(naVerplaatsing.settler, { hoogte: 3, positieInStreek: 4 });
  assert.equal(naVerplaatsing.settlerActieGedaanDitBeurt, true, "verbruikt de gewone settler-actie, net als een enkele stap");
});
