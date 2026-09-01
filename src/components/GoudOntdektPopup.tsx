"use client";

import { GOUD_ONTDEKKING_TEKST, GOUD_ONTDEKKING_TITEL } from "@/game/tutorialContent";

interface GoudOntdektPopupProps {
  onSluiten: () => void;
  // Optionele titel/tekst-override (issue: "Goudader sowieso op streek 12"):
  // laat deze zelfde component ook de tweede-vondst-melding tonen
  // (`GOUD_ONTDEKKING_TWEEDE_TITEL`/`_TEKST`, tutorialContent.ts) zonder een
  // los component te bouwen — zelfde blokkerende meldings-frame en stijl,
  // alleen de flavor-tekst wijkt af.
  titel?: string;
  tekst?: string;
  // Optioneel sfeerbeeld (issue: "Scène beelden"/"Goud asset") — alleen gezet
  // voor popups die er een hebben (bijv. de goudader-vondst-popups en
  // `eersteContactPopup`, Going West); overige hergebruikers van dit
  // component laten dit weg en tonen geen plaatje.
  afbeelding?: string;
}

// Goudader-ontdekkingspop-up (hoofdstuk 3/14, issue: "toevoeging Goud"):
// verschijnt zodra `verwerkStreekOntgrendeling` (economie.ts) de gegarandeerde
// eerste Goudader-locatie ontgrendelt — zelfde blokkerende meldings-frame en
// stijl als KuddePopup, zonder keuze: de speler klikt 'm gewoon weg.
export default function GoudOntdektPopup({ onSluiten, titel, tekst, afbeelding }: GoudOntdektPopupProps) {
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
          maxHeight: "85vh",
          overflowY: "auto",
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
          {titel ?? GOUD_ONTDEKKING_TITEL}
        </strong>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{tekst ?? GOUD_ONTDEKKING_TEKST}</p>
        <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
