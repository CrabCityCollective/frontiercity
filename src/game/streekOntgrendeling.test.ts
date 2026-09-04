import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { startBouw } from "./infrastructuurEnBouw";
import {
  BELEGERINGSDREMPEL,
  beschikbareIngenieurs,
  beschikbareMissionarissen,
  bouwBrug,
  kanBrugBouwen,
  kanStuurMissionaris,
  kanStuurVerkenner,
  sluitGoudOntdektMelding,
  sluitRivierAangekondigdMelding,
  sluitStichtingskansOntdektMelding,
  sluitTweedeGoudOntdektMelding,
  stuurMissionaris,
  stuurVerkenner,
  VERKENNING_KOSTEN_WETENSCHAP,
  WOLOLO_INKOMEN_PER_MISSIONARIS,
} from "./streekOntgrendeling";
import { RIVIER_AANKONDIGING_STREEK_HOOGTE, RIVIER_STREEK_HOOGTE, WAMPANOAG_STREEK_HOOGTE } from "./worldGoingWest";
import { VERKENNER, VIJANDELIJK_HEILIGDOM } from "./improvements";
import { bereikbarePosities } from "./wegen";
import {
  GOUD_ONTDEKKING_STREEK,
  GOUD_ONTDEKKING_STREEK_2,
  BEZETTE_STREEK_HOOGTE,
  cultuurKostenVoorStreek,
  KUDDE_GROTE_JACHT_BEURTEN,
  ROOFDIER_MIN_STREEK,
  ROOFDIER_STREEK_KUDDE_POSITIE,
} from "./world";
import { metActieveStad } from "./stad";
import {
  metActiefHeiligdomOpStreek1,
  metBezetteStreekEnVoorraadVoorVerkenning,
  metBezetteStreekInBeeld,
  metOnthuldeBezetteStreekTile,
  WACHTTOREN,
} from "./testHelpers";

test("goudOntdektEvent wordt precies één keer gezet, zodra GOUD_ONTDEKKING_STREEK voor het eerst ontgrendelt", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, cultuur: cultuurKostenVoorStreek(GOUD_ONTDEKKING_STREEK) };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(naOntgrendeling.streken.find((l) => l.hoogte === GOUD_ONTDEKKING_STREEK)!.ontgrendeld, true);
  assert.equal(naOntgrendeling.goudOntdektEvent, true);

  const gesloten = sluitGoudOntdektMelding(naOntgrendeling);
  assert.equal(gesloten.goudOntdektEvent, undefined);

  const nogEenBeurt = volgendeBeurt(gesloten);
  assert.equal(nogEenBeurt.goudOntdektEvent, undefined, "geen herhaalde melding zodra de streek al ontgrendeld is");
});

// Softlock-preventie (issue: "Goudader sowieso op streek 12"): een tweede
// gegarandeerde Goudader-locatie op streek 12, positie 2 — een bergvakje —
// zodat een speler die de eerste Goudader liet uitputten zonder Markt nog
// op tijd goud kan opbouwen vóór de Bezette Streek (streek 13) Offer
// Altaar/Legerkamp vereist.
test("tweedeGoudOntdektEvent wordt precies één keer gezet, zodra GOUD_ONTDEKKING_STREEK_2 voor het eerst ontgrendelt", () => {
  let state = maakInitieleSpelStatus();
  const streek12 = state.streken.find((l) => l.hoogte === GOUD_ONTDEKKING_STREEK_2)!;
  assert.equal(streek12.tiles[2].goud, true, "de gegarandeerde tweede goudader-vondst");
  assert.equal(streek12.tiles[2].terrein, "berg", "op een berg- of heuvelvakje, zoals de eerste Goudader");

  state = { ...state, cultuur: cultuurKostenVoorStreek(GOUD_ONTDEKKING_STREEK_2) };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(naOntgrendeling.streken.find((l) => l.hoogte === GOUD_ONTDEKKING_STREEK_2)!.ontgrendeld, true);
  assert.equal(naOntgrendeling.tweedeGoudOntdektEvent, true);

  const gesloten = sluitTweedeGoudOntdektMelding(naOntgrendeling);
  assert.equal(gesloten.tweedeGoudOntdektEvent, undefined);

  const nogEenBeurt = volgendeBeurt(gesloten);
  assert.equal(
    nogEenBeurt.tweedeGoudOntdektEvent,
    undefined,
    "geen herhaalde melding zodra de streek al ontgrendeld is"
  );
});

