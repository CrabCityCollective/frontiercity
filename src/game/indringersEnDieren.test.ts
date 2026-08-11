import test from "node:test";
import assert from "node:assert/strict";
import { jaag, verplaatsSettlerNaar } from "./acties";
import { maakInitieleSpelStatus, volgendeBeurt } from "./economie";
import { startNieuweSettler } from "./groeiEnRekrutering";
import {
  bevestigAmberOnderVuur,
  bevestigGedwongenTribuut,
  geefTribuut,
  kiesGeefTribuut,
  weigerTribuut,
} from "./indringersEnDieren";
import { startBouw } from "./infrastructuurEnBouw";
import { AMBERADER } from "./improvements";
import { GameState } from "./types";
import { metSettlerOpKuddeVakje, metRandomReeks, metVasteRandom, WACHTTOREN } from "./testHelpers";

test("een roofdier valt pas de beurt ná verschijnen aan, en doodt de settler als die er dan nog op staat", () => {
  let state = metSettlerOpKuddeVakje(5);
  state = metVasteRandom(0, () => jaag(state));
  assert.deepEqual(state.streken.find((l) => l.hoogte === 5)!.tiles[0].roofdier, { beurtenTotAanval: 1 });

  // Eerste beurtovergang: de reactietijd, geen aanval.
  state = volgendeBeurt(state);
  assert.notEqual(state.settler, undefined, "de settler overleeft de eerste beurtovergang (reactietijd)");
  assert.deepEqual(state.streken.find((l) => l.hoogte === 5)!.tiles[0].roofdier, { beurtenTotAanval: 0 });

  // Tweede beurtovergang: de settler is niet weggegaan, dus de aanval slaat toe.
  state = volgendeBeurt(state);
  assert.equal(state.settler, undefined, "de settler sterft als hij op het roofdier-vakje bleef staan");
  assert.equal(state.settlerVerlorenAanRoofdier, true);
  assert.deepEqual(state.roofdierEvent, { hoogte: 5, positieInStreek: 0, fase: "aanval" });
  assert.equal(state.streken.find((l) => l.hoogte === 5)!.tiles[0].roofdier, undefined);
});

test("de settler overleeft een roofdier als hij op tijd wegbeweegt", () => {
  let state = metSettlerOpKuddeVakje(5);
  state = metVasteRandom(0, () => jaag(state));

  state = volgendeBeurt(state); // reactietijd
  state = verplaatsSettlerNaar(state, 5, 1);
  assert.deepEqual(state.settler, { hoogte: 5, positieInStreek: 1 }, "de settler moet daadwerkelijk verplaatst zijn");

  state = volgendeBeurt(state); // de aanval, maar de settler staat er niet meer
  assert.deepEqual(state.settler, { hoogte: 5, positieInStreek: 1 }, "de settler overleeft");
  assert.equal(state.settlerVerlorenAanRoofdier, undefined);
  assert.equal(state.streken.find((l) => l.hoogte === 5)!.tiles[0].roofdier, undefined);
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
    streken: state.streken.map((streek) => (streek.hoogte === 4 ? { ...streek, ontgrendeld: true } : streek)),
  };

  state = metVasteRandom(0, () => volgendeBeurt(state));

  assert.notEqual(state.kuddeEvent, undefined, "een gunstige worp op een ontgrendelde streek 4 moet een kudde melden");
  const gemeldeStreek = state.streken.find((l) => l.hoogte === state.kuddeEvent!.hoogte)!;
  const tile = gemeldeStreek.tiles[state.kuddeEvent!.positieInStreek];
  assert.deepEqual(tile.kudde, { beurtenResterend: 4 });
});

// Issue: "Eerste streek gegarandeerd een kudde" — zonder deze garantie hing
// de allereerste jachtkans volledig af van de willekeurige `verwerkKuddes`-
// trekking (5% per beurt), wat bij pech de startvoorraad voedsel kon laten
// opraken vóór er ooit een kudde verscheen (jacht is de enige voedselbron tot
// de Boerderij op streek 3).
test("maakInitieleSpelStatus garandeert een kudde op streek 1, zodat de eerste jacht nooit van toeval afhangt", () => {
  const state = maakInitieleSpelStatus();
  const streek1 = state.streken.find((l) => l.hoogte === 1)!;
  const kuddeTiles = streek1.tiles.filter((tile) => tile.kudde !== undefined);

  assert.equal(kuddeTiles.length, 1, "precies één gegarandeerde startkudde op streek 1");
  assert.deepEqual(kuddeTiles[0].kudde, { beurtenResterend: 4 });
  assert.notEqual(kuddeTiles[0].status, "actief", "de startkudde staat niet op het stad-vakje");
});

