"use client";

import { useCallback, useEffect, useState } from "react";
import {
  bevestigIneenstorting as bevestigIneenstortingActie,
  confrontatie as confrontatieActie,
  maakInitieleSpelStatus,
  sluitBouwKeuze as sluitBouwKeuzeActie,
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
// Save/load (M9, hoofdstuk 13; issue: "niet automatisch opslaan, maar bewust
// via een menu"): de initiële render start altijd met een verse spelstatus,
// óók in de browser — zo blijft server- en client-render identiek (geen
// hydration mismatch). Pas ná mount wordt, uitsluitend op de client, een
// eventuele bewaarde run ingeladen (hervatten waar je gebleven was). Daarna
// gebeurt opslaan/laden alleen nog bewust via `opslaan`/`laden` hieronder —
// geen autosave-effect meer dat bij elke state-wijziging wegschrijft.
export function useGameEngine() {
  const [state, setState] = useState(maakInitieleSpelStatus);

  useEffect(() => {
    const opgeslagenStatus = laadSpel();
    if (opgeslagenStatus) setState(opgeslagenStatus);
  }, []);

  const opslaan = useCallback(() => {
    saveSpel(state);
  }, [state]);

  const laden = useCallback(() => {
    const opgeslagenStatus = laadSpel();
    if (opgeslagenStatus) setState(opgeslagenStatus);
  }, []);

  const volgendeBeurt = useCallback(() => {
    setState((huidig) => volgendeBeurtActie(huidig));
  }, []);

  const startBouw = useCallback(
    (laagHoogte: number, improvement: Improvement, positieInLaag: number) => {
      setState((huidig) => startBouwActie(huidig, laagHoogte, improvement, positieInLaag));
    },
    []
  );

  const sluitBouwKeuze = useCallback(() => {
    setState((huidig) => sluitBouwKeuzeActie(huidig));
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

  const bevestigIneenstorting = useCallback(() => {
    setState((huidig) => bevestigIneenstortingActie(huidig));
  }, []);

  return {
    state,
    volgendeBeurt,
    startBouw,
    sluitBouwKeuze,
    startGroei,
    startRecrutering,
    confrontatie,
    bevestigIneenstorting,
    opslaan,
    laden,
  };
}
