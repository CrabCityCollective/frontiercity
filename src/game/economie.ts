// Resource-economie (M3): gedeelde opslag met cap voor hout/steen/erts/goud,
// een losse voedselvoorraad, en een productiewachtrij die per beurt
// bouwmateriaal verbruikt tot een improvement voltooid is. Zie
// frontier-city-design-doc.md hoofdstuk 5.
//
// Uitputting & ghost towns (M4): elke actief-producerende land-improvement
// telt af vanaf `uitputtingBeurten` (hoofdstuk 4/7) — pas zodra hij ook
// wegverbonden is met de stad (hoofdstuk 16), zie `verwerkUitputting`. Bij
// nul wordt de tile een permanente, onbebouwbare ghost-town-tile die niet
// meer produceert.
//
// Cultuur & laag-ontgrendeling (M5): cultuur is een voortgangs-valuta zonder
// opslag-cap (hoofdstuk 5). Zodra de cumulatieve cultuur de drempel van de
// eerstvolgende vergrendelde laag haalt, ontgrendelt die laag automatisch
// (fog of war verdwijnt — hoofdstuk 2).
//
// Groei & verval (M6): zodra voedsel de groeidrempel haalt kan de speler
// bewust de groei-tier klein→middel starten (geen automatische ontgrendeling
// zoals cultuur, hoofdstuk 11), die net als een land-improvement een aantal
// beurten rijptijd kost. Voedsel is daarnaast (issue: "stad instort of
// verlaten alleen als er te weinig voedsel is") een echte, per beurt
// verbruikte voorraad: een grotere stad verbruikt meer (zie
// `VOEDSEL_VERBRUIK`). Dreigt die voorraad binnen een paar beurten op te
// raken, dan verschijnt een "kritiek"-waarschuwing; blijft dat zo tot de
// voorraad daadwerkelijk nul bereikt, dan stort de stad in. Land-uitputting
// (M4) leidt zelf niet meer tot instorting — alleen tot minder producerende
// tiles, wat de voedselbalans indirect onder druk kan zetten.
// In de MVP (hoofdstuk 13: één stad, nog geen frontier-verplaatsing) is er
// geen volgende stad om naartoe te gaan, dus eindigt een volledige
// ineenstorting de hele run: de speler begint de tutorial opnieuw
// (hoofdstuk 4/11, permadeath-risico op run-niveau i.p.v. alleen stadsniveau).
//
// Militair (M7, hoofdstuk 6): Soldaat-eenheden rekruteren (zelfde
// wachtrij-patroon als groei) bouwt legerwaarde op, samen met de passieve
// verdedigingsbonus van actieve Wachttoren-tiles. Een confrontatie vergelijkt
// die legerwaarde met de dreiging op de actieve laag via een winkans-formule
// (geen gegarandeerde uitkomst) — winst levert buit op, verlies versnelt de
// uitputting van een deel van de actieve land-tiles (schade, geen
// instant-verlies van de stad zelf).
//
// Wachttoren & indringers (hoofdstuk 6): één keer per beurt een kans dat er
// ergens een indringers-incident plaatsvindt (`verwerkIndringers` hieronder,
// gebruikt door `volgendeBeurt`) — is er een incident, dan wordt de
// getroffen laag geloot uit alle ontgrendelde lagen, ook beschermde. Een
// Wachttoren beschermt de laag waarop hij staat alleen als hij voltooid,
// bemand én via een wegketen met de stad verbonden is (zie hoofdstuk 16);
// anders eisen de indringers tribuut uit de gedeelde opslag, en kiest de
// speler geven (`geefTribuut`) of weigeren (`weigerTribuut`). Heiligdom en
// Wachttoren putten (hoofdstuk 4) bewust niet uit — zie improvements.ts.
//
// Exacte getallen (opslag-cap, kosten, productiesnelheden, uitputtingssnelheid,
// winkans-formule) zijn nog niet vastgelegd in het design-document
// (hoofdstuk 14) — de waarden hieronder zijn bewuste MVP-placeholders, geen
// definitieve balans.

import { improvementPastOpTerrein, SOLDAAT, WOONWIJK } from "./improvements";
import { standaardUitlegAan } from "./save";
import { INDRINGERS_STAMMEN } from "./tutorialContent";
import { City, ConfrontatieResultaat, GameState, Improvement, IndringersTribuut, Layer, MateriaalType, ResourceType, Strijder, Tile } from "./types";
import {
  cultuurKostenVoorLaag,
  hoogsteOntgrendeldeLaag,
  maakInitieleWereld,
  STAD_POSITIE,
  VOEDSEL_DREMPEL_GROEI,
} from "./world";
import { bereikbarePosities, isTileVerbondenMetStad } from "./wegen";

export const OPSLAG_CAP = 30;

// Bouw-ritme (M10, hoofdstuk 16): na een bouwkeuze (of het bewust overslaan
// ervan) mag pas na zoveel beurten weer een nieuw bouwproject gestart worden
// — de tussenliggende beurten zijn voor de settler (wegen aanleggen).
const BOUW_RITME_BEURTEN = 3;

// Voedseltekort-tuning (M6, hoofdstuk 4/14; issue: "stad instort of verlaten
// alleen als er te weinig voedsel is"): bewuste MVP-placeholders, net als de
// overige nog niet vastgelegde balansgetallen. Een grotere stad verbruikt
// meer voedsel per beurt (hoofdstuk 10, laag 10-flavor: "meer monden, minder
// plek om ze allemaal te voeden"). De waarschuwing verschijnt zodra de
// voorraad — bij het huidige productie/verbruikstempo — naar verwachting
// binnen `VOEDSEL_WAARSCHUWING_BEURTEN` beurten op zou raken.
const VOEDSEL_VERBRUIK: Record<City["grootte"], number> = {
  klein: 2,
  middel: 4,
  groot: 6,
};
const VOEDSEL_WAARSCHUWING_BEURTEN = 5;

// Bemannings-voedselverbruik (hoofdstuk 6/11/14, issue: "wachttorens,
// bemanning en bevoorrading"): elke bemande Wachttoren kost 1 voedsel/beurt
// bovenop het stadsverbruik hierboven — een wachtpost moet ook gevoed worden,
// niet alleen bevoorraad met bouwmateriaal. Doorgerekend tegen de
// boerderij-opbrengst (4 voedsel/beurt, zie ECONOMISCH_LAND_IMPROVEMENTS):
// zelfs een kleine stad met maar 1 actieve boerderij houdt na het eigen
// verbruik (2) nog 2 voedsel/beurt over, genoeg voor 2 bemande wachttorens
// zonder in de min te komen; een speler die gaandeweg de tutorial (12 lagen)
// een paar boerderijen bijbouwt, houdt ruim voldoende marge over voor alle
// wachttorens die realistisch nodig zijn (hoofdstuk 11 heeft de volledige
// onderbouwing, hoofdstuk 14 de cijfers) — vandaar geen aanpassing elders in
// de voedseleconomie nodig.
const WACHTTOREN_VOEDSEL_VERBRUIK = 1;

