"use client";

import RushMetGoudKnop from "./RushMetGoudKnop";
import { TileInfo } from "@/game/tileInfo";
import { Improvement, ResourceType } from "@/game/types";

interface TileInfoPopupProps {
  tileInfo: TileInfo | null;
  // Als er een improvement-plaatsing loopt én de aangeklikte tile daar een
  // geldig doel voor is, tonen we naast de tile-info ook de "hier bouwen?"
  // bevestigingsvraag (zie GameRoot: `plaatsingsImprovement`).
  bouwVraag?: { improvementNaam: string };
  // Gezet in plaats van `bouwVraag` als de aangeklikte tile leeg is maar niet
  // aan de terrein-eis van de gekozen improvement voldoet (issue: "houtkap
  // alleen op bos" e.d.) — legt uit waarom hier niet gebouwd kan worden i.p.v.
  // stilzwijgend de bevestigingsvraag weg te laten.
  terreinWaarschuwing?: string;
  // Gezet als de aangeklikte tile een land-improvement in aanbouw is
  // (hoofdstuk 5/14, issue: "toevoeging Goud" Deel 2) — toont de "versnel met
  // goud"-knop naast de gewone bouwvoortgangstekst.
  rushVraag?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
    goudInVoorraad: number;
    onVersnellen: () => void;
  };
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
  terreinWaarschuwing,
  rushVraag,
  onBevestigBouw,
  onAnnuleerBouw,
  onSluiten,
}: TileInfoPopupProps) {
  if (!tileInfo) return null;

  return (
    <div
      style={{
        // `fixed` i.p.v. `absolute` (issue: "popups altijd in view") — zo
        // blijft de pop-up gecentreerd op het volledige scherm, ongeacht hoe
        // ver de speler in `.game-scroll-area` gescrold heeft.
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
          gap: "0.5rem",
          padding: "1rem 1.25rem",
          fontSize: "0.9rem",
          minWidth: "min(24rem, 100%)",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {tileInfo.titel}
        </strong>
        {tileInfo.ondertitel && (
          <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>{tileInfo.ondertitel}</span>
        )}
        <p style={{ margin: 0 }}>{tileInfo.tekst}</p>

        {bouwVraag && (
          <>
            <p style={{ margin: "0.25rem 0 0", fontWeight: "bold" }}>
              {bouwVraag.improvementNaam} hier bouwen?
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="fc-knop" onClick={onBevestigBouw} style={{ padding: "0.35rem 0.75rem" }}>
                Okee
              </button>
              <button className="fc-knop" onClick={onAnnuleerBouw} style={{ padding: "0.35rem 0.75rem" }}>
                Annuleren
              </button>
            </div>
          </>
        )}

        {!bouwVraag && terreinWaarschuwing && (
          <>
            <p style={{ margin: "0.25rem 0 0", color: "var(--kleur-oker)" }}>{terreinWaarschuwing}</p>
            <button
              className="fc-knop"
              onClick={onAnnuleerBouw}
              style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
            >
              Ander vakje kiezen
            </button>
          </>
        )}

        {!bouwVraag && !terreinWaarschuwing && rushVraag && (
          <RushMetGoudKnop
            improvement={rushVraag.improvement}
            voortgang={rushVraag.voortgang}
            goudInVoorraad={rushVraag.goudInVoorraad}
            onVersnellen={rushVraag.onVersnellen}
          />
        )}

        {!bouwVraag && !terreinWaarschuwing && (
          <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
            Sluiten
          </button>
        )}
      </div>
    </div>
  );
}
