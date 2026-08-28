// Pool van bouwbare land improvements voor de categorie-keuze-UI (M2) en de
// productiewachtrij (M3). Economisch, Cultureel, Militair en Wetenschappelijk
// zijn gevuld: economisch levert de drie bouwmaterialen, voedsel (M3) en
// (sindsdien "aardewerk" gekozen is, hoofdstuk 3/9) een kleine opslagbonus,
// cultureel levert cultuur voor streek-ontgrendeling (M5), militair levert de
// Wachttoren-verdedigingsbonus voor militaire confrontaties (M7) én, sindsdien
// (hoofdstuk 6), de indringers-tribuut-bescherming van de hele streek,
// wetenschappelijk levert wetenschap voor de technologie-boom (hoofdstuk 3/9,
// zie techTree.ts). Civiel bevat sinds issue "Onrust, Saloon en Courthouse"
// de Saloon en het Courthouse (Going West-exclusief, zie
// `CIVIEL_LAND_IMPROVEMENTS` hieronder) — de groei-tier-improvement (M6, zie
// WOONWIJK hieronder) blijft een stad-upgrade buiten de tegel-band, en de
// overige civiele land-improvements (weg/brug) vallen nog steeds buiten de
// MVP-scope — zie hoofdstuk 3 en hoofdstuk 13 van het design-document.

import { CampaignConfig, Categorie, City, Improvement, Streek, MateriaalType, ResourceType, TechId, Tile, TerreinType } from "./types";
import { hoogsteOntgrendeldeStreek } from "./world";

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

