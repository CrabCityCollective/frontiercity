// CampaignConfig-instantie(s) voor de niet-tutorial-campagnes (hoofdstuk 8/9
// design-doc). M20a (hoofdstuk 13/15): alleen de Amerikaanse frontier-
// campagne ("Going West") krijgt hier een echte instantie — de kleinste,
// niet-worldgen-rakende stap. `improvementNaam()`/`techNaam()`
// (improvements.ts/techTree.ts) vallen automatisch op de tutorial-naam terug
// zolang niemand deze config nog doorgeeft; er is dus bewust nog geen
// koppeling naar een actieve run (dat komt met M20b/M20c, een eigen
// campagnekaart) en `CampagneSelectScherm.tsx` blijft "Going West" tonen als
// nog niet beschikbaar totdat die kaart er is.

import {
  goingWestStreekContent,
  GOING_WEST_INTRO_AFBEELDING,
  GOING_WEST_INTRO_FLAVOR_TEKST,
  GOING_WEST_INTRO_SUBTITEL,
  GOING_WEST_INTRO_TITEL,
  GOING_WEST_OCEAAN_UITLEG_TEKST,
  GOING_WEST_OCEAAN_UITLEG_TITEL,
} from "./goingWestContent";
import {
  INTRO_AFBEELDING,
  INTRO_FLAVOR_TEKST,
  INTRO_SUBTITEL,
  INTRO_TITEL,
  OCEAAN_UITLEG_TEKST,
  OCEAAN_UITLEG_TITEL,
  StreekContent,
  streekContent as tutorialStreekContent,
} from "./tutorialContent";
import { CampaignConfig } from "./types";

