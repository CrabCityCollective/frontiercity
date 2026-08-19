import test from "node:test";
import assert from "node:assert/strict";
import {
  hakHout,
  heeftGenoegVoorStichten,
  jaag,
  kanStichten,
  legWegAan,
  STICHTING_KOSTEN,
  stichtStad,
  verplaatsSettlerNaar,
} from "./acties";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { GameState } from "./types";
import { HOUTKAP, metSettlerOpKuddeVakje, metVasteRandom } from "./testHelpers";

test("stichtStad vereist een geschikte locatie én genoeg grondstoffen, en verbruikt daarna de settler", () => {
  let state = maakInitieleSpelStatus();
  // Streek 14, positie 5 is in world.ts vastgelegd als het (enige) vers-water-
  // vakje van de tutorial (TUTORIAL_VERS_WATER) — de settler moet er wel
  // eerst kunnen staan, dus die streek moet ontgrendeld zijn.
  state = {
    ...state,
    settler: { hoogte: 14, positieInStreek: 5 },
    streken: state.streken.map((streek) => (streek.hoogte === 14 ? { ...streek, ontgrendeld: true } : streek)),
  };

  assert.equal(kanStichten(state), true, "een leeg, vers-water-vakje met de settler erop is een geldig doel");
  assert.equal(heeftGenoegVoorStichten(state), false, "de startvoorraad is niet genoeg om te stichten");
  assert.equal(stichtStad(state), state, "stichtStad heeft geen effect zolang de kosten niet betaald kunnen worden");

  state = {
    ...state,
    voorraad: { ...state.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  assert.equal(heeftGenoegVoorStichten(state), true);

  const naStichten = stichtStad(state);
  assert.equal(naStichten.settler, undefined, "de settler verdwijnt bij het stichten");
  assert.equal(naStichten.stadGesticht, true);
  assert.equal(naStichten.voorraad.hout, 0);
  assert.equal(naStichten.voorraad.steen, 0);
  assert.equal(naStichten.voorraad.erts, 0);
  assert.equal(naStichten.voedsel, 0);

  const gestichteTile = naStichten.streken.find((l) => l.hoogte === 14)!.tiles[5];
  assert.equal(gestichteTile.status, "actief");
  assert.equal(gestichteTile.improvement?.soort, "city");

  // Geen automatische nieuwe settler meer via het bestaande "settler
  // verschijnt bij beurt 2"-vangnet, ook niet een aantal beurten later.
  const naVolgendeBeurt = volgendeBeurt(naStichten);
  assert.equal(naVolgendeBeurt.settler, undefined);
});

test("kanStichten is false op een vakje zonder vers water, of als het vakje al bebouwd is", () => {
  let state = maakInitieleSpelStatus();
  // Startstreek/positie (STAD_POSITIE) heeft geen vers water in de tutorial-data.
  state = { ...state, settler: { hoogte: 1, positieInStreek: 0 } };
  assert.equal(kanStichten(state), false);

  state = {
    ...state,
    settler: { hoogte: 14, positieInStreek: 5 },
    streken: state.streken.map((streek) =>
      streek.hoogte === 14
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 5 ? { ...tile, status: "actief" as const, improvement: HOUTKAP } : tile
            ),
          }
        : streek
    ),
  };
  assert.equal(kanStichten(state), false, "een al bebouwd vakje is geen geldig stichtingsdoel, ook al ligt het aan water");
});

// Roofdieren zijn al vanaf streek 1 mogelijk (issue: "jagen en farmen
// omdraaien" — de jacht is nu vanaf streek 1 de eerste voedselbron, dus het
// roofdier-risico hoort er meteen bij, was voorheen pas vanaf streek 5).
test("jaag roept al op streek 1 een roofdier op als de worp binnen de kans valt", () => {
  const state = metSettlerOpKuddeVakje(1);
  const naJacht = metVasteRandom(0, () => jaag(state));

  assert.deepEqual(naJacht.roofdierEvent, { hoogte: 1, positieInStreek: 0, fase: "verschenen" });
  const tile = naJacht.streken.find((l) => l.hoogte === 1)!.tiles[0];
  assert.deepEqual(tile.roofdier, { beurtenTotAanval: 1 });
});

