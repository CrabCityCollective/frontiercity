// Settler-acties (hoofdstuk 16/17): de losse settler-eenheid kan per beurt
// hoogstens één actie doen — bewegen, een weg aanleggen, jagen op een kudde,
// of hout hakken — plus, als eindpunt van de tutorial, een nieuwe stad
// stichten (hoofdstuk 2/10/16, issue: "stad stichten op de frontier").

import { bereikbarePosities } from "./wegen";
import {
  jachtVoedselBonus,
  roofdierKansFactor,
  settlerBeweegtGratis,
  settlerWegaanlegGratis,
} from "./techTree";
import { GameState, RoofdierEvent } from "./types";
import { isGeschiktVoorStichten } from "./world";

// Kuddes & settler-jacht (hoofdstuk 16/17; issue: "kuddes met dieren waar je
// op kunt jagen voor voedsel"): een losse settler-actie naast bewegen/weg
// aanleggen. Bewuste MVP-placeholder, net als de overige tuning-getallen
// hieronder.
const KUDDE_VOEDSEL_PER_BEURT = 3;

// Settler-houtkap (issue: "ook mag je je settlers inzetten om hout te
// kappen. Dan krijg je maar 1 hout per beurt"): een kleinere, directe
// opbrengst zonder improvement te bouwen — geen vervanging van de Houtkap-
// improvement, maar een alternatief voor de tussenliggende beurten
// (hoofdstuk 16: bouw-ritme).
const HOUTHAKKEN_HOUT_PER_BEURT = 1;

// Roofdieren (hoofdstuk 14/17, issue: "roofdieren toevoegen"): vanaf
// `ROOFDIER_MIN_LAAG` heeft elke jachtactie (niet elke beurt/laag zoals
// indringers/kuddes in indringersEnDieren.ts) een kans om een roofdier op te
// roepen op het jachtvakje zelf. Bewuste MVP-placeholder, net als de overige
// tuning-getallen hierboven.
const ROOFDIER_MIN_LAAG = 5;
const ROOFDIER_KANS = 0.15;

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

  // "B1b. Handkar" (hoofdstuk 3/9, techTree.ts): verplaatsen kost dan geen
  // aparte settler-actie meer, dus de speler kan deze beurt nog een andere
  // actie (weg aanleggen/jagen/hout hakken) uitvoeren.
  const kostGeenActie = settlerBeweegtGratis(state.technologieen);
  return {
    ...state,
    settler: { hoogte, positieInLaag },
    settlerActieGedaanDitBeurt: kostGeenActie ? state.settlerActieGedaanDitBeurt : true,
  };
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

  // "B1. Het wiel" (hoofdstuk 3/9, techTree.ts): wegaanleg kost dan geen
  // aparte settler-actie meer.
  const kostGeenActie = settlerWegaanlegGratis(state.technologieen);
  return { ...state, lagen, settlerActieGedaanDitBeurt: kostGeenActie ? state.settlerActieGedaanDitBeurt : true };
}

// Jaagt op de kudde waar de settler nu op staat (hoofdstuk 16/17, issue:
// "kuddes met dieren waar je op kunt jagen voor voedsel"): een losse
// settler-actie naast bewegen/weg aanleggen, dus ook hoogstens 1 keer per
// beurt. Elke jachtbeurt levert direct voedsel op en telt de resterende
// jachtbeurten van de kudde af; op nul is de kudde uitgeput en verdwijnt hij
// — geen ghost-town-tile zoals bij een uitgeputte land-improvement
// (hoofdstuk 4), het vakje wordt gewoon weer een leeg vakje.
//
// Roofdieren (hoofdstuk 14/17, issue: "roofdieren toevoegen"): vanaf
// `ROOFDIER_MIN_LAAG` heeft elke jachtbeurt een kans om een roofdier op te
// roepen, op hetzelfde vakje. Meldt dit meteen (`roofdierEvent`,
// fase "verschenen") — de daadwerkelijke aanval volgt pas een beurt later,
// zie `verwerkRoofdieren` (indringersEnDieren.ts) in `volgendeBeurt`.
export function jaag(state: GameState): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const { hoogte, positieInLaag } = state.settler;
  const laag = state.lagen.find((l) => l.hoogte === hoogte);
  const tile = laag?.tiles[positieInLaag];
  if (!laag || !tile?.kudde) return state;

  const beurtenResterend = tile.kudde.beurtenResterend - 1;
  // "B2. Speerwerper" / "B2a. Boogschieten" (hoofdstuk 3/9, techTree.ts):
  // verlagen de roofdier-kans (`roofdierKansFactor`); "B. Het spoor lezen" /
  // "B2a. Boogschieten" verhogen de jachtopbrengst (`jachtVoedselBonus`).
  const roofdierVerschijnt =
    hoogte >= ROOFDIER_MIN_LAAG && Math.random() < ROOFDIER_KANS * roofdierKansFactor(state.technologieen);

  const lagen = state.lagen.map((l) => {
    if (l.hoogte !== hoogte) return l;
    const tiles = l.tiles.map((t, index) =>
      index === positieInLaag
        ? {
            ...t,
            kudde: beurtenResterend > 0 ? { beurtenResterend } : undefined,
            roofdier: roofdierVerschijnt ? { beurtenTotAanval: 1 } : t.roofdier,
          }
        : t
    );
    return { ...l, tiles };
  });

  const roofdierEvent: RoofdierEvent | undefined = roofdierVerschijnt
    ? { hoogte, positieInLaag, fase: "verschenen" }
    : state.roofdierEvent;

  return {
    ...state,
    lagen,
    voedsel: state.voedsel + KUDDE_VOEDSEL_PER_BEURT + jachtVoedselBonus(state.technologieen),
    settlerActieGedaanDitBeurt: true,
    roofdierEvent,
  };
}

