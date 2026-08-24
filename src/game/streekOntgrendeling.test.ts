import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { startBouw } from "./infrastructuurEnBouw";
import {
  BELEGERINGSDREMPEL,
  beschikbareMissionarissen,
  kanStuurMissionaris,
  kanStuurVerkenner,
  sluitAmberOntdektMelding,
  sluitTweedeAmberOntdektMelding,
  stuurMissionaris,
  stuurVerkenner,
  VERKENNING_KOSTEN_WETENSCHAP,
  WOLOLO_INKOMEN_PER_MISSIONARIS,
} from "./streekOntgrendeling";
import { VERKENNER, VIJANDELIJK_HEILIGDOM } from "./improvements";
import { bereikbarePosities } from "./wegen";
import {
  AMBER_ONTDEKKING_STREEK,
  AMBER_ONTDEKKING_STREEK_2,
  BEZETTE_STREEK_HOOGTE,
  cultuurKostenVoorStreek,
  KUDDE_GROTE_JACHT_BEURTEN,
  ROOFDIER_MIN_STREEK,
  ROOFDIER_STREEK_KUDDE_POSITIE,
  wetenschapKostenVoorStreekOntgrendeling,
} from "./world";
import { metActieveStad } from "./stad";
import {
  metActiefHeiligdomOpStreek1,
  metBezetteStreekEnVoorraadVoorVerkenning,
  metBezetteStreekInBeeld,
  metOnthuldeBezetteStreekTile,
  WACHTTOREN,
} from "./testHelpers";

test("amberOntdektEvent wordt precies één keer gezet, zodra AMBER_ONTDEKKING_STREEK voor het eerst ontgrendelt", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, cultuur: cultuurKostenVoorStreek(AMBER_ONTDEKKING_STREEK) };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(naOntgrendeling.streken.find((l) => l.hoogte === AMBER_ONTDEKKING_STREEK)!.ontgrendeld, true);
  assert.equal(naOntgrendeling.amberOntdektEvent, true);

  const gesloten = sluitAmberOntdektMelding(naOntgrendeling);
  assert.equal(gesloten.amberOntdektEvent, undefined);

  const nogEenBeurt = volgendeBeurt(gesloten);
  assert.equal(nogEenBeurt.amberOntdektEvent, undefined, "geen herhaalde melding zodra de streek al ontgrendeld is");
});