// Militair-tuning (M7, hoofdstuk 6/14): net als de verval-tuning bewuste
// MVP-placeholders. `WINKANS_MIN`/`WINKANS_MAX` zorgen dat een confrontatie
// nooit een gegarandeerde uitkomst is, ook bij extreme krachtsverschillen.
const WINKANS_MIN = 0.05;
const WINKANS_MAX = 0.95;
const BUIT_GOUD_FACTOR = 0.5;
const SCHADE_TILES_AANTAL = 2;
const SCHADE_BEURTEN = 3;

// Strijder-verplaatsing (hoofdstuk 6/11/14, issue: "wachttorens, bemanning en
// bevoorrading"): een teruggehaalde strijder is dit aantal beurten onderweg
// voordat hij weer aan een (andere) Wachttoren toegewezen kan worden — maakt
// terughalen een herziene keuze in plaats van gratis heen-en-weer schuiven,
// zonder er een straf van te maken (zie `haalStrijderTerug` hieronder).
const STRIJDER_VERPLAATSING_BEURTEN = 2;

// Kuddes & settler-jacht (hoofdstuk 16/17; issue: "kuddes met dieren waar je
// op kunt jagen voor voedsel"): een losse settler-actie naast bewegen/weg
// aanleggen. Bewuste MVP-placeholders, net als de overige tuning-getallen
// hierboven. Kuddes verschijnen pas vanaf `KUDDE_MIN_LAAG` (issue: "vanaf
// laag 4 mogen kuddes voorkomen").
const KUDDE_MIN_LAAG = 4;
const KUDDE_KANS = 0.15;
const KUDDE_JACHT_BEURTEN = 4;
const KUDDE_VOEDSEL_PER_BEURT = 3;
// Settler-houtkap (issue: "ook mag je je settlers inzetten om hout te
// kappen. Dan krijg je maar 1 hout per beurt"): een kleinere, directe
// opbrengst zonder improvement te bouwen — geen vervanging van de Houtkap-
// improvement hierboven, maar een alternatief voor de tussenliggende beurten
// (hoofdstuk 16: bouw-ritme).
const HOUTHAKKEN_HOUT_PER_BEURT = 1;

// Startgrondstoffen (issue: "je begint met bijna geen grondstoffen, alleen
// net genoeg om een houtkap te bouwen"): precies genoeg steen voor een
// Houtkap (kosten: `steen: 6`) en niets daarnaast — een Steengroeve, Mijn of
// Boerderij is bij de start dus nog niet te betalen.
const STARTVOORRAAD: Record<MateriaalType, number> = {
  hout: 0,
  steen: 6,
  erts: 0,
  goud: 0,
};

// Startvoedsel (issue: "genoeg voedsel om het net genoeg beurten te
// overleven zodat de houtkap, plus de wegen ernaartoe, net klaar zijn"):
// afgestemd op het bouw/wegen-tempo van de openingszet — genoeg om de
// Houtkap (2 beurten bouwtijd + 1-2 beurten wegaanleg) te overbruggen,
// waarna de voedselwaarschuwing verschijnt en een Boerderij nodig wordt.
const VOEDSEL_START = 14;

export function maakInitieleSpelStatus(): GameState {
  return {
    stad: {
      naam: "Holenrots",
      grootte: "klein",
      relics: [],
      vervalStatus: "gezond",
      strijders: [],
    },
    lagen: maakInitieleWereld(),
    voorraad: { ...STARTVOORRAAD },
    opslagCap: OPSLAG_CAP,
    voedsel: VOEDSEL_START,
    cultuur: 0,
    beurt: 1,
    bouwKeuzeGedaanDitBeurt: false,
    settlerActieGedaanDitBeurt: false,
    volgendeBouwBeurt: 1,
    // Standaard-instelling (issue: "een setting waarmee je deze uitleg
    // pop-ups aan en uit kunt zetten ... standaard voor alle nieuwe potjes")
    // bepaalt de startwaarde; de per-run toggle in het hoofdmenu wijzigt
    // daarna alleen deze ene run.
    uitlegPopupsAan: standaardUitlegAan(),
  };
}

function isMateriaalType(resource: string): resource is MateriaalType {
  return resource === "hout" || resource === "steen" || resource === "erts" || resource === "goud";
}

type ResourceKey = keyof Improvement["kosten"];

// Totale voedselproductie van dit beurt: alle actieve, (voor land-improvements)
// wegverbonden tiles met een voedsel-productie-effect (hoofdstuk 16: een
// Boerderij zonder wegverbinding levert nog niets op). Los van
// `verwerkProductie` hieronder zodat `verwerkVerval` dezelfde berekening kan
// hergebruiken om het voedseltekort een paar beurten vooruit te voorspellen.
function berekenVoedselProductie(state: GameState): number {
  let productie = 0;

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || effect.resource !== "voedsel" || !effect.waarde) {
        continue;
      }
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)) {
        continue;
      }
      productie += effect.waarde;
    }
  }

  return productie;
}

// Netto voedselverbruik per beurt (issue: "stad instort of verlaten alleen
// als er te weinig voedsel is"): een grotere stad heeft meer monden te voeden
// (hoofdstuk 10, laag 10-flavor), plus 1 voedsel per bemande Wachttoren
// (hoofdstuk 6/11/14, `WACHTTOREN_VOEDSEL_VERBRUIK` hierboven). Nog geen
// aparte multiplier per campagne nodig in de MVP (hoofdstuk 13).
function voedselVerbruik(state: GameState): number {
  return VOEDSEL_VERBRUIK[state.stad.grootte] + telBemandeWachttorens(state) * WACHTTOREN_VOEDSEL_VERBRUIK;
}

// Netto voedselverandering deze beurt: productie min verbruik. Negatief
// betekent dat de voorraad slinkt — gebruikt door zowel `verwerkProductie`
// (om de voorraad bij te werken) als `verwerkVerval` (om te voorspellen
// wanneer de voorraad op raakt).
function berekenVoedselNetto(state: GameState): number {
  return berekenVoedselProductie(state) - voedselVerbruik(state);
}

// Past productie toe van elke actieve land-improvement met een "productie"-effect.
// Bouwmaterialen lopen tegen de gedeelde opslag-cap aan; voedsel niet (hoofdstuk 5),
// maar wordt wel per beurt verbruikt (zie `voedselVerbruik` hierboven) — de
// voorraad kan dus, anders dan bouwmateriaal, ook weer afnemen. Nooit onder
// nul: zodra de voorraad nul bereikt, ziet `verwerkVerval` dat als een
// voedseltekort.
//
// Heiligdom & de frontier (hoofdstuk 6): cultuurproductie telt voluit mee op
// de frontier-laag (de hoogst ontgrendelde laag) zelf, en voor de helft op
// elke laag daaronder — uitbeelding van een Heiligdom dat vooral nabije,
// nog niet "eigen" stammen omtovert, een effect dat afneemt naarmate de laag
// verder van het actieve grensgebied ligt.
function verwerkProductie(state: GameState): GameState {
  const voorraad = { ...state.voorraad };
  let voedsel = state.voedsel;
  let cultuur = state.cultuur;
  const frontierHoogte = hoogsteOntgrendeldeLaag(state.lagen);

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || !effect.resource || !effect.waarde) {
        continue;
      }

      // Wegverbinding (M10, hoofdstuk 16): een land improvement produceert
      // pas zodra zijn vakje via een wegennetwerk met de stad verbonden is —
      // de stad zelf heeft geen `soort: "land"`-improvement, dus die blijft
      // hierdoor ongemoeid.
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)) {
        continue;
      }

      if (effect.resource === "cultuur") {
        cultuur += laag.hoogte === frontierHoogte ? effect.waarde : effect.waarde / 2;
      } else if (isMateriaalType(effect.resource)) {
        voorraad[effect.resource] = Math.min(
          state.opslagCap,
          voorraad[effect.resource] + effect.waarde
        );
      }
      // Voedsel-productie wordt hieronder in één keer verrekend met het
      // verbruik (niet per tile), zie `berekenVoedselProductie`.
    }
  }

  voedsel = Math.max(0, voedsel + berekenVoedselNetto(state));

  return { ...state, voorraad, voedsel, cultuur };
}

