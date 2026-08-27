import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import {
  kanIndringersAfkopenMetWampum,
  koopIndringersAfMetWampum,
  wampumAfkoopKosten,
  wampumAfkoopKostenHuidig,
} from "./indringersEnDieren";
import { verwerkWampanoagFaseAfsluiting } from "./wampanoag";
import { GameState } from "./types";
import { metRandomReeks, metWampanoagLaagOnthuld, WACHTTOREN } from "./testHelpers";

// Gedeelde opzet: Going West met de Wampanoag-3-3-3-drempel al gehaald
// (`verwerkWampanoagFaseAfsluiting` direct aangeroepen op een status met de
// drempel-waarden, i.p.v. een volledige `volgendeBeurt` — dat voorkomt
// bijwerkingen van andere kans-gebaseerde stappen in diezelfde beurt). Dit is
// de voorwaarde die het issue expliciet vraagt: "pas in effect ... op het
// moment dat de Wampanoag zijn gepacificeerd".
function metGepacificeerdeWampanoag(): GameState {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, bevervellen: 3, mais: 3, wampum: 10 };
  return verwerkWampanoagFaseAfsluiting(state);
}

test("wampumAfkoopKosten volgt de gevraagde reeks 3, 5, 8, daarna +4 per keer", () => {
  assert.equal(wampumAfkoopKosten(0), 3);
  assert.equal(wampumAfkoopKosten(1), 5);
  assert.equal(wampumAfkoopKosten(2), 8);
  assert.equal(wampumAfkoopKosten(3), 12);
  assert.equal(wampumAfkoopKosten(4), 16);
});

test("de wampum-afkoop-keuze is niet beschikbaar vóór de Wampanoag gepacificeerd zijn, ook met genoeg wampum en een lopend tribuut-incident", () => {
  let state = metWampanoagLaagOnthuld();
  state = {
    ...state,
    wampum: 100,
    indringersEvent: {
      streekHoogte: 1,
      stamNaam: "de Wampanoag",
      heeftWachttoren: false,
      tribuut: { resource: "hout", aantal: 5 },
      fase: "gemeld",
    },
  };

  assert.equal(
    kanIndringersAfkopenMetWampum(state),
    false,
    "vóór het verbond mag wampum nog niet als afkoopvaluta gebruikt worden"
  );

  const naPoging = koopIndringersAfMetWampum(state);
  assert.equal(naPoging, state, "een genegeerde aanroep verandert niets aan de state");
});

test("ná het Wampanoag-verbond koopt wampum een lopend tribuut-incident af: kosten worden afgetrokken en de stam krijgt tijdelijke rust", () => {
  let state = metGepacificeerdeWampanoag();
  assert.equal(state.streken.find((s) => s.wampanoagBezet !== undefined)?.wampanoagBezet, false);

  state = {
    ...state,
    beurt: 10,
    indringersEvent: {
      streekHoogte: 1,
      stamNaam: "de Shawnee",
      heeftWachttoren: false,
      tribuut: { resource: "hout", aantal: 5 },
      fase: "gemeld",
    },
  };

  assert.equal(kanIndringersAfkopenMetWampum(state), true);
  assert.equal(wampumAfkoopKostenHuidig(state), 3, "eerste afkoop bij deze stam kost de basisprijs");

  state = koopIndringersAfMetWampum(state);
  assert.equal(state.wampum, 7, "de kosten (3) zijn direct van de wampum-voorraad afgetrokken");
  assert.equal(state.wampumAfkoopPerStam["de Shawnee"].aantalAfgekocht, 1);
  assert.equal(state.wampumAfkoopPerStam["de Shawnee"].rustTotBeurt, 16, "6 beurten rust vanaf beurt 10");
  assert.equal(state.indringersEvent?.fase, "wampum-afgekocht", "de melding sluit niet meteen, toont eerst een bevestiging");
});

