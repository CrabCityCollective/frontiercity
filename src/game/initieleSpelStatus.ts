// Startstatus van een nieuwe run (M3, hoofdstuk 5) — losstaand van economie.ts
// zodat zowel de orchestrator (`volgendeBeurt`, economie.ts) als
// `verwerkVerval` (uitputtingEnVerval.ts, die bij een volledige ineenstorting
// terugvalt op een verse startstatus) dit kunnen importeren zonder dat de
// twee bestanden op elkaar circulair zouden moeten leunen.

import { standaardUitlegAan } from "./save";
import { GameState, MateriaalType } from "./types";
import { maakInitieleWereld } from "./world";

export const OPSLAG_CAP = 30;

// Startgrondstoffen (issue: "je begint met bijna geen grondstoffen, alleen
// net genoeg om een houtkap te bouwen"): precies genoeg steen voor een
// Houtkap (kosten: `steen: 6`) en niets daarnaast — een Steengroeve, Mijn of
// Boerderij is bij de start dus nog niet te betalen.
const STARTVOORRAAD: Record<MateriaalType, number> = {
  hout: 0,
  steen: 6,
  erts: 0,
  goud: 0,
};

// Startvoedsel (issue: "genoeg voedsel om het net genoeg beurten te
// overleven zodat de houtkap, plus de wegen ernaartoe, net klaar zijn"):
// afgestemd op het bouw/wegen-tempo van de openingszet — genoeg om de
// Houtkap (2 beurten bouwtijd + 1-2 beurten wegaanleg) te overbruggen,
// waarna de voedselwaarschuwing verschijnt en een Boerderij nodig wordt.
const VOEDSEL_START = 14;

export function maakInitieleSpelStatus(): GameState {
  return {
    stad: {
      naam: "Holenrots",
      grootte: "klein",
      relics: [],
      vervalStatus: "gezond",
      strijders: [],
      verkenners: [],
      missionarissen: [],
      cityImprovements: [],
    },
    lagen: maakInitieleWereld(),
    voorraad: { ...STARTVOORRAAD },
    opslagCap: OPSLAG_CAP,
    voedsel: VOEDSEL_START,
    cultuur: 0,
    wetenschap: 0,
    technologieen: [],
    beurt: 1,
    bouwKeuzeGedaanDitBeurt: false,
    settlerActieGedaanDitBeurt: false,
    verkenningGedaanDitBeurt: false,
    volgendeBouwBeurt: 1,
    // Standaard-instelling (issue: "een setting waarmee je deze uitleg
    // pop-ups aan en uit kunt zetten ... standaard voor alle nieuwe potjes")
    // bepaalt de startwaarde; de per-run toggle in het hoofdmenu wijzigt
    // daarna alleen deze ene run.
    uitlegPopupsAan: standaardUitlegAan(),
  };
}
