// Boon-systeem (M24-voorstel, issue #411 → beantwoord en gebouwd in issue
// #414): bij elke niet-afsluitende stichting binnen het herhalende
// drie-stichtingsmomenten-patroon (hoofdstuk 9 Deel 2 van het hoofddocument)
// een random, permanente, run-brede Boon toekennen — maar alleen als de
// zojuist verlaten stad `grootte === "groot"` had bereikt. Zie
// campaigns/going-west/ontwerp.md ("Boon-systeem") voor het volledige
// voorstel; de vier daar genoemde open ontwerpvragen zijn in issue #414
// beantwoord:
// 1. Trekking zonder terugleggen — een al bezeten Boon-id valt uit de pool
//    voor een volgende trekking, zie `trekBoon` hieronder.
// 2. Boons zijn run-breed opgeslagen (`GameState.boons`, niet `City.relics`
//    zoals het nooit-uitgebouwde relic-concept) en overleven dus een latere
//    stad-ineenstorting, zolang de run zelf doorgaat.
// 3. Niet Going-West-exclusief (anders dan onrust.ts): generiek voor elke
//    campagne, behalve de tutorial — zie `komtInAanmerkingVoorBoon`.
// 4. De pop-up-plek zit in de `toonBoonPopup`-gating in GameRoot.tsx, direct
//    ná `toonStichtingsMomentPopup` en vóór elke andere pop-up.
//
// De inhoud van de individuele Boons (welke mechanische bonussen, hoeveel)
// is uitgewerkt in issue #428: de eerste echte Boon, "Voorraadschuur van de
// Voorvaderen". Zolang de pool nog maar dit ene lid heeft, krijgt de speler
// 'm in de praktijk altijd — dat is opzettelijk (issue #428: "geeft niet, we
// gaan er nog veel meer Boons bij maken"), niet een bug in `trekBoon`.
//
// Tweede Boon, "Oude Handelsroute" (issue #431): anders dan de
// Voorraadschuur hierboven geen eenmalig effect bij toekenning, maar een
// terugkerende, per-beurt opbrengst — zie `verwerkOudeHandelsrouteBoon`
// onderaan dit bestand, aangeroepen vanuit `volgendeBeurt` (economie.ts).
// Levert wampum op (`GameState.wampum`, hetzelfde veld als de Wampanoag-
// handel/-afkoop, indringersEnDieren.ts) — bewust geen ander/nieuw
// resource-type: de speler kan er nu al indringers mee afkopen, en de issue
// zelf noemt dat een latere campagne het gewoon een andere naam mag geven
// (net als `techNamen`/`improvementNamen`, CampaignConfig in types.ts) zonder
// dat dit bestand daarvoor hoeft te wijzigen.
//
// Derde Boon, "Zegeningen van het Moederland" (issue #540): anders dan de
// twee hierboven heeft deze geen vast effect bij toekenning — de speler kiest
// eerst een moederland uit `MOEDERLANDEN` hieronder (`pasBoonEffectToe` zet
// alleen `moederlandKeuzeEvent`, `kiesMoederland` legt de keuze vast, zelfde
// blokkerende-keuze-vorm als `kiesTech` in tech.ts). Daarna levert die keuze,
// net als Oude Handelsroute, een terugkerende opbrengst per interval
// (`verwerkZegeningenVanHetMoederlandBoon`) — nu van een gewone,
// opslag-cap-gebonden grondstof (hout/steen/erts) of voedsel, in plaats van
// wampum.
//
// Vierde Boon, "Trail Blazer" (issue #539, herzien in dezelfde issue naar de
// huidige puntenvorm): anders dan de drie hierboven geen terugkerende of
// eenmalige grondstofopbrengst, maar een blijvende, puntengedreven
// uitzondering op de kernregel "de settler blijft binnen al ontgrendeld
// gebied" (hoofdstuk 16, wegen.ts: `magSettlerNaar`). Zolang de speler deze
// Boon heeft, mag de settler ook individuele vakjes buiten al ontgrendeld
// gebied in lopen — elk zo'n vakje kost 1 trailblazer-punt
// (`TRAIL_BLAZER_PUNTEN_KOSTEN_PER_VAKJE`) en blijft daarna blijvend
// begaanbaar (`Tile.trailOntdekt`, types.ts). De speler krijgt elke
// `TRAIL_BLAZER_PUNTEN_INTERVAL_BEURTEN` beurten `TRAIL_BLAZER_PUNTEN_PER_INTERVAL`
// nieuwe punten (`verwerkTrailBlazerPunten` onderaan dit bestand) — die
// puntenrem voorkomt dat de speler in één beurt de hele kaart verkent
// (issue-discussie #539, expliciet de reden voor de puntenvorm i.p.v. de
// eerdere, ongelimiteerde "hele volgende streek in"-versie).
//
// Nadrukkelijk anders dan de normale, cultuur-gedreven streek-ontgrendeling
// (`verwerkStreekOntgrendeling`, streekOntgrendeling.ts): een via Trail
// Blazer ontdekt vakje maakt de streek zelf niet ontgrendeld en triggert geen
// van de eenmalige streek-ontdekkingsevents (Goudader, stichtingskans,
// rivier-aankondiging, Lakota-scout, de gegarandeerde roofdier-kudde) — "de
// trailblazer ontdekt individuele vakjes en geen streken, de huidige
// streek-logica blijft ongewijzigd" (issue-discussie #539). Zolang
// `Streek.ontgrendeld` op zo'n streek `false` blijft, blokkeert `startBouw`
// (infrastructuurEnBouw.ts) er automatisch elke land improvement — alleen
// een weg aanleggen (`legWegAan`, acties.ts, die nooit op `ontgrendeld`
// controleert) blijft er wel mogelijk, op verzoek in dezelfde issue-discussie.
// Het bewegingsmechanisme zelf leeft in wegen.ts (`magSettlerNaar`/
// `ontdekVakjeViaTrailBlazer`), aangeroepen vanuit `verplaatsSettlerNaar`
// (acties.ts); hier alleen de pool-vermelding en de punten-accrual, zelfde
// generieke niet-Going-West-exclusieve regel als de andere Boons hierboven
// (`komtInAanmerkingVoorBoon`).
import { GameState, MateriaalType, MoederlandId } from "./types";

