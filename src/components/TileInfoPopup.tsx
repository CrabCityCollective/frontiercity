"use client";

import { TileInfo } from "@/game/tileInfo";

interface TileInfoPopupProps {
  tileInfo: TileInfo | null;
  // Als er een improvement-plaatsing loopt én de aangeklikte tile daar een
  // geldig doel voor is, tonen we naast de tile-info ook de "hier bouwen?"
  // bevestigingsvraag (zie GameRoot: `plaatsingsImprovement`).
  bouwVraag?: { improvementNaam: string };
  onBevestigBouw: () => void;
  onAnnuleerBouw: () => void;
  onSluiten: () => void;
}

// Info-pop-up voor een aangeklikte tile (naam, soort, kort wat je erop kunt
// bouwen/wat het doet). Verschijnt voor elke tile die je aanklikt op de
// kaart. Tijdens het plaatsen van een gekozen improvement krijgt dezelfde
// pop-up er de "hier bouwen?"-bevestiging (Okee/Annuleren) bij in plaats van
// een los scherm — de speler ziet zo altijd eerst waar hij klikt.
export default function TileInfoPopup({
  tileInfo,
  bouwVraag,
  onBevestigBouw,
  onAnnuleerBouw,
  onSluiten,
}: TileInfoPopupProps) {
  if (!tileInfo) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 8, 6, 0.72)",
        padding: "1rem",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: "1rem 1.25rem",
          background: "#20180f",
          color: "#e8dcc8",
          fontFamily: "sans-serif",
          fontSize: "0.9rem",
          border: "1px solid #3a2f22",
          borderRadius: "6px",
          minWidth: "min(24rem, 100%)",
        }}
      >
        <strong>{tileInfo.titel}</strong>
        {tileInfo.ondertitel && (
          <span style={{ color: "#c9a876", fontSize: "0.8rem" }}>{tileInfo.ondertitel}</span>
        )}
        <p style={{ margin: 0 }}>{tileInfo.tekst}</p>

        {bouwVraag && (
          <>
            <p style={{ margin: "0.25rem 0 0", fontWeight: "bold" }}>
              {bouwVraag.improvementNaam} hier bouwen?
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={onBevestigBouw} style={{ padding: "0.35rem 0.75rem" }}>
                Okee
              </button>
              <button onClick={onAnnuleerBouw} style={{ padding: "0.35rem 0.75rem" }}>
                Annuleren
              </button>
            </div>
          </>
        )}

        {!bouwVraag && (
          <button onClick={onSluiten} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
            Sluiten
          </button>
        )}
      </div>
    </div>
  );
}
