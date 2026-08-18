// Uitputting & ghost towns (M4): elke actief-producerende land-improvement
// telt af vanaf `uitputtingBeurten` (hoofdstuk 4/7) — pas zodra hij ook
// wegverbonden is met de stad (hoofdstuk 16), zie `verwerkUitputting`. Bij
// nul wordt de tile een permanente, onbebouwbare ghost-town-tile die niet
// meer produceert.
//
// Verval (M6, hoofdstuk 4): zodra voedsel (issue: "stad instort of verlaten
// alleen als er te weinig voedsel is") binnen een paar beurten op zou raken,
// verschijnt een "kritiek"-waarschuwing; blijft dat zo tot de voorraad
// daadwerkelijk nul bereikt, dan stort de stad in. Land-uitputting (M4) leidt
// zelf niet meer tot instorting — alleen tot minder producerende tiles, wat
// de voedselbalans indirect onder druk kan zetten. In de MVP (hoofdstuk 13:
// één stad, nog geen frontier-verplaatsing) is er geen volgende stad om
// naartoe te gaan, dus eindigt een volledige ineenstorting de hele run: de
// speler begint de tutorial opnieuw (hoofdstuk 4/11, permadeath-risico op
// run-niveau i.p.v. alleen stadsniveau).

import { City, GameState, MateriaalType } from "./types";
import { hoogsteOntgrendeldeStreek } from "./world";
import { isTileVerbondenMetStad } from "./wegen";
import { berekenVoedselNetto } from "./productie";
import { maakInitieleSpelStatus } from "./initieleSpelStatus";
import { metActieveStad } from "./stad";

// Voedseltekort-tuning (M6, hoofdstuk 4/14; issue: "stad instort of verlaten
// alleen als er te weinig voedsel is"): bewuste MVP-placeholder, net als de
// overige nog niet vastgelegde balansgetallen. De waarschuwing verschijnt
// zodra de voorraad — bij het huidige productie/verbruikstempo — naar
// verwachting binnen `VOEDSEL_WAARSCHUWING_BEURTEN` beurten op zou raken.
const VOEDSEL_WAARSCHUWING_BEURTEN = 5;

// Telt de resterende levensduur van elke actief-producerende land-improvement
// af. Bij nul wordt de tile een permanente ghost-town-tile: onbebouwbaar en
// stopt met produceren (zie verwerkProductie in productie.ts, die alleen
// "actief"-tiles meetelt). City-tiles en tiles zonder `uitputtingBeurten`
// slaan we over (hoofdstuk 4: alleen land-improvements putten uit).
//
// Wegverbinding (hoofdstuk 4/16; issue: "land uitputting pas als het gebruikt
// wordt"): een gebouwde maar nog niet wegverbonden land-improvement produceert
// niets (zie `verwerkProductie`), dus put hij ook niets uit — de teller blijft
// stilstaan op zijn huidige waarde tot de wegverbinding er is. Dezelfde regel
// geldt zodra een verbinding later zou wegvallen: geen productie betekent
// geen uitputting, ongeacht de oorzaak.
export function verwerkUitputting(state: GameState): GameState {
  const streken = state.streken.map((streek) => ({
    ...streek,
    tiles: streek.tiles.map((tile) => {
      if (tile.status !== "actief" || tile.beurtenTotUitputting === undefined) {
        return tile;
      }

      if (
        tile.improvement?.soort === "land" &&
        !isTileVerbondenMetStad(state.streken, streek.hoogte, tile.positieInStreek)
      ) {
        return tile;
      }

      const resterend = tile.beurtenTotUitputting - 1;
      if (resterend <= 0) {
        return { ...tile, status: "ghost_town" as const, beurtenTotUitputting: undefined };
      }

      return { ...tile, beurtenTotUitputting: resterend };
    }),
  }));

  return { ...state, streken };
}

// Telt de gebouwde land-tiles (actief + ghost_town) en hoeveel daarvan al
// zijn uitgeput — de basis voor de "kritiek"-verval-drempel (M6, hoofdstuk 4).
// City-tiles tellen niet mee (alleen land put uit, zie ook verwerkUitputting).
function telLandTiles(state: GameState): { totaal: number; ghostTowns: number } {
  let totaal = 0;
  let ghostTowns = 0;

  for (const streek of state.streken) {
    for (const tile of streek.tiles) {
      const isGebouwdeLandTile =
        tile.improvement?.soort === "land" &&
        (tile.status === "actief" || tile.status === "ghost_town");
      if (!isGebouwdeLandTile) continue;

      totaal += 1;
      if (tile.status === "ghost_town") ghostTowns += 1;
    }
  }

  return { totaal, ghostTowns };
}