export const TRAIL_BLAZER_BOON_ID = "trail-blazer";

// Puntenritme van "Trail Blazer" (issue #539): elke zoveel beurten een vaste
// hoeveelheid nieuwe punten, zelfde interval-conventie als
// `OUDE_HANDELSROUTE_INTERVAL_BEURTEN`/`ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN`
// hieronder — bewuste MVP-richtwaarden, expliciet door de opdrachtgever
// aangeleverd.
export const TRAIL_BLAZER_PUNTEN_INTERVAL_BEURTEN = 20;
export const TRAIL_BLAZER_PUNTEN_PER_INTERVAL = 5;
// Kosten om één individueel vakje buiten al ontgrendeld gebied te ontdekken
// (`ontdekVakjeViaTrailBlazer`, wegen.ts) — vast op 1 punt per vakje, zodat
// het interval hierboven direct het maximale aantal nieuw te ontdekken
// vakjes per venster van `TRAIL_BLAZER_PUNTEN_INTERVAL_BEURTEN` beurten
// bepaalt.
export const TRAIL_BLAZER_PUNTEN_KOSTEN_PER_VAKJE = 1;

export interface Boon {
  id: string;
  naam: string;
  beschrijving: string;
}

// Opslagcap-bonus van "Voorraadschuur van de Voorvaderen" (issue #428):
// bovenop andere opslag-verhogende bronnen (Opslagplaats-improvement, Weven/
// Aardewerk-tech, zie OPSLAGPLAATS in improvements.ts resp. `kiesTech` in
// tech.ts) — en de speler krijgt bij toekenning meteen zoveel van elke
// gedeelde-opslag-grondstof (`MateriaalType`, types.ts) erbij.
export const VOORRAADSCHUUR_OPSLAG_BONUS = 15;

// Interval van "Oude Handelsroute" (issue #431): elke zoveel beurten levert
// de Boon 1 wampum op, zie `verwerkOudeHandelsrouteBoon` onderaan dit bestand.
export const OUDE_HANDELSROUTE_INTERVAL_BEURTEN = 5;

