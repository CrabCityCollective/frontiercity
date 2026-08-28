import test from "node:test";
import assert from "node:assert/strict";
import { BOON_POOL, komtInAanmerkingVoorBoon, trekBoon } from "./boons";
import { stichtStad, STICHTING_KOSTEN } from "./acties";
import { maakInitieleSpelStatus } from "./economie";
import { metActieveStad } from "./stad";
import { metVasteRandom } from "./testHelpers";

test("trekBoon trekt zonder terugleggen (issue #414, vraag 1): een al bezeten Boon komt niet opnieuw uit de pool", () => {
  const alleIds = BOON_POOL.map((boon) => boon.id);
  const gehad = alleIds.slice(0, -1);
  const laatsteId = alleIds[alleIds.length - 1];

  // Random blijft op 0 staan (zou zonder filtering altijd de eerste van de
  // pool teruggeven) — met alle andere Boons al "gehad" moet toch de enige
  // overgebleven Boon getrokken worden.
  const boon = metVasteRandom(0, () => trekBoon(gehad));
  assert.equal(boon?.id, laatsteId);
});

test("trekBoon geeft undefined als de speler alle Boons uit de pool al heeft", () => {
  const alleIds = BOON_POOL.map((boon) => boon.id);
  assert.equal(trekBoon(alleIds), undefined);
});

test("komtInAanmerkingVoorBoon: alleen bij een niet-afsluitende stichting, een 'grote' stad en buiten de tutorial (issue #414, vragen 1-3)", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = metActieveStad(state, { ...state.stad, grootte: "groot" });

  assert.equal(komtInAanmerkingVoorBoon(state, false), true, "Going West, grote stad, tussentijdse stichting: kans op een Boon");
  assert.equal(komtInAanmerkingVoorBoon(state, true), false, "de allerlaatste, afsluitende stichting geeft nooit een Boon");

  const kleineStad = metActieveStad(state, { ...state.stad, grootte: "klein" });
  assert.equal(komtInAanmerkingVoorBoon(kleineStad, false), false, "een stad die nooit 'groot' werd, geeft geen Boon");

  const tutorial = metActieveStad(maakInitieleSpelStatus(), { ...maakInitieleSpelStatus().stad, grootte: "groot" });
  assert.equal(komtInAanmerkingVoorBoon(tutorial, false), false, "de tutorial doet nooit mee aan het Boon-systeem (issue #414, vraag 3)");
});

test("stichtStad kent een Boon toe bij een tussentijdse Going West-stichting vanuit een grote stad (issue #411/#414)", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = metActieveStad(state, { ...state.stad, grootte: "groot" });
  state = {
    ...state,
    settler: { hoogte: 8, positieInStreek: 5 },
    streken: state.streken.map((streek) =>
      streek.hoogte === 8
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...state.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };

  const naStichten = metVasteRandom(0, () => stichtStad(state));
  assert.equal(naStichten.boons.length, 1, "een Boon wordt toegekend en run-breed opgeslagen");
  assert.equal(naStichten.boonToegekendEvent, naStichten.boons[0], "de pop-up-melding wijst naar de zojuist toegekende Boon");

  // Trekking zonder terugleggen: de tweede stichting vanuit een opnieuw
  // grote stad mag de zojuist getrokken Boon niet nog eens opleveren.
  let tweedeState = metActieveStad(naStichten, { ...naStichten.stad, grootte: "groot" });
  tweedeState = {
    ...tweedeState,
    settler: { hoogte: 20, positieInStreek: 5 },
    streken: tweedeState.streken.map((streek) =>
      streek.hoogte === 20
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...tweedeState.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naTweedeStichten = metVasteRandom(0, () => stichtStad(tweedeState));
  assert.equal(naTweedeStichten.boons.length, 2);
  assert.notEqual(naTweedeStichten.boons[1], naTweedeStichten.boons[0], "dezelfde Boon wordt niet twee keer getrokken (geen terugleggen)");
});

test("stichtStad kent geen Boon toe bij de afsluitende stichting, in de tutorial, of vanuit een niet-grote stad", () => {
  // Afsluitende stichting (tutorial-wereld, streek 14) — ook al is de stad
  // toevallig groot, dit is de allerlaatste stichting van de run.
  let afsluitend = maakInitieleSpelStatus("going-west");
  afsluitend = metActieveStad(afsluitend, { ...afsluitend.stad, grootte: "groot" });
  afsluitend = {
    ...afsluitend,
    settler: { hoogte: afsluitend.streken.length, positieInStreek: 5 },
    streken: afsluitend.streken.map((streek) =>
      streek.hoogte === afsluitend.streken.length
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...afsluitend.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naAfsluitend = stichtStad(afsluitend);
  assert.equal(naAfsluitend.boons.length, 0);
  assert.equal(naAfsluitend.boonToegekendEvent, undefined);

  // Tutorial (geen campagneId) — ook met een grote stad geen Boon.
  let tutorial = maakInitieleSpelStatus();
  tutorial = metActieveStad(tutorial, { ...tutorial.stad, grootte: "groot" });
  tutorial = {
    ...tutorial,
    settler: { hoogte: 14, positieInStreek: 5 },
    streken: tutorial.streken.map((streek) => (streek.hoogte === 14 ? { ...streek, ontgrendeld: true } : streek)),
    voorraad: { ...tutorial.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naTutorial = stichtStad(tutorial);
  assert.equal(naTutorial.boons.length, 0);

  // Kleine stad in Going West — geen Boon.
  let kleineStad = maakInitieleSpelStatus("going-west");
  kleineStad = {
    ...kleineStad,
    settler: { hoogte: 8, positieInStreek: 5 },
    streken: kleineStad.streken.map((streek) =>
      streek.hoogte === 8
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...kleineStad.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naKleineStad = stichtStad(kleineStad);
  assert.equal(naKleineStad.boons.length, 0);
});
