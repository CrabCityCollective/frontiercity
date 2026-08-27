// Technologie-boom (hoofdstuk 3/9/11/13, issue: "tech tree toevoegen"):
// wetenschap ontgrendelt geen los vooruitkijk-bereik (dat blijft post-MVP,
// hoofdstuk 13), maar een vertakkende keuzeboom van 3 drempels, elk met 2
// opties. Bij het bereiken van een drempel kiest de speler één van de twee
// getoonde technologieën; de niet-gekozen tech en alles wat daaronder in de
// boom hing, is voor de rest van de run permanent onbereikbaar (hoofdstuk 11).
//
// Elke tech is een functionele sleutel (`TechId`, types.ts), los van zijn
// naam/flavor-tekst — dezelfde herbruikbare aanpak als de tegel-sets per
// campagne (hoofdstuk 13: `CampaignConfig.tegelSet`). `techNaam()` onderaan
// dit bestand levert de actieve naam (campagne-override, anders de
// tutorial-naam uit `TECH_TREE`).
//
// Pure data + query-functies, net als world.ts/improvements.ts — de
// state-mutaties zelf (`verwerkTechDrempel`, `kiesTech`) staan in economie.ts.

import { CampaignConfig, TechDrempel, TechId } from "./types";

export interface TechNode {
  id: TechId;
  drempel: TechDrempel;
  // Vereiste, eerder gekozen tech op de vorige drempel — `undefined` alleen
  // bij drempel 1 (de twee startrichtingen, geen vereiste).
  ouder?: TechId;
  tutorialNaam: string;
  // Functionele beschrijving van het effect, voor de keuze-pop-up — net als
  // de naam campagne-onafhankelijk (het effect zelf verandert nooit per
  // campagne, alleen het jasje).
  beschrijving: string;
}

// Vast te leggen boomstructuur (issue, Deel 2 — letterlijk overgenomen):
//
// Drempel 1: A. Vuur temmen (economie: landbouw/opslag) | B. Het spoor lezen
// (mobiliteit: jacht/beweging)
// Drempel 2, vanuit A: A1. Aardewerk | A2. Zaadselectie
// Drempel 2, vanuit B: B1. Het wiel | B2. Speerwerper
// Drempel 3, vanuit A1: A1a. Weven | A1b. Kalkoven
// Drempel 3, vanuit A2: A2a. Veeteelt | A2b. Voorraadschuur
// Drempel 3, vanuit B1: B1a. Vlotten | B1b. Handkar
// Drempel 3, vanuit B2: B2a. Boogschieten | B2b. Verharde speren
export const TECH_TREE: Record<TechId, TechNode> = {
  "vuur-temmen": {
    id: "vuur-temmen",
    drempel: 1,
    tutorialNaam: "Vuur temmen",
    beschrijving: "Boerderij-opbrengst +15%.",
  },
  "spoor-lezen": {
    id: "spoor-lezen",
    drempel: 1,
    tutorialNaam: "Het spoor lezen",
    beschrijving: "Jachtopbrengst +1 voedsel.",
  },
  aardewerk: {
    id: "aardewerk",
    drempel: 2,
    ouder: "vuur-temmen",
    tutorialNaam: "Aardewerk",
    beschrijving:
      "Ontgrendelt de Voorraadkuil — een goedkoop land improvement met een kleine extra opslag. Opslag-cap direct +5.",
  },
  zaadselectie: {
    id: "zaadselectie",
    drempel: 2,
    ouder: "vuur-temmen",
    tutorialNaam: "Zaadselectie",
    beschrijving: "Boerderij-uitputting 15% trager.",
  },
  wiel: {
    id: "wiel",
    drempel: 2,
    ouder: "spoor-lezen",
    tutorialNaam: "Het wiel",
    beschrijving: "De settler legt een weg aan zonder dat dit zijn actie voor de beurt kost.",
  },
  speerwerper: {
    id: "speerwerper",
    drempel: 2,
    ouder: "spoor-lezen",
    tutorialNaam: "Speerwerper",
    beschrijving: "Kans op een roofdier bij jagen daalt fors.",
  },
  weven: {
    id: "weven",
    drempel: 3,
    ouder: "aardewerk",
    tutorialNaam: "Weven",
    beschrijving: "Opslag-cap +10.",
  },
  kalkoven: {
    id: "kalkoven",
    drempel: 3,
    ouder: "aardewerk",
    tutorialNaam: "Kalkoven",
    beschrijving: "Steen-opbrengst +20%.",
  },
  veeteelt: {
    id: "veeteelt",
    drempel: 3,
    ouder: "zaadselectie",
    tutorialNaam: "Veeteelt",
    beschrijving: "Bemande Wachttorens kosten geen voedsel meer.",
  },
  voorraadschuur: {
    id: "voorraadschuur",
    drempel: 3,
    ouder: "zaadselectie",
    tutorialNaam: "Voorraadschuur",
    beschrijving: "Voedselverbruik van de stad daalt.",
  },
  trekdier: {
    id: "trekdier",
    drempel: 3,
    ouder: "wiel",
    tutorialNaam: "Trekdier",
    beschrijving: "Land- en city improvements worden 20% sneller gebouwd.",
  },
  handkar: {
    id: "handkar",
    drempel: 3,
    ouder: "wiel",
    tutorialNaam: "Handkar",
    beschrijving: "De settler kan verplaatsen én een andere actie doen in dezelfde beurt.",
  },
  boogschieten: {
    id: "boogschieten",
    drempel: 3,
    ouder: "speerwerper",
    tutorialNaam: "Boogschieten",
    beschrijving: "Wachttoren beschermt ook de streek twee eronder.",
  },
  "verharde-speren": {
    id: "verharde-speren",
    drempel: 3,
    ouder: "speerwerper",
    tutorialNaam: "Verharde speren",
    beschrijving: "Strijders krijgen een lichte legerwaarde-bonus.",
  },
};

