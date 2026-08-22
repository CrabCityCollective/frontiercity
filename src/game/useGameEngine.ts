"use client";

import { useCallback, useState } from "react";
import {
  SettlerSlot,
  hakHout as hakHoutActie,
  jaag as jaagActie,
  legWegAan as legWegAanActie,
  stichtStad as stichtStadActie,
  verplaatsSettlerNaar as verplaatsSettlerNaarActie,
} from "./acties";
import { versnelBouwMetGoud as versnelBouwMetGoudActie } from "./bouwwachtrij";
import {
  beurtMagAutomatischDoorgaan,
  maakInitieleSpelStatus,
  volgendeBeurt as volgendeBeurtActie,
  zetUitlegPopups as zetUitlegPopupsActie,
} from "./economie";
import {
  startCityVerbetering as startCityVerbeteringActie,
  startGroei as startGroeiActie,
  startMissionarisRecrutering as startMissionarisRecruteringActie,
  startNieuweSettler as startNieuweSettlerActie,
  startOpslagplaats as startOpslagplaatsActie,
  startRecrutering as startRecruteringActie,
  startTweedeSettler as startTweedeSettlerActie,
  versnelCityVerbeteringMetGoud as versnelCityVerbeteringMetGoudActie,
  versnelCivielMetGoud as versnelCivielMetGoudActie,
  versnelOpslagplaatsMetGoud as versnelOpslagplaatsMetGoudActie,
} from "./groeiEnRekrutering";
import {
  bevestigAmberOnderVuur as bevestigAmberOnderVuurActie,
  bevestigGedwongenTribuut as bevestigGedwongenTribuutActie,
  geefTribuut as geefTribuutActie,
  kiesGeefTribuut as kiesGeefTribuutActie,
  sluitIndringersMelding as sluitIndringersMeldingActie,
  sluitKuddeMelding as sluitKuddeMeldingActie,
  sluitRoofdierMelding as sluitRoofdierMeldingActie,
  weigerTribuut as weigerTribuutActie,
} from "./indringersEnDieren";
import {
  sluitAmberOntdektMelding as sluitAmberOntdektMeldingActie,
  sluitBezetteStreekOntdektMelding as sluitBezetteStreekOntdektMeldingActie,
  sluitTweedeAmberOntdektMelding as sluitTweedeAmberOntdektMeldingActie,
  sluitVijandelijkHeiligdomOnthuldMelding as sluitVijandelijkHeiligdomOnthuldMeldingActie,
  sluitVijandelijkHeiligdomVeroverdMelding as sluitVijandelijkHeiligdomVeroverdMeldingActie,
  stuurMissionaris as stuurMissionarisActie,
  stuurVerkenner as stuurVerkennerActie,
} from "./streekOntgrendeling";
import { sluitBouwKeuze as sluitBouwKeuzeActie, startBouw as startBouwActie } from "./infrastructuurEnBouw";
import {
  bemanLegerkamp as bemanLegerkampActie,
  bemanWachttoren as bemanWachttorenActie,
  confrontatieBezetteStreek as confrontatieBezetteStreekActie,
  haalStrijderTerug as haalStrijderTerugActie,
} from "./militair";
import { laadSpel, saveSpel } from "./save";
import { kiesTech as kiesTechActie } from "./tech";
import { bevestigIneenstorting as bevestigIneenstortingActie } from "./uitputtingEnVerval";
import { GameState, Improvement, TechId } from "./types";

// Ketent een `volgendeBeurt` vast aan het resultaat van een settler-actie of
// bouwkeuze zodra er niets meer te doen valt deze beurt (issue: "beurt
// button helemaal weg" — zie `beurtMagAutomatischDoorgaan` in economie.ts
// voor de precieze voorwaarde).
function metAutomatischeVolgendeBeurt(state: GameState): GameState {
  return beurtMagAutomatischDoorgaan(state) ? volgendeBeurtActie(state) : state;
}

