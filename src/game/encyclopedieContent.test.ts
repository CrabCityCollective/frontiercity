import test from "node:test";
import assert from "node:assert/strict";
import { ENCYCLOPEDIE_LEMMAS } from "./encyclopedieContent";
import { BOON_POOL } from "./boons";

test("ENCYCLOPEDIE_LEMMAS heeft geen dubbele ids", () => {
  const ids = ENCYCLOPEDIE_LEMMAS.map((lemma) => lemma.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("elke Boon uit BOON_POOL heeft een eigen encyclopedie-lemma in de categorie 'Boons' (issue Boons)", () => {
  for (const boon of BOON_POOL) {
    const lemma = ENCYCLOPEDIE_LEMMAS.find((l) => l.id === `boon-${boon.id}`);
    assert.ok(lemma, `geen lemma gevonden voor Boon ${boon.id}`);
    assert.equal(lemma!.categorie, "Boons");
    assert.equal(lemma!.titel, boon.naam);
    assert.equal(lemma!.tekst, boon.beschrijving);
  }
});
