"use client";

import { useCallback, useEffect, useState } from "react";
import {
  confrontatie as confrontatieActie,
  maakInitieleSpelStatus,
  startBouw as startBouwActie,
  startGroei as startGroeiActie,
  startRecrutering as startRecruteringActie,
  volgendeBeurt as volgendeBeurtActie,
} from "./economie";
import { laadSpel, saveSpel } from "./save";
import { Improvement } from "./types";

// React-hook rond de spelstatus (M3). Geen aparte state-library nodig voor
// de MVP-omvang — één useState met pure update-functies uit economie.ts.
//
// Save/load (M9, hoofdstuk 13): de initiële render start altijd met een
// verse spelstatus, óók in de browser — zo blijft server- en client-render
// identiek (geen hydration mismatch). Pas ná mount wordt, uitsluitend op de
// client, een eventuele bewaarde run ingeladen. `geladen` voorkomt dat de
// autosave-effect hieronder die controle vóór is en de bestaande save
// overschrijft met de verse status.
export function useGameEngine() {
  const [state, setState] = useState(maakInitieleSpelStatus);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    const opgeslagenStatus = laadSpel();
    if (opgeslagenStatus) setState(opgeslagenStatus);
    setGeladen(true);
  }, []);

  useEffect(() => {
    if (!geladen) return;
    saveSpel(state);
  }, [state, geladen]);

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
