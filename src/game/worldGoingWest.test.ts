import test from "node:test";
import assert from "node:assert/strict";
import { vindStichtingskansGaten } from "./stad";
import { GOING_WEST_STREEK_AANTAL, maakInitieleWereldGoingWest } from "./worldGoingWest";

test("maakInitieleWereldGoingWest levert de volledige Normaal-lengte kaart, ononderbroken van hoogte 1", () => {
  const streken = maakInitieleWereldGoingWest();
  assert.equal(streken.length, GOING_WEST_STREEK_AANTAL);
  assert.ok(GOING_WEST_STREEK_AANTAL >= 30 && GOING_WEST_STREEK_AANTAL <= 40);
  streken.forEach((streek, i) => assert.equal(streek.hoogte, i + 1));
});

test("elke streek heeft precies 9 tiles en houdt minstens 1 vlak/bos/heuvel-of-berg vakje aan", () => {
  const streken = maakInitieleWereldGoingWest();
  for (const streek of streken) {
    assert.equal(streek.tiles.length, 9);
    const terreinen = streek.tiles.map((t) => t.terrein);
    assert.ok(terreinen.includes("vlak"), `streek ${streek.hoogte} mist een vlak vakje`);
    assert.ok(terreinen.includes("bos"), `streek ${streek.hoogte} mist een bos-vakje`);
    assert.ok(
      terreinen.includes("heuvel") || terreinen.includes("berg"),
      `streek ${streek.hoogte} mist een heuvel/berg-vakje`
    );
  }
});

test("alleen streek 1 begint ontgrendeld, met de startstad op de middelste positie", () => {
  const streken = maakInitieleWereldGoingWest();
  assert.equal(streken[0].ontgrendeld, true);
  assert.ok(streken.slice(1).every((streek) => streek.ontgrendeld === false));

  const stadTile = streken[0].tiles[4];
  assert.equal(stadTile.status, "actief");
  assert.equal(stadTile.improvement?.effect.type, "stad");
  assert.equal(stadTile.heeftWeg, true);
});

// Issue "Going west campaign geen tutorial": streek 1-4 (de openingsfase)
// hadden oorspronkelijk maar één heuvel-vakje en géén berg-vakje, net als de
// tutorial. Sinds `beschikbareOpties` de tutorial-`minStreek`-gating niet meer
// toepast op Going West kan de speler daar al vanaf streek 1 tegelijk
// Steengroeve, Mijn en Goudader willen bouwen — dus moeten er ook
// daadwerkelijk minstens drie heuvel/berg-vakjes zijn.
test("streek 1-4 hebben elk minstens drie heuvel/berg-vakjes (Steengroeve + Mijn + Goudader tegelijk bouwbaar)", () => {
  const streken = maakInitieleWereldGoingWest();
  for (const streek of streken.slice(0, 4)) {
    const heuvelOfBerg = streek.tiles.filter((t) => t.terrein === "heuvel" || t.terrein === "berg").length;
    assert.ok(heuvelOfBerg >= 3, `streek ${streek.hoogte} heeft maar ${heuvelOfBerg} heuvel/berg-vakjes`);
  }
});

test("streek 1 heeft al een goud-vondst (alle grondstoffen, inclusief goud, komen op streek 1 voor)", () => {
  const streken = maakInitieleWereldGoingWest();
  assert.ok(streken[0].tiles.some((t) => t.goud), "streek 1 mist een goud-vakje");
});

test("goud ligt uitsluitend op een heuvel- of bergvakje (de mijn-terreineis)", () => {
  const streken = maakInitieleWereldGoingWest();
  for (const streek of streken) {
    for (const tile of streek.tiles) {
      if (tile.goud) {
        assert.ok(
          tile.terrein === "heuvel" || tile.terrein === "berg",
          `goud op streek ${streek.hoogte} positie ${tile.positieInStreek} staat op terrein "${tile.terrein}"`
        );
      }
    }
  }
});

test("vers water staat nooit op het stad-vakje (positie 4) en de vondsten liggen verspreid over de hele kaart", () => {
  const streken = maakInitieleWereldGoingWest();
  const versWaterHoogten: number[] = [];
  for (const streek of streken) {
    for (const tile of streek.tiles) {
      if (tile.versWater) {
        assert.notEqual(tile.positieInStreek, 4);
        versWaterHoogten.push(streek.hoogte);
      }
    }
  }
  assert.ok(versWaterHoogten.length >= 5, "te weinig vers-water-vakjes voor een herhalend stichtingspatroon");
  assert.ok(
    versWaterHoogten[versWaterHoogten.length - 1] > GOING_WEST_STREEK_AANTAL - 5,
    "geen vers water dicht bij het einde van de kaart"
  );
});

test("M20c: gegarandeerdeStichtingskansHoogten() heeft op elke bereikbare stichtingshoogte een vers-water-treffer in alle drie de kans-vensters", () => {
  const streken = maakInitieleWereldGoingWest();
  const versWaterHoogten = streken
    .flatMap((streek) => streek.tiles.map((tile) => (tile.versWater ? streek.hoogte : null)))
    .filter((hoogte): hoogte is number => hoogte !== null);

  const gaten = vindStichtingskansGaten(1, versWaterHoogten, GOING_WEST_STREEK_AANTAL);

  assert.deepEqual(
    gaten,
    [],
    `de kaart laat het herhalende drie-stichtingsmomenten-patroon niet overal zien: ${JSON.stringify(gaten)}`
  );
});
