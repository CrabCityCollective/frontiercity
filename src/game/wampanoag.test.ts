import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { BEVERJACHTHUT, isBebouwbaarLeeg, MAISBOERDERIJ, OPPERHOOFDTENT, VERKENNER } from "./improvements";
import { sluitWampanoagLaagOntdektMelding, VERKENNING_KOSTEN_WETENSCHAP } from "./streekOntgrendeling";
import {
  heeftWampanoagHandelsdrempelGehaald,
  kanStuurVerkennerWampanoag,
  sluitWampanoagRelatieGelegdMelding,
  stelWampanoagHandelIn,
  stuurVerkennerWampanoag,
  verhuldeWampanoagPosities,
  verwerkWampanoagFaseAfsluiting,
  verwerkWampanoagHandel,
  verwerkWampanoagVerkenningInGang,
  wampanoagHandelOpties,
} from "./wampanoag";
import { cultuurKostenVoorStreek, wetenschapKostenVoorStreekOntgrendeling } from "./world";
import { WAMPANOAG_STREEK_HOOGTE } from "./worldGoingWest";
import {
  metWampanoagLaagEnVoorraadVoorVerkenning,
  metWampanoagLaagInBeeld,
  metWampanoagLaagOnthuld,
} from "./testHelpers";

// M21e (opdracht-wampanoag-opening.md §5): streek 4 ontgrendelt normaal
// (geen Bezette-Streek-achtige bevriezing) zodra de wetenschapsdrempel
// gehaald wordt, en krijgt daarbovenop drie individueel verhulde
// Wampanoag-vakjes — terrein bepaalt welk gebouw waar komt te liggen.
test('streek 4 ontgrendelt normaal en krijgt drie verhulde Wampanoag-vakjes zodra de wetenschapsdrempel gehaald wordt (Going West)', () => {
  const state = metWampanoagLaagInBeeld();
  const streek4 = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  assert.equal(streek4.ontgrendeld, true, "streek 4 wordt gewoon normaal ontgrendeld, geen bevriezing");
  assert.equal(streek4.bezet, undefined, "geen Bezette-Streek-achtige vlag — parallelle, niet-blokkerende laag");
  assert.equal(state.wampanoagLaagOntdektEvent, true);

  // Terrein-afgeleide toewijzing (worldGoingWest.ts: WAMPANOAG_STREEK_INHOUD).
  assert.equal(streek4.tiles[0].wampanoagVerhuld, true);
  assert.equal(streek4.tiles[0].wampanoagInhoud, "maisboerderij");
  assert.equal(streek4.tiles[0].terrein, "vlak", "Maïsboerderij staat op een vlak vakje");

  assert.equal(streek4.tiles[1].wampanoagVerhuld, true);
  assert.equal(streek4.tiles[1].wampanoagInhoud, "beverjachthut");
  assert.equal(streek4.tiles[1].versWater, true, "Beverjachthut staat op het enige vers-water-vakje van streek 4");

  assert.equal(streek4.tiles[2].wampanoagVerhuld, true);
  assert.equal(streek4.tiles[2].wampanoagInhoud, "opperhoofdtent");

  // Positie 4 blijft neutraal, zelfde conventie als TUTORIAL_BEZETTE_STREEK_INHOUD.
  assert.equal(streek4.tiles[4].wampanoagVerhuld, undefined);
  assert.equal(streek4.tiles[4].wampanoagInhoud, undefined);

  assert.deepEqual(
    verhuldeWampanoagPosities(state).map((p) => p.positieInStreek).sort(),
    [0, 1, 2]
  );

  const gesloten = sluitWampanoagLaagOntdektMelding(state);
  assert.equal(gesloten.wampanoagLaagOntdektEvent, undefined);
});

