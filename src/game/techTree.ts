// Technologie-boom (hoofdstuk 3/9/11/13, issue: "tech tree toevoegen"):
// wetenschap ontgrendelt geen los vooruitkijk-bereik (dat blijft post-MVP,
// hoofdstuk 13), maar een vertakkende keuzeboom van 3 drempels, elk met 2
// opties. Bij het bereiken van een drempel kiest de speler één van de twee
// getoonde technologieën; de niet-gekozen tech en alles wat daaronder in de
// boom hing, is voor de rest van de run permanent onbereikbaar — dezelfde
// vertakkingslogica als de Anker-verhalen (hoofdstuk 9/11), nu toegepast op
// wetenschap in plaats van op verhaalmomenten.
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
    beschrijving: "Boerderij-opbrengst +20%.",
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
    beschrijving: "Ontgrendelt de Voorraadkuil — een goedkoop land improvement met een kleine extra opslag.",
  },
  zaadselectie: {
    id: "zaadselectie",
    drempel: 2,
    ouder: "vuur-temmen",
    tutorialNaam: "Zaadselectie",
    beschrijving: "Boerderij-uitputting 25% trager.",
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
    beschrijving: "Kuddes verschijnen vaker.",
  },
  voorraadschuur: {
    id: "voorraadschuur",
    drempel: 3,
    ouder: "zaadselectie",
    tutorialNaam: "Voorraadschuur",
    beschrijving: "Voedselverbruik van de stad daalt.",
  },
  vlotten: {
    id: "vlotten",
    drempel: 3,
    ouder: "wiel",
    tutorialNaam: "Vlotten",
    beschrijving: "De settler kan rivier-vakjes oversteken.",
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
    beschrijving: "Kans op een roofdier nogmaals lager, jachtopbrengst nogmaals +1.",
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
// 10 + 10 × (drempel-1)²`, dus drempel 1 = 10, drempel 2 = 20, drempel 3 = 50.
// Zwaarder dan zowel de basisterm als de kwadratische factor van de
// cultuurcurve (`3 + 5 × (laag-1)²`, hoofdstuk 14) — bewust: wetenschap levert
// permanente, structurele bonussen op (een boerderij die voorgoed 20% meer
// opbrengt, een opslag-cap die voorgoed +10 is) in plaats van eenmalige
// toegang tot een laag, wat een hogere prijs rechtvaardigt (hoofdstuk 11).
//
// Doorrekening (indicatief, zelfde stijl als de cultuur-doorrekening,
// hoofdstuk 14): met een near-optimale opening (Houtkap → Boerderij →
// Steengroeve → Heiligdom, hoofdstuk 14) is het bouw-ritme na het Heiligdom
// (rond beurt 10) vrij voor een Sterrencirkel — actief rond beurt 17 (2
// beurten bouwtijd + settler-wegaanleg, zelfde tempo als het Heiligdom).
// Vanaf dan loopt wetenschap met 2/beurt op (1 Sterrencirkel op de frontier):
// drempel 1 (10) rond beurt 22, drempel 2 (20) rond beurt 27, drempel 3 (50)
// rond beurt 42 — 3 tot 9 beurten trager dan de vergelijkbare cultuurlagen
// (laag 2 ~16, laag 3 ~24, laag 4 ~36), een oplopend en dus "merkbaar"
// verschil, terwijl drempel 3 nog altijd ruim vóór het einde van de 12
// tutorial-lagen valt (cultuurkosten lopen daar al op tot 400-600, hoofdstuk
// 14 — de tutorial duurt dus sowieso veel langer dan 42 beurten).
const WETENSCHAP_KOSTEN_BASIS = 10;
const WETENSCHAP_KOSTEN_KWADRATISCHE_FACTOR = 10;

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

// A. Vuur temmen: boerderij-opbrengst +20%.
export function boerderijOpbrengstFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "vuur-temmen") ? 1.2 : 1;
}

// B. Het spoor lezen (+1) en B2a. Boogschieten (nogmaals +1): jachtopbrengst.
export function jachtVoedselBonus(technologieen: TechId[]): number {
  let bonus = 0;
  if (heeftTech(technologieen, "spoor-lezen")) bonus += 1;
  if (heeftTech(technologieen, "boogschieten")) bonus += 1;
  return bonus;
}

// A2. Zaadselectie: boerderij-uitputting 25% trager (langere levensduur).
export function boerderijUitputtingFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "zaadselectie") ? 1.25 : 1;
}

// A1b. Kalkoven: steen-opbrengst +20%.
export function steenOpbrengstFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "kalkoven") ? 1.2 : 1;
}

// A1a. Weven: opslag-cap +10 — toegepast als eenmalige bonus op het moment
// van kiezen (economie.ts: `kiesTech`), net als de Opslagplaats-improvement
// bij voltooiing. Hier alleen de constante, geen berekenfunctie nodig.
export const OPSLAGCAP_BONUS_WEVEN = 10;

// A2a. Veeteelt: kuddes verschijnen vaker (multiplier op de kudde-kans).
export function kuddeKansFactor(technologieen: TechId[]): number {
  return heeftTech(technologieen, "veeteelt") ? 1.5 : 1;
}

// A2b. Voorraadschuur: voedselverbruik van de stad daalt (vaste aftrek).
export function voedselVerbruikVermindering(technologieen: TechId[]): number {
  return heeftTech(technologieen, "voorraadschuur") ? 1 : 0;
}

// B2. Speerwerper (×0,4) en B2a. Boogschieten (nogmaals ×0,5): roofdier-kans.
export function roofdierKansFactor(technologieen: TechId[]): number {
  let factor = 1;
  if (heeftTech(technologieen, "speerwerper")) factor *= 0.4;
  if (heeftTech(technologieen, "boogschieten")) factor *= 0.5;
  return factor;
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

// B1a. Vlotten: de settler kan rivier-vakjes oversteken. De huidige MVP kent
// geen enkele vorm van bewegingsbeperking bij water (`versWater` op een tile
// is uitsluitend een stichtings-geschiktheids-vlag, geen doorgangs-blokkade —
// zie world.ts/wegen.ts), dus dit effect heeft op dit moment geen waarneembaar
// gevolg. De tech blijft desondanks onderdeel van de boom (Deel 2 legt de
// structuur vast) en deze functie staat klaar voor zodra een
// water-doorgangs-regel wordt toegevoegd — zie de PR-samenvatting voor de
// volledige toelichting op deze afwijking.
export function settlerKanRivierOversteken(technologieen: TechId[]): boolean {
  return heeftTech(technologieen, "vlotten");
}
