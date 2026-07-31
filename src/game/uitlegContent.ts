// Uitleg-pop-ups (issue: "meer uitleg"): los van de laag-mechaniek-popups
// (tutorialContent.ts, LaagPopup) krijgt de speler in de eerste paar beurten
// van de tutorial een korte, directe uitleg over de basisbegrippen —
// grondstoffen en improvements: wat ze zijn, hoe je ze bouwt en waar ze voor
// dienen. Na de laatste uitleg-beurt volgt één afsluitende pop-up die
// aangeeft dat de speler vanaf dan zonder uitleg verder speelt. Dit is
// puur verklarende UI-content, geen nieuw spelmechaniek (blijft binnen de
// MVP-scope uit CLAUDE.md).

export interface UitlegContent {
  titel: string;
  tekst: string;
}

const BEURT_UITLEG: Record<number, UitlegContent> = {
  1: {
    titel: "Improvements bouwen",
    tekst:
      "Elke beurt kies je eerst een categorie, dan één concrete improvement uit twee of drie opties. Bouwen kost grondstoffen en een aantal beurten voordat hij klaar is. Daarna wijs je zelf een leeg vakje aan om hem neer te zetten.",
  },
  2: {
    titel: "Grondstoffen",
    tekst:
      "Onderaan het scherm staat de voorraad van het Hertenpad-volk: hout, steen en erts om mee te bouwen, voedsel om te groeien, cultuur om nieuwe grond te ontgrendelen. Alles wat je bouwt, kost een deel van die voorraad.",
  },
  3: {
    titel: "Waar improvements voor dienen",
    tekst:
      "Land-improvements op de vakjes rond de stad leveren elke beurt grondstoffen, voedsel of cultuur op, zolang de grond niet uitgeput raakt. Improvements in de stad zelf werken anders: zij geven de stad blijvende voordelen.",
  },
};

const LAATSTE_INHOUDELIJKE_UITLEG_BEURT = Math.max(...Object.keys(BEURT_UITLEG).map(Number));

// De beurt direct na de laatste inhoudelijke uitleg: één losse afsluitende
// pop-up in plaats van nieuwe uitleg (issue: "daarna laatste pop-up dat de
// speler nu meer vrijgelaten wordt").
export const AFSLUITENDE_UITLEG_BEURT = LAATSTE_INHOUDELIJKE_UITLEG_BEURT + 1;

const UITLEG_AFSLUITING: UitlegContent = {
  titel: "Verder op eigen kracht",
  tekst:
    "De grondstoffen en de improvements zijn nu bekend. Vanaf hier komt er geen uitleg meer bij elke beurt — het Hertenpad-volk trekt verder, op eigen inzicht.",
};

export function uitlegContent(beurt: number): UitlegContent | undefined {
  if (beurt === AFSLUITENDE_UITLEG_BEURT) return UITLEG_AFSLUITING;
  return BEURT_UITLEG[beurt];
}
