"use client";

import { AFSLUITENDE_SCENE, laagContent } from "@/game/tutorialContent";
import { TUTORIAL_LAAG_AANTAL, hoogsteOntgrendeldeLaag } from "@/game/world";
import { Layer } from "@/game/types";

interface LaagIntroPaneelProps {
  lagen: Layer[];
}

// Tutorial-content (M8, hoofdstuk 10): toont de naam van de huidige
// frontier-laag (de hoogst ontgrendelde), plus welk mechaniek deze laag in de
// vastgelegde volgorde introduceert. De flavor-tekst zelf staat uitsluitend
// in LaagPopup (issue: popup bij een nieuwe laag bevat laag/naam, wat er
// nieuw is én de flavor-tekst; dit blokje onderaan herhaalt alleen de laag en
// wat er nieuw is, zonder flavor-tekst). Zodra laag 12 ontgrendeld is, komt
// de afsluitende scène erbij (hoofdstuk 10: "Na laag 12: afsluitende
// scène"). Puur placeholder-styling — geen definitieve UI.
export default function LaagIntroPaneel({ lagen }: LaagIntroPaneelProps) {
  const hoogte = hoogsteOntgrendeldeLaag(lagen);
  const content = laagContent(hoogte);
  if (!content) return null;

  const isLaatsteLaag = hoogte === TUTORIAL_LAAG_AANTAL;

  return (
    <div
      className="fc-paneel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
        padding: "0.75rem 1rem",
        fontSize: "0.9rem",
        margin: "0.5rem",
      }}
    >
      <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
        Laag {hoogte} — {content.naam}
      </strong>
      <span style={{ fontStyle: "italic", color: "var(--kleur-tekst-gedempt)" }}>Nieuw: {content.mechaniek}</span>
      {isLaatsteLaag && <p style={{ margin: 0 }}>{AFSLUITENDE_SCENE}</p>}
    </div>
  );
}