// Leesbare beschrijving van wat `improvement` oplevert/doet (issue: "teksten
// bij city gebouwen" — ontbrak bij Markt/Bibliotheek en de overige
// stadsverbeteringen in StadsverbeteringenPaneel.tsx, en bij land
// improvements in de bouw-pop-up, BouwPopup.tsx). Gedeeld met tileInfo.ts,
// die er voor een reeds gebouwde tile nog een frontier-halvering (`opFrontier`,
// alleen relevant voor cultuurproductie, hoofdstuk 6) overheen legt — zie
// `verwerkProductie` in economie.ts voor dezelfde regel. City improvements
// (Bibliotheek/Markt/Barakken/Tempel/Grote Tempel) kennen geen frontier-
// halvering (ze staan niet op een streek), dus `opFrontier` blijft daar op
// zijn default `true`.
export function effectBeschrijving(improvement: Improvement, opFrontier = true): string {
  const { effect } = improvement;
  if (effect.type === "productie" && effect.resource && effect.waarde) {
    if (effect.resource === "cultuur" && !opFrontier) {
      return `Levert +${effect.waarde / 2} cultuur per beurt (halve opbrengst — niet op de frontier-streek).`;
    }
    return `Levert +${effect.waarde} ${RESOURCE_LABELS[effect.resource].toLowerCase()} per beurt.`;
  }
  if (effect.type === "verdediging" && effect.waarde) {
    return `Geeft +${effect.waarde} verdediging bij een militaire confrontatie, en beschermt deze streek én de streek eronder tegen indringers-tribuut.`;
  }
  if (effect.type === "opslag" && effect.waarde) {
    return `Verhoogt de opslag-cap met +${effect.waarde}, direct bij voltooiing.`;
  }
  if (effect.type === "stad-legerwaarde" && effect.waarde) {
    return `Geeft de hele stad +${effect.waarde} legerwaarde bij een militaire confrontatie, zonder dat hier bemanning voor nodig is.`;
  }
  if (effect.type === "groeidrempel-verlaging" && effect.waarde) {
    return `Verlaagt de voedseldrempel om naar Groot te groeien met ${effect.waarde}.`;
  }
  if (effect.type === "stad") {
    return "Het centrum van je nederzetting.";
  }
  // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 1/4/5) — vijandelijke tile-varianten en het cosmetische
  // huisje hebben geen productie-/verdedigingseffect, maar wel een eigen
  // korte omschrijving.
  if (effect.type === "dreiging") {
    return "Een vijandelijke Wachttoren. Vereist een eigen Legerkamp op de streek eronder om een Confrontatie aan te gaan.";
  }
  if (effect.type === "belegeringsdoel") {
    return "Een vijandelijk Heiligdom. Stuur er een Missionaris heen om de wololo-meter te laten vollopen.";
  }
  if (effect.type === "legerkamp") {
    return "Elke hieraan toegewezen Soldaat telt mee als legerwaarde bij een Confrontatie tegen De Stam van de Mammoet, ongeacht op welke streek dit Legerkamp staat.";
  }
  if (effect.type === "ontgrendelt-missionaris") {
    return "Ontgrendelt de Missionaris als trainbare eenheid.";
  }
  if (effect.type === "decoratief") {
    return "Een verlaten huisje. Geen functie, niet interactief.";
  }
  // Smederij (Going West, M21d, opdracht-wampanoag-opening.md §3): het enige
  // "conversie"-effect in de MVP — hardcoded "gereedschap" als uitkomst i.p.v.
  // een generiek tweede resource-veld, want er is (nog) maar één zo'n gebouw.
  if (effect.type === "conversie" && effect.resource && effect.waarde) {
    return `Zet elke beurt ${effect.waarde} ${RESOURCE_LABELS[effect.resource].toLowerCase()} om in ${SMEDERIJ_GEREEDSCHAP_OPBRENGST} gereedschap, zolang er genoeg ${RESOURCE_LABELS[effect.resource].toLowerCase()} voorradig is (anders geen conversie die beurt).`;
  }
  // Wampanoag-vakjes (Going West, M21e/M21f, opdracht-wampanoag-opening.md
  // §5/§6): de daadwerkelijke grondstofkeuze-UI (1:1-omzetting per beurt,
  // instant omkeerbaar) zit in TileInfoPopup (`wampanoagHandelVraag`) —
  // hier alleen een korte omschrijving voor de tile-info-tekst zelf.
  if (effect.type === "wampanoag") {
    return "Een onthuld Wampanoag-vakje. Klik erop om een grondstof te kiezen voor handel.";
  }
  // Onrust (issue: "Onrust, Saloon en Courthouse", Going West, zie
  // onrust.ts): Saloon en Courthouse hebben geen productie-effect, dus geen
  // van de generieke gevallen hierboven.
  if (effect.type === "onrust-verlichting" && effect.waarde) {
    return `Vermindert de onrust op deze streek met ${effect.waarde}.`;
  }
  if (effect.type === "courthouse") {
    return "Vereist een toegewezen Rechter om effect te hebben — zet dan de onrust op deze streek én de streek erboven en eronder blijvend op 0, zolang bemand.";
  }
  if (effect.type === "rechter") {
    return "Wijs deze Rechter toe aan een Courthouse om onrust op die streek en de aangrenzende streken te onderdrukken.";
  }
  return "";
}

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
// terrein-eis hierboven, plus — alleen voor de Goudader (issue: "toevoeging
// Goud" Deel 1) — de aanvullende goudader-vondst-eis (`tile.goud`, zie
// world.ts). Een gewone Mijn mag op elk heuvel/bergvakje, maar een Goudader
// alleen op de schaarse vakjes die daadwerkelijk een goudader hebben — het
// enige improvement met een vakje-specifieke eis bovenop het terreintype.
export function improvementPastOpTile(improvement: Improvement, tile: Tile): boolean {
  if (!improvementPastOpTerrein(improvement, tile.terrein)) return false;
  if (improvement.id === "goudmijn") return Boolean(tile.goud);
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
    // `minStreek: 2` (issue: "jagen en farmen omdraaien"): op streek 1 is
    // alleen Steengroeve en Heiligdom bouwbaar — de starteconomie (zie
    // initieleSpelStatus.ts) start daarom ook met hout in plaats van steen.
    minStreek: 2,
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
    // `minStreek: 3` (issue: "Tweede streek boerderij" — verschoven van
    // streek 2 naar 3, samen met de Wachttoren/erts-introductie, zie
    // VIJAND_AAN_DE_HORIZON_TEKST in tutorialContent.ts): streek 2 was qua
    // voedsel niet haalbaar zolang de Boerderij daar nog niet stond maar er
    // al wel een voedsel-etende Wachttoren bij kon komen. Erts/Mijn schuift
    // daarom mee naar streek 3, ná de Boerderij.
    minStreek: 3,
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
    // `minStreek: 2` (issue: "Tweede streek boerderij" — verschoven van
    // streek 3 naar 2): streek 2 bleek qua voedsel niet door te komen met
    // alleen de jacht als bron, dus de Boerderij komt nu een streek eerder
    // — vóór Mijn en Wachttoren (nu allebei streek 3, zie hieronder), zodat
    // er al een tweede voedselbron staat vóórdat een bemande Wachttoren extra
    // voedsel gaat kosten.
    minStreek: 2,
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
  // Goudader (hoofdstuk 3/14, issue: "toevoeging Goud" Deel 1): functioneel
  // een goudmijn — interne sleutel `goudmijn`, tutorial-weergavenaam
  // "Goudader" (val terug via `improvementNaam()` hierboven). Zelfde
  // terrein-eis en bouwkosten als de gewone Mijn hierboven (heuvel/berg, hout
  // 8/steen 4, bouwtijd 3), maar schaarser: `improvementPastOpTile` eist
  // daarnaast `tile.goud` (zie world.ts) — niet elk heuvel/bergvakje heeft
  // een goudader. `uitputtingBeurten` 12 ligt in het midden van de
  // "gewoon"-range (10-14 beurten, hoofdstuk 14) uit het issue.
  {
    id: "goudmijn",
    naam: "Goudader",
    categorie: "economisch",
    soort: "land",
    kosten: { hout: 8, steen: 4 },
    bouwtijdBeurten: 3,
    effect: { type: "productie", resource: "goud", waarde: 2 },
    uitputtingBeurten: 12,
    terreinEisen: ["heuvel", "berg"],
  },
];

export const GOUDADER = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "goudmijn")!;

export const VOORRAADKUIL = ECONOMISCH_LAND_IMPROVEMENTS.find((i) => i.id === "voorraadkuil")!;

