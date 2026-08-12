"use client";

import { WACHTTOREN_OVERAL_UITLEG_TEKST, WACHTTOREN_OVERAL_UITLEG_TITEL } from "@/game/tutorialContent";

interface WachttorenOveralUitlegPopupProps {
  onDoorgaan: () => void;
}

// Wachttoren-overal-uitleg-pop-up (issue: "meer uitleg", trigger verschoven
// van streek 2 naar 3 door "Tweede streek boerderij"), getoond zodra streek 3
// voor het eerst ontgrendelt — zelfde blokkerende overlay als de andere
// uitleg-pop-ups (VijandAanDeHorizonPopup, SettlerUitlegPopup, ...).
export default function WachttorenOveralUitlegPopup({ onDoorgaan }: WachttorenOveralUitlegPopupProps) {
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
          {WACHTTOREN_OVERAL_UITLEG_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{WACHTTOREN_OVERAL_UITLEG_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
