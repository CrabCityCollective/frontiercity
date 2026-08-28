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
  assert.equal(naStichten.stadGesticht, true, "streek 14 is de laatste streek van de tutorial-wereld, dus dit is de afsluitende stichting");
  assert.equal(naStichten.voorraad.hout, 0);
  assert.equal(naStichten.voorraad.steen, 0);
  assert.equal(naStichten.voorraad.erts, 0);
  assert.equal(naStichten.voedsel, 0);

  const gestichteTile = naStichten.streken.find((l) => l.hoogte === 14)!.tiles[5];
  assert.equal(gestichteTile.status, "actief");
  assert.equal(gestichteTile.improvement?.soort, "city");

  // M18: de nieuwe stad komt er echt bij (i.p.v. de oude te vervangen) en
  // wordt de actieve stad — Oer-stad blijft als eerder gestichte stad staan.
  assert.equal(naStichten.steden.length, 2);
  assert.equal(naStichten.steden[0].naam, "Oer-stad");
  assert.equal(naStichten.steden[1].naam, "Vuurbron");
  assert.equal(naStichten.steden[1].streekHoogte, 14);
  assert.deepEqual(naStichten.stad, naStichten.steden[1]);

  // Geen automatische nieuwe settler meer via het bestaande "settler
  // verschijnt bij beurt 2"-vangnet, ook niet een aantal beurten later.
  const naVolgendeBeurt = volgendeBeurt(naStichten);
  assert.equal(naVolgendeBeurt.settler, undefined);
});

test("stichtStad op een streek die niet de laatste van de wereld is, laat de run doorlopen i.p.v. eindigen (hoofdstuk 9 Deel 2, M18)", () => {
  let state = maakInitieleSpelStatus();
  // De tutorial-wereld zelf heeft maar één vers-water-vakje (op de laatste
  // streek) — dit test-scenario zet er handmatig eentje eerder neer om een
  // tussentijdse stichting uit het herhalende patroon te simuleren (zoals
  // een langere Amerikaanse-campagne-wereld die straks daadwerkelijk zou
  // opleveren, hoofdstuk 9/14).
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
  assert.equal(kanStichten(state), true);

  const naStichten = stichtStad(state);
  assert.equal(naStichten.stadGesticht, undefined, "streek 8 is niet de laatste streek van de wereld — de run eindigt niet");
  assert.equal(naStichten.settler, undefined, "de settler verdwijnt nog steeds bij het stichten");
  assert.equal(naStichten.steden.length, 2);
  assert.equal(naStichten.steden[1].streekHoogte, 8);
  assert.deepEqual(naStichten.stad, naStichten.steden[1], "de nieuwe stad wordt de actieve stad");
});