// Cultureel land improvement (hoofdstuk 3: "Heiligdom") — de eerste optie in
// deze categorie, nodig om cultuur te produceren voor streek-ontgrendeling (M5).
// Geen `uitputtingBeurten` (hoofdstuk 4/6): een Heiligdom blijft, anders dan
// de economische land-improvements, permanent actief in plaats van een
// ghost-town-tile te worden. `verwerkProductie` in economie.ts halveert de
// opbrengst wel zodra de tile niet op de frontier-streek (de hoogst
// ontgrendelde streek) staat.
// Offer Altaar (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 4): het tweede culturele land improvement. Ontgrendelt de
// Missionaris-unit als trainbare optie (zie `MISSIONARIS` hieronder en
// `heeftOfferAltaar`/`startMissionarisRecrutering` in economie.ts) — de
// Missionaris staat al sinds hoofdstuk 3 in het ontwerp maar was tot nu toe
// nooit daadwerkelijk bouwbaar. Normale bouwregel (hoofdstuk 6/11): geen
// `bouwbaarBuitenFrontier`-uitzondering zoals de Wachttoren, dit hoeft niet
// op de Bezette Streek zelf te staan. Kosten (hoofdstuk 14, MVP-richtwaarde,
// tunebaar): alle vier grondstoffen, in lijn met hoe de speler dit aanleverde.
//
// `infrastructuurEis` (hoofdstuk 4/6/11/14, issue: "city improvements" Deel
// 4): pas bouwbaar zodra de speler minstens 5 actieve Heiligdommen heeft én
// een Grote Tempel heeft gebouwd — een forse, meerdere-streken-brede
// opbouw-eis die de Bezette-Streek-climax pas opent nadat de speler zijn
// culturele infrastructuur echt heeft uitgebouwd (zie hoofdstuk 11 voor de
// volledige onderbouwing). `startBouw`/`voldoetAanInfrastructuurEis` in
// economie.ts handhaven dit; `beschikbareOpties` hieronder blijft het Offer
// Altaar bewust gewoon tonen (uitgegrijsd, met voortgangstekst in
// BouwPopup.tsx) zodat de speler ziet hoe ver hij is, in plaats van het
// helemaal te verbergen zoals bij een `minStreek`-eis.
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

export const HEILIGDOM: Improvement = {
  id: "heiligdom",
  naam: "Heiligdom",
  categorie: "cultureel",
  soort: "land",
  kosten: { hout: 4, steen: 4 },
  bouwtijdBeurten: 2,
  effect: { type: "productie", resource: "cultuur", waarde: 2 },
};

export const CULTUREEL_LAND_IMPROVEMENTS: Improvement[] = [HEILIGDOM, OFFER_ALTAAR];

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
// `minStreek: 4` (issue: "tutorial popups wijzigen", verschoven van 3 naar 4
// door "jagen en farmen omdraaien" — de nieuwe Boerderij-streek 3 duwt
// Wetenschap een streek op): in de tutorial is Wetenschappelijk pas vanaf
// streek 4 beschikbaar (uitgegrijsd ervoor via `beschikbareOpties`
// hieronder) — het ontgrendelen van streek 4 gaat gepaard met de
// "Goddelijke raadgeving"-pop-up (tutorialContent.ts) die precies naar de
// Sterrencirkel verwijst.
export const STERRENCIRKEL: Improvement = {
  id: "sterrencirkel",
  naam: "Sterrencirkel",
  categorie: "wetenschappelijk",
  soort: "land",
  kosten: { hout: 6, steen: 2 },
  bouwtijdBeurten: 2,
  effect: { type: "productie", resource: "wetenschap", waarde: 2 },
  minStreek: 4,
};

export const WETENSCHAPPELIJK_LAND_IMPROVEMENTS: Improvement[] = [STERRENCIRKEL];

// Militair land improvement (hoofdstuk 3/6: "Wachttoren verdedigt de hele
// streek tegen indringers"). Levert nog steeds de passieve verdedigingsbonus
// die meetelt in `berekenLegerwaarde` (M7), én blokkeert sindsdien (hoofdstuk
// 6) volledig de indringers-tribuut-eis van `verwerkIndringers` in
// economie.ts, mits hij ook bemand én wegverbonden is met de stad — welke
// streek getroffen wordt, doet er niet toe (hoofdstuk 6: elke ontgrendelde streek
// komt in aanmerking, niet alleen de frontier-streek). Sinds issue "wachttoren
// beschermt 2 streken" beschermt een werkende Wachttoren behalve zijn eigen
// streek ook de streek eronder (zie `heeftBeschermendeWachttoren` in
// economie.ts) — anders had de speler op vrijwel elke streek apart een toren
// nodig. Geen `uitputtingBeurten` (hoofdstuk 4/6): een Wachttoren, net als
// het Heiligdom hierboven, blijft permanent actief in plaats van uit te
// putten.
//
// `bouwbaarBuitenFrontier` (hoofdstuk 6/11, issue: "wachttorens, bemanning en
// bevoorrading"): een expliciete uitzondering op de algemene frontier-only
// bouwregel — anders zou een achtergelaten streek permanent onverdedigbaar
// worden zodra de frontier verder trekt, terwijl indringers overal kunnen
// toeslaan. Thematisch passend: forten werden juist áchter de oprukkende
// grens aangelegd, niet aan de voorste rand.
//
// `minStreek: 3` (issue: "Tweede streek boerderij" — verschoven van streek 2
// naar 3): in de tutorial is Militair (en dus de Wachttoren) pas vanaf streek
// 3 beschikbaar (uitgegrijsd ervoor via `beschikbareOpties` hieronder) — het
// ontgrendelen van streek 3 gaat gepaard met de "De vijand aan de
// horizon"-pop-up (tutorialContent.ts). Streek 2 blijft zo een zuivere
// Boerderij-introductie zonder dat er meteen ook al een voedsel-etende
// Wachttoren bij kan komen (zie de `minStreek`-comment bij de Boerderij
// hierboven in `ECONOMISCH_LAND_IMPROVEMENTS`).
// Legerkamp (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 5): net als de Wachttoren op elke ontgrendelde streek
// bouwbaar (`bouwbaarBuitenFrontier`) — thematisch omdat een gestationeerde
// Soldaat zelf naar een Bezette Streek kan marcheren, ongeacht waar het
// Legerkamp staat (hoofdstuk 6/11). Effect is puur een marker (geen
// "verdediging"-waarde zoals de Wachttoren): elke toegewezen Soldaat telt
// zelf zijn eigen legerwaarde mee bij een Confrontatie tegen een Bezette
// Streek (zie `berekenLegerkampLegerwaarde` in economie.ts), het Legerkamp
// zelf levert geen eigen bonus. Kosten (hoofdstuk 14, MVP-richtwaarde,
// tunebaar): vooral hout, in lijn met een kamp i.p.v. een stenen toren.
//
// `infrastructuurEis` (hoofdstuk 4/6/11/14, issue: "city improvements" Deel
// 4): pas bouwbaar zodra de speler minstens 5 actieve Wachttorens heeft én
// een Barakken heeft gebouwd — zelfde soort forse infrastructuur-eis als het
// Offer Altaar hieronder, nu voor de militaire kant van de Bezette-Streek-
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
    minStreek: 3,
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

