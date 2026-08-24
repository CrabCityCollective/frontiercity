"use client";

import { GameState } from "@/game/types";
import { WAMPANOAG_STREEK_HOOGTE } from "@/game/worldGoingWest";

// Wampanoag-statusbalk (Going West, M21e, opdracht-wampanoag-opening.md §5) —
// zelfde "puur status, rechtstreeks op de kaart, geen pop-up"-patroon als
// BezetteStreekPaneel: alle acties (verkenner sturen) lopen via een klik op
// het vakje zelf (TileInfoPopup: `verkenningVraag`, zie GameRoot). Dit
// balkje toont alleen de onthullings-voortgang van de drie vaste
// Wampanoag-vakjes en welke verkenner(s) onderweg zijn — er is in deze slice
// nog geen handel (M21f), dus geen ruilstatus te tonen.
export default function WampanoagPaneel({ state }: { state: GameState }) {
  const streek = state.streken.find((s) => s.hoogte === WAMPANOAG_STREEK_HOOGTE);
  if (!streek) return null;

  // `wampanoagInhoud` blijft ook ná onthulling gezet (wampanoag.ts wist
  // alleen `wampanoagVerhuld`/`wampanoagVerkenningInGang`) — dus dit is
  // betrouwbaar de vaste set van drie Wampanoag-vakjes, ongeacht hun huidige
  // onthullingsstatus.
  const wampanoagTiles = streek.tiles.filter((tile) => tile.wampanoagInhoud !== undefined);
  if (wampanoagTiles.length === 0) return null;

  const onthuldAantal = wampanoagTiles.filter((tile) => !tile.wampanoagVerhuld).length;
  // Zodra alles onthuld is, valt er in deze slice niets meer te melden — geen
  // handel-UI hier (M21f), dus het balkje verdwijnt net als BezetteStreekPaneel
  // verdwijnt zodra de Bezette Streek is opgelost.
  if (onthuldAantal === wampanoagTiles.length) return null;

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
      <span style={{ color: "var(--kleur-tekst-gedempt)" }}>
        Klik een verhuld vakje om een verkenner te sturen. {onthuldAantal}/{wampanoagTiles.length} vakjes onthuld.
      </span>

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
    </div>
  );
}
