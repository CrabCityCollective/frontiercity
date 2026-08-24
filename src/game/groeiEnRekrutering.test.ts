import test from "node:test";
import assert from "node:assert/strict";
import { rushKostenGoud } from "./bouwwachtrij";
import { CITY_IMPROVEMENT_CAP, cityImprovementCap, maakInitieleSpelStatus, OPSLAG_CAP, volgendeBeurt } from "./economie";
import {
  kanCityVerbeteringBouwen,
  kanTweedeSettlerBouwen,
  startCityVerbetering,
  startGroei,
  startMissionarisRecrutering,
  startNieuweSettler,
  startOpslagplaats,
  startRecrutering,
  startSmederij,
  startTweedeSettler,
  versnelCivielMetGoud,
  versnelOpslagplaatsMetGoud,
  versnelSmederijMetGoud,
} from "./groeiEnRekrutering";
import { heeftOfferAltaar } from "./streekOntgrendeling";
import { bemanWachttoren, berekenLegerwaarde, confrontatieBezetteStreek } from "./militair";
import {
  AQUADUCT,
  BARAKKEN,
  BIBLIOTHEEK,
  GROTE_TEMPEL,
  GROTE_WOONWIJK,
  MARKT,
  SOLDAAT,
  TEMPEL,
  VIJANDELIJKE_WACHTTOREN,
} from "./improvements";
import { GameState } from "./types";
import { STAD_POSITIE, VOEDSEL_DREMPEL_GROEI_GROOT } from "./world";
import {
  HEILIGDOM,
  metBezetteStreekInBeeld,
  metLegerkampOpStreek12,
  metOnthuldeBezetteStreekTile,
  metVasteRandom,
  WACHTTOREN,
} from "./testHelpers";

test("een Opslagplaats verhoogt de opslag-cap met haar effect-waarde na voltooiing", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: 20, steen: 20, erts: 20, goud: 20 } };
  state = startOpslagplaats(state);
  const kosten = state.stad.opslagplaatsInAanbouw!.improvement.kosten;
  const bouwtijd = state.stad.opslagplaatsInAanbouw!.improvement.bouwtijdBeurten;

  for (let i = 0; i < bouwtijd; i++) {
    state = volgendeBeurt(state);
  }

  assert.equal(state.stad.opslagplaatsInAanbouw, undefined);
  assert.equal(state.opslagCap, OPSLAG_CAP + 20);
  // Kosten zijn ook echt betaald.
  for (const [type, bedrag] of Object.entries(kosten)) {
    assert.equal(state.voorraad[type as keyof typeof state.voorraad], 20 - (bedrag ?? 0));
  }
});

test("versnelOpslagplaatsMetGoud koopt de resterende bouwtijd van een Opslagplaats af en verhoogt de opslag-cap meteen", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: 20, steen: 20, erts: 20, goud: 0 } };
  state = startOpslagplaats(state);
  const kosten = rushKostenGoud(
    state.stad.opslagplaatsInAanbouw!.improvement,
    state.stad.opslagplaatsInAanbouw!.voortgang
  );
  state = { ...state, voorraad: { ...state.voorraad, goud: kosten } };

  const naVersnellen = versnelOpslagplaatsMetGoud(state);
  assert.equal(naVersnellen.stad.opslagplaatsInAanbouw, undefined);
  assert.equal(naVersnellen.opslagCap, OPSLAG_CAP + 20);
  assert.equal(naVersnellen.voorraad.goud, 0);
});

test("een Smederij zet 'heeftSmederij' op true na voltooiing, buiten de gecapte stadsverbeteringen-pool om (M21d)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: 20, steen: 20, erts: 20, goud: 20 } };
  state = startSmederij(state);
  const kosten = state.stad.smederijInAanbouw!.improvement.kosten;
  const bouwtijd = state.stad.smederijInAanbouw!.improvement.bouwtijdBeurten;

  for (let i = 0; i < bouwtijd; i++) {
    state = volgendeBeurt(state);
  }

  assert.equal(state.stad.smederijInAanbouw, undefined);
  assert.equal(state.stad.heeftSmederij, true);
  assert.equal(state.stad.cityImprovements.length, 0, "de Smederij telt niet mee in de gecapte pool");
  for (const [type, bedrag] of Object.entries(kosten)) {
    assert.equal(state.voorraad[type as keyof typeof state.voorraad], 20 - (bedrag ?? 0));
  }
});