// Interval en ladinggrootte van "Zegeningen van het Moederland" (issue #540):
// elke zoveel beurten levert de Boon een lading van de grondstof die bij het
// gekozen moederland hoort, zie `MOEDERLANDEN` en
// `verwerkZegeningenVanHetMoederlandBoon` hieronder.
export const ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN = 10;
export const ZEGENINGEN_VAN_HET_MOEDERLAND_LADING = 5;

export const BOON_POOL: Boon[] = [
  {
    id: "voorraadschuur-van-de-voorvaderen",
    naam: "Voorraadschuur van de Voorvaderen",
    beschrijving: `+${VOORRAADSCHUUR_OPSLAG_BONUS} opslagcapaciteit, bovenop je andere opslag-verhogende improvements — en je hout, steen, erts en goud vullen meteen met evenveel aan.`,
  },
  {
    id: "oude-handelsroute",
    naam: "Oude Handelsroute",
    beschrijving: `Elke ${OUDE_HANDELSROUTE_INTERVAL_BEURTEN} beurten +1 wampum — hiermee kun je indringers tijdelijk afkopen.`,
  },
  {
    id: "zegeningen-van-het-moederland",
    naam: "Zegeningen van het Moederland",
    beschrijving: `Kies bij toekenning een moederland. Daarna levert dat elke ${ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN} beurten ${ZEGENINGEN_VAN_HET_MOEDERLAND_LADING} van een vaste grondstof: Ierland voedsel, Duitsland hout, Engeland erts, Italië steen.`,
  },
  {
    id: TRAIL_BLAZER_BOON_ID,
    naam: "Trail Blazer",
    beschrijving: `Elke ${TRAIL_BLAZER_PUNTEN_INTERVAL_BEURTEN} beurten ${TRAIL_BLAZER_PUNTEN_PER_INTERVAL} trailblazer-punten. Met een punt mag je settler een los vakje buiten al ontgrendeld gebied in lopen en ontdekken — geen hele streek, en niet bebouwbaar met improvements, maar je mag er wel een weg op aanleggen.`,
  },
];

// Moederland-opties van "Zegeningen van het Moederland" (issue #540): de
// speler kiest er bij toekenning één (`kiesMoederland` hieronder), en krijgt
// daarna elke `ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN` beurten een
// lading van de bijbehorende grondstof (`verwerkZegeningenVanHetMoederlandBoon`).
export interface Moederland {
  id: MoederlandId;
  naam: string;
  grondstof: MateriaalType | "voedsel";
}

export const MOEDERLANDEN: Moederland[] = [
  { id: "ierland", naam: "Ierland", grondstof: "voedsel" },
  { id: "duitsland", naam: "Duitsland", grondstof: "hout" },
  { id: "engeland", naam: "Engeland", grondstof: "erts" },
  { id: "italie", naam: "Italië", grondstof: "steen" },
];

export function moederlandMetId(id: MoederlandId): Moederland | undefined {
  return MOEDERLANDEN.find((moederland) => moederland.id === id);
}

// Of de stad die de speler net verlaat (`state.stad`, gelezen vóórdat
// `stichtStad` haar vervangt door de nieuwe stad) kans geeft op een Boon:
// elke niet-afsluitende stichting, mits die stad "groot" was (issue #411) —
// en niet in de tutorial (issue #414, vraag 3), zelfde tutorial-uitzondering
// als `toonStichtingsMomentPopup` in GameRoot.tsx.
export function komtInAanmerkingVoorBoon(state: GameState, isAfsluitendeStichting: boolean): boolean {
  return !isAfsluitendeStichting && state.campagneId !== undefined && state.stad.grootte === "groot";
}

// Trekt een willekeurige, nog niet bezeten Boon uit de pool (issue #414,
// vraag 1: trekking zonder terugleggen). `undefined` als de speler
// inmiddels alle Boons uit de pool al heeft.
export function trekBoon(gehad: string[], random: () => number = Math.random): Boon | undefined {
  const beschikbaar = BOON_POOL.filter((boon) => !gehad.includes(boon.id));
  if (beschikbaar.length === 0) return undefined;
  return beschikbaar[Math.floor(random() * beschikbaar.length)];
}

