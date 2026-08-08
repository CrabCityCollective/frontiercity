import test from "node:test";
import assert from "node:assert/strict";
import {
  hakHout,
  heeftGenoegVoorStichten,
  jaag,
  kanStichten,
  STICHTING_KOSTEN,
  stichtStad,
  verplaatsSettlerNaar,
} from "./acties";
import {
  bouwStagneertVolgendeBeurt,
  resterendeBouwBeurten,
  RUSH_GOUD_PER_BEURT,
  rushKostenGoud,
  versnelBouwMetGoud,
} from "./bouwwachtrij";
import {
  beurtMagAutomatischDoorgaan,
  cityImprovementCap,
  CITY_IMPROVEMENT_CAP,
  maakInitieleSpelStatus,
  OPSLAG_CAP,
  volgendeBeurt,
} from "./economie";
import {
  kanCityVerbeteringBouwen,
  startCityVerbetering,
  startGroei,
  startMissionarisRecrutering,
  startNieuweSettler,
  startOpslagplaats,
  startRecrutering,
  startVerkennerRecrutering,
  versnelCityVerbeteringMetGoud,
  versnelCivielMetGoud,
  versnelOpslagplaatsMetGoud,
} from "./groeiEnRekrutering";
import { infrastructuurVoortgang, sluitBouwKeuze, startBouw } from "./infrastructuurEnBouw";
import {
  bevestigAmberOnderVuur,
  bevestigGedwongenTribuut,
  geefTribuut,
  kiesGeefTribuut,
  weigerTribuut,
} from "./indringersEnDieren";
import {
  BELEGERINGSDREMPEL,
  heeftOfferAltaar,
  kanVerkennen,
  sluitAmberOntdektMelding,
  sluitTweedeAmberOntdektMelding,
  verken,
  VERKENNING_KOSTEN_WETENSCHAP,
} from "./laagOntgrendeling";
import {
  bemanLegerkamp,
  bemanWachttoren,
  berekenLegerkampLegerwaarde,
  berekenLegerwaarde,
  confrontatieBezetteLaag,
  haalStrijderTerug,
  kanConfrontatieBezetteLaag,
  onbemandeLegerkampPosities,
  onbemandeWachttorenPosities,
  vijandelijkeWachttorenPosities,
} from "./militair";
import { kiesTech } from "./tech";
import {
  AMBERADER,
  BARAKKEN,
  BIBLIOTHEEK,
  CULTUREEL_LAND_IMPROVEMENTS,
  ECONOMISCH_LAND_IMPROVEMENTS,
  GROTE_TEMPEL,
  GROTE_WOONWIJK,
  MARKT,
  MILITAIR_LAND_IMPROVEMENTS,
  SOLDAAT,
  STERRENCIRKEL,
  TEMPEL,
  VIJANDELIJK_HEILIGDOM,
} from "./improvements";
import { wetenschapKostenVoorDrempel } from "./techTree";
import { GameState, Improvement } from "./types";
import {
  AMBER_ONTDEKKING_LAAG,
  AMBER_ONTDEKKING_LAAG_2,
  BEZETTE_LAAG_HOOGTE,
  cultuurKostenVoorLaag,
  VOEDSEL_DREMPEL_GROEI_GROOT,
} from "./world";

// Vervangt `Math.random` tijdelijk door een vaste waarde, zodat de
// kans-gedreven roofdier-/kuddelogica deterministisch te testen is — altijd
// hersteld in een `finally` zodat een falende assertie andere tests niet kan
// laten meeliften op een gemanipuleerde random.
function metVasteRandom<T>(waarde: number, fn: () => T): T {
  const origineel = Math.random;
  Math.random = () => waarde;
  try {
    return fn();
  } finally {
    Math.random = origineel;
  }
}

// Zelfde opzet als `metVasteRandom` hierboven, maar met een eigen waarde per
// opeenvolgende `Math.random()`-aanroep — nodig om de kans-trekking (is er
// een incident?) los te zetten van de daaropvolgende laag-trekking (welke
// laag?). Extra aanroepen voorbij `waarden` hergebruiken de laatste waarde.
function metRandomReeks<T>(waarden: number[], fn: () => T): T {
  const origineel = Math.random;
  let i = 0;
  Math.random = () => waarden[Math.min(i++, waarden.length - 1)];
  try {
    return fn();
  } finally {
    Math.random = origineel;
  }
}

const HOUTKAP = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "houtkap")!;
const MIJN = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "mijn")!;
const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;
const WACHTTOREN = MILITAIR_LAND_IMPROVEMENTS.find((i) => i.id === "wachttoren")!;
const LEGERKAMP = MILITAIR_LAND_IMPROVEMENTS.find((i) => i.id === "legerkamp")!;
const HEILIGDOM = CULTUREEL_LAND_IMPROVEMENTS.find((i) => i.id === "heiligdom")!;
const OFFER_ALTAAR = CULTUREEL_LAND_IMPROVEMENTS.find((i) => i.id === "offer-altaar")!;

// Bouwt een startstatus met een Houtkap (positie 2), Mijn (positie 6) en
// Boerderij (positie 0) al actief en wegverbonden met de stad (positie 4),
// zodat een test zich puur kan richten op productie/rekrutering zonder de
// settler/wegen-mechniek erbij te betrekken.
function metWerkendeEconomie(): GameState {
  const state = maakInitieleSpelStatus();
  return {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 2) {
                return { ...tile, status: "actief" as const, improvement: HOUTKAP, heeftWeg: true, beurtenTotUitputting: HOUTKAP.uitputtingBeurten };
              }
              if (tile.positieInLaag === 6) {
                return { ...tile, status: "actief" as const, improvement: MIJN, heeftWeg: true, beurtenTotUitputting: MIJN.uitputtingBeurten };
              }
              if (tile.positieInLaag === 0) {
                return { ...tile, status: "actief" as const, improvement: BOERDERIJ, heeftWeg: true, beurtenTotUitputting: BOERDERIJ.uitputtingBeurten };
              }
              if ([1, 3, 5].includes(tile.positieInLaag)) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };
}

test("een soldaat in opleiding is na SOLDAAT.bouwtijdBeurten beurten een inzetbare strijder", () => {
  let state = metWerkendeEconomie();
  state = startRecrutering(state);
  assert.equal(state.stad.legerInAanbouw?.improvement.id, "soldaat");
  assert.equal(
    resterendeBouwBeurten(state.stad.legerInAanbouw!.improvement, state.stad.legerInAanbouw!.voortgang),
    SOLDAAT.bouwtijdBeurten
  );

  for (let i = 0; i < SOLDAAT.bouwtijdBeurten; i++) {
    assert.equal(state.stad.strijders.length, 0, `mag pas na ${SOLDAAT.bouwtijdBeurten} beurten klaar zijn`);
    state = volgendeBeurt(state);
  }

  assert.equal(state.stad.legerInAanbouw, undefined);
  assert.equal(state.stad.strijders.length, 1);

  // De voltooide strijder moet ook echt een wachttoren kunnen bemannen.
  state = {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 8 ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true } : tile
            ),
          }
    ),
  };
  const strijderId = state.stad.strijders[0].id;
  state = bemanWachttoren(state, strijderId, 1, 8);
  assert.deepEqual(state.stad.strijders[0].wachttoren, { hoogte: 1, positieInLaag: 8 });
});

