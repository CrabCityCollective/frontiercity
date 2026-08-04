"use client";

import { bouwStagneertVolgendeBeurt, resterendeBouwBeurten } from "@/game/economie";
import { SOLDAAT } from "@/game/improvements";
import { GameState, ResourceType } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";

interface MilitairPaneelProps {
  state: GameState;
  legerwaarde: number;
  tegenstanderSterkte: number;
  // Of de "Confrontatie aangaan"-knop al ontgrendeld is (issue: "de button
  // Confrontatie aangaan moet aan het begin in de tutorial nog uitgegrijsd
  // zijn. Pas als je een andere stam tegenkomt, mag deze button actief
  // worden."). Gezet door GameRoot zodra de frontier laag 12 (De Bergkam)
  // bereikt — precies het moment waarop de laag-flavor-tekst voor het eerst
  // iemand van buiten het Hertenpad-volk introduceert, en dus ook het moment
  // waarop MilitairUitlegPopup verschijnt.
  confrontatieOntgrendeld: boolean;
  onStartRecrutering: () => void;
  onConfrontatie: () => void;
  // Klik op een nog niet toegewezen strijder-icoontje (nieuwe Wachttoren-
  // functie, hoofdstuk 6) — GameRoot zet daarop meteen de wachttoren-kies-
  // modus aan (zie WachttorenKiesBanner).
  onKiesStrijder: (strijderId: string) => void;
  // Klik op een al bemande strijder (hoofdstuk 6/11, issue: "wachttorens,
  // bemanning en bevoorrading" — toewijzing is niet langer onomkeerbaar):
  // haalt hem meteen terug van zijn Wachttoren, waarna hij direct weer
  // inzetbaar is voor een andere Wachttoren (issue: "wachttoren tweaks" —
  // verplaatsen kost geen beurten).
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
  confrontatieOntgrendeld,
  onStartRecrutering,
  onConfrontatie,
  onKiesStrijder,
  onHaalTerug,
}: MilitairPaneelProps) {
  const { stad, laatsteConfrontatie } = state;
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
            // Toewijzing is omkeerbaar en instant (hoofdstuk 6/11, issue:
            // "wachttorens, bemanning en bevoorrading" / "wachttoren
            // tweaks"): een bemande strijder is klikbaar om terug te halen,
            // en meteen daarna weer klikbaar om elders bemand te worden.
            <button
              key={strijder.id}
              className="fc-knop"
              onClick={() => (strijder.wachttoren ? onHaalTerug(strijder.id) : onKiesStrijder(strijder.id))}
              title={
                strijder.wachttoren
                  ? `Bemant wachttoren op laag ${strijder.wachttoren.hoogte} — klik om terug te halen`
                  : "Wijs deze strijder toe aan een wachttoren"
              }
              aria-label="Strijder"
              style={{
                padding: "0.3rem 0.5rem",
                fontSize: "1rem",
                lineHeight: 1,
              }}
            >
              🛡
            </button>
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
        <button
          className="fc-knop"
          disabled={!confrontatieOntgrendeld}
          onClick={onConfrontatie}
          title={
            confrontatieOntgrendeld
              ? undefined
              : "Nog niet beschikbaar — pas als je een andere stam tegenkomt kun je de confrontatie aangaan."
          }
          style={{ padding: "0.35rem 0.75rem", opacity: confrontatieOntgrendeld ? 1 : 0.5 }}
        >
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
