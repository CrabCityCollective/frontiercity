// Groei & stadswachtrijen (M6/M7, hoofdstuk 11): zodra voedsel de
// groeidrempel haalt kan de speler bewust de groei-tier klein→middel(→groot)
// starten (geen automatische ontgrendeling zoals cultuur, hoofdstuk 11), die
// net als een land-improvement een aantal beurten rijptijd kost. Dezelfde
// civiele wachtrij (`civielInAanbouw`) dient ook een nieuwe settler
// (hoofdstuk 3/11/13/16) — hoogstens één van de twee tegelijk. Opslagplaats
// (hoofdstuk 3/5/13/14), de vijf gecapte city improvements (Bibliotheek/
// Markt/Barakken/Tempel/Grote Tempel, hoofdstuk 3/4/11/14) en de Soldaat-/
// Verkenner-/Missionaris-rekrutering (M7, hoofdstuk 6) volgen elk hun eigen,
// verder losstaande wachtrij, maar hergebruiken dezelfde
// `investeerInBouwkosten`/`pasVersnellingToe`-machinerie uit bouwwachtrij.ts.

import {
  cityImprovementCap,
  GROTE_WOONWIJK,
  MISSIONARIS,
  NIEUWE_SETTLER,
  OPSLAGPLAATS,
  SOLDAAT,
  VERKENNER,
  WOONWIJK,
} from "./improvements";
import { City, GameState, Improvement, Strijder } from "./types";
import { STAD_POSITIE, VOEDSEL_DREMPEL_GROEI, VOEDSEL_DREMPEL_GROEI_GROOT } from "./world";
import { investeerInBouwkosten, pasVersnellingToe } from "./bouwwachtrij";
import { heeftOfferAltaar } from "./laagOntgrendeling";