// Regressietest: de tutorial heeft toevallig ook een streek 4 — die mag door
// deze Going-West-specifieke laag niet geraakt worden, ook al ontgrendelt hij
// (via de normale cultuurdrempel) net zo goed.
test("tutorial: streek 4 krijgt geen Wampanoag-vakjes, ongeacht cultuur-gedreven ontgrendeling", () => {
  let state = maakInitieleSpelStatus();
  assert.equal(state.campagneId, undefined);

  state = { ...state, cultuur: cultuurKostenVoorStreek(4), voedsel: 10_000 };
  state = volgendeBeurt(state);

  const streek4 = state.streken.find((l) => l.hoogte === 4)!;
  assert.equal(streek4.ontgrendeld, true, "streek 4 ontgrendelt gewoon, zoals altijd in de tutorial");
  assert.equal(state.wampanoagLaagOntdektEvent, undefined, "geen Wampanoag-event in de tutorial");
  assert.equal(
    streek4.tiles.every((t) => t.wampanoagVerhuld === undefined && t.wampanoagInhoud === undefined),
    true,
    "geen enkel tutorial-tile-4-vakje krijgt Wampanoag-velden"
  );
});

test("kanStuurVerkennerWampanoag vereist een verhuld vakje zonder lopende verkenning, genoeg grondstoffen/wetenschap en de 1x-per-beurt-limiet", () => {
  const zonderVoorraad = metWampanoagLaagInBeeld();
  assert.equal(
    kanStuurVerkennerWampanoag(zonderVoorraad, 0),
    false,
    "de Going West-startvoorraad heeft nog geen erts (VERKENNER.kosten.erts)"
  );

  const state = metWampanoagLaagEnVoorraadVoorVerkenning();
  assert.equal(kanStuurVerkennerWampanoag(state, 0), true);
  assert.equal(kanStuurVerkennerWampanoag({ ...state, wetenschap: 0 }, 0), false);
  assert.equal(kanStuurVerkennerWampanoag({ ...state, verkenningGedaanDitBeurt: true }, 0), false);
  assert.equal(
    kanStuurVerkennerWampanoag({ ...state, voorraad: { ...state.voorraad, hout: 0 } }, 0),
    false,
    "grondstoffen van VERKENNER.kosten moeten betaalbaar zijn"
  );
  assert.equal(kanStuurVerkennerWampanoag(state, 4), false, "positie 4 draagt geen Wampanoag-inhoud");
});

test("stuurVerkennerWampanoag betaalt grondstoffen + wetenschap, zet een aftellend tellertje i.p.v. direct te onthullen, en mag maar 1x per beurt (gedeelde limiet met de Bezette-Streek-Verkenning)", () => {
  let state = metWampanoagLaagEnVoorraadVoorVerkenning();
  const wetenschapVoor = state.wetenschap;
  const houtVoor = state.voorraad.hout;
  const streek4 = () => state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  state = stuurVerkennerWampanoag(state, 0);
  assert.equal(streek4().tiles[0].wampanoagVerhuld, true, "nog niet meteen onthuld — de verkenner is onderweg");
  assert.deepEqual(streek4().tiles[0].wampanoagVerkenningInGang, { beurtenResterend: VERKENNER.bouwtijdBeurten });
  assert.equal(state.wetenschap, wetenschapVoor - VERKENNING_KOSTEN_WETENSCHAP);
  assert.equal(state.voorraad.hout, houtVoor - (VERKENNER.kosten.hout ?? 0));
  assert.equal(state.verkenningGedaanDitBeurt, true);

  const naTweedeVerkenner = stuurVerkennerWampanoag(state, 1);
  assert.equal(naTweedeVerkenner, state, "een tweede verkenner dezelfde beurt heeft geen effect");

  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) {
    assert.equal(streek4().tiles[0].improvement, undefined, "nog niet onthuld tot het tellertje op 0 staat");
    state = volgendeBeurt(state);
  }

  assert.equal(streek4().tiles[0].wampanoagVerhuld, false);
  assert.equal(streek4().tiles[0].improvement?.id, "maisboerderij");
  assert.equal(streek4().tiles[0].status, "actief");
  assert.equal(streek4().tiles[0].wampanoagVerkenningInGang, undefined);
  assert.equal(state.verkenningGedaanDitBeurt, false, "de 1x-per-beurt-limiet is intussen weer teruggezet");
});

