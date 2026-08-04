import test from "node:test";
import assert from "node:assert/strict";
import {
  bemanWachttoren,
  bevestigGedwongenTribuut,
  bouwStagneertVolgendeBeurt,
  geefTribuut,
  haalStrijderTerug,
  hakHout,
  heeftGenoegVoorStichten,
  jaag,
  kanStichten,
  kiesGeefTribuut,
  kiesTech,
  maakInitieleSpelStatus,
  onbemandeWachttorenPosities,
  OPSLAG_CAP,
  resterendeBouwBeurten,
  RUSH_GOUD_PER_BEURT,
  rushKostenGoud,
  sluitAmberOntdektMelding,
  startBouw,
  startNieuweSettler,
  startOpslagplaats,
  startRecrutering,
  STICHTING_KOSTEN,
  stichtStad,
  verplaatsSettlerNaar,
  versnelBouwMetGoud,
  versnelCivielMetGoud,
  versnelOpslagplaatsMetGoud,
  volgendeBeurt,
  weigerTribuut,
} from "./economie";
import { AMBERADER, ECONOMISCH_LAND_IMPROVEMENTS, MILITAIR_LAND_IMPROVEMENTS, SOLDAAT, STERRENCIRKEL } from "./improvements";
import { wetenschapKostenVoorDrempel } from "./techTree";
import { GameState } from "./types";
import { AMBER_ONTDEKKING_LAAG, cultuurKostenVoorLaag } from "./world";

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

const HOUTKAP = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "houtkap")!;
const MIJN = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "mijn")!;
const BOERDERIJ = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "boerderij")!;
const WACHTTOREN = MILITAIR_LAND_IMPROVEMENTS.find((i) => i.id === "wachttoren")!;

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
  // Laag 10, positie 0 is in world.ts vastgelegd als een vers-water-vakje
  // (TUTORIAL_VERS_WATER) — de settler moet er wel eerst kunnen staan, dus
  // die laag moet ontgrendeld zijn.
  state = {
    ...state,
    settler: { hoogte: 10, positieInLaag: 0 },
    lagen: state.lagen.map((laag) => (laag.hoogte === 10 ? { ...laag, ontgrendeld: true } : laag)),
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

  const gestichteTile = naStichten.lagen.find((l) => l.hoogte === 10)!.tiles[0];
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
    settler: { hoogte: 10, positieInLaag: 0 },
    lagen: state.lagen.map((laag) =>
      laag.hoogte === 10
        ? {
            ...laag,
            ontgrendeld: true,
            tiles: laag.tiles.map((tile) =>
              tile.positieInLaag === 0 ? { ...tile, status: "actief" as const, improvement: HOUTKAP } : tile
            ),
          }
        : laag
    ),
  };
  assert.equal(kanStichten(state), false, "een al bebouwd vakje is geen geldig stichtingsdoel, ook al ligt het aan water");
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
