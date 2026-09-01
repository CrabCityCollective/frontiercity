"use client";

import { SETTLER_ACTIES_UITLEG_TEKST, SETTLER_ACTIES_UITLEG_TITEL } from "@/game/tutorialContent";

interface SettlerActiesUitlegPopupProps {
  onDoorgaan: () => void;
}

// Settler-acties-uitleg-pop-up (issue: "meer uitleg"), getoond zodra de settler
// in beurt 2 verschijnt — zelfde blokkerende overlay als de andere
// uitleg-pop-ups (SettlerUitlegPopup, WachttorenOveralUitlegPopup, ...).
export default function SettlerActiesUitlegPopup({ onDoorgaan }: SettlerActiesUitlegPopupProps) {
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
          maxHeight: "85vh",
          overflowY: "auto",
          textAlign: "center",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {SETTLER_ACTIES_UITLEG_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{SETTLER_ACTIES_UITLEG_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
