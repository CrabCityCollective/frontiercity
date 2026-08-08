"use client";

import { AFSLUITENDE_SCENE, streekContent } from "@/game/tutorialContent";
import { TUTORIAL_STREEK_AANTAL, hoogsteOntgrendeldeStreek } from "@/game/world";
import { Streek } from "@/game/types";

interface StreekIntroPaneelProps {
  streken: Streek[];
}

// Tutorial-content (M8, hoofdstuk 10): toont de naam van de huidige
// frontier-streek (de hoogst ontgrendelde), plus welk mechaniek deze streek in de
// vastgelegde volgorde introduceert. De flavor-tekst zelf staat uitsluitend
// in StreekPopup (issue: popup bij een nieuwe streek bevat streek/naam, wat er
// nieuw is én de flavor-tekst; dit blokje onderaan herhaalt alleen de streek en
// wat er nieuw is, zonder flavor-tekst). Zodra de laatste streek ontgrendeld is
// (de oceaan aan de overkant), komt de afsluitende scène erbij (hoofdstuk 10:
// "Na de laatste streek: afsluitende scène"). Puur placeholder-styling — geen
// definitieve UI.
export default function StreekIntroPaneel({ streken }: StreekIntroPaneelProps) {
  const hoogte = hoogsteOntgrendeldeStreek(streken);
  const content = streekContent(hoogte);
  if (!content) return null;

  const isLaatsteStreek = hoogte === TUTORIAL_STREEK_AANTAL;

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
        Streek {hoogte} — {content.naam}
      </strong>
      <span style={{ fontStyle: "italic", color: "var(--kleur-tekst-gedempt)" }}>Nieuw: {content.mechaniek}</span>
      {isLaatsteStreek && <p style={{ margin: 0 }}>{AFSLUITENDE_SCENE}</p>}
    </div>
  );
}
