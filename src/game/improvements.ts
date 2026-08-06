// Pool van bouwbare land improvements voor de categorie-keuze-UI (M2) en de
// productiewachtrij (M3). Economisch, Cultureel, Militair en Wetenschappelijk
// zijn gevuld: economisch levert de drie bouwmaterialen, voedsel (M3) en
// (sindsdien "aardewerk" gekozen is, hoofdstuk 3/9) een kleine opslagbonus,
// cultureel levert cultuur voor laag-ontgrendeling (M5), militair levert de
// Wachttoren-verdedigingsbonus voor militaire confrontaties (M7) én, sindsdien
// (hoofdstuk 6), de indringers-tribuut-bescherming van de hele laag,
// wetenschappelijk levert wetenschap voor de technologie-boom (hoofdstuk 3/9,
// zie techTree.ts). Civiel blijft leeg: de groei-tier-improvement (M6, zie WOONWIJK hieronder)
// is een stad-upgrade buiten de tegel-band, en de overige civiele
// land-improvements (weg/brug) vallen buiten de MVP-scope — zie hoofdstuk 3
// en hoofdstuk 13 van het design-document.

import { CampaignConfig, Categorie, Improvement, Layer, MateriaalType, ResourceType, TechId, Tile, TerreinType } from "./types";
import { hoogsteOntgrendeldeLaag } from "./world";

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

// Nederlandse labels voor alle resource-types (hoofdstuk 5/13), inclusief de
// niet-gedeelde-opslag-valuta's (voedsel/cultuur/wetenschap) — gebruikt door
// ResourceIcoon (issue: "icoontjes tonen i.p.v. steen, erts etc. in de
// grondstoffenbalk en in bouwkosten-pop-ups") zodat elk icoontje bij klikken
// dezelfde naam toont als hier.
export const RESOURCE_LABELS: Record<ResourceType, string> = {
  ...MATERIAAL_LABELS,
  voedsel: "Voedsel",
  cultuur: "Cultuur",
  wetenschap: "Wetenschap",
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

// Of `improvement` op dit specifieke vakje geplaatst mag worden: de gewone
// terrein-eis hierboven, plus — alleen voor de Amberader (issue: "toevoeging
// Goud" Deel 1) — de aanvullende amberader-vondst-eis (`tile.amber`, zie
// world.ts). Een gewone Mijn mag op elk heuvel/bergvakje, maar een Amberader
// alleen op de schaarse vakjes die daadwerkelijk een amberader hebben — het
// enige improvement met een vakje-specifieke eis bovenop het terreintype.
export function improvementPastOpTile(improvement: Improvement, tile: Tile): boolean {
  if (!improvementPastOpTerrein(improvement, tile.terrein)) return false;
  if (improvement.id === "goudmijn") return Boolean(tile.amber);
  return true;
}

// Weergavenaam van `improvement`, met per-campagne override (hoofdstuk 3/14,
// issue: "toevoeging Goud" — zelfde herbruikbaarheids-patroon als `techNaam()`
// in techTree.ts). Ontbreekt een override (of de hele campagne), dan valt dit
// terug op de tutorial-naam die al op het improvement zelf staat.
export function improvementNaam(improvement: Improvement, campagne?: CampaignConfig): string {
  return campagne?.improvementNamen?.[improvement.id] ?? improvement.naam;
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
  // Ontgrendeld door de "aardewerk"-tech (drempel 2, techTree.ts; issue: "tech
  // tree toevoegen" Deel 2 — "A1. Aardewerk: nieuw goedkoop land improvement:
  // Voorraadkuil"): een goedkoop land improvement met een kleine extra
  // opslag. Anders dan de overige economische land improvements hierboven
  // telt de opslag-bonus direct bij voltooiing mee, niet pas na
  // wegverbinding (zie `verwerkBouwwachtrij` in economie.ts) — een
  // opslagvergroting is een structurele capaciteit, geen lopende productie,
  // net zoals de Opslagplaats-city-improvement (hoofdstuk 3/5) ook geen
  // wegverbinding nodig heeft. Op vlakke grond (een kuil, geen bos/heuvel/berg).
  {
    id: "voorraadkuil",
    naam: "Voorraadkuil",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 3 },
    bouwtijdBeurten: 1,
    effect: { type: "opslag", waarde: 5 },
    terreinEisen: ["vlak"],
    vereisteTech: "aardewerk",
  },
  // Amberader (hoofdstuk 3/14, issue: "toevoeging Goud" Deel 1): functioneel
  // een goudmijn — interne sleutel `goudmijn`, tutorial-weergavenaam
  // "Amberader" (val terug via `improvementNaam()` hierboven). Zelfde
  // terrein-eis en bouwkosten als de gewone Mijn hierboven (heuvel/berg, hout
  // 8/steen 4, bouwtijd 3), maar schaarser: `improvementPastOpTile` eist
  // daarnaast `tile.amber` (zie world.ts) — niet elk heuvel/bergvakje heeft
  // een amberader. `uitputtingBeurten` 12 ligt in het midden van de
  // "gewoon"-range (10-14 beurten, hoofdstuk 14) uit het issue.
  {
    id: "goudmijn",
    naam: "Amberader",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 8, steen: 4 },
    bouwtijdBeurten: 3,
    effect: { type: "productie", resource: "goud", waarde: 2 },
    uitputtingBeurten: 12,
    terreinEisen: ["heuvel", "berg"],
  },
];