// Nieuwe stichtingskans (issue #459, "Going west stad stichting"): streek 4
// is de eerste gegarandeerde vers-water-stichtingskans van het herhalende
// drie-stichtingsmomenten-patroon (hoofdstuk 9 Deel 2) — de pop-up legt de
// afweging uit tussen nu stichten en wachten op de Boon-beloning.
test("stichtingskansOntdektEvent wordt gezet zodra een Going West-streek met een vers-water-vakje ontgrendelt", () => {
  let state = maakInitieleSpelStatus("going-west");
  const streek4 = state.streken.find((l) => l.hoogte === 4)!;
  assert.equal(streek4.tiles.some((t) => t.versWater), true, "streek 4 is de eerste gegarandeerde stichtingskans");

  state = { ...state, cultuur: cultuurKostenVoorStreek(4) };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(naOntgrendeling.streken.find((l) => l.hoogte === 4)!.ontgrendeld, true);
  assert.equal(naOntgrendeling.stichtingskansOntdektEvent, true);

  const gesloten = sluitStichtingskansOntdektMelding(naOntgrendeling);
  assert.equal(gesloten.stichtingskansOntdektEvent, undefined);

  const nogEenBeurt = volgendeBeurt(gesloten);
  assert.equal(
    nogEenBeurt.stichtingskansOntdektEvent,
    undefined,
    "geen herhaalde melding zodra de streek al ontgrendeld is"
  );
});

// Zelfde issue: de tutorial heeft ook een vers-water-vakje (de allerlaatste
// streek, hoofdstuk 2), maar kent geen herhalend stichtingspatroon of
// Boon-systeem — de pop-up hoort daar dus niet te verschijnen.
test("tutorial: geen stichtingskansOntdektEvent bij haar eigen vers-water-streek", () => {
  let state = maakInitieleSpelStatus();
  const laatsteStreek = state.streken[state.streken.length - 1];
  assert.equal(laatsteStreek.tiles.some((t) => t.versWater), true, "de tutorial heeft precies één vers-water-vakje");

  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte < laatsteStreek.hoogte ? { ...streek, ontgrendeld: true, bezet: false } : streek
    ),
    cultuur: cultuurKostenVoorStreek(laatsteStreek.hoogte),
  };
  const naOntgrendeling = volgendeBeurt(state);

  assert.equal(naOntgrendeling.streken.find((l) => l.hoogte === laatsteStreek.hoogte)!.ontgrendeld, true);
  assert.equal(naOntgrendeling.stichtingskansOntdektEvent, undefined);
});

// Rivier-aankondiging (issue "Pop-up rivier"): kondigt de Ohio-rivier aan
// zodra streek RIVIER_AANKONDIGING_STREEK_HOOGTE ontgrendelt — de rivier zelf
// ligt verderop op streek 12 en is een apart, later issue.
test("rivierAangekondigdEvent wordt precies één keer gezet, zodra RIVIER_AANKONDIGING_STREEK_HOOGTE voor het eerst ontgrendelt in Going West", () => {
  let state = maakInitieleSpelStatus("going-west");
  // RIVIER_AANKONDIGING_STREEK_HOOGTE (9) ligt ná de blokkerende
  // Wampanoag-laag (WAMPANOAG_STREEK_HOOGTE, 6) — zonder deze bypass stopt de
  // ontgrendel-lus daar altijd eerst (zelfde bypass-patroon als
  // `metWampanoagVerbondGesloten` in indringersEnDieren.test.ts).
  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === WAMPANOAG_STREEK_HOOGTE
        ? { ...streek, wampanoagBezet: false, ontgrendeld: true }
        : streek.hoogte < RIVIER_AANKONDIGING_STREEK_HOOGTE
          ? { ...streek, ontgrendeld: true }
          : streek
    ),
    cultuur: cultuurKostenVoorStreek(RIVIER_AANKONDIGING_STREEK_HOOGTE),
  };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(
    naOntgrendeling.streken.find((l) => l.hoogte === RIVIER_AANKONDIGING_STREEK_HOOGTE)!.ontgrendeld,
    true
  );
  assert.equal(naOntgrendeling.rivierAangekondigdEvent, true);

  const gesloten = sluitRivierAangekondigdMelding(naOntgrendeling);
  assert.equal(gesloten.rivierAangekondigdEvent, undefined);

  const nogEenBeurt = volgendeBeurt(gesloten);
  assert.equal(
    nogEenBeurt.rivierAangekondigdEvent,
    undefined,
    "geen herhaalde melding zodra de streek al ontgrendeld is"
  );
});