test("verwerkWampanoagVerkenningInGang onthult het juiste, terrein-afgeleide gebouw per positie", () => {
  let state = metWampanoagLaagEnVoorraadVoorVerkenning();
  state = stuurVerkennerWampanoag(state, 1); // beverjachthut (vers water)
  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) state = verwerkWampanoagVerkenningInGang(state);

  let streek4 = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;
  assert.equal(streek4.tiles[1].improvement?.id, BEVERJACHTHUT.id);
  assert.equal(streek4.tiles[1].status, "actief");

  // Nog geen effect op de andere twee vakjes.
  assert.equal(streek4.tiles[0].improvement, undefined);
  assert.equal(streek4.tiles[2].improvement, undefined);

  state = { ...state, verkenningGedaanDitBeurt: false };
  state = stuurVerkennerWampanoag(state, 0); // maisboerderij (vlak)
  state = { ...state, verkenningGedaanDitBeurt: false };
  state = stuurVerkennerWampanoag(state, 2); // opperhoofdtent (geen terrein-eis)
  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) state = verwerkWampanoagVerkenningInGang(state);

  streek4 = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;
  assert.equal(streek4.tiles[0].improvement?.id, MAISBOERDERIJ.id);
  assert.equal(streek4.tiles[2].improvement?.id, OPPERHOOFDTENT.id);
  assert.equal(
    verhuldeWampanoagPosities(state).length,
    0,
    "alle drie de Wampanoag-vakjes zijn nu onthuld"
  );
});

test("isBebouwbaarLeeg sluit een nog verhuld Wampanoag-vakje uit, ondanks status 'leeg'", () => {
  const state = metWampanoagLaagInBeeld();
  const streek4 = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  assert.equal(streek4.tiles[0].status, "leeg");
  assert.equal(streek4.tiles[0].wampanoagVerhuld, true);
  assert.equal(isBebouwbaarLeeg(streek4.tiles[0]), false, "een verhuld Wampanoag-vakje is geen geldig bouwdoel");

  // Een normaal leeg vakje op dezelfde streek (positie 3, geen Wampanoag-inhoud)
  // blijft gewoon bebouwbaar.
  assert.equal(streek4.tiles[3].wampanoagVerhuld, undefined);
  assert.equal(isBebouwbaarLeeg(streek4.tiles[3]), true);
});

test("wetenschapKostenVoorStreekOntgrendeling(WAMPANOAG_STREEK_HOOGTE) is de opdracht-drempel van 35", () => {
  assert.equal(wetenschapKostenVoorStreekOntgrendeling(WAMPANOAG_STREEK_HOOGTE), 35);
});

// M21f (opdracht-wampanoag-opening.md §6): "geen aparte Handelaar-unit" —
// wampanoagHandelOpties bepaalt puur welke knoppen de tile-info-pop-up toont.
test("wampanoagHandelOpties: Maïsboerderij/Beverjachthut bieden erts of gereedschap, Opperhoofdtent alleen goud", () => {
  assert.deepEqual(wampanoagHandelOpties("maisboerderij"), ["erts", "gereedschap"]);
  assert.deepEqual(wampanoagHandelOpties("beverjachthut"), ["erts", "gereedschap"]);
  assert.deepEqual(wampanoagHandelOpties("opperhoofdtent"), ["goud"]);
});

test("stelWampanoagHandelIn zet/wijzigt/pauzeert de keuze, alleen op een onthuld vakje met een geldige optie", () => {
  let state = metWampanoagLaagOnthuld();
  const streek4 = () => state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  // Nog verhuld (positie 3 heeft geen Wampanoag-inhoud) of een ongeldige
  // keuze voor dit vakje — genegeerd, geen effect.
  const zonderInhoud = stelWampanoagHandelIn(state, 3, "erts");
  assert.equal(zonderInhoud, state, "positie zonder wampanoagInhoud heeft geen effect");
  const ongeldigeKeuze = stelWampanoagHandelIn(state, 2, "erts"); // opperhoofdtent, alleen goud
  assert.equal(ongeldigeKeuze, state, "erts is geen geldige keuze voor de Opperhoofdtent");

  state = stelWampanoagHandelIn(state, 0, "erts"); // maisboerderij
  assert.equal(streek4().tiles[0].wampanoagHandelKeuze, "erts");

  // Omkeerbaar: wijzigen naar een andere geldige optie.
  state = stelWampanoagHandelIn(state, 0, "gereedschap");
  assert.equal(streek4().tiles[0].wampanoagHandelKeuze, "gereedschap");

  // Pauzeren met `undefined`.
  state = stelWampanoagHandelIn(state, 0, undefined);
  assert.equal(streek4().tiles[0].wampanoagHandelKeuze, undefined);
});

