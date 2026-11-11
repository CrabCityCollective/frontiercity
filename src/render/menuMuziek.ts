// Menumuziek voor het titel-, navigatie-, campagne-select- en introscherm
// (issue #577: "rustig, warm, atmosferisch — gitaar, sitar en didgeridoo").
//
// Net als `achtergrondMuziek.ts` volledig procedureel via de Web Audio API,
// zonder audiobestanden. Drie lagen boven een D-bourdon:
//  - didgeridoo: laag, warm gedreun met een langzaam bewegend formantfilter;
//  - gitaar: zacht arpeggio (Karplus-Strong) over D-dorisch akkoorden;
//  - sitar: spaarzame melodiefrases met glijdende (meend) aanslagen en een
//    nasaal, "snorrend" timbre.
import { maakPluckBuffer } from "./achtergrondMuziek";

const TEMPO_BPM = 56;
const ACHTSTE = 60 / TEMPO_BPM / 2;
const VOLUME = 0.2;
const VOORUIT_PLANNEN_S = 1.5;

const D2 = 73.42;

interface Akkoord {
  bas: number;
  noten: [number, number, number];
}

// D-dorisch boven een constante D-bourdon: Dm9 – C/D – Gsus/D – Am/D.
const AKKOORDEN: Akkoord[] = [
  { bas: 146.83, noten: [220.0, 261.63, 329.63] },
  { bas: 130.81, noten: [196.0, 261.63, 329.63] },
  { bas: 98.0, noten: [196.0, 293.66, 329.63] },
  { bas: 110.0, noten: [220.0, 261.63, 329.63] },
];
const PATROON = [0, 1, 2, 3, 2, 1, 3, 2];

// Sitar-melodie: D-dorisch pentatoon (D E F A C D).
const SITAR_NOTEN = [293.66, 329.63, 349.23, 440.0, 523.25, 587.33];

export interface MenuMuziek {
  stop: () => void;
}

export function startMenuMuziek(): MenuMuziek | null {
  const AudioCtor =
    typeof window !== "undefined"
      ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!AudioCtor) return null;

  const ctx = new AudioCtor();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 3);
  master.connect(ctx.destination);

  // Didgeridoo: twee licht ontstemde zaagtanden door een laagdoorlaatfilter
  // met trage LFO op de afsnijfrequentie (de "wah" van het instrument).
  const didgGain = ctx.createGain();
  didgGain.gain.value = 0.5;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 380;
  filter.Q.value = 6;
  filter.connect(didgGain).connect(master);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoDiepte = ctx.createGain();
  lfoDiepte.gain.value = 220;
  lfo.connect(lfoDiepte).connect(filter.frequency);
  const bronnen: OscillatorNode[] = [lfo];
  for (const detune of [-6, 5]) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = D2;
    osc.detune.value = detune;
    osc.connect(filter);
    bronnen.push(osc);
  }
  // Ademhaling: trage amplitude-golf op het gedreun.
  const adem = ctx.createOscillator();
  adem.frequency.value = 0.09;
  const ademDiepte = ctx.createGain();
  ademDiepte.gain.value = 0.15;
  adem.connect(ademDiepte).connect(didgGain.gain);
  bronnen.push(adem);
  for (const b of bronnen) b.start();

  const cache = new Map<number, AudioBuffer>();
  function gitaar(freq: number, tijd: number, volume: number) {
    let buffer = cache.get(freq);
    if (!buffer) {
      buffer = maakPluckBuffer(ctx, freq, "gitaar");
      cache.set(freq, buffer);
    }
    const bron = ctx.createBufferSource();
    bron.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    bron.connect(gain).connect(master);
    bron.start(tijd);
  }

  // Sitar: zaagtand met glijdende aanloop naar de doelnoot, scherpe aanslag
  // en lange uitklink; een bandfilter geeft het nasale timbre.
  function sitar(freq: number, tijd: number, duur: number, volume: number) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * 0.94, tijd);
    osc.frequency.exponentialRampToValueAtTime(freq, tijd + 0.12);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = freq * 3;
    band.Q.value = 2.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, tijd);
    gain.gain.linearRampToValueAtTime(volume, tijd + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0005, tijd + duur);
    osc.connect(band).connect(gain).connect(master);
    osc.start(tijd);
    osc.stop(tijd + duur + 0.05);
  }

  let stap = 0;
  let volgendeTijd = ctx.currentTime + 0.3;

  function plan() {
    while (volgendeTijd < ctx.currentTime + VOORUIT_PLANNEN_S) {
      const maat = Math.floor(stap / 8) % AKKOORDEN.length;
      const inMaat = stap % 8;
      const akkoord = AKKOORDEN[maat];
      const tijd = volgendeTijd + (Math.random() - 0.5) * 0.015;
      const idx = PATROON[inMaat];
      const freq = idx === 0 ? akkoord.bas : akkoord.noten[idx - 1];
      gitaar(freq, tijd, (idx === 0 ? 0.8 : 0.45) * (0.85 + Math.random() * 0.3));
      // Sitar-frase: aan het begin van een maat, soms ook halverwege.
      if ((inMaat === 0 || inMaat === 4) && Math.random() < (inMaat === 0 ? 0.55 : 0.3)) {
        const noot = SITAR_NOTEN[Math.floor(Math.random() * SITAR_NOTEN.length)];
        sitar(noot, tijd + ACHTSTE * 0.5, 2.4, 0.16);
      }
      volgendeTijd += ACHTSTE;
      stap++;
    }
  }

  plan();
  const timer = window.setInterval(plan, 250);
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});

  return {
    stop() {
      window.clearInterval(timer);
      const nu = ctx.currentTime;
      master.gain.cancelScheduledValues(nu);
      master.gain.setValueAtTime(master.gain.value, nu);
      master.gain.linearRampToValueAtTime(0, nu + 0.8);
      window.setTimeout(() => void ctx.close().catch(() => {}), 1000);
    },
  };
}