// Zelfde issue: de tutorial heeft toevallig ook een streek op deze hoogte,
// maar kent geen rivier — de pop-up hoort daar dus niet te verschijnen.
test("tutorial: geen rivierAangekondigdEvent bij haar eigen streek op RIVIER_AANKONDIGING_STREEK_HOOGTE", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, cultuur: cultuurKostenVoorStreek(RIVIER_AANKONDIGING_STREEK_HOOGTE) };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(
    naOntgrendeling.streken.find((l) => l.hoogte === RIVIER_AANKONDIGING_STREEK_HOOGTE)!.ontgrendeld,
    true
  );
  assert.equal(naOntgrendeling.rivierAangekondigdEvent, undefined);
});

// Brug-bouwmechaniek (issue "Pop-up rivier", vervolg): een klik op een
// rivier-vakje (RIVIER_STREEK_HOOGTE) mag alleen een brug bouwen met een
// beschikbare Ingenieur en genoeg hout/steen — zelfde soort toewijs-test als
// `kanStuurMissionaris`/`stuurMissionaris` hierboven.
test("kanBrugBouwen/bouwBrug: vereist een beschikbare Ingenieur en genoeg hout/steen, en wijst de Ingenieur permanent toe", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, voorraad: { ...state.voorraad, hout: 6, steen: 6 } };

  assert.equal(kanBrugBouwen(state, RIVIER_STREEK_HOOGTE, 0), false, "nog geen Ingenieur");
  assert.equal(kanBrugBouwen(state, 1, 0), false, "geen rivier-vakje op streek 1");

  state = metActieveStad(state, { ...state.stad, ingenieurs: [{ id: "ingenieur-0" }] });
  assert.equal(kanBrugBouwen(state, RIVIER_STREEK_HOOGTE, 0), true);
  assert.equal(beschikbareIngenieurs(state).length, 1);

  state = bouwBrug(state, RIVIER_STREEK_HOOGTE, 0);
  const tile = state.streken.find((l) => l.hoogte === RIVIER_STREEK_HOOGTE)!.tiles[0];
  assert.equal(tile.brug, true);
  assert.equal(state.voorraad.hout, 0);
  assert.equal(state.voorraad.steen, 0);
  assert.deepEqual(state.stad.ingenieurs[0].brug, { hoogte: RIVIER_STREEK_HOOGTE, positieInStreek: 0 });
  assert.equal(beschikbareIngenieurs(state).length, 0, "de Ingenieur is niet meer vrij inzetbaar voor een volgende brug");
  assert.equal(kanBrugBouwen(state, RIVIER_STREEK_HOOGTE, 1), false, "geen vrije Ingenieur meer over");

  const naNogmaals = bouwBrug(state, RIVIER_STREEK_HOOGTE, 0);
  assert.equal(naNogmaals, state, "een vakje met al een brug kan niet nogmaals gebouwd worden");
});

test("bouwBrug op een tweede rivier-vakje vereist een nieuwe, nog niet toegewezen Ingenieur", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, voorraad: { ...state.voorraad, hout: 12, steen: 12 } };
  state = metActieveStad(state, { ...state.stad, ingenieurs: [{ id: "ingenieur-0" }] });
  state = bouwBrug(state, RIVIER_STREEK_HOOGTE, 0);

  state = metActieveStad(state, { ...state.stad, ingenieurs: [...state.stad.ingenieurs, { id: "ingenieur-1" }] });
  state = bouwBrug(state, RIVIER_STREEK_HOOGTE, 1);

  const streek = state.streken.find((l) => l.hoogte === RIVIER_STREEK_HOOGTE)!;
  assert.equal(streek.tiles[0].brug, true);
  assert.equal(streek.tiles[1].brug, true);
});

