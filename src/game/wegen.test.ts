import test from "node:test";
import assert from "node:assert/strict";
import { bereikbarePosities, isTileVerbondenMetStad, magSettlerNaar, ontdekVakjeViaTrailBlazer } from "./wegen";
import { verplaatsSettlerNaar } from "./acties";
import { TRAIL_BLAZER_BOON_ID } from "./boons";
import { maakInitieleSpelStatus, maakDebugSpelStatusGoingWest } from "./economie";
import { GameState } from "./types";
import { metWegCorridorNaarStreek } from "./testHelpers";
import { BEZETTE_STREEK_HOOGTE } from "./world";
import { RIVIER_STREEK_HOOGTE, WAMPANOAG_STREEK_HOOGTE } from "./worldGoingWest";

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

// Rivier & brug (issue "Pop-up rivier", vervolg: brug-bouwmechaniek): "een
// rivier vakje mag niet begaanbaar zijn voor settlers zonder een brug".
test("magSettlerNaar: een rivier-vakje zonder brug is onbegaanbaar, met brug wel", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = metOntgrendeldeStreek(state, RIVIER_STREEK_HOOGTE);

  assert.equal(
    magSettlerNaar(state.streken, { hoogte: RIVIER_STREEK_HOOGTE, positieInStreek: 0 }),
    false,
    "geen brug — onbegaanbaar"
  );

  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === RIVIER_STREEK_HOOGTE
        ? { ...streek, tiles: streek.tiles.map((t) => (t.positieInStreek === 0 ? { ...t, brug: true } : t)) }
        : streek
    ),
  };

  assert.equal(
    magSettlerNaar(state.streken, { hoogte: RIVIER_STREEK_HOOGTE, positieInStreek: 0 }),
    true,
    "met brug — wel begaanbaar"
  );
  // Een ander rivier-vakje op dezelfde streek, zonder eigen brug, blijft
  // gewoon onbegaanbaar — de brug geldt alleen voor het vakje waar hij op
  // gebouwd is.
  assert.equal(magSettlerNaar(state.streken, { hoogte: RIVIER_STREEK_HOOGTE, positieInStreek: 1 }), false);
});

// "een brug hoeft geen weg te hebben, hij fungeert al als weg" (issue) — een
// brug-vakje telt vanzelf mee in het wegennetwerk (`heeftWegOp`, wegen.ts),
// zonder dat de settler er ook nog eens los een weg op hoeft aan te leggen.
test("isTileVerbondenMetStad: een brug op een rivier-vakje telt vanzelf al als weg, zonder aparte wegaanleg", () => {
  let state = maakInitieleSpelStatus("going-west");
  // Weg tot en met de streek net onder de rivier-streek.
  state = metWegCorridorNaarStreek(state, RIVIER_STREEK_HOOGTE - 1);
  // Een land improvement ná de rivier heeft zelf ook al een weg.
  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === RIVIER_STREEK_HOOGTE + 1
        ? { ...streek, tiles: streek.tiles.map((t) => (t.positieInStreek === 4 ? { ...t, heeftWeg: true } : t)) }
        : streek
    ),
  };

  assert.equal(
    isTileVerbondenMetStad(state.streken, RIVIER_STREEK_HOOGTE + 1, 4),
    false,
    "geen brug op de rivier-streek zelf — nog niet verbonden"
  );

  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === RIVIER_STREEK_HOOGTE
        ? { ...streek, tiles: streek.tiles.map((t) => (t.positieInStreek === 4 ? { ...t, brug: true } : t)) }
        : streek
    ),
  };

  assert.equal(
    isTileVerbondenMetStad(state.streken, RIVIER_STREEK_HOOGTE + 1, 4),
    true,
    "de brug zelf telt al als weg — geen los aangelegde weg nodig op het brug-vakje"
  );
});

