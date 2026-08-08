"use client";

import { VOEDSEL_WAARSCHUWING_TEKST, VOEDSEL_WAARSCHUWING_TITEL } from "@/game/tutorialContent";

interface VoedselWaarschuwingPopupProps {
  beurtenResterend?: number;
  onDoorgaan: () => void;
}

// Voedselwaarschuwing-pop-up (issue: "dat mag in een aparte pop-up, die hoeft
// pas te komen als de dreiging van te weinig voedsel 5 beurten ver weg is"),
// getoond zodra de stad voor het eerst "kritiek" wordt (zie GameRoot) — zelfde
// blokkerende overlay als MilitairUitlegPopup/StreekPopup.
export default function VoedselWaarschuwingPopup({ beurtenResterend, onDoorgaan }: VoedselWaarschuwingPopupProps) {
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
          {VOEDSEL_WAARSCHUWING_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{VOEDSEL_WAARSCHUWING_TEKST}</p>
        {beurtenResterend !== undefined && (
          <p style={{ margin: 0, fontWeight: "bold", color: "var(--kleur-gevaar)" }}>
            Nog {beurtenResterend} beurten.
          </p>
        )}
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
