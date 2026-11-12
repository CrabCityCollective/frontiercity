"use client";

import { useEffect } from "react";
import { ontgrendelGeluid, speelKlik } from "./geluidseffecten";

// Speelt een klikgeluid bij elke knop (hoofdmenu, ingame-menu, sluit-knoppen,
// pop-ups) via één globale listener (issue #583).
export function useKlikGeluid(): void {
  useEffect(() => {
    function opKlik(e: MouseEvent) {
      const doel = e.target;
      if (!(doel instanceof Element)) return;
      const knop = doel.closest("button, [role=button]");
      if (!knop || (knop as HTMLButtonElement).disabled) return;
      speelKlik();
    }
    // Ontgrendel audio bij elk echt gebaar (pointerdown telt in Chrome niet).
    const gebaren = ["pointerup", "touchend", "keydown", "click"] as const;
    for (const g of gebaren) window.addEventListener(g, ontgrendelGeluid, true);
    document.addEventListener("click", opKlik, true);
    return () => {
      for (const g of gebaren) window.removeEventListener(g, ontgrendelGeluid, true);
      document.removeEventListener("click", opKlik, true);
    };
  }, []);
}