// Drempelkosten (hoofdstuk 14, Deel 3 van "tech tree toevoegen" — doorgerekend
// tegen de Sterrencirkel-opbrengst uit Deel 1): `kosten(drempel) =
// 20 + 20 × (drempel-1)²`, dus drempel 1 = 20, drempel 2 = 40, drempel 3 = 100.
// Zwaarder dan zowel de basisterm als de kwadratische factor van de
// cultuurcurve (`3 + 5 × (streek-1)²`, hoofdstuk 14) — bewust: wetenschap levert
// permanente, structurele bonussen op (een boerderij die voorgoed 20% meer
// opbrengt, een opslag-cap die voorgoed +10 is) in plaats van eenmalige
// toegang tot een streek, wat een hogere prijs rechtvaardigt (hoofdstuk 11).
//
// Basis en kwadratische factor verdubbeld van 10 naar 20 (issue: "techtree
// langzamer") — de oorspronkelijke curve (10/20/50) liet de volledige boom
// al rond beurt 42 voltooien (zie de doorrekening hieronder), ruim vóórdat de
// Bezette Streek (streek 13, hoofdstuk 6) in beeld komt: wetenschap stapelde
// zich daarna vrijwel ongebruikt op, dus Verkenning (`VERKENNING_KOSTEN_WETENSCHAP`,
// streekOntgrendeling.ts, dezelfde wetenschap-pool) hoefde in de praktijk
// nooit te concurreren met een openstaande techkeuze. De verdubbelde curve
// duwt drempel 3 voorbij dat punt, zodat er middenspel nog een reëele
// afweging is tussen sparen voor de volgende drempel en wetenschap uitgeven
// aan Verkenning.
//
// Doorrekening (indicatief, zelfde stijl als de cultuur-doorrekening,
// hoofdstuk 14) — LET OP: deze cijfers dateren van vóór "jagen en farmen
// omdraaien" (Sterrencirkel/Wetenschappelijk schoof van streek 3 naar 4, de
// openingsbouw is nu Steengroeve/Heiligdom i.p.v. Houtkap → Boerderij →
// Steengroeve → Heiligdom), en zijn dus indicatief, geen herrekende balans:
// met een near-optimale opening is het bouw-ritme na het Heiligdom
// (rond beurt 10) vrij voor een Sterrencirkel — actief rond beurt 17 (2
// beurten bouwtijd + settler-wegaanleg, zelfde tempo als het Heiligdom).
// Vanaf dan loopt wetenschap met 2/beurt op (1 Sterrencirkel op de frontier):
// drempel 1 (20) rond beurt 27, drempel 2 (40) rond beurt 37, drempel 3 (100)
// rond beurt 67 — een fors groter en oplopend verschil met de vergelijkbare
// cultuurstreken (streek 2 ~16, streek 3 ~24, streek 4 ~36) dan voorheen (3
// tot 9 beurten), en nu ook duidelijk voorbij het moment waarop de Bezette
// Streek gemiddeld in beeld komt (streek 13, rond beurt 26 bij een
// gemiddelde build, hoofdstuk 14) — precies de gevraagde concurrentie met
// Verkenning.
const WETENSCHAP_KOSTEN_BASIS = 20;
const WETENSCHAP_KOSTEN_KWADRATISCHE_FACTOR = 20;