test("een werkende Wachttoren beschermt ook de streek eronder, niet alleen zijn eigen streek (issue: wachttoren beschermt 2 streken)", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    stad: { ...state.stad, strijders: [{ id: "strijder-1", wachttoren: { hoogte: 2, positieInStreek: 4 } }] },
    streken: state.streken.map((streek) =>
      streek.hoogte === 2
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 4
                ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true }
                : tile
            ),
          }
        : streek
    ),
  };

  // Kans 0 dwingt zowel het incident zelf als de streek-trekking af. Streek 2
  // bevat verder niets dan de Wachttoren en doet dus niet mee in de trekking
  // (`isAlleenWachttorenStreek`) — met alleen streek 1 en 2 ontgrendeld valt het
  // incident daardoor gegarandeerd op streek 1, de streek onder de Wachttoren.
  state = metVasteRandom(0, () => volgendeBeurt(state));

  assert.equal(state.indringersEvent?.streekHoogte, 1);
  assert.equal(
    state.indringersEvent?.heeftWachttoren,
    true,
    "de bemande, wegverbonden Wachttoren op streek 2 moet ook streek 1 (de streek eronder) beschermen"
  );
});

test("een streek met een actieve Amberader weegt zwaarder mee in de indringers-streek-trekking (issue: Amberader bonus/malus-koppeling)", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === 2
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 4 ? { ...tile, status: "actief" as const, improvement: AMBERADER } : tile
            ),
          }
        : streek
    ),
  };

  // Twee ontgrendelde streken doen mee: streek 1 (gewoon, gewicht 1) en streek 2
  // (actieve Amberader, gewicht 2) — totaalgewicht 3, drempel voor streek 1 ligt
  // dus op 1/3. Bij een zuiver uniforme trekking zou 0.4 nog altijd op streek 1
  // uitkomen (floor(0.4 * 2) = 0); met de Amberader-weging (0.4 > 1/3) komt
  // dezelfde randomwaarde juist op streek 2 uit — het bewijs dat de weging
  // daadwerkelijk effect heeft. De derde waarde (stamnaam-trekking) is
  // irrelevant voor deze assertie.
  state = metRandomReeks([0, 0.4, 0], () => volgendeBeurt(state));

  assert.equal(
    state.indringersEvent?.streekHoogte,
    2,
    "de streek met de actieve Amberader moet bij dubbel gewicht op deze randomwaarde geloot worden, niet de gewone streek"
  );
});

test("een uitgeputte Amberader (ghost town) telt niet meer mee voor het extra indringers-gewicht", () => {
  let state = maakInitieleSpelStatus();
  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === 2
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 4 ? { ...tile, status: "ghost_town" as const, improvement: AMBERADER } : tile
            ),
          }
        : streek
    ),
  };

  // Zelfde randomwaarde als hierboven (0.4), maar nu is de Amberader
  // uitgeput: beide streken wegen even zwaar (gewicht 1), dus dit gedraagt zich
  // weer als de gewone uniforme trekking en komt op streek 1 uit.
  state = metRandomReeks([0, 0.4, 0], () => volgendeBeurt(state));

  assert.equal(
    state.indringersEvent?.streekHoogte,
    1,
    "een uitgeputte Amberader mag geen verhoogd gewicht meer geven — een lege put trekt niemand meer"
  );
});

// Gedeelde opzet voor de derde-uitkomst-tests hieronder (issue: "wachttorens
// kunnen vernietigd worden door indringers"): streek 2 krijgt een voltooide,
// bemande, wegverbonden Wachttoren die (via "wachttoren beschermt 2 streken")
// streek 1 beschermt — zelfde opzet als de bestaande beschermings-test
// hierboven, zodat het incident gegarandeerd op de beschermde streek 1 valt.
function metBeschermdeStreek(): GameState {
  let state = maakInitieleSpelStatus();
  return {
    ...state,
    stad: { ...state.stad, strijders: [{ id: "strijder-1", wachttoren: { hoogte: 2, positieInStreek: 4 } }] },
    streken: state.streken.map((streek) =>
      streek.hoogte === 2
        ? {
            ...streek,
            ontgrendeld: true,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 4
                ? { ...tile, status: "actief" as const, improvement: WACHTTOREN, heeftWeg: true }
                : tile
            ),
          }
        : streek
    ),
  };
}

