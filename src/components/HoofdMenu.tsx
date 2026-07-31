"use client";

import { useState } from "react";

interface HoofdMenuProps {
  onOpslaan: () => void;
  onLaden: () => void;
  kanLaden: boolean;
  onVerlaten: () => void;
}

// Zwevend menu-icoontje rechtsboven (issue: "niet automatisch opslaan, maar
// een menu-icoontje ... opslaan en oudere games ... inladen ... spel
// verlaten"). Puur een klein pop-overpaneel — geen navigatie-state, dat blijft
// bij AppRoot/GameRoot.
export default function HoofdMenu({ onOpslaan, onLaden, kanLaden, onVerlaten }: HoofdMenuProps) {
  const [open, setOpen] = useState(false);

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
              onOpslaan();
              setOpen(false);
            }}
            style={{ padding: "0.35rem 0.75rem" }}
          >
            Opslaan
          </button>
          <button
            className="fc-knop"
            disabled={!kanLaden}
            onClick={() => {
              onLaden();
              setOpen(false);
            }}
            style={{ padding: "0.35rem 0.75rem" }}
          >
            Laden
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
    </div>
  );
}
