"use client";

import { streekContent } from "@/game/tutorialContent";

interface StreekPopupProps {
  hoogte: number;
  onDoorgaan: () => void;
}

// Streek-popup (issue: "als je naar een nieuwe streek gaat, een popup vóór het
// bouwcategorie-schermpje"): toont de streek-naam/nummer, wat er nieuw te
// bouwen is én de flavor-tekst. De flavor-tekst staat uitsluitend hier — het
// blokje onderaan (StreekIntroPaneel) herhaalt alleen de streek en wat er nieuw
// is, zonder flavor-tekst. Blokkeert net als IntroScherm de rest van de UI
// tot de speler doorklikt.
export default function StreekPopup({ hoogte, onDoorgaan }: StreekPopupProps) {
  const content = streekContent(hoogte);
  if (!content) return null;

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
          Streek {hoogte} — {content.naam}
        </strong>
        <span style={{ fontStyle: "italic", color: "var(--kleur-tekst-gedempt)" }}>Nieuw: {content.mechaniek}</span>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{content.flavorTekst}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Doorgaan
        </button>
      </div>
    </div>
  );
}
