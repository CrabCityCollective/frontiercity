"use client";

import { VOEDSEL_BALANS_UITLEG_TEKST, VOEDSEL_BALANS_UITLEG_TITEL } from "@/game/tutorialContent";

interface VoedselBalansUitlegPopupProps {
  onDoorgaan: () => void;
}

// Voedsel-balans-uitleg-pop-up (issue: "meer uitleg"), getoond zodra streek 4
// voor het eerst ontgrendelt — zelfde blokkerende overlay als de andere
// uitleg-pop-ups (BoerderijKlaarUitlegPopup, VoedselWaarschuwingPopup, ...).
export default function VoedselBalansUitlegPopup({ onDoorgaan }: VoedselBalansUitlegPopupProps) {
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
          {VOEDSEL_BALANS_UITLEG_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{VOEDSEL_BALANS_UITLEG_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
