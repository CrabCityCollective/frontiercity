import test from "node:test";
import assert from "node:assert/strict";
import { bouwStagneertVolgendeBeurt, RUSH_GOUD_PER_BEURT, rushKostenGoud, versnelBouwMetGoud } from "./bouwwachtrij";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { startRecrutering } from "./groeiEnRekrutering";
import { startBouw } from "./infrastructuurEnBouw";
import { AMBERADER, SOLDAAT } from "./improvements";

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
