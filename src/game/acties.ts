// Settler-acties (hoofdstuk 16/17): elke settler-eenheid kan per beurt
// hoogstens één actie doen — bewegen, een weg aanleggen, jagen op een kudde,
// of hout hakken — plus, als eindpunt van de tutorial, een nieuwe stad
// stichten (hoofdstuk 2/10/16, issue: "stad stichten op de frontier").
//
// Tweede settler (issue: "Altijd 2e settler" #236): elke functie hieronder
// neemt een `slot` parameter (default "primair", dus alle bestaande
// aanroepen blijven ongewijzigd werken) zodat dezelfde actielogica ook op
// `state.tweedeSettler` kan werken — de twee settlers handelen volledig
// onafhankelijk van elkaar (eigen positie, eigen `...ActieGedaanDitBeurt`-
// vlag), maar delen verder exact dezelfde regels/opbrengsten/risico's. Zie
// `leesSettler`/`leesActieGedaan`/`metSettlerUpdate` hieronder voor de
// gedeelde lees/schrijf-indirectie.
import { campagneConfig } from "./campagnes";
import { komtInAanmerkingVoorBoon, pasBoonEffectToe, trekBoon } from "./boons";
import { bereikbarePosities } from "./wegen";
import {
  jachtVoedselBonus,
  roofdierKansFactor,
  settlerBeweegtGratis,
  settlerWegaanlegGratis,
} from "./techTree";
import { City, GameState, RoofdierEvent, Settler } from "./types";
import { isGeschiktVoorStichten, ROOFDIER_MIN_STREEK } from "./world";

export type SettlerSlot = "primair" | "tweede";

function leesSettler(state: GameState, slot: SettlerSlot): Settler | undefined {
  return slot === "primair" ? state.settler : state.tweedeSettler;
}

function leesActieGedaan(state: GameState, slot: SettlerSlot): boolean {
  return slot === "primair" ? state.settlerActieGedaanDitBeurt : state.tweedeSettlerActieGedaanDitBeurt;
}

// "B1b. Handkar": of deze settler zijn ene gratis verplaatsing deze beurt al
// gebruikt heeft (zie `verplaatsSettlerNaar` hieronder).
function leesGratisBewogen(state: GameState, slot: SettlerSlot): boolean {
  return slot === "primair" ? state.settlerGratisBewogenDitBeurt : state.tweedeSettlerGratisBewogenDitBeurt;
}

function metGratisBewogenUpdate(
  state: GameState,
  slot: SettlerSlot,
  gratisGebruikt: boolean
): Pick<GameState, "settlerGratisBewogenDitBeurt" | "tweedeSettlerGratisBewogenDitBeurt"> {
  return slot === "primair"
    ? {
        settlerGratisBewogenDitBeurt: gratisGebruikt,
        tweedeSettlerGratisBewogenDitBeurt: state.tweedeSettlerGratisBewogenDitBeurt,
      }
    : {
        settlerGratisBewogenDitBeurt: state.settlerGratisBewogenDitBeurt,
        tweedeSettlerGratisBewogenDitBeurt: gratisGebruikt,
      };
}

// Bouwt het settler-/actie-vlag-deel van een state-update voor `slot`, zonder
// de andere settler-slot aan te raken — elke actiefunctie hieronder spreidt
// dit in zijn return-object.
function metSettlerUpdate(
  state: GameState,
  slot: SettlerSlot,
  settler: Settler | undefined,
  actieGedaan: boolean
): Pick<GameState, "settler" | "tweedeSettler" | "settlerActieGedaanDitBeurt" | "tweedeSettlerActieGedaanDitBeurt"> {
  return slot === "primair"
    ? {
        settler,
        tweedeSettler: state.tweedeSettler,
        settlerActieGedaanDitBeurt: actieGedaan,
        tweedeSettlerActieGedaanDitBeurt: state.tweedeSettlerActieGedaanDitBeurt,
      }
    : {
        settler: state.settler,
        tweedeSettler: settler,
        settlerActieGedaanDitBeurt: state.settlerActieGedaanDitBeurt,
        tweedeSettlerActieGedaanDitBeurt: actieGedaan,
      };
}

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
// `ROOFDIER_MIN_STREEK` (world.ts, sinds issue "Eerste streek geen
// roofdieren" streek 6 in plaats van streek 1) heeft elke jachtactie (niet
// elke beurt/streek zoals indringers/kuddes in indringersEnDieren.ts) een
// kans om een roofdier op te roepen op het jachtvakje zelf. Bewuste
// MVP-placeholder, net als de overige tuning-getallen hierboven.
const ROOFDIER_KANS = 0.15;

