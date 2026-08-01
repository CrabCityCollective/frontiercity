"use client";

import { STRIJDER_BEMAN_TEKST, STRIJDER_BEMAN_TITEL } from "@/game/tutorialContent";

interface StrijderBemanPopupProps {
  onKiesWachttoren: () => void;
  onAnnuleren: () => void;
}

// Strijder-bemannen-pop-up (nieuwe Wachttoren-functie, hoofdstuk 6): eerste
// stap van het bemannings-flow — de speler klikte op een nog niet
// toegewezen strijder-icoontje in MilitairPaneel. "Kies een wachttoren"
// sluit deze pop-up en zet GameRoot in de wachttoren-kies-modus (zie
// WachttorenKiesBanner) — daarna bemant een klik op een actieve Wachttoren-
// tile op de kaart die strijder.
export default function StrijderBemanPopup({ onKiesWachttoren, onAnnuleren }: StrijderBemanPopupProps) {
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
          {STRIJDER_BEMAN_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{STRIJDER_BEMAN_TEKST}</p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button className="fc-knop" onClick={onKiesWachttoren} style={{ padding: "0.5rem 1.5rem" }}>
            Kies een wachttoren
          </button>
          <button className="fc-knop" onClick={onAnnuleren} style={{ padding: "0.5rem 1.5rem" }}>
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