test("bouwBrug negeert de aanroep stilzwijgend zonder genoeg hout/steen", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, voorraad: { ...state.voorraad, hout: 5, steen: 6 } };
  state = metActieveStad(state, { ...state.stad, ingenieurs: [{ id: "ingenieur-0" }] });

  const naBouw = bouwBrug(state, RIVIER_STREEK_HOOGTE, 0);
  assert.equal(naBouw, state);
});

// Compensatie bij de roofdier-introductie (issue: "Eerste streek geen
// roofdieren", vervolgvraag): zodra ROOFDIER_MIN_STREEK (streek 6) voor het
// eerst ontgrendelt, staat er meteen een gegarandeerde, grotere kudde op
// ROOFDIER_STREEK_KUDDE_POSITIE (vakje 5) — de speler hoeft niet op de
// gewone, willekeurige kudde-trekking te wachten.
test("een gegarandeerde, grotere kudde verschijnt op vakje 5 zodra ROOFDIER_MIN_STREEK voor het eerst ontgrendelt", () => {
  let state = maakInitieleSpelStatus();
  const streekVoorOntgrendeling = state.streken.find((l) => l.hoogte === ROOFDIER_MIN_STREEK)!;
  assert.equal(
    streekVoorOntgrendeling.tiles[ROOFDIER_STREEK_KUDDE_POSITIE].kudde,
    undefined,
    "nog geen kudde vóór de streek ontgrendeld is"
  );

  state = { ...state, cultuur: cultuurKostenVoorStreek(ROOFDIER_MIN_STREEK) };

  const naOntgrendeling = volgendeBeurt(state);
  const streekNaOntgrendeling = naOntgrendeling.streken.find((l) => l.hoogte === ROOFDIER_MIN_STREEK)!;
  assert.equal(streekNaOntgrendeling.ontgrendeld, true);
  assert.deepEqual(streekNaOntgrendeling.tiles[ROOFDIER_STREEK_KUDDE_POSITIE].kudde, {
    beurtenResterend: KUDDE_GROTE_JACHT_BEURTEN,
  });

  const nogEenBeurt = volgendeBeurt(naOntgrendeling);
  assert.deepEqual(
    nogEenBeurt.streken.find((l) => l.hoogte === ROOFDIER_MIN_STREEK)!.tiles[ROOFDIER_STREEK_KUDDE_POSITIE].kudde,
    { beurtenResterend: KUDDE_GROTE_JACHT_BEURTEN },
    "de gegarandeerde kudde blijft staan, geen herplaatsing op een volgende beurt"
  );
});

test('streek 13 komt "in beeld" als Bezette Streek i.p.v. normaal te ontgrendelen zodra de cultuurdrempel gehaald wordt', () => {
  const state = metBezetteStreekInBeeld();
  const streek13 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;

  assert.equal(streek13.ontgrendeld, false, "de streek blijft vergrendeld — de frontier blijft op streek 12 staan");
  assert.equal(streek13.bezet, true);
  assert.equal(state.bezetteStreekOntdektEvent, true);
  assert.equal(streek13.tiles.every((t) => t.verhuld), true, "elk vakje is individueel verhuld");

  const inhoudTypes = streek13.tiles.map((t) => t.bezetteStreekInhoud).filter(Boolean);
  assert.equal(inhoudTypes.length, 8, "8 van de 9 vakjes dragen vaste vijandelijke/cosmetische inhoud");
  assert.equal(streek13.tiles[4].bezetteStreekInhoud, undefined, "het middelste vakje blijft neutraal");

  assert.equal(state.streken.find((l) => l.hoogte === 12)!.ontgrendeld, true, "streek 12 ontgrendelt gewoon normaal");
  assert.equal(state.streken.find((l) => l.hoogte === 14)!.ontgrendeld, false, "streek 14 blijft geblokkeerd achter de Bezette Streek");
});

