"use client";

import { useState } from "react";
import { grafischeStijl, standaardUitlegAan, zetGrafischeStijl, zetStandaardUitleg } from "@/game/save";

interface InstellingenPopupProps {
  onSluiten: () => void;
}

// Instellingen-pop-up (issue: "een extra scherm ... waarin je kunt kiezen
// tussen Campagnes en Instellingen. Als je op Instellingen klikt, dan krijg
// je een popup waarin je standaard voor alle nieuwe potjes de uitleg
// pop-ups aan en uit kunt zetten"). Zet uitsluitend de globale standaard
// (save.ts: `standaardUitlegAan`) voor nieuwe tutorial-runs — de per-run
// toggle in het hoofdmenu tijdens het spelen zelf is een los, tijdelijk
// overschrijven daarvan. Going West negeert deze instelling bewust en start
// altijd met uitleg uit (issue: "Uitleg pop-ups standaard uit"), zie
// initieleSpelStatus.ts.
export default function InstellingenPopup({ onSluiten }: InstellingenPopupProps) {
  const [uitlegAan, setUitlegAan] = useState(standaardUitlegAan);
  // Grafische stijl (issue: "pixel art style placeholders i.p.v. vector
  // style ... nog heen en weer kunnen schakelen"): zet direct de globale
  // instelling (save.ts: `grafischeStijl`) — GameCanvas leest die bij elke
  // (her)start van een scherm, dus de nieuwe stijl geldt meteen voor de
  // eerstvolgende keer dat de kaart getekend wordt.
  const [stijl, setStijl] = useState(grafischeStijl);

  function toggle() {
    const nieuweWaarde = !uitlegAan;
    setUitlegAan(nieuweWaarde);
    zetStandaardUitleg(nieuweWaarde);
  }

  function toggleStijl() {
    const nieuweStijl = stijl === "vector" ? "pixel-art" : "vector";
    setStijl(nieuweStijl);
    zetGrafischeStijl(nieuweStijl);
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
          maxHeight: "85vh",
          overflowY: "auto",
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
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            cursor: "pointer",
          }}
        >
          <input type="checkbox" checked={stijl === "pixel-art"} onChange={toggleStijl} />
          Pixel-art grafische stijl (i.p.v. geschilderd)
        </label>
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}
