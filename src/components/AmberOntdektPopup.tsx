"use client";

import { AMBER_ONTDEKKING_TEKST, AMBER_ONTDEKKING_TITEL } from "@/game/tutorialContent";

interface AmberOntdektPopupProps {
  onSluiten: () => void;
  // Optionele titel/tekst-override (issue: "Amberader sowieso op streek 12"):
  // laat deze zelfde component ook de tweede-vondst-melding tonen
  // (`AMBER_ONTDEKKING_TWEEDE_TITEL`/`_TEKST`, tutorialContent.ts) zonder een
  // los component te bouwen — zelfde blokkerende meldings-frame en stijl,
  // alleen de flavor-tekst wijkt af.
  titel?: string;
  tekst?: string;
  // Optioneel sfeerbeeld (issue: "Scène beelden") — alleen gezet voor
  // popups die er een hebben (bijv. `eersteContactPopup`, Going West); de
  // meeste hergebruikers van dit component (amberader-vondst e.d.) laten dit
  // weg en tonen zoals voorheen geen plaatje.
  afbeelding?: string;
}

// Amberader-ontdekkingspop-up (hoofdstuk 3/14, issue: "toevoeging Goud"):
// verschijnt zodra `verwerkStreekOntgrendeling` (economie.ts) de gegarandeerde
// eerste Amberader-locatie ontgrendelt — zelfde blokkerende meldings-frame en
// stijl als KuddePopup, zonder keuze: de speler klikt 'm gewoon weg.
export default function AmberOntdektPopup({ onSluiten, titel, tekst, afbeelding }: AmberOntdektPopupProps) {
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
        {afbeelding && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={afbeelding}
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
        )}
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {titel ?? AMBER_ONTDEKKING_TITEL}
        </strong>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{tekst ?? AMBER_ONTDEKKING_TEKST}</p>
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