// Verplaatst de settler naar een aangeklikte tile (issue: "de tegels waar je
// heen kunt lichten op, door te klikken op een tegel ga je er naar toe"),
// als er niet al een settler-actie deze beurt gebruikt is en de tile één van
// de direct bereikbare buurvakjes is. Negeert de aanroep stilzwijgend bij een
// ongeldige zet — de canvas (GameRoot) markeert alleen de bereikbare vakjes
// als klikbaar, dit is een tweede, veilige check (zelfde patroon als
// `startBouw`/terrein-eisen).
export function verplaatsSettlerNaar(
  state: GameState,
  hoogte: number,
  positieInStreek: number,
  slot: SettlerSlot = "primair"
): GameState {
  const settler = leesSettler(state, slot);
  if (!settler || leesActieGedaan(state, slot)) return state;

  const magErheen = bereikbarePosities(state.streken, settler).some(
    (positie) => positie.hoogte === hoogte && positie.positieInStreek === positieInStreek
  );
  if (!magErheen) return state;

  // "B1b. Handkar" (hoofdstuk 3/9, techTree.ts): verplaatsen kost dan geen
  // aparte settler-actie meer, dus de speler kan deze beurt nog een andere
  // actie (weg aanleggen/jagen/hout hakken) uitvoeren — maar alleen de
  // éérste verplaatsing per beurt is gratis (`leesGratisBewogen`). Zonder
  // die beperking bleef `settlerActieGedaanDitBeurt` bij elke verplaatsing
  // op `false` staan en kon de settler onbeperkt doorlopen in 1 beurt
  // (issue: "tech met settler verplaatsen"); een volgende verplaatsing
  // gebruikt daarom weer gewoon de normale settler-actie.
  const gratisAlGebruikt = leesGratisBewogen(state, slot);
  const kostGeenActie = settlerBeweegtGratis(state.technologieen) && !gratisAlGebruikt;
  return {
    ...state,
    ...metSettlerUpdate(state, slot, { hoogte, positieInStreek }, kostGeenActie ? leesActieGedaan(state, slot) : true),
    ...metGratisBewogenUpdate(state, slot, kostGeenActie ? true : gratisAlGebruikt),
  };
}