export const AMBERADER = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "goudmijn")!;

export const VOORRAADKUIL = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "voorraadkuil")!;

// Cultureel land improvement (hoofdstuk 3: "Heiligdom") — de eerste optie in
// deze categorie, nodig om cultuur te produceren voor laag-ontgrendeling (M5).
// Geen `uitputtingBeurten` (hoofdstuk 4/6): een Heiligdom blijft, anders dan
// de economische land-improvements, permanent actief in plaats van een
// ghost-town-tile te worden. `verwerkProductie` in economie.ts halveert de
// opbrengst wel zodra de tile niet op de frontier-laag (de hoogst
// ontgrendelde laag) staat.
// Offer Altaar (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
// verkenner", Deel 4): het tweede culturele land improvement. Ontgrendelt de
// Missionaris-unit als trainbare optie (zie `MISSIONARIS` hieronder en
// `heeftOfferAltaar`/`startMissionarisRecrutering` in economie.ts) — de
// Missionaris staat al sinds hoofdstuk 3 in het ontwerp maar was tot nu toe
// nooit daadwerkelijk bouwbaar. Normale bouwregel (hoofdstuk 6/11): geen
// `bouwbaarBuitenFrontier`-uitzondering zoals de Wachttoren, dit hoeft niet
// op de Bezette Laag zelf te staan. Kosten (hoofdstuk 14, MVP-richtwaarde,
// tunebaar): alle vier grondstoffen, in lijn met hoe de speler dit aanleverde.
//
// `infrastructuurEis` (hoofdstuk 4/6/11/14, issue: "city improvements" Deel
// 4): pas bouwbaar zodra de speler minstens 5 actieve Heiligdommen heeft én
// een Grote Tempel heeft gebouwd — een forse, meerdere-lagen-brede
// opbouw-eis die de Bezette-Laag-climax pas opent nadat de speler zijn
// culturele infrastructuur echt heeft uitgebouwd (zie hoofdstuk 11 voor de
// volledige onderbouwing). `startBouw`/`voldoetAanInfrastructuurEis` in
// economie.ts handhaven dit; `beschikbareOpties` hieronder blijft het Offer
// Altaar bewust gewoon tonen (uitgegrijsd, met voortgangstekst in
// BouwPopup.tsx) zodat de speler ziet hoe ver hij is, in plaats van het
// helemaal te verbergen zoals bij een `minLaag`-eis.
export const OFFER_ALTAAR: Improvement = {
  id: "offer-altaar",
  naam: "Offer Altaar",
  categorie: "cultureel",
  soort: "land",
  kosten: { hout: 3, steen: 12, erts: 3, goud: 3 },
  bouwtijdBeurten: 3,
  // Geen "productie"-effect (levert zelf geen cultuur op) — het effect-type
  // is puur een marker die `heeftOfferAltaar` in economie.ts herkent.
  effect: { type: "ontgrendelt-missionaris" },
  infrastructuurEis: {
    landImprovementId: "heiligdom",
    landImprovementNaam: "Heiligdommen",
    minAantal: 5,
    cityImprovementId: "grote-tempel",
    cityImprovementNaam: "Grote Tempel",
  },
};

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
  OFFER_ALTAAR,
];