// Verkenner (hoofdstuk 3/6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 3, herzien door "Bezette streek scherm"): geen losse,
// trainbare eenheid meer — een klik op een verhuld vakje van een Bezette
// Streek stuurt direct een verkenner (`stuurVerkenner` in
// streekOntgrendeling.ts), zonder eerst een unit te hoeven opleiden. Deze
// constante blijft puur als kosten-/bouwtijd-referentie bestaan: `kosten` is
// wat elke Verkenning kost (bovenop `VERKENNING_KOSTEN_WETENSCHAP`
// wetenschap), `bouwtijdBeurten` is hoeveel beurten het duurt voordat het
// vakje onthuld wordt (`Tile.verkenningInGang`). Geen onderdeel van
// IMPROVEMENT_POOLS/beschikbareOpties — nooit een eigen rekruteringswachtrij.
export const VERKENNER: Improvement = {
  id: "verkenner",
  naam: "Verkenner",
  categorie: "wetenschappelijk",
  soort: "unit",
  kosten: { hout: 3, erts: 1 },
  bouwtijdBeurten: 2,
  effect: { type: "verkenning" },
};

// Missionaris (hoofdstuk 3/6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 4, herzien door "Bezette streek scherm"): culturele unit —
// stond al sinds hoofdstuk 3 in het ontwerp ("voor pushback"), maar krijgt
// hier voor het eerst een daadwerkelijke functie: eenmaal opgeleid, kan de
// speler 'm op de kaart naar een specifiek vijandelijk Heiligdom sturen (klik
// op de tile, zie `stuurMissionaris` in streekOntgrendeling.ts) — dat
// Heiligdom krijgt dan een eigen wololo-meter die, eenmaal vol, het Heiligdom
// verovert in plaats van te vernietigen. Alleen trainbaar zodra er een
// voltooid Offer Altaar staat (zie `heeftOfferAltaar`/
// `startMissionarisRecrutering`). Eigen rekruteringswachtrij
// (`City.missionarisInAanbouw`), net als Soldaat. Kosten (hoofdstuk 14,
// MVP-richtwaarde, tunebaar): hout en goud i.p.v. erts, in lijn met een
// culturele in plaats van militaire unit.
export const MISSIONARIS: Improvement = {
  id: "missionaris",
  naam: "Missionaris",
  categorie: "cultureel",
  soort: "unit",
  kosten: { hout: 2, goud: 2 },
  bouwtijdBeurten: 2,
  effect: { type: "belegering" },
};

// Vijandelijke tile-varianten van een Bezette Streek (hoofdstuk 6, issue: "De
// Bezette Streek, missionaris en verkenner", Deel 1) — hergebruikt de
// bestaande Wachttoren-/Heiligdom-improvement-typen (dus dezelfde soort/
// effect-vorm) met een duidelijk andere naam/skin (`vijandelijk: true`, zie
// canvas.ts/canvasPixelArt.ts voor de kleurvariant). Nooit onderdeel van
// IMPROVEMENT_POOLS: deze worden alleen door Verkenning (economie.ts:
// `verken`) of de streek-brede onthulling bij het einde van de Bezette Streek
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
// (ook nadat de Bezette Streek is opgelost, Deel 6): omdat `startBouw` alleen
// een `"leeg"`/`"ruine"`-vakje overschrijft en dit vakje na onthulling altijd
// `"actief"` blijft met dit improvement erop, is het vanzelf permanent
// onbebouwbaar — geen aparte "permanent"-vlag nodig.
export const BEZETTE_STREEK_HUISJE: Improvement = {
  id: "bezette-streek-huisje",
  naam: "Verlaten huisje",
  categorie: "civiel",
  soort: "land",
  kosten: {},
  bouwtijdBeurten: 0,
  effect: { type: "decoratief" },
};

