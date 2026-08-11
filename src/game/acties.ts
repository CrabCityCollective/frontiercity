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

// Roofdieren (hoofdstuk 14/17, issue: "roofdieren toevoegen"; verschoven naar
// streek 1, issue: "jagen en farmen omdraaien" — nu de jacht al vanaf streek
// 1 de belangrijkste voedselbron is, hoort het roofdier-risico er vanaf het
// begin bij, niet pas veel later): vanaf `ROOFDIER_MIN_STREEK` heeft elke
// jachtactie (niet elke beurt/streek zoals indringers/kuddes in
// indringersEnDieren.ts) een kans om een roofdier op te roepen op het
// jachtvakje zelf. Bewuste MVP-placeholder, net als de overige
// tuning-getallen hierboven.
const ROOFDIER_MIN_STREEK = 1;
const ROOFDIER_KANS = 0.15;

// Verplaatst de settler naar een aangeklikte tile (issue: "de tegels waar je
// heen kunt lichten op, door te klikken op een tegel ga je er naar toe"),
// als er niet al een settler-actie deze beurt gebruikt is en de tile één van
// de direct bereikbare buurvakjes is. Negeert de aanroep stilzwijgend bij een
// ongeldige zet — de canvas (GameRoot) markeert alleen de bereikbare vakjes
// als klikbaar, dit is een tweede, veilige check (zelfde patroon als
// `startBouw`/terrein-eisen).
export function verplaatsSettlerNaar(state: GameState, hoogte: number, positieInStreek: number): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const magErheen = bereikbarePosities(state.streken, state.settler).some(
    (positie) => positie.hoogte === hoogte && positie.positieInStreek === positieInStreek
  );
  if (!magErheen) return state;

  // "B1b. Handkar" (hoofdstuk 3/9, techTree.ts): verplaatsen kost dan geen
  // aparte settler-actie meer, dus de speler kan deze beurt nog een andere
  // actie (weg aanleggen/jagen/hout hakken) uitvoeren.
  const kostGeenActie = settlerBeweegtGratis(state.technologieen);
  return {
    ...state,
    settler: { hoogte, positieInStreek },
    settlerActieGedaanDitBeurt: kostGeenActie ? state.settlerActieGedaanDitBeurt : true,
  };
}

// Legt een weg aan op het vakje waar de settler nu staat (hoofdstuk 16): geen
// grondstoffen, alleen de settler-actie van deze beurt. Geen effect als er
// al een weg ligt of de settler deze beurt al gehandeld heeft.
export function legWegAan(state: GameState): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const { hoogte, positieInStreek } = state.settler;
  const streek = state.streken.find((l) => l.hoogte === hoogte);
  if (!streek || streek.tiles[positieInStreek]?.heeftWeg) return state;

  const streken = state.streken.map((l) => {
    if (l.hoogte !== hoogte) return l;
    const tiles = l.tiles.map((tile, index) => (index === positieInStreek ? { ...tile, heeftWeg: true } : tile));
    return { ...l, tiles };
  });

  // "B1. Het wiel" (hoofdstuk 3/9, techTree.ts): wegaanleg kost dan geen
  // aparte settler-actie meer.
  const kostGeenActie = settlerWegaanlegGratis(state.technologieen);
  return { ...state, streken, settlerActieGedaanDitBeurt: kostGeenActie ? state.settlerActieGedaanDitBeurt : true };
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
// `ROOFDIER_MIN_STREEK` heeft elke jachtbeurt een kans om een roofdier op te
// roepen, op hetzelfde vakje. Meldt dit meteen (`roofdierEvent`,
// fase "verschenen") — de daadwerkelijke aanval volgt pas een beurt later,
// zie `verwerkRoofdieren` (indringersEnDieren.ts) in `volgendeBeurt`.
export function jaag(state: GameState): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const { hoogte, positieInStreek } = state.settler;
  const streek = state.streken.find((l) => l.hoogte === hoogte);
  const tile = streek?.tiles[positieInStreek];
  if (!streek || !tile?.kudde) return state;

  const beurtenResterend = tile.kudde.beurtenResterend - 1;
  // "B2. Speerwerper" / "B2a. Boogschieten" (hoofdstuk 3/9, techTree.ts):
  // verlagen de roofdier-kans (`roofdierKansFactor`); "B. Het spoor lezen" /
  // "B2a. Boogschieten" verhogen de jachtopbrengst (`jachtVoedselBonus`).
  const roofdierVerschijnt =
    hoogte >= ROOFDIER_MIN_STREEK && Math.random() < ROOFDIER_KANS * roofdierKansFactor(state.technologieen);

  const streken = state.streken.map((l) => {
    if (l.hoogte !== hoogte) return l;
    const tiles = l.tiles.map((t, index) =>
      index === positieInStreek
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
    ? { hoogte, positieInStreek, fase: "verschenen" }
    : state.roofdierEvent;

  return {
    ...state,
    streken,
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

  const { hoogte, positieInStreek } = state.settler;
  const streek = state.streken.find((l) => l.hoogte === hoogte);
  const tile = streek?.tiles[positieInStreek];
  if (!streek || !tile || tile.terrein !== "bos" || tile.status === "ghost_town") return state;

  const voorraad = {
    ...state.voorraad,
    hout: Math.min(state.opslagCap, state.voorraad.hout + HOUTHAKKEN_HOUT_PER_BEURT),
  };

  return { ...state, voorraad, settlerActieGedaanDitBeurt: true };
}

// Stichtingskosten (hoofdstuk 2/14, issue: "stad stichten op de frontier"
// deel 3, narekenen van het voorstel "25 hout, 15 steen, 10 erts, 30
// voedsel"). Zie git-historie voor de oorspronkelijke, uitgebreidere
// onderbouwing van 40/15/10/30 (met name de opslag-cap-doorrekening die
// `hout` destijds boven de startcap van 30 duwde om een Opslagplaats af te
// dwingen).
//
// issue #187 ("stad stichten veel goedkoper"): alle vier bedragen zijn
// hierna 4x zo goedkoop gemaakt (gedeeld door 4, afgerond) — bewust op
// verzoek, ook al vervalt daarmee de hierboven bedoelde forcering van een
// vroege Opslagplaats (10 hout blijft nu ruim onder de startcap).
export const STICHTING_KOSTEN: { hout: number; steen: number; erts: number; voedsel: number } = {
  hout: 10,
  steen: 4,
  erts: 3,
  voedsel: 8,
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
  const streek = state.streken.find((l) => l.hoogte === settler.hoogte);
  const tile = streek?.tiles[settler.positieInStreek];
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
// streek 12" als tutorial-einddoel). De settler zelf verdwijnt hierbij: "de
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

  const { hoogte, positieInStreek } = state.settler!;
  const streken = state.streken.map((streek) => {
    if (streek.hoogte !== hoogte) return streek;
    const tiles = streek.tiles.map((tile, index) => {
      if (index !== positieInStreek) return tile;
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
    return { ...streek, tiles };
  });

  return {
    ...state,
    streken,
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
