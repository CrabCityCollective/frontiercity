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
// is bewust nog niet uitgewerkt (zie ontwerp.md: "dit voorstel gaat
// uitsluitend over het framework") — dat volgt in losse vervolgissues. De
// pool hieronder is daarom bewust minimaal: genoeg om het framework
// (opslag/trekking/timing/pop-up) end-to-end te kunnen testen en spelen,
// zonder al een mechanisch effect toe te kennen.
import { GameState } from "./types";

export interface Boon {
  id: string;
  naam: string;
  beschrijving: string;
}

export const BOON_POOL: Boon[] = [
  {
    id: "reizigers-instinct",
    naam: "Reizigers instinct",
    beschrijving: "Wat je hier leerde, vergeet je niet. (Mechanisch effect volgt in een vervolgissue.)",
  },
  {
    id: "voorraad-op-de-kar",
    naam: "Voorraad op de kar",
    beschrijving: "Wat overbleef, laat je niet achter. (Mechanisch effect volgt in een vervolgissue.)",
  },
  {
    id: "oude-route",
    naam: "De oude route",
    beschrijving: "Je kent deze grond nu. (Mechanisch effect volgt in een vervolgissue.)",
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
