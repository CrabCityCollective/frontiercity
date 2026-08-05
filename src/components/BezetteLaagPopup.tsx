"use client";

import { BEZETTE_LAAG_TEKST, BEZETTE_LAAG_TITEL } from "@/game/tutorialContent";

interface BezetteLaagPopupProps {
  onDoorgaan: () => void;
}

// Bezette-Laag-uitleg-pop-up (hoofdstuk 6, issue: "De Bezette Laag,
// missionaris en verkenner", Deel 2): verschijnt zodra laag 12 "in beeld
// komt" (economie.ts: `verwerkLaagOntgrendeling` zet `bezetteLaagOntdektEvent`
// — dezelfde soort trigger als de gegarandeerde Amberader-vondst op laag 7).
// Zelfde blokkerende overlay/stijl als de overige dynamische pop-ups
// (IndringersPopup/KuddePopup) — vervangt de eerdere, kleinere
// MilitairUitlegPopup volledig.
export default function BezetteLaagPopup({ onDoorgaan }: BezetteLaagPopupProps) {
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
          {BEZETTE_LAAG_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{BEZETTE_LAAG_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
