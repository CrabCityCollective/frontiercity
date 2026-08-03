"use client";

import { AMBER_ONTDEKKING_TEKST, AMBER_ONTDEKKING_TITEL } from "@/game/tutorialContent";

interface AmberOntdektPopupProps {
  onSluiten: () => void;
}

// Amberader-ontdekkingspop-up (hoofdstuk 3/14, issue: "toevoeging Goud"):
// verschijnt zodra `verwerkLaagOntgrendeling` (economie.ts) de gegarandeerde
// eerste Amberader-locatie ontgrendelt — zelfde blokkerende meldings-frame en
// stijl als KuddePopup, zonder keuze: de speler klikt 'm gewoon weg.
export default function AmberOntdektPopup({ onSluiten }: AmberOntdektPopupProps) {
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
          {AMBER_ONTDEKKING_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{AMBER_ONTDEKKING_TEKST}</p>
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
