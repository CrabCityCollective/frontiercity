// CampaignConfig-instantie(s) voor de niet-tutorial-campagnes (hoofdstuk 8/9
// design-doc). M20a (hoofdstuk 13/15): alleen de Amerikaanse frontier-
// campagne ("Going West") krijgt hier een echte instantie — de kleinste,
// niet-worldgen-rakende stap. `improvementNaam()`/`techNaam()`
// (improvements.ts/techTree.ts) vallen automatisch op de tutorial-naam terug
// zolang niemand deze config nog doorgeeft; er is dus bewust nog geen
// koppeling naar een actieve run (dat komt met M20b/M20c, een eigen
// campagnekaart) en `CampagneSelectScherm.tsx` blijft "Going West" tonen als
// nog niet beschikbaar totdat die kaart er is.

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
