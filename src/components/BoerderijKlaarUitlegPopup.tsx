"use client";

import { BOERDERIJ_KLAAR_TEKST, BOERDERIJ_KLAAR_TITEL } from "@/game/tutorialContent";

interface BoerderijKlaarUitlegPopupProps {
  onDoorgaan: () => void;
}

// Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"),
// getoond zodra er voor het eerst een actieve, wegverbonden boerderij
// meeproduceert (zie economie.ts `heeftWerkendeBoerderij`) — zelfde
// blokkerende overlay als de andere uitleg-pop-ups.
export default function BoerderijKlaarUitlegPopup({ onDoorgaan }: BoerderijKlaarUitlegPopupProps) {
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
          {BOERDERIJ_KLAAR_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{BOERDERIJ_KLAAR_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
