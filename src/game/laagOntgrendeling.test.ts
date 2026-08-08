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
} from "./laagOntgrendeling";
import { VIJANDELIJK_HEILIGDOM } from "./improvements";
import { bereikbarePosities } from "./wegen";
import { AMBER_ONTDEKKING_LAAG, AMBER_ONTDEKKING_LAAG_2, BEZETTE_LAAG_HOOGTE, cultuurKostenVoorLaag } from "./world";
import {
  HEILIGDOM,
  metActiefHeiligdomOpLaag1,
  metBezetteLaagEnVerkenner,
  metBezetteLaagInBeeld,
  metVasteRandom,
  WACHTTOREN,
} from "./testHelpers";

test("amberOntdektEvent wordt precies één keer gezet, zodra AMBER_ONTDEKKING_LAAG voor het eerst ontgrendelt", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, cultuur: cultuurKostenVoorLaag(AMBER_ONTDEKKING_LAAG) };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(naOntgrendeling.lagen.find((l) => l.hoogte === AMBER_ONTDEKKING_LAAG)!.ontgrendeld, true);
  assert.equal(naOntgrendeling.amberOntdektEvent, true);

  const gesloten = sluitAmberOntdektMelding(naOntgrendeling);
  assert.equal(gesloten.amberOntdektEvent, undefined);

  const nogEenBeurt = volgendeBeurt(gesloten);
  assert.equal(nogEenBeurt.amberOntdektEvent, undefined, "geen herhaalde melding zodra de laag al ontgrendeld is");
});

// Softlock-preventie (issue: "Amberader sowieso op laag 12"): een tweede
// gegarandeerde Amberader-locatie op laag 11, positie 2 — een bergvakje —
// zodat een speler die de eerste Amberader liet uitputten zonder Markt nog
// op tijd goud kan opbouwen vóór de Bezette Laag (laag 12) Offer
// Altaar/Legerkamp vereist.
test("tweedeAmberOntdektEvent wordt precies één keer gezet, zodra AMBER_ONTDEKKING_LAAG_2 voor het eerst ontgrendelt", () => {
  let state = maakInitieleSpelStatus();
  const laag11 = state.lagen.find((l) => l.hoogte === AMBER_ONTDEKKING_LAAG_2)!;
  assert.equal(laag11.tiles[2].amber, true, "de gegarandeerde tweede amberader-vondst");
  assert.equal(laag11.tiles[2].terrein, "berg", "op een berg- of heuvelvakje, zoals de eerste Amberader");

  state = { ...state, cultuur: cultuurKostenVoorLaag(AMBER_ONTDEKKING_LAAG_2) };

  const naOntgrendeling = volgendeBeurt(state);
  assert.equal(naOntgrendeling.lagen.find((l) => l.hoogte === AMBER_ONTDEKKING_LAAG_2)!.ontgrendeld, true);
  assert.equal(naOntgrendeling.tweedeAmberOntdektEvent, true);

  const gesloten = sluitTweedeAmberOntdektMelding(naOntgrendeling);
  assert.equal(gesloten.tweedeAmberOntdektEvent, undefined);

  const nogEenBeurt = volgendeBeurt(gesloten);
  assert.equal(
    nogEenBeurt.tweedeAmberOntdektEvent,
    undefined,
    "geen herhaalde melding zodra de laag al ontgrendeld is"
  );
});

