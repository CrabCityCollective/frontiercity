import test from "node:test";
import assert from "node:assert/strict";
import {
  BOON_POOL,
  MOEDERLANDEN,
  OUDE_HANDELSROUTE_INTERVAL_BEURTEN,
  VOORRAADSCHUUR_OPSLAG_BONUS,
  ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN,
  ZEGENINGEN_VAN_HET_MOEDERLAND_LADING,
  kiesMoederland,
  komtInAanmerkingVoorBoon,
  moederlandMetId,
  pasBoonEffectToe,
  trekBoon,
  verwerkOudeHandelsrouteBoon,
  verwerkZegeningenVanHetMoederlandBoon,
} from "./boons";
import { stichtStad, STICHTING_KOSTEN } from "./acties";
import { maakInitieleSpelStatus } from "./economie";
import { metActieveStad } from "./stad";
import { metVasteRandom } from "./testHelpers";

test("trekBoon trekt zonder terugleggen (issue #414, vraag 1): een al bezeten Boon komt niet opnieuw uit de pool", () => {
  const alleIds = BOON_POOL.map((boon) => boon.id);
  const gehad = alleIds.slice(0, -1);
  const laatsteId = alleIds[alleIds.length - 1];

  // Random blijft op 0 staan (zou zonder filtering altijd de eerste van de
  // pool teruggeven) — met alle andere Boons al "gehad" moet toch de enige
  // overgebleven Boon getrokken worden.
  const boon = metVasteRandom(0, () => trekBoon(gehad));
  assert.equal(boon?.id, laatsteId);
});

test("trekBoon geeft undefined als de speler alle Boons uit de pool al heeft", () => {
  const alleIds = BOON_POOL.map((boon) => boon.id);
  assert.equal(trekBoon(alleIds), undefined);
});

test("komtInAanmerkingVoorBoon: alleen bij een niet-afsluitende stichting, een 'grote' stad en buiten de tutorial (issue #414, vragen 1-3)", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = metActieveStad(state, { ...state.stad, grootte: "groot" });

  assert.equal(komtInAanmerkingVoorBoon(state, false), true, "Going West, grote stad, tussentijdse stichting: kans op een Boon");
  assert.equal(komtInAanmerkingVoorBoon(state, true), false, "de allerlaatste, afsluitende stichting geeft nooit een Boon");

  const kleineStad = metActieveStad(state, { ...state.stad, grootte: "klein" });
  assert.equal(komtInAanmerkingVoorBoon(kleineStad, false), false, "een stad die nooit 'groot' werd, geeft geen Boon");

  const tutorial = metActieveStad(maakInitieleSpelStatus(), { ...maakInitieleSpelStatus().stad, grootte: "groot" });
  assert.equal(komtInAanmerkingVoorBoon(tutorial, false), false, "de tutorial doet nooit mee aan het Boon-systeem (issue #414, vraag 3)");
});

