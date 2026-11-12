"use client";

import { useEffect } from "react";
import { speelKlik } from "./geluidseffecten";

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
    document.addEventListener("click", opKlik, true);
    return () => document.removeEventListener("click", opKlik, true);
  }, []);
}