test("haalStrijderTerug maakt een strijder meteen weer inzetbaar op een andere wachttoren, zonder beurten te wachten (issue: wachttoren tweaks)", () => {
  let state = metWerkendeEconomie();
  state = {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 7 || tile.positieInLaag === 8
                ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true }
                : tile
            ),
          }
    ),
  };
  state = startRecrutering(state);
  for (let i = 0; i < SOLDAAT.bouwtijdBeurten; i++) state = volgendeBeurt(state);
  const strijderId = state.stad.strijders[0].id;

  state = bemanWachttoren(state, strijderId, 1, 8);
  state = haalStrijderTerug(state, strijderId);
  assert.equal(state.stad.strijders[0].wachttoren, undefined);

  // Geen tussenliggende beurt nodig: meteen op een andere wachttoren zetten
  // moet meteen lukken.
  state = bemanWachttoren(state, strijderId, 1, 7);
  assert.deepEqual(state.stad.strijders[0].wachttoren, { hoogte: 1, positieInLaag: 7 });
});

test("onbemandeWachttorenPosities geeft alleen actieve, nog niet-bemande wachttorens terug", () => {
  let state = metWerkendeEconomie();
  state = {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 7 || tile.positieInLaag === 8) {
                return { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };

  // Vóór er een strijder is, moeten beide gebouwde wachttorens als onbemand
  // (dus beschikbaar) gelden.
  assert.deepEqual(
    onbemandeWachttorenPosities(state).sort((a, b) => a.positieInLaag - b.positieInLaag),
    [
      { hoogte: 1, positieInLaag: 7 },
      { hoogte: 1, positieInLaag: 8 },
    ]
  );

  state = startRecrutering(state);
  for (let i = 0; i < SOLDAAT.bouwtijdBeurten; i++) state = volgendeBeurt(state);
  const strijderId = state.stad.strijders[0].id;
  state = bemanWachttoren(state, strijderId, 1, 8);

  // Zodra positie 8 bemand is, blijft alleen positie 7 nog beschikbaar —
  // precies de lijst die de kaart-highlight (issue: "de wachttorens die
  // beschikbaar zijn dan allemaal worden gehighlight") en de klik-validatie
  // in GameRoot gebruiken.
  assert.deepEqual(onbemandeWachttorenPosities(state), [{ hoogte: 1, positieInLaag: 7 }]);
});

test("een tijdelijk tekort aan één grondstof blokkeert niet de voortgang op een andere", () => {
  let state = maakInitieleSpelStatus();
  // Genoeg hout, geen erts: vóór de fix bevroor dit de hele teller op de
  // volle starttijd, ook voor het hout-aandeel dat wél betaalbaar was.
  state = { ...state, voorraad: { ...state.voorraad, hout: 10, erts: 0 } };
  state = startRecrutering(state);

  const voorVoortgang = state.stad.legerInAanbouw!.voortgang;
  state = volgendeBeurt(state);
  const naVoortgang = state.stad.legerInAanbouw!.voortgang;

  assert.equal(naVoortgang.hout, 0, "het hout-aandeel had al betaald moeten zijn");
  assert.equal(voorVoortgang.erts, naVoortgang.erts, "het erts-aandeel blijft terecht stokken zonder voorraad");

  // Zodra er erts binnenkomt, maakt de opleiding alsnog af (nog twee beurten:
  // het erts-aandeel is nog geen cent betaald).
  state = { ...state, voorraad: { ...state.voorraad, erts: 10 } };
  state = volgendeBeurt(state);
  state = volgendeBeurt(state);
  assert.equal(state.stad.legerInAanbouw, undefined);
  assert.equal(state.stad.strijders.length, 1);
});

test("bouwStagneertVolgendeBeurt is alleen true als geen enkel resterend grondstoftype volgende beurt betaald kan worden", () => {
  let state = maakInitieleSpelStatus();
  // Genoeg hout, geen erts: het hout-aandeel kan nog wel betaald worden, dus
  // stokt de opleiding als geheel nog niet.
  state = { ...state, voorraad: { ...state.voorraad, hout: 10, erts: 0 } };
  state = startRecrutering(state);
  const voortgang = state.stad.legerInAanbouw!.voortgang;

  assert.equal(bouwStagneertVolgendeBeurt(SOLDAAT, voortgang, state.voorraad), false);

  // Nu ook geen hout meer: geen enkel resterend grondstoftype is nog
  // betaalbaar, dus stokt de opleiding volledig.
  const zonderVoorraad = { ...state.voorraad, hout: 0 };
  assert.equal(bouwStagneertVolgendeBeurt(SOLDAAT, voortgang, zonderVoorraad), true);
});

test("de opslag-cap geldt per grondstof, niet als gezamenlijke som (basis van de STICHTING_KOSTEN-doorrekening)", () => {
  let state = maakInitieleSpelStatus();
  // Hout en steen zitten al op de cap; erts staat op 0. Als de cap gedeeld
  // was (som van alle vier), zou hout/steen-productie hier geblokkeerd
  // moeten zijn — met een cap per grondstof heeft dat geen invloed op erts.
  state = {
    ...state,
    voorraad: { hout: OPSLAG_CAP, steen: OPSLAG_CAP, erts: 0, goud: 0 },
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 6) {
                return { ...tile, status: "actief" as const, improvement: MIJN, heeftWeg: true, beurtenTotUitputting: MIJN.uitputtingBeurten };
              }
              if (tile.positieInLaag === 5) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };

  state = volgendeBeurt(state);

  assert.equal(state.voorraad.hout, OPSLAG_CAP, "hout blijft op de cap, produceert niets deze beurt");
  assert.equal(state.voorraad.steen, OPSLAG_CAP, "steen blijft op de cap, produceert niets deze beurt");
  assert.equal(state.voorraad.erts, MIJN.effect.waarde, "erts is onafhankelijk van de (volle) hout/steen-cap");
});

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