test("een tweede startSmederij-aanroep heeft geen effect zodra er al een Smederij staat (niet herhaalbaar, anders dan Opslagplaats)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, stad: { ...state.stad, heeftSmederij: true } };
  state = startSmederij(state);
  assert.equal(state.stad.smederijInAanbouw, undefined);
});

test("versnelSmederijMetGoud koopt de resterende bouwtijd van een Smederij af en zet 'heeftSmederij' meteen op true", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: 20, steen: 20, erts: 20, goud: 0 } };
  state = startSmederij(state);
  const kosten = rushKostenGoud(state.stad.smederijInAanbouw!.improvement, state.stad.smederijInAanbouw!.voortgang);
  state = { ...state, voorraad: { ...state.voorraad, goud: kosten } };

  const naVersnellen = versnelSmederijMetGoud(state);
  assert.equal(naVersnellen.stad.smederijInAanbouw, undefined);
  assert.equal(naVersnellen.stad.heeftSmederij, true);
  assert.equal(naVersnellen.voorraad.goud, 0);
});

test("versnelCivielMetGoud heeft geen effect op een Nieuwe settler in aanbouw ('soort: unit', buiten bereik van rush-bouwen)", () => {
  let state = maakInitieleSpelStatus();
  state = startNieuweSettler(state);
  assert.equal(state.stad.civielInAanbouw?.improvement.id, "nieuwe-settler");
  state = { ...state, voorraad: { ...state.voorraad, goud: 1000 } };

  const naVersnellen = versnelCivielMetGoud(state);
  assert.equal(naVersnellen, state, "geen wijziging: rush-bouwen geldt niet voor units");
});

test("heeftOfferAltaar en startMissionarisRecrutering: Missionaris is pas trainbaar na een voltooid Offer Altaar", () => {
  let state = maakInitieleSpelStatus();
  assert.equal(heeftOfferAltaar(state), false);
  assert.equal(startMissionarisRecrutering(state), state, "geen effect zonder Offer Altaar");

  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 2 ? { ...tile, status: "actief" as const, improvement: HEILIGDOM } : tile
            ),
          }
    ),
  };
  // Nog steeds geen Offer Altaar (dit is een gewoon Heiligdom) — nog steeds geen effect.
  assert.equal(startMissionarisRecrutering(state), state);
});

test("een nieuw opgeleide strijder krijgt nooit een id dat al in gebruik is door een nog bemande strijder, ook niet nadat een eerdere strijder verloren is gegaan (issue #242: 'soms lukt wachttoren bemannen niet meer')", () => {
  let state = maakInitieleSpelStatus();
  // Simuleert de situatie ná het verlies van "strijder-1" (bv. via een
  // verloren Confrontatie tegen een Bezette Streek of een indringers-
  // overrompeling, zie militair.ts/indringersEnDieren.ts): de lijst heeft nu
  // een gat, met "strijder-2" nog aanwezig én bemand. Vóór deze fix baseerde
  // de volgende rekrutering haar id op `strijders.length` (hier: 2), wat
  // opnieuw "strijder-2" opleverde — hetzelfde id als de al-bemande strijder.
  state = {
    ...state,
    stad: {
      ...state.stad,
      strijders: [{ id: "strijder-0" }, { id: "strijder-2", wachttoren: { hoogte: 1, positieInStreek: 8 } }],
    },
    voorraad: { hout: 99, steen: 99, erts: 99, goud: 99 },
  };
  state = startRecrutering(state);
  for (let i = 0; i < SOLDAAT.bouwtijdBeurten; i += 1) {
    state = volgendeBeurt({ ...state, voorraad: { hout: 99, steen: 99, erts: 99, goud: 99 } });
  }

  assert.equal(state.stad.strijders.length, 3);
  const nieuweStrijder = state.stad.strijders[2];
  assert.notEqual(nieuweStrijder.id, "strijder-2", "mag niet botsen met de al-bemande strijder");
  assert.equal(nieuweStrijder.wachttoren, undefined, "de nieuwe strijder mag niet 'per ongeluk' al bemand lijken");

  // De nieuwe strijder moet ook daadwerkelijk (een andere) Wachttoren kunnen
  // bemannen — vóór deze fix weigerde `bemanWachttoren` stilzwijgend omdat de
  // `.find` op het gebotste id de al-bemande strijder terugvond.
  state = {
    ...state,
    streken: state.streken.map((streek, idx) =>
      idx !== 0
        ? streek
        : {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 7
                ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true }
                : tile
            ),
          }
    ),
  };
  state = bemanWachttoren(state, nieuweStrijder.id, 1, 7);
  assert.deepEqual(state.stad.strijders[2].wachttoren, { hoogte: 1, positieInStreek: 7 });
});

