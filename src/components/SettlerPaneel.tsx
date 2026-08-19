"use client";

import { SettlerSlot, kanStichten } from "@/game/acties";
import { GameState, Settler } from "@/game/types";

interface SettlerPaneelProps {
  state: GameState;
  // Welke settler op dit moment reageert op een canvas-klik (issue: "Altijd
  // 2e settler" #236) — de "Besturen"-knop op een kaart hieronder wijzigt
  // dit via `onKiesSettler`.
  settlerSelectie: SettlerSlot;
  onKiesSettler: (slot: SettlerSlot) => void;
  onLegWegAan: (slot: SettlerSlot) => void;
  onJaag: (slot: SettlerSlot) => void;
  onHakHout: (slot: SettlerSlot) => void;
  onOpenStichtStad: (slot: SettlerSlot) => void;
}

// Settler-bediening (M10, hoofdstuk 16; issue: "de settler unit is actief
// als je aan je beurt begint, de tegels waar je heen kunt lichten op, door
// te klikken op een tegel ga je er naar toe"): verplaatsen gebeurt voortaan
// direct op de canvas (zie GameRoot: `settlerBereikbarePosities` +
// `onTileClick`) — dit paneel toont alleen nog de status en de
// weg-aanleggen/jagen/hout-hakken-knoppen. Allemaal hoogstens 1 keer per
// beurt (`settlerActieGedaanDitBeurt`). Verschijnt pas zodra de settler
// bestaat (vanaf beurt 2, zie economie.ts `volgendeBeurt`).
//
// Tweede settler (issue: "Altijd 2e settler" #236): dit paneel toont één
// kaart per bestaande settler (`SettlerKaart` hieronder) — nooit meer dan
// twee. Zolang er maar één settler is (verreweg het gebruikelijke geval,
// zeker vóór streek 7) toont de kaart geen "Besturen"-knop: er valt dan
// niets te kiezen.
export default function SettlerPaneel({
  state,
  settlerSelectie,
  onKiesSettler,
  onLegWegAan,
  onJaag,
  onHakHout,
  onOpenStichtStad,
}: SettlerPaneelProps) {
  const { settler, tweedeSettler } = state;
  if (!settler && !tweedeSettler) return null;

  const toontKiesKnop = Boolean(settler) && Boolean(tweedeSettler);

  return (
    <>
      {settler && (
        <SettlerKaart
          titel="Settler"
          slot="primair"
          settler={settler}
          actieGedaan={state.settlerActieGedaanDitBeurt}
          state={state}
          geselecteerd={settlerSelectie === "primair"}
          toontKiesKnop={toontKiesKnop}
          onKiesSettler={onKiesSettler}
          onLegWegAan={onLegWegAan}
          onJaag={onJaag}
          onHakHout={onHakHout}
          onOpenStichtStad={onOpenStichtStad}
        />
      )}
      {tweedeSettler && (
        <SettlerKaart
          titel="Tweede settler"
          slot="tweede"
          settler={tweedeSettler}
          actieGedaan={state.tweedeSettlerActieGedaanDitBeurt}
          state={state}
          geselecteerd={settlerSelectie === "tweede"}
          toontKiesKnop={toontKiesKnop}
          onKiesSettler={onKiesSettler}
          onLegWegAan={onLegWegAan}
          onJaag={onJaag}
          onHakHout={onHakHout}
          onOpenStichtStad={onOpenStichtStad}
        />
      )}
    </>
  );
}

interface SettlerKaartProps {
  titel: string;
  slot: SettlerSlot;
  settler: Settler;
  actieGedaan: boolean;
  state: GameState;
  geselecteerd: boolean;
  toontKiesKnop: boolean;
  onKiesSettler: (slot: SettlerSlot) => void;
  onLegWegAan: (slot: SettlerSlot) => void;
  onJaag: (slot: SettlerSlot) => void;
  onHakHout: (slot: SettlerSlot) => void;
  onOpenStichtStad: (slot: SettlerSlot) => void;
}

