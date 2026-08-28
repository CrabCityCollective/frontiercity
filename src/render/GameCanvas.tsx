"use client";

import { MouseEvent, useEffect, useRef } from "react";
import { GrafischeStijl } from "@/game/save";
import { City, Streek, Settler } from "@/game/types";
import {
  BAND_WIDTH_TILES,
  EINDE_OCEAAN_HOOGTE,
  eindeOceaanZichtbaar,
  startOceaanZichtbaar,
} from "@/game/world";
import { tekenWereld } from "./canvas";
import { tekenWereldPixelArt } from "./canvasPixelArt";

const TILE_SIZE = 64;

interface GameCanvasProps {
  // Alleen de tegenwoordig relevante streken (zie world.ts: `zichtbareStreken`) —
  // niet per se alle 12 tutorial-streken. Bepaalt zowel de canvas-hoogte als de
  // klik-geometrie hieronder, dus renderen en klikken blijven altijd in sync.
  streken: Streek[];
  // De volledige, niet-zichtbaarheids-gefilterde streken-lijst (`GameState.streken`)
  // — issue "Nieuwe stad Cincinnati": zodra oudere streken dichtklappen (zie
  // `streken` hierboven) missen die niet meer uit deze prop, maar de
  // wegennetwerk-/onrust-checks tijdens het tekenen (`isTileVerbondenMetStad`,
  // `wegVerbindingen`, `onrustOpStreek`) moeten wél door de dichtgeklapte
  // streken heen kunnen kijken — precies zoals de echte spellogica
  // (productie.ts e.a.) altijd al met `state.streken` rekent, nooit met de
  // canvas-gefilterde subset. Anders zou een tile vlak na een nieuwe
  // stichting onterecht als "niet verbonden" getekend worden.
  alleStreken: Streek[];
  stad: City;
  // Hoogte van de streek waarop een gekozen improvement geplaatst mag worden
  // (klik-op-tile-plaatsing) — zolang dit gezet is markeert de canvas de
  // lege tiles op die streek en stuurt elke klik naar `onTileClick`.
  plaatsingsStreekHoogte?: number;
  // `bouwbaarBuitenFrontier`-improvements (Wachttoren/Legerkamp, hoofdstuk
  // 6/11) mogen op elke ontgrendelde streek geplaatst worden — issue
  // "wachttoren bouwen: alle vakjes oplichten". Zolang dit gezet is,
  // markeert de canvas de lege tiles van élke ontgrendelde streek i.p.v.
  // uitsluitend `plaatsingsStreekHoogte`.
  plaatsingsAlleStreken?: boolean;
  // Positie van de settler-eenheid (M10, hoofdstuk 16) — `undefined` tot
  // beurt 2, zie economie.ts `volgendeBeurt`.
  settler?: Settler;
  // Tweede settler (issue: "Altijd 2e settler" #236) — pas te krijgen vanaf
  // streek 7 (zie `kanTweedeSettlerBouwen`, groeiEnRekrutering.ts), verder
  // los van `settler` hierboven getekend/geklikt.
  tweedeSettler?: Settler;
  // Vakjes waar de settler deze beurt direct naartoe kan (issue: "de tegels
  // waar je heen kunt lichten op") — zolang dit gezet is markeert de canvas
  // die vakjes en stuurt een klik erop naar `onTileClick` als verplaatsing
  // i.p.v. tile-selectie (zie GameRoot).
  settlerBereikbarePosities?: Settler[];
  // Actieve, nog onbemande Legerkamp-tiles tijdens het bemannen (hoofdstuk 6,
  // issue: "De Bezette Streek, missionaris en verkenner", Deel 5) — zelfde
  // patroon als `settlerBereikbarePosities` hierboven, maar voor de
  // legerkamp-toewijs-flow: zolang dit gezet is markeert de canvas deze
  // vakjes en stuurt een klik erop naar `onTileClick` als toewijzen (zie
  // GameRoot). Wachttoren-bemannen loopt sinds issue "wachttorens bemannen"
  // niet meer via zo'n kies-modus, maar via een klik op de wachttoren-tile
  // zelf — geen highlight-vakjes hier meer voor nodig.
  legerkampBereikbarePosities?: Settler[];
  // Nog verhulde vakjes van de actieve Bezette Streek tijdens Verkenning (Deel
  // 3) — zelfde patroon, maar dan voor de Verkenning-kies-modus.
  verkenningBereikbarePosities?: Settler[];
  // Grafische stijl (issue: "Settings uitbreiden" — on the fly wisselen
  // tussen pixel art en vector art): als prop i.p.v. hier zelf `save.ts`
  // uit te lezen, zodat een toggle tijdens het spelen (GameRoot) meteen een
  // herteken triggert via de dependency-array van het effect hieronder, in
  // plaats van pas bij de volgende (her)start van dit scherm.
  stijl: GrafischeStijl;
  // Campagne-tegelset (M20d deelstap 4, hoofdstuk 9/12/13): `CampaignConfig.tegelSet`
  // van de actieve run (`undefined` voor de tutorial). Geeft, net als `stijl`
  // hierboven, meteen een herteken via de dependency-array van het effect
  // hieronder zodra een andere campagne gestart wordt.
  tegelSet?: string;
  // Actieve campagne-id (`GameState.campagneId`, issue: "Onrust indicator") —
  // gaat de onrust-indicator op elk improvement (`tekenOnrustIndicator`/
  // `tekenOnrustIndicatorPixel`) op Going West, zelfde `campagneId`-check als
  // productie.ts/tileInfo.ts: onrust bestaat niet in de tutorial.
  campagneId?: string;
  onTileClick: (hoogte: number, positieInStreek: number) => void;
}