test('laag 12 komt "in beeld" als Bezette Laag i.p.v. normaal te ontgrendelen zodra de cultuurdrempel gehaald wordt', () => {
  const state = metBezetteLaagInBeeld();
  const laag12 = state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!;

  assert.equal(laag12.ontgrendeld, false, "de laag blijft vergrendeld — de frontier blijft op laag 11 staan");
  assert.equal(laag12.bezet, true);
  assert.equal(state.bezetteLaagOntdektEvent, true);
  assert.equal(laag12.tiles.every((t) => t.verhuld), true, "elk vakje is individueel verhuld");

  const inhoudTypes = laag12.tiles.map((t) => t.bezetteLaagInhoud).filter(Boolean);
  assert.equal(inhoudTypes.length, 8, "8 van de 9 vakjes dragen vaste vijandelijke/cosmetische inhoud");
  assert.equal(laag12.tiles[4].bezetteLaagInhoud, undefined, "het middelste vakje blijft neutraal");

  assert.equal(state.lagen.find((l) => l.hoogte === 11)!.ontgrendeld, true, "laag 11 ontgrendelt gewoon normaal");
  assert.equal(state.lagen.find((l) => l.hoogte === 13)!.ontgrendeld, false, "laag 13 blijft geblokkeerd achter de Bezette Laag");
});

test("cultuur-voortgang bevriest volledig zolang de Bezette Laag actief is, ook met Heiligdom-productie elders", () => {
  let state = metBezetteLaagInBeeld();
  const bevrorenCultuur = state.cultuur;

  state = metActiefHeiligdomOpLaag1(state);
  state = volgendeBeurt(state);

  assert.equal(state.cultuur, bevrorenCultuur, "cultuur blijft precies gelijk — bevroren, niet verloren, niet oplopend");
});

test("kanVerkennen vereist een Bezette Laag, minstens één Verkenner, genoeg wetenschap en de 1x-per-beurt-limiet", () => {
  const zonderVerkenner = metBezetteLaagInBeeld();
  assert.equal(kanVerkennen(zonderVerkenner), false);

  const state = metBezetteLaagEnVerkenner();
  assert.equal(kanVerkennen(state), true);
  assert.equal(kanVerkennen({ ...state, wetenschap: 0 }), false);
  assert.equal(kanVerkennen({ ...state, verkenningGedaanDitBeurt: true }), false);
});

test("verken onthult het gekozen vakje als de vaste vijandelijke inhoud, kost wetenschap, en mag maar 1x per beurt", () => {
  let state = metBezetteLaagEnVerkenner();
  const wetenschapVoor = state.wetenschap;
  const laag12 = () => state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!;

  // Positie 0 is in world.ts vastgelegd als "wachttoren" (TUTORIAL_BEZETTE_LAAG_INHOUD).
  state = verken(state, 0);
  assert.equal(laag12().tiles[0].verhuld, false);
  assert.equal(laag12().tiles[0].improvement?.id, "vijandelijke-wachttoren");
  assert.equal(laag12().tiles[0].status, "actief");
  assert.equal(state.wetenschap, wetenschapVoor - VERKENNING_KOSTEN_WETENSCHAP);
  assert.equal(state.verkenningGedaanDitBeurt, true);

  const naTweedeVerkenning = verken(state, 1);
  assert.equal(naTweedeVerkenning, state, "een tweede Verkenning dezelfde beurt heeft geen effect");

  state = volgendeBeurt(state);
  assert.equal(state.verkenningGedaanDitBeurt, false, "volgende beurt mag weer");
});

test("verken op het neutrale middelste vakje onthult gewoon een leeg vakje", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 4);
  const tile = state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!.tiles[4];
  assert.equal(tile.verhuld, false);
  assert.equal(tile.improvement, undefined);
});

test("verken op een vakje met vijandelijk Heiligdom meldt dit via vijandelijkHeiligdomOnthuldEvent", () => {
  let state = metBezetteLaagEnVerkenner();
  // Positie 1 is in world.ts vastgelegd als "heiligdom".
  state = verken(state, 1);
  assert.equal(state.vijandelijkHeiligdomOnthuldEvent, true);
});

test("zonder Missionaris blijft de belegeringsmeter op 0, ondanks cultuurproductie elders", () => {
  let state = metBezetteLaagInBeeld();
  state = metActiefHeiligdomOpLaag1(state);
  state = volgendeBeurt(state);
  const laag12 = state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!;
  assert.equal(laag12.belegeringsVoortgang, 0);
});

