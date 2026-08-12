"use client";

interface BouwUitlegPopupProps {
  titel: string;
  tekst: string;
  onDoorgaan: () => void;
}

// Generieke bouw-pop-up-uitleg (issue: "Teksten aanpassen (nog meer)"):
// vervangt, voor precies één beurt, de gewone bouw-pop-up door een korte
// uitleg — gebruikt voor Heiligdom/Niet-bouwen (streek 1) en Boerderij/
// Houtkap (streek 2), zie GameRoot: `bouwPopupWeergaveNummer`. Zelfde
// blokkerende overlay als de andere eenmalige uitleg-pop-ups (SettlerUitlegPopup,
// VijandAanDeHorizonPopup, ...) — alleen titel/tekst wisselen per aanroeper.
export default function BouwUitlegPopup({ titel, tekst, onDoorgaan }: BouwUitlegPopupProps) {
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
          {titel}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{tekst}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