// Weergavenamen-tabel uit hoofdstuk 9 ("Weergavenamen"). Sleutels zijn
// `Improvement.id` (improvements.ts) — Boerderij/Mijn/Houtkap/Steengroeve/
// Voorraadkuil en de Huifkar (settler) krijgen bewust geen override, zoals
// het design-document aangeeft: generiek genoeg voor beide settings, ze
// vallen terug op de tutorial-naam via `improvementNaam()`. De Karavaan-rij
// uit diezelfde tabel is hier nog niet opgenomen: die unit bestaat nog niet
// als `Improvement` (post-MVP, meerdere-steden, hoofdstuk 13/14).
export const GOING_WEST_CAMPAGNE: CampaignConfig = {
  id: "going-west",
  naam: "Going West",
  tegelSet: "going-west",
  // Geen van de multipliers heeft in hoofdstuk 9 een concrete waarde
  // gekregen (in tegenstelling tot bijv. de nog niet gebouwde Siberische
  // campagne, hoofdstuk 8) — leeg laten betekent: zelfde basiswaarden als de
  // tutorial.
  multipliers: {},
  improvementNamen: {
    // Land improvements
    sterrencirkel: "Observatorium",
    goudmijn: "Goudmijn",
    wachttoren: "Blokhuis",
    legerkamp: "Fort",
    heiligdom: "Kapel",
    "offer-altaar": "Opwekkingstent",
    // City improvements
    markt: "Handelspost",
    opslagplaats: "Pakhuis",
    bibliotheek: "Schoolhuis",
    barakken: "Garnizoen",
    tempel: "Kerk",
    "grote-tempel": "Kathedraal",
    woonwijk: "Hoofdstraat",
    "grote-woonwijk": "Spoorwegstation",
    // Units
    verkenner: "Spoorzoeker",
    missionaris: "Prediker",
  },
  // Narratieve pop-up-teksten (opdracht-wampanoag-opening.md §7/§8, M21g) —
  // gesleuteld per functioneel moment, telkens een `...Titel`/`...Tekst`-paar
  // (zelfde titel/tekst-opsplitsing als `IntroContent`/`OceaanUitlegContent`
  // hieronder, maar via `CampaignConfig.popupTeksten` in plaats van een eigen
  // interface, omdat dit er ná de MVP meerdere kunnen worden zonder steeds een
  // nieuw functie-paar nodig te hebben — zie `popupContent()` onderaan dit
  // bestand). `campagneOpeningPopup` triggert bij het begin van beurt 1 (issue
  // "Pop-up teksten Wampanoag" — expliciet los van `introContentVoorCampagne`/
  // `IntroScherm` hieronder, dat blijft het titelscherm vóór "Beginnen");
  // `eersteContactPopup` triggert zodra de Wampanoag-streek
  // (`WAMPANOAG_STREEK_HOOGTE`, worldGoingWest.ts) "in beeld" komt
  // (`wampanoagLaagOntdektEvent`, streekOntgrendeling.ts);
  // `wampanoagRelatieGelegdPopup` zodra de 3-3-3-handelsdrempel gehaald is
  // (`wampanoagRelatieGelegdEvent`, wampanoag.ts).
  popupTeksten: {
    campagneOpeningPopupTitel: "De nieuwe wereld",
    campagneOpeningPopupTekst:
      "Engeland ligt aan de andere kant van de wereld. Wij staan alleen aan deze kust, tussen de wilden.\n" +
      "De Wampanoag zijn een trots volk. Ze dulden ons nog niet in dit nieuwe land.\n" +
      "Wij hebben God aan onze zijde. Bouw Kapellen, zodat het land onder God komt.\n" +
      "Zoek het hoofdkamp van de Wampanoag. Misschien zijn ze te overtuigen om ons verder te laten gaan, op onze goddelijke missie.",
    eersteContactPopupTitel: "Eerste contact",
    eersteContactPopupTekst:
      "In het midden van de nieuwe streek liggen drie kampementen van de Wampanoag. Stuur verkenners om ze " +
      "te ontdekken — daarna kun je met ze handelen in bevervellen, maïs en wampum.",
    wampanoagRelatieGelegdPopupTitel: "Een verbond met de Wampanoag",
    wampanoagRelatieGelegdPopupTekst:
      "Door eerlijke handel is er vertrouwen gegroeid tussen jouw nederzetting en de Wampanoag. Cultuur " +
      "stuurt vanaf nu je verdere groei, en de eerste culturele gebouwen worden beschikbaar.",
  },
  // Issue "Going west: indringers": de indringers-incidenten (verwerkIndringers,
  // indringersEnDieren.ts) moeten op Going West niet de generieke fictieve
  // tutorial-stamnamen tonen, maar allemaal van de Wampanoag afkomstig zijn —
  // functioneel beschreven, geen karikatuur (ontwerp.md, "Flavor-tekststijlgids").
  // Vroege invallen, vóór het eerste contact op de Wampanoag-streek
  // (opdracht-wampanoag-opening.md), passen bij de "donkerder, minder heroïsch"
  // toon uit ontwerp.md: onrust met de Wampanoag al vóór de handelsrelatie er is.
  indringersStamNamen: ["de Wampanoag", "het Wampanoag-volk"],
  // Vervolg op de Wampanoag-opening (issue "Na de Wampanoag", M22): zodra het
  // verbond gesloten is (`cultureelOntgrendeld`, de 3-3-3-handelsdrempel uit
  // wampanoag.ts), zijn streken 1-7 — het voormalige Wampanoag-invalsgebied —
  // blijvend veilig, en nemen drie nieuwe stammen de invallen verderop over.
  // Eén daarvan (de Shawnee) staat al vast; de andere twee zijn nog te
  // bedenken en staan hier bewust als placeholder, net als de "todo"-
  // flavor-tekst elders in Going West (goingWestContent.ts).
  indringersUitgeslotenTotHoogteNaVerbond: 7,
  indringersStamNamenNaVerbond: ["de Shawnee", "stam2", "stam3"],
};

// Alle bestaande, niet-tutorial `CampaignConfig`-instanties, gesleuteld op
// `id` (M20d deelstap 1). De tutorial staat hier bewust niet in — die heeft
// geen eigen `CampaignConfig`, `campagneConfig(undefined)` geeft dus terecht
// `undefined` terug en `improvementNaam()`/`techNaam()` vallen dan vanzelf op
// de tutorial-naam terug.
const CAMPAGNES: Record<string, CampaignConfig> = {
  [GOING_WEST_CAMPAGNE.id]: GOING_WEST_CAMPAGNE,
};

