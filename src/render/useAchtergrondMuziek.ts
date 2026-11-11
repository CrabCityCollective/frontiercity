"use client";

import { useEffect } from "react";
import { startAchtergrondMuziek } from "./achtergrondMuziek";

// Speelt de achtergrondmuziek zolang `actief` waar is (issue #575: alleen
// tijdens de Going West-campagne, niet in de tutorial). Browsers blokkeren
// audio tot een gebruikersgebaar, dus bij een geblokkeerde start wachten we
// op de eerstvolgende klik/tik.
export function useAchtergrondMuziek(actief: boolean): void {
  useEffect(() => {
    if (!actief) return;
    let muziek = startAchtergrondMuziek();
    function opGebaar() {
      if (!muziek) muziek = startAchtergrondMuziek();
    }
    window.addEventListener("pointerdown", opGebaar);
    return () => {
      window.removeEventListener("pointerdown", opGebaar);
      muziek?.stop();
    };
  }, [actief]);
}
