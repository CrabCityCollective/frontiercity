"use client";

import { useCallback, useState } from "react";
import { maakInitieleSpelStatus, startBouw as startBouwActie, volgendeBeurt as volgendeBeurtActie } from "./economie";
import { Improvement } from "./types";

// React-hook rond de spelstatus (M3). Geen aparte state-library nodig voor
// de MVP-omvang — één useState met pure update-functies uit economie.ts.
export function useGameEngine() {
  const [state, setState] = useState(maakInitieleSpelStatus);

  const volgendeBeurt = useCallback(() => {
    setState((huidig) => volgendeBeurtActie(huidig));
  }, []);

  const startBouw = useCallback((laagHoogte: number, improvement: Improvement) => {
    setState((huidig) => startBouwActie(huidig, laagHoogte, improvement));
  }, []);

  return { state, volgendeBeurt, startBouw };
}
