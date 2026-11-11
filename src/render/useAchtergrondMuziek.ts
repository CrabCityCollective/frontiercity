"use client";

import { useEffect } from "react";
import { startAchtergrondMuziek } from "./achtergrondMuziek";
import { startMenuMuziek } from "./menuMuziek";

// Speelt muziek zolang `actief` waar is. `soort` "spel" (issue #575): de
// banjo/gitaar-muziek tijdens de Going West-campagne, niet in de tutorial.
// `soort` "menu" (issue #577): gitaar/sitar/didgeridoo voor titel-, menu-,
// campagne-select- en introscherm. Browsers blokkeren audio tot een
// gebruikersgebaar, dus bij een geblokkeerde start wachten we op de
// eerstvolgende klik/tik.
export function useAchtergrondMuziek(actief: boolean, soort: "spel" | "menu" = "spel"): void {
  useEffect(() => {
    if (!actief) return;
    const start = soort === "menu" ? startMenuMuziek : startAchtergrondMuziek;
    let muziek = start();
    function opGebaar() {
      if (!muziek) muziek = start();
    }
    window.addEventListener("pointerdown", opGebaar);
    return () => {
      window.removeEventListener("pointerdown", opGebaar);
      muziek?.stop();
    };
  }, [actief, soort]);
}
