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
// (hoofdstuk 16: "een mijn zonder verbinding naar je stad levert nog niks
// op"). Het improvement-vakje zelf hoeft geen weg te hebben — het telt al als
// verbonden zodra het grenst aan het wegennetwerk (de weg loopt tót het
// improvement, niet erdoorheen).
export function isTileVerbondenMetStad(lagen: Layer[], hoogte: number, positieInLaag: number): boolean {
  const netwerk = wegNetwerk(lagen);
  if (netwerk.has(tileSleutel(hoogte, positieInLaag))) return true;

  const positie: Settler = { hoogte, positieInLaag };
  return buurPosities(positie).some((buur) => netwerk.has(tileSleutel(buur.hoogte, buur.positieInLaag)));
}