export function boonMetId(id: string): Boon | undefined {
  return BOON_POOL.find((boon) => boon.id === id);
}

// Sluit de Boon-toekenningsmelding — puur een UI-bevestiging, zelfde patroon
// als `sluitGoudOntdektMelding` (streekOntgrendeling.ts).
export function sluitBoonMelding(state: GameState): GameState {
  return { ...state, boonToegekendEvent: undefined };
}

// Past het mechanische effect van een zojuist toegekende Boon toe (issue
// #428) — losstaand van `trekBoon` aangeroepen, direct bij toekenning, zelfde
// volgorde-conventie als het kiezen van Weven/Aardewerk in `kiesTech`
// (tech.ts): het effect verwerkt zich meteen, niet pas bij het wegklikken van
// de pop-up. Onbekende/toekomstige Boon-ids zonder mechanisch effect laten de
// state ongewijzigd.
export function pasBoonEffectToe(state: GameState, boonId: string): GameState {
  if (boonId === "voorraadschuur-van-de-voorvaderen") {
    const opslagCap = state.opslagCap + VOORRAADSCHUUR_OPSLAG_BONUS;
    return {
      ...state,
      opslagCap,
      voorraad: {
        hout: Math.min(opslagCap, state.voorraad.hout + VOORRAADSCHUUR_OPSLAG_BONUS),
        steen: Math.min(opslagCap, state.voorraad.steen + VOORRAADSCHUUR_OPSLAG_BONUS),
        erts: Math.min(opslagCap, state.voorraad.erts + VOORRAADSCHUUR_OPSLAG_BONUS),
        goud: Math.min(opslagCap, state.voorraad.goud + VOORRAADSCHUUR_OPSLAG_BONUS),
      },
    };
  }
  // "Oude Handelsroute" (issue #431) heeft zelf geen effect-bij-toekenning —
  // de opbrengst loopt pas via `verwerkOudeHandelsrouteBoon` hieronder, elke
  // beurt. Wel meteen `wampumOntvangen` zetten: dat veld bepaalt of de
  // wampum-voorraad in de HUD getoond wordt (ResourceHud.tsx), en zonder deze
  // zet zou een speler die deze Boon buiten de Wampanoag-opening om krijgt
  // (elke niet-tutorial-campagne, komtInAanmerkingVoorBoon hierboven) wampum
  // zien binnenkomen zonder dat de HUD 'm laat zien.
  if (boonId === "oude-handelsroute") {
    return { ...state, wampumOntvangen: true };
  }
  // "Zegeningen van het Moederland" (issue #540) heeft, anders dan de twee
  // hierboven, geen zelfstandig effect bij toekenning — de speler moet eerst
  // een moederland kiezen. `moederlandKeuzeEvent` opent die blokkerende
  // pop-up (`kiesMoederland` hieronder legt de keuze vast); de terugkerende
  // opbrengst zelf loopt pas daarna via `verwerkZegeningenVanHetMoederlandBoon`.
  if (boonId === "zegeningen-van-het-moederland") {
    return { ...state, moederlandKeuzeEvent: true };
  }
  // "Trail Blazer" (issue #539) heeft geen effect bij toekenning zelf —
  // anders dan de drie hierboven zit het mechanisme niet in dit bestand, maar
  // in de settler-bewegingsregels (`magSettlerNaar`/`ontdekVakjeViaTrailBlazer`,
  // wegen.ts), die zelf op `state.boons.includes(TRAIL_BLAZER_BOON_ID)`
  // controleren. De eerste punten komen pas bij de eerstvolgende
  // `TRAIL_BLAZER_PUNTEN_INTERVAL_BEURTEN`-drempel (`verwerkTrailBlazerPunten`
  // hieronder), dus er is hier niets vast te leggen bij toekenning.
  if (boonId === TRAIL_BLAZER_BOON_ID) {
    return state;
  }
  return state;
}

// Legt de moederland-keuze van "Zegeningen van het Moederland" vast (issue
// #540) — zelfde blokkerende-keuze-conventie als `kiesTech` (tech.ts):
// negeert een ongeldige aanroep (geen openstaande keuze).
export function kiesMoederland(state: GameState, moederlandId: MoederlandId): GameState {
  if (!state.moederlandKeuzeEvent) return state;
  return { ...state, gekozenMoederland: moederlandId, moederlandKeuzeEvent: undefined };
}

