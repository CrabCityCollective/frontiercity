"use client";

import { OCEAAN_UITLEG_TEKST, OCEAAN_UITLEG_TITEL } from "@/game/tutorialContent";

interface OceaanUitlegPopupProps {
  onDoorgaan: () => void;
}

// Oceaan-uitleg-pop-up (issue: "tutorial laatste stad aan oceaan"), getoond
// direct na de laag-pop-up van de laatste laag — zelfde blokkerende overlay
// als LaagPopup/MilitairUitlegPopup.
export default function OceaanUitlegPopup({ onDoorgaan }: OceaanUitlegPopupProps) {
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
          {OCEAAN_UITLEG_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{OCEAAN_UITLEG_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
