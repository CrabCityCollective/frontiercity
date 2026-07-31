"use client";

import { heeftTutorialVoltooid } from "@/game/save";

interface Campagne {
  naam: string;
  ondertitel: string;
  beschikbaar: boolean;
}

// Toekomstige campagnes (hoofdstuk 8/15 design-doc) — hier uitsluitend als
// uitgegrijsde, niet-klikbare aankondiging. Geen mechaniek/inhoud gebouwd
// voor deze campagnes: dat blijft buiten de MVP-scope (CLAUDE.md), dit is
// zuiver navigatie-UI.
const CAMPAGNES: Campagne[] = [
  { naam: "De Eerste Vuren", ondertitel: "Het Hertenpad-volk — Tutorial", beschikbaar: true },
  { naam: "Going West", ondertitel: "American Expansion", beschikbaar: false },
  { naam: "Through the Taiga", ondertitel: "Russian Expansion", beschikbaar: false },
  { naam: "Into the Footsteps of Alexander", ondertitel: "Grieks-Macedonische Veroveringen", beschikbaar: false },
];

interface CampagneSelectSchermProps {
  onKiesTutorial: () => void;
}

// Campagne-select-scherm (issue: "font en style" — na het beginscherm kiest
// de speler een campagne; in de MVP is alleen de tutorial speelbaar).
export default function CampagneSelectScherm({ onKiesTutorial }: CampagneSelectSchermProps) {
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
        overflowY: "auto",
        background: "var(--kleur-aarde-diepst)",
        zIndex: 150,
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.8rem", color: "var(--kleur-oker)" }}>Kies een campagne</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "min(28rem, 100%)",
        }}
      >
        {CAMPAGNES.map((campagne) => (
          <div
            key={campagne.naam}
            className="fc-paneel"
            onClick={campagne.beschikbaar ? onKiesTutorial : undefined}
            role={campagne.beschikbaar ? "button" : undefined}
            tabIndex={campagne.beschikbaar ? 0 : undefined}
            onKeyDown={
              campagne.beschikbaar
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") onKiesTutorial();
                  }
                : undefined
            }
            style={{
              padding: "1rem 1.25rem",
              cursor: campagne.beschikbaar ? "pointer" : "not-allowed",
              filter: campagne.beschikbaar ? undefined : "grayscale(0.75) brightness(0.65)",
            }}
          >
            <strong className="fc-heading" style={{ fontSize: "1.1rem" }}>
              {campagne.naam}
              {campagne.beschikbaar && heeftTutorialVoltooid() && (
                <span
                  aria-label="Voltooid"
                  title="Voltooid — nog altijd opnieuw te spelen"
                  style={{ marginLeft: "0.5rem", color: "var(--kleur-mos)" }}
                >
                  ✓
                </span>
              )}
            </strong>
            <div style={{ color: "var(--kleur-tekst-gedempt)", marginTop: "0.25rem" }}>
              {campagne.ondertitel}
            </div>
            {!campagne.beschikbaar && (
              <div
                className="fc-heading"
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                  color: "var(--kleur-roest-licht)",
                }}
              >
                Binnenkort beschikbaar
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