test("stichtStad vereist een geschikte locatie én genoeg grondstoffen, en verbruikt daarna de settler", () => {
  let state = maakInitieleSpelStatus();
  // Laag 13, positie 5 is in world.ts vastgelegd als het (enige) vers-water-
  // vakje van de tutorial (TUTORIAL_VERS_WATER) — de settler moet er wel
  // eerst kunnen staan, dus die laag moet ontgrendeld zijn.
  state = {
    ...state,
    settler: { hoogte: 13, positieInLaag: 5 },
    lagen: state.lagen.map((laag) => (laag.hoogte === 13 ? { ...laag, ontgrendeld: true } : laag)),
  };

  assert.equal(kanStichten(state), true, "een leeg, vers-water-vakje met de settler erop is een geldig doel");
  assert.equal(heeftGenoegVoorStichten(state), false, "de startvoorraad is niet genoeg om te stichten");
  assert.equal(stichtStad(state), state, "stichtStad heeft geen effect zolang de kosten niet betaald kunnen worden");

  state = {
    ...state,
    voorraad: { ...state.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  assert.equal(heeftGenoegVoorStichten(state), true);

  const naStichten = stichtStad(state);
  assert.equal(naStichten.settler, undefined, "de settler verdwijnt bij het stichten");
  assert.equal(naStichten.stadGesticht, true);
  assert.equal(naStichten.voorraad.hout, 0);
  assert.equal(naStichten.voorraad.steen, 0);
  assert.equal(naStichten.voorraad.erts, 0);
  assert.equal(naStichten.voedsel, 0);

  const gestichteTile = naStichten.lagen.find((l) => l.hoogte === 13)!.tiles[5];
  assert.equal(gestichteTile.status, "actief");
  assert.equal(gestichteTile.improvement?.soort, "city");

  // Geen automatische nieuwe settler meer via het bestaande "settler
  // verschijnt bij beurt 2"-vangnet, ook niet een aantal beurten later.
  const naVolgendeBeurt = volgendeBeurt(naStichten);
  assert.equal(naVolgendeBeurt.settler, undefined);
});

test("kanStichten is false op een vakje zonder vers water, of als het vakje al bebouwd is", () => {
  let state = maakInitieleSpelStatus();
  // Startlaag/positie (STAD_POSITIE) heeft geen vers water in de tutorial-data.
  state = { ...state, settler: { hoogte: 1, positieInLaag: 0 } };
  assert.equal(kanStichten(state), false);

  state = {
    ...state,
    settler: { hoogte: 13, positieInLaag: 5 },
    lagen: state.lagen.map((laag) =>
      laag.hoogte === 13
        ? {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 5 ? { ...tile, status: "actief" as const, improvement: HOUTKAP } : tile
            ),
          }
        : laag
    ),
  };
  assert.equal(kanStichten(state), false, "een al bebouwd vakje is geen geldig stichtingsdoel, ook al ligt het aan water");
});

test("beurtMagAutomatischDoorgaan: vóór beurt 2 (nog geen settler) telt alleen de bouwkeuze van beurt 1 mee (issue: beurt button helemaal weg)", () => {
  const state = maakInitieleSpelStatus();
  assert.equal(state.settler, undefined);
  assert.equal(beurtMagAutomatischDoorgaan(state), false, "de bouwkeuze van beurt 1 staat nog open");

  const naBouwkeuze = { ...state, bouwKeuzeGedaanDitBeurt: true };
  assert.equal(beurtMagAutomatischDoorgaan(naBouwkeuze), true);
});

test("beurtMagAutomatischDoorgaan: vanaf beurt 2 gaat de beurt pas automatisch door zodra de settler zijn actie heeft gebruikt", () => {
  let state = maakInitieleSpelStatus();
  // Bouwkeuze van beurt 1 alvast afgehandeld, zodat beurt 2 zelf geen
  // bouwmoment meer is (hoofdstuk 16: om de 3 beurten) en alleen de
  // settler-actie deze test bepaalt.
  state = sluitBouwKeuze(state);
  state = volgendeBeurt(state);
  assert.ok(state.settler, "de settler is verschenen zodra beurt 2 begint");
  assert.equal(beurtMagAutomatischDoorgaan(state), false, "de settler heeft deze beurt nog niets gedaan");

  const naVerplaatsing = verplaatsSettlerNaar(state, state.settler!.hoogte, state.settler!.positieInLaag + 1);
  assert.equal(naVerplaatsing.settlerActieGedaanDitBeurt, true);
  assert.equal(beurtMagAutomatischDoorgaan(naVerplaatsing), true);
});

test("beurtMagAutomatischDoorgaan: op een bouwmoment moet zowel de settler-actie als de bouwkeuze gebruikt zijn", () => {
  let state = maakInitieleSpelStatus();
  state = volgendeBeurt(state);
  assert.ok(state.beurt >= (state.volgendeBouwBeurt ?? 1), "beurt 2 is (net als beurt 1) een bouwmoment");

  const naSettlerActie = verplaatsSettlerNaar(state, state.settler!.hoogte, state.settler!.positieInLaag + 1);
  assert.equal(
    beurtMagAutomatischDoorgaan(naSettlerActie),
    false,
    "de bouwkeuze staat nog open, de settler-actie alleen is niet genoeg"
  );

  const naBeide = { ...naSettlerActie, bouwKeuzeGedaanDitBeurt: true };
  assert.equal(beurtMagAutomatischDoorgaan(naBeide), true);
});

// Bouwt een status met de settler op een kudde-vakje van de opgegeven laag
// (ontgrendeld, indien nodig) — gedeelde opzet voor de roofdier-tests
// hieronder.
function metSettlerOpKuddeVakje(hoogte: number, positieInLaag = 0): GameState {
  const state = maakInitieleSpelStatus();
  return {
    ...state,
    settler: { hoogte, positieInLaag },
    lagen: state.lagen.map((laag) =>
      laag.hoogte === hoogte
        ? {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === positieInLaag ? { ...tile, kudde: { beurtenResterend: 4 } } : tile
            ),
          }
        : laag
    ),
  };
}

test("jaag roept nooit een roofdier op onder laag 5, ook niet bij een gunstige worp", () => {
  const state = metSettlerOpKuddeVakje(4);
  const naJacht = metVasteRandom(0, () => jaag(state));

  assert.equal(naJacht.roofdierEvent, undefined);
  const tile = naJacht.lagen.find((l) => l.hoogte === 4)!.tiles[0];
  assert.equal(tile.roofdier, undefined);
});

test("jaag roept vanaf laag 5 een roofdier op als de worp binnen de kans valt", () => {
  const state = metSettlerOpKuddeVakje(5);
  const naJacht = metVasteRandom(0, () => jaag(state));

  assert.deepEqual(naJacht.roofdierEvent, { hoogte: 5, positieInLaag: 0, fase: "verschenen" });
  const tile = naJacht.lagen.find((l) => l.hoogte === 5)!.tiles[0];
  assert.deepEqual(tile.roofdier, { beurtenTotAanval: 1 });
});

test("jaag roept geen roofdier op bij een ongunstige worp", () => {
  const state = metSettlerOpKuddeVakje(5);
  const naJacht = metVasteRandom(0.99, () => jaag(state));

  assert.equal(naJacht.roofdierEvent, undefined);
  const tile = naJacht.lagen.find((l) => l.hoogte === 5)!.tiles[0];
  assert.equal(tile.roofdier, undefined);
});

test("een roofdier valt pas de beurt ná verschijnen aan, en doodt de settler als die er dan nog op staat", () => {
  let state = metSettlerOpKuddeVakje(5);
  state = metVasteRandom(0, () => jaag(state));
  assert.deepEqual(state.lagen.find((l) => l.hoogte === 5)!.tiles[0].roofdier, { beurtenTotAanval: 1 });

  // Eerste beurtovergang: de reactietijd, geen aanval.
  state = volgendeBeurt(state);
  assert.notEqual(state.settler, undefined, "de settler overleeft de eerste beurtovergang (reactietijd)");
  assert.deepEqual(state.lagen.find((l) => l.hoogte === 5)!.tiles[0].roofdier, { beurtenTotAanval: 0 });

  // Tweede beurtovergang: de settler is niet weggegaan, dus de aanval slaat toe.
  state = volgendeBeurt(state);
  assert.equal(state.settler, undefined, "de settler sterft als hij op het roofdier-vakje bleef staan");
  assert.equal(state.settlerVerlorenAanRoofdier, true);
  assert.deepEqual(state.roofdierEvent, { hoogte: 5, positieInLaag: 0, fase: "aanval" });
  assert.equal(state.lagen.find((l) => l.hoogte === 5)!.tiles[0].roofdier, undefined);
});

