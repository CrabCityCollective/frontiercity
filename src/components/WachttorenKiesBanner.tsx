"use client";

interface WachttorenKiesBannerProps {
  onAnnuleren: () => void;
}

// Niet-blokkerende banner (hoofdstuk 6): getoond zodra de speler in het
// militaire paneel op een nog niet toegewezen strijder klikt om hem aan een
// Legerkamp toe te wijzen, of Verkenning start, terwijl hij een vakje op de
// kaart moet aanklikken. Anders dan de overige pop-ups blokkeert dit niet het
// hele scherm — de speler moet de kaart juist kunnen zien om een geldig
// doelvakje aan te klikken (zie GameRoot: `handleTileClick`). Wachttoren-
// bemannen gebruikt deze banner sinds issue "wachttorens bemannen" niet meer
// — dat loopt via een klik op de wachttoren-tile zelf. Deze banner biedt
// alleen de Annuleren-knop, nodig omdat de speler anders vast kan komen te
// zitten in de kies-modus als er geen geldig doelvakje beschikbaar is.
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
      <button className="fc-knop" onClick={onAnnuleren} style={{ padding: "0.3rem 0.6rem" }}>
        Annuleren
      </button>
    </div>
  );
}
