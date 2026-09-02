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
import { cultuurKostenVoorStreek, hoogsteOntgrendeldeStreek } from "./world";
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
test("de Wampanoag-streek komt 'in beeld' als blokkerende streek met negen verhulde vakjes zodra de cultuurdrempel gehaald wordt (Going West)", () => {
  const state = metWampanoagLaagInBeeld();
  const streek = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  assert.equal(streek.ontgrendeld, false, "de streek blijft vergrendeld — de frontier blijft op de streek eronder staan");
  assert.equal(streek.wampanoagBezet, true);
  assert.equal(streek.bezet, undefined, "geen Bezette-Streek-vlag — eigen, aparte resolutielogica");
  assert.equal(state.wampanoagLaagOntdektEvent, true);
  assert.equal(streek.tiles.every((t) => t.wampanoagVerhuld), true, "alle negen vakjes zijn individueel verhuld");

  // Terrein-afgeleide toewijzing (worldGoingWest.ts: WAMPANOAG_STREEK_INHOUD)
  // — altijd op de vijf middelste vakjes van de band (positie 2 t/m 6, issue
  // "Wampanoag kamp uitbreiding"), van links naar rechts: Maïsboerderij,
  // tentje, Opperhoofdtent, tentje, Beverjachthut.
  assert.equal(streek.tiles[2].wampanoagInhoud, "maisboerderij");
  assert.equal(streek.tiles[2].terrein, "vlak", "Maïsboerderij staat op een vlak vakje");

  assert.equal(streek.tiles[3].wampanoagInhoud, "tentje");
  assert.equal(streek.tiles[4].wampanoagInhoud, "opperhoofdtent");
  assert.equal(streek.tiles[5].wampanoagInhoud, "tentje");

  assert.equal(streek.tiles[6].wampanoagInhoud, "beverjachthut");
  assert.equal(streek.tiles[6].versWater, true, "Beverjachthut staat op een vers-water-vakje van de Wampanoag-streek");

  // De overige vier vakjes dragen geen bijzondere inhoud, zelfde conventie als
  // TUTORIAL_BEZETTE_STREEK_INHOUD, maar zijn wél mee verhuld.
  const inhoudTypes = streek.tiles.map((t) => t.wampanoagInhoud).filter(Boolean);
  assert.equal(inhoudTypes.length, 5, "vijf van de negen vakjes dragen vaste Wampanoag-inhoud (drie gebouwen + twee tentjes)");

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

// Issue "Wampanoag streek pas helemaal onthuld na handel": alleen de vijf
// vaste vakjes zelf ontdekken (de drie handelsvakjes + de twee decoratieve
// tentjes) is niet meer genoeg om de streek te ontgrendelen — dat vereist
// sindsdien de volledige 3-3-3-handelsdrempel, zie `verwerkWampanoagFaseAfsluiting`
// en de tests daarvoor hieronder.
test("het ontdekken van alle vijf vaste vakjes ontgrendelt de streek zelf nog niet — de vier neutrale vakjes blijven verhuld tot de 3-3-3-drempel gehaald is", () => {
  const state = metWampanoagLaagOnthuld();
  const streek = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  assert.equal(streek.ontgrendeld, false, "nog steeds vergrendeld — de handelsdrempel is nog niet gehaald");
  assert.equal(streek.wampanoagBezet, true);
  assert.equal(
    streek.tiles.filter((t) => t.wampanoagInhoud).every((t) => t.wampanoagVerhuld === false),
    true,
    "de vijf vaste vakjes zelf zijn wel onthuld — dat maakt de drie handelsvakjes handelbaar"
  );
  assert.equal(
    streek.tiles.filter((t) => !t.wampanoagInhoud).every((t) => t.wampanoagVerhuld === true),
    true,
    "de vier neutrale vakjes blijven verhuld tot de handelsdrempel gehaald is"
  );
  assert.equal(hoogsteOntgrendeldeStreek(state.streken), WAMPANOAG_STREEK_HOOGTE - 1, "de frontier staat nog steeds stil");
  assert.equal(
    magSettlerNaar(state.streken, { hoogte: WAMPANOAG_STREEK_HOOGTE, positieInStreek: 4 }),
    false,
    "de settler kan er nog niet doorheen lopen"
  );
});

test("kanStuurVerkennerWampanoag vereist een verhuld vakje zonder lopende verkenning, genoeg grondstoffen/wetenschap en de 1x-per-beurt-limiet", () => {
  const zonderVoorraad = metWampanoagLaagInBeeld();
  assert.equal(
    kanStuurVerkennerWampanoag(zonderVoorraad, 3),
    false,
    "de Going West-startvoorraad heeft nog geen erts (VERKENNER.kosten.erts)"
  );

  const state = metWampanoagLaagEnVoorraadVoorVerkenning();
  assert.equal(kanStuurVerkennerWampanoag(state, 3), true);
  assert.equal(kanStuurVerkennerWampanoag({ ...state, wetenschap: 0 }, 3), false);
  assert.equal(kanStuurVerkennerWampanoag({ ...state, verkenningGedaanDitBeurt: true }, 3), false);
  assert.equal(
    kanStuurVerkennerWampanoag({ ...state, voorraad: { ...state.voorraad, hout: 0 } }, 3),
    false,
    "grondstoffen van VERKENNER.kosten moeten betaalbaar zijn"
  );
  // Positie 0 draagt geen Wampanoag-inhoud, maar is (issue: "Wampanoag streek
  // blokkerend") toch verhuld en dus net zo goed verkenbaar — net als een
  // neutraal vakje bij de Bezette Streek.
  assert.equal(kanStuurVerkennerWampanoag(state, 0), true, "een neutraal vakje is ook verkenbaar");
});

test("stuurVerkennerWampanoag betaalt grondstoffen + wetenschap, zet een aftellend tellertje i.p.v. direct te onthullen, en mag maar 1x per beurt (gedeelde limiet met de Bezette-Streek-Verkenning)", () => {
  let state = metWampanoagLaagEnVoorraadVoorVerkenning();
  const wetenschapVoor = state.wetenschap;
  const houtVoor = state.voorraad.hout;
  const streek4 = () => state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  state = stuurVerkennerWampanoag(state, 6);
  assert.equal(streek4().tiles[6].wampanoagVerhuld, true, "nog niet meteen onthuld — de verkenner is onderweg");
  assert.deepEqual(streek4().tiles[6].wampanoagVerkenningInGang, { beurtenResterend: VERKENNER.bouwtijdBeurten });
  assert.equal(state.wetenschap, wetenschapVoor - VERKENNING_KOSTEN_WETENSCHAP);
  assert.equal(state.voorraad.hout, houtVoor - (VERKENNER.kosten.hout ?? 0));
  assert.equal(state.verkenningGedaanDitBeurt, true);

  const naTweedeVerkenner = stuurVerkennerWampanoag(state, 4);
  assert.equal(naTweedeVerkenner, state, "een tweede verkenner dezelfde beurt heeft geen effect");

  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) {
    assert.equal(streek4().tiles[6].improvement, undefined, "nog niet onthuld tot het tellertje op 0 staat");
    state = volgendeBeurt(state);
  }

  assert.equal(streek4().tiles[6].wampanoagVerhuld, false);
  assert.equal(streek4().tiles[6].improvement?.id, "beverjachthut");
  assert.equal(streek4().tiles[6].status, "actief");
  assert.equal(streek4().tiles[6].wampanoagVerkenningInGang, undefined);
  assert.equal(state.verkenningGedaanDitBeurt, false, "de 1x-per-beurt-limiet is intussen weer teruggezet");
});

test("verwerkWampanoagVerkenningInGang onthult het juiste, terrein-afgeleide gebouw per positie", () => {
  let state = metWampanoagLaagEnVoorraadVoorVerkenning();
  state = stuurVerkennerWampanoag(state, 6); // beverjachthut (vers water)
  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) state = verwerkWampanoagVerkenningInGang(state);

  let streek4 = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;
  assert.equal(streek4.tiles[6].improvement?.id, BEVERJACHTHUT.id);
  assert.equal(streek4.tiles[6].status, "actief");

  // Nog geen effect op de andere vier vakjes.
  assert.equal(streek4.tiles[2].improvement, undefined);
  assert.equal(streek4.tiles[3].improvement, undefined);
  assert.equal(streek4.tiles[4].improvement, undefined);
  assert.equal(streek4.tiles[5].improvement, undefined);

  state = { ...state, verkenningGedaanDitBeurt: false };
  state = stuurVerkennerWampanoag(state, 2); // maisboerderij (vlak)
  state = { ...state, verkenningGedaanDitBeurt: false };
  state = stuurVerkennerWampanoag(state, 4); // opperhoofdtent (geen terrein-eis)
  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) state = verwerkWampanoagVerkenningInGang(state);

  streek4 = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;
  assert.equal(streek4.tiles[2].improvement?.id, MAISBOERDERIJ.id);
  assert.equal(streek4.tiles[4].improvement?.id, OPPERHOOFDTENT.id);
  // Nog niet gestuurd — de twee decoratieve tentjes (positie 3/5) blijven
  // verhuld tot ze zelf verkend worden, net als elk ander vakje.
  assert.equal(streek4.tiles[3].improvement, undefined);
  assert.equal(streek4.tiles[5].improvement, undefined);
  // Issue "Wampanoag streek pas helemaal onthuld na handel": het ontdekken
  // van de drie handelsvakjes onthult alleen die drie zelf — de overige
  // vakjes (de twee tentjes en de vier neutrale) blijven verhuld tot de
  // 3-3-3-handelsdrempel gehaald is (verwerkWampanoagFaseAfsluiting), dus 6
  // posities blijven nog verkenbaar.
  assert.equal(
    verhuldeWampanoagPosities(state).length,
    6,
    "de drie handelsvakjes zijn onthuld, de twee tentjes en vier neutrale vakjes nog niet"
  );
});

