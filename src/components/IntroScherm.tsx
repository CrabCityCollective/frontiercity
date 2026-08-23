"use client";

import { introContentVoorCampagne } from "@/game/campagnes";
import { CampagneStatistieken } from "@/game/save";

interface IntroSchermProps {
  onBeginnen: () => void;
  // Voortgangstellers voor de campagne die net gestart wordt (issue:
  // "voortgang verschillende campagnes tonen" — "dat alles mag op het
  // campagne intro scherm worden getoond"), zie GameRoot: `campagneStats`.
  statistieken: CampagneStatistieken;
  // Campagne-bewuste titel/subtitel/flavor-tekst (hoofdstuk 19 design-doc,
  // blocker 1) — `undefined` voor de tutorial, net als `GameState.campagneId`.
  campagneId?: string;
}

// Introscherm (issue: "intro en game over scherm"), getoond vóór de speler
// iets van de tutorial ziet: sfeerbeeld + flavor-tekst uit hoofdstuk 10, in de
// Riven/Myst-stijl van hoofdstuk 12/13. Blokkeert de rest van de UI tot de
// speler bevestigt — dat gebeurt bij elke start van de tutorial opnieuw (zie
// GameRoot: `toonIntro`), niet slechts één keer per browser (issue: "als ik
// de tutorial aanklik vanuit het menu, zie ik het introscherm niet meer").
export default function IntroScherm({ onBeginnen, statistieken, campagneId }: IntroSchermProps) {
  const { titel, subtitel, flavorTekst } = introContentVoorCampagne(campagneId);
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
        background: "var(--kleur-aarde-diepst)",
        color: "var(--kleur-tekst)",
        padding: "1.5rem",
        zIndex: 100,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/scenes/intro.jpg"
        alt=""
        style={{
          width: "100%",
          maxWidth: "720px",
          height: "auto",
          display: "block",
          border: "3px solid var(--kleur-oker)",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.55)",
        }}
      />
      <div className="fc-paneel" style={{ textAlign: "center", maxWidth: "540px", padding: "1.25rem 1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.6rem", color: "var(--kleur-oker)" }}>{titel}</h1>
        <p style={{ margin: "0 0 1rem", fontStyle: "italic", color: "var(--kleur-tekst-gedempt)" }}>{subtitel}</p>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{flavorTekst}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            margin: "1rem 0 0",
            fontSize: "0.9rem",
            flexWrap: "wrap",
            color: "var(--kleur-tekst-gedempt)",
          }}
        >
          <span>Gestart: {statistieken.gestart}×</span>
          <span>Game over gezien: {statistieken.gameOverGezien}×</span>
          <span>Uitgespeeld: {statistieken.uitgespeeld}×</span>
        </div>
      </div>
      <button className="fc-knop" onClick={onBeginnen} style={{ padding: "0.6rem 1.5rem", fontSize: "1rem" }}>
        Beginnen
      </button>
    </div>
  );
}