test("kanCityVerbeteringBouwen respecteert de city-improvement-cap per stadsgrootte (Deel 1)", () => {
  let state = maakInitieleSpelStatus();
  assert.equal(state.stad.grootte, "klein");
  assert.equal(cityImprovementCap("klein"), 1);
  assert.equal(cityImprovementCap("middel"), 3);
  assert.equal(cityImprovementCap("groot"), 5);

  assert.equal(kanCityVerbeteringBouwen(state, BIBLIOTHEEK), true);

  state = startCityVerbetering(state, BIBLIOTHEEK);
  assert.equal(state.stad.cityVerbeteringInAanbouw?.improvement.id, "bibliotheek");
  // Hoogstens één stadsverbetering tegelijk in aanbouw.
  assert.equal(kanCityVerbeteringBouwen(state, MARKT), false);
  assert.equal(startCityVerbetering(state, MARKT), state);

  for (let i = 0; i < BIBLIOTHEEK.bouwtijdBeurten + 1; i += 1) {
    state = volgendeBeurt({ ...state, voorraad: { hout: 99, steen: 99, erts: 99, goud: 99 } });
  }
  assert.deepEqual(
    state.stad.cityImprovements.map((ci) => ci.id),
    ["bibliotheek"]
  );

  // Een kleine stad heeft precies 1 slot — nu vol, dus Markt kan niet starten
  // (Opslagplaats telt bewust niet mee voor deze cap).
  assert.equal(kanCityVerbeteringBouwen(state, MARKT), false);
});

test("stadsgrootte-eis blokkeert Barakken/Tempel/Aquaduct voor een kleine stad en Grote Tempel voor een niet-grote stad (Deel 3, Aquaduct: issue #285)", () => {
  const klein = maakInitieleSpelStatus();
  assert.equal(kanCityVerbeteringBouwen(klein, BARAKKEN), false);
  assert.equal(kanCityVerbeteringBouwen(klein, TEMPEL), false);
  assert.equal(kanCityVerbeteringBouwen(klein, GROTE_TEMPEL), false);
  assert.equal(kanCityVerbeteringBouwen(klein, AQUADUCT), false, "Aquaduct vereist minstens een middelgrote stad");
  assert.equal(kanCityVerbeteringBouwen(klein, BIBLIOTHEEK), true, "Bibliotheek heeft geen stadsgrootte-eis");
  assert.equal(kanCityVerbeteringBouwen(klein, MARKT), true, "Markt heeft geen stadsgrootte-eis");

  const middel: GameState = { ...klein, stad: { ...klein.stad, grootte: "middel" } };
  assert.equal(kanCityVerbeteringBouwen(middel, BARAKKEN), true);
  assert.equal(kanCityVerbeteringBouwen(middel, TEMPEL), true);
  assert.equal(kanCityVerbeteringBouwen(middel, GROTE_TEMPEL), false, "Grote Tempel vereist een grote stad");
  assert.equal(kanCityVerbeteringBouwen(middel, AQUADUCT), true);

  const groot: GameState = { ...klein, stad: { ...klein.stad, grootte: "groot" } };
  assert.equal(kanCityVerbeteringBouwen(groot, GROTE_TEMPEL), true);
});

