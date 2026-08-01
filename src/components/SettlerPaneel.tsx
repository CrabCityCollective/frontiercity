"use client";

import { GameState } from "@/game/types";

interface SettlerPaneelProps {
  state: GameState;
  onLegWegAan: () => void;
  onJaag: () => void;
  onHakHout: () => void;
}

// Settler-bediening (M10, hoofdstuk 16; issue: "de settler unit is actief
// als je aan je beurt begint, de tegels waar je heen kunt lichten op, door
// te klikken op een tegel ga je er naar toe"): verplaatsen gebeurt voortaan
// direct op de canvas (zie GameRoot: `settlerBereikbarePosities` +
// `onTileClick`) — dit paneel toont alleen nog de status en de
// weg-aanleggen/jagen/hout-hakken-knoppen. Allemaal hoogstens 1 keer per
// beurt (`settlerActieGedaanDitBeurt`). Verschijnt pas zodra de settler
// bestaat (vanaf beurt 2, zie economie.ts `volgendeBeurt`).
export default function SettlerPaneel({ state, onLegWegAan, onJaag, onHakHout }: SettlerPaneelProps) {
  const { settler } = state;
  if (!settler) return null;

  const laag = state.lagen.find((l) => l.hoogte === settler.hoogte);
  const huidigeTile = laag?.tiles[settler.positieInLaag];
  const kanActie = !state.settlerActieGedaanDitBeurt;
  const heeftAlWeg = Boolean(huidigeTile?.heeftWeg);
  // Kuddes & houtkap (hoofdstuk 16/17, issue: "kuddes met dieren waar je op
  // kunt jagen voor voedsel" / "ook mag je je settlers inzetten om hout te
  // kappen"): allebei alleen mogelijk op het vakje waar de settler nu staat.
  const kudde = huidigeTile?.kudde;
  const kanHakken = huidigeTile?.terrein === "bos";

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
        Settler
      </strong>
      <span>
        Laag {settler.hoogte}, vakje {settler.positieInLaag + 1}
        {heeftAlWeg ? " — hier ligt al een weg" : ""}
        {kudde ? ` — wilde kudde (nog ${kudde.beurtenResterend} beurten te jagen)` : ""}
      </span>
      {kanActie && (
        <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
          Klik op een oplichtende tegel op de kaart om de settler daarheen te verplaatsen.
        </span>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        <button
          className="fc-knop"
          disabled={!kanActie || heeftAlWeg}
          onClick={onLegWegAan}
          style={{ padding: "0.3rem 0.6rem" }}
        >
          Weg aanleggen
        </button>
        {kudde && (
          <button className="fc-knop" disabled={!kanActie} onClick={onJaag} style={{ padding: "0.3rem 0.6rem" }}>
            Jagen (+3 voedsel)
          </button>
        )}
        {kanHakken && (
          <button className="fc-knop" disabled={!kanActie} onClick={onHakHout} style={{ padding: "0.3rem 0.6rem" }}>
            Hout hakken (+1 hout)
          </button>
        )}
      </div>
      {!kanActie && (
        <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
          Deze beurt al gebruikt — volgende beurt weer.
        </span>
      )}
    </div>
  );
}