test("de settler overleeft een roofdier als hij op tijd wegbeweegt", () => {
  let state = metSettlerOpKuddeVakje(5);
  state = metVasteRandom(0, () => jaag(state));

  state = volgendeBeurt(state); // reactietijd
  state = verplaatsSettlerNaar(state, 5, 1);
  assert.deepEqual(state.settler, { hoogte: 5, positieInLaag: 1 }, "de settler moet daadwerkelijk verplaatst zijn");

  state = volgendeBeurt(state); // de aanval, maar de settler staat er niet meer
  assert.deepEqual(state.settler, { hoogte: 5, positieInLaag: 1 }, "de settler overleeft");
  assert.equal(state.settlerVerlorenAanRoofdier, undefined);
  assert.equal(state.lagen.find((l) => l.hoogte === 5)!.tiles[0].roofdier, undefined);
});

test("na het verlies van de settler aan een roofdier komt hij niet gratis terug, maar wel via de civiele pool", () => {
  let state = metSettlerOpKuddeVakje(5);
  state = metVasteRandom(0, () => jaag(state));
  state = volgendeBeurt(state); // reactietijd
  state = volgendeBeurt(state); // de aanval doodt de settler

  assert.equal(state.settler, undefined);

  // Zonder de `settlerVerlorenAanRoofdier`-bescherming zou het bestaande
  // "settler verschijnt bij beurt 2"-vangnet hem hier gratis laten terugkeren.
  state = volgendeBeurt(state);
  assert.equal(state.settler, undefined, "geen gratis automatische settler na verlies aan een roofdier");

  // De civiele improvement-pool moet 'm wel weer aanbieden (hoofdstuk 17:
  // "dezelfde regel ... verschijnt de huifkar weer als optie").
  state = startNieuweSettler(state);
  assert.equal(state.stad.civielInAanbouw?.improvement.id, "nieuwe-settler");
});

test("verwerkKuddes meldt een nieuwe kudde via kuddeEvent", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    lagen: state.lagen.map((laag) => (laag.hoogte === 4 ? { ...laag, ontgrendeld: true } : laag)),
  };

  state = metVasteRandom(0, () => volgendeBeurt(state));

  assert.notEqual(state.kuddeEvent, undefined, "een gunstige worp op een ontgrendelde laag 4 moet een kudde melden");
  const gemeldeLaag = state.lagen.find((l) => l.hoogte === state.kuddeEvent!.hoogte)!;
  const tile = gemeldeLaag.tiles[state.kuddeEvent!.positieInLaag];
  assert.deepEqual(tile.kudde, { beurtenResterend: 4 });
});

// Bouwt een startstatus met een actieve, wegverbonden Sterrencirkel op de
// frontier-laag (laag 1) — gedeelde opzet voor de technologie-boom-tests
// hieronder, zelfde patroon als `metWerkendeEconomie` hierboven.
function metWerkendeSterrencirkel(): GameState {
  const state = maakInitieleSpelStatus();
  return {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 2) {
                return { ...tile, status: "actief" as const, improvement: STERRENCIRKEL, heeftWeg: true };
              }
              // Bruggetje naar de stad-tile (positie 4): zonder dit tussenliggende
              // wegvakje is positie 2 niet daadwerkelijk verbonden (zie wegen.ts).
              if (tile.positieInLaag === 3) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };
}

test("een Sterrencirkel produceert wetenschap per beurt zonder uit te putten", () => {
  let state = metWerkendeSterrencirkel();
  const tile = () => state.lagen[0].tiles[2];

  assert.equal(tile().beurtenTotUitputting, undefined, "de Sterrencirkel put niet uit");

  state = volgendeBeurt(state);
  assert.equal(state.wetenschap, STERRENCIRKEL.effect.waarde);
  assert.equal(tile().status, "actief", "blijft actief in plaats van ooit een ghost town te worden");

  state = volgendeBeurt(state);
  assert.equal(state.wetenschap, (STERRENCIRKEL.effect.waarde ?? 0) * 2);
});

test("bij drempel 1 opent een technologie-keuze met de twee vaste startrichtingen", () => {
  let state = metWerkendeSterrencirkel();
  const beurtenTotDrempel1 = Math.ceil(wetenschapKostenVoorDrempel(1) / (STERRENCIRKEL.effect.waarde ?? 1));

  for (let i = 0; i < beurtenTotDrempel1; i++) {
    assert.equal(state.techKeuzeEvent, undefined, `nog geen keuze vóór drempel 1 (beurt ${i})`);
    state = volgendeBeurt(state);
  }

  assert.deepEqual(state.techKeuzeEvent, { drempel: 1, opties: ["vuur-temmen", "spoor-lezen"] });
  assert.equal(state.technologieen.length, 0, "nog niets gekozen, alleen de keuze staat open");
});

test("kiesTech legt de keuze vast en het niet-gekozen pad blijft daarna onbereikbaar bij de volgende drempel", () => {
  let state = metWerkendeSterrencirkel();
  state = { ...state, wetenschap: wetenschapKostenVoorDrempel(1) };
  state = volgendeBeurt(state);
  assert.deepEqual(state.techKeuzeEvent?.opties, ["vuur-temmen", "spoor-lezen"]);

  // Een ongeldige keuze (niet één van de twee getoonde opties) heeft geen effect.
  const naOngeldigeKeuze = kiesTech(state, "wiel");
  assert.equal(naOngeldigeKeuze, state);

  state = kiesTech(state, "vuur-temmen");
  assert.deepEqual(state.technologieen, ["vuur-temmen"]);
  assert.equal(state.techKeuzeEvent, undefined);

  // Drempel 2 vanuit "vuur-temmen" toont alleen A1/A2 — nooit B1/B2 (het
  // pad onder "spoor-lezen" is nu permanent onbereikbaar deze run).
  state = { ...state, wetenschap: wetenschapKostenVoorDrempel(2) };
  state = volgendeBeurt(state);
  assert.deepEqual(state.techKeuzeEvent, { drempel: 2, opties: ["aardewerk", "zaadselectie"] });
});

test('"weven" verhoogt de opslag-cap direct bij het kiezen, zonder wachtrij of wegverbinding', () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, technologieen: ["vuur-temmen", "aardewerk"], techKeuzeEvent: { drempel: 3, opties: ["weven", "kalkoven"] } };

  state = kiesTech(state, "weven");

  assert.deepEqual(state.technologieen, ["vuur-temmen", "aardewerk", "weven"]);
  assert.equal(state.opslagCap, OPSLAG_CAP + 10);
});

test('"vuur-temmen" verhoogt de boerderij-opbrengst met 20%', () => {
  let state = maakInitieleSpelStatus();
  const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;
  state = {
    ...state,
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 0) {
                return { ...tile, status: "actief" as const, improvement: BOERDERIJ, heeftWeg: true };
              }
              // Bruggetje naar de stad-tile (positie 4), zie ook hierboven.
              if ([1, 2, 3].includes(tile.positieInLaag)) {
                return { ...tile, heeftWeg: true };
              }
              return tile;
            }),
          }
    ),
  };

  const zonderTech = volgendeBeurt(state);
  const voedselZonderTech = zonderTech.voedsel - state.voedsel;

  state = { ...state, technologieen: ["vuur-temmen"] };
  const metTech = volgendeBeurt(state);
  const voedselMetTech = metTech.voedsel - state.voedsel;

  assert.ok(voedselMetTech > voedselZonderTech, "de boerderij-opbrengst met 'vuur-temmen' moet hoger liggen");
});

// Laag 1, positie 2 is vast terrein-subtype "bos" (world.ts, TUTORIAL_TERREIN).
test("hakHout levert 1 hout op als de settler op een leeg bos-vakje staat", () => {
  const state: GameState = { ...maakInitieleSpelStatus(), settler: { hoogte: 1, positieInLaag: 2 } };

  const naHakken = hakHout(state);

  assert.equal(naHakken.voorraad.hout, state.voorraad.hout + 1);
  assert.equal(naHakken.settlerActieGedaanDitBeurt, true);
});