test("met minstens één Missionaris wordt cultuur-inkomen omgeleid naar de belegeringsmeter i.p.v. verloren te gaan", () => {
  let state = metBezetteLaagInBeeld();
  state = metActiefHeiligdomOpLaag1(state);
  state = { ...state, stad: { ...state.stad, missionarissen: [{ id: "missionaris-0" }] } };
  state = volgendeBeurt(state);

  const laag12 = state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!;
  // Laag 1 is niet de frontier (die staat op 11 zolang de laag bezet is),
  // dus de halve opbrengst geldt — zelfde regel als `verwerkProductie`.
  assert.equal(laag12.belegeringsVoortgang, (HEILIGDOM.effect.waarde ?? 0) / 2);
});

test("elke extra Missionaris vermenigvuldigt de belegeringsvoortgang (3 Missionarissen vullen de meter 3x zo snel als 1)", () => {
  let metEenMissionaris = metBezetteLaagInBeeld();
  metEenMissionaris = metActiefHeiligdomOpLaag1(metEenMissionaris);
  metEenMissionaris = {
    ...metEenMissionaris,
    stad: { ...metEenMissionaris.stad, missionarissen: [{ id: "missionaris-0" }] },
  };
  metEenMissionaris = volgendeBeurt(metEenMissionaris);
  const voortgangMetEen = metEenMissionaris.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!.belegeringsVoortgang ?? 0;

  let metDrieMissionarissen = metBezetteLaagInBeeld();
  metDrieMissionarissen = metActiefHeiligdomOpLaag1(metDrieMissionarissen);
  metDrieMissionarissen = {
    ...metDrieMissionarissen,
    stad: {
      ...metDrieMissionarissen.stad,
      missionarissen: [{ id: "missionaris-0" }, { id: "missionaris-1" }, { id: "missionaris-2" }],
    },
  };
  metDrieMissionarissen = volgendeBeurt(metDrieMissionarissen);
  const voortgangMetDrie =
    metDrieMissionarissen.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!.belegeringsVoortgang ?? 0;

  assert.equal(voortgangMetDrie, voortgangMetEen * 3);
});

test("bij het bereiken van de belegeringsdrempel wordt het onthulde vijandelijke Heiligdom vernietigd en begint de meter opnieuw", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 1); // onthult het vijandelijke Heiligdom op positie 1
  state = metActiefHeiligdomOpLaag1(state);
  state = {
    ...state,
    stad: { ...state.stad, missionarissen: [{ id: "missionaris-0" }] },
    lagen: state.lagen.map((laag) =>
      laag.hoogte !== BEZETTE_LAAG_HOOGTE ? laag : { ...laag, belegeringsVoortgang: BELEGERINGSDREMPEL - 1 }
    ),
  };

  state = volgendeBeurt(state);

  const laag12 = state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!;
  const heiligdomTile = laag12.tiles[1];
  assert.equal(heiligdomTile.status, "leeg", "opgeruimd — geen dreiging/doel meer");
  assert.equal(heiligdomTile.improvement, undefined);
  assert.equal(state.vijandelijkHeiligdomVernietigdEvent, true);
  assert.equal(laag12.belegeringsVoortgang, 0, "de meter begint weer bij 0, ook al is dit het enige Heiligdom");
  assert.equal(laag12.bezet, true, "nog niet opgelost: de vijandelijke Wachttoren (positie 0) staat nog, al dan niet onthuld");
});

