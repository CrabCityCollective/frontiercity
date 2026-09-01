"use client";

import { GrafischeStijl } from "@/game/save";

interface SpelInstellingenPopupProps {
  uitlegAan: boolean;
  onToggleUitleg: () => void;
  stijl: GrafischeStijl;
  onToggleStijl: () => void;
  onSluiten: () => void;
}

// In-spel instellingen-pop-up, bereikbaar via de "Instellingen"-knop in het
// hoofdmenu (issue: "Settings uitbreiden" — "een settings button in het
// menu, waarmee je de uitleg aan en uit kunt zetten" + "on the fly kunnen
// wisselen tussen pixel art en vector art"). Anders dan InstellingenPopup
// (bereikbaar vóór het spel, zet de globale standaard voor nieuwe potjes)
// werken beide toggels hier meteen door op de lopende run: de uitleg-toggle
// is dezelfde per-run-instelling die voorheen een losse knop in HoofdMenu
// was, en de grafische-stijl-toggle geeft `stijl` aan GameRoot terug zodat
// GameCanvas onmiddellijk herteken — niet pas bij de volgende (her)start van
// het scherm.
export default function SpelInstellingenPopup({
  uitlegAan,
  onToggleUitleg,
  stijl,
  onToggleStijl,
  onSluiten,
}: SpelInstellingenPopupProps) {
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
          <input type="checkbox" checked={uitlegAan} onChange={onToggleUitleg} />
          Uitleg pop-ups aan (deze run)
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
          <input type="checkbox" checked={stijl === "pixel-art"} onChange={onToggleStijl} />
          Pixel-art grafische stijl (i.p.v. geschilderd)
        </label>
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}
