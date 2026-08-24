"use client";

import { useState } from "react";
import { GrafischeStijl } from "@/game/save";
import SpelInstellingenPopup from "./SpelInstellingenPopup";

interface HoofdMenuProps {
  onVerlaten: () => void;
  // Per-run uitleg-pop-ups-toggle (issue: "een nieuwe optie erbij in het
  // menu waar nu ook 'spel verlaten' staat, waarmee je voor deze run
  // specifiek de uitleg popups aan kunt zetten, en uit") — sinds issue
  // "Settings uitbreiden" bereikbaar via de "Instellingen"-knop hieronder in
  // plaats van een losse knop hier in het menu zelf.
  uitlegAan: boolean;
  onToggleUitleg: () => void;
  // On-the-fly grafische-stijl-toggle (issue: "Settings uitbreiden" — "een
  // button ... waarmee je on the fly kunt wisselen tussen pixel art en
  // vector art"), zelfde plek in de instellingen-pop-up als de uitleg-toggle
  // hierboven.
  stijl: GrafischeStijl;
  onToggleStijl: () => void;
  // Historie-knop (issue: "Settings uitbreiden" — "de historie van de run
  // toevoegen aan het menu, ipv dat het een zelfstandige button is"):
  // vervangt het losse spel-icoontje dat hiervoor bestond (SpelActiesMenu).
  onToonHistorie: () => void;
  // Techboom-knop (issue: "tech tree inzien" — "kun je in het menu een item
  // erbij maken om de tech tree in te zien"): zelfde plek/patroon als
  // "Historie" hierboven.
  onToonTechboom: () => void;
  // Economie-overzicht-knop (issue: "Economie overzicht" — "bij het menu een
  // knop waarop je een economie overzicht kunt inzien"): zelfde plek/patroon
  // als "Historie"/"Techboom" hierboven.
  onToonEconomie: () => void;
}

// Zwevend menu-icoontje rechtsboven (issue: "niet automatisch opslaan, maar
// een menu-icoontje ... opslaan en oudere games ... inladen ... spel
// verlaten"; issue #306 "Auto save implementeren": de "Opslaan"- en
// "Laden"-knoppen zijn hier weer weg — de run wordt nu automatisch bewaard,
// zie useGameEngine.ts). Puur een klein pop-overpaneel — geen navigatie-state,
// dat blijft bij AppRoot/GameRoot.
export default function HoofdMenu({
  onVerlaten,
  uitlegAan,
  onToggleUitleg,
  stijl,
  onToggleStijl,
  onToonHistorie,
  onToonTechboom,
  onToonEconomie,
}: HoofdMenuProps) {
  const [open, setOpen] = useState(false);
  const [toonInstellingen, setToonInstellingen] = useState(false);

  return (
    <div style={{ position: "fixed", top: "0.75rem", right: "0.75rem", zIndex: 50 }}>
      <button
        className="fc-knop"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        style={{ padding: "0.4rem 0.65rem", fontSize: "1rem", lineHeight: 1 }}
      >
        ☰
      </button>

      {open && (
        <div
          className="fc-paneel"
          style={{
            position: "absolute",
            top: "calc(100% + 0.4rem)",
            right: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            padding: "0.6rem",
            minWidth: "10rem",
          }}
        >
          <button
            className="fc-knop"
            onClick={() => {
              onToonHistorie();
              setOpen(false);
            }}
            style={{ padding: "0.35rem 0.75rem" }}
          >
            Historie
          </button>
          <button
            className="fc-knop"
            onClick={() => {
              onToonTechboom();
              setOpen(false);
            }}
            style={{ padding: "0.35rem 0.75rem" }}
          >
            Techboom
          </button>
          <button
            className="fc-knop"
            onClick={() => {
              onToonEconomie();
              setOpen(false);
            }}
            style={{ padding: "0.35rem 0.75rem" }}
          >
            Economie
          </button>
          <button
            className="fc-knop"
            onClick={() => {
              setToonInstellingen(true);
              setOpen(false);
            }}
            style={{ padding: "0.35rem 0.75rem" }}
          >
            Instellingen
          </button>
          <button
            className="fc-knop"
            onClick={() => {
              setOpen(false);
              onVerlaten();
            }}
            style={{ padding: "0.35rem 0.75rem" }}
          >
            Spel verlaten
          </button>
        </div>
      )}

      {toonInstellingen && (
        <SpelInstellingenPopup
          uitlegAan={uitlegAan}
          onToggleUitleg={onToggleUitleg}
          stijl={stijl}
          onToggleStijl={onToggleStijl}
          onSluiten={() => setToonInstellingen(false)}
        />
      )}
    </div>
  );
}
