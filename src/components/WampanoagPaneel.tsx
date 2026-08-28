"use client";

import { GameState } from "@/game/types";
import { heeftWampanoagHandelsdrempelGehaald, WAMPANOAG_GOED_LABELS, WAMPANOAG_HANDELSDREMPEL } from "@/game/wampanoag";
import { WAMPANOAG_STREEK_HOOGTE } from "@/game/worldGoingWest";

// Wampanoag-statusbalk (Going West, M21e/M21f, opdracht-wampanoag-opening.md
// §5/§6) — zelfde "puur status, rechtstreeks op de kaart, geen pop-up"-
// patroon als BezetteStreekPaneel: alle acties (verkenner sturen,
// grondstofkeuze) lopen via een klik op het vakje zelf (TileInfoPopup:
// `verkenningVraag`/`wampanoagHandelVraag`, zie GameRoot). Dit balkje toont
// de onthullings-voortgang van de vijf vaste Wampanoag-vakjes (de drie
// handelsvakjes + de twee decoratieve tentjes, issue "Wampanoag kamp
// uitbreiding"), welke verkenner(s) onderweg zijn, én (M21f) de lopende
// 3-3-3-handelsvoortgang — blijft daarom zichtbaar nadat alle vijf vakjes
// onthuld zijn, i.t.t. de eerdere M21e-versie. Verdwijnt (net als
// BezetteStreekPaneel bij een opgeloste Bezette Streek) zodra de 3-3-3-drempel gehaald is
// (`heeftWampanoagHandelsdrempelGehaald`, wampanoag.ts) — de openingsfase is
// dan voorbij, dit balkje hoort daarna niet meer op de kaart te staan.
// Herzien door issue "Wampanoag streek pas helemaal onthuld na handel": niet
// langer op `cultureelOntgrendeld` gegated — dat volgt sindsdien de Smederij
// i.p.v. de handelsdrempel, en die twee lopen niet meer per se gelijk op.
export default function WampanoagPaneel({ state }: { state: GameState }) {
  if (heeftWampanoagHandelsdrempelGehaald(state)) return null;
  const streek = state.streken.find((s) => s.hoogte === WAMPANOAG_STREEK_HOOGTE);
  if (!streek) return null;

  // `wampanoagInhoud` blijft ook ná onthulling gezet (wampanoag.ts wist
  // alleen `wampanoagVerhuld`/`wampanoagVerkenningInGang`) — dus dit is
  // betrouwbaar de vaste set van vijf Wampanoag-vakjes, ongeacht hun huidige
  // onthullingsstatus.
  const wampanoagTiles = streek.tiles.filter((tile) => tile.wampanoagInhoud !== undefined);
  if (wampanoagTiles.length === 0) return null;

  const onthuldAantal = wampanoagTiles.filter((tile) => !tile.wampanoagVerhuld).length;
  const onderwegTiles = wampanoagTiles.filter((tile) => tile.wampanoagVerkenningInGang);

  return (
    <div
      className="fc-paneel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
        padding: "0.5rem 0.9rem",
        fontSize: "0.85rem",
        margin: "0.5rem",
      }}
    >
      <strong className="fc-heading" style={{ color: "var(--kleur-mos)" }}>
        Wampanoag — streek {streek.hoogte}
      </strong>
      {onthuldAantal < wampanoagTiles.length && (
        <span style={{ color: "var(--kleur-tekst-gedempt)" }}>
          Klik een verhuld vakje om een verkenner te sturen. {onthuldAantal}/{wampanoagTiles.length} vakjes onthuld.
        </span>
      )}

      {onderwegTiles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          {onderwegTiles.map((tile) => (
            <span key={tile.positieInStreek}>
              Verkenner onderweg naar vakje {tile.positieInStreek} — nog {tile.wampanoagVerkenningInGang!.beurtenResterend}{" "}
              {tile.wampanoagVerkenningInGang!.beurtenResterend === 1 ? "beurt" : "beurten"}.
            </span>
          ))}
        </div>
      )}

      {/* Handelsvoortgang (M21f, opdracht-wampanoag-opening.md §6) — klikbaar
          via het vakje zelf, hier alleen de uitlees-status, ook als er nog
          niets gehandeld wordt (alle waarden beginnen op 0). */}
      <span style={{ color: "var(--kleur-tekst-gedempt)" }}>
        Handel: {WAMPANOAG_GOED_LABELS.bevervellen} {state.bevervellen}/{WAMPANOAG_HANDELSDREMPEL}, {" "}
        {WAMPANOAG_GOED_LABELS.mais} {state.mais}/{WAMPANOAG_HANDELSDREMPEL}, {" "}
        {WAMPANOAG_GOED_LABELS.wampum} {state.wampum}/{WAMPANOAG_HANDELSDREMPEL}
      </span>
    </div>
  );
}