// Ontgrendelt de eerstvolgende vergrendelde laag zodra de cumulatieve cultuur
// de drempel haalt (M5, hoofdstuk 2/5). Cultuur wordt niet "uitgegeven" —
// het blijft een oplopende teller, dus bij een grote overschot ontgrendelen
// meteen meerdere lagen na elkaar in dezelfde beurt.
function verwerkLaagOntgrendeling(state: GameState): GameState {
  let lagen = state.lagen;
  let volgendeHoogte = hoogsteOntgrendeldeLaag(lagen) + 1;

  while (
    volgendeHoogte <= lagen.length &&
    state.cultuur >= cultuurKostenVoorLaag(volgendeHoogte)
  ) {
    lagen = lagen.map((laag) =>
      laag.hoogte === volgendeHoogte ? { ...laag, ontgrendeld: true } : laag
    );
    volgendeHoogte += 1;
  }

  return lagen === state.lagen ? state : { ...state, lagen };
}

interface BouwInvestering {
  nieuweVoortgang: Partial<Record<ResourceType, number>>;
  voltooid: boolean;
}

// Investeert dit beurt-aandeel van de resterende bouwkosten vanuit de
// gedeelde opslag, als er voldoende voorraad is. Bij onvoldoende voorraad
// stokt de bouw deze beurt (geen gedeeltelijke betaling) — zie hoofdstuk 5,
// "geen instant-klik, maar een productiewachtrij". Gedeeld tussen de
// land-tile-bouwwachtrij (M3) en de stadsgroei-bouwwachtrij (M6), die verder
// los van elkaar staan (tile vs. stad).
function investeerInBouwkosten(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>,
  voorraad: Record<MateriaalType, number>
): BouwInvestering | null {
  const teBetalen: Partial<Record<ResourceKey, number>> = {};
  for (const key of Object.keys(voortgang) as ResourceKey[]) {
    const resterend = voortgang[key] ?? 0;
    if (resterend <= 0) continue;
    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    teBetalen[key] = Math.min(perBeurt, resterend);
  }

  const kanBetalen = (Object.keys(teBetalen) as ResourceKey[]).every((key) => {
    if (!isMateriaalType(key)) return true; // niet-materiaalkosten komen hier nog niet voor
    return voorraad[key] >= (teBetalen[key] ?? 0);
  });

  if (!kanBetalen) return null;

  const nieuweVoortgang = { ...voortgang };
  for (const key of Object.keys(teBetalen) as ResourceKey[]) {
    const bedrag = teBetalen[key] ?? 0;
    if (isMateriaalType(key)) voorraad[key] -= bedrag;
    nieuweVoortgang[key] = (nieuweVoortgang[key] ?? 0) - bedrag;
  }

  const voltooid = (Object.values(nieuweVoortgang) as number[]).every((rest) => rest <= 0);
  return { nieuweVoortgang, voltooid };
}

// Resterende beurten tot een lopende bouw/rekrutering klaar is, uitgaande van
// dezelfde per-beurt-investering als `investeerInBouwkosten` hierboven (dus:
// zolang de voorraad het bijhoudt). Gebruikt door het militaire scherm
// (hoofdstuk 6/11, issue: "wachttorens, bemanning en bevoorrading" — punt 4:
// "hoeveel beurten er nóg te gaan zijn" bij een soldaat die al in opleiding
// is) in plaats van de speler te laten gokken, op dezelfde manier als de
// bouw-pop-up elders al de totale bouwtijd van een nog niet gestarte
// improvement toont.
export function resterendeBouwBeurten(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>
): number {
  let maxBeurten = 0;
  for (const key of Object.keys(voortgang) as ResourceKey[]) {
    const resterend = voortgang[key] ?? 0;
    if (resterend <= 0) continue;
    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    maxBeurten = Math.max(maxBeurten, Math.ceil(resterend / perBeurt));
  }
  return maxBeurten;
}

function verwerkTileInAanbouw(tile: Tile, voorraad: Record<MateriaalType, number>): Tile {
  const improvement = tile.improvement;
  if (!improvement || !tile.bouwVoortgang) return tile;

  const resultaat = investeerInBouwkosten(improvement, tile.bouwVoortgang, voorraad);
  if (!resultaat) return tile;

  if (resultaat.voltooid) {
    return {
      ...tile,
      status: "actief",
      bouwVoortgang: undefined,
      beurtenTotUitputting: improvement.uitputtingBeurten,
    };
  }

  return { ...tile, bouwVoortgang: resultaat.nieuweVoortgang };
}

// Telt de resterende levensduur van elke actief-producerende land-improvement
// af. Bij nul wordt de tile een permanente ghost-town-tile: onbebouwbaar en
// stopt met produceren (zie verwerkProductie, die alleen "actief"-tiles
// meetelt). City-tiles en tiles zonder `uitputtingBeurten` slaan we over
// (hoofdstuk 4: alleen land-improvements putten uit).
//
// Wegverbinding (hoofdstuk 4/16; issue: "land uitputting pas als het gebruikt
// wordt"): een gebouwde maar nog niet wegverbonden land-improvement produceert
// niets (zie `verwerkProductie`), dus put hij ook niets uit — de teller blijft
// stilstaan op zijn huidige waarde tot de wegverbinding er is. Dezelfde regel
// geldt zodra een verbinding later zou wegvallen: geen productie betekent
// geen uitputting, ongeacht de oorzaak.
function verwerkUitputting(state: GameState): GameState {
  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) => {
      if (tile.status !== "actief" || tile.beurtenTotUitputting === undefined) {
        return tile;
      }

      if (
        tile.improvement?.soort === "land" &&
        !isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)
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

  return { ...state, lagen };
}

function verwerkBouwwachtrij(state: GameState): GameState {
  const voorraad = { ...state.voorraad };

  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) =>
      tile.status === "in_aanbouw" ? verwerkTileInAanbouw(tile, voorraad) : tile
    ),
  }));

  return { ...state, lagen, voorraad };
}