// Wetenschappelijk land improvement (hoofdstuk 3/9, issue: "tech tree
// toevoegen" Deel 1): de Sterrencirkel is de eerste (en tot "aardewerk"
// gekozen wordt, enige) bron van wetenschap — zonder haar blijft de
// technologie-boom (techTree.ts) voor altijd ontoegankelijk. Zelfde patroon
// als het Heiligdom hierboven: geen `uitputtingBeurten` (hoofdstuk 4/6, put
// niet uit — een stenen cirkel is, net als een cultusplek of wachtpost, een
// blijvende aanwezigheid, geen verbruikende oogst) en dezelfde
// frontier-halvering van de opbrengst in `verwerkProductie` (economie.ts).
//
// Kosten (hoofdstuk 14): vergelijkbaar bouwprofiel als het Heiligdom (hout 4,
// steen 4, totaal 8, bouwtijd 2 beurten), maar verschoven naar "vooral hout,
// een beetje steen" zoals gevraagd — hout 6, steen 2, zelfde totaal en
// bouwtijd. De naam "Sterrencirkel" (een stenen cirkel waar het volk de
// sterren en seizoenen bestudeert) sluit aan bij de Riven/Myst-tutorialsfeer
// (hoofdstuk 12) en is verder ongewijzigd overgenomen uit het issue.
//
// `minLaag: 3` (issue: "tutorial popups wijzigen"): in de tutorial is
// Wetenschappelijk pas vanaf laag 3 beschikbaar (uitgegrijsd ervoor via
// `beschikbareOpties` hieronder) — het ontgrendelen van laag 3 gaat gepaard
// met de "Goddelijke raadgeving"-pop-up (tutorialContent.ts) die precies naar
// de Sterrencirkel verwijst.
export const STERRENCIRKEL: Improvement = {
  id: "sterrencirkel",
  naam: "Sterrencirkel",
  categorie: "wetenschappelijk",
  soort: "land",
  kosten: { hout: 6, steen: 2 },
  bouwtijdBeurten: 2,
  effect: { type: "productie", resource: "wetenschap", waarde: 2 },
  minLaag: 3,
};

export const WETENSCHAPPELIJK_LAND_IMPROVEMENTS: Improvement[] = [STERRENCIRKEL];