// Regressietest (issue "Stam van de mammoet niet in campaigns"): De Stam van
// de Mammoet is tutorial-scripting op deze ene hoogte (world.ts,
// `BEZETTE_STREEK_HOOGTE`) — Going West heeft op dezelfde hoogte gewoon een
// normale streek en moet die dus ook normaal ontgrendelen, net zoals de
// Wampanoag-laag hierboven al een `campagneId`-check had maar deze niet.
test("streek 13 wordt in Going West gewoon normaal ontgrendeld — geen Bezette Streek/Stam van de Mammoet buiten de tutorial", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, cultuur: cultuurKostenVoorStreek(BEZETTE_STREEK_HOOGTE), voedsel: 10_000 };
  state = volgendeBeurt(state);

  const streek13 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  assert.equal(streek13.bezet, undefined, "geen Bezette-Streek-vlag in Going West");
  assert.equal(state.bezetteStreekOntdektEvent, undefined, "geen Bezette-Streek-melding in Going West");
});

test("cultuur-voortgang bevriest volledig zolang de Bezette Streek actief is, ook met Heiligdom-productie elders", () => {
  let state = metBezetteStreekInBeeld();
  const bevrorenCultuur = state.cultuur;

  state = metActiefHeiligdomOpStreek1(state);
  state = volgendeBeurt(state);

  assert.equal(state.cultuur, bevrorenCultuur, "cultuur blijft precies gelijk — bevroren, niet verloren, niet oplopend");
});

test("kanStuurVerkenner vereist een verhuld vakje zonder lopende verkenning, genoeg wetenschap en de 1x-per-beurt-limiet", () => {
  const zonderVoorraad = metBezetteStreekInBeeld();
  assert.equal(kanStuurVerkenner(zonderVoorraad, 0), false, "onvoldoende wetenschap bij de startstatus");

  const state = metBezetteStreekEnVoorraadVoorVerkenning();
  assert.equal(kanStuurVerkenner(state, 0), true);
  assert.equal(kanStuurVerkenner({ ...state, wetenschap: 0 }, 0), false);
  assert.equal(kanStuurVerkenner({ ...state, verkenningGedaanDitBeurt: true }, 0), false);
});

test("stuurVerkenner betaalt grondstoffen + wetenschap, zet een aftellend tellertje i.p.v. direct te onthullen, en mag maar 1x per beurt", () => {
  let state = metBezetteStreekEnVoorraadVoorVerkenning();
  const wetenschapVoor = state.wetenschap;
  const houtVoor = state.voorraad.hout;
  const streek12 = () => state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;

  state = stuurVerkenner(state, 0);
  assert.equal(streek12().tiles[0].verhuld, true, "nog niet meteen onthuld — de verkenner is onderweg");
  assert.deepEqual(streek12().tiles[0].verkenningInGang, { beurtenResterend: VERKENNER.bouwtijdBeurten });
  assert.equal(state.wetenschap, wetenschapVoor - VERKENNING_KOSTEN_WETENSCHAP);
  assert.equal(state.voorraad.hout, houtVoor - (VERKENNER.kosten.hout ?? 0));
  assert.equal(state.verkenningGedaanDitBeurt, true);

  const naTweedeVerkenner = stuurVerkenner(state, 1);
  assert.equal(naTweedeVerkenner, state, "een tweede verkenner dezelfde beurt heeft geen effect");

  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) {
    assert.equal(streek12().tiles[0].improvement, undefined, "nog niet onthuld tot het tellertje op 0 staat");
    state = volgendeBeurt(state);
  }

  // Positie 0 is in world.ts vastgelegd als "wachttoren" (TUTORIAL_BEZETTE_STREEK_INHOUD).
  assert.equal(streek12().tiles[0].verhuld, false);
  assert.equal(streek12().tiles[0].improvement?.id, "vijandelijke-wachttoren");
  assert.equal(streek12().tiles[0].status, "actief");
  assert.equal(streek12().tiles[0].verkenningInGang, undefined);
  assert.equal(state.verkenningGedaanDitBeurt, false, "de 1x-per-beurt-limiet is intussen weer teruggezet");
});