// Telt de gebouwde land-tiles (actief + ghost_town) en hoeveel daarvan al
// zijn uitgeput — de basis voor de "kritiek"-verval-drempel (M6, hoofdstuk 4).
// City-tiles tellen niet mee (alleen land put uit, zie ook verwerkUitputting).
function telLandTiles(state: GameState): { totaal: number; ghostTowns: number } {
  let totaal = 0;
  let ghostTowns = 0;

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
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
function verwerkVerval(state: GameState): GameState {
  if (state.voedsel <= 0) {
    // Volledige ineenstorting (issue: "run eindigen wanneer stad uitgeput
    // is" / "stad instort ... als er te weinig voedsel is"): de run zelf
    // eindigt hier, niet alleen de groei-tier/relics van de stad — een verse
    // spelstatus, met de ineenstortingsvlag erbovenop zodat de UI het
    // game-over-scherm toont tot de speler bevestigt. `laatsteRunStatistieken`
    // is een momentopname van de net geëindigde run (issue: "beurten/steden/
    // lagen tonen op het game-over-scherm") — moet vóór de reset genomen
    // worden, anders is er niets meer over om te tonen.
    return {
      ...maakInitieleSpelStatus(),
      laatsteIneenstorting: true,
      laatsteRunStatistieken: {
        beurten: state.beurt,
        stedenGebouwd: 1, // MVP: precies 1 stad per run (hoofdstuk 13, geen frontier-verplaatsing)
        hoogsteLaag: hoogsteOntgrendeldeLaag(state.lagen),
      },
    };
  }

  const netto = berekenVoedselNetto(state);
  const beurtenTotTekort = netto >= 0 ? Infinity : Math.ceil(state.voedsel / -netto);
  const isDreiging = beurtenTotTekort <= VOEDSEL_WAARSCHUWING_BEURTEN;

  if (!isDreiging) {
    if (state.stad.vervalStatus === "gezond") return state;
    return {
      ...state,
      stad: { ...state.stad, vervalStatus: "gezond", vervalBeurtenResterend: undefined },
    };
  }

  return {
    ...state,
    stad: { ...state.stad, vervalStatus: "kritiek", vervalBeurtenResterend: beurtenTotTekort },
  };
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
// hoeveel vervallen, hoeveel steden, en je grootste stad"). Hergebruikt
// `telLandTiles` (M6) — "gebouwd" telt hier voltooide land-tiles
// (actief + ghost_town), dezelfde definitie als de verval-drempel gebruikt.
export function berekenHistorieStatistieken(state: GameState): {
  improvementenGebouwd: number;
  vervallen: number;
  steden: number;
  grootsteStad: City["grootte"];
} {
  const { totaal, ghostTowns } = telLandTiles(state);
  return {
    improvementenGebouwd: totaal,
    vervallen: ghostTowns,
    steden: 1, // MVP: precies 1 stad per run (hoofdstuk 13)
    grootsteStad: state.stad.grootte,
  };
}

// Betaalt de bouwkosten van een lopende stadsgroei (M6). Los van de
// land-tile-bouwwachtrij omdat groei de stad zelf upgradet, geen land-vakje.
function verwerkGroei(state: GameState): GameState {
  const groeiInAanbouw = state.stad.groeiInAanbouw;
  if (!groeiInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(groeiInAanbouw.improvement, groeiInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      stad: { ...state.stad, grootte: "middel", groeiInAanbouw: undefined },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      groeiInAanbouw: { ...groeiInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Betaalt de bouwkosten van een lopende Soldaat-rekrutering (M7). Zelfde
// wachtrij-patroon als verwerkGroei, los van de land-tile-bouwwachtrij omdat
// een unit geen land-vakje inneemt.
function verwerkRecrutering(state: GameState): GameState {
  const legerInAanbouw = state.stad.legerInAanbouw;
  if (!legerInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(legerInAanbouw.improvement, legerInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    // Elke voltooide rekrutering levert één individuele strijder op (nieuwe
    // Wachttoren-functie, hoofdstuk 6) in plaats van alleen een opgetelde
    // legerwaarde — de speler moet 'm straks kunnen kiezen om een specifieke
    // Wachttoren te bemannen. Een oplopende teller volstaat als id, want
    // `strijders` groeit alleen (nooit verwijderd, zie `bemanWachttoren`).
    const nieuweStrijder: Strijder = { id: `strijder-${state.stad.strijders.length}` };
    return {
      ...state,
      voorraad,
      stad: {
        ...state.stad,
        strijders: [...state.stad.strijders, nieuweStrijder],
        legerInAanbouw: undefined,
      },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      legerInAanbouw: { ...legerInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Start de groei-tier klein→middel (M6), als de voedseldrempel gehaald is en
// er niet al een groei loopt. Dit is een bewuste spelerskeuze, geen
// automatische ontgrendeling zoals cultuur (M5) — hoofdstuk 11: "doorgroeien
// ... is een bewuste gok, geen gratis extra beloning". Voedsel wordt niet
// "uitgegeven": net als cultuur blijft het een oplopende teller die de
// drempel markeert (hoofdstuk 5).
export function startGroei(state: GameState): GameState {
  if (
    state.stad.grootte !== "klein" ||
    state.stad.groeiInAanbouw ||
    state.voedsel < VOEDSEL_DREMPEL_GROEI
  ) {
    return state;
  }

  return {
    ...state,
    stad: {
      ...state.stad,
      groeiInAanbouw: { improvement: WOONWIJK, voortgang: { ...WOONWIJK.kosten } },
    },
  };
}

// Start het rekruteren van een Soldaat (M7), als er niet al een rekrutering
// loopt. Net als startGroei een bewuste spelerskeuze via een wachtrij, geen
// eigen valuta (hoofdstuk 5: "Militair heeft bewust géén eigen valuta: puur
// directe krachtsvergelijking op het moment zelf" — die krachtsvergelijking
// gebeurt in `confrontatie` hieronder, dit start alleen de opbouw ervan).
export function startRecrutering(state: GameState): GameState {
  if (state.stad.legerInAanbouw) return state;

  return {
    ...state,
    stad: {
      ...state.stad,
      legerInAanbouw: { improvement: SOLDAAT, voortgang: { ...SOLDAAT.kosten } },
    },
  };
}

// Of een Wachttoren-vakje bemand is door een van de strijders (nieuwe
// Wachttoren-functie, hoofdstuk 6: "de wachttoren moet dus bemand zijn").
function isWachttorenBemand(strijders: Strijder[], hoogte: number, positieInLaag: number): boolean {
  return strijders.some(
    (strijder) => strijder.wachttoren?.hoogte === hoogte && strijder.wachttoren?.positieInLaag === positieInLaag
  );
}

// Aantal actieve, bemande Wachttoren-tiles over alle lagen heen (hoofdstuk
// 6/11/14): de basis voor het bemannings-voedselverbruik in `voedselVerbruik`
// hierboven. Telt bewust ook niet-wegverbonden bemande torens mee — de
// bemanning moet gevoed worden ongeacht of de toren op dit moment ook
// daadwerkelijk beschermt (wegverbinding is alleen een eis voor de
// indringers-bescherming zelf, zie `heeftBeschermendeWachttoren` verderop).
function telBemandeWachttorens(state: GameState): number {
  let aantal = 0;
  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      if (
        tile.status === "actief" &&
        tile.improvement?.id === "wachttoren" &&
        isWachttorenBemand(state.stad.strijders, laag.hoogte, tile.positieInLaag)
      ) {
        aantal += 1;
      }
    }
  }
  return aantal;
}

// Totale legerwaarde (hoofdstuk 6: "units + muur/wachttoren-bonus"): elke
// opgeleide strijder telt mee (ongeacht of hij een Wachttoren bemant), plus
// de passieve verdedigingsbonus van elke actieve, bemande Wachttoren-tile
// (nieuwe Wachttoren-functie hierboven: onbemand levert geen bonus),
// ongeacht op welke laag die staat (er is in de MVP maar één actieve stad,
// hoofdstuk 13).
export function berekenLegerwaarde(state: GameState): number {
  let waarde = state.stad.strijders.length * (SOLDAAT.effect.waarde ?? 0);

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (
        tile.status === "actief" &&
        effect?.type === "verdediging" &&
        effect.waarde &&
        isWachttorenBemand(state.stad.strijders, laag.hoogte, tile.positieInLaag)
      ) {
        waarde += effect.waarde;
      }
    }
  }

  return waarde;
}

function berekenWinkans(eigenLegerwaarde: number, tegenstanderSterkte: number): number {
  const totaal = eigenLegerwaarde + tegenstanderSterkte;
  const ruweKans = totaal === 0 ? 0.5 : eigenLegerwaarde / totaal;
  return Math.min(WINKANS_MAX, Math.max(WINKANS_MIN, ruweKans));
}

// Militaire confrontatie (M7, hoofdstuk 6): vergelijkt de eigen legerwaarde
// met de dreiging op de actieve (hoogst ontgrendelde) laag via een winkans —
// nooit een gegarandeerde uitkomst (WINKANS_MIN/MAX). Winst levert direct
// buit (goud) op. Verlies is geen instant game-over: het versnelt de
// uitputting van een beperkt aantal actieve land-tiles (schade), wat de
// bestaande verval-cyclus (M6) dichterbij kan brengen in plaats van de stad
// meteen te laten instorten.
export function confrontatie(state: GameState): GameState {
  const actieveLaag = state.lagen.find(
    (laag) => laag.hoogte === hoogsteOntgrendeldeLaag(state.lagen)
  );
  const tegenstanderSterkte = actieveLaag?.dreigingsniveau ?? 0;
  const eigenLegerwaarde = berekenLegerwaarde(state);
  const winkans = berekenWinkans(eigenLegerwaarde, tegenstanderSterkte);
  const gewonnen = Math.random() < winkans;

  if (gewonnen) {
    const buitGoud = Math.round(tegenstanderSterkte * BUIT_GOUD_FACTOR);
    const voorraad = {
      ...state.voorraad,
      goud: Math.min(state.opslagCap, state.voorraad.goud + buitGoud),
    };
    const laatsteConfrontatie: ConfrontatieResultaat = {
      winkans,
      gewonnen,
      eigenLegerwaarde,
      tegenstanderSterkte,
      buitGoud,
    };
    return { ...state, voorraad, laatsteConfrontatie };
  }

  let geraakt = 0;
  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) => {
      if (
        geraakt >= SCHADE_TILES_AANTAL ||
        tile.status !== "actief" ||
        tile.improvement?.soort !== "land" ||
        tile.beurtenTotUitputting === undefined ||
        !isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)
      ) {
        return tile;
      }

      geraakt += 1;
      return { ...tile, beurtenTotUitputting: Math.max(1, tile.beurtenTotUitputting - SCHADE_BEURTEN) };
    }),
  }));

  const laatsteConfrontatie: ConfrontatieResultaat = {
    winkans,
    gewonnen,
    eigenLegerwaarde,
    tegenstanderSterkte,
    geraakteTiles: geraakt,
  };
  return { ...state, lagen, laatsteConfrontatie };
}

// Kans per beurt dat er ergens een indringers-incident plaatsvindt
// (hoofdstuk 6/14) — één trekking voor de hele stad, niet meer per laag.
// Bewuste MVP-placeholder, net als de overige tuning-getallen in dit bestand
// (hoofdstuk 14) — expliciet tunebaar genoemd in het issue dat deze feature
// aanvroeg. Was 40% op alleen de frontier-laag; nu 20% verspreid over alle
// ontgrendelde lagen (issue: "elke nieuwe laag maakt een eerder gebouwde
// wachttoren waardeloos, en 40% per beurt op één laag is erg hoog").
const INDRINGERS_KANS = 0.2;

// Het mechanisme is pas een factor zodra deze laag ontgrendeld is (issue:
// "het mechanisme start pas zodra de speler laag 2 heeft ontgrendeld") — de
// eerste laag blijft zo een rustige introductie zonder dat risico. Was laag 3.
const INDRINGERS_MIN_LAAG = 2;

// Een Wachttoren beschermt de laag waarop hij staat alleen als hij voltooid,
// bemand én via een aaneengesloten wegketen met de stad verbonden is (issue:
// "een wachtpost moet bevoorraad worden; zonder verbinding met de stad kan
// hij zijn functie niet vervullen") — dit lost de eerdere ambiguïteit tussen
// hoofdstuk 6 ("actief én bemand") en hoofdstuk 16 (land improvements worden
// pas actief via een wegverbinding) op. Een gebouwde maar onbemande of
// onverbonden Wachttoren biedt geen bescherming.
function heeftBeschermendeWachttoren(state: GameState, laag: Layer): boolean {
  return laag.tiles.some(
    (tile) =>
      tile.status === "actief" &&
      tile.improvement?.id === "wachttoren" &&
      isWachttorenBemand(state.stad.strijders, laag.hoogte, tile.positieInLaag) &&
      isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)
  );
}