// Militair land improvement (hoofdstuk 3/6: "Wachttoren verdedigt de hele
// laag tegen indringers"). Levert nog steeds de passieve verdedigingsbonus
// die meetelt in `berekenLegerwaarde` (M7), én blokkeert sindsdien (hoofdstuk
// 6) volledig de indringers-tribuut-eis van `verwerkIndringers` in
// economie.ts, mits hij ook bemand én wegverbonden is met de stad — welke
// laag getroffen wordt, doet er niet toe (hoofdstuk 6: elke ontgrendelde laag
// komt in aanmerking, niet alleen de frontier-laag). Sinds issue "wachttoren
// beschermt 2 lagen" beschermt een werkende Wachttoren behalve zijn eigen
// laag ook de laag eronder (zie `heeftBeschermendeWachttoren` in
// economie.ts) — anders had de speler op vrijwel elke laag apart een toren
// nodig. Geen `uitputtingBeurten` (hoofdstuk 4/6): een Wachttoren, net als
// het Heiligdom hierboven, blijft permanent actief in plaats van uit te
// putten.
//
// `bouwbaarBuitenFrontier` (hoofdstuk 6/11, issue: "wachttorens, bemanning en
// bevoorrading"): een expliciete uitzondering op de algemene frontier-only
// bouwregel — anders zou een achtergelaten laag permanent onverdedigbaar
// worden zodra de frontier verder trekt, terwijl indringers overal kunnen
// toeslaan. Thematisch passend: forten werden juist áchter de oprukkende
// grens aangelegd, niet aan de voorste rand.
//
// `minLaag: 2` (issue: "tutorial popups wijzigen"): in de tutorial is
// Militair (en dus de Wachttoren) pas vanaf laag 2 beschikbaar (uitgegrijsd
// ervoor via `beschikbareOpties` hieronder) — het ontgrendelen van laag 2
// gaat gepaard met de "De vijand aan de horizon"-pop-up (tutorialContent.ts).
// Legerkamp (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
// verkenner", Deel 5): net als de Wachttoren op elke ontgrendelde laag
// bouwbaar (`bouwbaarBuitenFrontier`) — thematisch omdat een gestationeerde
// Soldaat zelf naar een Bezette Laag kan marcheren, ongeacht waar het
// Legerkamp staat (hoofdstuk 6/11). Effect is puur een marker (geen
// "verdediging"-waarde zoals de Wachttoren): elke toegewezen Soldaat telt
// zelf zijn eigen legerwaarde mee bij een Confrontatie tegen een Bezette
// Laag (zie `berekenLegerkampLegerwaarde` in economie.ts), het Legerkamp
// zelf levert geen eigen bonus. Kosten (hoofdstuk 14, MVP-richtwaarde,
// tunebaar): vooral hout, in lijn met een kamp i.p.v. een stenen toren.
//
// `infrastructuurEis` (hoofdstuk 4/6/11/14, issue: "city improvements" Deel
// 4): pas bouwbaar zodra de speler minstens 5 actieve Wachttorens heeft én
// een Barakken heeft gebouwd — zelfde soort forse infrastructuur-eis als het
// Offer Altaar hieronder, nu voor de militaire kant van de Bezette-Laag-
// climax. Zie de `infrastructuurEis`-comment bij `OFFER_ALTAAR` hieronder
// voor de volledige onderbouwing.
export const LEGERKAMP: Improvement = {
  id: "legerkamp",
  naam: "Legerkamp",
  categorie: "militair",
  soort: "land",
  kosten: { hout: 12, steen: 3, erts: 3, goud: 2 },
  bouwtijdBeurten: 3,
  effect: { type: "legerkamp" },
  bouwbaarBuitenFrontier: true,
  infrastructuurEis: {
    landImprovementId: "wachttoren",
    landImprovementNaam: "Wachttorens",
    minAantal: 5,
    cityImprovementId: "barakken",
    cityImprovementNaam: "Barakken",
  },
};

