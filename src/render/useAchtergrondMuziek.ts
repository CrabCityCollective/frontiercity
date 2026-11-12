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
    // De AudioContext wordt pas aangemaakt als de browser audio toestaat: een
    // context die vóór een gebaar is gemaakt blijft `suspended` en een
    // bestaand (niet-null) resultaat zou de gebaar-listener nooit meer laten
    // starten.
    let muziek: { stop: () => void } | null = null;
    // Bewust géén `pointerdown`: dat telt in Chrome niet als activerend gebaar
    // voor audio, dus een context die daar gemaakt wordt blijft `suspended`
    // (en de listener werd daarna opgeruimd). `pointerup`/`click`/`keydown`/
    // `touchend` activeren de pagina wel.
    const gebaren = ["pointerup", "click", "keydown", "touchend"] as const;
    function ruimOp() {
      for (const g of gebaren) window.removeEventListener(g, opGebaar, true);
    }
    function opGebaar() {
      if (muziek) return;
      muziek = start();
      if (muziek) ruimOp();
    }
    const nav = navigator as Navigator & { userActivation?: { hasBeenActive: boolean } };
    if (nav.userActivation?.hasBeenActive) {
      muziek = start();
    }
    if (!muziek) {
      for (const g of gebaren) window.addEventListener(g, opGebaar, true);
    }
    return () => {
      ruimOp();
      muziek?.stop();
    };
  }, [actief, soort]);
}