test("Deel 6: zodra zowel het vijandelijke Heiligdom als de vijandelijke Wachttoren vernietigd zijn, wordt de hele Bezette Laag in één keer onthuld en eindigt de Bezette-status", () => {
  let state = metBezetteLaagEnVerkenner();
  state = {
    ...state,
    stad: { ...state.stad, missionarissen: [{ id: "missionaris-0" }] },
    lagen: state.lagen.map((laag) => {
      if (laag.hoogte !== BEZETTE_LAAG_HOOGTE) return laag;
      return {
        ...laag,
        belegeringsVoortgang: BELEGERINGSDREMPEL - 1,
        tiles: laag.tiles.map((tile) => {
          if (tile.positieInLaag === 1) {
            return { ...tile, verhuld: false, status: "actief" as const, improvement: VIJANDELIJK_HEILIGDOM };
          }
          // De vijandelijke Wachttoren (positie 0) is al via een gewonnen
          // Confrontatie opgeruimd (zie `confrontatieBezetteLaag`) — zonder
          // dat is de laag met de nieuwe, uitgebreide opgelost-eis nog niet
          // klaar (zie de test hieronder).
          if (tile.positieInLaag === 0) {
            return { ...tile, verhuld: false, status: "leeg" as const, improvement: undefined };
          }
          return tile;
        }),
      };
    }),
  };
  state = metActiefHeiligdomOpLaag1(state);

  // Bevries alle willekeurige incidenten (indringers/kuddes/roofdieren) zodat
  // deze lange lus deterministisch blijft — puur voor de leesbaarheid van
  // deze test, niet omdat het mechanisme zelf random-afhankelijk is.
  state = metVasteRandom(0.99, () => {
    let s = state;
    for (let i = 0; i < BELEGERINGSDREMPEL + 1; i++) s = volgendeBeurt(s);
    return s;
  });

  const laag12 = state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!;
  assert.equal(laag12.bezet, false);
  assert.equal(laag12.ontgrendeld, true);
  assert.equal(laag12.tiles.every((t) => !t.verhuld), true, "ook nog niet individueel verkende vakjes zijn nu onthuld");
  assert.equal(laag12.tiles[0].improvement, undefined, "de vijandelijke Wachttoren op positie 0 blijft opgeruimd");
  assert.equal(laag12.tiles[2].improvement?.id, "bezette-laag-huisje");
});

test("Deel 6, uitgebreid (issue: laatste confrontatie tweaken): een nog niet vernietigde vijandelijke Wachttoren houdt de Bezette Laag vergrendeld, ook als alle Heiligdommen al weg zijn", () => {
  let state = metBezetteLaagEnVerkenner();
  state = {
    ...state,
    stad: { ...state.stad, missionarissen: [{ id: "missionaris-0" }] },
    lagen: state.lagen.map((laag) => {
      if (laag.hoogte !== BEZETTE_LAAG_HOOGTE) return laag;
      return {
        ...laag,
        belegeringsVoortgang: BELEGERINGSDREMPEL - 1,
        tiles: laag.tiles.map((tile) =>
          tile.positieInLaag === 1
            ? { ...tile, verhuld: false, status: "actief" as const, improvement: VIJANDELIJK_HEILIGDOM }
            : tile
        ),
      };
    }),
  };
  state = metActiefHeiligdomOpLaag1(state);

  state = metVasteRandom(0.99, () => {
    let s = state;
    for (let i = 0; i < BELEGERINGSDREMPEL + 1; i++) s = volgendeBeurt(s);
    return s;
  });

  const laag12 = state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!;
  assert.equal(laag12.tiles[1].improvement, undefined, "het Heiligdom is wel vernietigd");
  assert.equal(laag12.bezet, true, "de laag blijft bezet: de vijandelijke Wachttoren (positie 0) staat nog");
  assert.equal(laag12.ontgrendeld, false);

  assert.deepEqual(
    bereikbarePosities(state.lagen, { hoogte: 11, positieInLaag: 4 }).find((p) => p.hoogte === 12),
    undefined,
    "de settler kan nog niet naar laag 12 bewegen"
  );
  assert.equal(
    startBouw(state, BEZETTE_LAAG_HOOGTE, WACHTTOREN, 2).lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!.tiles[2]
      .status,
    "leeg",
    "bouwen op de Bezette Laag zelf blijft geblokkeerd (het nog onthulde huisje-vakje blijft ongewijzigd)"
  );
});
