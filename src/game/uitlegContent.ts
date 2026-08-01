// Uitleg-pop-ups (issue: "meer uitleg"): los van de laag-mechaniek-popups
// (tutorialContent.ts, LaagPopup) krijgt de speler in de eerste paar beurten
// van de tutorial een korte, directe uitleg over de basisbegrippen —
// grondstoffen en improvements: wat ze zijn, hoe je ze bouwt en waar ze voor
// dienen. Er komt bewust géén afsluitende "voortaan zonder uitleg verder"-
// pop-up meer (issue: "pop-up dat je op je eigen houtje verder moet, mag
// weg") — na deze beurten volgt namelijk nog gerichte uitleg (settler,
// militair) op het moment dat die mechaniek in beeld komt. Dit is puur
// verklarende UI-content, geen nieuw spelmechaniek (blijft binnen de
// MVP-scope uit CLAUDE.md).

export interface UitlegContent {
  titel: string;
  tekst: string;
}

const BEURT_UITLEG: Record<number, UitlegContent> = {
  1: {
    titel: "Improvements bouwen",
    tekst:
      "Om de drie beurten kies je eerst een categorie, dan één concrete improvement uit twee of drie opties. Bouwen kost grondstoffen en een aantal beurten voordat hij klaar is. Daarna wijs je zelf een leeg vakje aan om hem neer te zetten.",
  },
  2: {
    titel: "Grondstoffen",
    tekst:
      "Onderaan het scherm staat de voorraad van het Hertenpad-volk: hout, steen en erts om mee te bouwen, voedsel om te groeien, cultuur om nieuwe grond te ontgrendelen. Alles wat je bouwt, kost een deel van die voorraad.",
  },
  3: {
    titel: "Waar improvements voor dienen",
    tekst:
      "Land-improvements op de vakjes rond de stad leveren elke beurt grondstoffen, voedsel of cultuur op, zolang de grond niet uitgeput raakt. Improvements in de stad zelf werken anders: zij geven de stad blijvende voordelen. Niet elk vakje is hetzelfde: houtkap kan alleen op bos, een mijn alleen op heuvel of berg, en een boerderij alleen op vlakke grond.",
  },
};

// De laatste beurt met inhoudelijke uitleg: GameRoot gebruikt dit als
// bovengrens voor de uitleg-pop-up-reeks.
export const LAATSTE_UITLEG_BEURT = Math.max(...Object.keys(BEURT_UITLEG).map(Number));

export function uitlegContent(beurt: number): UitlegContent | undefined {
  return BEURT_UITLEG[beurt];
}
