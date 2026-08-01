// Pool van bouwbare land improvements voor de categorie-keuze-UI (M2) en de
// productiewachtrij (M3). Economisch, Cultureel en Militair zijn gevuld:
// economisch levert de drie bouwmaterialen en voedsel (M3), cultureel levert
// cultuur voor laag-ontgrendeling (M5), militair levert de Wachttoren-
// verdedigingsbonus voor militaire confrontaties (M7) én, sindsdien
// (hoofdstuk 6), de indringers-tribuut-bescherming van de hele laag.
// Wetenschappelijk krijgt zijn opties pas zodra die mechaniek aan de beurt is.
// Civiel blijft leeg: de groei-tier-improvement (M6, zie WOONWIJK hieronder)
// is een stad-upgrade buiten de tegel-band, en de overige civiele
// land-improvements (weg/brug) vallen buiten de MVP-scope — zie hoofdstuk 3
// en hoofdstuk 13 van het design-document.

import { Categorie, Improvement, Layer, MateriaalType, TerreinType } from "./types";

// Nederlandse labels per categorie, gedeeld tussen de bouw-pop-up (M2) en de
// tile-info-pop-up (klik-op-tile) zodat beide dezelfde terminologie tonen.
export const CATEGORIE_LABELS: Record<Categorie, string> = {
  economisch: "Economisch",
  wetenschappelijk: "Wetenschappelijk",
  militair: "Militair",
  civiel: "Civiel",
  cultureel: "Cultureel",
};

// Nederlandse labels per vakje-terreinsubtype (issue: "grotere verscheidenheid
// van tiles"), gedeeld tussen de bouw-pop-up, de tile-info-pop-up en de
// canvas-rendering zodat overal dezelfde terminologie gebruikt wordt.
export const TERREIN_LABELS: Record<TerreinType, string> = {
  vlak: "vlakke grond",
  bos: "bos",
  heuvel: "heuvel",
  berg: "berg",
};

// Nederlandse labels per gedeelde-opslag-grondstof (hoofdstuk 5), gedeeld
// tussen de grondstoffenbalk (ResourceHud) en de indringers-tribuut-pop-up
// (hoofdstuk 6) zodat beide dezelfde terminologie tonen.
export const MATERIAAL_LABELS: Record<MateriaalType, string> = {
  hout: "Hout",
  steen: "Steen",
  erts: "Erts",
  goud: "Goud",
};

// Of `improvement` op een vakje met dit terrein geplaatst mag worden (issue:
// "houtkap alleen op bos", "mijn alleen op heuvel/berg", "boerderij alleen op
// vlakke grond"). Geen `terreinEisen` = geen beperking.
export function improvementPastOpTerrein(improvement: Improvement, terrein: TerreinType): boolean {
  return !improvement.terreinEisen || improvement.terreinEisen.includes(terrein);
}

// Leesbare beschrijving van de terrein-eis van een improvement, voor gebruik
// in de bouw-pop-up/uitleg (bv. "bos" of "heuvel of berg"). `undefined` als er
// geen eis is.
export function terreinEisenBeschrijving(improvement: Improvement): string | undefined {
  if (!improvement.terreinEisen || improvement.terreinEisen.length === 0) return undefined;
  return improvement.terreinEisen.map((terrein) => TERREIN_LABELS[terrein]).join(" of ");
}

