"use client";

import { INEENSTORTING_FLAVOR_TEKST, INEENSTORTING_TITEL } from "@/game/tutorialContent";

interface IneenstortingSchermProps {
  onDoorgaan: () => void;
  // Momentopname van de geëindigde run (zie economie.ts: `verwerkVerval`).
  // Optioneel omdat dit scherm ook zou moeten kunnen renderen zonder
  // statistieken (nooit in de praktijk, maar voorkomt een harde crash als
  // een oude save toevallig `laatsteIneenstorting` zonder statistieken bevat).
  statistieken?: {
    beurten: number;
    stedenGebouwd: number;
    hoogsteStreek: number;
  };
}

// Ineenstortingsscherm (issue: "intro en game over scherm"), getoond zodra de
// stad instort (M6, hoofdstuk 4). In de MVP (één stad, geen
// frontier-verplaatsing) is dit een echt game-over: de run eindigt en de
// tutorial herstart vanaf het begin (issue: "run eindigen wanneer stad
// uitgeput is", hoofdstuk 4/11). Blokkeert de rest van de UI tot de speler
// bevestigt, net als het introscherm.
export default function IneenstortingScherm({ onDoorgaan, statistieken }: IneenstortingSchermProps) {
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
        src="/assets/scenes/game-over.jpg"
        alt=""
        style={{
          width: "100%",
          maxWidth: "720px",
          height: "auto",
          display: "block",
          border: "3px solid var(--kleur-roest)",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.55)",
        }}
      />
      <div className="fc-paneel" style={{ textAlign: "center", maxWidth: "540px", padding: "1.25rem 1.5rem" }}>
        <h1 style={{ margin: "0 0 1rem", fontSize: "1.6rem", color: "var(--kleur-roest-licht)" }}>
          {INEENSTORTING_TITEL}
        </h1>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{INEENSTORTING_FLAVOR_TEKST}</p>

        {statistieken && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1.5rem",
              margin: "1rem 0 0",
              fontSize: "0.9rem",
              flexWrap: "wrap",
            }}
          >
            <span>Beurten gespeeld: {statistieken.beurten}</span>
            <span>Steden gebouwd: {statistieken.stedenGebouwd}</span>
            <span>Hoogste streek bereikt: {statistieken.hoogsteStreek}</span>
          </div>
        )}

        <p style={{ margin: "1rem 0 0", fontSize: "0.85rem", color: "var(--kleur-tekst-gedempt)" }}>
          Deze run is voorbij. Het Hertenpad-volk begint opnieuw bij de rivier.
        </p>
      </div>
      <button className="fc-knop" onClick={onDoorgaan} style={{ padding: "0.6rem 1.5rem", fontSize: "1rem" }}>
        Opnieuw beginnen
      </button>
    </div>
  );
}
