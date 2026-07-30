"use client";

import { AFSLUITENDE_SCENE, laagContent } from "@/game/tutorialContent";
import { TUTORIAL_LAAG_AANTAL, hoogsteOntgrendeldeLaag } from "@/game/world";
import { Layer } from "@/game/types";

interface LaagIntroPaneelProps {
  lagen: Layer[];
}

// Tutorial-content (M8, hoofdstuk 10): toont de naam en flavor-tekst van de
// huidige frontier-laag (de hoogst ontgrendelde), plus welk mechaniek deze
// laag in de vastgelegde volgorde introduceert. Zodra laag 12 ontgrendeld is,
// komt de afsluitende scène erbij (hoofdstuk 10: "Na laag 12: afsluitende
// scène"). Puur placeholder-styling — geen definitieve UI.
export default function LaagIntroPaneel({ lagen }: LaagIntroPaneelProps) {
  const hoogte = hoogsteOntgrendeldeLaag(lagen);
  const content = laagContent(hoogte);
  if (!content) return null;

  const isLaatsteLaag = hoogte === TUTORIAL_LAAG_AANTAL;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
        padding: "0.75rem 1rem",
        background: "#241a12",
        color: "#e8dcc8",
        fontFamily: "sans-serif",
        fontSize: "0.9rem",
        borderBottom: "1px solid #3a2f22",
      }}
    >
      <strong>
        Laag {hoogte} — {content.naam}
      </strong>
      <span style={{ fontStyle: "italic", color: "#b7a888" }}>Nieuw: {content.mechaniek}</span>
      <p style={{ margin: 0 }}>{content.flavorTekst}</p>
      {isLaatsteLaag && <p style={{ margin: 0 }}>{AFSLUITENDE_SCENE}</p>}
    </div>
  );
}
