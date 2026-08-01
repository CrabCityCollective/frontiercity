"use client";

import { useCallback, useState } from "react";
import {
  bemanWachttoren as bemanWachttorenActie,
  bevestigGedwongenTribuut as bevestigGedwongenTribuutActie,
  bevestigIneenstorting as bevestigIneenstortingActie,
  confrontatie as confrontatieActie,
  geefTribuut as geefTribuutActie,
  haalStrijderTerug as haalStrijderTerugActie,
  hakHout as hakHoutActie,
  jaag as jaagActie,
  legWegAan as legWegAanActie,
  maakInitieleSpelStatus,
  sluitBouwKeuze as sluitBouwKeuzeActie,
  sluitIndringersMelding as sluitIndringersMeldingActie,
  startBouw as startBouwActie,
  startGroei as startGroeiActie,
  startRecrutering as startRecruteringActie,
  verplaatsSettlerNaar as verplaatsSettlerNaarActie,
  volgendeBeurt as volgendeBeurtActie,
  weigerTribuut as weigerTribuutActie,
  zetUitlegPopups as zetUitlegPopupsActie,
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

  const verplaatsSettlerNaar = useCallback((hoogte: number, positieInLaag: number) => {
    setState((huidig) => verplaatsSettlerNaarActie(huidig, hoogte, positieInLaag));
  }, []);

  const legWegAan = useCallback(() => {
    setState((huidig) => legWegAanActie(huidig));
  }, []);

  const jaag = useCallback(() => {
    setState((huidig) => jaagActie(huidig));
  }, []);

  const hakHout = useCallback(() => {
    setState((huidig) => hakHoutActie(huidig));
  }, []);

  const sluitIndringersMelding = useCallback(() => {
    setState((huidig) => sluitIndringersMeldingActie(huidig));
  }, []);

  const geefTribuut = useCallback(() => {
    setState((huidig) => geefTribuutActie(huidig));
  }, []);

  const weigerTribuut = useCallback(() => {
    setState((huidig) => weigerTribuutActie(huidig));
  }, []);

  const bevestigGedwongenTribuut = useCallback(() => {
    setState((huidig) => bevestigGedwongenTribuutActie(huidig));
  }, []);

  const bemanWachttoren = useCallback((strijderId: string, hoogte: number, positieInLaag: number) => {
    setState((huidig) => bemanWachttorenActie(huidig, strijderId, hoogte, positieInLaag));
  }, []);

  const haalStrijderTerug = useCallback((strijderId: string) => {
    setState((huidig) => haalStrijderTerugActie(huidig, strijderId));
  }, []);

  const zetUitlegPopups = useCallback((aan: boolean) => {
    setState((huidig) => zetUitlegPopupsActie(huidig, aan));
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
    verplaatsSettlerNaar,
    legWegAan,
    jaag,
    hakHout,
    sluitIndringersMelding,
    geefTribuut,
    weigerTribuut,
    bevestigGedwongenTribuut,
    bemanWachttoren,
    haalStrijderTerug,
    zetUitlegPopups,
    opslaan,
    laden,
  };
}
