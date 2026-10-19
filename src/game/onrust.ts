// Onrust (issue: "Onrust, Saloon en Courthouse", Going West-exclusief):
// zodra een streek meer dan `ONRUST_DREMPEL` improvements bevat, veroorzaakt
// elk improvement daarna onrust — een lineaire, tunebare productie-penalty
// op alle land-improvements van die streek. Bewust een puur afgeleide
// waarde (geen los `GameState`-veld, dus ook geen save-migratie nodig) —
// zelfde soort pure-functie-aanpak als `stadEffectiviteit` (stad.ts) en
// `heeftBeschermendeWachttoren` (indringersEnDieren.ts): onrust volgt
// volledig uit de al aanwezige tiles/rechters, nooit uit eigen state.
//
// Ghost towns tellen niet mee (issue, sectie 3a: "het produceert toch al
// niets meer, dus het moet ook niet meer bijdragen aan de onrust") — een
// oudere streek lost zijn onrust dus vanzelf op zodra improvements daar
// uitgeput raken, zonder een uitzondering op de frontier-only-bouwregel.
// Saloon en Courthouse tellen zelf nooit mee als onrust-veroorzakend
// improvement (issue-comments): zonder deze uitzondering zou het bouwen van
// een Saloon/Courthouse op een al volle streek zijn eigen nettoresultaat
// meteen weer tenietdoen.
//
// Dit hele mechanisme is Going West-exclusief (zie de `campagneId`-checks bij
// elke aanroeper — productie.ts, tileInfo.ts) — de tutorial blijft zo
// volledig ongewijzigd, ook als een tutorial-streek toevallig meer dan 3
// improvements draagt.

import { metActieveStad } from "./stad";
import { GameState, Rechter, Streek } from "./types";
import { isTileVerbondenMetStad } from "./wegen";

// Vanaf het (drempel+1)e improvement op een streek ontstaat onrust (issue
// #450: "de onrust pas bij 4 gebouwen ipv 3" — oorspronkelijk gaf het 4e
// improvement al de eerste onrust, nu pas het 5e).
export const ONRUST_DREMPEL = 4;

// Productie-multiplier zodra een streek onrust heeft (issue "Onrust heftiger":
// "de onrust verlaagt de productie op de streek met 50 procent") — een vaste
// halvering, ongeacht hoeveel onrust-punten er zijn. Bewust een alles-of-niets
// grens in plaats van de eerdere lineaire 10%/punt (plafond 40%): Saloon en
// Courthouse krijgen zo meer impact en een streek op 0 onrust houden wordt een
// echte puzzel. Tunebaar zolang de balans nog niet vastligt (hoofdstuk 13/14
// van het design-document).
export const ONRUST_PRODUCTIE_MULTIPLIER = 0.5;

const ONRUST_UITGESLOTEN_IMPROVEMENT_IDS = new Set(["saloon", "courthouse"]);

// Telt de improvements die meetellen voor de onrust-drempel op `streek`:
// gebouwd of in aanbouw (neemt dus al een bouwvakje in), geen ghost town
// (sectie 3a), geen vijandelijke Bezette-Streek-tile (niet door de speler
// gebouwd) en niet de Saloon/Courthouse zelf (issue-comments).
function telOnrustVerhogendeImprovements(streek: Streek): number {
  return streek.tiles.filter(
    (tile) =>
      (tile.status === "actief" || tile.status === "in_aanbouw") &&
      tile.improvement !== undefined &&
      !tile.improvement.vijandelijk &&
      !ONRUST_UITGESLOTEN_IMPROVEMENT_IDS.has(tile.improvement.id)
  ).length;
}

// Net als `vindWerkendeWachttorenTile` (indringersEnDieren.ts) en
// `heeftWerkendeLegerkampOpStreek` (militair.ts) telt een niet-wegverbonden
// Saloon/Courthouse wel als gebouwd, maar (nog) niet als werkend (issue "Weg
// naar saloon": beide misten deze check, terwijl elk ander niet-productie
// land-improvement 'm al had).
function heeftActieveSaloon(streken: Streek[], streek: Streek): boolean {
  return streek.tiles.some(
    (tile) =>
      tile.status === "actief" &&
      tile.improvement?.id === "saloon" &&
      isTileVerbondenMetStad(streken, streek.hoogte, tile.positieInStreek)
  );
}

function vindCourthouseTile(streken: Streek[], streek: Streek) {
  return streek.tiles.find(
    (tile) =>
      tile.status === "actief" &&
      tile.improvement?.id === "courthouse" &&
      isTileVerbondenMetStad(streken, streek.hoogte, tile.positieInStreek)
  );
}

