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
import { cultuurKostenVoorStreek, hoogsteOntgrendeldeStreek, wetenschapKostenVoorStreekOntgrendeling } from "./world";
import { WAMPANOAG_STREEK_HOOGTE } from "./worldGoingWest";
import { magSettlerNaar } from "./wegen";
import {
  metWampanoagLaagEnVoorraadVoorVerkenning,
  metWampanoagLaagInBeeld,
  metWampanoagLaagOnthuld,
} from "./testHelpers";

// Issue "Wampanoag streek blokkerend": de Wampanoag-streek komt "in beeld"
// als een blokkerende streek — zelfde soort bevriezing als de Bezette Streek
// (streekOntgrendeling.ts) — met alle negen vakjes verhuld i.p.v. alleen de
// drie handelsvakjes; terrein bepaalt welk gebouw op welk vakje komt te
// liggen.
test("de Wampanoag-streek komt 'in beeld' als blokkerende streek met negen verhulde vakjes zodra de wetenschapsdrempel gehaald wordt (Going West)", () => {
  const state = metWampanoagLaagInBeeld();
  const streek = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  assert.equal(streek.ontgrendeld, false, "de streek blijft vergrendeld — de frontier blijft op de streek eronder staan");
  assert.equal(streek.wampanoagBezet, true);
  assert.equal(streek.bezet, undefined, "geen Bezette-Streek-vlag — eigen, aparte resolutielogica");
  assert.equal(state.wampanoagLaagOntdektEvent, true);
  assert.equal(streek.tiles.every((t) => t.wampanoagVerhuld), true, "alle negen vakjes zijn individueel verhuld");

  // Terrein-afgeleide toewijzing (worldGoingWest.ts: WAMPANOAG_STREEK_INHOUD).
  assert.equal(streek.tiles[0].wampanoagInhoud, "maisboerderij");
  assert.equal(streek.tiles[0].terrein, "vlak", "Maïsboerderij staat op een vlak vakje");

  assert.equal(streek.tiles[1].wampanoagInhoud, "beverjachthut");
  assert.equal(streek.tiles[1].versWater, true, "Beverjachthut staat op een vers-water-vakje van de Wampanoag-streek");

  assert.equal(streek.tiles[2].wampanoagInhoud, "opperhoofdtent");

  // De overige zes vakjes dragen geen bijzondere inhoud, zelfde conventie als
  // TUTORIAL_BEZETTE_STREEK_INHOUD, maar zijn wél mee verhuld.
  const inhoudTypes = streek.tiles.map((t) => t.wampanoagInhoud).filter(Boolean);
  assert.equal(inhoudTypes.length, 3, "maar drie van de negen vakjes dragen vaste Wampanoag-inhoud");

  assert.deepEqual(
    verhuldeWampanoagPosities(state).map((p) => p.positieInStreek).sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
    "alle negen vakjes zijn nog individueel verkenbaar, niet alleen de drie handelsvakjes"
  );

  // De frontier stopt bij de streek eronder — de settler kan er niet doorheen
  // lopen (issue: "Wampanoag streek blokkerend").
  assert.equal(hoogsteOntgrendeldeStreek(state.streken), WAMPANOAG_STREEK_HOOGTE - 1);
  assert.equal(magSettlerNaar(state.streken, { hoogte: WAMPANOAG_STREEK_HOOGTE, positieInStreek: 4 }), false);

  const gesloten = sluitWampanoagLaagOntdektMelding(state);
  assert.equal(gesloten.wampanoagLaagOntdektEvent, undefined);
});

// Regressietest: de tutorial heeft toevallig ook een streek op dezelfde
// hoogte — die mag door deze Going-West-specifieke laag niet geraakt worden,
// ook al ontgrendelt hij (via de normale cultuurdrempel) net zo goed.
test("tutorial: de Wampanoag-streekhoogte krijgt geen Wampanoag-vakjes en blijft normaal ontgrendelen, ongeacht cultuur-gedreven ontgrendeling", () => {
  let state = maakInitieleSpelStatus();
  assert.equal(state.campagneId, undefined);

  state = { ...state, cultuur: cultuurKostenVoorStreek(WAMPANOAG_STREEK_HOOGTE), voedsel: 10_000 };
  state = volgendeBeurt(state);

  const streek = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;
  assert.equal(streek.ontgrendeld, true, "de streek ontgrendelt gewoon, zoals altijd in de tutorial — geen bevriezing");
  assert.equal(streek.wampanoagBezet, undefined);
  assert.equal(state.wampanoagLaagOntdektEvent, undefined, "geen Wampanoag-event in de tutorial");
  assert.equal(
    streek.tiles.every((t) => t.wampanoagVerhuld === undefined && t.wampanoagInhoud === undefined),
    true,
    "geen enkel tutorial-vakje krijgt Wampanoag-velden"
  );
});

// De streek lost pas op (net als de Bezette Streek) zodra alle drie de
// handelsvakjes onthuld zijn — de zes neutrale vakjes onthullen dan
// automatisch mee, en de frontier/settler kunnen weer verder.
test("de Wampanoag-streek ontgrendelt pas zodra alle drie de handelsvakjes onthuld zijn, en onthult de neutrale vakjes automatisch mee", () => {
  const state = metWampanoagLaagOnthuld();
  const streek = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  assert.equal(streek.ontgrendeld, true, "opgelost — de streek telt weer als normaal ontgrendeld");
  assert.equal(streek.wampanoagBezet, false);
  assert.equal(streek.tiles.every((t) => t.wampanoagVerhuld === false), true, "ook de zes neutrale vakjes zijn nu onthuld");
  assert.equal(hoogsteOntgrendeldeStreek(state.streken), WAMPANOAG_STREEK_HOOGTE, "de frontier mag weer verder");
  assert.equal(
    magSettlerNaar(state.streken, { hoogte: WAMPANOAG_STREEK_HOOGTE, positieInStreek: 4 }),
    true,
    "de settler kan er nu doorheen lopen"
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
  // Positie 4 draagt geen Wampanoag-inhoud, maar is (issue: "Wampanoag streek
  // blokkerend") toch verhuld en dus net zo goed verkenbaar — net als een
  // neutraal vakje bij de Bezette Streek.
  assert.equal(kanStuurVerkennerWampanoag(state, 4), true, "een neutraal vakje is ook verkenbaar");
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

test("isBebouwbaarLeeg sluit elk nog verhuld Wampanoag-vakje uit, ondanks status 'leeg' — ook de neutrale vakjes zonder inhoud", () => {
  const state = metWampanoagLaagInBeeld();
  const streek4 = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  assert.equal(streek4.tiles[0].status, "leeg");
  assert.equal(streek4.tiles[0].wampanoagVerhuld, true);
  assert.equal(isBebouwbaarLeeg(streek4.tiles[0]), false, "een verhuld Wampanoag-vakje is geen geldig bouwdoel");

  // Positie 3 draagt geen Wampanoag-inhoud, maar is (issue: "Wampanoag streek
  // blokkerend" — de hele streek is nu bezet, niet alleen de drie
  // handelsvakjes) toch mee verhuld, en dus ook geen geldig bouwdoel.
  assert.equal(streek4.tiles[3].wampanoagInhoud, undefined);
  assert.equal(streek4.tiles[3].wampanoagVerhuld, true);
  assert.equal(isBebouwbaarLeeg(streek4.tiles[3]), false);
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