test("stichtStad geeft de tweede Going West-stad de naam Cincinnati (issue: 'Nieuwe stad Cincinnati')", () => {
  let state = maakInitieleSpelStatus("going-west");
  // Zelfde aanpak als de voorgaande test: een vers-water-vakje handmatig
  // neerzetten op een niet-laatste streek om een tussentijdse stichting uit
  // het herhalende patroon te simuleren.
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
  assert.equal(kanStichten(state), true);

  const naStichten = stichtStad(state);
  assert.equal(naStichten.steden.length, 2);
  assert.equal(naStichten.steden[1].naam, "Cincinnati");
  assert.deepEqual(naStichten.stad, naStichten.steden[1]);
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

// Roofdieren zijn pas mogelijk vanaf ROOFDIER_MIN_STREEK (issue: "Eerste
// streek geen roofdieren" — verplaatst van streek 1, waar spelers regelmatig
// een settler verloren voordat ze het risico ooit bewust hadden leren
// kennen; eerder al eens verplaatst náár streek 1 door issue "jagen en
// farmen omdraaien", wat dus te vroeg bleek).
test("jaag roept nooit een roofdier op vóór ROOFDIER_MIN_STREEK, ook niet bij een gunstige worp", () => {
  const state = metSettlerOpKuddeVakje(1);
  const naJacht = metVasteRandom(0, () => jaag(state));

  assert.equal(naJacht.roofdierEvent, undefined);
  const tile = naJacht.streken.find((l) => l.hoogte === 1)!.tiles[0];
  assert.equal(tile.roofdier, undefined);
});

// Gegarandeerd eerste roofdier (issue: "Eerste streek geen roofdieren" —
// "gegarandeerd roofdieren" bij de introductie): de allereerste jachtbeurt op
// of boven ROOFDIER_MIN_STREEK roept altijd een roofdier op, ongeacht de worp.
test("jaag roept op ROOFDIER_MIN_STREEK gegarandeerd een roofdier op bij de eerste jachtbeurt, ook bij een ongunstige worp", () => {
  const state = metSettlerOpKuddeVakje(6);
  const naJacht = metVasteRandom(0.99, () => jaag(state));

  assert.deepEqual(naJacht.roofdierEvent, { hoogte: 6, positieInStreek: 0, fase: "verschenen" });
  const tile = naJacht.streken.find((l) => l.hoogte === 6)!.tiles[0];
  assert.deepEqual(tile.roofdier, { beurtenTotAanval: 1 });
  assert.equal(naJacht.eersteRoofdierVerschenen, true);
});

test("jaag valt na het gegarandeerde eerste roofdier terug op de gewone 15%-kans", () => {
  let state = metSettlerOpKuddeVakje(6);
  state = metVasteRandom(0.99, () => jaag(state));
  assert.equal(state.eersteRoofdierVerschenen, true, "de garantie is verbruikt");

  // Simuleert een volgende, losstaande jachtbeurt (actie-vlag gereset, geen
  // nasleep van het eerste roofdier) om te bevestigen dat de garantie niet
  // blijft gelden.
  state = {
    ...state,
    settlerActieGedaanDitBeurt: false,
    roofdierEvent: undefined,
    streken: state.streken.map((l) =>
      l.hoogte === 6
        ? { ...l, tiles: l.tiles.map((t) => (t.positieInStreek === 0 ? { ...t, roofdier: undefined } : t)) }
        : l
    ),
  };
  const naTweedeJacht = metVasteRandom(0.99, () => jaag(state));
  assert.equal(naTweedeJacht.roofdierEvent, undefined, "een ongunstige worp ná de garantie levert geen roofdier meer op");
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

test("Handkar (settlerBeweegtGratis): alleen de eerste verplaatsing per beurt is gratis, niet elke volgende", () => {
  const state: GameState = {
    ...maakInitieleSpelStatus(),
    technologieen: ["spoor-lezen", "wiel", "handkar"],
    settler: { hoogte: 1, positieInStreek: 4 },
  };

  const naEersteZet = verplaatsSettlerNaar(state, 1, 3);
  assert.equal(naEersteZet.settlerActieGedaanDitBeurt, false, "de eerste verplaatsing is gratis dankzij Handkar");
  assert.equal(naEersteZet.settlerGratisBewogenDitBeurt, true, "de gratis verplaatsing is nu gebruikt voor deze beurt");

  // Zonder de fix bleef `settlerActieGedaanDitBeurt` bij élke verplaatsing op
  // `false` staan, waardoor de settler onbeperkt kon doorlopen in 1 beurt
  // (issue: "tech met settler verplaatsen"). Een tweede verplaatsing dezelfde
  // beurt moet daarom weer gewoon de normale settler-actie verbruiken.
  const naTweedeZet = verplaatsSettlerNaar(naEersteZet, 1, 2);
  assert.deepEqual(naTweedeZet.settler, { hoogte: 1, positieInStreek: 2 });
  assert.equal(naTweedeZet.settlerActieGedaanDitBeurt, true, "de tweede verplaatsing verbruikt de settler-actie");

  const naDerdeZetPoging = verplaatsSettlerNaar(naTweedeZet, 1, 1);
  assert.equal(naDerdeZetPoging, naTweedeZet, "geen actie meer over, dus een derde verplaatsing heeft geen effect");

  // Volgende beurt is de gratis verplaatsing weer beschikbaar.
  const volgende = volgendeBeurt(naTweedeZet);
  assert.equal(volgende.settlerGratisBewogenDitBeurt, false);
  assert.equal(volgende.settlerActieGedaanDitBeurt, false);
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