export const MILITAIR_LAND_IMPROVEMENTS: Improvement[] = [
  {
    id: "wachttoren",
    naam: "Wachttoren",
    categorie: "militair",
    soort: "land",
    kosten: { hout: 6, steen: 4 },
    bouwtijdBeurten: 2,
    effect: { type: "verdediging", waarde: 3 },
    bouwbaarBuitenFrontier: true,
    minLaag: 2,
  },
  LEGERKAMP,
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

// Verkenner (hoofdstuk 3/6, issue: "De Bezette Laag, missionaris en
// verkenner", Deel 3): wetenschappelijke unit — stond al sinds hoofdstuk 3 in
// het ontwerp ("tijdelijke extra vooruitkijk"), maar krijgt hier voor het
// eerst een daadwerkelijke functie: zodra er minstens één bestaat, kan de
// speler de Verkenning-actie uitvoeren op een Bezette Laag (zie
// `kanVerkennen`/`verken` in economie.ts). Eigen rekruteringswachtrij
// (`City.verkennerInAanbouw`), net als Soldaat, dus geen onderdeel van
// IMPROVEMENT_POOLS/beschikbareOpties. Kosten (hoofdstuk 14, MVP-richtwaarde,
// tunebaar) lichter dan Soldaat — een verkenner is geen vechter.
export const VERKENNER: Improvement = {
  id: "verkenner",
  naam: "Verkenner",
  categorie: "wetenschappelijk",
  soort: "unit",
  kosten: { hout: 3, erts: 1 },
  bouwtijdBeurten: 2,
  effect: { type: "verkenning" },
};

// Missionaris (hoofdstuk 3/6, issue: "De Bezette Laag, missionaris en
// verkenner", Deel 4): culturele unit — stond al sinds hoofdstuk 3 in het
// ontwerp ("voor pushback"), maar krijgt hier voor het eerst een
// daadwerkelijke functie: zodra er minstens één bestaat, wordt nieuwe
// cultuurproductie omgeleid naar de belegeringsmeter van een Bezette Laag
// (zie `verwerkBelegering` in economie.ts) in plaats van verloren te gaan.
// Alleen trainbaar zodra er een voltooid Offer Altaar staat (zie
// `heeftOfferAltaar`/`startMissionarisRecrutering`). Eigen
// rekruteringswachtrij (`City.missionarisInAanbouw`), net als Soldaat/
// Verkenner. Kosten (hoofdstuk 14, MVP-richtwaarde, tunebaar): hout en goud
// i.p.v. erts, in lijn met een culturele in plaats van militaire unit.
export const MISSIONARIS: Improvement = {
  id: "missionaris",
  naam: "Missionaris",
  categorie: "cultureel",
  soort: "unit",
  kosten: { hout: 2, goud: 2 },
  bouwtijdBeurten: 2,
  effect: { type: "belegering" },
};

// Vijandelijke tile-varianten van een Bezette Laag (hoofdstuk 6, issue: "De
// Bezette Laag, missionaris en verkenner", Deel 1) — hergebruikt de
// bestaande Wachttoren-/Heiligdom-improvement-typen (dus dezelfde soort/
// effect-vorm) met een duidelijk andere naam/skin (`vijandelijk: true`, zie
// canvas.ts/canvasPixelArt.ts voor de kleurvariant). Nooit onderdeel van
// IMPROVEMENT_POOLS: deze worden alleen door Verkenning (economie.ts:
// `verken`) of de laag-brede onthulling bij het einde van de Bezette Laag
// geplaatst, nooit door de speler gebouwd. Geen bouwkosten/-tijd (staan er
// al, klaar bij onthulling).
export const VIJANDELIJKE_WACHTTOREN: Improvement = {
  id: "vijandelijke-wachttoren",
  naam: "Vijandelijke Wachttoren",
  categorie: "militair",
  soort: "land",
  kosten: {},
  bouwtijdBeurten: 0,
  effect: { type: "dreiging" },
  vijandelijk: true,
};

export const VIJANDELIJK_HEILIGDOM: Improvement = {
  id: "vijandelijk-heiligdom",
  naam: "Vijandelijk Heiligdom",
  categorie: "cultureel",
  soort: "land",
  kosten: {},
  bouwtijdBeurten: 0,
  effect: { type: "belegeringsdoel" },
  vijandelijk: true,
};

// Cosmetisch huisje (Deel 1): geen economische functie, niet interactief,
// nooit een Confrontatie- of Belegeringsdoel — daarom geen `vijandelijk`-
// vlag (dat betekent specifiek "geldig doel"). Blijft voor altijd staan
// (ook nadat de Bezette Laag is opgelost, Deel 6): omdat `startBouw` alleen
// een `"leeg"`/`"ruine"`-vakje overschrijft en dit vakje na onthulling altijd
// `"actief"` blijft met dit improvement erop, is het vanzelf permanent
// onbebouwbaar — geen aparte "permanent"-vlag nodig.
export const BEZETTE_LAAG_HUISJE: Improvement = {
  id: "bezette-laag-huisje",
  naam: "Verlaten huisje",
  categorie: "civiel",
  soort: "land",
  kosten: {},
  bouwtijdBeurten: 0,
  effect: { type: "decoratief" },
};

// Stadsgroei-improvement (M6, hoofdstuk 3/4: "Aquaduct, riolering, woonwijk
// (= groei-tiers)"). Dit is een `soort: "city"`-improvement die de stad zelf
// upgradet, geen land-vakje — daarom geen onderdeel van IMPROVEMENT_POOLS/
// beschikbareOpties (die zijn voor land-improvements op de actieve laag) en
// wordt in plaats daarvan rechtstreeks gebruikt door de startGroei-actie in
// economie.ts en het civiele paneel. Weg/brug (de land-improvements onder
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

// Tweede groei-tier-stap, middel→groot (hoofdstuk 3/4/13/14, issue: "city
// improvements" Deel 2 — ontbrak nog volledig, de MVP-scope kende tot nu toe
// maar één groei-stap). Zelfde `civielInAanbouw`-wachtrij en
// `effect.type: "groei"`-patroon als WOONWIJK hierboven, alleen met een
// hogere kosten-/bouwtijd-schaal (kosten grofweg verdubbeld t.o.v. Woonwijk)
// en een eigen, hogere voedseldrempel (`VOEDSEL_DREMPEL_GROEI_GROOT`,
// world.ts) om te mogen starten — zie `startGroei` in economie.ts, die op
// basis van de huidige stadsgrootte kiest tussen deze twee improvements.
// Voltooiing zet de stad naar "groot": de city-improvement-cap gaat naar 5
// (hoofdstuk 4/11/14, `CITY_IMPROVEMENT_CAP` in economie.ts) en het
// stadsverbruik naar 6 voedsel/beurt (`VOEDSEL_VERBRUIK` in economie.ts, al
// aanwezig sinds de oorspronkelijke groei-tabel).
export const GROTE_WOONWIJK: Improvement = {
  id: "grote-woonwijk",
  naam: "Grote Woonwijk",
  categorie: "civiel",
  soort: "city",
  kosten: { hout: 12, steen: 8 },
  bouwtijdBeurten: 6,
  effect: { type: "groei", naarGrootte: "groot" },
};

// Nieuwe settler (hoofdstuk 3/11/13/16, issue: "stad stichten op de
// frontier" deel 4): de speler begint met één settler; zodra een stad
// gesticht is (`stichtStad` in economie.ts) kan de nieuwe stad er weer één
// uitrusten. Bewust een civiele keuze naast WOONWIJK (`City.civielInAanbouw`
// bevat hoogstens één van de twee tegelijk) — "investeer je in de stad waar
// je staat, of rust je een expeditie uit om verder te trekken?" (hoofdstuk
// 11). Geen land-vakje (soort "unit", net als SOLDAAT), dus ook geen
// onderdeel van IMPROVEMENT_POOLS/beschikbareOpties.
export const NIEUWE_SETTLER: Improvement = {
  id: "nieuwe-settler",
  naam: "Nieuwe settler",
  categorie: "civiel",
  soort: "unit",
  kosten: { hout: 10, steen: 4 },
  bouwtijdBeurten: 4,
  effect: { type: "settler" },
};

// Opslagplaats (hoofdstuk 3/5/13/14, issue: "stad stichten op de frontier"
// deel 2): economische city improvement die de gedeelde opslag-cap verhoogt.
// Eigen wachtrij (`City.opslagplaatsInAanbouw`, los van `civielInAanbouw`
// hierboven) — Opslagplaats is economisch, geen civiel improvement (hoofdstuk
// 3), en concurreert dus niet met groei/nieuwe-settler. Herhaalbaar: elke
// voltooide Opslagplaats telt de cap opnieuw op (hoofdstuk 14: "praktisch
// maximum ~3-4 opslagplaatsen per stad").
export const OPSLAGPLAATS: Improvement = {
  id: "opslagplaats",
  naam: "Opslagplaats",
  categorie: "economisch",
  soort: "city",
  kosten: { hout: 8, steen: 6 },
  bouwtijdBeurten: 3,
  effect: { type: "opslag", waarde: 20 },
};

// Gecapte city improvements (hoofdstuk 3/4/11/14, issue: "city improvements"
// Deel 1/3): elke stad kan er hoogstens `CITY_IMPROVEMENT_CAP[grootte]`
// tegelijk van hebben (economie.ts) — dit is de tastbare groei-beloning die
// het nooit-gebouwde relic-slot-concept uit een eerdere versie van hoofdstuk
// 4 vervangt. Opslagplaats hierboven en de groei-tier-improvements
// (WOONWIJK/GROTE_WOONWIJK) tellen bewust niet mee (zie hoofdstuk 11): die
// hebben allebei al hun eigen wachtrij/functie, dit zijn de vijf improvements
// die om een slot concurreren. Elk heeft een eigen `productie`-effect dat
// `verwerkProductie`/`berekenCultuurProductieDitBeurt` in economie.ts
// meetellen zodra hij in `City.cityImprovements` staat — zonder
// wegverbinding-eis (net als Opslagplaats): een city improvement staat niet
// op een land-vakje.
export const BIBLIOTHEEK: Improvement = {
  id: "bibliotheek",
  naam: "Bibliotheek",
  categorie: "wetenschappelijk",
  soort: "city",
  kosten: { hout: 6, steen: 4, erts: 2 },
  bouwtijdBeurten: 3,
  effect: { type: "productie", resource: "wetenschap", waarde: 10 },
};

export const MARKT: Improvement = {
  id: "markt",
  naam: "Markt",
  categorie: "economisch",
  soort: "city",
  kosten: { hout: 5, steen: 6 },
  bouwtijdBeurten: 3,
  effect: { type: "productie", resource: "goud", waarde: 2 },
};

// Barakken (hoofdstuk 3/4/6/11/14, issue: "city improvements" Deel 3/4):
// levert, anders dan het Wachttoren-patroon (verdedigingsbonus, alleen mee
// als bemand), een vaste, stad-brede legerwaarde-bonus die geen bemanning
// nodig heeft — vandaar het eigen effect-type "stad-legerwaarde" i.p.v.
// "verdediging". Telt mee bij zowel de gewone Confrontatie
// (`berekenLegerwaarde`) als de Confrontatie tegen een Bezette Laag
// (`confrontatieBezetteLaag`), zie economie.ts. Ontgrendelt daarnaast, samen
// met 5 actieve Wachttorens, het Legerkamp (`LEGERKAMP.infrastructuurEis`
// hierboven). `stadsgrootteEis: "middel"` is een aanname uit het issue zelf
// ("pas aan als dat niet de bedoeling is").
export const BARAKKEN: Improvement = {
  id: "barakken",
  naam: "Barakken",
  categorie: "militair",
  soort: "city",
  kosten: { hout: 4, steen: 8, erts: 4 },
  bouwtijdBeurten: 3,
  effect: { type: "stad-legerwaarde", waarde: 10 },
  stadsgrootteEis: "middel",
};

export const TEMPEL: Improvement = {
  id: "tempel",
  naam: "Tempel",
  categorie: "cultureel",
  soort: "city",
  kosten: { hout: 6, steen: 6 },
  bouwtijdBeurten: 3,
  effect: { type: "productie", resource: "cultuur", waarde: 5 },
  stadsgrootteEis: "middel",
};

// Grote Tempel: een aparte, tweede cultureel-improvement-slot naast een al
// gebouwde Tempel (geen vervanging) — beide hebben een ander `id`, dus
// `startCityVerbetering`/de cap-telling in economie.ts behandelen ze als
// twee volledig losse improvements die allebei meetellen voor de cap
// (hoofdstuk 3, Deel 3 van het issue: "samen dus +15 cultuur/beurt"). Ook de
// tweede helft van de Offer-Altaar-infrastructuur-eis hierboven
// (`OFFER_ALTAAR.infrastructuurEis`).
export const GROTE_TEMPEL: Improvement = {
  id: "grote-tempel",
  naam: "Grote Tempel",
  categorie: "cultureel",
  soort: "city",
  kosten: { hout: 4, steen: 14, erts: 4, goud: 4 },
  bouwtijdBeurten: 4,
  effect: { type: "productie", resource: "cultuur", waarde: 10 },
  stadsgrootteEis: "groot",
};

// Alle vijf gecapte city improvements — de opties voor de nieuwe
// stadsverbeteringen-UI (StadsverbeteringenPaneel.tsx), gefilterd daar
// verder op stadsgrootte-eis/al-gebouwd/cap (economie.ts:
// `kanCityVerbeteringBouwen`).
export const CAPPED_CITY_IMPROVEMENTS: Improvement[] = [BIBLIOTHEEK, MARKT, BARAKKEN, TEMPEL, GROTE_TEMPEL];

const IMPROVEMENT_POOLS: Record<Improvement["categorie"], Improvement[]> = {
  economisch: ECONOMISCH_LAND_IMPROVEMENTS,
  wetenschappelijk: WETENSCHAPPELIJK_LAND_IMPROVEMENTS,
  militair: MILITAIR_LAND_IMPROVEMENTS,
  civiel: [],
  cultureel: CULTUREEL_LAND_IMPROVEMENTS,
};

// Een "ruine"-vakje (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
// verkenner", Deel 5: een verloren Confrontatie tegen een Bezette Laag) is,
// anders dan een permanente "ghost_town"-tile, net zo herbouwbaar als een
// gewoon leeg vakje — tegen de normale kosten/bouwtijd van welk improvement
// dan ook (niet uitsluitend de Wachttoren die er ooit stond).
export function isBebouwbaarLeeg(tile: Tile): boolean {
  return tile.status === "leeg" || tile.status === "ruine";
}

// Of `improvement` een leeg, terrein-geschikt vakje heeft op `laag`, en daar
// niet al gebouwd staat — de kern-plaatsingscheck, per laag.
function kanImprovementOpLaag(improvement: Improvement, laag: Layer): boolean {
  const reedsGebouwd = laag.tiles.some((tile) => tile.improvement?.id === improvement.id);
  if (reedsGebouwd) return false;
  return laag.tiles.some((tile) => isBebouwbaarLeeg(tile) && improvementPastOpTile(improvement, tile));
}

// Opties voor de categorie-keuze-UI (hoofdstuk 11: eerst categorie, dan alle
// op dat moment geldige land improvements binnen die categorie — geen
// willekeurige subset meer). Sluit improvements uit die al op deze laag
// gebouwd zijn, én improvements met een terrein-eis (zie
// `Improvement.terreinEisen`) die geen enkel leeg vakje op deze laag kan
// plaatsen — anders zou de speler een optie kunnen kiezen die nergens
// neergezet kan worden.
//
// `bouwbaarBuitenFrontier`-improvements (hoofdstuk 6/11: momenteel alleen de
// Wachttoren) zijn hierop een uitzondering: die tellen als beschikbaar zodra
// er ergens op een ontgrendelde laag (niet per se `laag` zelf) een geldig
// leeg vakje voor ze is — `alleLagen` is nodig om dat over de hele band heen
// te checken.
//
// `technologieen` (hoofdstuk 3/9, issue: "tech tree toevoegen" Deel 2) sluit
// daarnaast improvements met een `vereisteTech` (momenteel alleen de
// Voorraadkuil, ontgrendeld door "aardewerk") uit zolang die tech nog niet
// gekozen is — een lege array (de default) sluit dus elke tech-gated
// improvement uit, precies het gedrag vóórdat er ooit een tech gekozen is.
//
// `minLaag` (issue: "tutorial popups wijzigen") sluit op dezelfde manier
// improvements uit zolang de hoogst ontgrendelde laag (frontier) de vereiste
// hoogte nog niet bereikt heeft — momenteel de Sterrencirkel (laag 3) en de
// Wachttoren (laag 2). Heeft een categorie hierdoor geen enkele optie meer
// over, dan toont de bouw-pop-up (BouwPopup.tsx) 'm uitgegrijsd, precies
// zoals bij een categorie zonder geldig leeg vakje.
export function beschikbareOpties(
  categorie: Improvement["categorie"],
  laag: Layer,
  alleLagen: Layer[],
  technologieen: TechId[] = []
): Improvement[] {
  const frontierHoogte = hoogsteOntgrendeldeLaag(alleLagen);
  return IMPROVEMENT_POOLS[categorie]
    .filter((improvement) => !improvement.vereisteTech || technologieen.includes(improvement.vereisteTech))
    .filter((improvement) => !improvement.minLaag || frontierHoogte >= improvement.minLaag)
    .filter((improvement) =>
      improvement.bouwbaarBuitenFrontier
        ? alleLagen.some((l) => l.ontgrendeld && kanImprovementOpLaag(improvement, l))
        : kanImprovementOpLaag(improvement, laag)
    );
}
