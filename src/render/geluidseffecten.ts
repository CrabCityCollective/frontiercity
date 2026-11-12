// Korte geluidseffecten (issue #583): klik, hamerslag, stamp, karrengeluid en
// steenbeitel. Net als de muziek volledig procedureel via de Web Audio API —
// geen audiobestanden. Volgt de bestaande geluid-aan/uit-voorkeur
// (`muziekAan` in save.ts). Alle functies zijn veilig om aan te roepen op
// elk moment: zonder AudioContext of zonder gebruikersgebaar doen ze niets.

import { muziekAan } from "@/game/save";

let ctx: AudioContext | null = null;
let ruisBuffer: AudioBuffer | null = null;

function haalContext(): AudioContext | null {
  if (typeof window === "undefined" || !muziekAan()) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

function ruis(c: AudioContext): AudioBuffer {
  if (!ruisBuffer || ruisBuffer.sampleRate !== c.sampleRate) {
    ruisBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = ruisBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ruisBuffer;
}

// Gefilterde ruisstoot met uitdovende envelope.
function ruisStoot(
  c: AudioContext,
  t: number,
  duur: number,
  freq: number,
  q: number,
  volume: number,
  type: BiquadFilterType = "bandpass"
) {
  const bron = c.createBufferSource();
  bron.buffer = ruis(c);
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duur);
  bron.connect(filter).connect(gain).connect(c.destination);
  bron.start(t, Math.random() * 0.5);
  bron.stop(t + duur + 0.02);
}

// Kort dalend toontje (houten "tok" / bonk).
function toon(c: AudioContext, t: number, van: number, naar: number, duur: number, volume: number, type: OscillatorType = "sine") {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(van, t);
  osc.frequency.exponentialRampToValueAtTime(naar, t + duur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duur + 0.02);
}

// Menu-/knopklik: kort, droog tikje.
export function speelKlik(): void {
  const c = haalContext();
  if (!c) return;
  const t = c.currentTime;
  toon(c, t, 1400, 700, 0.04, 0.12, "triangle");
  ruisStoot(c, t, 0.02, 3500, 1, 0.05);
}

// Hamerslag (heel kort) bij het plaatsen/beginnen van een land improvement.
export function speelHamer(): void {
  const c = haalContext();
  if (!c) return;
  const t = c.currentTime;
  toon(c, t, 520, 160, 0.07, 0.3, "square");
  ruisStoot(c, t, 0.05, 2200, 0.8, 0.25);
}

// Stamp bij het aanleggen van een weg: lage dreun.
export function speelStamp(): void {
  const c = haalContext();
  if (!c) return;
  const t = c.currentTime;
  toon(c, t, 130, 45, 0.22, 0.6, "sine");
  ruisStoot(c, t, 0.12, 300, 0.7, 0.35, "lowpass");
}

// Karrengeluid bij het aanklikken van een stad: rammelende wielen op hout.
export function speelKar(): void {
  const c = haalContext();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 6; i++) {
    const tt = t + i * 0.085 + Math.random() * 0.015;
    ruisStoot(c, tt, 0.07, 420 + Math.random() * 200, 2.5, 0.16);
    toon(c, tt, 190 + Math.random() * 40, 110, 0.06, 0.1, "triangle");
  }
  ruisStoot(c, t, 0.55, 180, 0.5, 0.06, "lowpass");
}

// Steenbeitel: scherpe tik-tik met metalen rinkel.
export function speelBeitel(): void {
  const c = haalContext();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 3; i++) {
    const tt = t + i * 0.13;
    ruisStoot(c, tt, 0.03, 4200, 1.2, 0.22, "highpass");
    toon(c, tt, 2600 + i * 250, 2100 + i * 200, 0.12, 0.08, "sine");
    toon(c, tt, 900, 500, 0.04, 0.12, "square");
  }
}