// Wampanoag-vakjes (Going West, M21e, opdracht-wampanoag-opening.md §5): drie
// vaste vakjes op de Wampanoag-streek (`WAMPANOAG_STREEK_HOOGTE`,
// worldGoingWest.ts), verhuld tot onthuld via Verkenning (wampanoag.ts) —
// zelfde uitsluitingspatroon als de vijandelijke Bezette-Streek-varianten
// hierboven (nooit onderdeel van IMPROVEMENT_POOLS/beschikbareOpties, nooit
// door de speler gebouwd, geen bouwkosten/-tijd), maar zonder de
// `vijandelijk`-vlag: dit zijn geen Confrontatie-/Belegeringsdoelen, maar
// (vanaf M21f) handelspartners. Welk gebouw op welk vakje ligt,
// staat vast in `WAMPANOAG_STREEK_INHOUD` (worldGoingWest.ts) — dat is
// terrein-afgeleid (opdracht §2: Maïsboerderij op vlakke grond, Beverjachthut
// op vers water), dus deze drie hebben zelf geen `terreinEisen`-afdwinging
// nodig zoals de normale, speler-bouwbare land improvements hierboven: ze
// worden nooit via `kanImprovementOpStreek`/`beschikbareOpties` geplaatst.
// `effect: { type: "wampanoag" }` is een minimale placeholder-marker — de
// daadwerkelijke handelsconversie (grondstofkeuze, 1:1-omzetting per beurt)
// is M21f, expliciet nog niet hier gebouwd.
export const MAISBOERDERIJ: Improvement = {
  id: "maisboerderij",
  naam: "Maïsboerderij",
  categorie: "economisch",
  soort: "land",
  kosten: {},
  bouwtijdBeurten: 0,
  effect: { type: "wampanoag" },
  terreinEisen: ["vlak"],
};

export const BEVERJACHTHUT: Improvement = {
  id: "beverjachthut",
  naam: "Beverjachthut",
  categorie: "economisch",
  soort: "land",
  kosten: {},
  bouwtijdBeurten: 0,
  effect: { type: "wampanoag" },
};

// Cultureel/diplomatiek van aard (opdracht §2) — geen terrein-eis, ligt op
// het derde, terrein-onafhankelijke Wampanoag-vakje.
export const OPPERHOOFDTENT: Improvement = {
  id: "opperhoofdtent",
  naam: "Opperhoofdtent",
  categorie: "cultureel",
  soort: "land",
  kosten: {},
  bouwtijdBeurten: 0,
  effect: { type: "wampanoag" },
};

// Puur decoratief Wampanoag-tentje (issue "Wampanoag kamp uitbreiding"): twee
// vaste vakjes naast de Opperhoofdtent die het kamp groter/voller laten ogen
// — zelfde niet-interactieve, geen-productie-opzet als BEZETTE_STREEK_HUISJE
// hierboven ("doet niets, handelt niet"), maar via de Wampanoag-verhullings-
// laag i.p.v. de Bezette Streek geplaatst (`WAMPANOAG_STREEK_INHOUD`,
// worldGoingWest.ts). `wampanoagHandelOpties("tentje")` (wampanoag.ts) geeft
// bewust een lege lijst terug, zodat de handels-UI hier nooit verschijnt.
export const WAMPANOAG_TENTJE: Improvement = {
  id: "wampanoag-tentje",
  naam: "Tentje",
  categorie: "civiel",
  soort: "land",
  kosten: {},
  bouwtijdBeurten: 0,
  effect: { type: "decoratief" },
};

// Onrust (issue: "Onrust, Saloon en Courthouse", Going West-exclusief, zie
// onrust.ts): Saloon en Courthouse zijn de eerste twee echte Civiele land
// improvements (Weg/Brug blijven buiten de MVP-scope, zie de comment bij
// WOONWIJK hieronder) — `IMPROVEMENT_POOLS.civiel` was tot nu toe leeg.
// Allebei `vereisteCampagneId: "going-west"` (types.ts): nooit in de tutorial
// of een andere campagne, en `minStreek: 8` als hun eigen introductiepunt
// binnen Going West (issue-comment: "Pas vanaf streek 8 van Going West geldt
// onrust als mechanisme"), niet de gebruikelijke tutorial-only
// `minStreek`-uitzondering die `beschikbareOpties` hieronder normaal maakt.
export const ONRUST_MIN_STREEK = 8;

// Saloon: goedkoop, geen terrein-/andere eis — vermindert de onrust op de
// eigen streek met 1 zolang hij actief staat (onrust.ts:
// `SALOON_ONRUST_VERMINDERING`). Telt zelf niet mee als een van de
// onrust-veroorzakende improvements op zijn streek (issue-comment: "de
// saloon moet niet zelf meetellen bij onrust") — zie `ONRUST_UITGESLOTEN_IDS`
// in onrust.ts.
export const SALOON: Improvement = {
  id: "saloon",
  naam: "Saloon",
  categorie: "civiel",
  soort: "land",
  kosten: { hout: 4, steen: 2 },
  bouwtijdBeurten: 1,
  effect: { type: "onrust-verlichting", waarde: 1 },
  vereisteCampagneId: "going-west",
  minStreek: ONRUST_MIN_STREEK,
};