// Zoekt de `CampaignConfig` bij `GameState.campagneId` op (M20d deelstap 1) —
// centrale plek zodat GameRoot niet zelf per component hoeft te weten welke
// id bij welke config hoort. `undefined` (tutorial, of een onbekende/oude
// id) geeft bewust `undefined` terug in plaats van te gooien.
export function campagneConfig(campagneId?: string): CampaignConfig | undefined {
  return campagneId ? CAMPAGNES[campagneId] : undefined;
}

// Campagne-bewuste streek-content-dispatch (hoofdstuk 19 design-doc, blocker
// 1 vervolg, issue #278): `StreekPopup`/`StreekIntroPaneel`/`GameRoot` riepen
// tot nu toe uitsluitend de tutorial-content aan (`tutorialContent.ts`), wat
// op een Going West-run letterlijk Hertenpad-volk-lore zou tonen. Zelfde
// val-terug-op-tutorial-conventie als `campagneConfig` hierboven: een
// onbekende/tutorial-`campagneId` geeft de tutorial-content terug.
export function streekContentVoorCampagne(campagneId: string | undefined, hoogte: number): StreekContent | undefined {
  if (campagneId === GOING_WEST_CAMPAGNE.id) return goingWestStreekContent(hoogte);
  return tutorialStreekContent(hoogte);
}

// Campagne-bewust introscherm (hoofdstuk 19 design-doc, blocker 1, laatste
// openstaande stuk): zelfde val-terug-op-tutorial-conventie als hierboven.
export interface IntroContent {
  titel: string;
  subtitel: string;
  flavorTekst: string;
  // Campagne-eigen sfeerbeeld (issue "Scène beelden") — Going West toont een
  // eigen scène i.p.v. het tutorial-plaatje.
  afbeelding: string;
}

export function introContentVoorCampagne(campagneId: string | undefined): IntroContent {
  if (campagneId === GOING_WEST_CAMPAGNE.id) {
    return {
      titel: GOING_WEST_INTRO_TITEL,
      subtitel: GOING_WEST_INTRO_SUBTITEL,
      flavorTekst: GOING_WEST_INTRO_FLAVOR_TEKST,
      afbeelding: GOING_WEST_INTRO_AFBEELDING,
    };
  }
  return { titel: INTRO_TITEL, subtitel: INTRO_SUBTITEL, flavorTekst: INTRO_FLAVOR_TEKST, afbeelding: INTRO_AFBEELDING };
}

// Campagne-bewuste oceaan-uitleg-pop-up (zelfde blocker als hierboven, tweede
// en laatste openstaande stuk).
export interface OceaanUitlegContent {
  titel: string;
  tekst: string;
}

export function oceaanUitlegVoorCampagne(campagneId: string | undefined): OceaanUitlegContent {
  if (campagneId === GOING_WEST_CAMPAGNE.id) {
    return { titel: GOING_WEST_OCEAAN_UITLEG_TITEL, tekst: GOING_WEST_OCEAAN_UITLEG_TEKST };
  }
  return { titel: OCEAAN_UITLEG_TITEL, tekst: OCEAAN_UITLEG_TEKST };
}

// Narratieve/flavor-pop-up-tekst uit `CampaignConfig.popupTeksten` (M21g,
// opdracht-wampanoag-opening.md §8, "laag 2" van de driedeling: campagne-
// gebonden, generieke trigger-logica in de aanroepende code, alleen de
// tekst-invulling verschilt per campagne). Anders dan `introContentVoorCampagne`/
// `oceaanUitlegVoorCampagne` hierboven bewust geen tutorial-terugval: ontbreekt
// de sleutel (of heeft de campagne geen `popupTeksten`), dan geeft dit
// `undefined` terug — de aanroepende pop-up toont dan gewoon geen tekst in
// plaats van per ongeluk andere-campagne-flavor te lenen (zie `CampaignConfig.
// popupTeksten` in types.ts).
export interface PopupContent {
  titel: string;
  tekst: string;
}

export function popupContent(campagne: CampaignConfig | undefined, sleutel: string): PopupContent | undefined {
  const titel = campagne?.popupTeksten?.[`${sleutel}Titel`];
  const tekst = campagne?.popupTeksten?.[`${sleutel}Tekst`];
  return titel && tekst ? { titel, tekst } : undefined;
}
