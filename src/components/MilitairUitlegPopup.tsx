"use client";

import { MILITAIR_UITLEG_TEKST, MILITAIR_UITLEG_TITEL } from "@/game/tutorialContent";

interface MilitairUitlegPopupProps {
  onDoorgaan: () => void;
}

// Militaire-uitleg-pop-up (issue: "pop-up met uitleg hoe je de militaire
// confrontatie moet aanpakken"), getoond direct na de laag-pop-up van laag 12
// — zelfde blokkerende overlay als LaagPopup/UitlegPopup.
export default function MilitairUitlegPopup({ onDoorgaan }: MilitairUitlegPopupProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 8, 6, 0.72)",
        padding: "1rem",
        zIndex: 20,
      }}
    >
      <div
        className="fc-paneel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          maxWidth: "32rem",
          textAlign: "center",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {MILITAIR_UITLEG_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{MILITAIR_UITLEG_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