export function wetenschapKostenVoorDrempel(drempel: TechDrempel): number {
  return WETENSCHAP_KOSTEN_BASIS + WETENSCHAP_KOSTEN_KWADRATISCHE_FACTOR * (drempel - 1) ** 2;
}

export function heeftTech(technologieen: TechId[], id: TechId): boolean {
  return technologieen.includes(id);
}

// De twee opties op de eerstvolgende drempel: vast bij drempel 1 (geen
// ouder), anders de twee kinderen van de laatst gekozen tech. Ongedefinieerd
// gedrag (lege array) als `ouder` geen kinderen heeft, wat alleen kan
// gebeuren bij een verkeerd aangeroepen drempel 4+ — de boom heeft er maar 3.
export function techKinderen(ouder?: TechId): [TechId, TechId] {
  if (!ouder) return ["vuur-temmen", "spoor-lezen"];
  const kinderen = (Object.values(TECH_TREE) as TechNode[]).filter((node) => node.ouder === ouder);
  return [kinderen[0].id, kinderen[1].id];
}

// Leesbare naam voor `id` (hoofdstuk 13: herbruikbaar per campagne, zelfde
// aanpak als `tegelSet`) — valt terug op de tutorial-naam als de actieve
// campagne (nog) geen eigen naam voor deze sleutel heeft. `campagne` is
// optioneel: de MVP kent alleen de tutorial en heeft dus nog geen actieve
// `CampaignConfig` om hier doorheen te geven.
export function techNaam(id: TechId, campagne?: CampaignConfig): string {
  return campagne?.techNamen?.[id] ?? TECH_TREE[id].tutorialNaam;
}

// --- Effect-helpers (Deel 2, effectentabel) ---------------------------------
// Elke helper leest alleen `technologieen` (nooit de volledige `GameState`)
// zodat ze overal in economie.ts droog toepasbaar zijn, ook op plekken die
// zelf geen `GameState` bij de hand hebben (bv. binnen een `tiles.map`).

// A. Vuur temmen: boerderij-opbrengst +15% (issue: "Technologie-boom
// herbalanceren" — was +20%, verlaagd omdat deze tak al direct op voedsel
// ingreep en daarmee de kernspanning van het spel te veel demonteerde,
// hoofdstuk 4/11).
export function boerderijOpbrengstFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "vuur-temmen") ? 1.15 : 1;
}

// B. Het spoor lezen: jachtopbrengst +1 (issue: "Technologie-boom
// herbalanceren" — Boogschieten's eigen nogmaals-+1 hier is vervallen, zie
// `wachttorenBeschermingsbereik` hieronder voor zijn nieuwe effect).
export function jachtVoedselBonus(technologieen: TechId[]): number {
  return heeftTech(technologieen, "spoor-lezen") ? 1 : 0;
}

// A2. Zaadselectie: boerderij-uitputting 15% trager (langere levensduur) —
// issue: "Technologie-boom herbalanceren", was 25%, samen met de verlaagde
// Vuur temmen-bonus hierboven om de A-tak minder eenzijdig sterk te maken.
export function boerderijUitputtingFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "zaadselectie") ? 1.15 : 1;
}

// A1b. Kalkoven: steen-opbrengst +20%.
export function steenOpbrengstFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "kalkoven") ? 1.2 : 1;
}

// A1a. Weven: opslag-cap +10 — toegepast als eenmalige bonus op het moment
// van kiezen (tech.ts: `kiesTech`), net als de Opslagplaats-improvement bij
// voltooiing. Hier alleen de constante, geen berekenfunctie nodig.
export const OPSLAGCAP_BONUS_WEVEN = 10;