test("stichtStad kent een Boon toe bij een tussentijdse Going West-stichting vanuit een grote stad, en past meteen het mechanische effect toe (issue #411/#414/#428)", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = metActieveStad(state, { ...state.stad, grootte: "groot" });
  state = {
    ...state,
    settler: { hoogte: 8, positieInStreek: 5 },
    streken: state.streken.map((streek) =>
      streek.hoogte === 8
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...state.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const opslagCapVoor = state.opslagCap;

  const naStichten = metVasteRandom(0, () => stichtStad(state));
  assert.equal(naStichten.boons.length, 1, "een Boon wordt toegekend en run-breed opgeslagen");
  assert.equal(naStichten.boonToegekendEvent, naStichten.boons[0], "de pop-up-melding wijst naar de zojuist toegekende Boon");
  assert.equal(naStichten.boons[0], "voorraadschuur-van-de-voorvaderen");
  assert.equal(
    naStichten.opslagCap,
    opslagCapVoor + VOORRAADSCHUUR_OPSLAG_BONUS,
    "Voorraadschuur van de Voorvaderen verhoogt de opslagcap"
  );
  assert.equal(naStichten.voorraad.hout, VOORRAADSCHUUR_OPSLAG_BONUS, "hout (0 ná de stichtingskosten) krijgt de Boon-bonus erbij");
  assert.equal(naStichten.voorraad.steen, VOORRAADSCHUUR_OPSLAG_BONUS);
  assert.equal(naStichten.voorraad.erts, VOORRAADSCHUUR_OPSLAG_BONUS);
  assert.equal(naStichten.voorraad.goud, VOORRAADSCHUUR_OPSLAG_BONUS, "ook goud (dat niet bij de stichtingskosten hoort) krijgt de bonus");

  // Trekking zonder terugleggen: een tweede tussentijdse stichting vanuit een
  // opnieuw grote stad trekt de andere, nog niet bezeten Boon uit de pool
  // (issue #431 breidde de pool uit naar twee leden — vóór #431 was de pool
  // hier al uitgeput, zie de derde stichting hieronder voor dat geval).
  let tweedeState = metActieveStad(naStichten, { ...naStichten.stad, grootte: "groot" });
  tweedeState = {
    ...tweedeState,
    settler: { hoogte: 20, positieInStreek: 5 },
    streken: tweedeState.streken.map((streek) =>
      streek.hoogte === 20
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...tweedeState.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naTweedeStichten = metVasteRandom(0, () => stichtStad(tweedeState));
  assert.equal(naTweedeStichten.boons.length, 2, "de tweede, nog niet bezeten Boon uit de pool wordt toegekend");
  assert.equal(naTweedeStichten.boons[1], "oude-handelsroute");
  assert.equal(naTweedeStichten.opslagCap, naStichten.opslagCap, "Oude Handelsroute heeft geen eigen opslagcap-effect");
  assert.equal(naTweedeStichten.wampumOntvangen, true, "Oude Handelsroute maakt de wampum-teller meteen zichtbaar");

  // Twee Boons zijn nu bezet: een derde tussentijdse stichting trekt de
  // laatst overgebleven Boon uit de pool (issue #540 breidde de pool uit naar
  // drie leden — vóór #540 was de pool hier al uitgeput, zie de vierde
  // stichting hieronder voor dat geval).
  let derdeState = metActieveStad(naTweedeStichten, { ...naTweedeStichten.stad, grootte: "groot" });
  derdeState = {
    ...derdeState,
    settler: { hoogte: 32, positieInStreek: 5 },
    streken: derdeState.streken.map((streek) =>
      streek.hoogte === 32
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...derdeState.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naDerdeStichten = metVasteRandom(0, () => stichtStad(derdeState));
  assert.equal(naDerdeStichten.boons.length, 3, "de derde, nog niet bezeten Boon uit de pool wordt toegekend");
  assert.equal(naDerdeStichten.boons[2], "zegeningen-van-het-moederland");
  assert.equal(
    naDerdeStichten.moederlandKeuzeEvent,
    true,
    "Zegeningen van het Moederland opent een moederland-keuze in plaats van een meteen-effect"
  );
  assert.equal(naDerdeStichten.opslagCap, naTweedeStichten.opslagCap, "Zegeningen van het Moederland heeft geen eigen opslagcap-effect");

  // Nu zijn alle drie de Boons uit de pool bezet: een vierde tussentijdse
  // stichting levert geen nieuwe Boon meer op (issue #414, vraag 1: trekking
  // zonder terugleggen, ook met de uitgebreide pool).
  let vierdeState = metActieveStad(naDerdeStichten, { ...naDerdeStichten.stad, grootte: "groot" });
  vierdeState = {
    ...vierdeState,
    settler: { hoogte: 34, positieInStreek: 5 },
    streken: vierdeState.streken.map((streek) =>
      streek.hoogte === 34
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...vierdeState.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naVierdeStichten = metVasteRandom(0, () => stichtStad(vierdeState));
  assert.equal(naVierdeStichten.boons.length, 3, "geen vierde Boon: de pool is nu uitgeput");
  assert.equal(naVierdeStichten.opslagCap, naDerdeStichten.opslagCap, "geen extra opslagcap-bonus zonder een nieuw getrokken Boon");
});

test("stichtStad kent geen Boon toe bij de afsluitende stichting, in de tutorial, of vanuit een niet-grote stad", () => {
  // Afsluitende stichting (tutorial-wereld, streek 14) — ook al is de stad
  // toevallig groot, dit is de allerlaatste stichting van de run.
  let afsluitend = maakInitieleSpelStatus("going-west");
  afsluitend = metActieveStad(afsluitend, { ...afsluitend.stad, grootte: "groot" });
  afsluitend = {
    ...afsluitend,
    settler: { hoogte: afsluitend.streken.length, positieInStreek: 5 },
    streken: afsluitend.streken.map((streek) =>
      streek.hoogte === afsluitend.streken.length
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...afsluitend.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naAfsluitend = stichtStad(afsluitend);
  assert.equal(naAfsluitend.boons.length, 0);
  assert.equal(naAfsluitend.boonToegekendEvent, undefined);

  // Tutorial (geen campagneId) — ook met een grote stad geen Boon.
  let tutorial = maakInitieleSpelStatus();
  tutorial = metActieveStad(tutorial, { ...tutorial.stad, grootte: "groot" });
  tutorial = {
    ...tutorial,
    settler: { hoogte: 14, positieInStreek: 5 },
    streken: tutorial.streken.map((streek) => (streek.hoogte === 14 ? { ...streek, ontgrendeld: true } : streek)),
    voorraad: { ...tutorial.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naTutorial = stichtStad(tutorial);
  assert.equal(naTutorial.boons.length, 0);

  // Kleine stad in Going West — geen Boon.
  let kleineStad = maakInitieleSpelStatus("going-west");
  kleineStad = {
    ...kleineStad,
    settler: { hoogte: 8, positieInStreek: 5 },
    streken: kleineStad.streken.map((streek) =>
      streek.hoogte === 8
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) => (tile.positieInStreek === 5 ? { ...tile, versWater: true } : tile)),
          }
        : streek
    ),
    voorraad: { ...kleineStad.voorraad, hout: STICHTING_KOSTEN.hout, steen: STICHTING_KOSTEN.steen, erts: STICHTING_KOSTEN.erts },
    voedsel: STICHTING_KOSTEN.voedsel,
  };
  const naKleineStad = stichtStad(kleineStad);
  assert.equal(naKleineStad.boons.length, 0);
});

test("pasBoonEffectToe zet wampumOntvangen bij toekenning van Oude Handelsroute (issue #431), zodat de HUD de wampum-teller meteen toont", () => {
  const state = maakInitieleSpelStatus("going-west");
  assert.equal(state.wampumOntvangen, false);

  const na = pasBoonEffectToe(state, "oude-handelsroute");
  assert.equal(na.wampumOntvangen, true);
  assert.equal(na.wampum, state.wampum, "geen meteen-effect, alleen de HUD-zichtbaarheid verandert");
});

test("verwerkOudeHandelsrouteBoon geeft alleen wampum op een interval-beurt, en alleen aan een speler die de Boon bezit (issue #431)", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, boons: ["oude-handelsroute"] };

  const nietOpInterval = verwerkOudeHandelsrouteBoon(state, OUDE_HANDELSROUTE_INTERVAL_BEURTEN - 1);
  assert.equal(nietOpInterval.wampum, state.wampum, "geen wampum vóór het interval");

  const opInterval = verwerkOudeHandelsrouteBoon(state, OUDE_HANDELSROUTE_INTERVAL_BEURTEN);
  assert.equal(opInterval.wampum, state.wampum + 1, "+1 wampum op elk veelvoud van het interval");

  const opTweedeInterval = verwerkOudeHandelsrouteBoon(state, OUDE_HANDELSROUTE_INTERVAL_BEURTEN * 2);
  assert.equal(opTweedeInterval.wampum, state.wampum + 1, "ook elk volgend veelvoud levert wampum op");

  const zonderBoon = maakInitieleSpelStatus("going-west");
  const naZonderBoon = verwerkOudeHandelsrouteBoon(zonderBoon, OUDE_HANDELSROUTE_INTERVAL_BEURTEN);
  assert.equal(naZonderBoon.wampum, zonderBoon.wampum, "zonder de Boon geen wampum, ook niet op een interval-beurt");
});

test("pasBoonEffectToe opent bij Zegeningen van het Moederland een moederland-keuze in plaats van een meteen-effect (issue #540)", () => {
  const state = maakInitieleSpelStatus("going-west");
  assert.equal(state.moederlandKeuzeEvent, undefined);

  const na = pasBoonEffectToe(state, "zegeningen-van-het-moederland");
  assert.equal(na.moederlandKeuzeEvent, true);
  assert.equal(na.gekozenMoederland, undefined, "nog geen moederland gekozen, alleen de keuze-pop-up staat open");
});

test("moederlandMetId vindt elk moederland uit MOEDERLANDEN op id, en undefined voor een onbekend id (issue #540)", () => {
  for (const moederland of MOEDERLANDEN) {
    assert.deepEqual(moederlandMetId(moederland.id), moederland);
  }
});

test("kiesMoederland legt de keuze vast en sluit de keuze-pop-up, maar negeert een aanroep zonder openstaande keuze (issue #540)", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, moederlandKeuzeEvent: true };

  const na = kiesMoederland(state, "duitsland");
  assert.equal(na.gekozenMoederland, "duitsland");
  assert.equal(na.moederlandKeuzeEvent, undefined, "de keuze-pop-up sluit zodra er gekozen is");

  const zonderOpenstaandeKeuze = maakInitieleSpelStatus("going-west");
  const naZonderOpenstaandeKeuze = kiesMoederland(zonderOpenstaandeKeuze, "ierland");
  assert.equal(naZonderOpenstaandeKeuze, zonderOpenstaandeKeuze, "geen openstaande keuze, dus geen effect");
});

test("verwerkZegeningenVanHetMoederlandBoon levert alleen op een interval-beurt de grondstof van het gekozen moederland, en alleen aan een speler die de Boon bezit én al gekozen heeft (issue #540)", () => {
  let state = maakInitieleSpelStatus("going-west");
  state = { ...state, boons: ["zegeningen-van-het-moederland"], gekozenMoederland: "duitsland" };

  const nietOpInterval = verwerkZegeningenVanHetMoederlandBoon(state, ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN - 1);
  assert.equal(nietOpInterval.voorraad.hout, state.voorraad.hout, "geen lading vóór het interval");

  const opInterval = verwerkZegeningenVanHetMoederlandBoon(state, ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN);
  assert.equal(
    opInterval.voorraad.hout,
    state.voorraad.hout + ZEGENINGEN_VAN_HET_MOEDERLAND_LADING,
    "Duitsland levert hout op elk veelvoud van het interval"
  );

  const zonderBoon = maakInitieleSpelStatus("going-west");
  const naZonderBoon = verwerkZegeningenVanHetMoederlandBoon(zonderBoon, ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN);
  assert.equal(naZonderBoon.voorraad.hout, zonderBoon.voorraad.hout, "zonder de Boon geen lading, ook niet op een interval-beurt");

  const zonderKeuze = { ...zonderBoon, boons: ["zegeningen-van-het-moederland"] };
  const naZonderKeuze = verwerkZegeningenVanHetMoederlandBoon(zonderKeuze, ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN);
  assert.equal(naZonderKeuze.voorraad.hout, zonderKeuze.voorraad.hout, "zonder gekozen moederland (keuze-pop-up nog open) geen lading");

  // Ierland levert voedsel, dat geen gedeelde opslag-cap kent (zie
  // `MateriaalType`, types.ts) — aparte assertie op `state.voedsel`.
  let ierlandState = maakInitieleSpelStatus("going-west");
  ierlandState = { ...ierlandState, boons: ["zegeningen-van-het-moederland"], gekozenMoederland: "ierland" };
  const naIerland = verwerkZegeningenVanHetMoederlandBoon(ierlandState, ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN);
  assert.equal(naIerland.voedsel, ierlandState.voedsel + ZEGENINGEN_VAN_HET_MOEDERLAND_LADING);

  // Erts (Engeland) en steen (Italië) kappen aan de gedeelde opslag-cap,
  // zelfde patroon als elders in dit bestand (`VOORRAADSCHUUR_OPSLAG_BONUS`).
  let vollePakhuis = maakInitieleSpelStatus("going-west");
  vollePakhuis = {
    ...vollePakhuis,
    boons: ["zegeningen-van-het-moederland"],
    gekozenMoederland: "engeland",
    voorraad: { ...vollePakhuis.voorraad, erts: vollePakhuis.opslagCap },
  };
  const naVollePakhuis = verwerkZegeningenVanHetMoederlandBoon(vollePakhuis, ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN);
  assert.equal(naVollePakhuis.voorraad.erts, vollePakhuis.opslagCap, "erts kapt aan de opslag-cap, loopt niet erover");
});
