import test from "node:test";
import assert from "node:assert/strict";
import { GOING_WEST_CAMPAGNE } from "./campagnes";
import { VIJANDELIJKE_WACHTTOREN } from "./improvements";
import { beschrijfTile } from "./tileInfo";
import { City, Streek, Tile } from "./types";
import { HOUTKAP } from "./testHelpers";

// Zelfde minimale Streek-fixture-opzet als onrust.test.ts (`maakStreek`) —
// 5 gewone improvements (genoeg voor onrust > 0, zie onrust.ts: de
// vijandelijke Wachttoren zelf telt niet mee voor de drempel) plus een
// vijandelijke Wachttoren op positie 5.
function maakStreekMetVijandelijkeWachttoren(): Streek {
  const tiles: Tile[] = Array.from({ length: 9 }, (_, positieInStreek) => {
    if (positieInStreek === 5) {
      return { positieInStreek, terrein: "vlak", status: "actief" as const, improvement: VIJANDELIJKE_WACHTTOREN };
    }
    if (positieInStreek <= 4) {
      return { positieInStreek, terrein: "vlak", status: "actief" as const, improvement: HOUTKAP, heeftWeg: true };
    }
    return { positieInStreek, terrein: "vlak", status: "leeg" as const };
  });
  return { hoogte: 1, ontgrendeld: true, tiles, terreinType: "test" };
}

const LEGE_STAD: City = { naam: "test", grootte: 1, strijders: [], rechters: [] } as unknown as City;

test("de tile-info van een vijandelijke Wachttoren laat de wegverbindings- en onrusttekst weg", () => {
  const streek = maakStreekMetVijandelijkeWachttoren();
  const info = beschrijfTile(streek, [streek], LEGE_STAD, 5, { hout: 0, steen: 0, erts: 0, goud: 0 }, [], GOING_WEST_CAMPAGNE);
  assert.equal(info.tekst.includes("verbonden met de stad"), false);
  assert.equal(info.tekst.includes("Onrust"), false);
});

test("de tile-info van een gewoon land improvement op dezelfde streek toont de onrusttekst wel", () => {
  const streek = maakStreekMetVijandelijkeWachttoren();
  const info = beschrijfTile(streek, [streek], LEGE_STAD, 0, { hout: 0, steen: 0, erts: 0, goud: 0 }, [], GOING_WEST_CAMPAGNE);
  assert.equal(info.tekst.includes("Onrust op deze streek"), true);
});