// Het grondstof-type waar de speler op dit moment het meest van heeft, met
// ongeveer de helft daarvan als tribuut-eis (hoofdstuk 6: "iets specifieks...
// ongeveer de helft van datgene wat je op dat moment het meest op voorraad
// hebt"). Geeft `null` als er niets in voorraad is — het spel eist dan geen
// tribuut dat er niet is (issue: "het spel kijkt wel of je het hebt").
function kiesTribuut(voorraad: Record<MateriaalType, number>): IndringersTribuut | null {
  let grootsteType: MateriaalType | null = null;
  let grootsteWaarde = 0;

  for (const type of Object.keys(voorraad) as MateriaalType[]) {
    if (voorraad[type] > grootsteWaarde) {
      grootsteWaarde = voorraad[type];
      grootsteType = type;
    }
  }

  if (!grootsteType) return null;
  return { resource: grootsteType, aantal: Math.max(1, Math.round(grootsteWaarde / 2)) };
}

// Een laag is alleen "interessant" voor indringers als er iets te halen valt
// (hoofdstuk 6/11, issue: "een laag met alleen een wachttoren kan geen
// indringers krijgen"). Staat er op een laag uitsluitend een Wachttoren — en
// verder geen enkele andere improvement en geen ghost town — dan doet die
// laag niet mee in de trekking, ongeacht de staat van die Wachttoren (ook in
// aanbouw of nog niet bemand telt niet mee): een kale wachtpost biedt geen
// aanleiding. Een compleet lege laag (nog geen enkele improvement, bv. een
// net ontgrendelde laag) telt hier niet als "alleen een wachttoren" en blijft
// dus gewoon meedoen, net als lagen met alleen ghost towns en de startlaag —
// die regel is ongewijzigd. Is de Wachttoren op zo'n laag daarnaast ook nog
// beschermend (voltooid, bemand, verbonden), dan verandert dat hier niets:
// zo'n laag heeft dan alsnog niets anders te bieden en blijft uitgesloten.
function isAlleenWachttorenLaag(laag: Layer): boolean {
  let heeftWachttoren = false;
  for (const tile of laag.tiles) {
    if (tile.status === "ghost_town") return false;
    if (tile.improvement) {
      if (tile.improvement.id === "wachttoren") {
        heeftWachttoren = true;
      } else {
        return false;
      }
    }
  }
  return heeftWachttoren;
}

