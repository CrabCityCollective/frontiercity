"use client";

import { ROOFDIER_INTRO_TEKST, ROOFDIER_INTRO_TITEL } from "@/game/tutorialContent";

interface RoofdierIntroPopupProps {
  onDoorgaan: () => void;
}

// Roofdier-intro-pop-up (hoofdstuk 14/17, issue: "Eerste streek geen
// roofdieren"), getoond zodra streek `ROOFDIER_MIN_STREEK` (world.ts)
// voor het eerst ontgrendelt — zie GameRoot: `toonRoofdierIntroPopup`.
// Zelfde blokkerende overlay en eenmalige-confirm-vorm als de andere
// streek-introductie-pop-ups (VijandAanDeHorizonPopup, GoddelijkeRaadgevingPopup).
export default function RoofdierIntroPopup({ onDoorgaan }: RoofdierIntroPopupProps) {
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
        <strong className="fc-heading" style={{ color: "var(--kleur-gevaar)" }}>
          {ROOFDIER_INTRO_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{ROOFDIER_INTRO_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
