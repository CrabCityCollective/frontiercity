"use client";

import {
  VIJANDELIJK_HEILIGDOM_ONTHULD_TEKST,
  VIJANDELIJK_HEILIGDOM_ONTHULD_TITEL,
  VIJANDELIJK_HEILIGDOM_VERNIETIGD_TEKST,
  VIJANDELIJK_HEILIGDOM_VERNIETIGD_TITEL,
} from "@/game/tutorialContent";

interface VijandelijkHeiligdomPopupProps {
  fase: "onthuld" | "vernietigd";
  onSluiten: () => void;
}

// Vijandelijk-Heiligdom-pop-up (hoofdstuk 6, issue: "De Bezette Streek,
// missionaris en verkenner", Deel 4): meldt zowel het onthullen van een
// vijandelijk Heiligdom (via Verkenning) als het vernietigen ervan (via de
// belegeringsmeter) — twee losse momenten van dezelfde dreiging, zelfde
// `fase`-patroon als RoofdierPopup. Zuiver een melding, geen keuze.
export default function VijandelijkHeiligdomPopup({ fase, onSluiten }: VijandelijkHeiligdomPopupProps) {
  const titel = fase === "onthuld" ? VIJANDELIJK_HEILIGDOM_ONTHULD_TITEL : VIJANDELIJK_HEILIGDOM_VERNIETIGD_TITEL;
  const tekst = fase === "onthuld" ? VIJANDELIJK_HEILIGDOM_ONTHULD_TEKST : VIJANDELIJK_HEILIGDOM_VERNIETIGD_TEKST;

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
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