// Indringers & tribuut (hoofdstuk 6): elke beurt is er, zodra laag
// `INDRINGERS_MIN_LAAG` ontgrendeld is, één trekking of er sowieso een
// incident plaatsvindt — niet meer per laag. Is er een incident, dan wordt de
// getroffen laag geloot uit alle ontgrendelde lagen die iets te bieden hebben
// (issue: "loot dan de laag uit álle ontgrendelde lagen — ook lagen die
// beschermd zijn", later verfijnd met `isAlleenWachttorenLaag` hierboven),
// zodat elke gebouwde, bemande en verbonden Wachttoren zijn hele run lang
// waarde houdt in plaats van waardeloos te worden zodra de frontier opschuift.
// Een beschermende Wachttoren op de geloten laag verdedigt de hele laag — er
// gebeurt dan niets, alleen een meldings-pop-up. Zonder zo'n wachttoren eist
// de tribe tribuut (zie `kiesTribuut`); de speler lost dit verder zelf op via
// `geefTribuut`/`weigerTribuut` hieronder. Rolt geen nieuwe gebeurtenis zolang
// een vorige melding nog open staat.
function verwerkIndringers(state: GameState): GameState {
  if (state.indringersEvent) return state;
  if (hoogsteOntgrendeldeLaag(state.lagen) < INDRINGERS_MIN_LAAG) return state;
  if (Math.random() >= INDRINGERS_KANS) return state;

  const ontgrendeldeLagen = state.lagen.filter(
    (laag) => laag.ontgrendeld && !isAlleenWachttorenLaag(laag)
  );
  if (ontgrendeldeLagen.length === 0) return state;

  const laag = ontgrendeldeLagen[Math.floor(Math.random() * ontgrendeldeLagen.length)];
  const stamNaam = INDRINGERS_STAMMEN[Math.floor(Math.random() * INDRINGERS_STAMMEN.length)];

  if (heeftBeschermendeWachttoren(state, laag)) {
    return {
      ...state,
      indringersEvent: { laagHoogte: laag.hoogte, stamNaam, heeftWachttoren: true, fase: "gemeld" },
    };
  }

  const tribuut = kiesTribuut(state.voorraad);
  if (!tribuut) return state;

  return {
    ...state,
    indringersEvent: { laagHoogte: laag.hoogte, stamNaam, heeftWachttoren: false, tribuut, fase: "gemeld" },
  };
}

// Spawnt per beurt met een kleine kans een nieuwe wilde kudde (hoofdstuk
// 16/17) op een leeg, nog-kuddeloos vakje van een ontgrendelde laag vanaf
// `KUDDE_MIN_LAAG`. Net als `verwerkIndringers` hierboven: hoogstens één
// nieuwe kudde per beurt, geen limiet op het totaal aantal tegelijk
// aanwezige kuddes.
function verwerkKuddes(state: GameState): GameState {
  if (hoogsteOntgrendeldeLaag(state.lagen) < KUDDE_MIN_LAAG) return state;
  if (Math.random() >= KUDDE_KANS) return state;

  const kandidaten: { hoogte: number; positieInLaag: number }[] = [];
  for (const laag of state.lagen) {
    if (!laag.ontgrendeld || laag.hoogte < KUDDE_MIN_LAAG) continue;
    for (const tile of laag.tiles) {
      if (tile.status === "leeg" && !tile.kudde) {
        kandidaten.push({ hoogte: laag.hoogte, positieInLaag: tile.positieInLaag });
      }
    }
  }
  if (kandidaten.length === 0) return state;

  const doel = kandidaten[Math.floor(Math.random() * kandidaten.length)];
  const lagen = state.lagen.map((laag) => {
    if (laag.hoogte !== doel.hoogte) return laag;
    const tiles = laag.tiles.map((tile, index) =>
      index === doel.positieInLaag ? { ...tile, kudde: { beurtenResterend: KUDDE_JACHT_BEURTEN } } : tile
    );
    return { ...laag, tiles };
  });

  return { ...state, lagen };
}

// Sluit een gemelde-maar-onschadelijke indringers-melding (wachttoren hield
// stand) zonder verdere gevolgen.
export function sluitIndringersMelding(state: GameState): GameState {
  return { ...state, indringersEvent: undefined };
}

// Geeft het geëiste tribuut: trekt het af van de gedeelde opslag (nooit onder
// nul) en sluit de melding. Gebruikt zowel voor de bewuste "Geef tribuut"-
// keuze als voor de afgedwongen betaling na een geweigerd tribuut zonder
// vorige stad (`bevestigGedwongenTribuut` hieronder).
export function geefTribuut(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event?.tribuut) return state;

  const voorraad = { ...state.voorraad };
  voorraad[event.tribuut.resource] = Math.max(0, voorraad[event.tribuut.resource] - event.tribuut.aantal);
  return { ...state, voorraad, indringersEvent: undefined };
}

// Weigert het tribuut (hoofdstuk 6): normaal verwoesten de indringers de stad
// en valt de speler terug op de vorige stad, als die er is. De MVP kent nog
// maar één stad (hoofdstuk 13) — zonder toevlucht wordt het tribuut alsnog
// betaald, wat hier eerst zichtbaar wordt gemaakt (`fase: "geforceerd"`)
// zodat de pop-up dat kan uitleggen vóór `bevestigGedwongenTribuut` het int.
export function weigerTribuut(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event?.tribuut) return state;
  return { ...state, indringersEvent: { ...event, fase: "geforceerd" } };
}

// Int het afgedwongen tribuut na `weigerTribuut` hierboven — zelfde effect als
// `geefTribuut`, maar bewust als losse actie zodat de UI het onderscheid kan
// tonen (bewuste keuze vs. afgedwongen).
export function bevestigGedwongenTribuut(state: GameState): GameState {
  return geefTribuut(state);
}