// Verval (M6, hoofdstuk 4; issue: "stad instort of verlaten alleen als er te
// weinig voedsel is"): zodra de voedselvoorraad — bij het huidige
// productie/verbruikstempo — naar verwachting binnen
// `VOEDSEL_WAARSCHUWING_BEURTEN` beurten op zou raken, verschijnt een
// zichtbare "kritiek"-waarschuwing. Bouwt de speler op tijd een Boerderij (of
// verhoogt anderszins de netto voedselproductie), dan wordt de stad weer
// "gezond" en blijft alles behouden. Bereikt de voorraad daadwerkelijk nul,
// dan stort de stad in — de centrale risk/reward-gok van elke stad-episode.
// Omdat de MVP maar één stad kent (hoofdstuk 13), is er geen volgende stad om
// de run mee door te laten lopen: de hele run eindigt en de tutorial herstart
// vanaf een verse spelstatus (hoofdstuk 4/11).
export function verwerkVerval(state: GameState): GameState {
  if (state.voedsel <= 0) {
    // Volledige ineenstorting (issue: "run eindigen wanneer stad uitgeput
    // is" / "stad instort ... als er te weinig voedsel is"): de run zelf
    // eindigt hier, niet alleen de groei-tier/relics van de stad — een verse
    // spelstatus, met de ineenstortingsvlag erbovenop zodat de UI het
    // game-over-scherm toont tot de speler bevestigt. `laatsteRunStatistieken`
    // is een momentopname van de net geëindigde run (issue: "beurten/steden/
    // streken tonen op het game-over-scherm") — moet vóór de reset genomen
    // worden, anders is er niets meer over om te tonen.
    return {
      ...maakInitieleSpelStatus(),
      laatsteIneenstorting: true,
      laatsteRunStatistieken: {
        beurten: state.beurt,
        stedenGebouwd: state.steden.length,
        hoogsteStreek: hoogsteOntgrendeldeStreek(state.streken),
      },
    };
  }

  const netto = berekenVoedselNetto(state);
  const beurtenTotTekort = netto >= 0 ? Infinity : Math.ceil(state.voedsel / -netto);
  const isDreiging = beurtenTotTekort <= VOEDSEL_WAARSCHUWING_BEURTEN;

  if (!isDreiging) {
    if (state.stad.vervalStatus === "gezond") return state;
    return metActieveStad(state, { ...state.stad, vervalStatus: "gezond", vervalBeurtenResterend: undefined });
  }

  return metActieveStad(state, { ...state.stad, vervalStatus: "kritiek", vervalBeurtenResterend: beurtenTotTekort });
}

// Sluit het ineenstortingsscherm (issue: "intro en game over scherm"). Puur
// een UI-bevestiging — de daadwerkelijke gevolgen van de ineenstorting (de
// volledige run-reset) zijn al door `verwerkVerval` toegepast op het moment
// dat de vlag gezet werd.
export function bevestigIneenstorting(state: GameState): GameState {
  return { ...state, laatsteIneenstorting: false, laatsteRunStatistieken: undefined };
}

// Statistieken voor het historiescherm van de lopende run (issue:
// "spel-icoontje ... historie van deze run ... aantal improvements gebouwd,
// hoeveel vervallen, hoeveel steden, en je grootste stad"; uitgebreid met
// issue "Settings uitbreiden": aanvallen, afgeslagen aanvallen, gesloopte
// wachttorens en gegeven tribuut). Hergebruikt `telLandTiles` (M6) —
// "gebouwd" telt hier voltooide land-tiles (actief + ghost_town), dezelfde
// definitie als de verval-drempel gebruikt. De indringers-cijfers komen
// rechtstreeks uit `state.indringersStatistieken` (zie types.ts) — die
// worden al bijgehouden door `verwerkIndringers`/`geefTribuut`
// (indringersEnDieren.ts), hier alleen doorgegeven.
export function berekenHistorieStatistieken(state: GameState): {
  improvementenGebouwd: number;
  vervallen: number;
  steden: number;
  grootsteStad: City["grootte"];
  aanvallenTotaal: number;
  aanvallenAfgeslagen: number;
  wachttorensGesloopt: number;
  tribuutGegevenAantal: number;
  tribuutGegeven: Record<MateriaalType, number>;
} {
  const { totaal, ghostTowns } = telLandTiles(state);
  return {
    improvementenGebouwd: totaal,
    vervallen: ghostTowns,
    steden: 1, // MVP: precies 1 stad per run (hoofdstuk 13)
    grootsteStad: state.stad.grootte,
    aanvallenTotaal: state.indringersStatistieken.aanvallenTotaal,
    aanvallenAfgeslagen: state.indringersStatistieken.aanvallenAfgeslagen,
    wachttorensGesloopt: state.indringersStatistieken.wachttorensGesloopt,
    tribuutGegevenAantal: state.indringersStatistieken.tribuutGegevenAantal,
    tribuutGegeven: state.indringersStatistieken.tribuutGegeven,
  };
}
