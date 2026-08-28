"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SettlerSlot,
  hakHout as hakHoutActie,
  jaag as jaagActie,
  legWegAan as legWegAanActie,
  stichtStad as stichtStadActie,
  verplaatsSettlerNaar as verplaatsSettlerNaarActie,
} from "./acties";
import { sluitBoonMelding as sluitBoonMeldingActie } from "./boons";
import { versnelBouwMetGoud as versnelBouwMetGoudActie } from "./bouwwachtrij";
import {
  beurtMagAutomatischDoorgaan,
  bevestigStichtingsMomentPopup as bevestigStichtingsMomentPopupActie,
  bevestigStreekPopup as bevestigStreekPopupActie,
  maakInitieleSpelStatus,
  markeerUitlegGezien as markeerUitlegGezienActie,
  volgendeBeurt as volgendeBeurtActie,
  zetUitlegPopups as zetUitlegPopupsActie,
} from "./economie";
import {
  startCityVerbetering as startCityVerbeteringActie,
  startGroei as startGroeiActie,
  startMissionarisRecrutering as startMissionarisRecruteringActie,
  startNieuweSettler as startNieuweSettlerActie,
  startOpslagplaats as startOpslagplaatsActie,
  startRechterTraining as startRechterTrainingActie,
  startRecrutering as startRecruteringActie,
  sluitSmederijGebouwdMelding as sluitSmederijGebouwdMeldingActie,
  startSmederij as startSmederijActie,
  startTweedeSettler as startTweedeSettlerActie,
  versnelCityVerbeteringMetGoud as versnelCityVerbeteringMetGoudActie,
  versnelCivielMetGoud as versnelCivielMetGoudActie,
  versnelOpslagplaatsMetGoud as versnelOpslagplaatsMetGoudActie,
  versnelSmederijMetGoud as versnelSmederijMetGoudActie,
  zetSmederijActief as zetSmederijActiefActie,
} from "./groeiEnRekrutering";
import {
  bevestigGoudOnderVuur as bevestigGoudOnderVuurActie,
  geefTribuut as geefTribuutActie,
  koopIndringersAfMetWampum as koopIndringersAfMetWampumActie,
  sluitIndringersMelding as sluitIndringersMeldingActie,
  sluitKuddeMelding as sluitKuddeMeldingActie,
  sluitRoofdierMelding as sluitRoofdierMeldingActie,
} from "./indringersEnDieren";
import {
  sluitGoudOntdektMelding as sluitGoudOntdektMeldingActie,
  sluitBezetteStreekOntdektMelding as sluitBezetteStreekOntdektMeldingActie,
  sluitTweedeGoudOntdektMelding as sluitTweedeGoudOntdektMeldingActie,
  sluitVijandelijkHeiligdomOnthuldMelding as sluitVijandelijkHeiligdomOnthuldMeldingActie,
  sluitVijandelijkHeiligdomVeroverdMelding as sluitVijandelijkHeiligdomVeroverdMeldingActie,
  sluitWampanoagLaagOntdektMelding as sluitWampanoagLaagOntdektMeldingActie,
  stuurMissionaris as stuurMissionarisActie,
  stuurVerkenner as stuurVerkennerActie,
} from "./streekOntgrendeling";
import {
  sluitWampanoagRelatieGelegdMelding as sluitWampanoagRelatieGelegdMeldingActie,
  stelWampanoagHandelIn as stelWampanoagHandelActie,
  stuurVerkennerWampanoag as stuurVerkennerWampanoagActie,
} from "./wampanoag";
import { sluitBouwKeuze as sluitBouwKeuzeActie, startBouw as startBouwActie } from "./infrastructuurEnBouw";
import {
  bemanLegerkamp as bemanLegerkampActie,
  bemanWachttoren as bemanWachttorenActie,
  confrontatieBezetteStreek as confrontatieBezetteStreekActie,
  haalStrijderTerug as haalStrijderTerugActie,
} from "./militair";
import { bemanCourthouse as bemanCourthouseActie, haalRechterTerug as haalRechterTerugActie } from "./onrust";
import { laadSpel, saveSpel, verwijderSpel } from "./save";
import { kiesTech as kiesTechActie } from "./tech";
import { bevestigIneenstorting as bevestigIneenstortingActie } from "./uitputtingEnVerval";
import { EenmaligeUitlegKey, GameState, Improvement, TechId, WampanoagHandelKeuze } from "./types";

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
// Save/load (M9, hoofdstuk 13; issue #306 "Auto save implementeren", die de
// eerdere "niet automatisch opslaan, maar bewust via een menu"-keuze
// vervangt): past beter bij het permadeath-idee (hoofdstuk 11) — zonder een
// handmatige "Opslaan"-knop kan de speler niet meer bewust vlak vóór een
// risico opslaan om na een tegenvaller terug te laden. In plaats daarvan
// bewaart de `useEffect` hieronder de status na elke wijziging, zodat de save
// altijd de actuele stand van de lopende run is.
//
// Elke keer dat een run start (GameRoot mount, zie AppRoot) begint de run bij
// het begin, met een verse spelstatus — ook als er een bewaarde run
// klaarstaat (issue: "als je op SpelVerlaten hebt geklikt en daarna opnieuw
// de tutorial begint, dat je dan helemaal bij het begin begint"). Een
// bewaarde run wordt uitsluitend teruggehaald als de speler zelf bewust op de
// "Laden"-knop op CampagneSelectScherm drukt (`laadBijStart` hieronder) —
// geen automatisch laden bij mount.
//
// `campagneId` (M20d deelstap 3, hoofdstuk 9/13/15): `undefined` (tutorial)
// of een `CampaignConfig.id` (campagnes.ts) — bepaalt uitsluitend de
// éénmalige initiële status; latere wijzigingen aan deze prop (GameRoot
// unmount/remount't bij elke campagnewissel via AppRoot) hebben geen effect
// op een al lopende run.
// `laadBijStart` (issue: "loading button per campagne op het campagne select
// screen"): true wanneer de speler op CampagneSelectScherm bewust "Laden" in
// plaats van de campagne zelf aanklikte. Alleen gelezen bij de eerste render
// (`useState`-initializer) — valt terug op een verse status als er (toch)
// niets opgeslagen bleek, zodat de knop nooit op een kapotte/lege save vast
// blijft zitten.
export function useGameEngine(campagneId?: string, laadBijStart?: boolean) {
  const [state, setState] = useState(() => {
    const opgeslagenStatus = laadBijStart ? laadSpel(campagneId) : null;
    return opgeslagenStatus ?? maakInitieleSpelStatus(campagneId);
  });

  // Autosave (issue #306): bewaart de status bij elke wijziging, onder de
  // sleutel van de campagne waartoe deze run behoort (zie save.ts:
  // `saveSleutel`) — geen handmatige "Opslaan"-knop meer nodig.
  //
  // Bij een ineenstorting (issue: "Bij game over moet de save verwijderd
  // worden") slaat dit juist níets op: `state` is dan al de verse status ná
  // reset (zie verwerkVerval), met alleen `laatsteIneenstorting: true`
  // erbovenop. Zou die alsnog ge-autosaved worden, dan zet "Laden" op
  // CampagneSelectScherm de speler bij de volgende sessie regelrecht weer op
  // het game-over-scherm. De opgeslagen run van de zojuist ingestorte
  // campagne heeft toch niets meer om te hervatten, dus die mag weg.
  useEffect(() => {
    if (state.laatsteIneenstorting) {
      verwijderSpel(state.campagneId);
      return;
    }
    saveSpel(state);
  }, [state]);

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

  // Smederij (Going West, M21d) — zelfde dunne wrapper-conventie als
  // `startOpslagplaats` hierboven.
  const startSmederij = useCallback(() => {
    setState((huidig) => startSmederijActie(huidig));
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

  const bevestigGoudOnderVuur = useCallback(() => {
    setState((huidig) => bevestigGoudOnderVuurActie(huidig));
  }, []);

  const sluitKuddeMelding = useCallback(() => {
    setState((huidig) => sluitKuddeMeldingActie(huidig));
  }, []);

  const sluitRoofdierMelding = useCallback(() => {
    setState((huidig) => sluitRoofdierMeldingActie(huidig));
  }, []);

  const sluitGoudOntdektMelding = useCallback(() => {
    setState((huidig) => sluitGoudOntdektMeldingActie(huidig));
  }, []);

  const sluitTweedeGoudOntdektMelding = useCallback(() => {
    setState((huidig) => sluitTweedeGoudOntdektMeldingActie(huidig));
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

  const versnelSmederijMetGoud = useCallback(() => {
    setState((huidig) => versnelSmederijMetGoudActie(huidig));
  }, []);

  // Smederij actief/inactief toggelen (issue: "Smederij inactief zetten") —
  // zelfde dunne wrapper-conventie als hierboven.
  const zetSmederijActief = useCallback((actief: boolean) => {
    setState((huidig) => zetSmederijActiefActie(huidig, actief));
  }, []);

  const geefTribuut = useCallback(() => {
    setState((huidig) => geefTribuutActie(huidig));
  }, []);

  const koopIndringersAfMetWampum = useCallback(() => {
    setState((huidig) => koopIndringersAfMetWampumActie(huidig));
  }, []);

  const bemanWachttoren = useCallback((strijderId: string, hoogte: number, positieInStreek: number) => {
    setState((huidig) => bemanWachttorenActie(huidig, strijderId, hoogte, positieInStreek));
  }, []);

  const haalStrijderTerug = useCallback((strijderId: string) => {
    setState((huidig) => haalStrijderTerugActie(huidig, strijderId));
  }, []);

  // Courthouse-bemanning (issue: "Onrust, Saloon en Courthouse") — zelfde
  // dunne wrapper-conventie als `bemanWachttoren`/`haalStrijderTerug`
  // hierboven.
  const bemanCourthouse = useCallback((rechterId: string, hoogte: number, positieInStreek: number) => {
    setState((huidig) => bemanCourthouseActie(huidig, rechterId, hoogte, positieInStreek));
  }, []);

  const haalRechterTerug = useCallback((rechterId: string) => {
    setState((huidig) => haalRechterTerugActie(huidig, rechterId));
  }, []);

  const zetUitlegPopups = useCallback((aan: boolean) => {
    setState((huidig) => zetUitlegPopupsActie(huidig, aan));
  }, []);

  // Issue: "Bij laden niet alle pop-ups tonen" — vervangt de vroegere lokale
  // `useState`-setters in GameRoot voor de eenmalige uitleg-pop-ups en de
  // streek-/stichtingsmoment-pop-ups, zodat de "al gezien"-status meegaat in
  // de save (zie economie.ts/types.ts).
  const markeerUitlegGezien = useCallback((key: EenmaligeUitlegKey) => {
    setState((huidig) => markeerUitlegGezienActie(huidig, key));
  }, []);

  const bevestigStreekPopup = useCallback((hoogte: number) => {
    setState((huidig) => bevestigStreekPopupActie(huidig, hoogte));
  }, []);

  const bevestigStichtingsMomentPopup = useCallback((stedenAantal: number) => {
    setState((huidig) => bevestigStichtingsMomentPopupActie(huidig, stedenAantal));
  }, []);

  // Boon-systeem (issue #411/#414) — zelfde dunne wrapper-conventie als
  // `sluitGoudOntdektMelding` hierboven.
  const sluitBoonMelding = useCallback(() => {
    setState((huidig) => sluitBoonMeldingActie(huidig));
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

  // Wampanoag-Verkenning (Going West, M21e, opdracht-wampanoag-opening.md
  // §5) — zelfde dunne wrapper-conventie als `stuurVerkenner` hierboven, maar
  // voor de losstaande Wampanoag-laag (wampanoag.ts) i.p.v. de Bezette Streek.
  const stuurVerkennerWampanoag = useCallback((positieInStreek: number) => {
    setState((huidig) => stuurVerkennerWampanoagActie(huidig, positieInStreek));
  }, []);

  // Wampanoag-handel (Going West, M21f, opdracht-wampanoag-opening.md §6) —
  // zelfde dunne wrapper-conventie als `stuurVerkennerWampanoag` hierboven.
  // `keuze: undefined` pauzeert de handel op dit vakje.
  const stelWampanoagHandel = useCallback((positieInStreek: number, keuze: WampanoagHandelKeuze | undefined) => {
    setState((huidig) => stelWampanoagHandelActie(huidig, positieInStreek, keuze));
  }, []);

  const stuurMissionaris = useCallback((missionarisId: string, positieInStreek: number) => {
    setState((huidig) => stuurMissionarisActie(huidig, missionarisId, positieInStreek));
  }, []);

  const startMissionarisRecrutering = useCallback(() => {
    setState((huidig) => startMissionarisRecruteringActie(huidig));
  }, []);

  const startRechterTraining = useCallback(() => {
    setState((huidig) => startRechterTrainingActie(huidig));
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

  // Wampanoag-narratieve pop-ups (Going West, M21g, opdracht-wampanoag-opening.md
  // §7/§8) — zelfde dunne wrapper-conventie als de overige `sluit...Melding`-
  // acties hierboven.
  const sluitWampanoagLaagOntdektMelding = useCallback(() => {
    setState((huidig) => sluitWampanoagLaagOntdektMeldingActie(huidig));
  }, []);

  const sluitWampanoagRelatieGelegdMelding = useCallback(() => {
    setState((huidig) => sluitWampanoagRelatieGelegdMeldingActie(huidig));
  }, []);

  // Smederij-narratieve pop-up (issue "Wampanoag streek pas helemaal onthuld
  // na handel") — zelfde dunne wrapper-conventie als de `sluit...Melding`-
  // acties hierboven.
  const sluitSmederijGebouwdMelding = useCallback(() => {
    setState((huidig) => sluitSmederijGebouwdMeldingActie(huidig));
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
    startSmederij,
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
    bevestigGoudOnderVuur,
    sluitKuddeMelding,
    sluitRoofdierMelding,
    sluitGoudOntdektMelding,
    sluitTweedeGoudOntdektMelding,
    versnelBouwMetGoud,
    versnelCivielMetGoud,
    versnelOpslagplaatsMetGoud,
    versnelSmederijMetGoud,
    zetSmederijActief,
    geefTribuut,
    koopIndringersAfMetWampum,
    bemanWachttoren,
    haalStrijderTerug,
    bemanCourthouse,
    haalRechterTerug,
    startRechterTraining,
    zetUitlegPopups,
    markeerUitlegGezien,
    bevestigStreekPopup,
    bevestigStichtingsMomentPopup,
    sluitBoonMelding,
    kiesTech,
    stuurVerkenner,
    stuurVerkennerWampanoag,
    stelWampanoagHandel,
    stuurMissionaris,
    startMissionarisRecrutering,
    bemanLegerkamp,
    confrontatieBezetteStreek,
    sluitBezetteStreekOntdektMelding,
    sluitVijandelijkHeiligdomOnthuldMelding,
    sluitVijandelijkHeiligdomVeroverdMelding,
    sluitWampanoagLaagOntdektMelding,
    sluitWampanoagRelatieGelegdMelding,
    sluitSmederijGebouwdMelding,
  };
}
