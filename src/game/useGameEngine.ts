"use client";

import { useCallback, useState } from "react";
import {
  confrontatie as confrontatieActie,
  maakInitieleSpelStatus,
  startBouw as startBouwActie,
  startGroei as startGroeiActie,
  startRecrutering as startRecruteringActie,
  volgendeBeurt as volgendeBeurtActie,
} from "./economie";
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

  const startGroei = useCallback(() => {
    setState((huidig) => startGroeiActie(huidig));
  }, []);

  const startRecrutering = useCallback(() => {
    setState((huidig) => startRecruteringActie(huidig));
  }, []);

  const confrontatie = useCallback(() => {
    setState((huidig) => confrontatieActie(huidig));
  }, []);

  return { state, volgendeBeurt, startBouw, startGroei, startRecrutering, confrontatie };
}
