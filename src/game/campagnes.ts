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
  GOING_WEST_INTRO_FLAVOR_TEKST,
  GOING_WEST_INTRO_SUBTITEL,
  GOING_WEST_INTRO_TITEL,
  GOING_WEST_OCEAAN_UITLEG_TEKST,
  GOING_WEST_OCEAAN_UITLEG_TITEL,
} from "./goingWestContent";
import {
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
}

export function introContentVoorCampagne(campagneId: string | undefined): IntroContent {
  if (campagneId === GOING_WEST_CAMPAGNE.id) {
    return {
      titel: GOING_WEST_INTRO_TITEL,
      subtitel: GOING_WEST_INTRO_SUBTITEL,
      flavorTekst: GOING_WEST_INTRO_FLAVOR_TEKST,
    };
  }
  return { titel: INTRO_TITEL, subtitel: INTRO_SUBTITEL, flavorTekst: INTRO_FLAVOR_TEKST };
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