test("Tempel en Grote Tempel tellen als twee losse sloten en hun cultuurproductie is cumulatief (Deel 3)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, stad: { ...state.stad, grootte: "groot", cityImprovements: [TEMPEL, GROTE_TEMPEL] } };
  assert.equal(kanCityVerbeteringBouwen(state, TEMPEL), false, "Tempel is al gebouwd");
  assert.equal(kanCityVerbeteringBouwen(state, GROTE_TEMPEL), false, "Grote Tempel is al gebouwd");

  const voor = state.cultuur;
  state = volgendeBeurt(state);
  assert.equal(
    state.cultuur,
    voor + (TEMPEL.effect.waarde ?? 0) + (GROTE_TEMPEL.effect.waarde ?? 0),
    "Tempel (+5) en Grote Tempel (+10) leveren samen +15 cultuur/beurt op, zonder frontier-halvering"
  );
});

test("Bibliotheek en Markt produceren automatisch zodra ze gebouwd zijn, zonder wegverbinding nodig (Deel 3)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, stad: { ...state.stad, cityImprovements: [BIBLIOTHEEK] } };
  state = volgendeBeurt(state);
  assert.equal(state.wetenschap, BIBLIOTHEEK.effect.waarde);

  let middelStaat = maakInitieleSpelStatus();
  middelStaat = {
    ...middelStaat,
    stad: { ...middelStaat.stad, grootte: "middel", cityImprovements: [MARKT] },
  };
  const goudVoor = middelStaat.voorraad.goud;
  middelStaat = volgendeBeurt(middelStaat);
  assert.equal(middelStaat.voorraad.goud, goudVoor + (MARKT.effect.waarde ?? 0));
});

test("Barakken levert een vaste, stad-brede legerwaarde-bonus die meetelt bij zowel de gewone Confrontatie als de Confrontatie tegen een Bezette Streek (Deel 3)", () => {
  let state = maakInitieleSpelStatus();
  const zonderBarakken = berekenLegerwaarde(state);

  state = { ...state, stad: { ...state.stad, cityImprovements: [BARAKKEN] } };
  assert.equal(berekenLegerwaarde(state), zonderBarakken + (BARAKKEN.effect.waarde ?? 0));

  // Ook meetellen in de Bezette-Streek-Confrontatie: de Barakken-bonus telt op
  // bovenop de (hier lege) Legerkamp-legerwaarde.
  let bezetteStreekStaat = metBezetteStreekInBeeld();
  bezetteStreekStaat = metOnthuldeBezetteStreekTile(bezetteStreekStaat, 0, VIJANDELIJKE_WACHTTOREN);
  bezetteStreekStaat = metLegerkampOpStreek12(bezetteStreekStaat);
  bezetteStreekStaat = { ...bezetteStreekStaat, stad: { ...bezetteStreekStaat.stad, cityImprovements: [BARAKKEN] } };
  const resultaat = metVasteRandom(0, () => confrontatieBezetteStreek(bezetteStreekStaat, 0));
  assert.equal(resultaat.laatsteConfrontatieBezetteStreek?.eigenLegerwaarde, BARAKKEN.effect.waarde ?? 0);
});

// Ontgrendelt streek `hoogte` (en alle streken eronder, zoals de echte
// cultuur-ontgrendeling ook altijd doet) — gedeelde opzet voor de
// tweede-settler-tests hieronder, die pas vanaf streek 7 beschikbaar is.
function metOntgrendeldeStreek(state: GameState, hoogte: number): GameState {
  return {
    ...state,
    streken: state.streken.map((streek) => (streek.hoogte <= hoogte ? { ...streek, ontgrendeld: true } : streek)),
  };
}

test("kanTweedeSettlerBouwen is false vóór streek 7, ook mét een bestaande eerste settler (issue: 'Altijd 2e settler' #236)", () => {
  let state = maakInitieleSpelStatus();
  state = metOntgrendeldeStreek(state, 6);
  state = { ...state, settler: { hoogte: 1, positieInStreek: 4 } };
  assert.equal(kanTweedeSettlerBouwen(state), false);
  assert.equal(startTweedeSettler(state), state, "geen effect vóór streek 7");
});