// "Trail Blazer"-Boon (issue #539, boons.ts): de enige uitzondering op "de
// settler blijft binnen al ontgrendeld gebied" — met `magBaanbreken` mag hij
// een individueel, nog niet ontdekt vakje in, ongeacht hoe ver dat van de
// frontier ligt. Hoe ver de settler in de praktijk per beurt kán komen wordt
// niet door `magSettlerNaar` zelf begrensd, maar door `bereikbarePosities`
// (die alleen buurvakjes van de huidige positie oplevert) en de
// trailblazer-punten (`ontdekVakjeViaTrailBlazer` hieronder).
test("magSettlerNaar: met magBaanbreken mag de settler een nog niet ontdekt vakje in, ook voorbij de vooruitkijk-streek", () => {
  const state = maakInitieleSpelStatus();

  assert.equal(
    magSettlerNaar(state.streken, { hoogte: 2, positieInStreek: 4 }),
    false,
    "zonder magBaanbreken blijft streek 2 (nog vergrendeld) onbereikbaar"
  );
  assert.equal(
    magSettlerNaar(state.streken, { hoogte: 2, positieInStreek: 4 }, true),
    true,
    "met magBaanbreken mag de settler de eerstvolgende vergrendelde streek in"
  );
  assert.equal(
    magSettlerNaar(state.streken, { hoogte: 3, positieInStreek: 4 }, true),
    true,
    "ook een streek verder mag, magSettlerNaar begrenst dat zelf niet meer"
  );
});

test("magSettlerNaar: een al eerder ontdekt vakje blijft begaanbaar, ook zonder magBaanbreken", () => {
  const state = maakInitieleSpelStatus();
  const metOntdektVakje = {
    ...state,
    streken: state.streken.map((l) =>
      l.hoogte === 2 ? { ...l, tiles: l.tiles.map((t) => (t.positieInStreek === 4 ? { ...t, trailOntdekt: true } : t)) } : l
    ),
  };

  assert.equal(magSettlerNaar(metOntdektVakje.streken, { hoogte: 2, positieInStreek: 4 }), true);
});

test("magSettlerNaar: de Bezette Streek en de Wampanoag-laag blijven uitgesloten, ook met magBaanbreken", () => {
  const tutorial = maakInitieleSpelStatus();
  const goingWest = maakInitieleSpelStatus("going-west");

  assert.equal(
    magSettlerNaar(tutorial.streken, { hoogte: BEZETTE_STREEK_HOOGTE, positieInStreek: 4 }, true, tutorial.campagneId),
    false,
    "tutorial: Bezette Streek blijft onbereikbaar, ook met de Boon"
  );
  assert.equal(
    magSettlerNaar(
      goingWest.streken,
      { hoogte: WAMPANOAG_STREEK_HOOGTE, positieInStreek: 4 },
      true,
      goingWest.campagneId
    ),
    false,
    "Going West: Wampanoag-laag blijft onbereikbaar, ook met de Boon"
  );
});

test("bereikbarePosities: met magBaanbreken staat de vooruitkijk-streek erbij tussen de bereikbare vakjes", () => {
  const state = maakInitieleSpelStatus();

  const zonderBaanbreken = bereikbarePosities(state.streken, { hoogte: 1, positieInStreek: 4 });
  assert.ok(!zonderBaanbreken.some((p) => p.hoogte === 2), "zonder de Boon blijft streek 2 onbereikbaar");

  const metBaanbreken = bereikbarePosities(state.streken, { hoogte: 1, positieInStreek: 4 }, true);
  assert.ok(
    metBaanbreken.some((p) => p.hoogte === 2 && p.positieInStreek === 4),
    "met de Boon is het buurvakje op streek 2 erbij"
  );
});