test("een tweede afkoop bij dezelfde stam kost meer dan de eerste (oplopende kosten)", () => {
  let state = metGepacificeerdeWampanoag();
  state = {
    ...state,
    beurt: 1,
    wampumAfkoopPerStam: { "de Shawnee": { aantalAfgekocht: 1, rustTotBeurt: 0 } },
    indringersEvent: {
      streekHoogte: 1,
      stamNaam: "de Shawnee",
      heeftWachttoren: false,
      tribuut: { resource: "hout", aantal: 5 },
      fase: "gemeld",
    },
  };

  assert.equal(wampumAfkoopKostenHuidig(state), 5, "tweede keer afkopen bij deze stam kost 5, niet weer 3");
  state = koopIndringersAfMetWampum(state);
  assert.equal(state.wampum, 5);
  assert.equal(state.wampumAfkoopPerStam["de Shawnee"].aantalAfgekocht, 2);
});

test("onvoldoende wampum blokkeert de afkoop: de aanroep wordt genegeerd en niets verandert", () => {
  let state = metGepacificeerdeWampanoag();
  state = {
    ...state,
    wampum: 2,
    indringersEvent: {
      streekHoogte: 1,
      stamNaam: "de Shawnee",
      heeftWachttoren: false,
      tribuut: { resource: "hout", aantal: 5 },
      fase: "gemeld",
    },
  };

  const naPoging = koopIndringersAfMetWampum(state);
  assert.equal(naPoging, state, "met 2 wampum tegen een kost van 3 verandert er niets");
  assert.equal(naPoging.indringersEvent?.fase, "gemeld", "het incident blijft openstaan");
});

test("afkopen bij de ene stam beïnvloedt de kosten/rust van een andere stam niet (apart bijgehouden per stam)", () => {
  let state = metGepacificeerdeWampanoag();
  state = {
    ...state,
    beurt: 1,
    indringersEvent: {
      streekHoogte: 1,
      stamNaam: "de Wampanoag",
      heeftWachttoren: false,
      tribuut: { resource: "hout", aantal: 5 },
      fase: "gemeld",
    },
  };
  state = koopIndringersAfMetWampum(state);
  assert.equal(state.wampumAfkoopPerStam["de Wampanoag"].aantalAfgekocht, 1);
  assert.equal(state.wampumAfkoopPerStam["de Shawnee"], undefined, "de Shawnee is nog nooit afgekocht");
  assert.equal(
    wampumAfkoopKosten(state.wampumAfkoopPerStam["de Shawnee"]?.aantalAfgekocht ?? 0),
    3,
    "de Shawnee-teller blijft op 0, dus de kosten blijven de basisprijs"
  );
});

// Integratietest met de volledige `verwerkIndringers`-trekking (economie.ts):
// een stam met actieve rust doet niet meer mee in de stam-namenpool, dus een
// nieuw incident kan die stam niet meer treffen zolang de rust loopt. Los van
// het Wampanoag-verbond getest (dat bepaalt alleen of de speler de afkoop-
// keuze mag máken, niet of het rust-filter hieronder werkt) — met een kale
// wachttoren-streek 3 (zelfde truc als indringersEnDieren.test.ts) om de
// `INDRINGERS_MIN_STREEK`-drempel te halen zonder een tweede kandidaat aan de
// streek-trekking toe te voegen, blijft streek 1 de enige kandidaat en de
// Wampanoag-pool (`indringersStamNamen`) de enige stam-namenpool.
test("een stam met actieve wampum-afkoop-rust veroorzaakt geen nieuw indringers-incident, zelfs niet bij een gunstige trekking", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = {
    ...state,
    beurt: 1,
    streken: state.streken.map((streek) =>
      streek.hoogte === 3
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 4 ? { ...tile, improvement: WACHTTOREN } : tile)),
          }
        : streek
    ),
    wampumAfkoopPerStam: { "de Wampanoag": { aantalAfgekocht: 1, rustTotBeurt: 100 } },
  };

  // kans-check (0) → incident; streek-trekking (0) → streek 1 (enige
  // kandidaat, streek 3 bevat alleen een kale wachttoren en doet niet mee);
  // stamnaam-trekking (0) zou zonder het rust-filter op "de Wampanoag"
  // (eerste in de pool) uitkomen — met het filter blijft alleen
  // "het Wampanoag-volk" over.
  state = metRandomReeks([0, 0, 0], () => volgendeBeurt(state));

  assert.equal(state.indringersEvent?.streekHoogte, 1);
  assert.equal(
    state.indringersEvent?.stamNaam,
    "het Wampanoag-volk",
    "alleen de niet-rustende naam uit de pool kan nog getroffen worden"
  );
});
