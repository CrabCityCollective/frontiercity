"use client";

import { VIJAND_AAN_DE_HORIZON_TEKST, VIJAND_AAN_DE_HORIZON_TITEL } from "@/game/tutorialContent";

interface VijandAanDeHorizonPopupProps {
  onDoorgaan: () => void;
}

// De-vijand-aan-de-horizon-pop-up (issue: "tutorial popups wijzigen", trigger
// verschoven van streek 2 naar 3 door "Tweede streek boerderij"), getoond
// zodra streek 3 ontgrendelt (zie GameRoot: `toonVijandAanDeHorizonPopup`) —
// dit is het moment waarop Militair/de Wachttoren en Economisch/de Mijn voor
// het eerst beschikbaar komen. Zelfde blokkerende overlay als de andere
// uitleg-pop-ups.
export default function VijandAanDeHorizonPopup({ onDoorgaan }: VijandAanDeHorizonPopupProps) {
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
          {VIJAND_AAN_DE_HORIZON_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{VIJAND_AAN_DE_HORIZON_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
