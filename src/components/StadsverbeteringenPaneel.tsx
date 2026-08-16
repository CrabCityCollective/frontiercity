"use client";

import { CAPPED_CITY_IMPROVEMENTS, cityImprovementCap, effectBeschrijving } from "@/game/improvements";
import { GameState, Improvement } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";
import RushMetGoudKnop from "./RushMetGoudKnop";

interface StadsverbeteringenPaneelProps {
  state: GameState;
  onStartCityVerbetering: (improvement: Improvement) => void;
  onVersnelCityVerbetering: () => void;
}

const STAD_GROOTTE_VOLGORDE: Record<GameState["stad"]["grootte"], number> = { klein: 0, middel: 1, groot: 2 };

// Stadsverbeteringen (hoofdstuk 3/4/11/14, issue: "city improvements" Deel
// 1/3): Bibliotheek, Markt, Barakken, Tempel en Grote Tempel — samen
// concurrerend om een van de `cityImprovementCap(grootte)`-sloten (Deel 1;
// vervangt het nooit-gebouwde relic-slot-concept uit een eerdere versie van
// hoofdstuk 4). Opslagplaats (OpslagplaatsPaneel) en de groei-tier
// (CivielPaneel) vallen hier bewust buiten — zie hoofdstuk 11. Zelfde
// altijd-zichtbare-paneel-patroon als de overige stad-menu-panelen.
export default function StadsverbeteringenPaneel({
  state,
  onStartCityVerbetering,
  onVersnelCityVerbetering,
}: StadsverbeteringenPaneelProps) {
  const { stad } = state;
  const cap = cityImprovementCap(stad.grootte);
  const inAanbouw = stad.cityVerbeteringInAanbouw;

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
      <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
        Stadsverbeteringen
      </strong>
      <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
        {stad.cityImprovements.length} / {cap} sloten gebruikt (grootte: {stad.grootte})
      </span>

      {inAanbouw && (
        <>
          <p style={{ margin: 0 }}>{inAanbouw.improvement.naam} in aanbouw…</p>
          <RushMetGoudKnop
            improvement={inAanbouw.improvement}
            voortgang={inAanbouw.voortgang}
            goudInVoorraad={state.voorraad.goud}
            onVersnellen={onVersnelCityVerbetering}
          />
        </>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {CAPPED_CITY_IMPROVEMENTS.map((improvement) => {
          const gebouwd = stad.cityImprovements.some((ci) => ci.id === improvement.id);
          if (gebouwd) {
            return (
              <span key={improvement.id} className="fc-knop" style={{ opacity: 0.7 }}>
                {improvement.naam} (gebouwd)
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-tekst-gedempt)" }}>
                  {effectBeschrijving(improvement)}
                </span>
              </span>
            );
          }

          const grootteEisVervuld =
            !improvement.stadsgrootteEis ||
            STAD_GROOTTE_VOLGORDE[stad.grootte] >= STAD_GROOTTE_VOLGORDE[improvement.stadsgrootteEis];
          const capVol = stad.cityImprovements.length >= cap;
          const kanBouwen = !inAanbouw && grootteEisVervuld && !capVol;

          return (
            <button
              key={improvement.id}
              className="fc-knop"
              disabled={!kanBouwen}
              onClick={() => onStartCityVerbetering(improvement)}
            >
              {improvement.naam} (<KostenIcons kosten={improvement.kosten} />, {improvement.bouwtijdBeurten} beurten)
              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-tekst-gedempt)" }}>
                {effectBeschrijving(improvement)}
              </span>
              {improvement.stadsgrootteEis && (
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-tekst-gedempt)" }}>
                  Vereist stadsgrootte: {improvement.stadsgrootteEis}
                </span>
              )}
              {capVol && grootteEisVervuld && !inAanbouw && (
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-gevaar)" }}>
                  Sloten vol
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
