"use client";

import { uitlegContent } from "@/game/uitlegContent";

interface UitlegPopupProps {
  beurt: number;
  onDoorgaan: () => void;
}

// Uitleg-pop-up (issue: "meer uitleg"): blokkerende pop-up in de eerste paar
// tutorial-beurten die de basisbegrippen grondstoffen/improvements uitlegt,
// los van de laag-mechaniek-uitleg in LaagPopup. Zelfde overlay-patroon als
// LaagPopup — blokkeert de bouw-pop-up tot de speler doorklikt.
export default function UitlegPopup({ beurt, onDoorgaan }: UitlegPopupProps) {
  const content = uitlegContent(beurt);
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
          {content.titel}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{content.tekst}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
