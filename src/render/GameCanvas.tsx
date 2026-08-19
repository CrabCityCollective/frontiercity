"use client";

import { MouseEvent, useEffect, useRef } from "react";
import { GrafischeStijl } from "@/game/save";
import { City, Streek, Settler } from "@/game/types";
import { BAND_WIDTH_TILES, EINDE_OCEAAN_HOOGTE, eindeOceaanZichtbaar } from "@/game/world";
import { tekenWereld } from "./canvas";
import { tekenWereldPixelArt } from "./canvasPixelArt";

const TILE_SIZE = 64;

interface GameCanvasProps {
  // Alleen de tegenwoordig relevante streken (zie world.ts: `zichtbareStreken`) —
  // niet per se alle 12 tutorial-streken. Bepaalt zowel de canvas-hoogte als de
  // klik-geometrie hieronder, dus renderen en klikken blijven altijd in sync.
  streken: Streek[];
  stad: City;
  // Hoogte van de streek waarop een gekozen improvement geplaatst mag worden
  // (klik-op-tile-plaatsing) — zolang dit gezet is markeert de canvas de
  // lege tiles op die streek en stuurt elke klik naar `onTileClick`.
  plaatsingsStreekHoogte?: number;
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
function bepaalAangeklikteTile(
  canvas: HTMLCanvasElement,
  event: MouseEvent<HTMLCanvasElement>,
  aantalStreken: number,
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

  if (heeftEindeOceaan) {
    if (ruweRij === 0) {
      return { hoogte: EINDE_OCEAAN_HOOGTE, positieInStreek };
    }
    const rijIndex = ruweRij - 1;
    const hoogte = aantalStreken - rijIndex;
    if (hoogte < 0 || hoogte > aantalStreken) return null;
    return { hoogte, positieInStreek };
  }

  const hoogte = aantalStreken - ruweRij;
  if (hoogte < 0 || hoogte > aantalStreken) return null;
  return { hoogte, positieInStreek };
}

export default function GameCanvas({
  streken,
  stad,
  plaatsingsStreekHoogte,
  settler,
  tweedeSettler,
  settlerBereikbarePosities,
  legerkampBereikbarePosities,
  verkenningBereikbarePosities,
  stijl,
  onTileClick,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heeftEindeOceaan = eindeOceaanZichtbaar(streken);

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
      stad,
      plaatsingsStreekHoogte,
      settler,
      settlerBereikbarePosities,
      legerkampBereikbarePosities,
      verkenningBereikbarePosities,
      tweedeSettler
    );
  }, [
    streken,
    stad,
    plaatsingsStreekHoogte,
    settler,
    tweedeSettler,
    settlerBereikbarePosities,
    legerkampBereikbarePosities,
    verkenningBereikbarePosities,
    stijl,
  ]);

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tile = bepaalAangeklikteTile(canvas, event, streken.length, heeftEindeOceaan);
    if (tile) onTileClick(tile.hoogte, tile.positieInStreek);
  }

  return (
    <canvas
      ref={canvasRef}
      width={TILE_SIZE * BAND_WIDTH_TILES}
      // +1 rij voor de klikbare oceaan onder streek 1 (hoofdstuk 2), +1 extra
      // rij zodra de afsluitende oceaan bóven de laatste streek ook getoond
      // wordt (issue: "laatste oceaan ook visueel"). Hoogte volgt het aantal
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
