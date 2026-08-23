"use client";

import { campagneStatistieken, heeftOpgeslagenSpel, opgeslagenSpelStreek } from "@/game/save";

interface Campagne {
  // `undefined` voor de tutorial (zelfde betekenis als `GameState.campagneId`,
  // zie save.ts/initieleSpelStatus.ts) en voor de nog niet gebouwde campagnes
  // hieronder — die laatste zijn toch nooit klikbaar zolang `beschikbaar` op
  // `false` staat, dus een ontbrekende id is voor hen geen probleem.
  id?: string;
  naam: string;
  ondertitel: string;
  beschikbaar: boolean;
}

// Toekomstige campagnes (hoofdstuk 8/15 design-doc) — hier uitsluitend als
// uitgegrijsde, niet-klikbare aankondiging. Geen mechaniek/inhoud gebouwd
// voor deze campagnes: dat blijft buiten de MVP-scope (CLAUDE.md), dit is
// zuiver navigatie-UI.
//
// M20g (hoofdstuk 9/13/15/19): "Going West" staat nu op `beschikbaar: true` —
// de laatste blocker uit hoofdstuk 19 (intro-/oceaan-uitleg-tekst nog
// tutorial-specifiek) is opgelost met dezelfde campagne-bewuste
// placeholder-aanpak als de rest van Going West's content (M20f,
// `introContentVoorCampagne()`/`oceaanUitlegVoorCampagne()`, campagnes.ts).
// De drie Anker-verhalen blijven bewust nog open, los, doorlopend werk
// (hoofdstuk 15) — geen poort voor `beschikbaar: true`.
const CAMPAGNES: Campagne[] = [
  { naam: "To the Elusive Coast", ondertitel: "Tutorial", beschikbaar: true },
  { id: "going-west", naam: "Going West", ondertitel: "American Expansion", beschikbaar: true },
  { naam: "Through the Taiga", ondertitel: "Russian Expansion", beschikbaar: false },
  { naam: "Into the Footsteps of Alexander", ondertitel: "Grieks-Macedonische Veroveringen", beschikbaar: false },
];

interface CampagneSelectSchermProps {
  // M20d deelstap 3: vervangt de eerdere tutorial-specifieke `onKiesTutorial`
  // — `campagneId` is `undefined` voor de tutorial, anders de
  // `CampaignConfig.id` (zie campagnes.ts), zelfde betekenis als
  // `GameState.campagneId`.
  onKiesCampagne: (campagneId?: string) => void;
  // Issue: "een loading button per campagne op het campagne select screen,
  // waarmee je een eerdere save kunt inladen" — apart van `onKiesCampagne`
  // hierboven (dat altijd een verse run begint, zie useGameEngine.ts), en
  // alleen aangeroepen vanaf de Laden-knop hieronder, die alleen verschijnt
  // als er voor die campagne al een save bestaat.
  onLaadCampagne: (campagneId?: string) => void;
}

// Campagne-select-scherm (issue: "font en style" — na het beginscherm kiest
// de speler een campagne; in de MVP is alleen de tutorial speelbaar).
export default function CampagneSelectScherm({ onKiesCampagne, onLaadCampagne }: CampagneSelectSchermProps) {
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
            onClick={campagne.beschikbaar ? () => onKiesCampagne(campagne.id) : undefined}
            role={campagne.beschikbaar ? "button" : undefined}
            tabIndex={campagne.beschikbaar ? 0 : undefined}
            onKeyDown={
              campagne.beschikbaar
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") onKiesCampagne(campagne.id);
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
              {/* Issue: "voortgang verschillende campagnes tonen" — elke
                  campagne heeft nu haar eigen sleutel in `campagneStatistieken`
                  (save.ts, gesleuteld op `campagne.id`, `undefined` voor de
                  tutorial), dus het vinkje geldt per campagne in plaats van
                  uitsluitend de tutorial. */}
              {campagne.beschikbaar && campagneStatistieken(campagne.id).uitgespeeld > 0 && (
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
            {/* Issue: "hoevaak hij hem gestart heeft" — alleen bij beschikbare
                campagnes, net als het vinkje hierboven; een uitgegrijsde,
                nog niet klikbare campagne heeft nooit een run gestart. */}
            {campagne.beschikbaar && (
              <div style={{ color: "var(--kleur-tekst-gedempt)", marginTop: "0.25rem", fontSize: "0.8rem" }}>
                {campagneStatistieken(campagne.id).gestart}× gestart
              </div>
            )}
            {/* Issue: "loading button per campagne op het campagne select
                screen, waarmee je een eerdere save kunt inladen ... geeft
                aan op welke streek de save zich bevindt" — alleen zichtbaar
                als er voor déze campagne al een save bestaat. `stopPropagation`
                op zowel click als keydown: de omringende kaart heeft zelf al
                een klik-/toetsenbord-handler die een verse run start
                (`onKiesCampagne`), en die mag niet ook meelopen met deze knop. */}
            {campagne.beschikbaar && heeftOpgeslagenSpel(campagne.id) && (
              <button
                type="button"
                className="fc-knop"
                onClick={(event) => {
                  event.stopPropagation();
                  onLaadCampagne(campagne.id);
                }}
                onKeyDown={(event) => event.stopPropagation()}
                style={{ marginTop: "0.5rem", padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}
              >
                Laden — streek {opgeslagenSpelStreek(campagne.id)}
              </button>
            )}
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
