"use client";

import { SOLDAAT } from "@/game/improvements";
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
  // Klik op een nog niet toegewezen strijder-icoontje (nieuwe
  // Wachttoren-functie, hoofdstuk 6) — GameRoot opent daarop de
  // "welke wachttoren wil je bemannen?"-pop-up.
  onKiesStrijder: (strijderId: string) => void;
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
          {stad.strijders.map((strijder) => (
            <button
              key={strijder.id}
              className="fc-knop"
              // Bemand = onomkeerbaar (issue: "je kunt je strijder niet meer
              // uit eerdere wachttorens halen") — alleen nog niet toegewezen
              // strijders zijn klikbaar.
              disabled={Boolean(strijder.wachttoren)}
              onClick={() => onKiesStrijder(strijder.id)}
              title={strijder.wachttoren ? `Bemant wachttoren op laag ${strijder.wachttoren.hoogte}` : "Wijs deze strijder toe aan een wachttoren"}
              aria-label="Strijder"
              style={{
                padding: "0.3rem 0.5rem",
                fontSize: "1rem",
                lineHeight: 1,
                opacity: strijder.wachttoren ? 0.5 : 1,
              }}
            >
              🛡
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {stad.legerInAanbouw ? (
          <span>Soldaat in opleiding…</span>
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
