"use client";

import { MOEDERLANDEN } from "@/game/boons";
import { MoederlandId } from "@/game/types";

interface MoederlandKeuzePopupProps {
  onKiesMoederland: (moederlandId: MoederlandId) => void;
}

// Moederland-keuze-pop-up van "Zegeningen van het Moederland" (issue #540):
// verschijnt direct nadat de speler de Boon-toekenningsmelding (`GoudOntdektPopup`
// via `toonBoonPopup`, GameRoot.tsx) heeft weggeklikt. Zelfde blokkerende vorm
// als `TechKeuzePopup` — geen "sluiten"-knop, de speler moet een moederland
// kiezen voordat het spel doorgaat.
export default function MoederlandKeuzePopup({ onKiesMoederland }: MoederlandKeuzePopupProps) {
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
          maxWidth: "34rem",
          maxHeight: "85vh",
          overflowY: "auto",
          textAlign: "center",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          Zegeningen van het Moederland — kies een moederland
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Elke 10 beurten stuurt je gekozen moederland een lading van zijn eigen grondstof. Deze keuze staat voor de
          rest van de tocht vast.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
          {MOEDERLANDEN.map((moederland) => (
            <button
              key={moederland.id}
              className="fc-knop"
              onClick={() => onKiesMoederland(moederland.id)}
              style={{ padding: "0.6rem 1rem", maxWidth: "15rem", textAlign: "left" }}
            >
              <strong style={{ display: "block" }}>{moederland.naam}</strong>
              <span style={{ display: "block", fontSize: "0.8rem", color: "var(--kleur-tekst-gedempt)" }}>
                {moederland.grondstof}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
