"use client";

import { STRIJDERS_OPLEIDEN_TEKST, STRIJDERS_OPLEIDEN_TITEL } from "@/game/tutorialContent";

interface StrijdersOpleidenPopupProps {
  onDoorgaan: () => void;
}

// Strijders-opleiden-uitleg-pop-up (issue: "pop-ups wijzigen"), getoond zodra
// er voor het eerst een gebouwde mijn staat (zie economie.ts
// `heeftGebouwdeMijn`) — zelfde blokkerende overlay als de andere
// uitleg-pop-ups.
export default function StrijdersOpleidenPopup({ onDoorgaan }: StrijdersOpleidenPopupProps) {
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
          {STRIJDERS_OPLEIDEN_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{STRIJDERS_OPLEIDEN_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