test("hakHout doet niets op een uitgeputte (ghost_town) Houtkap-tile, ook al blijft het terrein bos", () => {
  const state = maakInitieleSpelStatus();
  const metUitgeputteHoutkap: GameState = {
    ...state,
    settler: { hoogte: 1, positieInLaag: 2 },
    lagen: state.lagen.map((laag) =>
      laag.hoogte !== 1
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 2 ? { ...tile, status: "ghost_town" as const, improvement: HOUTKAP } : tile
            ),
          }
    ),
  };

  const naHakken = hakHout(metUitgeputteHoutkap);

  assert.equal(naHakken, metUitgeputteHoutkap, "geen verandering: een verlaten vakje levert geen gratis hout meer");
  assert.equal(naHakken.settlerActieGedaanDitBeurt, false);
});

// Laag 7, positie 0 is in world.ts vastgelegd als de gegarandeerde eerste
// amberader-vondst (TUTORIAL_AMBER); positie 1 op diezelfde laag is ook
// heuvel/berg-terrein maar zonder amberader.
test("Amberader mag alleen gebouwd worden op een vakje met een amberader-vondst, niet op elk heuvel/bergvakje", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    lagen: state.lagen.map((laag) => (laag.hoogte === 7 ? { ...laag, ontgrendeld: true } : laag)),
  };
  const laag7 = state.lagen.find((l) => l.hoogte === 7)!;
  assert.equal(laag7.tiles[0].amber, true);
  assert.equal(laag7.tiles[1].amber, false, "heuvel/berg-terrein zonder amberader-vondst");

  const nietGeplaatst = startBouw(state, 7, AMBERADER, 1);
  assert.equal(
    nietGeplaatst.lagen.find((l) => l.hoogte === 7)!.tiles[1].status,
    "leeg",
    "een gewoon heuvel/bergvakje zonder amberader is geen geldig Amberader-doel"
  );

  const welGeplaatst = startBouw(state, 7, AMBERADER, 0);
  assert.equal(welGeplaatst.lagen.find((l) => l.hoogte === 7)!.tiles[0].status, "in_aanbouw");
});

test("AMBERADER.uitputtingBeurten valt binnen de 'gewoon'-range uit het issue (10-14 beurten)", () => {
  assert.ok(AMBERADER.uitputtingBeurten! >= 10 && AMBERADER.uitputtingBeurten! <= 14);
});

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

test("versnelBouwMetGoud koopt de volledige resterende bouwtijd van een land-tile af als er genoeg goud is", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    lagen: state.lagen.map((laag) => (laag.hoogte === 7 ? { ...laag, ontgrendeld: true } : laag)),
  };
  state = startBouw(state, 7, AMBERADER, 0);
  const voortgang = state.lagen.find((l) => l.hoogte === 7)!.tiles[0].bouwVoortgang!;
  const kosten = rushKostenGoud(AMBERADER, voortgang);
  state = { ...state, voorraad: { ...state.voorraad, goud: kosten } };

  const naVersnellen = versnelBouwMetGoud(state, 7, 0);
  const tile = naVersnellen.lagen.find((l) => l.hoogte === 7)!.tiles[0];

  assert.equal(tile.status, "actief");
  assert.equal(tile.bouwVoortgang, undefined);
  assert.equal(tile.beurtenTotUitputting, AMBERADER.uitputtingBeurten);
  assert.equal(naVersnellen.voorraad.goud, 0, `alle ${kosten} goud is uitgegeven`);
});

test("versnelBouwMetGoud koopt maar een deel van de beurten weg als er niet genoeg goud is voor de volledige rush", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    lagen: state.lagen.map((laag) => (laag.hoogte === 7 ? { ...laag, ontgrendeld: true } : laag)),
  };
  state = startBouw(state, 7, AMBERADER, 0);
  // AMBERADER kost hout 8/steen 4 over 3 beurten (perBeurt: 3 hout, 2 steen)
  // — RUSH_GOUD_PER_BEURT goud is precies genoeg voor 1 van de 3 beurten.
  state = { ...state, voorraad: { ...state.voorraad, goud: RUSH_GOUD_PER_BEURT } };

  const naVersnellen = versnelBouwMetGoud(state, 7, 0);
  const tile = naVersnellen.lagen.find((l) => l.hoogte === 7)!.tiles[0];

  assert.equal(tile.status, "in_aanbouw", "nog niet voltooid: er is maar goud voor 1 van de 3 resterende beurten");
  assert.deepEqual(tile.bouwVoortgang, { hout: 5, steen: 2 });
  assert.equal(naVersnellen.voorraad.goud, 0);
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

test("een werkende Wachttoren beschermt ook de laag eronder, niet alleen zijn eigen laag (issue: wachttoren beschermt 2 lagen)", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    stad: { ...state.stad, strijders: [{ id: "strijder-1", wachttoren: { hoogte: 2, positieInLaag: 4 } }] },
    lagen: state.lagen.map((laag) =>
      laag.hoogte === 2
        ? {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 4
                ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true }
                : tile
            ),
          }
        : laag
    ),
  };

  // Kans 0 dwingt zowel het incident zelf als de laag-trekking af. Laag 2
  // bevat verder niets dan de Wachttoren en doet dus niet mee in de trekking
  // (`isAlleenWachttorenLaag`) — met alleen laag 1 en 2 ontgrendeld valt het
  // incident daardoor gegarandeerd op laag 1, de laag onder de Wachttoren.
  state = metVasteRandom(0, () => volgendeBeurt(state));

  assert.equal(state.indringersEvent?.laagHoogte, 1);
  assert.equal(
    state.indringersEvent?.heeftWachttoren,
    true,
    "de bemande, wegverbonden Wachttoren op laag 2 moet ook laag 1 (de laag eronder) beschermen"
  );
});

test("een laag met een actieve Amberader weegt zwaarder mee in de indringers-laag-trekking (issue: Amberader bonus/malus-koppeling)", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    lagen: state.lagen.map((laag) =>
      laag.hoogte === 2
        ? {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 4 ? { ...tile, status: "actief" as const, improvement: AMBERADER } : tile
            ),
          }
        : laag
    ),
  };

  // Twee ontgrendelde lagen doen mee: laag 1 (gewoon, gewicht 1) en laag 2
  // (actieve Amberader, gewicht 2) — totaalgewicht 3, drempel voor laag 1 ligt
  // dus op 1/3. Bij een zuiver uniforme trekking zou 0.4 nog altijd op laag 1
  // uitkomen (floor(0.4 * 2) = 0); met de Amberader-weging (0.4 > 1/3) komt
  // dezelfde randomwaarde juist op laag 2 uit — het bewijs dat de weging
  // daadwerkelijk effect heeft. De derde waarde (stamnaam-trekking) is
  // irrelevant voor deze assertie.
  state = metRandomReeks([0, 0.4, 0], () => volgendeBeurt(state));

  assert.equal(
    state.indringersEvent?.laagHoogte,
    2,
    "de laag met de actieve Amberader moet bij dubbel gewicht op deze randomwaarde geloot worden, niet de gewone laag"
  );
});