// `uitputtingBeurten` (hoofdstuk 4/14: exacte cijfers nog niet vastgelegd in
// het design-document — dit zijn bewuste MVP-placeholders) bepaalt hoeveel
// beurten een land-improvement actief blijft voordat het een permanente
// ghost-town-tile wordt (M4). Mijnen putten het snelst uit (erts is het
// zeldzaamst), boerderijen het langzaamst.
export const ECONOMISCH_LAND_IMPROVEMENTS: Improvement[] = [
  {
    id: "houtkap",
    naam: "Houtkap",
    categorie: "economisch",
    soort: "land",
    kosten: { steen: 6 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "hout", waarde: 3 },
    uitputtingBeurten: 14,
    // Alleen op bos-vakjes: je kapt geen bomen op vlakke grond of een kale
    // heuvel (issue: "een houtkap alleen maar op een bos zetten").
    terreinEisen: ["bos"],
  },
  {
    id: "steengroeve",
    naam: "Steengroeve",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 6 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "steen", waarde: 2 },
    uitputtingBeurten: 10,
    // Alleen op heuvel/berg (issue: "de steengroeve moet ook op een berg of
    // heuvel staan") — zelfde terrein-eis als de mijn.
    terreinEisen: ["heuvel", "berg"],
  },
  {
    id: "mijn",
    naam: "Mijn",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 8, steen: 4 },
    bouwtijdBeurten: 3,
    effect: { type: "productie", resource: "erts", waarde: 2 },
    uitputtingBeurten: 6,
    // Alleen op heuvel/berg (issue: "een mijn kun je alleen op een heuvel of
    // berg zetten").
    terreinEisen: ["heuvel", "berg"],
  },
  {
    id: "boerderij",
    naam: "Boerderij",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 4 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "voedsel", waarde: 4 },
    uitputtingBeurten: 18,
    // Alleen op vlakke grond (issue: "boerderij kun je juist niet op bergen
    // en bossen zetten, alleen op vlakke grond").
    terreinEisen: ["vlak"],
  },
];

// Cultureel land improvement (hoofdstuk 3: "Heiligdom") — de eerste optie in
// deze categorie, nodig om cultuur te produceren voor laag-ontgrendeling (M5).
// Geen `uitputtingBeurten` (hoofdstuk 4/6): een Heiligdom blijft, anders dan
// de economische land-improvements, permanent actief in plaats van een
// ghost-town-tile te worden. `verwerkProductie` in economie.ts halveert de
// opbrengst wel zodra de tile niet op de frontier-laag (de hoogst
// ontgrendelde laag) staat.
export const CULTUREEL_LAND_IMPROVEMENTS: Improvement[] = [
  {
    id: "heiligdom",
    naam: "Heiligdom",
    categorie: "cultureel",
    soort: "land",
    kosten: { hout: 4, steen: 4 },
    bouwtijdBeurten: 2,
    effect: { type: "productie", resource: "cultuur", waarde: 2 },
  },
];

// Militair land improvement (hoofdstuk 3/6: "Wachttoren verdedigt de hele
// laag tegen indringers"). Levert nog steeds de passieve verdedigingsbonus
// die meetelt in `berekenLegerwaarde` (M7), én blokkeert sindsdien (hoofdstuk
// 6) volledig de indringers-tribuut-eis van `verwerkIndringers` in
// economie.ts, mits hij ook bemand én wegverbonden is met de stad — welke
// laag getroffen wordt, doet er niet toe (hoofdstuk 6: elke ontgrendelde laag
// komt in aanmerking, niet alleen de frontier-laag). Geen `uitputtingBeurten`
// (hoofdstuk 4/6): een Wachttoren, net als het Heiligdom hierboven, blijft
// permanent actief in plaats van uit te putten.
export const MILITAIR_LAND_IMPROVEMENTS: Improvement[] = [
  {
    id: "wachttoren",
    naam: "Wachttoren",
    categorie: "militair",
    soort: "land",
    kosten: { hout: 6, steen: 4 },
    bouwtijdBeurten: 2,
    effect: { type: "verdediging", waarde: 3 },
  },
];

// Militaire unit (hoofdstuk 3: "Soldaat, ruiter, artillerie" — de MVP beperkt
// zich tot Soldaat, hoofdstuk 13: "eenvoudige militaire confrontatie"). Een
// `soort: "unit"`-improvement, net als WOONWIJK geen land-vakje maar een
// eigen rekruteringswachtrij (`legerInAanbouw` op City) — daarom geen
// onderdeel van IMPROVEMENT_POOLS/beschikbareOpties.
export const SOLDAAT: Improvement = {
  id: "soldaat",
  naam: "Soldaat",
  categorie: "militair",
  soort: "unit",
  kosten: { erts: 2, hout: 1 },
  bouwtijdBeurten: 2,
  effect: { type: "leger", waarde: 4 },
};