test("isBebouwbaarLeeg sluit elk nog verhuld Wampanoag-vakje uit, ondanks status 'leeg' — ook de neutrale vakjes zonder inhoud", () => {
  const state = metWampanoagLaagInBeeld();
  const streek4 = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  assert.equal(streek4.tiles[3].status, "leeg");
  assert.equal(streek4.tiles[3].wampanoagVerhuld, true);
  assert.equal(isBebouwbaarLeeg(streek4.tiles[3]), false, "een verhuld Wampanoag-vakje is geen geldig bouwdoel");

  // Positie 0 draagt geen Wampanoag-inhoud, maar is (issue: "Wampanoag streek
  // blokkerend" — de hele streek is nu bezet, niet alleen de drie
  // handelsvakjes) toch mee verhuld, en dus ook geen geldig bouwdoel.
  assert.equal(streek4.tiles[0].wampanoagInhoud, undefined);
  assert.equal(streek4.tiles[0].wampanoagVerhuld, true);
  assert.equal(isBebouwbaarLeeg(streek4.tiles[0]), false);
});

// M21f (opdracht-wampanoag-opening.md §6): "geen aparte Handelaar-unit" —
// wampanoagHandelOpties bepaalt puur welke knoppen de tile-info-pop-up toont.
// Herzien door issue "Smederij inactief zetten": erts is geschrapt als
// Wampanoag-handelskeuze, zodat gereedschap de enige handelswaar is voor
// Maïsboerderij/Beverjachthut en de Smederij de enige erts-afzet blijft.
// Herzien door issue "Handel versimpelen": de Opperhoofdtent ruilde daarna
// nog goud, maar ruilt sindsdien ook gereedschap — er is nu nog maar één
// handelswaar-invoer over de hele linie.
test("wampanoagHandelOpties: alle drie handelsvakjes bieden alleen gereedschap, tentje handelt niet", () => {
  assert.deepEqual(wampanoagHandelOpties("maisboerderij"), ["gereedschap"]);
  assert.deepEqual(wampanoagHandelOpties("beverjachthut"), ["gereedschap"]);
  assert.deepEqual(wampanoagHandelOpties("opperhoofdtent"), ["gereedschap"]);
  assert.deepEqual(wampanoagHandelOpties("tentje"), [], "puur decoratief (issue 'Wampanoag kamp uitbreiding')");
});

