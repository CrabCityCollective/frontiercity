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

// Vanaf het (drempel+1)e improvement op een streek ontstaat onrust (issue
// #450: "de onrust pas bij 4 gebouwen ipv 3" — oorspronkelijk gaf het 4e
// improvement al de eerste onrust, nu pas het 5e).
export const ONRUST_DREMPEL = 4;

// Productie-penalty per onrust-punt en het plafond daarop (issue, sectie 1:
// "percentage-gebaseerde penalty die meeschaalt met de onrust-waarde ...
// met een plafond zodat productie niet volledig naar 0 kan zakken") — beide
// bewuste MVP-richtwaarden, tunebaar zolang de balans nog niet vastligt
// (hoofdstuk 13/14 van het design-document).
export const ONRUST_PRODUCTIE_PENALTY_PER_PUNT = 0.1;
export const ONRUST_PRODUCTIE_MULTIPLIER_MIN = 0.4;

// Statische verlaging door een actieve Saloon (issue, sectie 2: "vermindert
// onrust op de eigen streek met 1 ... zolang de Saloon blijft staan").
export const SALOON_ONRUST_VERMINDERING = 1;

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

function heeftActieveSaloon(streek: Streek): boolean {
  return streek.tiles.some((tile) => tile.status === "actief" && tile.improvement?.id === "saloon");
}

function vindCourthouseTile(streek: Streek) {
  return streek.tiles.find((tile) => tile.status === "actief" && tile.improvement?.id === "courthouse");
}

// Of `streek` een actief, door een Rechter bemand Courthouse draagt (zelfde
// bemand/onbemand-onderscheid als `isWachttorenBemand`,
// indringersEnDieren.ts).
function heeftBemandCourthouse(rechters: Rechter[], streek: Streek): boolean {
  const tile = vindCourthouseTile(streek);
  if (!tile) return false;
  return rechters.some(
    (rechter) => rechter.courthouse?.hoogte === streek.hoogte && rechter.courthouse?.positieInStreek === tile.positieInStreek
  );
}

// De drie hoogten die een bemand Courthouse beschermt (issue "Courthouse
// streken"): de eigen streek en de twee streken direct erboven — anders dan
// de Wachttoren (die naar beneden beschermt, zie `vindBeschermendeWachttoren`
// in indringersEnDieren.ts) dus uitsluitend omhoog, en twee streken diep in
// plaats van één.
function beschermdeHoogtenDoorCourthouse(courthouseStreekHoogte: number): number[] {
  return [courthouseStreekHoogte, courthouseStreekHoogte + 1, courthouseStreekHoogte + 2];
}

// Onrust op `streek` — 0 zolang een bemand Courthouse op deze streek of op
// een van de twee streken direct eronder deze streek beschermt (issue
// "Courthouse streken": "de courthouse zijn eigen streek en de 2 streken
// daarboven voorziet ... daar gaat de onrust nooit boven 0"), anders het
// aantal onrust-veroorzakende improvements voorbij `ONRUST_DREMPEL`,
// verminderd met `SALOON_ONRUST_VERMINDERING` zolang er een actieve Saloon
// op deze streek staat.
export function onrustOpStreek(streken: Streek[], rechters: Rechter[], streek: Streek): number {
  const beschermd = streken.some(
    (andere) =>
      heeftBemandCourthouse(rechters, andere) && beschermdeHoogtenDoorCourthouse(andere.hoogte).includes(streek.hoogte)
  );
  if (beschermd) return 0;

  const aantal = telOnrustVerhogendeImprovements(streek);
  let onrust = Math.max(0, aantal - ONRUST_DREMPEL);
  if (heeftActieveSaloon(streek)) onrust = Math.max(0, onrust - SALOON_ONRUST_VERMINDERING);
  return onrust;
}

// Productie-multiplier voor een gegeven onrust-waarde (issue, sectie 1),
// geclamped op `ONRUST_PRODUCTIE_MULTIPLIER_MIN` zodat productie nooit
// volledig naar 0 zakt.
export function onrustProductieMultiplier(onrust: number): number {
  return Math.max(ONRUST_PRODUCTIE_MULTIPLIER_MIN, 1 - onrust * ONRUST_PRODUCTIE_PENALTY_PER_PUNT);
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