test("malus-uitkomst: een beschermde streek kan de Wachttoren toch verliezen (issue: wachttorens kunnen vernietigd worden door indringers) — dit passieve incident blijft de Wachttoren zelf raken, anders dan de lichtere straf van een verloren Confrontatie tegen een Bezette Streek (issue: laatste confrontatie tweaken)", () => {
  let state = metBeschermdeStreek();

  // kans-check (0) → incident; streek-trekking (0) → streek 1 (de beschermde
  // streek); stamnaam (0); uitkomst-worp (0.9, tussen 0.85 en 0.95) → malus.
  state = metRandomReeks([0, 0, 0, 0.9], () => volgendeBeurt(state));

  assert.equal(state.indringersEvent?.streekHoogte, 1);
  assert.equal(state.indringersEvent?.heeftWachttoren, true);
  assert.equal(state.indringersEvent?.uitkomst, "malus");
  assert.equal(state.indringersEvent?.fase, "malus");

  const wachttorenTile = state.streken.find((l) => l.hoogte === 2)?.tiles[4];
  assert.equal(wachttorenTile?.status, "ruine", "de beschermende Wachttoren-tile vervalt tot ruïne");
  assert.equal(wachttorenTile?.improvement, undefined);
  assert.equal(state.stad.strijders.length, 0, "de bemannende strijder is blijvend verloren, geen reassignment");

  const naHerbouw = startBouw(state, 2, WACHTTOREN, 4);
  const herbouwdeTile = naHerbouw.streken.find((l) => l.hoogte === 2)!.tiles[4];
  assert.equal(herbouwdeTile.status, "in_aanbouw", "een ruïne-tile is, net als een leeg vakje, weer normaal herbouwbaar");
  assert.equal(herbouwdeTile.improvement?.id, "wachttoren");
});

test("bonus-uitkomst: de bemanning buit goud van de indringers (issue: wachttorens kunnen vernietigd worden door indringers)", () => {
  let state = metBeschermdeStreek();
  state = { ...state, voorraad: { ...state.voorraad, goud: 0 } };

  // Zelfde reeks als de malus-test, maar de uitkomst-worp (0.99) valt voorbij
  // 0.95 → bonus.
  state = metRandomReeks([0, 0, 0, 0.99], () => volgendeBeurt(state));

  assert.equal(state.indringersEvent?.uitkomst, "bonus");
  assert.equal(state.indringersEvent?.fase, "bonus");
  assert.equal(state.indringersEvent?.buitGoud, 6);
  assert.equal(state.voorraad.goud, 6, "het buitgemaakte goud is meteen aan de voorraad toegevoegd");

  const wachttorenTile = state.streken.find((l) => l.hoogte === 2)?.tiles[4];
  assert.equal(wachttorenTile?.status, "actief", "de Wachttoren blijft bij een bonus-uitkomst gewoon intact");
  assert.equal(state.stad.strijders.length, 1, "de bemannende strijder blijft bij een bonus-uitkomst behouden");
});

test("een streek met een actieve Amberader krijgt eerst de 'Amberader onder vuur'-aankondiging, óók als de streek beschermd is — pas na bevestigAmberOnderVuur schuift de melding door naar de eigenlijke uitkomst", () => {
  let state = metBeschermdeStreek();
  state = {
    ...state,
    streken: state.streken.map((streek) =>
      streek.hoogte === 1
        ? {
            ...streek,
            tiles: streek.tiles.map((tile) =>
              tile.positieInStreek === 4 ? { ...tile, status: "actief" as const, improvement: AMBERADER } : tile
            ),
          }
        : streek
    ),
  };

  // kans-check (0) → incident; streek-trekking (0) → streek 1 (enige streek die
  // meedoet: streek 2 blijft "alleen een wachttoren" en telt niet mee);
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
      streekHoogte: 2,
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
      streekHoogte: 2,
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