function SettlerKaart({
  titel,
  slot,
  settler,
  actieGedaan,
  state,
  geselecteerd,
  toontKiesKnop,
  onKiesSettler,
  onLegWegAan,
  onJaag,
  onHakHout,
  onOpenStichtStad,
}: SettlerKaartProps) {
  const streek = state.streken.find((l) => l.hoogte === settler.hoogte);
  const huidigeTile = streek?.tiles[settler.positieInStreek];
  const kanActie = !actieGedaan;
  const heeftAlWeg = Boolean(huidigeTile?.heeftWeg);
  // Kuddes & houtkap (hoofdstuk 16/17, issue: "kuddes met dieren waar je op
  // kunt jagen voor voedsel" / "ook mag je je settlers inzetten om hout te
  // kappen"): allebei alleen mogelijk op het vakje waar de settler nu staat.
  const kudde = huidigeTile?.kudde;
  // Uitgeputte Houtkap (issue: "settler houthakken op verlaten tegel"): een
  // `ghost_town`-vakje behoudt terrein "bos" maar is al leeggekapt, dus de
  // knop mag daar niet verschijnen (zelfde eis als `hakHout` in economie.ts).
  const kanHakken = huidigeTile?.terrein === "bos" && huidigeTile.status !== "ghost_town";
  // Roofdier (hoofdstuk 14/17, issue: "roofdieren toevoegen"): zichtbaar op
  // de kaart (canvas.ts) én hier in tekst, zodat de speler ook zonder de
  // waarschuwings-pop-up nog eens terug te lezen weet hoeveel beurten er nog
  // zijn om weg te bewegen.
  const roofdier = huidigeTile?.roofdier;
  // Stad stichten (hoofdstuk 2/16, issue: "stad stichten op de frontier"):
  // beschikbaar zodra de settler op een geschikt (vers-water) leeg vakje
  // staat — los van de actie-vlag, dit is geen herhaalbare per-beurt-actie
  // zoals bewegen/jagen/hakken, maar de beslissende laatste zet.
  const kanStichtenHier = kanStichten(state, slot);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {titel}
        </strong>
        {toontKiesKnop && (
          <button
            className="fc-knop"
            disabled={geselecteerd}
            onClick={() => onKiesSettler(slot)}
            style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}
          >
            {geselecteerd ? "Bestuurd" : "Besturen"}
          </button>
        )}
      </div>
      <span>
        Streek {settler.hoogte}, vakje {settler.positieInStreek + 1}
        {heeftAlWeg ? " — hier ligt al een weg" : ""}
        {kudde ? ` — wilde kudde (nog ${kudde.beurtenResterend} beurten te jagen)` : ""}
        {roofdier ? " — een roofdier is hier gesignaleerd, beweeg de settler weg" : ""}
        {kanStichtenHier ? " — dit vakje ligt aan vers water: hier kan een stad gesticht worden" : ""}
      </span>
      {kanActie && (!toontKiesKnop || geselecteerd) && (
        <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
          Klik op een oplichtende tegel op de kaart om de settler daarheen te verplaatsen.
        </span>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        <button
          className="fc-knop"
          disabled={!kanActie || heeftAlWeg}
          onClick={() => onLegWegAan(slot)}
          style={{ padding: "0.3rem 0.6rem" }}
        >
          Weg aanleggen
        </button>
        {kudde && (
          <button className="fc-knop" disabled={!kanActie} onClick={() => onJaag(slot)} style={{ padding: "0.3rem 0.6rem" }}>
            Jagen (+3 voedsel)
          </button>
        )}
        {kanHakken && (
          <button
            className="fc-knop"
            disabled={!kanActie}
            onClick={() => onHakHout(slot)}
            style={{ padding: "0.3rem 0.6rem" }}
          >
            Hout hakken (+1 hout)
          </button>
        )}
        {kanStichtenHier && (
          <button className="fc-knop" onClick={() => onOpenStichtStad(slot)} style={{ padding: "0.3rem 0.6rem" }}>
            Stad stichten
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