test("na het onthullen van één vakje kan een volgend vakje op een latere beurt los verkend worden", () => {
  let state = metBezetteStreekEnVoorraadVoorVerkenning();
  const streek12 = () => state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;

  state = stuurVerkenner(state, 0);
  state = volgendeBeurt(state); // met bouwtijdBeurten 1 is positie 0 na deze beurt al onthuld, limiet weer vrij
  assert.equal(streek12().tiles[0].verkenningInGang, undefined, "positie 0 is al onthuld");

  state = stuurVerkenner(state, 1);
  assert.deepEqual(streek12().tiles[1].verkenningInGang, { beurtenResterend: VERKENNER.bouwtijdBeurten });
});

test("stuurVerkenner op het neutrale middelste vakje onthult uiteindelijk gewoon een leeg vakje", () => {
  let state = metBezetteStreekEnVoorraadVoorVerkenning();
  state = stuurVerkenner(state, 4);
  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) state = volgendeBeurt(state);
  const tile = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!.tiles[4];
  assert.equal(tile.verhuld, false);
  assert.equal(tile.improvement, undefined);
});

test("een onthuld vijandelijk Heiligdom meldt dit via vijandelijkHeiligdomOnthuldEvent", () => {
  let state = metBezetteStreekEnVoorraadVoorVerkenning();
  // Positie 1 is in world.ts vastgelegd als "heiligdom".
  state = stuurVerkenner(state, 1);
  for (let i = 0; i < VERKENNER.bouwtijdBeurten; i++) state = volgendeBeurt(state);
  assert.equal(state.vijandelijkHeiligdomOnthuldEvent, true);
});

test("zonder toegewezen Missionaris blijft de wololo-meter van een Heiligdom op 0", () => {
  let state = metBezetteStreekInBeeld();
  state = metOnthuldeBezetteStreekTile(state, 1, VIJANDELIJK_HEILIGDOM);
  state = volgendeBeurt(state);
  const tile = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!.tiles[1];
  assert.equal(tile.wololoVoortgang ?? 0, 0);
});

test("kanStuurMissionaris/stuurMissionaris: alleen een onthuld vijandelijk Heiligdom, en alleen met een nog niet toegewezen Missionaris", () => {
  let state = metBezetteStreekInBeeld();
  state = metOnthuldeBezetteStreekTile(state, 1, VIJANDELIJK_HEILIGDOM);

  assert.equal(kanStuurMissionaris(state, 1), false, "nog geen Missionaris");
  assert.equal(kanStuurMissionaris(state, 3), false, "geen vijandelijk Heiligdom op dit vakje");

  state = metActieveStad(state, { ...state.stad, missionarissen: [{ id: "missionaris-0" }] });
  assert.equal(kanStuurMissionaris(state, 1), true);
  assert.equal(beschikbareMissionarissen(state).length, 1);

  state = stuurMissionaris(state, "missionaris-0", 1);
  assert.deepEqual(state.stad.missionarissen[0].doelHeiligdom, { hoogte: BEZETTE_STREEK_HOOGTE, positieInStreek: 1 });
  assert.equal(beschikbareMissionarissen(state).length, 0, "toegewezen — niet meer vrij inzetbaar");
  assert.equal(kanStuurMissionaris(state, 1), false, "geen vrije Missionaris meer over");

  const naNogmaals = stuurMissionaris(state, "missionaris-0", 1);
  assert.equal(naNogmaals, state, "een al toegewezen Missionaris kan niet nogmaals gestuurd worden");
});

test("een toegewezen Missionaris vult de wololo-meter van precies dát Heiligdom, niet van een ander", () => {
  let state = metBezetteStreekInBeeld();
  state = metOnthuldeBezetteStreekTile(state, 1, VIJANDELIJK_HEILIGDOM);
  state = metActieveStad(state, { ...state.stad, missionarissen: [{ id: "missionaris-0" }] });
  state = stuurMissionaris(state, "missionaris-0", 1);

  state = volgendeBeurt(state);

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  assert.equal(streek12.tiles[1].wololoVoortgang, WOLOLO_INKOMEN_PER_MISSIONARIS);
  assert.equal(streek12.tiles[3].wololoVoortgang ?? 0, 0, "geen doel — geen voortgang");
});

