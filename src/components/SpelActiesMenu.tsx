"use client";

interface SpelActiesMenuProps {
  onToonHistorie: () => void;
}

// Zwevend spel-icoontje onder het hoofdmenu (issue: "onder het menu-icoontje
// mag dan een game-icoontje komen"): opent het historiescherm van deze run.
// Het militair-paneel togglen zat hier voorheen ook, maar is verplaatst naar
// het stadsmenu (issue: "city improvement menu toevoegen" — alle acties die
// in losse dozen stonden horen daar nu, samen met de rest, bij elkaar).
export default function SpelActiesMenu({ onToonHistorie }: SpelActiesMenuProps) {
  return (
    <div style={{ position: "fixed", top: "3.2rem", right: "0.75rem", zIndex: 50 }}>
      <button
        className="fc-knop"
        onClick={onToonHistorie}
        aria-label="Historie"
        style={{ padding: "0.4rem 0.65rem", fontSize: "1rem", lineHeight: 1 }}
      >
        ⚔
      </button>
    </div>
  );
}
