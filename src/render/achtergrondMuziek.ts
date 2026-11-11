// Achtergrondmuziek voor de Going West-campagne (issue #575: "rustig, een
// beetje banjo en gitaar, zoals Red Dead Redemption 2").
//
// Volledig procedureel via de Web Audio API (Karplus-Strong-getokkelde
// snaren) — geen audiobestanden, dus geen licentie- of laadgewicht. Een
// rustige akkoordenreeks (Am – F – C – G) met een vingerpicking-patroon op
// "gitaar" en spaarzame, helderdere "banjo"-tokkels erboven. Alleen bedoeld
// voor niet-tutorial-campagnes; de aanroeper (`useAchtergrondMuziek`) bepaalt
// wanneer dit draait.

const TEMPO_BPM = 68;
const ACHTSTE = 60 / TEMPO_BPM / 2;
const VOLUME = 0.18;
const VOORUIT_PLANNEN_S = 1.2;

interface Akkoord {
  bas: number;
  noten: [number, number, number];
}

const AKKOORDEN: Akkoord[] = [
  { bas: 110.0, noten: [220.0, 261.63, 329.63] }, // Am
  { bas: 87.31, noten: [174.61, 220.0, 261.63] }, // F
  { bas: 130.81, noten: [196.0, 261.63, 329.63] }, // C
  { bas: 98.0, noten: [196.0, 246.94, 293.66] }, // G
];

// Vingerpicking-patroon per maat van 8 achtsten: index 0 = bas, 1-3 = noten.
const PATROON = [0, 1, 2, 3, 2, 3, 2, 1];

type PluckSoort = "gitaar" | "banjo";

export function maakPluckBuffer(ctx: AudioContext, freq: number, soort: PluckSoort): AudioBuffer {
  const duur = soort === "gitaar" ? 2.6 : 1.1;
  const demping = soort === "gitaar" ? 0.996 : 0.99;
  const lengte = Math.floor(ctx.sampleRate * duur);
  const buffer = ctx.createBuffer(1, lengte, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const periode = Math.max(2, Math.round(ctx.sampleRate / freq));
  const ring = new Float32Array(periode);
  // Banjo: scherpere aanslag (witte ruis); gitaar: zachtere, gefilterde ruis.
  let vorige = 0;
  for (let i = 0; i < periode; i++) {
    const ruis = Math.random() * 2 - 1;
    vorige = soort === "gitaar" ? vorige * 0.6 + ruis * 0.4 : ruis;
    ring[i] = vorige;
  }
  for (let i = 0; i < lengte; i++) {
    const idx = i % periode;
    const volgende = ring[(idx + 1) % periode];
    data[i] = ring[idx];
    ring[idx] = demping * 0.5 * (ring[idx] + volgende);
  }
  return buffer;
}

export interface AchtergrondMuziek {
  stop: () => void;
}

export function startAchtergrondMuziek(): AchtergrondMuziek | null {
  const AudioCtor =
    typeof window !== "undefined"
      ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!AudioCtor) return null;

  const ctx = new AudioCtor();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 4);
  master.connect(ctx.destination);

  const cache = new Map<string, AudioBuffer>();
  function speel(freq: number, soort: PluckSoort, tijd: number, volume: number) {
    const sleutel = `${soort}:${freq.toFixed(2)}`;
    let buffer = cache.get(sleutel);
    if (!buffer) {
      buffer = maakPluckBuffer(ctx, freq, soort);
      cache.set(sleutel, buffer);
    }
    const bron = ctx.createBufferSource();
    bron.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    bron.connect(gain).connect(master);
    bron.start(tijd);
  }

  let stap = 0;
  let volgendeTijd = ctx.currentTime + 0.3;

  function plan() {
    while (volgendeTijd < ctx.currentTime + VOORUIT_PLANNEN_S) {
      const maat = Math.floor(stap / 8) % AKKOORDEN.length;
      const inMaat = stap % 8;
      const akkoord = AKKOORDEN[maat];
      // Lichte "menselijke" timing- en volume-variatie.
      const tijd = volgendeTijd + (Math.random() - 0.5) * 0.012;
      const idx = PATROON[inMaat];
      const freq = idx === 0 ? akkoord.bas : akkoord.noten[idx - 1];
      speel(freq, "gitaar", tijd, (idx === 0 ? 0.9 : 0.5) * (0.85 + Math.random() * 0.3));
      if (inMaat === 4) speel(akkoord.bas * 2, "gitaar", tijd, 0.35);
      // Spaarzame banjo-tokkel een octaaf hoger, op de oneven achtsten.
      if (inMaat % 2 === 1 && Math.random() < 0.3) {
        const noot = akkoord.noten[Math.floor(Math.random() * 3)] * 2;
        speel(noot, "banjo", tijd + ACHTSTE * 0.5, 0.3);
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
