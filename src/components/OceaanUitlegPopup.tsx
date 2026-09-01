"use client";

import { oceaanUitlegVoorCampagne } from "@/game/campagnes";

interface OceaanUitlegPopupProps {
  onDoorgaan: () => void;
  // Campagne-bewuste titel/tekst (hoofdstuk 19 design-doc, blocker 1) —
  // `undefined` voor de tutorial, net als `GameState.campagneId`.
  campagneId?: string;
}

// Oceaan-uitleg-pop-up (issue: "tutorial laatste stad aan oceaan"), getoond
// direct na de streek-pop-up van de laatste streek — zelfde blokkerende overlay
// als StreekPopup/MilitairUitlegPopup.
export default function OceaanUitlegPopup({ onDoorgaan, campagneId }: OceaanUitlegPopupProps) {
  const { titel, tekst } = oceaanUitlegVoorCampagne(campagneId);
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
          {titel}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{tekst}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