// Legt een weg aan op het vakje waar de settler nu staat (hoofdstuk 16): geen
// grondstoffen, alleen de settler-actie van deze beurt. Geen effect als er
// al een weg ligt of de settler deze beurt al gehandeld heeft.
export function legWegAan(state: GameState, slot: SettlerSlot = "primair"): GameState {
  const settler = leesSettler(state, slot);
  if (!settler || leesActieGedaan(state, slot)) return state;

  const { hoogte, positieInStreek } = settler;
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
  return {
    ...state,
    streken,
    ...metSettlerUpdate(state, slot, settler, kostGeenActie ? leesActieGedaan(state, slot) : true),
  };
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
//
// Gegarandeerd eerste roofdier (issue: "Eerste streek geen roofdieren" —
// "gegarandeerd roofdieren" bij de introductie): de eerste jachtbeurt vanaf
// `ROOFDIER_MIN_STREEK` roept altijd een roofdier op, in plaats van de
// gewone kans hieronder — zelfde gegarandeerde-eerste-keer-patroon als
// `verwerkEersteKudde` (indringersEnDieren.ts). Zonder deze garantie zou de
// nieuwe introductie-pop-up (GameRoot: `RoofdierIntroPopup`) de speler
// kunnen waarschuwen voor een mechaniek die daarna alsnog een tijd op zich
// laat wachten (15% kans per jachtbeurt) — de garantie zorgt dat de speler
// 'm meteen daarna ook echt meemaakt, één keer, met de uitleg nog vers.
export function jaag(state: GameState, slot: SettlerSlot = "primair"): GameState {
  const settler = leesSettler(state, slot);
  if (!settler || leesActieGedaan(state, slot)) return state;

  const { hoogte, positieInStreek } = settler;
  const streek = state.streken.find((l) => l.hoogte === hoogte);
  const tile = streek?.tiles[positieInStreek];
  if (!streek || !tile?.kudde) return state;

  const beurtenResterend = tile.kudde.beurtenResterend - 1;
  const magRoofdier = hoogte >= ROOFDIER_MIN_STREEK;
  const eersteRoofdierGegarandeerd = magRoofdier && !state.eersteRoofdierVerschenen;
  // "B2. Speerwerper" (hoofdstuk 3/9, techTree.ts) verlaagt de roofdier-kans
  // (`roofdierKansFactor`); "B. Het spoor lezen" verhoogt de jachtopbrengst
  // (`jachtVoedselBonus`) — Boogschieten buft sinds "Technologie-boom
  // herbalanceren" niet langer deze twee, zie `wachttorenBeschermingsbereik`
  // (techTree.ts) voor zijn nieuwe effect.
  const roofdierVerschijnt =
    magRoofdier &&
    (eersteRoofdierGegarandeerd || Math.random() < ROOFDIER_KANS * roofdierKansFactor(state.technologieen));

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
    roofdierEvent,
    eersteRoofdierVerschenen: state.eersteRoofdierVerschenen || magRoofdier,
    ...metSettlerUpdate(state, slot, settler, true),
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
export function hakHout(state: GameState, slot: SettlerSlot = "primair"): GameState {
  const settler = leesSettler(state, slot);
  if (!settler || leesActieGedaan(state, slot)) return state;

  const { hoogte, positieInStreek } = settler;
  const streek = state.streken.find((l) => l.hoogte === hoogte);
  const tile = streek?.tiles[positieInStreek];
  if (!streek || !tile || tile.terrein !== "bos" || tile.status === "ghost_town") return state;

  const voorraad = {
    ...state.voorraad,
    hout: Math.min(state.opslagCap, state.voorraad.hout + HOUTHAKKEN_HOUT_PER_BEURT),
  };

  return { ...state, voorraad, ...metSettlerUpdate(state, slot, settler, true) };
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

// Namen van nieuw te stichten steden, in stichtingsvolgorde (hoofdstuk 10:
// prehistorisch klinkende stadsnamen naast Oer-stad). Geïndexeerd op
// `state.steden.length - 1` van vóór de stichting (0 voor de eerste stad die
// ná Oer-stad gesticht wordt, enzovoort) — in de tutorial is dat altijd
// index 0 ("Vuurbron", zie ook de afsluitende flavor-tekst in
// tutorialContent.ts die deze naam letterlijk noemt), maar het herhalende
// stichtingspatroon (hoofdstuk 9, Deel 2/M18) kan in een langere campagne
// meerdere steden na elkaar stichten. Valt terug op een generieke naam zodra
// de lijst op is — een campagne-specifieke naamlijst hoort net als de
// weergavenamen (hoofdstuk 9/13) bij de nog te bouwen `CampaignConfig`.
export const GESTICHTE_STAD_NAMEN = ["Vuurbron", "Asvallei"];

// Campagne-bewust: valt terug op `GESTICHTE_STAD_NAMEN` hierboven zolang de
// campagne geen eigen `stadNamen` heeft (of die lijst op is) — zelfde
// terugval-patroon als `improvementNaam()`/`techNaam()` (campagnes.ts).
function nieuweStadNaam(aantalStedenVoorStichting: number, campagneId?: string): string {
  const campagneNamen = campagneConfig(campagneId)?.stadNamen;
  return (
    campagneNamen?.[aantalStedenVoorStichting - 1] ??
    GESTICHTE_STAD_NAMEN[aantalStedenVoorStichting - 1] ??
    `Nieuwe stad ${aantalStedenVoorStichting}`
  );
}

// Of de settler nu op een geldig stichtingsdoel staat (hoofdstuk 2: aan
// vers water, en nog onbebouwd — zie `isGeschiktVoorStichten`). Gedeeld
// tussen `stichtStad` hieronder en de UI (SettlerPaneel/GameRoot), zodat de
// "Stad stichten"-knop alleen verschijnt wanneer de actie ook echt zou
// slagen.
export function kanStichten(state: GameState, slot: SettlerSlot = "primair"): boolean {
  const settler = leesSettler(state, slot);
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
// 2/9/10/16, issue: "stad stichten op de frontier" deel 4, uitgebreid door
// issue "Eerste bouwsteen van de Amerikaanse frontier-campagne" Deel 2/M18).
// De settler zelf verdwijnt hierbij: "de huifkar wordt de stad" (de UI
// waarschuwt hier vóóraf duidelijk voor, zie StichtStadPopup — deze functie
// voert de al-bevestigde actie alleen nog uit). Geen effect bij een
// ongeldige aanroep (verkeerde locatie of te weinig grondstoffen) — dezelfde
// twee-staps-veilige-aanroep-conventie als `startBouw`/`verplaatsSettlerNaar`
// hierboven.
//
// Voegt de nieuwe stad toe aan `state.steden` (in plaats van 'm te
// vervangen) en maakt haar de actieve stad — het herhalende
// stichtingspatroon (hoofdstuk 9, Deel 2) laat de run dus in principe
// doorlopen na het stichten, in tegenstelling tot vóór M18, toen élke
// stichting het (tutorial-)einddoel was. `stadGesticht` (GameRoot toont
// daarop de afsluitende scène) wordt daarom alleen gezet als dit de
// allerlaatste streek van de wereld is (hoofdstuk 9: "de allerlaatste,
// verplichte stichting blijft bij de oceaan aan het einde van de campagne
// ... die telt gewoon mee als een van deze cykli") — in de tutorial (14
// streken, precies één vers-water-vakje, op de laatste streek) is dat nog
// steeds elke keer het geval, dus dit blijft voor de tutorial exact hetzelfde
// gedrag als vóór M18, bevestigd door de bestaande tests. Verbruikt geen
// aparte settler-actie-vlag: dit is een beslissende zet, geen herhaalbare
// per-beurt-actie zoals bewegen/jagen/hakken.
export function stichtStad(state: GameState, slot: SettlerSlot = "primair"): GameState {
  if (!kanStichten(state, slot) || !heeftGenoegVoorStichten(state)) return state;

  const { hoogte, positieInStreek } = leesSettler(state, slot)!;
  const naam = nieuweStadNaam(state.steden.length, state.campagneId);
  const streken = state.streken.map((streek) => {
    if (streek.hoogte !== hoogte) return streek;
    const tiles = streek.tiles.map((tile, index) => {
      if (index !== positieInStreek) return tile;
      return {
        ...tile,
        status: "actief" as const,
        improvement: {
          id: "gestichte-stad",
          naam,
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

  const nieuweStad: City = {
    naam,
    grootte: "klein",
    relics: [],
    vervalStatus: "gezond",
    streekHoogte: hoogte,
    positieInStreek,
    strijders: [],
    missionarissen: [],
    rechters: [],
    ingenieurs: [],
    cityImprovements: [],
    heeftSmederij: false,
    smederijActief: true,
  };
  // Laatste streek van de wereld = de verplichte, campagne-afsluitende
  // stichting (hoofdstuk 1/9) — elke andere stichting is een tussentijdse
  // kans uit het herhalende patroon en laat de run doorlopen.
  const isAfsluitendeStichting = hoogte === state.streken.length;
  // Boon-systeem (issue #411/#414, boons.ts): getrokken vóórdat `state.stad`
  // hieronder door `nieuweStad` vervangen wordt — `komtInAanmerkingVoorBoon`
  // beoordeelt dus nog de zojuist verlaten stad, niet de net gestichte.
  const boon = komtInAanmerkingVoorBoon(state, isAfsluitendeStichting) ? trekBoon(state.boons) : undefined;

  const nieuweState: GameState = {
    ...state,
    streken,
    steden: [...state.steden, nieuweStad],
    stad: nieuweStad,
    voorraad: {
      ...state.voorraad,
      hout: state.voorraad.hout - STICHTING_KOSTEN.hout,
      steen: state.voorraad.steen - STICHTING_KOSTEN.steen,
      erts: state.voorraad.erts - STICHTING_KOSTEN.erts,
    },
    voedsel: state.voedsel - STICHTING_KOSTEN.voedsel,
    ...metSettlerUpdate(state, slot, undefined, leesActieGedaan(state, slot)),
    stadGesticht: isAfsluitendeStichting ? true : state.stadGesticht,
    boons: boon ? [...state.boons, boon.id] : state.boons,
    boonToegekendEvent: boon ? boon.id : state.boonToegekendEvent,
  };

  // Mechanisch Boon-effect (issue #428) wordt direct bij toekenning verwerkt
  // — zelfde volgorde-conventie als `kiesTech` (tech.ts) — ná de rest van de
  // stichtings-mutatie hierboven, zodat het effect op de nieuwe `voorraad`
  // toegepast wordt, niet op de nog-niet-verrekende oude.
  return boon ? pasBoonEffectToe(nieuweState, boon.id) : nieuweState;
}
