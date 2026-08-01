"use client";

import { useState } from "react";
import { standaardUitlegAan, zetStandaardUitleg } from "@/game/save";

interface InstellingenPopupProps {
  onSluiten: () => void;
}

// Instellingen-pop-up (issue: "een extra scherm ... waarin je kunt kiezen
// tussen Campagnes en Instellingen. Als je op Instellingen klikt, dan krijg
// je een popup waarin je standaard voor alle nieuwe potjes de uitleg
// pop-ups aan en uit kunt zetten"). Zet uitsluitend de globale standaard
// (save.ts: `standaardUitlegAan`) — de per-run toggle in het hoofdmenu
// tijdens het spelen zelf is een los, tijdelijk overschrijven daarvan.
export default function InstellingenPopup({ onSluiten }: InstellingenPopupProps) {
  const [uitlegAan, setUitlegAan] = useState(standaardUitlegAan);

  function toggle() {
    const nieuweWaarde = !uitlegAan;
    setUitlegAan(nieuweWaarde);
    zetStandaardUitleg(nieuweWaarde);
  }

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
        zIndex: 200,
      }}
    >
      <div
        className="fc-paneel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          maxWidth: "26rem",
          textAlign: "center",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          Instellingen
        </strong>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            cursor: "pointer",
          }}
        >
          <input type="checkbox" checked={uitlegAan} onChange={toggle} />
          Uitleg pop-ups standaard aan voor nieuwe potjes
        </label>
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}
