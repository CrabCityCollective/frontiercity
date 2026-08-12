// Openings-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"): één vaste
// pop-up bij het begin van beurt 1, die de speler net genoeg vertelt om op
// weg te helpen (grondstoffen, bouw-ritme, de voorraadbalk, eerst de
// houtkap). De verdere uitleg (settler, voedsel, boerderij, militair) komt
// niet meer op een vast beurtnummer, maar dynamisch zodra het bijbehorende
// spelmechanisme zijn intrede doet — zie SettlerUitlegPopup,
// VoedselWaarschuwingPopup, BoerderijKlaarUitlegPopup en MilitairUitlegPopup.
// Alle uitleg-pop-ups samen zijn via het hoofdmenu aan/uit te zetten (zie
// GameState.uitlegPopupsAan) — puur verklarende UI-content, geen nieuw
// spelmechanisme (blijft binnen de MVP-scope uit CLAUDE.md).

export const OPENINGS_UITLEG_TITEL = "Bouwmaterialen";
export const OPENINGS_UITLEG_TEKST =
  "De materialen om onze stam op te bouwen zijn schaars. Onderin het scherm zie je je voorraad: hout, steen en erts. Bouw eerst een Steengroeve om Steen ver verzamelen.";
