import test from "node:test";
import assert from "node:assert/strict";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { startBouw } from "./infrastructuurEnBouw";
import {
  BELEGERINGSDREMPEL,
  kanVerkennen,
  sluitAmberOntdektMelding,
  sluitTweedeAmberOntdektMelding,
  verken,
  VERKENNING_KOSTEN_WETENSCHAP,
} from "./streekOntgrendeling";
import { VIJANDELIJK_HEILIGDOM } from "./improvements";
import { bereikbarePosities } from "./wegen";
import { AMBER_ONTDEKKING_STREEK, AMBER_ONTDEKKING_STREEK_2, BEZETTE_STREEK_HOOGTE, cultuurKostenVoorStreek } from "./world";
import {
  HEILIGDOM,
  metActiefHeiligdomOpStreek1,
  metBezetteStreekEnVerkenner,
  metBezetteStreekInBeeld,
  metVasteRandom,
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

test("kanVerkennen vereist een Bezette Streek, minstens één Verkenner, genoeg wetenschap en de 1x-per-beurt-limiet", () => {
  const zonderVerkenner = metBezetteStreekInBeeld();
  assert.equal(kanVerkennen(zonderVerkenner), false);

  const state = metBezetteStreekEnVerkenner();
  assert.equal(kanVerkennen(state), true);
  assert.equal(kanVerkennen({ ...state, wetenschap: 0 }), false);
  assert.equal(kanVerkennen({ ...state, verkenningGedaanDitBeurt: true }), false);
});

test("verken onthult het gekozen vakje als de vaste vijandelijke inhoud, kost wetenschap, en mag maar 1x per beurt", () => {
  let state = metBezetteStreekEnVerkenner();
  const wetenschapVoor = state.wetenschap;
  const streek12 = () => state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;

  // Positie 0 is in world.ts vastgelegd als "wachttoren" (TUTORIAL_BEZETTE_STREEK_INHOUD).
  state = verken(state, 0);
  assert.equal(streek12().tiles[0].verhuld, false);
  assert.equal(streek12().tiles[0].improvement?.id, "vijandelijke-wachttoren");
  assert.equal(streek12().tiles[0].status, "actief");
  assert.equal(state.wetenschap, wetenschapVoor - VERKENNING_KOSTEN_WETENSCHAP);
  assert.equal(state.verkenningGedaanDitBeurt, true);

  const naTweedeVerkenning = verken(state, 1);
  assert.equal(naTweedeVerkenning, state, "een tweede Verkenning dezelfde beurt heeft geen effect");

  state = volgendeBeurt(state);
  assert.equal(state.verkenningGedaanDitBeurt, false, "volgende beurt mag weer");
});

test("verken op het neutrale middelste vakje onthult gewoon een leeg vakje", () => {
  let state = metBezetteStreekEnVerkenner();
  state = verken(state, 4);
  const tile = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!.tiles[4];
  assert.equal(tile.verhuld, false);
  assert.equal(tile.improvement, undefined);
});

test("verken op een vakje met vijandelijk Heiligdom meldt dit via vijandelijkHeiligdomOnthuldEvent", () => {
  let state = metBezetteStreekEnVerkenner();
  // Positie 1 is in world.ts vastgelegd als "heiligdom".
  state = verken(state, 1);
  assert.equal(state.vijandelijkHeiligdomOnthuldEvent, true);
});

test("zonder Missionaris blijft de belegeringsmeter op 0, ondanks cultuurproductie elders", () => {
  let state = metBezetteStreekInBeeld();
  state = metActiefHeiligdomOpStreek1(state);
  state = volgendeBeurt(state);
  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  assert.equal(streek12.belegeringsVoortgang, 0);
});

test("met minstens één Missionaris wordt cultuur-inkomen omgeleid naar de belegeringsmeter i.p.v. verloren te gaan", () => {
  let state = metBezetteStreekInBeeld();
  state = metActiefHeiligdomOpStreek1(state);
  state = { ...state, stad: { ...state.stad, missionarissen: [{ id: "missionaris-0" }] } };
  state = volgendeBeurt(state);

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  // Streek 1 is niet de frontier (die staat op 11 zolang de streek bezet is),
  // dus de halve opbrengst geldt — zelfde regel als `verwerkProductie`.
  assert.equal(streek12.belegeringsVoortgang, (HEILIGDOM.effect.waarde ?? 0) / 2);
});

test("elke extra Missionaris vermenigvuldigt de belegeringsvoortgang (3 Missionarissen vullen de meter 3x zo snel als 1)", () => {
  let metEenMissionaris = metBezetteStreekInBeeld();
  metEenMissionaris = metActiefHeiligdomOpStreek1(metEenMissionaris);
  metEenMissionaris = {
    ...metEenMissionaris,
    stad: { ...metEenMissionaris.stad, missionarissen: [{ id: "missionaris-0" }] },
  };
  metEenMissionaris = volgendeBeurt(metEenMissionaris);
  const voortgangMetEen = metEenMissionaris.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!.belegeringsVoortgang ?? 0;

  let metDrieMissionarissen = metBezetteStreekInBeeld();
  metDrieMissionarissen = metActiefHeiligdomOpStreek1(metDrieMissionarissen);
  metDrieMissionarissen = {
    ...metDrieMissionarissen,
    stad: {
      ...metDrieMissionarissen.stad,
      missionarissen: [{ id: "missionaris-0" }, { id: "missionaris-1" }, { id: "missionaris-2" }],
    },
  };
  metDrieMissionarissen = volgendeBeurt(metDrieMissionarissen);
  const voortgangMetDrie =
    metDrieMissionarissen.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!.belegeringsVoortgang ?? 0;

  assert.equal(voortgangMetDrie, voortgangMetEen * 3);
});

test("bij het bereiken van de belegeringsdrempel wordt het onthulde vijandelijke Heiligdom vernietigd en begint de meter opnieuw", () => {
  let state = metBezetteStreekEnVerkenner();
  state = verken(state, 1); // onthult het vijandelijke Heiligdom op positie 1
  state = metActiefHeiligdomOpStreek1(state);
  state = {
    ...state,
    stad: { ...state.stad, missionarissen: [{ id: "missionaris-0" }] },
    streken: state.streken.map((streek) =>
      streek.hoogte !== BEZETTE_STREEK_HOOGTE ? streek : { ...streek, belegeringsVoortgang: BELEGERINGSDREMPEL - 1 }
    ),
  };

  state = volgendeBeurt(state);

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  const heiligdomTile = streek12.tiles[1];
  assert.equal(heiligdomTile.status, "leeg", "opgeruimd — geen dreiging/doel meer");
  assert.equal(heiligdomTile.improvement, undefined);
  assert.equal(state.vijandelijkHeiligdomVernietigdEvent, true);
  assert.equal(streek12.belegeringsVoortgang, 0, "de meter begint weer bij 0, ook al is dit het enige Heiligdom");
  assert.equal(streek12.bezet, true, "nog niet opgelost: de vijandelijke Wachttoren (positie 0) staat nog, al dan niet onthuld");
});

test("Deel 6: zodra zowel het vijandelijke Heiligdom als de vijandelijke Wachttoren vernietigd zijn, wordt de hele Bezette Streek in één keer onthuld en eindigt de Bezette-status", () => {
  let state = metBezetteStreekEnVerkenner();
  state = {
    ...state,
    stad: { ...state.stad, missionarissen: [{ id: "missionaris-0" }] },
    streken: state.streken.map((streek) => {
      if (streek.hoogte !== BEZETTE_STREEK_HOOGTE) return streek;
      return {
        ...streek,
        belegeringsVoortgang: BELEGERINGSDREMPEL - 1,
        tiles: streek.tiles.map((tile) => {
          if (tile.positieInStreek === 1) {
            return { ...tile, verhuld: false, status: "actief" as const, improvement: VIJANDELIJK_HEILIGDOM };
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
  state = metActiefHeiligdomOpStreek1(state);

  // Bevries alle willekeurige incidenten (indringers/kuddes/roofdieren) zodat
  // deze lange lus deterministisch blijft — puur voor de leesbaarheid van
  // deze test, niet omdat het mechanisme zelf random-afhankelijk is.
  state = metVasteRandom(0.99, () => {
    let s = state;
    for (let i = 0; i < BELEGERINGSDREMPEL + 1; i++) s = volgendeBeurt(s);
    return s;
  });

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  assert.equal(streek12.bezet, false);
  assert.equal(streek12.ontgrendeld, true);
  assert.equal(streek12.tiles.every((t) => !t.verhuld), true, "ook nog niet individueel verkende vakjes zijn nu onthuld");
  assert.equal(streek12.tiles[0].improvement, undefined, "de vijandelijke Wachttoren op positie 0 blijft opgeruimd");
  assert.equal(streek12.tiles[2].improvement?.id, "bezette-streek-huisje");
});

test("Deel 6, uitgebreid (issue: laatste confrontatie tweaken): een nog niet vernietigde vijandelijke Wachttoren houdt de Bezette Streek vergrendeld, ook als alle Heiligdommen al weg zijn", () => {
  let state = metBezetteStreekEnVerkenner();
  state = {
    ...state,
    stad: { ...state.stad, missionarissen: [{ id: "missionaris-0" }] },
    streken: state.streken.map((streek) => {
      if (streek.hoogte !== BEZETTE_STREEK_HOOGTE) return streek;
      return {
        ...streek,
        belegeringsVoortgang: BELEGERINGSDREMPEL - 1,
        tiles: streek.tiles.map((tile) =>
          tile.positieInStreek === 1
            ? { ...tile, verhuld: false, status: "actief" as const, improvement: VIJANDELIJK_HEILIGDOM }
            : tile
        ),
      };
    }),
  };
  state = metActiefHeiligdomOpStreek1(state);

  state = metVasteRandom(0.99, () => {
    let s = state;
    for (let i = 0; i < BELEGERINGSDREMPEL + 1; i++) s = volgendeBeurt(s);
    return s;
  });

  const streek12 = state.streken.find((l) => l.hoogte === BEZETTE_STREEK_HOOGTE)!;
  assert.equal(streek12.tiles[1].improvement, undefined, "het Heiligdom is wel vernietigd");
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