// React-hook rond de spelstatus (M3). Geen aparte state-library nodig voor
// de MVP-omvang — één useState met pure update-functies uit economie.ts.
//
// Save/load (M9, hoofdstuk 13; issue: "niet automatisch opslaan, maar bewust
// via een menu"): elke keer dat een run start (GameRoot mount, zie AppRoot)
// begint de run bij het begin, met een verse spelstatus — ook als er een
// bewaarde run klaarstaat (issue: "als je op SpelVerlaten hebt geklikt en
// daarna opnieuw de tutorial begint, dat je dan helemaal bij het begin
// begint"). Een bewaarde run wordt uitsluitend teruggehaald als de speler
// zelf bewust op "Spel laden" drukt (`laden` hieronder) — geen automatisch
// laden bij mount.
//
// `campagneId` (M20d deelstap 3, hoofdstuk 9/13/15): `undefined` (tutorial)
// of een `CampaignConfig.id` (campagnes.ts) — bepaalt uitsluitend de
// éénmalige initiële status; latere wijzigingen aan deze prop (GameRoot
// unmount/remount't bij elke campagnewissel via AppRoot) hebben geen effect
// op een al lopende run.
export function useGameEngine(campagneId?: string) {
  const [state, setState] = useState(() => maakInitieleSpelStatus(campagneId));

  const opslaan = useCallback(() => {
    saveSpel(state);
  }, [state]);

  // M20d deelstap 2: elke campagne heeft nu een eigen save-sleutel
  // (save.ts), dus moet "laden" weten voor welke campagne — die van de
  // lopende (nog niet noodzakelijk opgeslagen) run.
  const laden = useCallback(() => {
    const opgeslagenStatus = laadSpel(state.campagneId);
    if (opgeslagenStatus) setState(opgeslagenStatus);
  }, [state.campagneId]);

  const volgendeBeurt = useCallback(() => {
    setState((huidig) => volgendeBeurtActie(huidig));
  }, []);

  const startBouw = useCallback(
    (streekHoogte: number, improvement: Improvement, positieInStreek: number) => {
      setState((huidig) => metAutomatischeVolgendeBeurt(startBouwActie(huidig, streekHoogte, improvement, positieInStreek)));
    },
    []
  );

  const sluitBouwKeuze = useCallback(() => {
    setState((huidig) => metAutomatischeVolgendeBeurt(sluitBouwKeuzeActie(huidig)));
  }, []);

  const startGroei = useCallback(() => {
    setState((huidig) => startGroeiActie(huidig));
  }, []);

  const startNieuweSettler = useCallback(() => {
    setState((huidig) => startNieuweSettlerActie(huidig));
  }, []);

  // Tweede settler (issue: "Altijd 2e settler" #236) — zelfde dunne
  // wrapper-conventie als `startNieuweSettler` hierboven, eigen wachtrij.
  const startTweedeSettler = useCallback(() => {
    setState((huidig) => startTweedeSettlerActie(huidig));
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

  const stichtStad = useCallback((slot: SettlerSlot = "primair") => {
    setState((huidig) => stichtStadActie(huidig, slot));
  }, []);

  const startRecrutering = useCallback(() => {
    setState((huidig) => startRecruteringActie(huidig));
  }, []);

  const confrontatieBezetteStreek = useCallback((positieInStreek: number) => {
    setState((huidig) => confrontatieBezetteStreekActie(huidig, positieInStreek));
  }, []);

  const bevestigIneenstorting = useCallback(() => {
    setState((huidig) => bevestigIneenstortingActie(huidig));
  }, []);

  // Tweede settler (issue #236): elke settler-actiewrapper krijgt een
  // `slot`-parameter (default "primair") die hij ongewijzigd doorgeeft aan de
  // gelijknamige functie in acties.ts.
  const verplaatsSettlerNaar = useCallback(
    (hoogte: number, positieInStreek: number, slot: SettlerSlot = "primair") => {
      setState((huidig) => metAutomatischeVolgendeBeurt(verplaatsSettlerNaarActie(huidig, hoogte, positieInStreek, slot)));
    },
    []
  );

  const legWegAan = useCallback((slot: SettlerSlot = "primair") => {
    setState((huidig) => metAutomatischeVolgendeBeurt(legWegAanActie(huidig, slot)));
  }, []);

  const jaag = useCallback((slot: SettlerSlot = "primair") => {
    setState((huidig) => metAutomatischeVolgendeBeurt(jaagActie(huidig, slot)));
  }, []);

  const hakHout = useCallback((slot: SettlerSlot = "primair") => {
    setState((huidig) => metAutomatischeVolgendeBeurt(hakHoutActie(huidig, slot)));
  }, []);

  const sluitIndringersMelding = useCallback(() => {
    setState((huidig) => sluitIndringersMeldingActie(huidig));
  }, []);

  const bevestigAmberOnderVuur = useCallback(() => {
    setState((huidig) => bevestigAmberOnderVuurActie(huidig));
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

  const sluitTweedeAmberOntdektMelding = useCallback(() => {
    setState((huidig) => sluitTweedeAmberOntdektMeldingActie(huidig));
  }, []);

  const versnelBouwMetGoud = useCallback((hoogte: number, positieInStreek: number) => {
    setState((huidig) => versnelBouwMetGoudActie(huidig, hoogte, positieInStreek));
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

  const bemanWachttoren = useCallback((strijderId: string, hoogte: number, positieInStreek: number) => {
    setState((huidig) => bemanWachttorenActie(huidig, strijderId, hoogte, positieInStreek));
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

  // Bezette Streek, Missionaris & Verkenner (hoofdstuk 6, issue: "De Bezette
  // Streek, missionaris en verkenner", herzien door "Bezette streek scherm")
  // — zelfde dunne wrapper-conventie als hierboven.
  const stuurVerkenner = useCallback((positieInStreek: number) => {
    setState((huidig) => stuurVerkennerActie(huidig, positieInStreek));
  }, []);

  const stuurMissionaris = useCallback((missionarisId: string, positieInStreek: number) => {
    setState((huidig) => stuurMissionarisActie(huidig, missionarisId, positieInStreek));
  }, []);

  const startMissionarisRecrutering = useCallback(() => {
    setState((huidig) => startMissionarisRecruteringActie(huidig));
  }, []);

  const bemanLegerkamp = useCallback((strijderId: string, hoogte: number, positieInStreek: number) => {
    setState((huidig) => bemanLegerkampActie(huidig, strijderId, hoogte, positieInStreek));
  }, []);

  const sluitBezetteStreekOntdektMelding = useCallback(() => {
    setState((huidig) => sluitBezetteStreekOntdektMeldingActie(huidig));
  }, []);

  const sluitVijandelijkHeiligdomOnthuldMelding = useCallback(() => {
    setState((huidig) => sluitVijandelijkHeiligdomOnthuldMeldingActie(huidig));
  }, []);

  const sluitVijandelijkHeiligdomVeroverdMelding = useCallback(() => {
    setState((huidig) => sluitVijandelijkHeiligdomVeroverdMeldingActie(huidig));
  }, []);

  return {
    state,
    volgendeBeurt,
    startBouw,
    sluitBouwKeuze,
    startGroei,
    startNieuweSettler,
    startTweedeSettler,
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
    bevestigAmberOnderVuur,
    sluitKuddeMelding,
    sluitRoofdierMelding,
    sluitAmberOntdektMelding,
    sluitTweedeAmberOntdektMelding,
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
    stuurVerkenner,
    stuurMissionaris,
    startMissionarisRecrutering,
    bemanLegerkamp,
    confrontatieBezetteStreek,
    sluitBezetteStreekOntdektMelding,
    sluitVijandelijkHeiligdomOnthuldMelding,
    sluitVijandelijkHeiligdomVeroverdMelding,
    opslaan,
    laden,
  };
}