// Courthouse: duurder dan de Saloon, bouwbaar zonder voorwaarde vooraf — maar
// heeft pas effect zodra een opgeleide Rechter 'm bemant (zelfde
// bemannings-patroon als de Wachttoren, zie `Rechter`/`City.rechters`,
// types.ts, en `bemanCourthouse`/`haalRechterTerug` in onrust.ts). Telt,
// net als de Saloon hierboven, zelf niet mee als onrust-veroorzakend
// improvement.
export const COURTHOUSE: Improvement = {
  id: "courthouse",
  naam: "Courthouse",
  categorie: "civiel",
  soort: "land",
  kosten: { hout: 8, steen: 10, goud: 4 },
  bouwtijdBeurten: 3,
  effect: { type: "courthouse" },
  vereisteCampagneId: "going-west",
  minStreek: ONRUST_MIN_STREEK,
};

export const CIVIEL_LAND_IMPROVEMENTS: Improvement[] = [SALOON, COURTHOUSE];

// Rechter (issue: "Onrust, Saloon en Courthouse"): trainbare eenheid, zelfde
// soort losse rekruterings-wachtrij als SOLDAAT/MISSIONARIS hierboven
// (`City.rechterInAanbouw`, groeiEnRekrutering.ts) — geen land-vakje, dus
// geen onderdeel van IMPROVEMENT_POOLS/beschikbareOpties. Geen voorwaarde
// vooraf (anders dan de Missionaris, die een voltooid Offer Altaar vereist):
// een Rechter kan losstaand van een al gebouwd Courthouse opgeleid worden.
export const RECHTER: Improvement = {
  id: "rechter",
  naam: "Rechter",
  categorie: "civiel",
  soort: "unit",
  kosten: { goud: 3, hout: 2 },
  bouwtijdBeurten: 3,
  effect: { type: "rechter" },
};

// Stadsgroei-improvement (M6, hoofdstuk 3/4: "Aquaduct, riolering, woonwijk
// (= groei-tiers)"). Dit is een `soort: "city"`-improvement die de stad zelf
// upgradet, geen land-vakje — daarom geen onderdeel van IMPROVEMENT_POOLS/
// beschikbareOpties (die zijn voor land-improvements op de actieve streek) en
// wordt in plaats daarvan rechtstreeks gebruikt door de startGroei-actie in
// economie.ts en het civiele paneel. Weg/brug (de overige land-improvements
// onder civiel) blijven, net als Saloon/Courthouse hierboven niet, buiten de
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

// Smederij (Going West, M21d, opdracht-wampanoag-opening.md §3): economische
// city improvement, buiten de city-improvement-cap — zelfde uitzondering als
// Opslagplaats hierboven (reden: zou bij een kleine stad de facto verplicht
// zijn). Anders dan Opslagplaats niet herhaalbaar (`City.heeftSmederij`,
// types.ts): één Smederij volstaat, meer heeft in de MVP geen extra effect.
// `effect.waarde` is de erts-input per beurt; de gereedschap-opbrengst staat
// hardcoded in `SMEDERIJ_GEREEDSCHAP_OPBRENGST` hieronder (er is nog maar één
// conversie-gebouw, dus geen apart "output"-veld op `EffectDefinition`
// nodig). `verwerkProductie` (productie.ts) past de conversie toe: zolang er
// genoeg erts voorradig is, anders geen conversie die beurt en nooit een
// negatieve voorraad (opdracht §3, "zelfde regel als tribuut-afhandeling").
// Kosten/bouwtijd (MVP-richtwaarde, tunebaar): vergelijkbaar met de overige
// vroege economische city improvements.
export const SMEDERIJ_GEREEDSCHAP_OPBRENGST = 1;

export const SMEDERIJ: Improvement = {
  id: "smederij",
  naam: "Smederij",
  categorie: "economisch",
  soort: "city",
  kosten: { hout: 6, steen: 4 },
  bouwtijdBeurten: 2,
  effect: { type: "conversie", resource: "erts", waarde: 2 },
};

// Gecapte city improvements (hoofdstuk 3/4/11/14, issue: "city improvements"
// Deel 1/3): elke stad kan er hoogstens `CITY_IMPROVEMENT_CAP[grootte]`
// tegelijk van hebben (economie.ts) — dit is de tastbare groei-beloning die
// het nooit-gebouwde relic-slot-concept uit een eerdere versie van hoofdstuk
// 4 vervangt. Opslagplaats hierboven en de groei-tier-improvements
// (WOONWIJK/GROTE_WOONWIJK) tellen bewust niet mee (zie hoofdstuk 11): die
// hebben allebei al hun eigen wachtrij/functie, dit zijn de zes improvements
// die om een slot concurreren. Bibliotheek/Markt/Barakken/Tempel/Grote Tempel
// hebben elk een eigen `productie`-/`stad-legerwaarde`-effect dat
// `verwerkProductie`/`berekenCultuurProductieDitBeurt`/`berekenLegerwaarde` in
// economie.ts meetellen zodra hij in `City.cityImprovements` staat — zonder
// wegverbinding-eis (net als Opslagplaats): een city improvement staat niet
// op een land-vakje. Aquaduct (hieronder, na Grote Tempel) wijkt hierin af:
// géén doorlopende productie, maar een eenmalige, blijvende verlaging van de
// groeidrempel (zie `aquaductVoedseldrempelVerlaging` verderop) — zelfde
// "staat in de array, telt mee voor de cap"-behandeling, andere
// effect-verwerking.
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
// (`berekenLegerwaarde`) als de Confrontatie tegen een Bezette Streek
// (`confrontatieBezetteStreek`), zie economie.ts. Ontgrendelt daarnaast, samen
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