// Zet een klik-event op de canvas om naar de (streek-hoogte, positie-in-streek)
// van de aangeklikte tile, met dezelfde tile-geometrie als `tekenWereld`. Houdt
// rekening met een eventueel afwijkende CSS-grootte van het canvas-element.
// Hoogte 0 is de oceaan-rij onder streek 1 (hoofdstuk 2) — geen echte `Streek`,
// maar wel een geldig, klikbaar doel (zie GameRoot: oceaan-tile-info).
// `heeftEindeOceaan` (issue: "laatste oceaan ook visueel") schuift alle rijen
// één tegel naar beneden voor de afsluitende oceaan-rij bóven de laatste streek
// — die rij mapt naar sentinel-hoogte `EINDE_OCEAAN_HOOGTE`, net zo min een
// echte `Streek` als hoogte 0.
// `maxHoogte` is de hoogte van de bovenste zichtbare streek (niet meer per se
// gelijk aan `streken.length` sinds issue "Nieuwe stad Cincinnati": zodra de
// onderste zichtbare streek niet langer hoogte 1 is, klopt "aantal zichtbare
// streken = hoogste hoogte" niet meer). `heeftStartOceaan` bepaalt of er
// ónder de streek-rijen nog een klikbare oceaan-rij (sentinel-hoogte 0) staat
// — alleen zolang streek 1 zelf zichtbaar is (zie `startOceaanZichtbaar`).
function bepaalAangeklikteTile(
  canvas: HTMLCanvasElement,
  event: MouseEvent<HTMLCanvasElement>,
  aantalStreken: number,
  maxHoogte: number,
  heeftStartOceaan: boolean,
  heeftEindeOceaan: boolean
): { hoogte: number; positieInStreek: number } | null {
  const rect = canvas.getBoundingClientRect();
  const schaalX = canvas.width / rect.width;
  const schaalY = canvas.height / rect.height;
  const tileSize = canvas.width / BAND_WIDTH_TILES;

  const x = (event.clientX - rect.left) * schaalX;
  const y = (event.clientY - rect.top) * schaalY;
  const positieInStreek = Math.floor(x / tileSize);
  const ruweRij = Math.floor(y / tileSize);

  if (positieInStreek < 0 || positieInStreek >= BAND_WIDTH_TILES) {
    return null;
  }

  const topRijen = heeftEindeOceaan ? 1 : 0;
  if (ruweRij < topRijen) {
    return { hoogte: EINDE_OCEAAN_HOOGTE, positieInStreek };
  }

  const rijIndex = ruweRij - topRijen;
  if (rijIndex < aantalStreken) {
    const hoogte = maxHoogte - rijIndex;
    return { hoogte, positieInStreek };
  }

  if (heeftStartOceaan && rijIndex === aantalStreken) {
    return { hoogte: 0, positieInStreek };
  }

  return null;
}

