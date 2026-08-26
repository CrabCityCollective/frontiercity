"use client";

interface HoofdNavigatieSchermProps {
  onCampagnes: () => void;
  onInstellingen: () => void;
  // Encyclopedie-knop (issue: "Boekwerk met uitleg" — "toegankelijk via
  // button in het hoofdmenu van het spel, onder campagnes en instellingen"):
  // zelfde overlay-patroon als `onInstellingen` hierboven (zie AppRoot).
  onEncyclopedie: () => void;
}

// Navigatie-scherm ná het titelscherm (issue: "een nieuw scherm waarin je
// kunt kiezen tussen Campagnes en Instellingen") — puur navigatie-UI, geen
// spelstatus. "Campagnes" gaat naar het bestaande CampagneSelectScherm,
// "Instellingen"/"Encyclopedie" openen hun pop-up als overlay boven dit
// scherm (zie AppRoot).
export default function HoofdNavigatieScherm({ onCampagnes, onInstellingen, onEncyclopedie }: HoofdNavigatieSchermProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "1.5rem",
        background: "var(--kleur-aarde-diepst)",
        zIndex: 150,
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.8rem", color: "var(--kleur-oker)" }}>Frontier City</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "min(20rem, 100%)" }}>
        <button className="fc-knop" onClick={onCampagnes} style={{ padding: "0.75rem 1rem", fontSize: "1rem" }}>
          Campagnes
        </button>
        <button className="fc-knop" onClick={onInstellingen} style={{ padding: "0.75rem 1rem", fontSize: "1rem" }}>
          Instellingen
        </button>
        <button className="fc-knop" onClick={onEncyclopedie} style={{ padding: "0.75rem 1rem", fontSize: "1rem" }}>
          Encyclopedie
        </button>
      </div>
    </div>
  );
}