test("de tweede-settler-wachtrij is beschikbaar vanaf streek 7, permanent herbouwbaar, en onafhankelijk van civielInAanbouw (issue #236)", () => {
  let state = maakInitieleSpelStatus();
  state = metOntgrendeldeStreek(state, 7);
  assert.equal(kanTweedeSettlerBouwen(state), true);

  // Onafhankelijk van de gedeelde civiele wachtrij (groei/eerste settler):
  // beide lopen tegelijk zonder elkaar te blokkeren.
  state = startNieuweSettler(state);
  assert.equal(state.stad.civielInAanbouw?.improvement.id, "nieuwe-settler");
  assert.equal(kanTweedeSettlerBouwen(state), true, "tweede-settler-wachtrij blokkeert niet door civielInAanbouw");

  state = startTweedeSettler(state);
  assert.equal(state.stad.tweedeSettlerInAanbouw?.improvement.id, "nieuwe-settler");
  assert.equal(kanTweedeSettlerBouwen(state), false, "al één in aanbouw");
  assert.equal(startTweedeSettler(state), state, "geen tweede aanroep terwijl er al één in aanbouw is");

  const bouwtijd = state.stad.tweedeSettlerInAanbouw!.improvement.bouwtijdBeurten;
  for (let i = 0; i < bouwtijd; i += 1) {
    state = volgendeBeurt({ ...state, voorraad: { hout: 99, steen: 99, erts: 99, goud: 99 } });
  }
  assert.equal(state.stad.tweedeSettlerInAanbouw, undefined);
  assert.deepEqual(state.tweedeSettler, { hoogte: 1, positieInStreek: STAD_POSITIE });
  // De eerste settler bestaat intussen ook al (los van de tweede) — beide
  // tegelijk actief, zoals bedoeld.
  assert.notEqual(state.settler, undefined);

  // Permanent herbouwbaar (niet eenmalig): zodra de tweede settler verloren
  // gaat, kan de wachtrij meteen weer gestart worden.
  state = { ...state, tweedeSettler: undefined };
  assert.equal(kanTweedeSettlerBouwen(state), true, "de tweede-settler-wachtrij is opnieuw beschikbaar na verlies");
});

test("startGroei kiest Grote Woonwijk (middel→groot) met de hogere voedseldrempel zodra de stad al middel is (Deel 2)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, stad: { ...state.stad, grootte: "middel" }, voedsel: VOEDSEL_DREMPEL_GROEI_GROOT - 1 };
  assert.equal(startGroei(state), state, "onder de drempel: geen effect");

  state = { ...state, voedsel: VOEDSEL_DREMPEL_GROEI_GROOT };
  state = startGroei(state);
  assert.equal(state.stad.civielInAanbouw?.improvement.id, "grote-woonwijk");

  for (let i = 0; i < GROTE_WOONWIJK.bouwtijdBeurten + 1; i += 1) {
    state = volgendeBeurt({ ...state, voorraad: { hout: 99, steen: 99, erts: 99, goud: 99 } });
  }
  assert.equal(state.stad.grootte, "groot");
  assert.equal(state.stad.civielInAanbouw, undefined);
  // Deel 1: de cap gaat automatisch mee omhoog met de nieuwe stadsgrootte.
  assert.equal(cityImprovementCap(state.stad.grootte), CITY_IMPROVEMENT_CAP.groot);
});

test("een gebouwd Aquaduct verlaagt de voedseldrempel voor groei naar Groot (issue #285)", () => {
  const verlaagdeDrempel = VOEDSEL_DREMPEL_GROEI_GROOT - (AQUADUCT.effect.waarde ?? 0);
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    stad: { ...state.stad, grootte: "middel", cityImprovements: [AQUADUCT] },
    voedsel: verlaagdeDrempel - 1,
  };
  assert.equal(startGroei(state), state, "nog onder de verlaagde drempel: geen effect");

  state = { ...state, voedsel: verlaagdeDrempel };
  // De volledige, niet-verlaagde drempel is met dit voedsel nog niet gehaald
  // — de verlaging moet dus daadwerkelijk het verschil maken.
  assert.ok(verlaagdeDrempel < VOEDSEL_DREMPEL_GROEI_GROOT);
  state = startGroei(state);
  assert.equal(state.stad.civielInAanbouw?.improvement.id, "grote-woonwijk");
});