export default function GameCanvas({
  streken,
  alleStreken,
  stad,
  plaatsingsStreekHoogte,
  plaatsingsAlleStreken,
  settler,
  tweedeSettler,
  settlerBereikbarePosities,
  legerkampBereikbarePosities,
  verkenningBereikbarePosities,
  stijl,
  tegelSet,
  campagneId,
  onTileClick,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heeftEindeOceaan = eindeOceaanZichtbaar(streken);
  const heeftStartOceaan = startOceaanZichtbaar(streken);
  // Hoogte van de bovenste zichtbare streek — sinds issue "Nieuwe stad
  // Cincinnati" niet meer per se gelijk aan `streken.length` (zie
  // `bepaalAangeklikteTile` hierboven). `streken` staat oplopend op hoogte
  // (zelfde volgorde als `GameState.streken`), dus het laatste element is de
  // hoogste.
  const maxHoogte = streken.length > 0 ? streken[streken.length - 1].hoogte : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Grafische stijl (issue: "pixel art style placeholders i.p.v. vector
    // style ... nog heen en weer kunnen schakelen"): beide tekenaars delen
    // dezelfde signatuur/tile-geometrie (zie canvasPixelArt.ts), dus hier
    // alleen kiezen welke van de twee getekend wordt.
    const teken = stijl === "pixel-art" ? tekenWereldPixelArt : tekenWereld;
    teken(
      ctx,
      canvas.width,
      canvas.height,
      streken,
      alleStreken,
      stad,
      plaatsingsStreekHoogte,
      plaatsingsAlleStreken,
      settler,
      settlerBereikbarePosities,
      legerkampBereikbarePosities,
      verkenningBereikbarePosities,
      tweedeSettler,
      tegelSet,
      campagneId
    );
  }, [
    streken,
    alleStreken,
    stad,
    plaatsingsStreekHoogte,
    plaatsingsAlleStreken,
    settler,
    tweedeSettler,
    settlerBereikbarePosities,
    legerkampBereikbarePosities,
    verkenningBereikbarePosities,
    stijl,
    tegelSet,
    campagneId,
  ]);

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tile = bepaalAangeklikteTile(canvas, event, streken.length, maxHoogte, heeftStartOceaan, heeftEindeOceaan);
    if (tile) onTileClick(tile.hoogte, tile.positieInStreek);
  }

  return (
    <canvas
      ref={canvasRef}
      width={TILE_SIZE * BAND_WIDTH_TILES}
      // +1 rij onder de onderste zichtbare streek — altijd gereserveerd,
      // ongeacht `heeftStartOceaan`: zolang streek 1 zichtbaar is, tekent
      // `tekenWereld` daar de klikbare oceaan (hoofdstuk 2) in, en zodra een
      // nieuwe stad de oudere streken laat dichtklappen (issue: "Nieuwe stad
      // Cincinnati") blijft die rij leeg maar geeft hij nog altijd de
      // stad-naam-overlay (issue: "Tweede stad": naam viel eerder van de
      // canvas af omdat deze rij dan niet meer meegeteld werd) de ruimte om
      // onder de onderste stad-tegel te tekenen. +1 extra rij zodra de
      // afsluitende oceaan bóven de laatste streek ook getoond wordt (issue:
      // "laatste oceaan ook visueel"). Hoogte volgt verder het aantal
      // daadwerkelijk meegegeven (zichtbare) streken, niet het vaste
      // tutorial-totaal (issue: "onontdekte tegels weg" hierboven).
      height={TILE_SIZE * (streken.length + 1 + (heeftEindeOceaan ? 1 : 0))}
      onClick={handleClick}
      // width/height hierboven blijven de canvas-resolutie (en dus de
      // klik-geometrie in `bepaalAangeklikteTile`, die zelf al corrigeert
      // voor een afwijkende CSS-grootte). De CSS-grootte hieronder schaalt de
      // band mee naar smalle (mobiele) viewports i.p.v. buiten beeld te
      // schuiven — `maxWidth` voorkomt alleen dat 'm op brede schermen
      // wazig wordt opgerekt.
      style={{
        display: "block",
        background: "#1a1410",
        cursor: "pointer",
        width: "100%",
        height: "auto",
        maxWidth: `${TILE_SIZE * BAND_WIDTH_TILES}px`,
        margin: "0 auto",
      }}
    />
  );
}
