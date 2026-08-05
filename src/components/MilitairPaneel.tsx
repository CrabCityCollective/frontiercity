"use client";

import { bouwStagneertVolgendeBeurt, resterendeBouwBeurten } from "@/game/economie";
import { SOLDAAT } from "@/game/improvements";
import { GameState, ResourceType } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";

interface MilitairPaneelProps {
  state: GameState;
  legerwaarde: number;
  tegenstanderSterkte: number;
  onStartRecrutering: () => void;
  // Klik op een nog niet toegewezen strijder-icoontje (nieuwe Wachttoren-
  // functie, hoofdstuk 6) — GameRoot zet daarop meteen de wachttoren-kies-
  // modus aan (zie WachttorenKiesBanner).
  onKiesStrijder: (strijderId: string) => void;
  // Klik op het Legerkamp-icoontje naast een nog niet toegewezen strijder
  // (hoofdstuk 6, issue: "De Bezette Laag, missionaris en verkenner", Deel
  // 5) — zelfde soort kies-modus als hierboven, maar voor een Legerkamp-
  // tile i.p.v. een Wachttoren-tile.
  onKiesStrijderVoorLegerkamp: (strijderId: string) => void;
  // Klik op een al bemande strijder (hoofdstuk 6/11, issue: "wachttorens,
  // bemanning en bevoorrading" — toewijzing is niet langer onomkeerbaar):
  // haalt hem meteen terug van zijn Wachttoren óf Legerkamp, waarna hij
  // direct weer inzetbaar is voor een andere toewijzing (issue: "wachttoren
  // tweaks" — verplaatsen kost geen beurten).
  onHaalTerug: (strijderId: string) => void;
}

// Militair (basis) (M7, hoofdstuk 6): rekruteren van Soldaat-eenheden, met de
// legerwaarde zichtbaar voor de speler. De Wachttoren-/Legerkamp-toewijzing
// van elke strijder gebeurt via het kies-modus-icoontje hieronder. Puur
// placeholder-styling — geen definitieve UI.
export default function MilitairPaneel({
  state,
  legerwaarde,
  tegenstanderSterkte,
  onStartRecrutering,
  onKiesStrijder,
  onKiesStrijderVoorLegerkamp,
  onHaalTerug,
}: MilitairPaneelProps) {
  const { stad } = state;
  // Nog benodigde grondstoffen voor de lopende Soldaat-opleiding, en of die
  // volgende beurt stilligt door een tekort (issue: "wil ik graag zien welke
  // materialen nog nodig zijn ... en een attentie als de materialen niet
  // aanwezig zijn om de strijder af te maken volgende beurt") — zelfde
  // helpers als de tile-bouw-info (tileInfo.ts), hier toegepast op
  // `legerInAanbouw` in plaats van een land-tile.
  const legerResterend = stad.legerInAanbouw
    ? (Object.entries(stad.legerInAanbouw.voortgang) as [ResourceType, number][]).filter(
        ([, aantal]) => aantal > 0
      )
    : [];
  const legerStagneert = stad.legerInAanbouw
    ? bouwStagneertVolgendeBeurt(stad.legerInAanbouw.improvement, stad.legerInAanbouw.voortgang, state.voorraad)
    : false;

  return (
    <div
      className="fc-paneel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        padding: "0.75rem 1rem",
        fontSize: "0.9rem",
        margin: "0.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span>Legerwaarde: {legerwaarde}</span>
        <span>Dreiging op de frontier: {tegenstanderSterkte}</span>
      </div>

      {stad.strijders.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <span style={{ color: "var(--kleur-tekst-gedempt)" }}>Strijders:</span>
          {stad.strijders.map((strijder) => (
            <span key={strijder.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
              {/* Toewijzing is omkeerbaar en instant (hoofdstuk 6/11, issue:
                  "wachttorens, bemanning en bevoorrading" / "wachttoren
                  tweaks"): een toegewezen strijder is klikbaar om terug te
                  halen, en meteen daarna weer inzetbaar. */}
              <button
                className="fc-knop"
                onClick={() =>
                  strijder.wachttoren || strijder.legerkamp ? onHaalTerug(strijder.id) : onKiesStrijder(strijder.id)
                }
                title={
                  strijder.wachttoren
                    ? `Bemant wachttoren op laag ${strijder.wachttoren.hoogte} — klik om terug te halen`
                    : strijder.legerkamp
                      ? `Toegewezen aan een legerkamp op laag ${strijder.legerkamp.hoogte} — klik om terug te halen`
                      : "Wijs deze strijder toe aan een wachttoren"
                }
                aria-label="Strijder"
                style={{ padding: "0.3rem 0.5rem", fontSize: "1rem", lineHeight: 1 }}
              >
                {strijder.legerkamp ? "⛺" : "🛡"}
              </button>
              {!strijder.wachttoren && !strijder.legerkamp && (
                <button
                  className="fc-knop"
                  onClick={() => onKiesStrijderVoorLegerkamp(strijder.id)}
                  title="Wijs deze strijder toe aan een legerkamp (hoofdstuk 6: Bezette Laag-legerwaarde)"
                  aria-label="Strijder naar legerkamp"
                  style={{ padding: "0.3rem 0.4rem", fontSize: "0.8rem", lineHeight: 1 }}
                >
                  ⛺
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {stad.legerInAanbouw ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            Soldaat in opleiding… Nog nodig: <KostenIcons kosten={Object.fromEntries(legerResterend)} />
            {legerStagneert ? (
              <span style={{ color: "var(--kleur-gevaar)" }}>
                ⚠ Tekort aan grondstoffen — volgende beurt wordt hier niet aan gewerkt.
              </span>
            ) : (
              <span>
                (nog {resterendeBouwBeurten(stad.legerInAanbouw.improvement, stad.legerInAanbouw.voortgang)}{" "}
                beurten)
              </span>
            )}
          </span>
        ) : (
          <button className="fc-knop" onClick={onStartRecrutering} style={{ padding: "0.35rem 0.75rem" }}>
            Soldaat rekruteren (<KostenIcons kosten={SOLDAAT.kosten} />, {SOLDAAT.bouwtijdBeurten} beurten)
          </button>
        )}
      </div>
    </div>
  );
}
