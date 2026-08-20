// Groei & stadswachtrijen (M6/M7, hoofdstuk 11): zodra voedsel de
// groeidrempel haalt kan de speler bewust de groei-tier klein→middel(→groot)
// starten (geen automatische ontgrendeling zoals cultuur, hoofdstuk 11), die
// net als een land-improvement een aantal beurten rijptijd kost. Dezelfde
// civiele wachtrij (`civielInAanbouw`) dient ook een nieuwe settler
// (hoofdstuk 3/11/13/16) — hoogstens één van de twee tegelijk. Opslagplaats
// (hoofdstuk 3/5/13/14), de vijf gecapte city improvements (Bibliotheek/
// Markt/Barakken/Tempel/Grote Tempel, hoofdstuk 3/4/11/14), de Soldaat-/
// Verkenner-/Missionaris-rekrutering (M7, hoofdstuk 6) en de tweede-settler-
// wachtrij (issue: "Altijd 2e settler" #236) volgen elk hun eigen, verder
// losstaande wachtrij, maar hergebruiken dezelfde
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
import {
  STAD_POSITIE,
  VOEDSEL_DREMPEL_GROEI,
  VOEDSEL_DREMPEL_GROEI_GROOT,
  hoogsteOntgrendeldeStreek,
} from "./world";
import { investeerInBouwkosten, pasVersnellingToe } from "./bouwwachtrij";
import { heeftOfferAltaar } from "./streekOntgrendeling";
import { metActieveStad } from "./stad";

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
      ...metActieveStad(state, { ...state.stad, grootte, civielInAanbouw: undefined }),
      voorraad,
      settler: isSettler ? { hoogte: 1, positieInStreek: STAD_POSITIE } : state.settler,
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, civielInAanbouw: { ...civielInAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
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
      ...metActieveStad(state, { ...state.stad, grootte, civielInAanbouw: undefined }),
      voorraad,
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, civielInAanbouw: { ...civielInAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
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
      ...metActieveStad(state, { ...state.stad, opslagplaatsInAanbouw: undefined }),
      voorraad,
      opslagCap: state.opslagCap + (OPSLAGPLAATS.effect.waarde ?? 0),
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, opslagplaatsInAanbouw: { ...opslagplaatsInAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
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
      ...metActieveStad(state, { ...state.stad, opslagplaatsInAanbouw: undefined }),
      voorraad,
      opslagCap: state.opslagCap + (OPSLAGPLAATS.effect.waarde ?? 0),
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, opslagplaatsInAanbouw: { ...opslagplaatsInAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
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

  return metActieveStad(state, {
    ...state.stad,
    cityVerbeteringInAanbouw: { improvement, voortgang: { ...improvement.kosten } },
  });
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
      ...metActieveStad(state, {
        ...state.stad,
        cityImprovements: [...state.stad.cityImprovements, inAanbouw.improvement],
        cityVerbeteringInAanbouw: undefined,
      }),
      voorraad,
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, cityVerbeteringInAanbouw: { ...inAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
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
      ...metActieveStad(state, {
        ...state.stad,
        cityImprovements: [...state.stad.cityImprovements, inAanbouw.improvement],
        cityVerbeteringInAanbouw: undefined,
      }),
      voorraad,
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, cityVerbeteringInAanbouw: { ...inAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
  };
}

// Volgend vrij Strijder-id (issue: "soms lukt wachttoren bemannen niet meer"):
// `strijders` groeit ánders dan hierboven ooit aangenomen niet altijd alleen
// maar — een verloren Confrontatie tegen een Bezette Streek en een
// Wachttoren-overrompeling door indringers (zie militair.ts/
// indringersEnDieren.ts) verwijderen allebei de bemannende strijder uit deze
// lijst. Een id gebaseerd op `strijders.length` botst dan: na het verlies van
// bv. `strijder-1` (lijst wordt `[strijder-0, strijder-2]`, lengte 2) kreeg de
// eerstvolgende rekrutering weer id `strijder-2` — hetzelfde id als de
// strijder die al een andere Wachttoren bemant. De `.find` in `bemanWachttoren`
// vond dan die bestaande, al-bemande strijder eerst en weigerde stilzwijgend
// (`strijder.wachttoren` was al gezet), ook al leek de net opgeleide strijder
// in de UI nog vrij. Baseer het nieuwe id daarom op het hoogste al uitgegeven
// nummer in de huidige lijst i.p.v. op de lijstlengte — dat botst nooit met
// een nog aanwezige (en dus mogelijk bemande) strijder.
function volgendeStrijderId(strijders: Strijder[]): string {
  let hoogsteNummer = -1;
  for (const strijder of strijders) {
    const match = /^strijder-(\d+)$/.exec(strijder.id);
    if (match) hoogsteNummer = Math.max(hoogsteNummer, Number(match[1]));
  }
  return `strijder-${hoogsteNummer + 1}`;
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
    // Wachttoren te bemannen. Id via `volgendeStrijderId` hierboven, niet via
    // de lijstlengte — die botst zodra een strijder onderweg verwijderd is.
    const nieuweStrijder: Strijder = { id: volgendeStrijderId(state.stad.strijders) };
    return {
      ...metActieveStad(state, { ...state.stad, strijders: [...state.stad.strijders, nieuweStrijder], legerInAanbouw: undefined }),
      voorraad,
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, legerInAanbouw: { ...legerInAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
  };
}

// Betaalt de bouwkosten van een lopende Verkenner-rekrutering (hoofdstuk 6,
// issue: "De Bezette Streek, missionaris en verkenner", Deel 3) — zelfde
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
      ...metActieveStad(state, {
        ...state.stad,
        verkenners: [...state.stad.verkenners, { id: `verkenner-${state.stad.verkenners.length}` }],
        verkennerInAanbouw: undefined,
      }),
      voorraad,
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, verkennerInAanbouw: { ...verkennerInAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
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
      ...metActieveStad(state, {
        ...state.stad,
        missionarissen: [...state.stad.missionarissen, { id: `missionaris-${state.stad.missionarissen.length}` }],
        missionarisInAanbouw: undefined,
      }),
      voorraad,
    };
  }

  return {
    ...metActieveStad(state, { ...state.stad, missionarisInAanbouw: { ...missionarisInAanbouw, voortgang: resultaat.nieuweVoortgang } }),
    voorraad,
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

  return metActieveStad(state, {
    ...state.stad,
    civielInAanbouw: { improvement, voortgang: { ...improvement.kosten } },
  });
}

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
// expansie). `state.steden.length` is in de MVP altijd 1 (geen frontier-
// verplaatsing/tweede stad, zie hoofdstuk 13), dus dat is in de praktijk nog
// steeds alleen mogelijk vóórdat de eerste settler bestaat (vóór beurt 2,
// zie `volgendeBeurt`) — maar leest voortaan al de echte telling.
export function startNieuweSettler(state: GameState): GameState {
  if (state.stad.civielInAanbouw || aantalSettlers(state) >= state.steden.length) {
    return state;
  }

  return metActieveStad(state, {
    ...state.stad,
    civielInAanbouw: { improvement: NIEUWE_SETTLER, voortgang: { ...NIEUWE_SETTLER.kosten } },
  });
}

// Vanaf welke streek de tweede settler beschikbaar komt (issue: "Altijd 2e
// settler" #236, GitHub-issue 236) — pas gekozen nadat "gewoon permanent
// vanaf het begin" te makkelijk bleek: de ontwerper wilde dat heen-en-weer-
// lopen voor jacht/wachttoren-herbouw op eerdere streken eerst écht
// irritant wordt voordat de tweede settler die last wegneemt.
const TWEEDE_SETTLER_MIN_STREEK = 7;

// Of de tweede-settler-wachtrij nu gestart mag worden (hoofdstuk 11/13/16,
// issue #236): pas vanaf `TWEEDE_SETTLER_MIN_STREEK`, niet terwijl er al een
// tweede settler bestaat of er al één in aanbouw is. Bewust los van
// `state.stad.civielInAanbouw`/`aantalSettlers` hierboven — dit is, anders
// dan de eerste settler, een eigen wachtrij die onbeperkt herhaalbaar is
// zodra de vorige tweede settler verbruikt (stad stichten) of verloren
// (roofdier) is.
export function kanTweedeSettlerBouwen(state: GameState): boolean {
  return (
    !state.stad.tweedeSettlerInAanbouw &&
    !state.tweedeSettler &&
    hoogsteOntgrendeldeStreek(state.streken) >= TWEEDE_SETTLER_MIN_STREEK
  );
}

// Start de tweede-settler-wachtrij (issue #236) — zelfde kosten/bouwtijd als
// de eerste settler (`NIEUWE_SETTLER`), maar in `City.tweedeSettlerInAanbouw`
// in plaats van de gedeelde `civielInAanbouw`-wachtrij, dus onafhankelijk van
// groei/de eerste settler te starten.
export function startTweedeSettler(state: GameState): GameState {
  if (!kanTweedeSettlerBouwen(state)) return state;

  return metActieveStad(state, {
    ...state.stad,
    tweedeSettlerInAanbouw: { improvement: NIEUWE_SETTLER, voortgang: { ...NIEUWE_SETTLER.kosten } },
  });
}

// Betaalt de bouwkosten van een lopende tweede-settler-bouw (issue #236) —
// zelfde wachtrij-patroon als `verwerkCivielInAanbouw` hierboven, maar
// levert altijd een settler op (nooit groei) en schrijft naar
// `state.tweedeSettler` in plaats van `state.settler`.
export function verwerkTweedeSettlerInAanbouw(state: GameState): GameState {
  const tweedeSettlerInAanbouw = state.stad.tweedeSettlerInAanbouw;
  if (!tweedeSettlerInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(tweedeSettlerInAanbouw.improvement, tweedeSettlerInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...metActieveStad(state, { ...state.stad, tweedeSettlerInAanbouw: undefined }),
      voorraad,
      tweedeSettler: { hoogte: 1, positieInStreek: STAD_POSITIE },
    };
  }

  return {
    ...metActieveStad(state, {
      ...state.stad,
      tweedeSettlerInAanbouw: { ...tweedeSettlerInAanbouw, voortgang: resultaat.nieuweVoortgang },
    }),
    voorraad,
  };
}

// Start het bouwen van een Opslagplaats (hoofdstuk 3/5/13/14, issue: "stad
// stichten op de frontier" deel 2). Herhaalbaar (hoofdstuk 14: "praktisch
// maximum ~3-4 opslagplaatsen per stad") — geen bovengrens in code, alleen
// hoogstens één tegelijk in aanbouw, net als de overige wachtrijen hierboven.
export function startOpslagplaats(state: GameState): GameState {
  if (state.stad.opslagplaatsInAanbouw) return state;

  return metActieveStad(state, {
    ...state.stad,
    opslagplaatsInAanbouw: { improvement: OPSLAGPLAATS, voortgang: { ...OPSLAGPLAATS.kosten } },
  });
}

// Start het rekruteren van een Soldaat (M7), als er niet al een rekrutering
// loopt. Net als startGroei een bewuste spelerskeuze via een wachtrij, geen
// eigen valuta (hoofdstuk 5: "Militair heeft bewust géén eigen valuta: puur
// directe krachtsvergelijking op het moment zelf" — die krachtsvergelijking
// gebeurt in `confrontatie` (militair.ts), dit start alleen de opbouw
// ervan).
export function startRecrutering(state: GameState): GameState {
  if (state.stad.legerInAanbouw) return state;

  return metActieveStad(state, {
    ...state.stad,
    legerInAanbouw: { improvement: SOLDAAT, voortgang: { ...SOLDAAT.kosten } },
  });
}

// Start het rekruteren van een Verkenner (hoofdstuk 6, issue: "De Bezette
// Streek, missionaris en verkenner", Deel 3) — geen vereiste zoals het Offer
// Altaar bij Missionaris hieronder, altijd trainbaar zodra er niet al een
// Verkenner in opleiding is.
export function startVerkennerRecrutering(state: GameState): GameState {
  if (state.stad.verkennerInAanbouw) return state;

  return metActieveStad(state, { ...state.stad, verkennerInAanbouw: { improvement: VERKENNER, voortgang: { ...VERKENNER.kosten } } });
}

// Start het rekruteren van een Missionaris (Deel 4) — alleen mogelijk zodra
// er een voltooid Offer Altaar staat (`heeftOfferAltaar` in
// streekOntgrendeling.ts), net als de Missionaris-unit zelf tot nu toe nooit
// daadwerkelijk trainbaar was.
export function startMissionarisRecrutering(state: GameState): GameState {
  if (state.stad.missionarisInAanbouw || !heeftOfferAltaar(state)) return state;

  return metActieveStad(state, { ...state.stad, missionarisInAanbouw: { improvement: MISSIONARIS, voortgang: { ...MISSIONARIS.kosten } } });
}