test("een uitgeputte Amberader (ghost town) telt niet meer mee voor het extra indringers-gewicht", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    lagen: state.lagen.map((laag) =>
      laag.hoogte === 2
        ? {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 4 ? { ...tile, status: "ghost_town" as const, improvement: AMBERADER } : tile
            ),
          }
        : laag
    ),
  };

  // Zelfde randomwaarde als hierboven (0.4), maar nu is de Amberader
  // uitgeput: beide lagen wegen even zwaar (gewicht 1), dus dit gedraagt zich
  // weer als de gewone uniforme trekking en komt op laag 1 uit.
  state = metRandomReeks([0, 0.4, 0], () => volgendeBeurt(state));

  assert.equal(
    state.indringersEvent?.laagHoogte,
    1,
    "een uitgeputte Amberader mag geen verhoogd gewicht meer geven — een lege put trekt niemand meer"
  );
});

// Gedeelde opzet voor de derde-uitkomst-tests hieronder (issue: "wachttorens
// kunnen vernietigd worden door indringers"): laag 2 krijgt een voltooide,
// bemande, wegverbonden Wachttoren die (via "wachttoren beschermt 2 lagen")
// laag 1 beschermt — zelfde opzet als de bestaande beschermings-test
// hierboven, zodat het incident gegarandeerd op de beschermde laag 1 valt.
function metBeschermdeLaag(): GameState {
  let state = maakInitieleSpelStatus();
  return {
    ...state,
    stad: { ...state.stad, strijders: [{ id: "strijder-1", wachttoren: { hoogte: 2, positieInLaag: 4 } }] },
    lagen: state.lagen.map((laag) =>
      laag.hoogte === 2
        ? {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 4
                ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true }
                : tile
            ),
          }
        : laag
    ),
  };
}

test("malus-uitkomst: een beschermde laag kan de Wachttoren toch verliezen — zelfde afhandeling als een verloren Confrontatie tegen een Bezette Laag (issue: wachttorens kunnen vernietigd worden door indringers)", () => {
  let state = metBeschermdeLaag();

  // kans-check (0) → incident; laag-trekking (0) → laag 1 (de beschermde
  // laag); stamnaam (0); uitkomst-worp (0.9, tussen 0.85 en 0.95) → malus.
  state = metRandomReeks([0, 0, 0, 0.9], () => volgendeBeurt(state));

  assert.equal(state.indringersEvent?.laagHoogte, 1);
  assert.equal(state.indringersEvent?.heeftWachttoren, true);
  assert.equal(state.indringersEvent?.uitkomst, "malus");
  assert.equal(state.indringersEvent?.fase, "malus");

  const wachttorenTile = state.lagen.find((l) => l.hoogte === 2)?.tiles[4];
  assert.equal(wachttorenTile?.status, "ruine", "de beschermende Wachttoren-tile vervalt tot ruïne");
  assert.equal(wachttorenTile?.improvement, undefined);
  assert.equal(state.stad.strijders.length, 0, "de bemannende strijder is blijvend verloren, geen reassignment");
});

test("bonus-uitkomst: de bemanning buit goud van de indringers (issue: wachttorens kunnen vernietigd worden door indringers)", () => {
  let state = metBeschermdeLaag();
  state = { ...state, voorraad: { ...state.voorraad, goud: 0 } };

  // Zelfde reeks als de malus-test, maar de uitkomst-worp (0.99) valt voorbij
  // 0.95 → bonus.
  state = metRandomReeks([0, 0, 0, 0.99], () => volgendeBeurt(state));

  assert.equal(state.indringersEvent?.uitkomst, "bonus");
  assert.equal(state.indringersEvent?.fase, "bonus");
  assert.equal(state.indringersEvent?.buitGoud, 6);
  assert.equal(state.voorraad.goud, 6, "het buitgemaakte goud is meteen aan de voorraad toegevoegd");

  const wachttorenTile = state.lagen.find((l) => l.hoogte === 2)?.tiles[4];
  assert.equal(wachttorenTile?.status, "actief", "de Wachttoren blijft bij een bonus-uitkomst gewoon intact");
  assert.equal(state.stad.strijders.length, 1, "de bemannende strijder blijft bij een bonus-uitkomst behouden");
});

test("een laag met een actieve Amberader krijgt eerst de 'Amberader onder vuur'-aankondiging, óók als de laag beschermd is — pas na bevestigAmberOnderVuur schuift de melding door naar de eigenlijke uitkomst", () => {
  let state = metBeschermdeLaag();
  state = {
    ...state,
    lagen: state.lagen.map((laag) =>
      laag.hoogte === 1
        ? {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 4 ? { ...tile, status: "actief" as const, improvement: AMBERADER } : tile
            ),
          }
        : laag
    ),
  };

  // kans-check (0) → incident; laag-trekking (0) → laag 1 (enige laag die
  // meedoet: laag 2 blijft "alleen een wachttoren" en telt niet mee);
  // stamnaam (0); uitkomst-worp (0.5) → standhouden.
  state = metRandomReeks([0, 0, 0, 0.5], () => volgendeBeurt(state));

  assert.equal(state.indringersEvent?.amberOnderVuur, true);
  assert.equal(state.indringersEvent?.fase, "amber-onder-vuur");
  assert.equal(
    state.indringersEvent?.uitkomst,
    "standhouden",
    "de uitkomst is al bepaald en opgeslagen, ook al is de aankondiging nog niet weggeklikt"
  );

  state = bevestigAmberOnderVuur(state);
  assert.equal(
    state.indringersEvent?.fase,
    "gemeld",
    "na de aankondiging schuift de melding door naar de standhouden-uitkomst"
  );
});

test("kiesGeefTribuut trekt nog niets van de voorraad af — pas geefTribuut (na het sluiten van de bevestiging) doet dat (issue: wachttoren tweaks)", () => {
  let state: GameState = {
    ...maakInitieleSpelStatus(),
    voorraad: { hout: 10, steen: 0, erts: 0, goud: 0 },
    indringersEvent: {
      laagHoogte: 2,
      stamNaam: "de stam van de Halve Maan",
      heeftWachttoren: false,
      tribuut: { resource: "hout", aantal: 5 },
      fase: "gemeld",
    },
  };

  state = kiesGeefTribuut(state);
  assert.equal(state.indringersEvent?.fase, "betaald");
  assert.equal(state.voorraad.hout, 10, "de voorraad mag nog niet veranderd zijn na de keuze om te betalen");

  state = geefTribuut(state);
  assert.equal(state.voorraad.hout, 5, "pas na het sluiten van de bevestiging gaat het tribuut van de voorraad af");
  assert.equal(state.indringersEvent, undefined);
});

test("een afgedwongen tribuut (na weigeren) trekt ook pas af zodra de laatste bevestiging gesloten wordt", () => {
  let state: GameState = {
    ...maakInitieleSpelStatus(),
    voorraad: { hout: 10, steen: 0, erts: 0, goud: 0 },
    indringersEvent: {
      laagHoogte: 2,
      stamNaam: "de stam van de Bloedhoeven",
      heeftWachttoren: false,
      tribuut: { resource: "hout", aantal: 5 },
      fase: "gemeld",
    },
  };

  state = weigerTribuut(state);
  assert.equal(state.indringersEvent?.fase, "geforceerd");

  state = bevestigGedwongenTribuut(state);
  assert.equal(state.indringersEvent?.fase, "betaald");
  assert.equal(state.voorraad.hout, 10, "de voorraad mag nog niet veranderd zijn vóór de laatste bevestiging");

  state = geefTribuut(state);
  assert.equal(state.voorraad.hout, 5);
  assert.equal(state.indringersEvent, undefined);
});