test("twee Missionarissen op hetzelfde Heiligdom vullen de meter 2x zo snel", () => {
  let state = metBezetteStreekInBeeld();
  state = metOnthuldeBezetteStreekTile(state, 1, VIJANDELIJK_HEILIGDOM);
  state = metActieveStad(state, {
    ...state.stad,
    missionarissen: [{ id: "missionaris-0" }, { id: "missionaris-1" }],
  });
  state = stuurMissionaris(state, "missionaris-0", 1);
  state = stuurMissionaris(state, "missionaris-1", 1);

  state = volgendeBeurt(state);

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  assert.equal(streek12.tiles[1].wololoVoortgang, WOLOLO_INKOMEN_PER_MISSIONARIS * 2);
});

test("bij het bereiken van de wololo-drempel wordt het Heiligdom veroverd (eigen bezit) i.p.v. vernietigd, en de Missionaris komt vrij", () => {
  let state = metBezetteStreekInBeeld();
  state = metOnthuldeBezetteStreekTile(state, 1, VIJANDELIJK_HEILIGDOM);
  state = metActieveStad(state, { ...state.stad, missionarissen: [{ id: "missionaris-0" }] });
  state = stuurMissionaris(state, "missionaris-0", 1);
  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte !== BEZETTE_STREEK_HOOGTE
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((t) =>
              t.positieInStreek === 1 ? { ...t, wololoVoortgang: BELEGERINGSDREMPEL - WOLOLO_INKOMEN_PER_MISSIONARIS } : t
            ),
          }
    ),
  };

  state = volgendeBeurt(state);

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  const heiligdomTile = streek12.tiles[1];
  assert.equal(heiligdomTile.improvement?.id, "heiligdom", "veroverd — eigen Heiligdom, niet vernietigd");
  assert.equal(heiligdomTile.status, "actief");
  assert.equal(heiligdomTile.wololoVoortgang, undefined);
  assert.equal(state.vijandelijkHeiligdomVeroverdEvent, true);
  assert.equal(state.stad.missionarissen[0].doelHeiligdom, undefined, "de Missionaris komt vrij voor een volgend doel");
  assert.equal(streek12.bezet, true, "nog niet opgelost: de vijandelijke Wachttoren (positie 0) staat nog, al dan niet onthuld");
});

test("Deel 6: zodra zowel het vijandelijke Heiligdom als de vijandelijke Wachttoren opgelost zijn, wordt de hele Bezette Streek in één keer onthuld en eindigt de Bezette-status", () => {
  let state = metBezetteStreekEnVoorraadVoorVerkenning();
  state = metActieveStad(state, { ...state.stad, missionarissen: [{ id: "missionaris-0" }] });
  state = {
    ...state,
    streken: state.streken.map((streek) => {
      if (streek.hoogte !== BEZETTE_STREEK_HOOGTE) return streek;
      return {
        ...streek,
        tiles: streek.tiles.map((tile) => {
          if (tile.positieInStreek === 1) {
            return {
              ...tile,
              verhuld: false,
              status: "actief" as const,
              improvement: VIJANDELIJK_HEILIGDOM,
              wololoVoortgang: BELEGERINGSDREMPEL - WOLOLO_INKOMEN_PER_MISSIONARIS,
            };
          }
          // De vijandelijke Wachttoren (positie 0) is al via een gewonnen
          // Confrontatie opgeruimd (zie `confrontatieBezetteStreek`) — zonder
          // dat is de streek met de nieuwe, uitgebreide opgelost-eis nog niet
          // klaar (zie de test hieronder).
          if (tile.positieInStreek === 0) {
            return { ...tile, verhuld: false, status: "leeg" as const, improvement: undefined };
          }
          return tile;
        }),
      };
    }),
  };
  state = stuurMissionaris(state, "missionaris-0", 1);

  state = volgendeBeurt(state);

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  assert.equal(streek12.bezet, false);
  assert.equal(streek12.ontgrendeld, true);
  assert.equal(streek12.tiles.every((t) => !t.verhuld), true, "ook nog niet individueel verkende vakjes zijn nu onthuld");
  assert.equal(streek12.tiles[0].improvement, undefined, "de vijandelijke Wachttoren op positie 0 blijft opgeruimd");
  assert.equal(streek12.tiles[2].improvement?.id, "bezette-streek-huisje");
});

