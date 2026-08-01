"use client";

import { SOLDAAT } from "@/game/improvements";
import { resterendeBouwBeurten } from "@/game/economie";
import { GameState } from "@/game/types";

function formatteerKosten(kosten: typeof SOLDAAT.kosten): string {
  const delen = Object.entries(kosten).map(([type, waarde]) => `${waarde} ${type}`);
  return delen.length > 0 ? delen.join(", ") : "gratis";
}

interface MilitairPaneelProps {
  state: GameState;
  legerwaarde: number;
  tegenstanderSterkte: number;
  onStartRecrutering: () => void;
  onConfrontatie: () => void;
  // Klik op een nog niet toegewezen (en niet onderweg-zijnde) strijder-
  // icoontje (nieuwe Wachttoren-functie, hoofdstuk 6) — GameRoot opent daarop
  // de "welke wachttoren wil je bemannen?"-pop-up.
  onKiesStrijder: (strijderId: string) => void;
  // Klik op een al bemande strijder (hoofdstuk 6/11, issue: "wachttorens,
  // bemanning en bevoorrading" — toewijzing is niet langer onomkeerbaar):
  // haalt hem meteen terug van zijn Wachttoren, waarna hij een paar beurten
  // onderweg is voordat hij elders opnieuw bemand kan worden.
  onHaalTerug: (strijderId: string) => void;
}

// Militair (basis) (M7, hoofdstuk 6): rekruteren van Soldaat-eenheden en het
// aangaan van een confrontatie tegen de dreiging op de actieve laag, met de
// winkans en het laatste resultaat zichtbaar voor de speler. Puur
// placeholder-styling — geen definitieve UI.
export default function MilitairPaneel({
  state,
  legerwaarde,
  tegenstanderSterkte,
  onStartRecrutering,
  onConfrontatie,
  onKiesStrijder,
  onHaalTerug,
}: MilitairPaneelProps) {
  const { stad, laatsteConfrontatie } = state;

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
          {stad.strijders.map((strijder) => {
            // Toewijzing is omkeerbaar (hoofdstuk 6/11, issue: "wachttorens,
            // bemanning en bevoorrading"): een bemande strijder is klikbaar
            // om terug te halen; een onderweg-zijnde strijder (na terughalen)
            // is tijdelijk niet klikbaar, net als tijdens het bemannen zelf.
            const onderweg = Boolean(strijder.onderwegBeurtenResterend);
            return (
              <button
                key={strijder.id}
                className="fc-knop"
                disabled={onderweg}
                onClick={() => (strijder.wachttoren ? onHaalTerug(strijder.id) : onKiesStrijder(strijder.id))}
                title={
                  onderweg
                    ? `Onderweg — nog ${strijder.onderwegBeurtenResterend} beurten voordat hij weer bemand kan worden`
                    : strijder.wachttoren
                      ? `Bemant wachttoren op laag ${strijder.wachttoren.hoogte} — klik om terug te halen`
                      : "Wijs deze strijder toe aan een wachttoren"
                }
                aria-label="Strijder"
                style={{
                  padding: "0.3rem 0.5rem",
                  fontSize: "1rem",
                  lineHeight: 1,
                  opacity: onderweg ? 0.5 : 1,
                }}
              >
                {onderweg ? "🚶" : "🛡"}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {stad.legerInAanbouw ? (
          <span>
            Soldaat in opleiding… (nog {resterendeBouwBeurten(stad.legerInAanbouw.improvement, stad.legerInAanbouw.voortgang)}{" "}
            beurten)
          </span>
        ) : (
          <button className="fc-knop" onClick={onStartRecrutering} style={{ padding: "0.35rem 0.75rem" }}>
            Soldaat rekruteren ({formatteerKosten(SOLDAAT.kosten)}, {SOLDAAT.bouwtijdBeurten} beurten)
          </button>
        )}
        <button className="fc-knop" onClick={onConfrontatie} style={{ padding: "0.35rem 0.75rem" }}>
          Confrontatie aangaan
        </button>
      </div>

      {laatsteConfrontatie && (
        <p style={{ margin: 0, color: laatsteConfrontatie.gewonnen ? "var(--kleur-mos)" : "var(--kleur-gevaar)" }}>
          {laatsteConfrontatie.gewonnen ? "Overwinning" : "Verlies"} (winkans was{" "}
          {Math.round(laatsteConfrontatie.winkans * 100)}%)
          {laatsteConfrontatie.gewonnen && `, buit: ${laatsteConfrontatie.buitGoud} goud`}
          {!laatsteConfrontatie.gewonnen &&
            `, ${laatsteConfrontatie.geraakteTiles} vakje(s) beschadigd (versnelde uitputting)`}
        </p>
      )}
    </div>
  );
}