test("verwerkWampanoagHandel ruilt elke beurt 1:1 per vakje, naar het juiste handelswaar, zonder kosten voor niet-gekozen vakjes", () => {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, bevervellen: 0, mais: 0, wampum: 0, gereedschap: 5 };
  state = stelWampanoagHandelIn(state, 0, "erts"); // maisboerderij -> mais
  state = stelWampanoagHandelIn(state, 1, "gereedschap"); // beverjachthut -> bevervellen
  // Positie 2 (opperhoofdtent) blijft gepauzeerd.

  const ertsVoor = state.voorraad.erts;
  const gereedschapVoor = state.gereedschap;

  state = verwerkWampanoagHandel(state);

  assert.equal(state.voorraad.erts, ertsVoor - 1);
  assert.equal(state.mais, 1);
  assert.equal(state.gereedschap, gereedschapVoor - 1);
  assert.equal(state.bevervellen, 1);
  assert.equal(state.wampum, 0, "opperhoofdtent handelt niet mee, staat gepauzeerd");
});

test("verwerkWampanoagHandel slaat een beurt over bij onvoldoende voorraad, zonder negatief te worden of de andere vakjes te blokkeren", () => {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, gereedschap: 0, bevervellen: 0, mais: 0, wampum: 0 };
  state = stelWampanoagHandelIn(state, 0, "erts"); // maisboerderij, wél genoeg erts
  state = stelWampanoagHandelIn(state, 1, "gereedschap"); // beverjachthut, geen gereedschap

  const ertsVoor = state.voorraad.erts;
  state = verwerkWampanoagHandel(state);

  assert.equal(state.voorraad.erts, ertsVoor - 1, "maisboerderij handelt gewoon door");
  assert.equal(state.mais, 1);
  assert.equal(state.gereedschap, 0, "kan niet negatief worden");
  assert.equal(state.bevervellen, 0, "geen conversie deze beurt zonder gereedschap-voorraad");
});

// Integratietest: `volgendeBeurt` roept `verwerkWampanoagHandel` daadwerkelijk
// aan, zodat een gekozen handel ook zonder losse test-aanroep doorloopt.
test("volgendeBeurt verwerkt de lopende Wampanoag-handel mee", () => {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, mais: 0, voedsel: 10_000 };
  state = stelWampanoagHandelIn(state, 0, "erts");

  const ertsVoor = state.voorraad.erts;
  state = volgendeBeurt(state);

  assert.equal(state.mais, 1);
  assert.equal(state.voorraad.erts, ertsVoor - 1);
});

// M21g (opdracht-wampanoag-opening.md §7): "3-3-3-drempel is hard en per
// type apart gecontroleerd" — geen cumulatieve som.
test("heeftWampanoagHandelsdrempelGehaald vereist alle drie handelswaren apart op minstens de drempel", () => {
  const state = metWampanoagLaagOnthuld();
  assert.equal(heeftWampanoagHandelsdrempelGehaald({ ...state, bevervellen: 0, mais: 0, wampum: 0 }), false);
  assert.equal(
    heeftWampanoagHandelsdrempelGehaald({ ...state, bevervellen: 9, mais: 0, wampum: 0 }),
    false,
    "geen cumulatieve som — 9 bevervellen compenseert niet voor 0 mais/wampum"
  );
  assert.equal(heeftWampanoagHandelsdrempelGehaald({ ...state, bevervellen: 2, mais: 3, wampum: 3 }), false);
  assert.equal(heeftWampanoagHandelsdrempelGehaald({ ...state, bevervellen: 3, mais: 3, wampum: 3 }), true);
});