// Softlock-preventie (issue: "Amberader sowieso op streek 12"): een tweede
// gegarandeerde Amberader-locatie op streek 12, positie 2 — een bergvakje —
// zodat een speler die de eerste Amberader liet uitputten zonder Markt nog
// op tijd goud kan opbouwen vóór de Bezette Streek (streek 13) Offer
// Altaar/Legerkamp vereist.
test("tweedeAmberOntdektEvent wordt precies één keer gezet, zodra AMBER_ONTDEKKING_STREEK_2 voor het eerst ontgrendelt", () => {
  let state = maakInitieleSpelStatus();
  const streek12 = state.streken.find((l) => l.hoogte === AMBER_ONTDEKKING_STREEK_2)!;
  assert.equal(streek12.tiles[2].amber, true, "de gegarandeerde tweede amberader-vondst");
  assert.equal(streek12.tiles[2].terrein, "berg", "op een berg- of heuvelvakje, zoals de eerste Amberader");

  state = { ...state, cultuur: cultuurKostenVoorStreek(AMBER_ONTDEKKING_STREEK_2) };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(naOntgrendeling.streken.find((l) => l.hoogte === AMBER_ONTDEKKING_STREEK_2)!.ontgrendeld, true);
  assert.equal(naOntgrendeling.tweedeAmberOntdektEvent, true);

  const gesloten = sluitTweedeAmberOntdektMelding(naOntgrendeling);
  assert.equal(gesloten.tweedeAmberOntdektEvent, undefined);

  const nogEenBeurt = volgendeBeurt(gesloten);
  assert.equal(
    nogEenBeurt.tweedeAmberOntdektEvent,
    undefined,
    "geen herhaalde melding zodra de streek al ontgrendeld is"
  );
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

test("cultuur-voortgang bevriest volledig zolang de Bezette Streek actief is, ook met Heiligdom-productie elders", () => {
  let state = metBezetteStreekInBeeld();
  const bevrorenCultuur = state.cultuur;

  state = metActiefHeiligdomOpStreek1(state);
  state = volgendeBeurt(state);

  assert.equal(state.cultuur, bevrorenCultuur, "cultuur blijft precies gelijk — bevroren, niet verloren, niet oplopend");
});

test("kanStuurVerkenner vereist een verhuld vakje zonder lopende verkenning, genoeg grondstoffen/wetenschap en de 1x-per-beurt-limiet", () => {
  const zonderVoorraad = metBezetteStreekInBeeld();
  assert.equal(kanStuurVerkenner(zonderVoorraad, 0), false, "onvoldoende wetenschap/grondstoffen bij de startstatus");

  const state = metBezetteStreekEnVoorraadVoorVerkenning();
  assert.equal(kanStuurVerkenner(state, 0), true);
  assert.equal(kanStuurVerkenner({ ...state, wetenschap: 0 }, 0), false);
  assert.equal(kanStuurVerkenner({ ...state, verkenningGedaanDitBeurt: true }, 0), false);
  assert.equal(
    kanStuurVerkenner({ ...state, voorraad: { ...state.voorraad, hout: 0 } }, 0),
    false,
    "grondstoffen van VERKENNER.kosten moeten betaalbaar zijn"
  );
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

test("meerdere vakjes kunnen tegelijk 'onderweg' zijn als ze op verschillende beurten gestart zijn", () => {
  let state = metBezetteStreekEnVoorraadVoorVerkenning();
  const streek12 = () => state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;

  state = stuurVerkenner(state, 0);
  state = volgendeBeurt(state); // 1 beurt verstreken voor positie 0, limiet weer vrij
  state = stuurVerkenner(state, 1);

  assert.equal(streek12().tiles[0].verkenningInGang?.beurtenResterend, VERKENNER.bouwtijdBeurten - 1);
  assert.equal(streek12().tiles[1].verkenningInGang?.beurtenResterend, VERKENNER.bouwtijdBeurten);
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

// M21b (opdracht-wampanoag-opening.md §1/§4): tijdens de Going West-
// openingsfase (`ontgrendelResource: "wetenschap"`, gezet door
// `maakInitieleSpelStatus` sinds M21a) loopt streek-ontgrendeling op
// wetenschap i.p.v. cultuur, met de opdracht-drempels streek 2 = 10.
test("Going West-openingsfase: streek-ontgrendeling loopt op wetenschap, niet op cultuur", () => {
  let state = maakInitieleSpelStatus("going-west");
  assert.equal(state.ontgrendelResource, "wetenschap");

  // Veel cultuur, maar geen wetenschap: streek 2 blijft vergrendeld.
  state = { ...state, cultuur: cultuurKostenVoorStreek(2) + 100, wetenschap: 0 };
  assert.equal(volgendeBeurt(state).streken.find((l) => l.hoogte === 2)!.ontgrendeld, false);

  // Net genoeg wetenschap voor de opdracht-drempel van streek 2 (10):
  // ontgrendelt, ongeacht de cultuur hierboven.
  state = { ...state, wetenschap: wetenschapKostenVoorStreekOntgrendeling(2) };
  assert.equal(volgendeBeurt(state).streken.find((l) => l.hoogte === 2)!.ontgrendeld, true);
});

// Zelfde opdracht-paragraaf: de tutorial (`ontgrendelResource: "cultuur"`,
// ongewijzigd) mag door deze campagne-splitsing niet beïnvloed worden — veel
// wetenschap alleen mag een tutorial-streek niet ontgrendelen.
test("tutorial: streek-ontgrendeling blijft op cultuur lopen, ongeacht wetenschap", () => {
  let state = maakInitieleSpelStatus();
  assert.equal(state.ontgrendelResource, "cultuur");

  state = { ...state, wetenschap: wetenschapKostenVoorStreekOntgrendeling(2) + 100, cultuur: 0 };
  assert.equal(volgendeBeurt(state).streken.find((l) => l.hoogte === 2)!.ontgrendeld, false);

  state = { ...state, cultuur: cultuurKostenVoorStreek(2) };
  assert.equal(volgendeBeurt(state).streken.find((l) => l.hoogte === 2)!.ontgrendeld, true);
});

// De opdracht noemt drie expliciete drempelwaarden (streek 2 = 10, 3 = 20,
// 4 = 35) — vastgelegd als regressietest, los van de exacte formule-vorm in
// world.ts.
test("wetenschapKostenVoorStreekOntgrendeling geeft de opdracht-drempels voor streek 2/3/4", () => {
  assert.equal(wetenschapKostenVoorStreekOntgrendeling(2), 10);
  assert.equal(wetenschapKostenVoorStreekOntgrendeling(3), 20);
  assert.equal(wetenschapKostenVoorStreekOntgrendeling(4), 35);
});
