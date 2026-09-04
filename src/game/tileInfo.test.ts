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

const LEGE_STAD: City = { naam: "test", grootte: 1, strijders: [], rechters: [], ingenieurs: [] } as unknown as City;

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

// Issue "Pop-up rivier" (vervolg): een rivier-vakje toont zijn eigen tekst
// i.p.v. de gewone "Leeg vakje"-beschrijving, ook op de frontier-streek.
test("de tile-info van een rivier-vakje verwijst naar de brug/engineer, niet naar de gewone bouwtekst", () => {
  const tiles: Tile[] = Array.from({ length: 9 }, (_, positieInStreek) => ({
    positieInStreek,
    terrein: "rivier" as const,
    status: "leeg" as const,
  }));
  const streek: Streek = { hoogte: 1, ontgrendeld: true, tiles, terreinType: "rivier" };
  const info = beschrijfTile(streek, [streek], LEGE_STAD, 0, { hout: 0, steen: 0, erts: 0, goud: 0 }, [], GOING_WEST_CAMPAGNE);
  assert.equal(info.titel, "Rivier");
  assert.equal(info.tekst.includes("brug"), true);
  assert.equal(info.tekst.includes("engineer"), true);
  assert.equal(info.tekst.includes("Hier kun je bouwen"), false);
});

// Vervolg (brug-bouwmechaniek): mét een beschikbare Ingenieur verschijnt de
// grondstofkosten-tekst i.p.v. de "leid eerst een engineer op"-tekst.
test("de tile-info van een rivier-vakje toont de brug-kosten zodra er een beschikbare Ingenieur is", () => {
  const tiles: Tile[] = Array.from({ length: 9 }, (_, positieInStreek) => ({
    positieInStreek,
    terrein: "rivier" as const,
    status: "leeg" as const,
  }));
  const streek: Streek = { hoogte: 1, ontgrendeld: true, tiles, terreinType: "rivier" };
  const stadMetIngenieur = { ...LEGE_STAD, ingenieurs: [{ id: "ingenieur-0" }] };
  const info = beschrijfTile(streek, [streek], stadMetIngenieur, 0, { hout: 0, steen: 0, erts: 0, goud: 0 }, [], GOING_WEST_CAMPAGNE);
  assert.equal(info.titel, "Rivier");
  assert.equal(info.tekst.includes("hout"), true);
  assert.equal(info.tekst.includes("steen"), true);
  assert.equal(info.tekst.includes("engineer"), false, "geen 'leid eerst op'-tekst meer, er is al een Ingenieur");
});

// Vervolg: een al gebouwde brug (`tile.brug`) krijgt een eigen titel/tekst
// i.p.v. de rivier-bouwtekst.
test("de tile-info van een gebouwde brug toont een eigen titel en tekst", () => {
  const tiles: Tile[] = Array.from({ length: 9 }, (_, positieInStreek) => ({
    positieInStreek,
    terrein: "rivier" as const,
    status: "leeg" as const,
    brug: positieInStreek === 0,
  }));
  const streek: Streek = { hoogte: 1, ontgrendeld: true, tiles, terreinType: "rivier" };
  const info = beschrijfTile(streek, [streek], LEGE_STAD, 0, { hout: 0, steen: 0, erts: 0, goud: 0 }, [], GOING_WEST_CAMPAGNE);
  assert.equal(info.titel, "Brug");
  assert.equal(info.tekst.includes("weg"), true, "vermeldt dat de brug zelf al als weg fungeert");
});