test("jaag roept geen roofdier op bij een ongunstige worp", () => {
  const state = metSettlerOpKuddeVakje(1);
  const naJacht = metVasteRandom(0.99, () => jaag(state));

  assert.equal(naJacht.roofdierEvent, undefined);
  const tile = naJacht.streken.find((l) => l.hoogte === 1)!.tiles[0];
  assert.equal(tile.roofdier, undefined);
});

// Streek 1, positie 2 is vast terrein-subtype "bos" (world.ts, TUTORIAL_TERREIN).
test("hakHout levert 1 hout op als de settler op een leeg bos-vakje staat", () => {
  const state: GameState = { ...maakInitieleSpelStatus(), settler: { hoogte: 1, positieInStreek: 2 } };

  const naHakken = hakHout(state);

  assert.equal(naHakken.voorraad.hout, state.voorraad.hout + 1);
  assert.equal(naHakken.settlerActieGedaanDitBeurt, true);
});

// Tweede settler (issue: "Altijd 2e settler" #236): elke actie neemt een
// `slot`-parameter (default "primair") zodat de twee settlers volledig
// onafhankelijk van elkaar kunnen handelen — dit is de kern van wat #236
// vroeg ("nog een beetje jagen op kuddes en wachttorens herbouwen").
test("een actie op slot 'tweede' raakt alleen de tweede settler, en omgekeerd (issue #236)", () => {
  let state: GameState = {
    ...maakInitieleSpelStatus(),
    settler: { hoogte: 1, positieInStreek: 2 },
    tweedeSettler: { hoogte: 1, positieInStreek: 0 },
  };

  const naWeg = legWegAan(state, "tweede");
  assert.equal(naWeg.tweedeSettlerActieGedaanDitBeurt, true, "de tweede settler heeft zijn actie gebruikt");
  assert.equal(naWeg.settlerActieGedaanDitBeurt, false, "de eerste settler is nog niet geraakt");
  assert.equal(naWeg.streken.find((l) => l.hoogte === 1)!.tiles[0].heeftWeg, true, "de weg ligt op de tweede settler zijn vakje");
  assert.equal(naWeg.streken.find((l) => l.hoogte === 1)!.tiles[2].heeftWeg, undefined, "niet op het vakje van de eerste settler");

  // De eerste settler kan deze beurt nog gewoon zelf een actie doen — de twee
  // acties concurreren niet met elkaar.
  const naHakken = hakHout(naWeg);
  assert.equal(naHakken.settlerActieGedaanDitBeurt, true);
  assert.equal(naHakken.tweedeSettlerActieGedaanDitBeurt, true, "blijft ongewijzigd van de vorige actie");

  // Verplaatsen op slot "tweede" raakt alleen `tweedeSettler`.
  const state2: GameState = {
    ...maakInitieleSpelStatus(),
    settler: { hoogte: 1, positieInStreek: 4 },
    tweedeSettler: { hoogte: 1, positieInStreek: 4 },
  };
  const naVerplaatsing = verplaatsSettlerNaar(state2, 1, 3, "tweede");
  assert.deepEqual(naVerplaatsing.tweedeSettler, { hoogte: 1, positieInStreek: 3 });
  assert.deepEqual(naVerplaatsing.settler, { hoogte: 1, positieInStreek: 4 }, "de eerste settler bleef staan");
});

test("hakHout doet niets op een uitgeputte (ghost_town) Houtkap-tile, ook al blijft het terrein bos", () => {
  const state = maakInitieleSpelStatus();
  const metUitgeputteHoutkap: GameState = {
    ...state,
    settler: { hoogte: 1, positieInStreek: 2 },
    streken: state.streken.map((streek) =>
      streek.hoogte !== 1
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 2 ? { ...tile, status: "ghost_town" as const, improvement: HOUTKAP } : tile
            ),
          }
    ),
  };

  const naHakken = hakHout(metUitgeputteHoutkap);

  assert.equal(naHakken, metUitgeputteHoutkap, "geen verandering: een verlaten vakje levert geen gratis hout meer");
  assert.equal(naHakken.settlerActieGedaanDitBeurt, false);
});
