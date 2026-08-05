"use client";

import { useCallback, useState } from "react";
import {
  bemanLegerkamp as bemanLegerkampActie,
  bemanWachttoren as bemanWachttorenActie,
  bevestigGedwongenTribuut as bevestigGedwongenTribuutActie,
  bevestigIneenstorting as bevestigIneenstortingActie,
  confrontatieBezetteLaag as confrontatieBezetteLaagActie,
  geefTribuut as geefTribuutActie,
  haalStrijderTerug as haalStrijderTerugActie,
  hakHout as hakHoutActie,
  jaag as jaagActie,
  kiesGeefTribuut as kiesGeefTribuutActie,
  kiesTech as kiesTechActie,
  legWegAan as legWegAanActie,
  maakInitieleSpelStatus,
  sluitAmberOntdektMelding as sluitAmberOntdektMeldingActie,
  sluitBezetteLaagOntdektMelding as sluitBezetteLaagOntdektMeldingActie,
  sluitBouwKeuze as sluitBouwKeuzeActie,
  sluitIndringersMelding as sluitIndringersMeldingActie,
  sluitKuddeMelding as sluitKuddeMeldingActie,
  sluitRoofdierMelding as sluitRoofdierMeldingActie,
  sluitVijandelijkHeiligdomOnthuldMelding as sluitVijandelijkHeiligdomOnthuldMeldingActie,
  sluitVijandelijkHeiligdomVernietigdMelding as sluitVijandelijkHeiligdomVernietigdMeldingActie,
  startBouw as startBouwActie,
  startGroei as startGroeiActie,
  startMissionarisRecrutering as startMissionarisRecruteringActie,
  startNieuweSettler as startNieuweSettlerActie,
  startCityVerbetering as startCityVerbeteringActie,
  startOpslagplaats as startOpslagplaatsActie,
  startRecrutering as startRecruteringActie,
  startVerkennerRecrutering as startVerkennerRecruteringActie,
  stichtStad as stichtStadActie,
  verken as verkenActie,
  verplaatsSettlerNaar as verplaatsSettlerNaarActie,
  versnelBouwMetGoud as versnelBouwMetGoudActie,
  versnelCityVerbeteringMetGoud as versnelCityVerbeteringMetGoudActie,
  versnelCivielMetGoud as versnelCivielMetGoudActie,
  versnelOpslagplaatsMetGoud as versnelOpslagplaatsMetGoudActie,
  volgendeBeurt as volgendeBeurtActie,
  weigerTribuut as weigerTribuutActie,
  zetUitlegPopups as zetUitlegPopupsActie,
} from "./economie";
import { laadSpel, saveSpel } from "./save";
import { Improvement, TechId } from "./types";

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

  const startNieuweSettler = useCallback(() => {
    setState((huidig) => startNieuweSettlerActie(huidig));
  }, []);

  const startOpslagplaats = useCallback(() => {
    setState((huidig) => startOpslagplaatsActie(huidig));
  }, []);

  // Stadsverbeteringen (hoofdstuk 3/4/11/14, issue: "city improvements" Deel
  // 1/3) — zelfde dunne wrapper-conventie als hierboven.
  const startCityVerbetering = useCallback((improvement: Improvement) => {
    setState((huidig) => startCityVerbeteringActie(huidig, improvement));
  }, []);

  const versnelCityVerbeteringMetGoud = useCallback(() => {
    setState((huidig) => versnelCityVerbeteringMetGoudActie(huidig));
  }, []);

  const stichtStad = useCallback(() => {
    setState((huidig) => stichtStadActie(huidig));
  }, []);

  const startRecrutering = useCallback(() => {
    setState((huidig) => startRecruteringActie(huidig));
  }, []);

  const confrontatieBezetteLaag = useCallback((positieInLaag: number) => {
    setState((huidig) => confrontatieBezetteLaagActie(huidig, positieInLaag));
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

  const sluitKuddeMelding = useCallback(() => {
    setState((huidig) => sluitKuddeMeldingActie(huidig));
  }, []);

  const sluitRoofdierMelding = useCallback(() => {
    setState((huidig) => sluitRoofdierMeldingActie(huidig));
  }, []);

  const sluitAmberOntdektMelding = useCallback(() => {
    setState((huidig) => sluitAmberOntdektMeldingActie(huidig));
  }, []);

  const versnelBouwMetGoud = useCallback((hoogte: number, positieInLaag: number) => {
    setState((huidig) => versnelBouwMetGoudActie(huidig, hoogte, positieInLaag));
  }, []);

  const versnelCivielMetGoud = useCallback(() => {
    setState((huidig) => versnelCivielMetGoudActie(huidig));
  }, []);

  const versnelOpslagplaatsMetGoud = useCallback(() => {
    setState((huidig) => versnelOpslagplaatsMetGoudActie(huidig));
  }, []);

  const geefTribuut = useCallback(() => {
    setState((huidig) => geefTribuutActie(huidig));
  }, []);

  const kiesGeefTribuut = useCallback(() => {
    setState((huidig) => kiesGeefTribuutActie(huidig));
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

  const kiesTech = useCallback((techId: TechId) => {
    setState((huidig) => kiesTechActie(huidig, techId));
  }, []);

  // Bezette Laag, Missionaris & Verkenner (hoofdstuk 6, issue: "De Bezette
  // Laag, missionaris en verkenner") — zelfde dunne wrapper-conventie als
  // hierboven.
  const verken = useCallback((positieInLaag: number) => {
    setState((huidig) => verkenActie(huidig, positieInLaag));
  }, []);

  const startVerkennerRecrutering = useCallback(() => {
    setState((huidig) => startVerkennerRecruteringActie(huidig));
  }, []);

  const startMissionarisRecrutering = useCallback(() => {
    setState((huidig) => startMissionarisRecruteringActie(huidig));
  }, []);

  const bemanLegerkamp = useCallback((strijderId: string, hoogte: number, positieInLaag: number) => {
    setState((huidig) => bemanLegerkampActie(huidig, strijderId, hoogte, positieInLaag));
  }, []);

  const sluitBezetteLaagOntdektMelding = useCallback(() => {
    setState((huidig) => sluitBezetteLaagOntdektMeldingActie(huidig));
  }, []);

  const sluitVijandelijkHeiligdomOnthuldMelding = useCallback(() => {
    setState((huidig) => sluitVijandelijkHeiligdomOnthuldMeldingActie(huidig));
  }, []);

  const sluitVijandelijkHeiligdomVernietigdMelding = useCallback(() => {
    setState((huidig) => sluitVijandelijkHeiligdomVernietigdMeldingActie(huidig));
  }, []);

  return {
    state,
    volgendeBeurt,
    startBouw,
    sluitBouwKeuze,
    startGroei,
    startNieuweSettler,
    startOpslagplaats,
    startCityVerbetering,
    versnelCityVerbeteringMetGoud,
    stichtStad,
    startRecrutering,
    bevestigIneenstorting,
    verplaatsSettlerNaar,
    legWegAan,
    jaag,
    hakHout,
    sluitIndringersMelding,
    sluitKuddeMelding,
    sluitRoofdierMelding,
    sluitAmberOntdektMelding,
    versnelBouwMetGoud,
    versnelCivielMetGoud,
    versnelOpslagplaatsMetGoud,
    geefTribuut,
    kiesGeefTribuut,
    weigerTribuut,
    bevestigGedwongenTribuut,
    bemanWachttoren,
    haalStrijderTerug,
    zetUitlegPopups,
    kiesTech,
    verken,
    startVerkennerRecrutering,
    startMissionarisRecrutering,
    bemanLegerkamp,
    confrontatieBezetteLaag,
    sluitBezetteLaagOntdektMelding,
    sluitVijandelijkHeiligdomOnthuldMelding,
    sluitVijandelijkHeiligdomVernietigdMelding,
    opslaan,
    laden,
  };
}