// --- Bezette Laag, Missionaris & Verkenner (hoofdstuk 6) -------------------

// Duwt de cultuur naar de drempel van BEZETTE_LAAG_HOOGTE en verwerkt één
// beurt, zodat de laag "in beeld komt" (Deel 2) — gedeelde opzet voor de
// tests hieronder, zelfde patroon als `metWerkendeEconomie` hierboven.
function metBezetteLaagInBeeld(): GameState {
  let state = maakInitieleSpelStatus();
  state = { ...state, cultuur: cultuurKostenVoorLaag(BEZETTE_LAAG_HOOGTE), voedsel: 10_000 };
  return volgendeBeurt(state);
}

function metBezetteLaagEnVerkenner(): GameState {
  const state = metBezetteLaagInBeeld();
  return { ...state, wetenschap: 100, stad: { ...state.stad, verkenners: [{ id: "verkenner-0" }] } };
}

// Zet een actieve, wegverbonden Heiligdom op laag 1 (positie 2, met een
// brugvakje naar de stad), voor tests die cultuur-inkomen nodig hebben.
function metActiefHeiligdomOpLaag1(state: GameState): GameState {
  return {
    ...state,
    lagen: state.lagen.map((laag) =>
      laag.hoogte !== 1
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) => {
              if (tile.positieInLaag === 2) {
                return { ...tile, status: "actief" as const, improvement: HEILIGDOM, heeftWeg: true };
              }
              if (tile.positieInLaag === 3) return { ...tile, heeftWeg: true };
              return tile;
            }),
          }
    ),
  };
}

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

test("elke extra Missionaris vermenigvuldigt de belegeringsvoortgang (issue: 'Laatste confrontatie tweaken')", () => {
  let state = metBezetteLaagInBeeld();
  state = metActiefHeiligdomOpLaag1(state);
  state = {
    ...state,
    stad: {
      ...state.stad,
      missionarissen: [{ id: "missionaris-0" }, { id: "missionaris-1" }, { id: "missionaris-2" }],
    },
  };
  state = volgendeBeurt(state);

  const laag12 = state.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!;
  assert.equal(laag12.belegeringsVoortgang, ((HEILIGDOM.effect.waarde ?? 0) / 2) * 3, "3 Missionarissen: 3x zoveel voortgang als met 1");
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
  assert.equal(laag12.belegeringsVoortgang, 0, "de meter begint weer bij 0 voor het tweede Heiligdom (positie 6)");
  assert.equal(laag12.bezet, true, "nog niet opgelost: het tweede Heiligdom (positie 6) staat nog, al dan niet onthuld");
});

test("Deel 6: zodra alle vijandelijke Heiligdommen vernietigd zijn, wordt de hele Bezette Laag in één keer onthuld en eindigt de Bezette-status", () => {
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
          tile.positieInLaag === 1 || tile.positieInLaag === 6
            ? { ...tile, verhuld: false, status: "actief" as const, improvement: VIJANDELIJK_HEILIGDOM }
            : tile
        ),
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
  // Positie 0 werd nooit expliciet verkend, maar draagt "wachttoren" volgens
  // de vaste tutorial-indeling (world.ts) en moet dus na de massale
  // onthulling alsnog als vijandelijke Wachttoren zichtbaar zijn.
  assert.equal(laag12.tiles[0].improvement?.id, "vijandelijke-wachttoren");
  assert.equal(laag12.tiles[2].improvement?.id, "bezette-laag-huisje");
});

// Bouwt een vaste, wegverbonden corridor (positie 4, elke laag 1..totHoogte)
// zodat een improvement op `totHoogte` als wegverbonden geldt (zie
// wegen.ts: de stad zelf is alleen op hoogte 1 automatisch "doorgang").
function metWegCorridorNaarLaag(state: GameState, totHoogte: number): GameState {
  return {
    ...state,
    lagen: state.lagen.map((laag) =>
      laag.hoogte >= 1 && laag.hoogte <= totHoogte
        ? { ...laag, tiles: laag.tiles.map((t) => (t.positieInLaag === 4 ? { ...t, heeftWeg: true } : t)) }
        : laag
    ),
  };
}

function metBeschermendeWachttorenOpLaag11(state: GameState): GameState {
  let s = metWegCorridorNaarLaag(state, 11);
  s = {
    ...s,
    stad: { ...s.stad, strijders: [{ id: "strijder-wachter", wachttoren: { hoogte: 11, positieInLaag: 4 } }] },
    lagen: s.lagen.map((laag) =>
      laag.hoogte !== 11
        ? laag
        : {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 4 ? { ...tile, status: "actief" as const, improvement: WACHTTOREN } : tile
            ),
          }
    ),
  };
  return s;
}

test("kanConfrontatieBezetteLaag vereist een voltooide, bemande, wegverbonden eigen Wachttoren op de laag direct onder de Bezette Laag", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 0); // onthult de vijandelijke Wachttoren op positie 0

  assert.equal(kanConfrontatieBezetteLaag(state, 0), false, "geen eigen Wachttoren op laag 11: nog niet beschikbaar");

  state = metBeschermendeWachttorenOpLaag11(state);
  assert.equal(kanConfrontatieBezetteLaag(state, 0), true);
  // Een niet-onthuld of niet-vijandelijk-Wachttoren-vakje is nooit een geldig doel.
  assert.equal(kanConfrontatieBezetteLaag(state, 3), false);
});

test("confrontatieBezetteLaag: winst ruimt de vijandelijke Wachttoren-tile op (geen dreiging/doel meer)", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 0);
  state = metBeschermendeWachttorenOpLaag11(state);

  const naWinst = metVasteRandom(0, () => confrontatieBezetteLaag(state, 0));
  assert.equal(naWinst.laatsteConfrontatieBezetteLaag?.gewonnen, true);
  const doelTile = naWinst.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!.tiles[0];
  assert.equal(doelTile.status, "leeg");
  assert.equal(doelTile.improvement, undefined);
  // De eigen Wachttoren en zijn bemanning blijven bij winst gewoon intact.
  const wachttorenTile = naWinst.lagen.find((l) => l.hoogte === 11)!.tiles[4];
  assert.equal(wachttorenTile.status, "actief");
  assert.equal(naWinst.stad.strijders.length, 1);
});

test("confrontatieBezetteLaag: verlies maakt de eigen Wachttoren een ruïne en kost de bemannende strijder permanent, maar spaart Legerkamp-strijders", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 0);
  state = metBeschermendeWachttorenOpLaag11(state);
  // Een tweede, aan een Legerkamp toegewezen strijder — moet bij verlies
  // gewoon behouden blijven (alleen de Wachttoren-bemanning gaat verloren).
  state = {
    ...state,
    stad: {
      ...state.stad,
      strijders: [
        ...state.stad.strijders,
        { id: "strijder-legerkamp", legerkamp: { hoogte: 1, positieInLaag: 0 } },
      ],
    },
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 0 ? { ...tile, status: "actief" as const, improvement: LEGERKAMP } : tile
            ),
          }
    ),
  };

  const naVerlies = metVasteRandom(0.999999, () => confrontatieBezetteLaag(state, 0));
  assert.equal(naVerlies.laatsteConfrontatieBezetteLaag?.gewonnen, false);

  const wachttorenTile = naVerlies.lagen.find((l) => l.hoogte === 11)!.tiles[4];
  assert.equal(wachttorenTile.status, "ruine");
  assert.equal(wachttorenTile.improvement, undefined);

  assert.equal(naVerlies.stad.strijders.length, 1, "de Wachttoren-bemanning is blijvend verloren");
  assert.equal(naVerlies.stad.strijders[0].id, "strijder-legerkamp", "de Legerkamp-strijder blijft behouden");

  // De vijandelijke Wachttoren-tile zelf blijft gewoon staan (geen doel meer
  // beschadigd of opgeruimd) — alleen de eigen verdediging is geraakt.
  const vijandTile = naVerlies.lagen.find((l) => l.hoogte === BEZETTE_LAAG_HOOGTE)!.tiles[0];
  assert.equal(vijandTile.improvement?.id, "vijandelijke-wachttoren");
});