// Aquaduct (hoofdstuk 3/4/13, issue: "Aquaduct city improvement" #285): het
// Civiel-category-gat uit de tabel in hoofdstuk 3 ("Aquaduct, riolering,
// woonwijk + grote woonwijk") — Woonwijk/Grote Woonwijk (de groei-tier-stappen
// zelf, hierboven) waren al gebouwd, maar Civiel had tot nu toe geen enkel
// gecapt city improvement zoals de andere vier categorieën (Bibliotheek/Markt/
// Barakken/Tempel). Zelfde `stadsgrootteEis: "middel"`-patroon als Barakken/
// Tempel. Effect-type "groeidrempel-verlaging" is nieuw: verlaagt
// `VOEDSEL_DREMPEL_GROEI_GROOT` (world.ts, momenteel 100) met `waarde` zodra
// het in `City.cityImprovements` staat — zie `aquaductVoedseldrempelVerlaging`
// hieronder, gebruikt door `groeiTierVoedselDrempel` (groeiEnRekrutering.ts)
// en de gelijknamige weergave-functie in CivielPaneel.tsx. -40 is een
// bewuste MVP-placeholder (hoofdstuk 14: "flink" uit het issue) die de
// drempel van 100 naar 60 brengt — in dezelfde orde van grootte als de eerste
// groei-drempel (`VOEDSEL_DREMPEL_GROEI`, 40).
export const AQUADUCT: Improvement = {
  id: "aquaduct",
  naam: "Aquaduct",
  categorie: "civiel",
  soort: "city",
  kosten: { hout: 4, steen: 10 },
  bouwtijdBeurten: 3,
  effect: { type: "groeidrempel-verlaging", waarde: 40 },
  stadsgrootteEis: "middel",
};

// Hoeveel het Aquaduct (indien gebouwd) de voedseldrempel voor groei naar
// Groot verlaagt — 0 zonder Aquaduct. Gedeeld tussen `groeiTierVoedselDrempel`
// (groeiEnRekrutering.ts) en de weergave in CivielPaneel.tsx zodat beide
// dezelfde drempel tonen/hanteren.
export function aquaductVoedseldrempelVerlaging(cityImprovements: Improvement[]): number {
  return cityImprovements.find((ci) => ci.id === "aquaduct")?.effect.waarde ?? 0;
}

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

// Alle zes gecapte city improvements — de opties voor de nieuwe
// stadsverbeteringen-UI (StadsverbeteringenPaneel.tsx), gefilterd daar
// verder op stadsgrootte-eis/al-gebouwd/cap (groeiEnRekrutering.ts:
// `kanCityVerbeteringBouwen`).
export const CAPPED_CITY_IMPROVEMENTS: Improvement[] = [BIBLIOTHEEK, MARKT, BARAKKEN, TEMPEL, GROTE_TEMPEL, AQUADUCT];

// City-improvement-capaciteit per stadsgrootte (hoofdstuk 3/4/11/14, issue:
// "city improvements" Deel 1) — hoeveel van de vijf improvements hierboven
// een stad tegelijk mag hebben. Vervangt het nooit-gebouwde relic-slot-concept
// uit een eerdere versie van hoofdstuk 4 als de tastbare groei-beloning
// (hoofdstuk 11 heeft de volledige onderbouwing). Opslagplaats en de
// groei-tier-improvements (Woonwijk/Grote Woonwijk) tellen hier bewust niet
// in mee. Staat hier (i.p.v. in economie.ts, dat dit alleen doorgeeft) zodat
// groeiEnRekrutering.ts dit kan importeren zonder een circulaire
// afhankelijkheid met de economie.ts-orchestrator te vormen.
export const CITY_IMPROVEMENT_CAP: { klein: number; middel: number; groot: number } = {
  klein: 1,
  middel: 3,
  groot: 5,
};

export function cityImprovementCap(grootte: City["grootte"]): number {
  return CITY_IMPROVEMENT_CAP[grootte];
}

const IMPROVEMENT_POOLS: Record<Improvement["categorie"], Improvement[]> = {
  economisch: ECONOMISCH_LAND_IMPROVEMENTS,
  wetenschappelijk: WETENSCHAPPELIJK_LAND_IMPROVEMENTS,
  militair: MILITAIR_LAND_IMPROVEMENTS,
  civiel: CIVIEL_LAND_IMPROVEMENTS,
  cultureel: CULTUREEL_LAND_IMPROVEMENTS,
};

// Een "ruine"-vakje (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 5: een verloren Confrontatie tegen een Bezette Streek) is,
// anders dan een permanente "ghost_town"-tile, net zo herbouwbaar als een
// gewoon leeg vakje — tegen de normale kosten/bouwtijd van welk improvement
// dan ook (niet uitsluitend de Wachttoren die er ooit stond).
export function isBebouwbaarLeeg(tile: Tile): boolean {
  // Wampanoag-vakjes (Going West, M21e, opdracht-wampanoag-opening.md §5): een
  // nog verhuld Wampanoag-vakje (`status: "leeg"`) zou hier anders per
  // ongeluk een geldig plaatsingsdoel zijn — de speler mag hier pas na
  // onthulling (via Verkenning, zie wampanoag.ts) weer bouwen. Zolang de
  // streek als geheel nog bezet is (`Streek.wampanoagBezet`), houdt
  // `beschrijfTile`/canvas' plaatsingsmarkering (die op `streek.ontgrendeld`
  // let, issue: "Wampanoag streek blokkerend") bouwen sowieso al tegen — deze
  // check dekt specifiek het per-vakje geval.
  return (tile.status === "leeg" || tile.status === "ruine") && !tile.wampanoagVerhuld;
}