// Terugkerende opbrengst van "Oude Handelsroute" (issue #431): +1 wampum
// elke `OUDE_HANDELSROUTE_INTERVAL_BEURTEN` beurten, zolang de speler deze
// Boon bezit. Aangeroepen vanuit `volgendeBeurt` (economie.ts) met de zojuist
// opgehoogde beurtteller (`nieuweBeurt`) — dezelfde beurt waarin de state
// straks ook `beurt: nieuweBeurt` krijgt, zodat de uitkering en de zichtbare
// beurtteller in lockstap blijven (beurt 5, 10, 15, ...).
export function verwerkOudeHandelsrouteBoon(state: GameState, nieuweBeurt: number): GameState {
  if (!state.boons.includes("oude-handelsroute")) return state;
  if (nieuweBeurt % OUDE_HANDELSROUTE_INTERVAL_BEURTEN !== 0) return state;
  return { ...state, wampum: state.wampum + 1 };
}

// Terugkerende opbrengst van "Zegeningen van het Moederland" (issue #540):
// elke `ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN` beurten een lading
// van de grondstof die bij het gekozen moederland hoort — zelfde
// interval-conventie en aanroeppunt (`volgendeBeurt`, economie.ts, met de
// zojuist opgehoogde `nieuweBeurt`) als `verwerkOudeHandelsrouteBoon`
// hierboven. Zonder een gekozen moederland (de keuze-pop-up staat nog open)
// gebeurt er niets — dat kan hoogstens de beurt waarin de Boon is toegekend
// voorkomen, want de keuze-pop-up laat de speler niet verder spelen zonder te
// kiezen. Voedsel heeft geen gedeelde opslag-cap (zie `MateriaalType` hierboven
// in dit bestand); hout/steen/erts wel, dus die kappen aan `state.opslagCap`,
// zelfde patroon als elders in dit bestand (`pasBoonEffectToe` hierboven).
export function verwerkZegeningenVanHetMoederlandBoon(state: GameState, nieuweBeurt: number): GameState {
  if (!state.boons.includes("zegeningen-van-het-moederland")) return state;
  if (nieuweBeurt % ZEGENINGEN_VAN_HET_MOEDERLAND_INTERVAL_BEURTEN !== 0) return state;
  const moederland = state.gekozenMoederland && moederlandMetId(state.gekozenMoederland);
  if (!moederland) return state;

  if (moederland.grondstof === "voedsel") {
    return { ...state, voedsel: state.voedsel + ZEGENINGEN_VAN_HET_MOEDERLAND_LADING };
  }
  return {
    ...state,
    voorraad: {
      ...state.voorraad,
      [moederland.grondstof]: Math.min(
        state.opslagCap,
        state.voorraad[moederland.grondstof] + ZEGENINGEN_VAN_HET_MOEDERLAND_LADING
      ),
    },
  };
}

// Puntenritme van "Trail Blazer" (issue #539): elke
// `TRAIL_BLAZER_PUNTEN_INTERVAL_BEURTEN` beurten `TRAIL_BLAZER_PUNTEN_PER_INTERVAL`
// nieuwe punten erbij — zelfde interval-conventie en aanroeppunt
// (`volgendeBeurt`, economie.ts, met de zojuist opgehoogde `nieuweBeurt`) als
// `verwerkOudeHandelsrouteBoon`/`verwerkZegeningenVanHetMoederlandBoon`
// hierboven. Punten stapelen gewoon op als de speler ze niet meteen
// gebruikt — geen cap, geen "verval" — het interval zelf is al de rem op hoe
// snel er ontdekt kan worden (zie de toelichting bovenaan dit bestand).
export function verwerkTrailBlazerPunten(state: GameState, nieuweBeurt: number): GameState {
  if (!state.boons.includes(TRAIL_BLAZER_BOON_ID)) return state;
  if (nieuweBeurt % TRAIL_BLAZER_PUNTEN_INTERVAL_BEURTEN !== 0) return state;
  return { ...state, trailblazerPunten: state.trailblazerPunten + TRAIL_BLAZER_PUNTEN_PER_INTERVAL };
}
