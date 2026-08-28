import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleWereld, startOceaanZichtbaar, zichtbareStreken } from "./world";
import { Streek } from "./types";

// Ontgrendelt streek 1 t/m `hoogte` zonder de rest van de teststreken aan te
// raken — gedeelde opzet voor de tests hieronder.
function metOntgrendeldTot(streken: Streek[], hoogte: number): Streek[] {
  return streken.map((streek) => (streek.hoogte <= hoogte ? { ...streek, ontgrendeld: true } : streek));
}

test("zichtbareStreken zonder ondergrens (default) gedraagt zich als voorheen: alleen de bovenkant wordt afgesneden", () => {
  const streken = metOntgrendeldTot(maakInitieleWereld(), 3);

  const zichtbaar = zichtbareStreken(streken);

  assert.equal(zichtbaar[0].hoogte, 1, "de onderste zichtbare streek blijft streek 1");
  assert.ok(
    zichtbaar.every((streek) => streek.hoogte <= 6),
    "mist-streken ver boven de frontier (vooruitkijk + 2) blijven afgesneden"
  );
});

test("zichtbareStreken met ondergrens snijdt ook de oudere, dichtgeklapte streken van onderaf af (issue: 'Nieuwe stad Cincinnati')", () => {
  const streken = metOntgrendeldTot(maakInitieleWereld(), 8);

  const zichtbaar = zichtbareStreken(streken, 5);

  assert.ok(
    zichtbaar.every((streek) => streek.hoogte >= 5),
    "geen enkele zichtbare streek ligt nog onder de ondergrens"
  );
  assert.equal(zichtbaar[0].hoogte, 5, "de streek op de ondergrens zelf (de nieuwe stad) blijft de onderste zichtbare streek");
  assert.ok(!zichtbaar.some((streek) => streek.hoogte < 5), "streek 1 t/m 4 zijn dichtgeklapt, dus niet meer in de lijst");
});

test("zichtbareStreken houdt de hoogte-nummering doorlopend en ongewijzigd (geen hernummering nodig)", () => {
  const streken = metOntgrendeldTot(maakInitieleWereld(), 8);

  const zichtbaar = zichtbareStreken(streken, 5);
  const hoogtes = zichtbaar.map((streek) => streek.hoogte);

  assert.deepEqual(hoogtes, [...hoogtes].sort((a, b) => a - b), "streken blijven oplopend gesorteerd op hun oorspronkelijke hoogte");
  assert.equal(hoogtes[0], 5);
});

test("startOceaanZichtbaar is true zolang streek 1 zichtbaar is, en false zodra die dichtgeklapt is", () => {
  const streken = metOntgrendeldTot(maakInitieleWereld(), 8);

  assert.equal(startOceaanZichtbaar(zichtbareStreken(streken)), true);
  assert.equal(startOceaanZichtbaar(zichtbareStreken(streken, 5)), false);
});
