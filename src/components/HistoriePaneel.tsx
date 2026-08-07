"use client";

import ResourceIcoon from "@/components/ResourceIcoon";
import { laagContent } from "@/game/tutorialContent";
import { City, Layer, MateriaalType } from "@/game/types";
import { hoogsteOntgrendeldeLaag } from "@/game/world";

const STAD_GROOTTE_LABELS: Record<City["grootte"], string> = {
  klein: "Klein",
  middel: "Middel",
  groot: "Groot",
};

interface HistoriePaneelProps {
  lagen: Layer[];
  statistieken: {
    improvementenGebouwd: number;
    vervallen: number;
    steden: number;
    grootsteStad: City["grootte"];
    aanvallenTotaal: number;
    aanvallenAfgeslagen: number;
    wachttorensGesloopt: number;
    tribuutGegevenAantal: number;
    tribuutGegeven: Record<MateriaalType, number>;
  };
  onSluiten: () => void;
}

// Historiescherm (issue: "spel-icoontje ... historie van deze run inzien";
// uitgebreid met issue "Settings uitbreiden": aanvallen, afgeslagen aanvallen,
// gesloopte wachttorens en gegeven tribuut): toont, in volgorde, de
// mechaniek/flavor-tekst van elke laag die de speler al ontgrendeld heeft
// (dezelfde vastgelegde tutorial-content als LaagIntroPaneel, hier alleen
// achteraf terugkijkend i.p.v. alleen de huidige laag), plus een paar
// samengevatte run-statistieken. Bereikbaar via het hoofdmenu (HoofdMenu) in
// plaats van een los spel-icoontje (issue: "de historie ... toevoegen aan het
// menu, ipv dat het een zelfstandige button is").
export default function HistoriePaneel({ lagen, statistieken, onSluiten }: HistoriePaneelProps) {
  const hoogste = hoogsteOntgrendeldeLaag(lagen);
  const regels = Array.from({ length: hoogste }, (_, i) => i + 1)
    .map((hoogte) => ({ hoogte, content: laagContent(hoogte) }))
    .filter((regel): regel is { hoogte: number; content: NonNullable<ReturnType<typeof laagContent>> } =>
      Boolean(regel.content)
    );
  // Alleen grondstoffen tonen die daadwerkelijk als tribuut gegeven zijn —
  // een rijtje met louter nullen voegt niets toe.
  const tribuutTypes = (Object.keys(statistieken.tribuutGegeven) as MateriaalType[]).filter(
    (type) => statistieken.tribuutGegeven[type] > 0
  );

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
          gap: "0.75rem",
          padding: "1rem 1.25rem",
          fontSize: "0.9rem",
          width: "min(32rem, 100%)",
          maxHeight: "min(32rem, 90vh)",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          Historie van deze run
        </strong>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem 1.25rem",
            color: "var(--kleur-tekst-gedempt)",
          }}
        >
          <span>Improvements gebouwd: {statistieken.improvementenGebouwd}</span>
          <span>Vervallen: {statistieken.vervallen}</span>
          <span>Steden: {statistieken.steden}</span>
          <span>Grootste stad: {STAD_GROOTTE_LABELS[statistieken.grootsteStad]}</span>
          <span>Aangevallen: {statistieken.aanvallenTotaal}</span>
          <span>Aanval afgeslagen: {statistieken.aanvallenAfgeslagen}</span>
          <span>Wachttorens gesloopt: {statistieken.wachttorensGesloopt}</span>
          <span>
            Tribuut gegeven: {statistieken.tribuutGegevenAantal}
            {tribuutTypes.length > 0 && (
              <>
                {" ("}
                {tribuutTypes.map((type, i) => (
                  <span key={type}>
                    {i > 0 && ", "}
                    <ResourceIcoon type={type} waarde={statistieken.tribuutGegeven[type]} />
                  </span>
                ))}
                {")"}
              </>
            )}
          </span>
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {regels.map(({ hoogte, content }) => (
            <div key={hoogte} style={{ borderTop: "1px solid var(--kleur-rand)", paddingTop: "0.5rem" }}>
              <strong>
                Laag {hoogte} — {content.naam}
              </strong>
              <div style={{ fontStyle: "italic", color: "var(--kleur-tekst-gedempt)" }}>
                Nieuw: {content.mechaniek}
              </div>
              <p style={{ margin: "0.25rem 0 0" }}>{content.flavorTekst}</p>
            </div>
          ))}
        </div>

        <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}
