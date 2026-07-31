"use client";

import { useCallback, useState } from "react";
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
// via een menu"): elke keer dat de tutorial start (GameRoot mount, zie
// AppRoot) begint de run bij het begin, met een verse spelstatus — ook als er
// een bewaarde run klaarstaat (issue: "als je op SpelVerlaten hebt geklikt en
// daarna opnieuw de tutorial begint, dat je dan helemaal bij het begin
// begint"). Een bewaarde run wordt uitsluitend teruggehaald als de speler
// zelf bewust op "Spel laden" drukt (`laden` hieronder) — geen automatisch
// laden bij mount.
export function useGameEngine() {
  const [state, setState] = useState(maakInitieleSpelStatus);

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