// Hakt hout op het bos-vakje waar de settler nu op staat (issue: "ook mag je
// je settlers inzetten om hout te kappen"): een directe, kleinere opbrengst
// dan de Houtkap-improvement, zonder te bouwen. Zelfde
// eenmalige-actie-per-beurt-regel als `jaag`/`legWegAan` hierboven.
//
// Uitgeputte Houtkap (issue: "settler houthakken op verlaten tegel"): een
// `ghost_town`-vakje is een uitgeputte Houtkap-improvement — het terrein
// blijft "bos" (zie types.ts), maar het bos zelf is daar al leeggekapt. Zonder
// deze check kon de settler zo'n vakje voor onbeperkt gratis hout blijven
// gebruiken, wat de uitputtings-mechaniek (hoofdstuk 4) omzeilt.
export function hakHout(state: GameState): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const { hoogte, positieInLaag } = state.settler;
  const laag = state.lagen.find((l) => l.hoogte === hoogte);
  const tile = laag?.tiles[positieInLaag];
  if (!laag || !tile || tile.terrein !== "bos" || tile.status === "ghost_town") return state;

  const voorraad = {
    ...state.voorraad,
    hout: Math.min(state.opslagCap, state.voorraad.hout + HOUTHAKKEN_HOUT_PER_BEURT),
  };

  return { ...state, voorraad, settlerActieGedaanDitBeurt: true };
}

// Stichtingskosten (hoofdstuk 2/14, issue: "stad stichten op de frontier"
// deel 3, narekenen van het voorstel "25 hout, 15 steen, 10 erts, 30
// voedsel"). Doorrekening tegen de werkelijke code (niet alleen het
// design-document): `OPSLAG_CAP` blijkt in `verwerkProductie` (productie.ts)
// per grondstof te gelden (`voorraad[resource] = min(opslagCap, ...)` voor
// élk van hout/steen/erts/goud apart), niet als gezamenlijke som van de vier
// zoals hoofdstuk 5 beschrijft. Met een gedeelde som zou 25+15+10 = 50 al
// ruim boven de cap van 30 uitkomen en dus altijd een Opslagplaats afdwingen
// — maar met een cap per grondstof (de daadwerkelijke situatie) zitten
// 25/15/10 elk ruim ónder de 30, en zou de speler nooit hoeven uit te
// breiden. `hout` is daarom verhoogd naar 40 (boven de startcap van 30) —
// dat dwingt minstens één Opslagplaats af (cap 30 → 50), precies de bewuste
// tussenstap uit deel 2. Steen/erts blijven ruim onder de cap (ook na een
// paar bouwprojecten realistisch op te sparen) en voedsel is sowieso
// ongelimiteerd (hoofdstuk 5) — de architectuur zelf blijft hier bewust
// ongewijzigd (dat is een aparte refactor, buiten deze issue), alleen de
// bedragen zijn erop afgestemd.
//
// Voedsel blijft op de voorgestelde 30: aangezien voedsel nooit "uitgegeven"
// wordt (hoofdstuk 5 — alleen drempels zoals `VOEDSEL_DREMPEL_GROEI`
// controleren de voorraad, ze verlagen 'm niet) is een gezonde stad tegen de
// tijd dat laag 13 ontgrendeld is sowieso al ver voorbij 30 voedsel, op
// straffe van een eerdere ineenstorting (hoofdstuk 4) — de eis dwingt dus
// vooral af dat de voedselcrisis allang opgelost moet zijn, wat de bestaande
// verval-mechaniek toch al vereist. Hem hoger zetten dan 30 zou daar weinig
// aan veranderen; lager zou de eis betekenisloos maken.
//
// Turn-doorrekening (indicatief, zelfde stijl als hoofdstuk 14): met één
// Houtkap (3 hout/beurt) en één Opslagplaats gebouwd, is 40 hout binnen
// ~13-14 beurten surplus te verzamelen; 15 steen (één Steengroeve, 2/beurt)
// binnen ~8 beurten, 10 erts (één Mijn, 2/beurt) binnen ~5 beurten — ruim
// haalbaar binnen de vele tientallen beurten die toch al nodig zijn om laag
// 10-12 te bereiken (hoofdstuk 14: cultuurkosten lopen daar al op tot
// 400-600), dus een doel waar de speler een paar lagen naartoe werkt zonder
// dat het sleept.
export const STICHTING_KOSTEN: { hout: number; steen: number; erts: number; voedsel: number } = {
  hout: 40,
  steen: 15,
  erts: 10,
  voedsel: 30,
};