test("stelWampanoagHandelIn zet/wijzigt/pauzeert de keuze, alleen op een onthuld vakje met een geldige optie", () => {
  let state = metWampanoagLaagOnthuld();
  const streek4 = () => state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;

  // Nog verhuld (positie 0 heeft geen Wampanoag-inhoud) — genegeerd, geen effect.
  const zonderInhoud = stelWampanoagHandelIn(state, 0, "gereedschap");
  assert.equal(zonderInhoud, state, "positie zonder wampanoagInhoud heeft geen effect");
  // Tentje (issue "Wampanoag kamp uitbreiding") heeft een lege optielijst —
  // ook al onthuld, geen enkele keuze is geldig.
  const tentjeKeuze = stelWampanoagHandelIn(state, 3, "gereedschap");
  assert.equal(tentjeKeuze, state, "een tentje handelt niet, geen enkele keuze is geldig");

  state = stelWampanoagHandelIn(state, 2, "gereedschap"); // maisboerderij
  assert.equal(streek4().tiles[2].wampanoagHandelKeuze, "gereedschap");

  // Issue "Handel versimpelen": de Opperhoofdtent accepteert sindsdien ook
  // gereedschap, waar dat voorheen alleen goud was.
  state = stelWampanoagHandelIn(state, 4, "gereedschap"); // opperhoofdtent
  assert.equal(streek4().tiles[4].wampanoagHandelKeuze, "gereedschap");

  // Omkeerbaar: pauzeren met `undefined`.
  state = stelWampanoagHandelIn(state, 2, undefined);
  assert.equal(streek4().tiles[2].wampanoagHandelKeuze, undefined);
});