// "Trail Blazer"-puntenbesteding (issue #539, boons.ts): `ontdekVakjeViaTrailBlazer`.
test("ontdekVakjeViaTrailBlazer: markeert het vakje en trekt 1 punt af", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, boons: [TRAIL_BLAZER_BOON_ID], trailblazerPunten: 5 };

  const naOntdekking = ontdekVakjeViaTrailBlazer(state, 2, 4);

  assert.equal(
    naOntdekking.streken.find((l) => l.hoogte === 2)!.tiles[4].trailOntdekt,
    true,
    "het vakje is nu individueel ontdekt"
  );
  assert.equal(
    naOntdekking.streken.find((l) => l.hoogte === 2)!.ontgrendeld,
    false,
    "de streek zelf blijft ongewijzigd vergrendeld — geen streek-brede ontgrendeling"
  );
  assert.equal(naOntdekking.trailblazerPunten, 4, "1 punt besteed");
});

test("ontdekVakjeViaTrailBlazer: no-op zonder punten meer over", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, boons: [TRAIL_BLAZER_BOON_ID], trailblazerPunten: 0 };

  assert.equal(ontdekVakjeViaTrailBlazer(state, 2, 4), state, "geen punten meer, dus geen ontdekking");
});

test("ontdekVakjeViaTrailBlazer: no-op als het vakje al ontgrendeld of al ontdekt is", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, boons: [TRAIL_BLAZER_BOON_ID], trailblazerPunten: 5 };
  const alOntgrendeld = { ...state, streken: state.streken.map((l) => (l.hoogte === 2 ? { ...l, ontgrendeld: true } : l)) };

  assert.equal(ontdekVakjeViaTrailBlazer(alOntgrendeld, 2, 4), alOntgrendeld, "niets te ontdekken, dus dezelfde state terug");

  const naEersteOntdekking = ontdekVakjeViaTrailBlazer(state, 2, 4);
  assert.equal(
    ontdekVakjeViaTrailBlazer(naEersteOntdekking, 2, 4),
    naEersteOntdekking,
    "al ontdekt — geen tweede punt besteed aan hetzelfde vakje"
  );
});

test("ontdekVakjeViaTrailBlazer: no-op op de Bezette Streek en de Wampanoag-laag (die blijven bevroren)", () => {
  let tutorial = maakInitieleSpelStatus();
  tutorial = { ...tutorial, boons: [TRAIL_BLAZER_BOON_ID], trailblazerPunten: 5 };
  let goingWest = maakInitieleSpelStatus("going-west");
  goingWest = { ...goingWest, boons: [TRAIL_BLAZER_BOON_ID], trailblazerPunten: 5 };

  assert.equal(
    ontdekVakjeViaTrailBlazer(tutorial, BEZETTE_STREEK_HOOGTE, 4),
    tutorial,
    "de Bezette Streek blijft bevroren, ook met Trail Blazer"
  );
  assert.equal(
    ontdekVakjeViaTrailBlazer(goingWest, WAMPANOAG_STREEK_HOOGTE, 4),
    goingWest,
    "de Wampanoag-laag blijft bevroren, ook met Trail Blazer"
  );
});

// Regressie (issue: "Vreemd: boerderij niet verbonden"): met de "Test start
// streek"-debugwereld staat de (enige) stad niet op streek 1 maar op de
// gekozen streek (hier 9) — een wegennetwerk dat altijd hardcoded bij streek
// 1 begint te zoeken vindt die stad dan nooit, en ziet elk land improvement
// eromheen ten onrechte als "niet verbonden", ook met een weg ernaartoe.
test("isTileVerbondenMetStad: op de debugwereld (stad niet op streek 1) telt een weg naast de stad toch als verbonden", () => {
  const state = maakDebugSpelStatusGoingWest(9);

  const naastDeStad = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === 9
        ? { ...streek, tiles: streek.tiles.map((t) => (t.positieInStreek === 5 ? { ...t, heeftWeg: true } : t)) }
        : streek
    ),
  };

  assert.equal(
    isTileVerbondenMetStad(naastDeStad.streken, 9, 5),
    true,
    "de stad staat op streek 9, niet streek 1 — het netwerk moet daar toch vanaf zoeken"
  );
});
