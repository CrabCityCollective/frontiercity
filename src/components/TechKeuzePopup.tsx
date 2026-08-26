"use client";

import { TECH_TREE, techNaam } from "@/game/techTree";
import { CampaignConfig, TechDrempel, TechId } from "@/game/types";

interface TechKeuzePopupProps {
  drempel: TechDrempel;
  opties: [TechId, TechId];
  // Actieve campagne (hoofdstuk 9/13, M20d deelstap 1) — bepaalt de
  // weergavenaam via `techNaam()` hieronder, zie `campagneConfig()` in
  // campagnes.ts. `undefined` voor de tutorial.
  campagne?: CampaignConfig;
  onKiesTech: (techId: TechId) => void;
}

// Technologie-keuze-pop-up (hoofdstuk 3/9/11, issue: "tech tree toevoegen"
// Deel 2): verschijnt zodra `verwerkTechDrempel` (economie.ts) een drempel
// bereikt heeft. Anders dan de indringers-/kudde-/roofdier-pop-ups is dit
// geen wegklikbare melding — de speler moet daadwerkelijk kiezen, dus er is
// bewust geen "sluiten"-knop. De niet-gekozen optie (en alles wat daaronder
// in de boom hangt) wordt hiermee voor de rest van de run permanent
// onbereikbaar (hoofdstuk 11) — vandaar de expliciete waarschuwing in de tekst.
export default function TechKeuzePopup({ drempel, opties, campagne, onKiesTech }: TechKeuzePopupProps) {
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
          maxWidth: "34rem",
          textAlign: "center",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          Drempel {drempel} — kies een technologie
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          De niet-gekozen technologie — en alles wat daaronder in de boom hangt — is voor de rest van deze
          tocht onbereikbaar.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
          {opties.map((techId) => (
            <button
              key={techId}
              className="fc-knop"
              onClick={() => onKiesTech(techId)}
              style={{ padding: "0.6rem 1rem", maxWidth: "15rem", textAlign: "left" }}
            >
              <strong style={{ display: "block" }}>{techNaam(techId, campagne)}</strong>
              <span style={{ display: "block", fontSize: "0.8rem", color: "var(--kleur-tekst-gedempt)" }}>
                {TECH_TREE[techId].beschrijving}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