test("verwerkWampanoagHandel ruilt elke beurt 1:1 per vakje, naar het juiste handelswaar, zonder kosten voor niet-gekozen vakjes", () => {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, bevervellen: 0, mais: 0, wampum: 0, gereedschap: 5 };
  state = stelWampanoagHandelIn(state, 2, "gereedschap"); // maisboerderij -> mais
  state = stelWampanoagHandelIn(state, 6, "gereedschap"); // beverjachthut -> bevervellen
  // Positie 4 (opperhoofdtent) blijft gepauzeerd.

  const gereedschapVoor = state.gereedschap;

  state = verwerkWampanoagHandel(state);

  assert.equal(state.mais, 1);
  assert.equal(state.gereedschap, gereedschapVoor - 2, "beide vakjes trekken elk 1 gereedschap uit dezelfde voorraad");
  assert.equal(state.bevervellen, 1);
  assert.equal(state.wampum, 0, "opperhoofdtent handelt niet mee, staat gepauzeerd");
});

test("verwerkWampanoagHandel slaat een beurt over bij onvoldoende voorraad, zonder negatief te worden of de andere vakjes te blokkeren", () => {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, gereedschap: 1, bevervellen: 0, mais: 0, wampum: 0 };
  state = stelWampanoagHandelIn(state, 2, "gereedschap"); // maisboerderij, verbruikt het laatste gereedschap (eerst aan de beurt, lagere positie)
  state = stelWampanoagHandelIn(state, 6, "gereedschap"); // beverjachthut, komt daarna aan de beurt zonder voorraad

  state = verwerkWampanoagHandel(state);

  assert.equal(state.mais, 1, "maisboerderij handelt gewoon door");
  assert.equal(state.gereedschap, 0, "kan niet negatief worden");
  assert.equal(state.bevervellen, 0, "geen conversie deze beurt zonder resterend gereedschap");
});