test("Deel 6, uitgebreid (issue: laatste confrontatie tweaken): een nog niet opgeruimde vijandelijke Wachttoren houdt de Bezette Streek vergrendeld, ook als het Heiligdom al veroverd is", () => {
  let state = metBezetteStreekEnVoorraadVoorVerkenning();
  state = metActieveStad(state, { ...state.stad, missionarissen: [{ id: "missionaris-0" }] });
  state = {
    ...state,
    streken: state.streken.map((streek) => {
      if (streek.hoogte !== BEZETTE_STREEK_HOOGTE) return streek;
      return {
        ...streek,
        tiles: streek.tiles.map((tile) =>
          tile.positieInStreek === 1
            ? {
                ...tile,
                verhuld: false,
                status: "actief" as const,
                improvement: VIJANDELIJK_HEILIGDOM,
                wololoVoortgang: BELEGERINGSDREMPEL - WOLOLO_INKOMEN_PER_MISSIONARIS,
              }
            : tile
        ),
      };
    }),
  };
  state = stuurMissionaris(state, "missionaris-0", 1);

  state = volgendeBeurt(state);

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  assert.equal(streek12.tiles[1].improvement?.id, "heiligdom", "het Heiligdom is wel veroverd");
  assert.equal(streek12.bezet, true, "de streek blijft bezet: de vijandelijke Wachttoren (positie 0) staat nog");
  assert.equal(streek12.ontgrendeld, false);

  assert.deepEqual(
    bereikbarePosities(state.streken, { hoogte: 12, positieInStreek: 4 }).find((p) => p.hoogte === 13),
    undefined,
    "de settler kan nog niet naar streek 13 bewegen"
  );
  assert.equal(
    startBouw(state, BEZETTE_STREEK_HOOGTE, WACHTTOREN, 2).streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!.tiles[2]
      .status,
    "leeg",
    "bouwen op de Bezette Streek zelf blijft geblokkeerd (het nog onthulde huisje-vakje blijft ongewijzigd)"
  );
});

// Issue "Weer gewoon cultuur voor ontgrendeling": een eerdere versie
// (M21b, opdracht-wampanoag-opening.md §1/§4) liet de Going West-
// openingsfase op wetenschap draaien i.p.v. cultuur (`ontgrendelResource`).
// Dat bleek nodeloos ingewikkeld en is teruggedraaid — Going West ontgrendelt
// streken nu, net als de tutorial, altijd via cultuur; wetenschap drijft
// alleen nog de technologieboom en de Verkenner-actie (VERKENNING_KOSTEN_WETENSCHAP).
test("Going West: streek-ontgrendeling loopt op cultuur, ongeacht wetenschap", () => {
  let state = maakInitieleSpelStatus("going-west");

  // Veel wetenschap, maar geen cultuur: streek 2 blijft vergrendeld.
  state = { ...state, cultuur: 0, wetenschap: 10_000 };
  assert.equal(volgendeBeurt(state).streken.find((l) => l.hoogte === 2)!.ontgrendeld, false);

  // Genoeg cultuur voor de gewone cultuurdrempel: ontgrendelt, ongeacht de
  // wetenschap hierboven.
  state = { ...state, cultuur: cultuurKostenVoorStreek(2) };
  assert.equal(volgendeBeurt(state).streken.find((l) => l.hoogte === 2)!.ontgrendeld, true);
});

// Zelfde issue: de tutorial liep hier altijd al op cultuur — vastgelegd als
// regressietest zodat een latere wijziging aan Going West dit niet weer
// per ongeluk verandert.
test("tutorial: streek-ontgrendeling blijft op cultuur lopen, ongeacht wetenschap", () => {
  let state = maakInitieleSpelStatus();

  state = { ...state, wetenschap: 10_000, cultuur: 0 };
  assert.equal(volgendeBeurt(state).streken.find((l) => l.hoogte === 2)!.ontgrendeld, false);

  state = { ...state, cultuur: cultuurKostenVoorStreek(2) };
  assert.equal(volgendeBeurt(state).streken.find((l) => l.hoogte === 2)!.ontgrendeld, true);
});