// Start de bouw van een land improvement op de tile die de speler zelf heeft
// aangewezen (klik-op-tile plaatsing, zie GameRoot: `plaatsingsImprovement`).
// Geeft de ongewijzigde status terug als die laag niet ontgrendeld is, de
// tile niet (meer) leeg is, of als het terrein niet aan de eis van de
// improvement voldoet (issue: "houtkap alleen op bos" e.d.) — de aanroeper
// controleert dit al vóór het tonen van de "hier bouwen?"-vraag, dit is een
// tweede, veilige check. Bewust geen aparte "is dit de frontier-laag?"-check
// hier: alleen de UI (GameRoot) beperkt normale improvements tot de
// frontier-laag, terwijl `bouwbaarBuitenFrontier`-improvements (hoofdstuk
// 6/11, momenteel alleen de Wachttoren) op elke ontgrendelde laag mogen —
// deze functie staat dus élke ontgrendelde laag toe en vertrouwt op de
// aanroeper voor de rest van die keuze. Verbruikt altijd de bouwkeuze van
// deze beurt (hoofdstuk 11: hoogstens 1 bouwkeuze per beurt).
export function startBouw(
  state: GameState,
  laagHoogte: number,
  improvement: Improvement,
  positieInLaag: number
): GameState {
  const lagen = state.lagen.map((laag) => {
    if (laag.hoogte !== laagHoogte) return laag;
    if (!laag.ontgrendeld) return laag;

    const doelTile = laag.tiles[positieInLaag];
    if (!doelTile || doelTile.status !== "leeg") return laag;
    if (!improvementPastOpTerrein(improvement, doelTile.terrein)) return laag;

    const tiles = laag.tiles.map((tile, index) => {
      if (index !== positieInLaag) return tile;
      return {
        ...tile,
        status: "in_aanbouw" as const,
        improvement,
        bouwVoortgang: { ...improvement.kosten },
        // Een kudde trekt verder zodra hier gebouwd wordt (hoofdstuk 16/17)
        // — anders zou `jaag` hierboven op een inmiddels bebouwd vakje
        // kunnen blijven jagen.
        kudde: undefined,
      };
    });

    return { ...laag, tiles };
  });

  return {
    ...state,
    lagen,
    bouwKeuzeGedaanDitBeurt: true,
    volgendeBouwBeurt: state.beurt + BOUW_RITME_BEURTEN,
  };
}

// Sluit de bouw-pop-up zonder te bouwen (hoofdstuk 11: de speler mag een
// beurt ook overslaan) — verbruikt, net als `startBouw`, de bouwkeuze van
// deze beurt én het eerstvolgende bouwmoment (hoofdstuk 16: bouw-ritme).
export function sluitBouwKeuze(state: GameState): GameState {
  return { ...state, bouwKeuzeGedaanDitBeurt: true, volgendeBouwBeurt: state.beurt + BOUW_RITME_BEURTEN };
}

// Verplaatst de settler naar een aangeklikte tile (issue: "de tegels waar je
// heen kunt lichten op, door te klikken op een tegel ga je er naar toe"),
// als er niet al een settler-actie deze beurt gebruikt is en de tile één van
// de direct bereikbare buurvakjes is. Negeert de aanroep stilzwijgend bij een
// ongeldige zet — de canvas (GameRoot) markeert alleen de bereikbare vakjes
// als klikbaar, dit is een tweede, veilige check (zelfde patroon als
// `startBouw`/terrein-eisen).
export function verplaatsSettlerNaar(state: GameState, hoogte: number, positieInLaag: number): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const magErheen = bereikbarePosities(state.lagen, state.settler).some(
    (positie) => positie.hoogte === hoogte && positie.positieInLaag === positieInLaag
  );
  if (!magErheen) return state;

  return { ...state, settler: { hoogte, positieInLaag }, settlerActieGedaanDitBeurt: true };
}

// Legt een weg aan op het vakje waar de settler nu staat (hoofdstuk 16): geen
// grondstoffen, alleen de settler-actie van deze beurt. Geen effect als er
// al een weg ligt of de settler deze beurt al gehandeld heeft.
export function legWegAan(state: GameState): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const { hoogte, positieInLaag } = state.settler;
  const laag = state.lagen.find((l) => l.hoogte === hoogte);
  if (!laag || laag.tiles[positieInLaag]?.heeftWeg) return state;

  const lagen = state.lagen.map((l) => {
    if (l.hoogte !== hoogte) return l;
    const tiles = l.tiles.map((tile, index) => (index === positieInLaag ? { ...tile, heeftWeg: true } : tile));
    return { ...l, tiles };
  });

  return { ...state, lagen, settlerActieGedaanDitBeurt: true };
}

// Jaagt op de kudde waar de settler nu op staat (hoofdstuk 16/17, issue:
// "kuddes met dieren waar je op kunt jagen voor voedsel"): een losse
// settler-actie naast bewegen/weg aanleggen, dus ook hoogstens 1 keer per
// beurt. Elke jachtbeurt levert direct voedsel op en telt de resterende
// jachtbeurten van de kudde af; op nul is de kudde uitgeput en verdwijnt hij
// — geen ghost-town-tile zoals bij een uitgeputte land-improvement
// (hoofdstuk 4), het vakje wordt gewoon weer een leeg vakje.
export function jaag(state: GameState): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const { hoogte, positieInLaag } = state.settler;
  const laag = state.lagen.find((l) => l.hoogte === hoogte);
  const tile = laag?.tiles[positieInLaag];
  if (!laag || !tile?.kudde) return state;

  const beurtenResterend = tile.kudde.beurtenResterend - 1;
  const lagen = state.lagen.map((l) => {
    if (l.hoogte !== hoogte) return l;
    const tiles = l.tiles.map((t, index) =>
      index === positieInLaag ? { ...t, kudde: beurtenResterend > 0 ? { beurtenResterend } : undefined } : t
    );
    return { ...l, tiles };
  });

  return {
    ...state,
    lagen,
    voedsel: state.voedsel + KUDDE_VOEDSEL_PER_BEURT,
    settlerActieGedaanDitBeurt: true,
  };
}

// Hakt hout op het bos-vakje waar de settler nu op staat (issue: "ook mag je
// je settlers inzetten om hout te kappen"): een directe, kleinere opbrengst
// dan de Houtkap-improvement, zonder te bouwen. Zelfde
// eenmalige-actie-per-beurt-regel als `jaag`/`legWegAan` hierboven.
export function hakHout(state: GameState): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const { hoogte, positieInLaag } = state.settler;
  const laag = state.lagen.find((l) => l.hoogte === hoogte);
  const tile = laag?.tiles[positieInLaag];
  if (!laag || !tile || tile.terrein !== "bos") return state;

  const voorraad = {
    ...state.voorraad,
    hout: Math.min(state.opslagCap, state.voorraad.hout + HOUTHAKKEN_HOUT_PER_BEURT),
  };

  return { ...state, voorraad, settlerActieGedaanDitBeurt: true };
}

// Of er al een actieve, wegverbonden boerderij meeproduceert (issue: "uitleg
// pop-ups dynamisch tonen" — trigger voor BoerderijKlaarUitlegPopup): gebruikt
// dezelfde wegverbindingsregel als `verwerkProductie` hierboven, zodat de
// pop-up pas verschijnt zodra de boerderij daadwerkelijk voedsel oplevert.
export function heeftWerkendeBoerderij(state: GameState): boolean {
  return state.lagen.some((laag) =>
    laag.tiles.some(
      (tile) =>
        tile.status === "actief" &&
        tile.improvement?.id === "boerderij" &&
        isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)
    )
  );
}