// Integratietest: `volgendeBeurt` roept `verwerkWampanoagHandel` daadwerkelijk
// aan, zodat een gekozen handel ook zonder losse test-aanroep doorloopt.
test("volgendeBeurt verwerkt de lopende Wampanoag-handel mee", () => {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, mais: 0, voedsel: 10_000, gereedschap: 5 };
  state = stelWampanoagHandelIn(state, 2, "gereedschap");

  const gereedschapVoor = state.gereedschap;
  state = volgendeBeurt(state);

  assert.equal(state.mais, 1);
  assert.equal(state.gereedschap, gereedschapVoor - 1);
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

// Herzien door issue "Wampanoag streek pas helemaal onthuld na handel": de
// 3-3-3-drempel ontgrendelt sindsdien de streek zelf (i.p.v. `cultureelOntgrendeld`
// — dat volgt nu de Smederij, zie groeiEnRekrutering.test.ts) en onthult de
// resterende neutrale vakjes.
test("verwerkWampanoagFaseAfsluiting ontgrendelt de streek en zet het narratieve event zodra de 3-3-3-drempel gehaald is", () => {
  let state = metWampanoagLaagOnthuld();
  const streek = () => state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;
  assert.equal(streek().wampanoagBezet, true, "Going West start in de openingsfase");

  const nogNiet = verwerkWampanoagFaseAfsluiting({ ...state, bevervellen: 2, mais: 3, wampum: 3 });
  assert.equal(
    nogNiet.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!.wampanoagBezet,
    true,
    "nog geen omslag zolang niet alle drie op de drempel staan"
  );
  assert.equal(nogNiet.wampanoagRelatieGelegdEvent, undefined);

  state = { ...state, bevervellen: 3, mais: 3, wampum: 3 };
  state = verwerkWampanoagFaseAfsluiting(state);
  assert.equal(streek().wampanoagBezet, false);
  assert.equal(streek().ontgrendeld, true);
  assert.equal(streek().tiles.every((t) => t.wampanoagVerhuld === false), true, "ook de vier neutrale vakjes zijn nu onthuld");
  assert.equal(state.wampanoagRelatieGelegdEvent, true);
  assert.equal(state.cultureelOntgrendeld, false, "raakt de Smederij-gedreven omslag niet aan");

  const gesloten = sluitWampanoagRelatieGelegdMelding(state);
  assert.equal(gesloten.wampanoagRelatieGelegdEvent, undefined);
  assert.equal(
    gesloten.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!.ontgrendeld,
    true,
    "sluiten van de melding raakt de omslag zelf niet aan"
  );

  // Eenmalig/onomkeerbaar: een latere aanroep met een voorraad weer onder de
  // drempel valt niet terug naar een vergrendelde streek — de guard is puur
  // op `streek.wampanoagBezet`, dus deze aanroep is een no-op (zelfde object
  // terug) ongeacht de voorraad.
  const onderDrempelStaat = { ...state, bevervellen: 0, mais: 0, wampum: 0 };
  const onderDrempelDaarna = verwerkWampanoagFaseAfsluiting(onderDrempelStaat);
  assert.equal(onderDrempelDaarna, onderDrempelStaat, "no-op zodra de streek al ontgrendeld is");
});

// Regressietest: bestaat de Wampanoag-streek niet (tutorial), dan moet deze
// functie altijd een no-op zijn.
test("verwerkWampanoagFaseAfsluiting is een no-op in de tutorial (geen Wampanoag-streek)", () => {
  const state = maakInitieleSpelStatus();

  const tutorialMetVolleVoorraad = { ...state, bevervellen: 3, mais: 3, wampum: 3 };
  const resultaat = verwerkWampanoagFaseAfsluiting(tutorialMetVolleVoorraad);
  assert.equal(resultaat, tutorialMetVolleVoorraad, "no-op — zelfde object terug, geen omslag/event");
  assert.equal(resultaat.wampanoagRelatieGelegdEvent, undefined);
});

// Integratietest: `volgendeBeurt` roept `verwerkWampanoagFaseAfsluiting` aan
// direct nadat diezelfde beurt de handel (`verwerkWampanoagHandel`) de
// voorraad over de drempel heeft geduwd — geen extra beurt vertraging nodig.
test("volgendeBeurt ontgrendelt de Wampanoag-streek zodra de handel deze beurt de 3-3-3-drempel bereikt", () => {
  let state = metWampanoagLaagOnthuld();
  state = { ...state, bevervellen: 3, mais: 3, wampum: 2, voedsel: 10_000 };
  state = stelWampanoagHandelIn(state, 4, "gereedschap"); // opperhoofdtent -> wampum, de laatste stap naar 3

  state = volgendeBeurt(state);

  assert.equal(state.wampum, 3);
  const streek = state.streken.find((l) => l.hoogte === WAMPANOAG_STREEK_HOOGTE)!;
  assert.equal(streek.ontgrendeld, true);
  assert.equal(streek.wampanoagBezet, false);
  assert.equal(state.wampanoagRelatieGelegdEvent, true);
});
