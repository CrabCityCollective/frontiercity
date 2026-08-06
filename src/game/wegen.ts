// Wegen & de settler (M10, hoofdstuk 16): een losse settler-eenheid legt
// wegen aan die land improvements verbinden met de stad. Alleen via zo'n
// wegverbinding wordt de productie van een land improvement daadwerkelijk
// actief (zie economie.ts: `verwerkProductie`).
//
// Geometrie: elke laag is een rij van BAND_WIDTH_TILES vakjes
// (`positieInLaag`), en lagen stapelen verticaal op dezelfde x-positie (zie
// render/canvas.ts: `rijIndex = totaalLagen - laag.hoogte`) — "vooruit" en
// "achteruit" bewegen dus in hoogte, "links" en "rechts" in `positieInLaag`.

import { Layer, Settler } from "./types";
import { BAND_WIDTH_TILES, hoogsteOntgrendeldeLaag, STAD_POSITIE } from "./world";

export type SettlerRichting = "vooruit" | "achteruit" | "links" | "rechts";

// Eén vakje per beurt (hoofdstuk 16: "elke beurt 1 vakje naar voren, achter,
// of zijwaarts"), nooit diagonaal.
export function volgendePositie(settler: Settler, richting: SettlerRichting): Settler {
  switch (richting) {
    case "vooruit":
      return { ...settler, hoogte: settler.hoogte + 1 };
    case "achteruit":
      return { ...settler, hoogte: settler.hoogte - 1 };
    case "links":
      return { ...settler, positieInLaag: settler.positieInLaag - 1 };
    case "rechts":
      return { ...settler, positieInLaag: settler.positieInLaag + 1 };
  }
}

// De settler blijft, net als de speler zelf, binnen al ontgrendeld gebied —
// geen stappen de mist of de klikbare oceaan-rij in.
export function magSettlerNaar(lagen: Layer[], positie: Settler): boolean {
  if (positie.positieInLaag < 0 || positie.positieInLaag >= BAND_WIDTH_TILES) return false;
  return positie.hoogte >= 1 && positie.hoogte <= hoogsteOntgrendeldeLaag(lagen);
}

const ALLE_RICHTINGEN: SettlerRichting[] = ["vooruit", "achteruit", "links", "rechts"];

// De vakjes waar de settler deze beurt direct naartoe kan (issue: "de tegels
// waar je heen kunt lichten op, door te klikken op een tegel ga je er naar
// toe") — gebruikt zowel om die vakjes op de canvas te markeren als om een
// klik op zo'n vakje als geldige zet te herkennen (zie economie.ts:
// `verplaatsSettlerNaar`).
export function bereikbarePosities(lagen: Layer[], settler: Settler): Settler[] {
  return ALLE_RICHTINGEN.map((richting) => volgendePositie(settler, richting)).filter((positie) =>
    magSettlerNaar(lagen, positie)
  );
}

function tileSleutel(hoogte: number, positieInLaag: number): string {
  return `${hoogte}:${positieInLaag}`;
}

function buurPosities(positie: Settler): Settler[] {
  const buren: Settler[] = [
    { hoogte: positie.hoogte - 1, positieInLaag: positie.positieInLaag },
    { hoogte: positie.hoogte + 1, positieInLaag: positie.positieInLaag },
  ];
  if (positie.positieInLaag > 0) {
    buren.push({ hoogte: positie.hoogte, positieInLaag: positie.positieInLaag - 1 });
  }
  if (positie.positieInLaag < BAND_WIDTH_TILES - 1) {
    buren.push({ hoogte: positie.hoogte, positieInLaag: positie.positieInLaag + 1 });
  }
  return buren;
}

// Of dit vakje "doorgang" biedt aan het wegennetwerk: de stad zelf (het
// beginpunt) of een vakje met een aangelegde weg.
function biedtDoorgang(lagen: Layer[], positie: Settler): boolean {
  if (positie.hoogte === 1 && positie.positieInLaag === STAD_POSITIE) return true;
  const laag = lagen.find((l) => l.hoogte === positie.hoogte);
  return Boolean(laag?.tiles[positie.positieInLaag]?.heeftWeg);
}

// Alle vakjes die via een aaneengesloten keten van wegen (of de stad zelf) te
// bereiken zijn — het wegennetwerk (hoofdstuk 16).
function wegNetwerk(lagen: Layer[]): Set<string> {
  const start: Settler = { hoogte: 1, positieInLaag: STAD_POSITIE };
  const bezocht = new Set<string>([tileSleutel(start.hoogte, start.positieInLaag)]);
  const stapel: Settler[] = [start];

  while (stapel.length > 0) {
    const huidig = stapel.pop()!;
    for (const buur of buurPosities(huidig)) {
      const sleutel = tileSleutel(buur.hoogte, buur.positieInLaag);
      if (bezocht.has(sleutel) || buur.hoogte < 1 || !biedtDoorgang(lagen, buur)) continue;
      bezocht.add(sleutel);
      stapel.push(buur);
    }
  }

  return bezocht;
}

// Of een land improvement op dit vakje daadwerkelijk kan produceren
// (hoofdstuk 16; issue: "een resource levert pas iets op als je de weg echt
// op die tile hebt gebouwd, niet alleen tussen de stad en de resource"). Het
// improvement-vakje zelf moet dus zelf een weg hebben (`heeftWeg`) én die weg
// moet via het wegennetwerk verbonden zijn met de stad — een weg die er
// alleen naartoe leidt, zonder erop te liggen, is niet genoeg.
export function isTileVerbondenMetStad(lagen: Layer[], hoogte: number, positieInLaag: number): boolean {
  const netwerk = wegNetwerk(lagen);
  return netwerk.has(tileSleutel(hoogte, positieInLaag));
}

// Welke van de vier buren van een wegvakje zelf ook een weg hebben (issue:
// "kruispunten en driesprongen zien als er een weg verticaal omhoog loopt
// vanaf een horizontale weg") — puur voor de tekenpijplijn (canvas.ts/
// canvasPixelArt.ts), zodat een wegtegel als kruising/T-splitsing i.p.v. altijd
// als los recht baantje getekend kan worden. `omhoog`/`omlaag` volgen dezelfde
// hoogte-conventie als hierboven: `omhoog` is `hoogte + 1`, de laag die op het
// canvas boven deze tegel getekend wordt (zie render/canvas.ts: `rijIndex`).
// De stadstegel telt hierin gewoon mee als "heeft een weg" (`heeftWeg: true`,
// zie world.ts), dus een weg die de stad raakt sluit ook zichtbaar op haar aan.
export interface WegVerbindingen {
  links: boolean;
  rechts: boolean;
  omhoog: boolean;
  omlaag: boolean;
}

function heeftWegOp(lagen: Layer[], hoogte: number, positieInLaag: number): boolean {
  const laag = lagen.find((l) => l.hoogte === hoogte);
  return Boolean(laag?.tiles[positieInLaag]?.heeftWeg);
}

export function wegVerbindingen(lagen: Layer[], hoogte: number, positieInLaag: number): WegVerbindingen {
  return {
    links: positieInLaag > 0 && heeftWegOp(lagen, hoogte, positieInLaag - 1),
    rechts: positieInLaag < BAND_WIDTH_TILES - 1 && heeftWegOp(lagen, hoogte, positieInLaag + 1),
    omhoog: heeftWegOp(lagen, hoogte + 1, positieInLaag),
    omlaag: heeftWegOp(lagen, hoogte - 1, positieInLaag),
  };
}