// Betaalt de bouwkosten van een lopende civiele stadsbouw (M6, hoofdstuk
// 11/16): één gedeelde wachtrij voor de groei-tier (WOONWIJK) én een nieuwe
// settler (NIEUWE_SETTLER) — hoogstens één van de twee tegelijk (hoofdstuk
// 11: "concurrerend met de groei-improvements"). Los van de
// land-tile-bouwwachtrij omdat dit de stad zelf upgradet, geen land-vakje.
// Bij voltooiing bepaalt `effect.type` welk resultaat het oplevert: "groei"
// (grootte klein→middel, bestaand gedrag) of "settler" (een nieuwe settler
// verschijnt bij de stad — alleen mogelijk als er op dat moment geen settler
// actief is, zie `startNieuweSettler` hieronder, dus dit overschrijft nooit
// een bestaande).
export function verwerkCivielInAanbouw(state: GameState): GameState {
  const civielInAanbouw = state.stad.civielInAanbouw;
  if (!civielInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(civielInAanbouw.improvement, civielInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    const effect = civielInAanbouw.improvement.effect;
    const isSettler = effect.type === "settler";
    // Groei-tier (hoofdstuk 3/4/13/14, issue: "city improvements" Deel 2):
    // `naarGrootte` op het effect zelf bepaalt de nieuwe stadsgrootte —
    // WOONWIJK → "middel", GROTE_WOONWIJK → "groot" — in plaats van een
    // hardgecodeerde "middel" die de tweede groei-stap niet kon uitdrukken.
    const grootte = effect.type === "groei" ? (effect.naarGrootte as City["grootte"]) : state.stad.grootte;
    return {
      ...state,
      voorraad,
      stad: {
        ...state.stad,
        grootte,
        civielInAanbouw: undefined,
      },
      settler: isSettler ? { hoogte: 1, positieInLaag: STAD_POSITIE } : state.settler,
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      civielInAanbouw: { ...civielInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Koopt de resterende bouwtijd van de civiele wachtrij af met goud (hoofdstuk
// 5/14, issue: "toevoeging Goud" Deel 2) — alleen als er een Woonwijk
// (`soort: "city"`) loopt. Een Nieuwe settler (`soort: "unit"`) is bewust
// uitgesloten: rush-bouwen geldt uitsluitend voor land- en city-improvements,
// niet voor units.
export function versnelCivielMetGoud(state: GameState): GameState {
  const civielInAanbouw = state.stad.civielInAanbouw;
  if (!civielInAanbouw || civielInAanbouw.improvement.soort !== "city") return state;

  const resultaat = pasVersnellingToe(civielInAanbouw.improvement, civielInAanbouw.voortgang, state.voorraad.goud);
  if (!resultaat) return state;

  const voorraad = { ...state.voorraad, goud: state.voorraad.goud - resultaat.gouduitgegeven };

  if (resultaat.voltooid) {
    const effect = civielInAanbouw.improvement.effect;
    const grootte = effect.type === "groei" ? (effect.naarGrootte as City["grootte"]) : state.stad.grootte;
    return {
      ...state,
      voorraad,
      stad: { ...state.stad, grootte, civielInAanbouw: undefined },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      civielInAanbouw: { ...civielInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Betaalt de bouwkosten van een lopende Opslagplaats (hoofdstuk 3/5/13/14,
// issue: "stad stichten op de frontier" deel 2). Eigen wachtrij, los van
// `civielInAanbouw` — Opslagplaats is economisch, geen civiel improvement
// (hoofdstuk 3). Voltooiing verhoogt de gedeelde opslag-cap direct.
export function verwerkOpslagplaats(state: GameState): GameState {
  const opslagplaatsInAanbouw = state.stad.opslagplaatsInAanbouw;
  if (!opslagplaatsInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(opslagplaatsInAanbouw.improvement, opslagplaatsInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      opslagCap: state.opslagCap + (OPSLAGPLAATS.effect.waarde ?? 0),
      stad: { ...state.stad, opslagplaatsInAanbouw: undefined },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      opslagplaatsInAanbouw: { ...opslagplaatsInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Koopt de resterende bouwtijd van een lopende Opslagplaats af met goud
// (hoofdstuk 5/14, issue: "toevoeging Goud" Deel 2) — Opslagplaats is altijd
// een city improvement (hoofdstuk 3), dus geen `soort`-uitsluiting nodig zoals
// bij de civiele wachtrij hierboven.
export function versnelOpslagplaatsMetGoud(state: GameState): GameState {
  const opslagplaatsInAanbouw = state.stad.opslagplaatsInAanbouw;
  if (!opslagplaatsInAanbouw) return state;

  const resultaat = pasVersnellingToe(
    opslagplaatsInAanbouw.improvement,
    opslagplaatsInAanbouw.voortgang,
    state.voorraad.goud
  );
  if (!resultaat) return state;

  const voorraad = { ...state.voorraad, goud: state.voorraad.goud - resultaat.gouduitgegeven };

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      opslagCap: state.opslagCap + (OPSLAGPLAATS.effect.waarde ?? 0),
      stad: { ...state.stad, opslagplaatsInAanbouw: undefined },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      opslagplaatsInAanbouw: { ...opslagplaatsInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Volgorde van stadsgroottes, puur om `Improvement.stadsgrootteEis`
// (Barakken/Tempel: "middel", Grote Tempel: "groot") tegen de huidige
// stadsgrootte af te zetten (hoofdstuk 3/14, issue: "city improvements" Deel
// 3).
const STAD_GROOTTE_VOLGORDE: Record<City["grootte"], number> = { klein: 0, middel: 1, groot: 2 };

// Of `improvement` (één van BIBLIOTHEEK/MARKT/BARAKKEN/TEMPEL/GROTE_TEMPEL,
// improvements.ts: `CAPPED_CITY_IMPROVEMENTS`) op dit moment gestart mag
// worden (hoofdstuk 3/4/11/14, issue: "city improvements" Deel 1/3):
// hoogstens één tegelijk in de gedeelde wachtrij, niet al gebouwd (geen
// dubbele sloten van hetzelfde type — Tempel en Grote Tempel zijn wel losse
// improvements en tellen dus apart), de stadsgrootte-eis vervuld, en de
// city-improvement-cap nog niet vol.
export function kanCityVerbeteringBouwen(state: GameState, improvement: Improvement): boolean {
  if (state.stad.cityVerbeteringInAanbouw) return false;
  if (state.stad.cityImprovements.some((ci) => ci.id === improvement.id)) return false;
  if (state.stad.cityImprovements.length >= cityImprovementCap(state.stad.grootte)) return false;
  if (
    improvement.stadsgrootteEis &&
    STAD_GROOTTE_VOLGORDE[state.stad.grootte] < STAD_GROOTTE_VOLGORDE[improvement.stadsgrootteEis]
  ) {
    return false;
  }
  return true;
}

// Start het bouwen van een van de vijf gecapte city improvements (hoofdstuk
// 3/4/11/14, issue: "city improvements" Deel 1/3) — negeert de aanroep
// stilzwijgend bij een ongeldige aanroep (zelfde veilige-aanroep-conventie
// als `startBouw`).
export function startCityVerbetering(state: GameState, improvement: Improvement): GameState {
  if (!kanCityVerbeteringBouwen(state, improvement)) return state;

  return {
    ...state,
    stad: {
      ...state.stad,
      cityVerbeteringInAanbouw: { improvement, voortgang: { ...improvement.kosten } },
    },
  };
}

// Betaalt de bouwkosten van een lopende stadsverbetering (hoofdstuk 3/4/11/
// 14, issue: "city improvements" Deel 1/3) — zelfde wachtrij-patroon als
// `verwerkOpslagplaats` hierboven, maar voltooiing voegt het improvement toe
// aan `City.cityImprovements` (de cap-telling) in plaats van een los effect
// direct toe te passen: de productie-/legerwaarde-verwerking
// (`verwerkProductie`/`berekenLegerwaarde` e.a.) leest dat effect voortaan
// elke beurt rechtstreeks uit die array.
export function verwerkCityVerbetering(state: GameState): GameState {
  const inAanbouw = state.stad.cityVerbeteringInAanbouw;
  if (!inAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(inAanbouw.improvement, inAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      stad: {
        ...state.stad,
        cityImprovements: [...state.stad.cityImprovements, inAanbouw.improvement],
        cityVerbeteringInAanbouw: undefined,
      },
    };
  }

  return {
    ...state,
    voorraad,
    stad: { ...state.stad, cityVerbeteringInAanbouw: { ...inAanbouw, voortgang: resultaat.nieuweVoortgang } },
  };
}

// Koopt de resterende bouwtijd van een lopende stadsverbetering af met goud
// (hoofdstuk 5/14, issue: "toevoeging Goud" Deel 2) — altijd een city
// improvement, dus geen `soort`-uitsluiting nodig zoals bij de civiele
// wachtrij.
export function versnelCityVerbeteringMetGoud(state: GameState): GameState {
  const inAanbouw = state.stad.cityVerbeteringInAanbouw;
  if (!inAanbouw) return state;

  const resultaat = pasVersnellingToe(inAanbouw.improvement, inAanbouw.voortgang, state.voorraad.goud);
  if (!resultaat) return state;

  const voorraad = { ...state.voorraad, goud: state.voorraad.goud - resultaat.gouduitgegeven };

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      stad: {
        ...state.stad,
        cityImprovements: [...state.stad.cityImprovements, inAanbouw.improvement],
        cityVerbeteringInAanbouw: undefined,
      },
    };
  }

  return {
    ...state,
    voorraad,
    stad: { ...state.stad, cityVerbeteringInAanbouw: { ...inAanbouw, voortgang: resultaat.nieuweVoortgang } },
  };
}

// Betaalt de bouwkosten van een lopende Soldaat-rekrutering (M7). Zelfde
// wachtrij-patroon als verwerkGroei, los van de land-tile-bouwwachtrij omdat
// een unit geen land-vakje inneemt.
export function verwerkRecrutering(state: GameState): GameState {
  const legerInAanbouw = state.stad.legerInAanbouw;
  if (!legerInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(legerInAanbouw.improvement, legerInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    // Elke voltooide rekrutering levert één individuele strijder op (nieuwe
    // Wachttoren-functie, hoofdstuk 6) in plaats van alleen een opgetelde
    // legerwaarde — de speler moet 'm straks kunnen kiezen om een specifieke
    // Wachttoren te bemannen. Een oplopende teller volstaat als id, want
    // `strijders` groeit alleen (nooit verwijderd, zie `bemanWachttoren`).
    const nieuweStrijder: Strijder = { id: `strijder-${state.stad.strijders.length}` };
    return {
      ...state,
      voorraad,
      stad: {
        ...state.stad,
        strijders: [...state.stad.strijders, nieuweStrijder],
        legerInAanbouw: undefined,
      },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      legerInAanbouw: { ...legerInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Betaalt de bouwkosten van een lopende Verkenner-rekrutering (hoofdstuk 6,
// issue: "De Bezette Laag, missionaris en verkenner", Deel 3) — zelfde
// wachtrij-patroon als `verwerkRecrutering` hierboven, eigen wachtrij
// (`verkennerInAanbouw`) omdat een Verkenner een andere unit is dan Soldaat.
export function verwerkVerkennerRecrutering(state: GameState): GameState {
  const verkennerInAanbouw = state.stad.verkennerInAanbouw;
  if (!verkennerInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(verkennerInAanbouw.improvement, verkennerInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      stad: {
        ...state.stad,
        verkenners: [...state.stad.verkenners, { id: `verkenner-${state.stad.verkenners.length}` }],
        verkennerInAanbouw: undefined,
      },
    };
  }

  return {
    ...state,
    voorraad,
    stad: { ...state.stad, verkennerInAanbouw: { ...verkennerInAanbouw, voortgang: resultaat.nieuweVoortgang } },
  };
}

// Betaalt de bouwkosten van een lopende Missionaris-rekrutering (Deel 4) —
// zelfde patroon als `verwerkVerkennerRecrutering` hierboven.
export function verwerkMissionarisRecrutering(state: GameState): GameState {
  const missionarisInAanbouw = state.stad.missionarisInAanbouw;
  if (!missionarisInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(missionarisInAanbouw.improvement, missionarisInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      stad: {
        ...state.stad,
        missionarissen: [...state.stad.missionarissen, { id: `missionaris-${state.stad.missionarissen.length}` }],
        missionarisInAanbouw: undefined,
      },
    };
  }

  return {
    ...state,
    voorraad,
    stad: { ...state.stad, missionarisInAanbouw: { ...missionarisInAanbouw, voortgang: resultaat.nieuweVoortgang } },
  };
}

// Start de groei-tier klein→middel (M6), als de voedseldrempel gehaald is en
// er niet al een groei loopt. Dit is een bewuste spelerskeuze, geen
// automatische ontgrendeling zoals cultuur (M5) — hoofdstuk 11: "doorgroeien
// ... is een bewuste gok, geen gratis extra beloning". Voedsel wordt niet
// "uitgegeven": net als cultuur blijft het een oplopende teller die de
// drempel markeert (hoofdstuk 5).
// Groei-tier-improvement voor de huidige stadsgrootte (hoofdstuk 3/4/13/14,
// issue: "city improvements" Deel 2 — de tweede groei-stap, middel→groot,
// ontbrak nog volledig): WOONWIJK voor klein→middel, GROTE_WOONWIJK voor
// middel→groot. `undefined` op "groot" (geen derde tier in de MVP-scope).
function groeiTierImprovement(grootte: City["grootte"]): Improvement | undefined {
  if (grootte === "klein") return WOONWIJK;
  if (grootte === "middel") return GROTE_WOONWIJK;
  return undefined;
}

function groeiTierVoedselDrempel(grootte: City["grootte"]): number {
  return grootte === "klein" ? VOEDSEL_DREMPEL_GROEI : VOEDSEL_DREMPEL_GROEI_GROOT;
}

export function startGroei(state: GameState): GameState {
  const improvement = groeiTierImprovement(state.stad.grootte);
  if (!improvement || state.stad.civielInAanbouw || state.voedsel < groeiTierVoedselDrempel(state.stad.grootte)) {
    return state;
  }

  return {
    ...state,
    stad: {
      ...state.stad,
      civielInAanbouw: { improvement, voortgang: { ...improvement.kosten } },
    },
  };
}

// MVP: precies 1 stad per run (hoofdstuk 13, geen frontier-verplaatsing) —
// zelfde constante als `berekenHistorieStatistieken` (uitputtingEnVerval.ts)
// gebruikt. Zodra meerdere steden bestaan (post-MVP), wordt dit een echte
// telling.
const AANTAL_STEDEN_MVP = 1;

function aantalSettlers(state: GameState): number {
  return state.settler ? 1 : 0;
}

// Start het uitrusten van een nieuwe settler (hoofdstuk 3/11/13/16, issue:
// "stad stichten op de frontier" deel 4): een civiele keuze die concurreert
// met `startGroei` hierboven (zelfde `civielInAanbouw`-wachtrij, dus
// hoogstens één van de twee tegelijk). Alleen mogelijk zolang het huidige
// aantal settlers lager is dan het aantal steden — de speler begint met één
// settler, en pas een gestichte stad kan er weer één uitrusten (hoofdstuk
// 11: "maximaal één settler per gestichte stad" als natuurlijke rem op
// expansie). In de MVP (één stad) is dat dus alleen mogelijk vóórdat de
// eerste settler bestaat (vóór beurt 2, zie `volgendeBeurt`).
export function startNieuweSettler(state: GameState): GameState {
  if (state.stad.civielInAanbouw || aantalSettlers(state) >= AANTAL_STEDEN_MVP) {
    return state;
  }

  return {
    ...state,
    stad: {
      ...state.stad,
      civielInAanbouw: { improvement: NIEUWE_SETTLER, voortgang: { ...NIEUWE_SETTLER.kosten } },
    },
  };
}

// Start het bouwen van een Opslagplaats (hoofdstuk 3/5/13/14, issue: "stad
// stichten op de frontier" deel 2). Herhaalbaar (hoofdstuk 14: "praktisch
// maximum ~3-4 opslagplaatsen per stad") — geen bovengrens in code, alleen
// hoogstens één tegelijk in aanbouw, net als de overige wachtrijen hierboven.
export function startOpslagplaats(state: GameState): GameState {
  if (state.stad.opslagplaatsInAanbouw) return state;

  return {
    ...state,
    stad: {
      ...state.stad,
      opslagplaatsInAanbouw: { improvement: OPSLAGPLAATS, voortgang: { ...OPSLAGPLAATS.kosten } },
    },
  };
}

// Start het rekruteren van een Soldaat (M7), als er niet al een rekrutering
// loopt. Net als startGroei een bewuste spelerskeuze via een wachtrij, geen
// eigen valuta (hoofdstuk 5: "Militair heeft bewust géén eigen valuta: puur
// directe krachtsvergelijking op het moment zelf" — die krachtsvergelijking
// gebeurt in `confrontatie` (militair.ts), dit start alleen de opbouw
// ervan).
export function startRecrutering(state: GameState): GameState {
  if (state.stad.legerInAanbouw) return state;

  return {
    ...state,
    stad: {
      ...state.stad,
      legerInAanbouw: { improvement: SOLDAAT, voortgang: { ...SOLDAAT.kosten } },
    },
  };
}

// Start het rekruteren van een Verkenner (hoofdstuk 6, issue: "De Bezette
// Laag, missionaris en verkenner", Deel 3) — geen vereiste zoals het Offer
// Altaar bij Missionaris hieronder, altijd trainbaar zodra er niet al een
// Verkenner in opleiding is.
export function startVerkennerRecrutering(state: GameState): GameState {
  if (state.stad.verkennerInAanbouw) return state;

  return {
    ...state,
    stad: { ...state.stad, verkennerInAanbouw: { improvement: VERKENNER, voortgang: { ...VERKENNER.kosten } } },
  };
}

// Start het rekruteren van een Missionaris (Deel 4) — alleen mogelijk zodra
// er een voltooid Offer Altaar staat (`heeftOfferAltaar` in
// laagOntgrendeling.ts), net als de Missionaris-unit zelf tot nu toe nooit
// daadwerkelijk trainbaar was.
export function startMissionarisRecrutering(state: GameState): GameState {
  if (state.stad.missionarisInAanbouw || !heeftOfferAltaar(state)) return state;

  return {
    ...state,
    stad: { ...state.stad, missionarisInAanbouw: { improvement: MISSIONARIS, voortgang: { ...MISSIONARIS.kosten } } },
  };
}
