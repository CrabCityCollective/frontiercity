"use client";

import { KUDDE_FLAVOR_TEKST, KUDDE_TITEL } from "@/game/tutorialContent";
import { KuddeEvent } from "@/game/types";

interface KuddePopupProps {
  event: KuddeEvent;
  onSluiten: () => void;
}

// Kudde-pop-up (hoofdstuk 17): verschijnt zodra `verwerkKuddes` (economie.ts)
// een nieuwe wilde kudde neerzet — zelfde blokkerende meldings-frame en
// stijl als IndringersPopup, incl. scene-afbeelding, maar zonder keuze: de
// speler klikt 'm gewoon weg en kan de settler er daarna zelf heen sturen
// om te jagen.
export default function KuddePopup({ event, onSluiten }: KuddePopupProps) {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/scenes/wilde-kudde.png"
          alt=""
          style={{
            width: "100%",
            maxWidth: "26rem",
            height: "auto",
            display: "block",
            alignSelf: "center",
            border: "3px solid var(--kleur-oker)",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.55)",
          }}
        />
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {KUDDE_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {KUDDE_FLAVOR_TEKST} Streek {event.hoogte}, vakje {event.positieInStreek + 1}.
        </p>
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
