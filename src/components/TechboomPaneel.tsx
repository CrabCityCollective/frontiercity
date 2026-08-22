"use client";

import { TECH_TREE, TechNode, techNaam, wetenschapKostenVoorDrempel } from "@/game/techTree";
import { CampaignConfig, TechDrempel, TechId } from "@/game/types";

interface TechboomPaneelProps {
  technologieen: TechId[];
  techKeuzeEvent?: { drempel: TechDrempel; opties: [TechId, TechId] };
  // Actieve campagne (hoofdstuk 9/13, M20d deelstap 1) — bepaalt de
  // weergavenaam via `techNaam()` hieronder, zie `campagneConfig()` in
  // campagnes.ts. `undefined` voor de tutorial.
  campagne?: CampaignConfig;
  onSluiten: () => void;
}

type TechStatus = "gekozen" | "gemist" | "openstaand" | "onbekend";

// Statusbepaling per tech (issue: "tech tree inzien" — "de delen van de tree
// die je hebt gekozen en de delen die je gemist hebt deze run"): recursief
// over de ouder-keten, want een tech is pas "gemist" als zijn ouder ook
// daadwerkelijk gekozen wérd — hangt een tech onder een niet-gekozen ouder,
// dan was hij nooit bereikbaar en telt hij ook als "gemist" (dezelfde
// permanente onbereikbaarheid als de vertakkingslogica zelf, techTree.ts).
// Nog niet bereikte drempels blijven "onbekend" — geen spoiler van de boom
// vooruit, zelfde terughoudendheid als HistoriePaneel (alleen al ontgrendelde
// streken tonen hun content).
function techStatus(
  id: TechId,
  technologieen: TechId[],
  techKeuzeEvent: TechboomPaneelProps["techKeuzeEvent"]
): TechStatus {
  if (technologieen.includes(id)) return "gekozen";
  if (techKeuzeEvent?.opties.includes(id)) return "openstaand";

  const node = TECH_TREE[id];
  if (node.ouder) {
    const ouderStatus = techStatus(node.ouder, technologieen, techKeuzeEvent);
    if (ouderStatus !== "gekozen") return ouderStatus === "onbekend" ? "onbekend" : "gemist";
  }
  return technologieen.length >= node.drempel ? "gemist" : "onbekend";
}

const STATUS_LABEL: Record<TechStatus, string> = {
  gekozen: "Gekozen",
  gemist: "Gemist",
  openstaand: "Kies nu",
  onbekend: "Nog niet bereikt",
};

const STATUS_KLEUR: Record<TechStatus, string> = {
  gekozen: "var(--kleur-oker)",
  gemist: "var(--kleur-tekst-gedempt)",
  openstaand: "var(--kleur-oker)",
  onbekend: "var(--kleur-tekst-gedempt)",
};

// Techboom-overzicht (issue: "tech tree inzien" — "kun je in het menu een
// item erbij maken om de tech tree in te zien"): puur informatief, geen
// keuzes hier (dat blijft TechKeuzePopup) — laat per drempel zien welke twee
// technologieën er waren, en of de speler die deze run gekozen, gemist, of
// nog niet bereikt heeft. Bereikbaar via het hoofdmenu, zelfde plek/patroon
// als "Historie" (HoofdMenu/HistoriePaneel).
export default function TechboomPaneel({
  technologieen,
  techKeuzeEvent,
  campagne,
  onSluiten,
}: TechboomPaneelProps) {
  const drempels: TechDrempel[] = [1, 2, 3];

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
          width: "min(36rem, 100%)",
          maxHeight: "min(36rem, 90vh)",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          Technologie-boom
        </strong>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {drempels.map((drempel) => {
            const nodes = (Object.values(TECH_TREE) as TechNode[]).filter((node) => node.drempel === drempel);
            return (
              <div key={drempel} style={{ borderTop: "1px solid var(--kleur-rand)", paddingTop: "0.5rem" }}>
                <strong style={{ display: "block", marginBottom: "0.4rem" }}>
                  Drempel {drempel} — {wetenschapKostenVoorDrempel(drempel)} wetenschap
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {nodes.map((node) => {
                    const status = techStatus(node.id, technologieen, techKeuzeEvent);
                    return (
                      <div
                        key={node.id}
                        style={{
                          flex: "1 1 14rem",
                          border: "1px solid var(--kleur-rand)",
                          borderRadius: "0.4rem",
                          padding: "0.4rem 0.6rem",
                          opacity: status === "gemist" ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                          <strong>{status === "onbekend" ? "???" : techNaam(node.id, campagne)}</strong>
                          <span style={{ color: STATUS_KLEUR[status], whiteSpace: "nowrap" }}>
                            {STATUS_LABEL[status]}
                          </span>
                        </div>
                        {status !== "onbekend" && (
                          <span style={{ display: "block", fontSize: "0.8rem", color: "var(--kleur-tekst-gedempt)" }}>
                            {node.beschrijving}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}