// A1. Aardewerk: naast de Voorraadkuil-ontgrendeling ook direct +5
// opslag-cap bij het kiezen zelf (issue: "Technologie-boom herbalanceren" —
// zelfde eenmalige-toepassing-patroon als `OPSLAGCAP_BONUS_WEVEN`, om
// Aardewerk minder eenzijdig zwakker te laten aanvoelen dan Zaadselectie).
export const OPSLAGCAP_BONUS_AARDEWERK = 5;

// A2a. Veeteelt: bemande Wachttorens verbruiken geen voedsel meer (issue:
// "Technologie-boom herbalanceren" — herthematisering van het oude
// "kuddes verschijnen vaker"-effect, dat nutteloos werd zodra de speler niet
// meer actief jaagt, hoofdstuk 11). Gebruikt door `voedselVerbruik`
// (productie.ts) als multiplier op `WACHTTOREN_VOEDSEL_VERBRUIK`.
export function wachttorenVoedselkostFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "veeteelt") ? 0 : 1;
}

// A2b. Voorraadschuur: voedselverbruik van de stad daalt (vaste aftrek).
export function voedselVerbruikVermindering(technologieen: TechId[]): number {
  return heeftTech(technologieen, "voorraadschuur") ? 1 : 0;
}

// B2. Speerwerper: roofdier-kans ×0,4 (issue: "Technologie-boom
// herbalanceren" — Boogschieten's eigen nogmaals-×0,5 hier is vervallen, zie
// `wachttorenBeschermingsbereik` hieronder voor zijn nieuwe effect).
export function roofdierKansFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "speerwerper") ? 0.4 : 1;
}

// B2a. Boogschieten: de Wachttoren die een streek beschermt mag ook twee
// streken erboven vandaan komen in plaats van maar één (issue:
// "Technologie-boom herbalanceren" — herthematisering van het oude
// "roofdierkans/jachtopbrengst nogmaals beter"-effect, dat een uitfaserende
// jacht-mechaniek bufte). Gebruikt door `vindBeschermendeWachttoren`
// (indringersEnDieren.ts): 2 zonder deze tech (de bestaande situatie — eigen
// streek + de streek erboven), 3 mét (eigen streek + twee streken erboven).
export function wachttorenBeschermingsbereik(technologieen: TechId[]): number {
  return heeftTech(technologieen, "boogschieten") ? 3 : 2;
}

// B2b. Verharde speren: lichte legerwaarde-bonus per strijder.
export function legerwaardeBonusPerStrijder(technologieen: TechId[]): number {
  return heeftTech(technologieen, "verharde-speren") ? 1 : 0;
}

// B1. Het wiel: wegaanleg kost de settler geen aparte actie meer (zie
// `legWegAan` in economie.ts — het huidige mechanisme kost al maar één beurt,
// hoofdstuk 16, dus dit is de dichtstbijzijnde zinvolle interpretatie van
// "sneller wegen aanleggen"; zie de PR-samenvatting voor de volledige
// toelichting op deze afwijking).
export function settlerWegaanlegGratis(technologieen: TechId[]): boolean {
  return heeftTech(technologieen, "wiel");
}

// B1b. Handkar: de settler kan verplaatsen én een andere actie doen in
// dezelfde beurt (verplaatsen zelf kost dan geen aparte actie meer).
export function settlerBeweegtGratis(technologieen: TechId[]): boolean {
  return heeftTech(technologieen, "handkar");
}

// B1a. Trekdier (issue: "Technologie-boom herbalanceren" — vervangt de
// niet-functionele Vlotten-tech, thematisch een logisch vervolg op Wiel: een
// lastdier maakt het wiel pas echt nuttig): land- en city improvements
// worden 20% sneller gebouwd. Gebruikt door `bouwwachtrij.ts` als factor op
// de resterende bouwtijd (`bouwtijdBeurten`), niet op de materiaalkosten
// zelf — nooit toegepast op `soort: "unit"`-wachtrijen (Soldaat/Missionaris/
// Rechter/Nieuwe settler), die houden hun eigen tempo.
export function bouwtijdFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "trekdier") ? 0.8 : 1;
}
