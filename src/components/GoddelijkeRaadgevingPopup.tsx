"use client";

import { GODDELIJKE_RAADGEVING_TEKST, GODDELIJKE_RAADGEVING_TITEL } from "@/game/tutorialContent";

interface GoddelijkeRaadgevingPopupProps {
  onDoorgaan: () => void;
}

// Goddelijke-raadgeving-pop-up (issue: "tutorial popups wijzigen"), getoond
// zodra streek 3 ontgrendelt (zie GameRoot: `toonGoddelijkeRaadgevingPopup`) —
// dit is het moment waarop Wetenschappelijk/de Sterrencirkel voor het eerst
// beschikbaar komt. Zelfde blokkerende overlay als de andere uitleg-pop-ups.
export default function GoddelijkeRaadgevingPopup({ onDoorgaan }: GoddelijkeRaadgevingPopupProps) {
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
          {GODDELIJKE_RAADGEVING_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{GODDELIJKE_RAADGEVING_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
