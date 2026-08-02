"use client";

import {
  ROOFDIER_AANVAL_TEKST,
  ROOFDIER_AANVAL_TITEL,
  ROOFDIER_VERSCHENEN_TEKST,
  ROOFDIER_VERSCHENEN_TITEL,
} from "@/game/tutorialContent";
import { RoofdierEvent } from "@/game/types";

interface RoofdierPopupProps {
  event: RoofdierEvent;
  onSluiten: () => void;
}

// Roofdier-pop-up (hoofdstuk 14/17, issue: "roofdieren toevoegen"): één
// component met twee varianten, geschakeld op `event.fase` — zelfde patroon
// als IndringersPopup. "verschenen" is de waarschuwing zodra `jaag`
// (economie.ts) een roofdier oproept; "aanval" is het gevolg, getoond door
// `verwerkRoofdieren` als de settler een beurt later nog op het vakje stond.
export default function RoofdierPopup({ event, onSluiten }: RoofdierPopupProps) {
  const titel = event.fase === "verschenen" ? ROOFDIER_VERSCHENEN_TITEL : ROOFDIER_AANVAL_TITEL;
  const tekst = event.fase === "verschenen" ? ROOFDIER_VERSCHENEN_TEKST : ROOFDIER_AANVAL_TEKST;

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
        <strong className="fc-heading" style={{ color: "var(--kleur-gevaar)" }}>
          {titel}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {tekst} Laag {event.hoogte}, vakje {event.positieInLaag + 1}.
        </p>
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