// Of `improvement` een leeg, terrein-geschikt vakje heeft op `streek`, en daar
// niet al gebouwd staat — de kern-plaatsingscheck, per streek.
function kanImprovementOpStreek(improvement: Improvement, streek: Streek): boolean {
  const reedsGebouwd = streek.tiles.some((tile) => tile.improvement?.id === improvement.id);
  if (reedsGebouwd) return false;
  return streek.tiles.some((tile) => isBebouwbaarLeeg(tile) && improvementPastOpTile(improvement, tile));
}

// Opties voor de categorie-keuze-UI (hoofdstuk 11: eerst categorie, dan alle
// op dat moment geldige land improvements binnen die categorie — geen
// willekeurige subset meer). Sluit improvements uit die al op deze streek
// gebouwd zijn, én improvements met een terrein-eis (zie
// `Improvement.terreinEisen`) die geen enkel leeg vakje op deze streek kan
// plaatsen — anders zou de speler een optie kunnen kiezen die nergens
// neergezet kan worden.
//
// `bouwbaarBuitenFrontier`-improvements (hoofdstuk 6/11: momenteel alleen de
// Wachttoren) zijn hierop een uitzondering: die tellen als beschikbaar zodra
// er ergens op een ontgrendelde streek (niet per se `streek` zelf) een geldig
// leeg vakje voor ze is — `alleStreken` is nodig om dat over de hele band heen
// te checken.
//
// `technologieen` (hoofdstuk 3/9, issue: "tech tree toevoegen" Deel 2) sluit
// daarnaast improvements met een `vereisteTech` (momenteel alleen de
// Voorraadkuil, ontgrendeld door "aardewerk") uit zolang die tech nog niet
// gekozen is — een lege array (de default) sluit dus elke tech-gated
// improvement uit, precies het gedrag vóórdat er ooit een tech gekozen is.
//
// `minStreek` (issue: "tutorial popups wijzigen", volgorde verschoven door
// "jagen en farmen omdraaien" en, later, "Tweede streek boerderij") sluit op
// dezelfde manier improvements uit zolang de hoogst ontgrendelde streek
// (frontier) de vereiste hoogte nog niet bereikt heeft — momenteel Houtkap
// (streek 2), de Boerderij (streek 2), de Mijn en de Wachttoren (allebei
// streek 3) en de Sterrencirkel (streek 4). Heeft een categorie hierdoor geen
// enkele optie meer over, dan toont de bouw-pop-up (BouwPopup.tsx) 'm
// uitgegrijsd, precies zoals bij een categorie zonder geldig leeg vakje.
//
// Deze `minStreek`-drempels zijn stuk voor stuk tutorial-pacing-beslissingen
// (elke comment hierboven verwijst naar een tutorial-specifiek issue) — ze
// horen niet automatisch ook voor andere campagnes te gelden. Going West had
// via deze gedeelde `minStreek`-velden de tutorial-tempo-beperking geërfd —
// bijvoorbeeld alleen de Steengroeve bouwbaar op streek 1 (issue: "Going west
// campaign geen tutorial"). Vandaar `campagneId`: is er een campagne actief (dus niet de
// tutorial, `undefined`), dan slaat deze filter over — alles blijft gewoon
// bouwbaar vanaf streek 1.
export function beschikbareOpties(
  categorie: Improvement["categorie"],
  streek: Streek,
  alleStreken: Streek[],
  technologieen: TechId[] = [],
  campagneId?: string
): Improvement[] {
  const frontierHoogte = hoogsteOntgrendeldeStreek(alleStreken);
  return IMPROVEMENT_POOLS[categorie]
    // Campagne-exclusieve improvements (issue: "Onrust, Saloon en
    // Courthouse", `Improvement.vereisteCampagneId`): nooit beschikbaar
    // buiten hun eigen campagne, dus ook nooit in de tutorial.
    .filter((improvement) => !improvement.vereisteCampagneId || improvement.vereisteCampagneId === campagneId)
    .filter((improvement) => !improvement.vereisteTech || technologieen.includes(improvement.vereisteTech))
    .filter((improvement) => {
      if (!improvement.minStreek) return true;
      // `vereisteCampagneId`-improvements gebruiken `minStreek` als hun eigen
      // introductiepunt binnen die campagne (hierboven al bevestigd dat
      // `campagneId` overeenkomt) — anders dan de tutorial-pacing-drempels
      // hieronder wordt deze eis dus niet overgeslagen zodra er een campagne
      // actief is.
      if (improvement.vereisteCampagneId) return frontierHoogte >= improvement.minStreek;
      return campagneId !== undefined || frontierHoogte >= improvement.minStreek;
    })
    .filter((improvement) =>
      improvement.bouwbaarBuitenFrontier
        ? alleStreken.some((l) => l.ontgrendeld && kanImprovementOpStreek(improvement, l))
        : kanImprovementOpStreek(improvement, streek)
    );
}