// Of `streek` een actief, wegverbonden, door een Rechter bemand Courthouse
// draagt (zelfde bemand/onbemand-onderscheid als `isWachttorenBemand`,
// indringersEnDieren.ts).
function heeftBemandCourthouse(streken: Streek[], rechters: Rechter[], streek: Streek): boolean {
  const tile = vindCourthouseTile(streken, streek);
  if (!tile) return false;
  return rechters.some(
    (rechter) => rechter.courthouse?.hoogte === streek.hoogte && rechter.courthouse?.positieInStreek === tile.positieInStreek
  );
}

// Aantal streken boven zijn eigen streek dat een bemand Courthouse beschermt
// (issue "Courthouse beter": opgehoogd van 2 naar 7, omdat het Courthouse zo
// duur is dat het ook meer effect moet hebben). Tunebaar.
export const COURTHOUSE_BEREIK_OMHOOG = 7;

// De hoogten die een bemand Courthouse beschermt: de eigen streek en
// `COURTHOUSE_BEREIK_OMHOOG` streken direct erboven — anders dan de Wachttoren
// (die naar beneden beschermt, zie `vindBeschermendeWachttoren` in
// indringersEnDieren.ts) dus uitsluitend omhoog.
function beschermdeHoogtenDoorCourthouse(courthouseStreekHoogte: number): number[] {
  return Array.from({ length: COURTHOUSE_BEREIK_OMHOOG + 1 }, (_, i) => courthouseStreekHoogte + i);
}

// Onrust op `streek` — 0 zolang een bemand Courthouse op deze streek of op
// een van de `COURTHOUSE_BEREIK_OMHOOG` streken direct eronder deze streek
// beschermt (issues "Courthouse streken" en "Courthouse beter"), anders het
// aantal onrust-veroorzakende improvements voorbij `ONRUST_DREMPEL` — en
// ook 0 zolang er een actieve, wegverbonden Saloon op deze streek staat
// (issue "Saloon beter": de Saloon haalt de onrust helemaal weg, niet met 1).
export function onrustOpStreek(streken: Streek[], rechters: Rechter[], streek: Streek): number {
  const beschermd = streken.some(
    (andere) =>
      heeftBemandCourthouse(streken, rechters, andere) && beschermdeHoogtenDoorCourthouse(andere.hoogte).includes(streek.hoogte)
  );
  if (beschermd) return 0;
  if (heeftActieveSaloon(streken, streek)) return 0;

  return Math.max(0, telOnrustVerhogendeImprovements(streek) - ONRUST_DREMPEL);
}

// Productie-multiplier voor een gegeven onrust-waarde: 1 zonder onrust,
// `ONRUST_PRODUCTIE_MULTIPLIER` (0.5) zodra er onrust is.
export function onrustProductieMultiplier(onrust: number): number {
  return onrust > 0 ? ONRUST_PRODUCTIE_MULTIPLIER : 1;
}

// Alle actieve, nog onbemande Courthouse-tiles over alle streken heen —
// zelfde soort lijst als `onbemandeWachttorenPosities` (militair.ts), voor
// de tile-info-pop-up (TileInfoPopup: `courthouseVraag`).
export function isCourthouseBemand(rechters: Rechter[], hoogte: number, positieInStreek: number): boolean {
  return rechters.some(
    (rechter) => rechter.courthouse?.hoogte === hoogte && rechter.courthouse?.positieInStreek === positieInStreek
  );
}

// Bemant een Courthouse met een specifieke Rechter — zelfde interactiepatroon
// als `bemanWachttoren` (militair.ts): een Rechter heeft hoogstens één
// toewijzing tegelijk, en toewijzen is omkeerbaar/instant via
// `haalRechterTerug` hieronder.
export function bemanCourthouse(state: GameState, rechterId: string, hoogte: number, positieInStreek: number): GameState {
  const rechter = state.stad.rechters.find((r) => r.id === rechterId);
  if (!rechter || rechter.courthouse) return state;

  const streek = state.streken.find((l) => l.hoogte === hoogte);
  const tile = streek?.tiles[positieInStreek];
  if (!tile || tile.status !== "actief" || tile.improvement?.id !== "courthouse") return state;
  if (isCourthouseBemand(state.stad.rechters, hoogte, positieInStreek)) return state;

  const rechters = state.stad.rechters.map((r) => (r.id === rechterId ? { ...r, courthouse: { hoogte, positieInStreek } } : r));

  return metActieveStad(state, { ...state.stad, rechters });
}

// Haalt een bemande Rechter terug van zijn Courthouse — zelfde
// omkeerbare/instante actie als `haalStrijderTerug` (militair.ts): het
// Courthouse raakt meteen onbemand (en verliest daarmee zijn
// onrust-onderdrukkende effect), de Rechter is meteen weer elders inzetbaar.
export function haalRechterTerug(state: GameState, rechterId: string): GameState {
  const rechter = state.stad.rechters.find((r) => r.id === rechterId);
  if (!rechter || !rechter.courthouse) return state;

  const rechters = state.stad.rechters.map((r) => (r.id === rechterId ? { ...r, courthouse: undefined } : r));

  return metActieveStad(state, { ...state.stad, rechters });
}