// Stadsgroei-improvement (M6, hoofdstuk 3/4: "Aquaduct, riolering, woonwijk
// (= groei-tiers)"). Dit is een `soort: "city"`-improvement die de stad zelf
// upgradet, geen land-vakje — daarom geen onderdeel van IMPROVEMENT_POOLS/
// beschikbareOpties (die zijn voor land-improvements op de actieve laag) en
// wordt in plaats daarvan rechtstreeks gebruikt door de startGroei-actie in
// economie.ts en het groei-paneel. Weg/brug (de land-improvements onder
// civiel) blijven, net als de rest van IMPROVEMENT_POOLS.civiel, buiten de
// MVP-scope (hoofdstuk 13).
export const WOONWIJK: Improvement = {
  id: "woonwijk",
  naam: "Woonwijk",
  categorie: "civiel",
  soort: "city",
  kosten: { hout: 6, steen: 4 },
  bouwtijdBeurten: 4,
  effect: { type: "groei", naarGrootte: "middel" },
};

const IMPROVEMENT_POOLS: Record<Improvement["categorie"], Improvement[]> = {
  economisch: ECONOMISCH_LAND_IMPROVEMENTS,
  wetenschappelijk: [],
  militair: MILITAIR_LAND_IMPROVEMENTS,
  civiel: [],
  cultureel: CULTUREEL_LAND_IMPROVEMENTS,
};

// Opties voor de categorie-keuze-UI (hoofdstuk 11: eerst categorie, dan 2-3
// concrete opties). Sluit improvements uit die al op deze laag gebouwd zijn,
// én improvements met een terrein-eis (zie `Improvement.terreinEisen`) die
// geen enkel leeg vakje op deze laag kan plaatsen — anders zou de speler een
// optie kunnen kiezen die nergens neergezet kan worden.
export function beschikbareOpties(categorie: Improvement["categorie"], laag: Layer): Improvement[] {
  const reedsGebouwdeIds = laag.tiles
    .map((tile) => tile.improvement?.id)
    .filter((id): id is string => Boolean(id));
  const legeTerreinen = laag.tiles
    .filter((tile) => tile.status === "leeg")
    .map((tile) => tile.terrein);

  return IMPROVEMENT_POOLS[categorie].filter(
    (improvement) =>
      !reedsGebouwdeIds.includes(improvement.id) &&
      legeTerreinen.some((terrein) => improvementPastOpTerrein(improvement, terrein))
  );
}

function shuffle<T>(items: T[]): T[] {
  const kopie = [...items];
  for (let i = kopie.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

// Willekeurige subset van 2 of 3 concrete opties binnen een categorie
// (hoofdstuk 11: eerst categorie, dán 2-3 willekeurige opties). Geeft minder
// terug als de categorie nog geen 2 beschikbare opties heeft.
//
// `verplichteId` (issue: "alleen de eerste beurt de houtkap altijd tussen de
// te kiezen improvements staat, om de speler nog even bij de hand te nemen")
// forceert die ene improvement in de uitkomst als hij beschikbaar is — de
// rest van de opties blijft willekeurig.
export function willekeurigeOpties(
  categorie: Improvement["categorie"],
  laag: Layer,
  verplichteId?: string
): Improvement[] {
  const beschikbaar = beschikbareOpties(categorie, laag);
  const aantal = Math.random() < 0.5 ? 2 : 3;

  const verplicht = verplichteId ? beschikbaar.find((improvement) => improvement.id === verplichteId) : undefined;
  if (!verplicht) return shuffle(beschikbaar).slice(0, aantal);

  const overigen = shuffle(beschikbaar.filter((improvement) => improvement.id !== verplichteId)).slice(
    0,
    aantal - 1
  );
  return shuffle([verplicht, ...overigen]);
}