// Bemant een Wachttoren met een specifieke strijder (nieuwe Wachttoren-functie,
// hoofdstuk 6): via het militaire paneel kiest de speler eerst een nog
// onbemande, niet-onderweg-zijnde strijder, dan een actieve, nog onbemande
// Wachttoren-tile op de kaart. Geeft de ongewijzigde status terug bij een
// ongeldige combinatie (strijder bestaat niet, is al bemand, is nog onderweg
// na een eerdere `haalStrijderTerug`, of het doel is geen actieve, onbemande
// Wachttoren). Toewijzen is sinds hoofdstuk 6/11 omkeerbaar (issue:
// "wachttorens, bemanning en bevoorrading") via `haalStrijderTerug` hieronder.
export function bemanWachttoren(
  state: GameState,
  strijderId: string,
  hoogte: number,
  positieInLaag: number
): GameState {
  const strijder = state.stad.strijders.find((s) => s.id === strijderId);
  if (!strijder || strijder.wachttoren || strijder.onderwegBeurtenResterend) return state;

  const laag = state.lagen.find((l) => l.hoogte === hoogte);
  const tile = laag?.tiles[positieInLaag];
  if (!tile || tile.status !== "actief" || tile.improvement?.id !== "wachttoren") return state;
  if (isWachttorenBemand(state.stad.strijders, hoogte, positieInLaag)) return state;

  const strijders = state.stad.strijders.map((s) =>
    s.id === strijderId ? { ...s, wachttoren: { hoogte, positieInLaag } } : s
  );

  return { ...state, stad: { ...state.stad, strijders } };
}

// Haalt een bemande strijder terug van zijn Wachttoren (hoofdstuk 6/11, issue:
// "wachttorens, bemanning en bevoorrading" — vervangt de eerdere onomkeerbare
// toewijzing). De Wachttoren zelf raakt meteen onbemand (en dus, tenzij een
// andere strijder hem overneemt, onbeschermd — zie `heeftBeschermendeWachttoren`),
// maar de strijder is niet meteen elders inzetbaar: `onderwegBeurtenResterend`
// (`STRIJDER_VERPLAATSING_BEURTEN` hierboven) telt af via `verwerkStrijdersOnderweg`
// in `volgendeBeurt`, zodat terughalen een herziene keuze is, geen gratis
// heen-en-weer-schuiven. Geen effect op een strijder die niet bemand is.
export function haalStrijderTerug(state: GameState, strijderId: string): GameState {
  const strijder = state.stad.strijders.find((s) => s.id === strijderId);
  if (!strijder || !strijder.wachttoren) return state;

  const strijders = state.stad.strijders.map((s) =>
    s.id === strijderId
      ? { ...s, wachttoren: undefined, onderwegBeurtenResterend: STRIJDER_VERPLAATSING_BEURTEN }
      : s
  );

  return { ...state, stad: { ...state.stad, strijders } };
}

// Telt de resterende verplaatsingstijd van elke onderweg-zijnde strijder af
// (hoofdstuk 6/11/14, na `haalStrijderTerug` hierboven) — op nul is de
// strijder weer inzetbaar voor `bemanWachttoren`. Onderdeel van de
// `volgendeBeurt`-pijplijn, net als de overige per-beurt-tellers in dit
// bestand (uitputting, groei, rekrutering).
function verwerkStrijdersOnderweg(state: GameState): GameState {
  const strijders = state.stad.strijders.map((strijder) => {
    if (!strijder.onderwegBeurtenResterend) return strijder;
    const resterend = strijder.onderwegBeurtenResterend - 1;
    return { ...strijder, onderwegBeurtenResterend: resterend > 0 ? resterend : undefined };
  });

  return { ...state, stad: { ...state.stad, strijders } };
}

// Zet de per-run uitleg-pop-ups-instelling (issue: "een setting waarmee je
// deze uitleg pop-ups aan en uit kunt zetten ... voor deze run specifiek"),
// via een nieuwe optie in het hoofdmenu. Wijzigt uitsluitend deze lopende
// run — de globale standaard-instelling (save.ts: `standaardUitlegAan`)
// blijft ongemoeid.
export function zetUitlegPopups(state: GameState, aan: boolean): GameState {
  return { ...state, uitlegPopupsAan: aan };
}

// Verwerkt één spelbeurt: eerst uitputting van de actieve tiles (M4), dan
// verbruik/voortgang van de land-tile-bouwwachtrij — een tile die deze beurt
// klaar is, wordt hier al "actief" en begint pas volgende beurt met
// aftellen (vandaar vóór de productiestap hieronder) — dan productie van
// alle (incl. deze beurt net voltooide) actieve improvements (incl.
// voedselverbruik en cultuur), dan laag-ontgrendeling op basis van die
// cultuur (M5), dan pas verval op basis van een dreigend voedseltekort (M6)
// (issue: "eerst de grondstoffen binnenkomen, en daarna wordt gecheckt of je
// afgaat" — een tile/weg die deze beurt klaarkomt telt zo al mee vóór de
// instort-check), dan de stadsgroei-bouwwachtrij (M6) en de
// Soldaat-rekruteringswachtrij (M7), de strijder-verplaatsingstellers
// (hoofdstuk 6/11, `verwerkStrijdersOnderweg` na `haalStrijderTerug`), dan de
// indringers-kans (hoofdstuk 6) en de kuddes-kans (hoofdstuk 16/17), dan de
// beurtteller ophogen. Zet ook de bouwkeuze-vlag (hoofdstuk 11) weer terug,
// zodat de bouw-pop-up bij het begin van de nieuwe beurt weer verschijnt.
//
// Stort de stad deze beurt volledig in, dan geeft `verwerkVerval` al een
// verse, gereset spelstatus terug (issue: "run eindigen wanneer stad
// uitgeput is") — de resterende stappen (groei/rekrutering, indringers,
// kuddes, beurtteller) slaan we dan over, anders zou de net herstarte
// tutorial meteen op beurt 2 beginnen.
export function volgendeBeurt(state: GameState): GameState {
  const naUitputting = verwerkUitputting(state);
  const naBouw = verwerkBouwwachtrij(naUitputting);
  const naProductie = verwerkProductie(naBouw);
  const naOntgrendeling = verwerkLaagOntgrendeling(naProductie);
  const naVerval = verwerkVerval(naOntgrendeling);
  if (naVerval.laatsteIneenstorting) return naVerval;

  const naGroei = verwerkGroei(naVerval);
  const naRecrutering = verwerkRecrutering(naGroei);
  const naStrijdersOnderweg = verwerkStrijdersOnderweg(naRecrutering);
  const naIndringers = verwerkIndringers(naStrijdersOnderweg);
  const naKuddes = verwerkKuddes(naIndringers);
  const nieuweBeurt = naKuddes.beurt + 1;

  // De settler verschijnt bij de stad zodra beurt 2 begint (hoofdstuk 16) —
  // en blijft daarna gewoon staan waar de speler 'm laatst neerzette.
  const settler =
    naKuddes.settler ?? (nieuweBeurt >= 2 ? { hoogte: 1, positieInLaag: STAD_POSITIE } : undefined);

  return {
    ...naKuddes,
    beurt: nieuweBeurt,
    bouwKeuzeGedaanDitBeurt: false,
    settlerActieGedaanDitBeurt: false,
    settler,
  };
}