// Naam van de nieuw te stichten stad (hoofdstuk 10: prehistorisch klinkende
// stadsnamen naast Holenrots — "Vuurbron", "Asvallei"). Puur cosmetisch: de
// MVP bouwt geen tweede, speelbare stad (hoofdstuk 13/16 — het stichten is
// hier het eindpunt van de tutorial), dus dit is alleen de naam die op de
// nieuwe stad-tile en in de afsluitende scène verschijnt.
export const GESTICHTE_STAD_NAAM = "Vuurbron";

// Of de settler nu op een geldig stichtingsdoel staat (hoofdstuk 2: aan
// vers water, en nog onbebouwd — zie `isGeschiktVoorStichten`). Gedeeld
// tussen `stichtStad` hieronder en de UI (SettlerPaneel/GameRoot), zodat de
// "Stad stichten"-knop alleen verschijnt wanneer de actie ook echt zou
// slagen.
export function kanStichten(state: GameState): boolean {
  const settler = state.settler;
  if (!settler) return false;
  const laag = state.lagen.find((l) => l.hoogte === settler.hoogte);
  const tile = laag?.tiles[settler.positieInLaag];
  return Boolean(tile && isGeschiktVoorStichten(tile));
}

// Of er genoeg grondstoffen zijn om de stichtingskosten te betalen —
// losstaand van `kanStichten` (locatie) zodat de UI apart kan tonen "je
// staat op de juiste plek, maar mist nog X" versus "dit is geen geschikte
// plek".
export function heeftGenoegVoorStichten(state: GameState): boolean {
  return (
    state.voorraad.hout >= STICHTING_KOSTEN.hout &&
    state.voorraad.steen >= STICHTING_KOSTEN.steen &&
    state.voorraad.erts >= STICHTING_KOSTEN.erts &&
    state.voedsel >= STICHTING_KOSTEN.voedsel
  );
}

// Sticht een nieuwe stad op het vakje waar de settler nu staat (hoofdstuk
// 2/10/16, issue: "stad stichten op de frontier" deel 4 — vervangt "bereik
// laag 12" als tutorial-einddoel). De settler zelf verdwijnt hierbij: "de
// huifkar wordt de stad" (de UI waarschuwt hier vóóraf duidelijk voor, zie
// StichtStadPopup — deze functie voert de al-bevestigde actie alleen nog
// uit). Geen effect bij een ongeldige aanroep (verkeerde locatie of te
// weinig grondstoffen) — dezelfde twee-staps-veilige-aanroep-conventie als
// `startBouw`/`verplaatsSettlerNaar` hierboven. Zet `stadGesticht` (GameRoot
// toont daarop de afsluitende tutorial-scène) en verbruikt geen aparte
// settler-actie-vlag: dit is de laatste, beslissende zet, geen herhaalbare
// per-beurt-actie zoals bewegen/jagen/hakken.
export function stichtStad(state: GameState): GameState {
  if (!kanStichten(state) || !heeftGenoegVoorStichten(state)) return state;

  const { hoogte, positieInLaag } = state.settler!;
  const lagen = state.lagen.map((laag) => {
    if (laag.hoogte !== hoogte) return laag;
    const tiles = laag.tiles.map((tile, index) => {
      if (index !== positieInLaag) return tile;
      return {
        ...tile,
        status: "actief" as const,
        improvement: {
          id: "gestichte-stad",
          naam: GESTICHTE_STAD_NAAM,
          categorie: "civiel" as const,
          soort: "city" as const,
          kosten: {},
          bouwtijdBeurten: 0,
          effect: { type: "stad" },
        },
      };
    });
    return { ...laag, tiles };
  });

  return {
    ...state,
    lagen,
    voorraad: {
      ...state.voorraad,
      hout: state.voorraad.hout - STICHTING_KOSTEN.hout,
      steen: state.voorraad.steen - STICHTING_KOSTEN.steen,
      erts: state.voorraad.erts - STICHTING_KOSTEN.erts,
    },
    voedsel: state.voedsel - STICHTING_KOSTEN.voedsel,
    settler: undefined,
    stadGesticht: true,
  };
}
