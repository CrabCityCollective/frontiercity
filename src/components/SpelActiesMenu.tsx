"use client";

import { useState } from "react";

interface SpelActiesMenuProps {
  toonMilitair: boolean;
  onToggleMilitair: () => void;
  onToonHistorie: () => void;
}

// Zwevend spel-icoontje onder het hoofdmenu (issue: "onder het menu-icoontje
// mag dan een game-icoontje komen"): militair-paneel togglen (hoeft niet
// constant in beeld) en het historiescherm van deze run openen.
export default function SpelActiesMenu({ toonMilitair, onToggleMilitair, onToonHistorie }: SpelActiesMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", top: "3.2rem", right: "0.75rem", zIndex: 50 }}>
      <button
        className="fc-knop"
        onClick={() => setOpen((v) => !v)}
        aria-label="Spelmenu"
        style={{ padding: "0.4rem 0.65rem", fontSize: "1rem", lineHeight: 1 }}
      >
        ⚔
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
              onToggleMilitair();
              setOpen(false);
            }}
            style={{ padding: "0.35rem 0.75rem" }}
          >
            {toonMilitair ? "Militair verbergen" : "Militair tonen"}
          </button>
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
        </div>
      )}
    </div>
  );
}