test("verwerkWampanoagFaseAfsluiting zet cultureelOntgrendeld/ontgrendelResource om en zet het narratieve event zodra de 3-3-3-drempel gehaald is", () => {
  let state = metWampanoagLaagOnthuld();
  assert.equal(state.cultureelOntgrendeld, false, "Going West start in de openingsfase");
  assert.equal(state.ontgrendelResource, "wetenschap");

  const nogNiet = verwerkWampanoagFaseAfsluiting({ ...state, bevervellen: 2, mais: 3, wampum: 3 });
  assert.equal(nogNiet.cultureelOntgrendeld, false, "nog geen omslag zolang niet alle drie op de drempel staan");
  assert.equal(nogNiet.wampanoagRelatieGelegdEvent, undefined);

  state = { ...state, bevervellen: 3, mais: 3, wampum: 3 };
  state = verwerkWampanoagFaseAfsluiting(state);
  assert.equal(state.cultureelOntgrendeld, true);
  assert.equal(state.ontgrendelResource, "cultuur");
  assert.equal(state.wampanoagRelatieGelegdEvent, true);

  const gesloten = sluitWampanoagRelatieGelegdMelding(state);
  assert.equal(gesloten.wampanoagRelatieGelegdEvent, undefined);
  assert.equal(gesloten.cultureelOntgrendeld, true, "sluiten van de melding raakt de omslag zelf niet aan");

  // Eenmalig/onomkeerbaar: een latere aanroep met een voorraad weer onder de
  // drempel valt niet terug naar `cultureelOntgrendeld: false` — de guard is
  // puur op `cultureelOntgrendeld`, dus deze aanroep is een no-op (zelfde
  // object terug) ongeacht de voorraad.
  const onderDrempelStaat = { ...state, bevervellen: 0, mais: 0, wampum: 0 };
  const onderDrempelDaarna = verwerkWampanoagFaseAfsluiting(onderDrempelStaat);
  assert.equal(onderDrempelDaarna, onderDrempelStaat, "no-op zodra cultureelOntgrendeld al true is");
});

// Regressietest: de tutorial begint al op `cultureelOntgrendeld: true`, dus
// deze functie moet daar altijd een no-op zijn, ongeacht wat er verder in de
// (voor de tutorial betekenisloze) bevervellen/mais/wampum-velden staat.
test("verwerkWampanoagFaseAfsluiting is een no-op in de tutorial (cultureelOntgrendeld staat al op true)", () => {
  const state = maakInitieleSpelStatus();
  assert.equal(state.cultureelOntgrendeld, true);

  const tutorialMetVolleVoorraad = { ...state, bevervellen: 3, mais: 3, wampum: 3 };
  const resultaat = verwerkWampanoagFaseAfsluiting(tutorialMetVolleVoorraad);
  assert.equal(resultaat, tutorialMetVolleVoorraad, "no-op — zelfde object terug, geen omslag/event");
  assert.equal(resultaat.wampanoagRelatieGelegdEvent, undefined);
  assert.equal(resultaat.ontgrendelResource, "cultuur");
});

// Integratietest: `volgendeBeurt` roept `verwerkWampanoagFaseAfsluiting` aan
// direct nadat diezelfde beurt de handel (`verwerkWampanoagHandel`) de
// voorraad over de drempel heeft geduwd — geen extra beurt vertraging nodig.
test("volgendeBeurt sluit de Wampanoag-fase af zodra de handel deze beurt de 3-3-3-drempel bereikt", () => {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, bevervellen: 3, mais: 3, wampum: 2, voedsel: 10_000 };
  state = stelWampanoagHandelIn(state, 2, "goud"); // opperhoofdtent -> wampum, de laatste stap naar 3

  state = volgendeBeurt(state);

  assert.equal(state.wampum, 3);
  assert.equal(state.cultureelOntgrendeld, true);
  assert.equal(state.ontgrendelResource, "cultuur");
  assert.equal(state.wampanoagRelatieGelegdEvent, true);
});
