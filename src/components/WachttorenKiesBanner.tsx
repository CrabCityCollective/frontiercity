"use client";

interface WachttorenKiesBannerProps {
  onAnnuleren: () => void;
}

// Niet-blokkerende banner (nieuwe Wachttoren-functie, hoofdstuk 6): getoond
// terwijl de speler, na "Kies een wachttoren" in StrijderBemanPopup, een
// vakje op de kaart moet aanklikken. Anders dan de overige pop-ups blokkeert
// dit niet het hele scherm — de speler moet de kaart juist kunnen zien om
// een wachttoren aan te klikken (zie GameRoot: `handleTileClick`).
export default function WachttorenKiesBanner({ onAnnuleren }: WachttorenKiesBannerProps) {
  return (
    <div
      className="fc-paneel"
      style={{
        position: "fixed",
        top: "0.75rem",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 0.9rem",
        zIndex: 40,
      }}
    >
      <span>Klik op een gemarkeerde, nog onbemande wachttoren op de kaart om de strijder te bemannen.</span>
      <button className="fc-knop" onClick={onAnnuleren} style={{ padding: "0.3rem 0.6rem" }}>
        Annuleren
      </button>
    </div>
  );
}