test("een ruïne-tile is, net als een leeg vakje, weer normaal herbouwbaar tegen de normale kosten/bouwtijd", () => {
  let state = metBezetteLaagEnVerkenner();
  state = verken(state, 0);
  state = metBeschermendeWachttorenOpLaag11(state);
  state = metVasteRandom(0.999999, () => confrontatieBezetteLaag(state, 0));

  const naHerbouw = startBouw(state, 11, WACHTTOREN, 4);
  const tile = naHerbouw.lagen.find((l) => l.hoogte === 11)!.tiles[4];
  assert.equal(tile.status, "in_aanbouw");
  assert.equal(tile.improvement?.id, "wachttoren");
});

test("bemanLegerkamp en onbemandeLegerkampPosities: dezelfde soort omkeerbare toewijzing als bij een Wachttoren", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    stad: { ...state.stad, strijders: [{ id: "strijder-0" }] },
    lagen: state.lagen.map((laag, idx) =>
      idx !== 0
        ? laag
        : {
            ...laag,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 0 ? { ...tile, status: "actief" as const, improvement: LEGERKAMP } : tile
            ),
          }
    ),
  };

  assert.deepEqual(onbemandeLegerkampPosities(state), [{ hoogte: 1, positieInLaag: 0 }]);
  assert.equal(berekenLegerkampLegerwaarde(state), 0, "nog niemand toegewezen");

  state = bemanLegerkamp(state, "strijder-0", 1, 0);
  assert.deepEqual(state.stad.strijders[0].legerkamp, { hoogte: 1, positieInLaag: 0 });
  assert.deepEqual(onbemandeLegerkampPosities(state), []);
  assert.equal(berekenLegerkampLegerwaarde(state), SOLDAAT.effect.waarde);

  state = haalStrijderTerug(state, "strijder-0");
  assert.equal(state.stad.strijders[0].legerkamp, undefined);
  assert.equal(berekenLegerkampLegerwaarde(state), 0);
});

test("vijandelijkeWachttorenPosities geeft alleen onthulde, nog niet opgeruimde vijandelijke Wachttoren-tiles terug", () => {
  let state = metBezetteLaagEnVerkenner();
  assert.deepEqual(vijandelijkeWachttorenPosities(state), []);

  state = verken(state, 0);
  assert.deepEqual(vijandelijkeWachttorenPosities(state), [{ hoogte: BEZETTE_LAAG_HOOGTE, positieInLaag: 0 }]);

  state = metBeschermendeWachttorenOpLaag11(state);
  state = metVasteRandom(0, () => confrontatieBezetteLaag(state, 0));
  assert.deepEqual(vijandelijkeWachttorenPosities(state), [], "na winst telt de tile niet meer mee als doel");
});

// ---------------------------------------------------------------------------
// City-improvement-capaciteit & infrastructuur-gating (issue: "city
// improvements") — Deel 1 t/m 4.
// ---------------------------------------------------------------------------

// Plaatst `aantal` actieve land-tiles met `improvement` over de eerste
// beschikbare (niet-stad, nog lege) vakjes van de opeenvolgende lagen —
// genoeg voor de infrastructuur-eis-tellingen (Deel 4), die alleen
// `status === "actief"` controleren, geen wegverbinding.
function metActieveLandImprovements(state: GameState, improvement: Improvement, aantal: number): GameState {
  let resterend = aantal;
  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) => {
      if (resterend <= 0 || tile.positieInLaag === 4 || tile.status !== "leeg") return tile;
      resterend -= 1;
      return { ...tile, status: "actief" as const, improvement };
    }),
  }));
  return { ...state, lagen };
}

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

test("Legerkamp en Offer Altaar blijven geblokkeerd door startBouw tot hun infrastructuur-eis vervuld is (Deel 4)", () => {
  let state = maakInitieleSpelStatus();
  state = { ...state, lagen: state.lagen.map((laag) => ({ ...laag, ontgrendeld: true })) };

  const legerkampVoortgang = infrastructuurVoortgang(state.lagen, state.stad.cityImprovements, LEGERKAMP);
  assert.deepEqual(legerkampVoortgang, {
    aantalLandImprovement: 0,
    benodigdAantal: 5,
    heeftCityImprovement: false,
    vervuld: false,
  });

  // Positie 6 blijft leeg: `metActieveLandImprovements` vult hierna eerst de
  // posities 0,1,2,3,5 van laag 1 (positie 4 is de stad), zodat het Legerkamp
  // zelf ergens anders neergezet kan worden dan de 5 Wachttorens die de eis
  // vervullen.
  const naPoging = startBouw(state, 1, LEGERKAMP, 6);
  assert.equal(naPoging, state, "geen effect: nog geen 5 Wachttorens en geen Barakken");

  // 5 actieve Wachttorens, maar nog geen Barakken.
  let metWachttorens = metActieveLandImprovements(state, WACHTTOREN, 5);
  assert.equal(
    infrastructuurVoortgang(metWachttorens.lagen, metWachttorens.stad.cityImprovements, LEGERKAMP)?.vervuld,
    false
  );
  assert.equal(startBouw(metWachttorens, 1, LEGERKAMP, 6), metWachttorens);

  // Met Barakken erbij is de eis vervuld en mag het Legerkamp gebouwd worden.
  const metBarakken: GameState = {
    ...metWachttorens,
    stad: { ...metWachttorens.stad, cityImprovements: [BARAKKEN] },
  };
  assert.equal(infrastructuurVoortgang(metBarakken.lagen, metBarakken.stad.cityImprovements, LEGERKAMP)?.vervuld, true);
  const naGeldigeBouw = startBouw(metBarakken, 1, LEGERKAMP, 6);
  assert.equal(naGeldigeBouw.lagen[0].tiles[6].improvement?.id, "legerkamp");
  assert.equal(naGeldigeBouw.lagen[0].tiles[6].status, "in_aanbouw");

  // Offer Altaar volgt exact hetzelfde patroon met Heiligdommen/Grote Tempel.
  const metHeiligdommen = metActieveLandImprovements(state, HEILIGDOM, 5);
  assert.equal(startBouw(metHeiligdommen, 1, OFFER_ALTAAR, 6), metHeiligdommen, "nog geen Grote Tempel");
  const metGroteTempel: GameState = {
    ...metHeiligdommen,
    stad: { ...metHeiligdommen.stad, cityImprovements: [GROTE_TEMPEL] },
  };
  const naOfferAltaar = startBouw(metGroteTempel, 1, OFFER_ALTAAR, 6);
  assert.equal(naOfferAltaar.lagen[0].tiles[6].improvement?.id, "offer-altaar");
});
