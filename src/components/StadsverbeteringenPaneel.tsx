"use client";

import { CAPPED_CITY_IMPROVEMENTS, cityImprovementCap, effectBeschrijving, improvementNaam } from "@/game/improvements";
import { campagneConfig } from "@/game/campagnes";
import { frontierAfstand, stadEffectiviteit, stadVervalZone, StadVervalZone } from "@/game/stad";
import { GameState, Improvement } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";
import RushMetGoudKnop from "./RushMetGoudKnop";

interface StadsverbeteringenPaneelProps {
  state: GameState;
  onStartCityVerbetering: (improvement: Improvement) => void;
  onVersnelCityVerbetering: () => void;
}

const STAD_GROOTTE_VOLGORDE: Record<GameState["stad"]["grootte"], number> = { klein: 0, middel: 1, groot: 2 };

// Labels voor het afstandsverval (hoofdstuk 9/11/14, issue: "Eerste
// bouwsteen van de Amerikaanse frontier-campagne" Deel 1) — zichtbaar zodra
// een run ooit meer dan 1 stad heeft gehad (`stadEffectiviteit` in stad.ts);
// blijft in de tutorial (altijd precies 1 stad, M18 nog niet gebouwd) dus
// altijd verborgen, klaar voor zodra het herhalende stichtingspatroon (M18)
// een tweede stad mogelijk maakt.
const ZONE_LABEL: Record<StadVervalZone, string> = {
  gezond: "gezond",
  verminderd: "begint te verminderen",
  "flink-verminderd": "flink verminderd",
  uitgeput: "volledig uitgeput",
};

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
  // Campagnefase-gating (hoofdstuk 9, M21c, opdracht-wampanoag-opening.md
  // §4/§7, herzien door issue "Wampanoag streek pas helemaal onthuld na
  // handel"): tijdens de Wampanoag-openingsfase (Going West, vóór de Smederij
  // klaar is) toont de gecapte pool niets — de Smederij (M21d, buiten de cap,
  // zelfde uitzondering als Opslagplaats) is dan het enige bouwbare city
  // improvement. Zodra `cultureelOntgrendeld` true is (gezet zodra de
  // Smederij klaar is, `metCultureelOntgrendeldDoorSmederij` in
  // groeiEnRekrutering.ts — niet langer gekoppeld aan de
  // 3-3-3-Wampanoag-handelsdrempel), opent de volledige normale pool
  // (Bibliotheek/Markt/Barakken/Tempel/Grote Tempel/Aquaduct) weer. De
  // tutorial (`cultureelOntgrendeld: true` vanaf de start) ziet dit gedrag
  // nooit.
  const zichtbareImprovements = state.cultureelOntgrendeld ? CAPPED_CITY_IMPROVEMENTS : [];
  const campagne = campagneConfig(state.campagneId);
  const effectiviteit = stadEffectiviteit(state, stad);
  const afstand = frontierAfstand(state, stad);
  const zone = stadVervalZone(afstand);

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

      {effectiviteit < 1 && (
        <span style={{ color: "var(--kleur-gevaar)", fontSize: "0.8rem" }}>
          Afstand tot de frontier: {afstand} streken — {ZONE_LABEL[zone]}, productie op {Math.round(effectiviteit * 100)}%
        </span>
      )}

      {inAanbouw && (
        <>
          <p style={{ margin: 0 }}>{improvementNaam(inAanbouw.improvement, campagne)} in aanbouw…</p>
          <RushMetGoudKnop
            improvement={inAanbouw.improvement}
            voortgang={inAanbouw.voortgang}
            goudInVoorraad={state.voorraad.goud}
            onVersnellen={onVersnelCityVerbetering}
          />
        </>
      )}

      {zichtbareImprovements.length === 0 && (
        <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
          Nog niet beschikbaar tijdens de openingsfase.
        </span>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {zichtbareImprovements.map((improvement) => {
          const gebouwd = stad.cityImprovements.some((ci) => ci.id === improvement.id);
          if (gebouwd) {
            return (
              <span key={improvement.id} className="fc-knop" style={{ opacity: 0.7 }}>
                {improvementNaam(improvement, campagne)} (gebouwd)
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
              {improvementNaam(improvement, campagne)} (<KostenIcons kosten={improvement.kosten} />, {improvement.bouwtijdBeurten} beurten)
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
