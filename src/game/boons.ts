// Boon-systeem (M24-voorstel, issue #411 → beantwoord en gebouwd in issue
// #414): bij elke niet-afsluitende stichting binnen het herhalende
// drie-stichtingsmomenten-patroon (hoofdstuk 9 Deel 2 van het hoofddocument)
// een random, permanente, run-brede Boon toekennen — maar alleen als de
// zojuist verlaten stad `grootte === "groot"` had bereikt. Zie
// campaigns/going-west/ontwerp.md ("Boon-systeem") voor het volledige
// voorstel; de vier daar genoemde open ontwerpvragen zijn in issue #414
// beantwoord:
// 1. Trekking zonder terugleggen — een al bezeten Boon-id valt uit de pool
//    voor een volgende trekking, zie `trekBoon` hieronder.
// 2. Boons zijn run-breed opgeslagen (`GameState.boons`, niet `City.relics`
//    zoals het nooit-uitgebouwde relic-concept) en overleven dus een latere
//    stad-ineenstorting, zolang de run zelf doorgaat.
// 3. Niet Going-West-exclusief (anders dan onrust.ts): generiek voor elke
//    campagne, behalve de tutorial — zie `komtInAanmerkingVoorBoon`.
// 4. De pop-up-plek zit in de `toonBoonPopup`-gating in GameRoot.tsx, direct
//    ná `toonStichtingsMomentPopup` en vóór elke andere pop-up.
//
// De inhoud van de individuele Boons (welke mechanische bonussen, hoeveel)
// is uitgewerkt in issue #428: de eerste echte Boon, "Voorraadschuur van de
// Voorvaderen". Zolang de pool nog maar dit ene lid heeft, krijgt de speler
// 'm in de praktijk altijd — dat is opzettelijk (issue #428: "geeft niet, we
// gaan er nog veel meer Boons bij maken"), niet een bug in `trekBoon`.
import { GameState } from "./types";

export interface Boon {
  id: string;
  naam: string;
  beschrijving: string;
}

// Opslagcap-bonus van "Voorraadschuur van de Voorvaderen" (issue #428):
// bovenop andere opslag-verhogende bronnen (Opslagplaats-improvement, Weven/
// Aardewerk-tech, zie OPSLAGPLAATS in improvements.ts resp. `kiesTech` in
// tech.ts) — en de speler krijgt bij toekenning meteen zoveel van elke
// gedeelde-opslag-grondstof (`MateriaalType`, types.ts) erbij.
export const VOORRAADSCHUUR_OPSLAG_BONUS = 15;

export const BOON_POOL: Boon[] = [
  {
    id: "voorraadschuur-van-de-voorvaderen",
    naam: "Voorraadschuur van de Voorvaderen",
    beschrijving: `+${VOORRAADSCHUUR_OPSLAG_BONUS} opslagcapaciteit, bovenop je andere opslag-verhogende improvements — en je hout, steen, erts en goud vullen meteen met evenveel aan.`,
  },
];

// Of de stad die de speler net verlaat (`state.stad`, gelezen vóórdat
// `stichtStad` haar vervangt door de nieuwe stad) kans geeft op een Boon:
// elke niet-afsluitende stichting, mits die stad "groot" was (issue #411) —
// en niet in de tutorial (issue #414, vraag 3), zelfde tutorial-uitzondering
// als `toonStichtingsMomentPopup` in GameRoot.tsx.
export function komtInAanmerkingVoorBoon(state: GameState, isAfsluitendeStichting: boolean): boolean {
  return !isAfsluitendeStichting && state.campagneId !== undefined && state.stad.grootte === "groot";
}

// Trekt een willekeurige, nog niet bezeten Boon uit de pool (issue #414,
// vraag 1: trekking zonder terugleggen). `undefined` als de speler
// inmiddels alle Boons uit de pool al heeft.
export function trekBoon(gehad: string[], random: () => number = Math.random): Boon | undefined {
  const beschikbaar = BOON_POOL.filter((boon) => !gehad.includes(boon.id));
  if (beschikbaar.length === 0) return undefined;
  return beschikbaar[Math.floor(random() * beschikbaar.length)];
}

export function boonMetId(id: string): Boon | undefined {
  return BOON_POOL.find((boon) => boon.id === id);
}

// Sluit de Boon-toekenningsmelding — puur een UI-bevestiging, zelfde patroon
// als `sluitGoudOntdektMelding` (streekOntgrendeling.ts).
export function sluitBoonMelding(state: GameState): GameState {
  return { ...state, boonToegekendEvent: undefined };
}

// Past het mechanische effect van een zojuist toegekende Boon toe (issue
// #428) — losstaand van `trekBoon` aangeroepen, direct bij toekenning, zelfde
// volgorde-conventie als het kiezen van Weven/Aardewerk in `kiesTech`
// (tech.ts): het effect verwerkt zich meteen, niet pas bij het wegklikken van
// de pop-up. Onbekende/toekomstige Boon-ids zonder mechanisch effect laten de
// state ongewijzigd.
export function pasBoonEffectToe(state: GameState, boonId: string): GameState {
  if (boonId === "voorraadschuur-van-de-voorvaderen") {
    const opslagCap = state.opslagCap + VOORRAADSCHUUR_OPSLAG_BONUS;
    return {
      ...state,
      opslagCap,
      voorraad: {
        hout: Math.min(opslagCap, state.voorraad.hout + VOORRAADSCHUUR_OPSLAG_BONUS),
        steen: Math.min(opslagCap, state.voorraad.steen + VOORRAADSCHUUR_OPSLAG_BONUS),
        erts: Math.min(opslagCap, state.voorraad.erts + VOORRAADSCHUUR_OPSLAG_BONUS),
        goud: Math.min(opslagCap, state.voorraad.goud + VOORRAADSCHUUR_OPSLAG_BONUS),
      },
    };
  }
  return state;
}
