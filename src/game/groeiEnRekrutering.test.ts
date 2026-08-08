import test from "node:test";
import assert from "node:assert/strict";
import { rushKostenGoud } from "./bouwwachtrij";
import { CITY_IMPROVEMENT_CAP, cityImprovementCap, maakInitieleSpelStatus, OPSLAG_CAP, volgendeBeurt } from "./economie";
import {
  kanCityVerbeteringBouwen,
  startCityVerbetering,
  startGroei,
  startMissionarisRecrutering,
  startNieuweSettler,
  startOpslagplaats,
  startVerkennerRecrutering,
  versnelCivielMetGoud,
  versnelOpslagplaatsMetGoud,
} from "./groeiEnRekrutering";
import { heeftOfferAltaar, verken } from "./laagOntgrendeling";
import { berekenLegerwaarde, confrontatieBezetteLaag } from "./militair";
import { BARAKKEN, BIBLIOTHEEK, GROTE_TEMPEL, GROTE_WOONWIJK, MARKT, TEMPEL } from "./improvements";
import { GameState } from "./types";
import { VOEDSEL_DREMPEL_GROEI_GROOT } from "./world";
import {
  HEILIGDOM,
  metBeschermendeWachttorenOpLaag11,
  metBezetteLaagEnVerkenner,
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
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 2 ? { ...tile, status: "actief" as const, improvement: HEILIGDOM } : tile
            ),
          }
    ),
  };
  // Nog steeds geen Offer Altaar (dit is een gewoon Heiligdom) — nog steeds geen effect.
  assert.equal(startMissionarisRecrutering(state), state);
});

test("Verkenner is direct trainbaar (geen vereiste), en levert na de bouwtijd een inzetbare eenheid op", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, voorraad: { hout: 20, steen: 20, erts: 20, goud: 20 } };
  state = startVerkennerRecrutering(state);
  assert.equal(state.stad.verkennerInAanbouw?.improvement.id, "verkenner");
  const bouwtijd = state.stad.verkennerInAanbouw!.improvement.bouwtijdBeurten;

  for (let i = 0; i < bouwtijd; i++) {
    state = volgendeBeurt(state);
  }
  assert.equal(state.stad.verkennerInAanbouw, undefined);
  assert.equal(state.stad.verkenners.length, 1);
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

test("stadsgrootte-eis blokkeert Barakken/Tempel voor een kleine stad en Grote Tempel voor een niet-grote stad (Deel 3)", () => {
  const klein = maakInitieleSpelStatus();
  assert.equal(kanCityVerbeteringBouwen(klein, BARAKKEN), false);
  assert.equal(kanCityVerbeteringBouwen(klein, TEMPEL), false);
  assert.equal(kanCityVerbeteringBouwen(klein, GROTE_TEMPEL), false);
  assert.equal(kanCityVerbeteringBouwen(klein, BIBLIOTHEEK), true, "Bibliotheek heeft geen stadsgrootte-eis");
  assert.equal(kanCityVerbeteringBouwen(klein, MARKT), true, "Markt heeft geen stadsgrootte-eis");

  const middel: GameState = { ...klein, stad: { ...klein.stad, grootte: "middel" } };
  assert.equal(kanCityVerbeteringBouwen(middel, BARAKKEN), true);
  assert.equal(kanCityVerbeteringBouwen(middel, TEMPEL), true);
  assert.equal(kanCityVerbeteringBouwen(middel, GROTE_TEMPEL), false, "Grote Tempel vereist een grote stad");

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

test("Barakken levert een vaste, stad-brede legerwaarde-bonus die meetelt bij zowel de gewone Confrontatie als de Confrontatie tegen een Bezette Laag (Deel 3)", () => {
  let state = maakInitieleSpelStatus();
  const zonderBarakken = berekenLegerwaarde(state);

  state = { ...state, stad: { ...state.stad, cityImprovements: [BARAKKEN] } };
  assert.equal(berekenLegerwaarde(state), zonderBarakken + (BARAKKEN.effect.waarde ?? 0));

  // Ook meetellen in de Bezette-Laag-Confrontatie: een geforceerde winst
  // (winkans 100%) is alleen te garanderen als de Barakken-bonus daadwerkelijk
  // meetelt in de eigen legerwaarde tegenover een fors dreigingsniveau.
  let bezetteLaagStaat = metBezetteLaagEnVerkenner();
  bezetteLaagStaat = verken(bezetteLaagStaat, 0);
  bezetteLaagStaat = metBeschermendeWachttorenOpLaag11(bezetteLaagStaat);
  bezetteLaagStaat = { ...bezetteLaagStaat, stad: { ...bezetteLaagStaat.stad, cityImprovements: [BARAKKEN] } };
  const resultaat = metVasteRandom(0, () => confrontatieBezetteLaag(bezetteLaagStaat, 0));
  assert.equal(
    resultaat.laatsteConfrontatieBezetteLaag?.eigenLegerwaarde,
    (WACHTTOREN.effect.waarde ?? 0) + (BARAKKEN.effect.waarde ?? 0)
  );
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
