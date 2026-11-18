/**
 * Sound: voice lines, effects and music through one Web Audio graph with three volume buses
 * (voice / sounds / music — set in the parents' corner). Voice lines play as sequences
 * ("Найди букву" + "эм"); a new sequence cuts the previous one. Music ducks under the voice.
 */
import { NO_OPUS, formats, musicUrl, sfxUrl, voiceUrl } from "./assets";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voiceBus: GainNode | null = null;
let soundBus: GainNode | null = null;
let musicBus: GainNode | null = null;
const volumes = { voice: 1, sounds: 0.8, music: 0.5 };
const raw = new Map<string, Promise<ArrayBuffer>>();
const buffers = new Map<string, AudioBuffer>();
const decoding = new Map<string, Promise<AudioBuffer | null>>();
let paused = false;
let voiceNode: AudioBufferSourceNode | null = null;
let sequence = 0;
const MUSIC_BASE = 0.35;

function context() {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.connect(ctx.destination);
    voiceBus = ctx.createGain();
    soundBus = ctx.createGain();
    musicBus = ctx.createGain();
    voiceBus.gain.value = volumes.voice;
    soundBus.gain.value = volumes.sounds;
    musicBus.gain.value = MUSIC_BASE * volumes.music;
    voiceBus.connect(master);
    soundBus.connect(master);
    musicBus.connect(master);
  }
  if (ctx.state === "suspended" && !paused) void ctx.resume();
  return ctx;
}

export function setVolumes(next: { voice: number; sounds: number; music: number }) {
  Object.assign(volumes, next);
  if (voiceBus) voiceBus.gain.value = volumes.voice;
  if (soundBus) soundBus.gain.value = volumes.sounds;
  if (musicBus) musicBus.gain.value = MUSIC_BASE * volumes.music;
  if (volumes.music === 0) music?.pause();
  else if (musicWanted) startMusic();
}

// ---------- iPhone silent switch: play as media (iOS 17+) or keep a silent <audio> running ----------
let silentEl: HTMLAudioElement | null = null;
function silentWavUrl() {
  const rate = 8000;
  const samples = rate / 2;
  const buf = new ArrayBuffer(44 + samples * 2);
  const v = new DataView(buf);
  const text = (o: number, t: string) =>
    [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  text(0, "RIFF");
  v.setUint32(4, 36 + samples * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, samples * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}
const isAppleTouch = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
function playThroughSilentSwitch() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) {
    try {
      session.type = "playback";
      return;
    } catch {
      /* fall back */
    }
  }
  if (!isAppleTouch()) return;
  if (!silentEl) {
    silentEl = document.createElement("audio");
    silentEl.src = silentWavUrl();
    silentEl.loop = true;
    silentEl.setAttribute("playsinline", "");
  }
  if (silentEl.paused && !paused) void silentEl.play().catch(() => {});
}

/** Call from a tap: opens the audio context (browsers allow sound only after a gesture). */
export function unlockAudio() {
  playThroughSilentSwitch();
  const audio = context();
  const src = audio.createBufferSource();
  src.buffer = audio.createBuffer(1, 1, audio.sampleRate);
  src.connect(audio.destination);
  src.start();
}
export const audioReady = () => Boolean(ctx && ctx.state === "running");

// ---------- loading ----------
function bytes(url: string) {
  let pending = raw.get(url);
  if (!pending) {
    pending = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      return res.arrayBuffer();
    });
    pending.catch(() => raw.delete(url));
    raw.set(url, pending);
  }
  return pending;
}
function decode(url: string): Promise<AudioBuffer | null> {
  const ready = buffers.get(url);
  if (ready) return Promise.resolve(ready);
  let p = decoding.get(url);
  if (!p) {
    p = bytes(url)
      .then((data) => context().decodeAudioData(data.slice(0)))
      .then((b) => {
        buffers.set(url, b);
        return b;
      })
      .catch(() => {
        decoding.delete(url);
        // a browser that claims Opus but cannot decode it (some Safari versions): MP3 from now on
        if (/\.ogg(\?|$)/.test(url)) {
          formats.opus = false;
          try {
            localStorage.setItem(NO_OPUS, "1");
          } catch {
            /* private mode: MP3 for this visit only */
          }
          return decode(url.replace(/\.ogg(\?|$)/, ".mp3$1"));
        }
        return null; // a missing clip never blocks the game
      });
    decoding.set(url, p);
  }
  return p;
}
/** Start downloading (allowed before the first tap). */
export function prefetchVoice(keys: string[]) {
  for (const k of keys) void bytes(voiceUrl(k)).catch(() => {});
}

// ---------- voice ----------
function stopVoiceNode() {
  if (!voiceNode) return;
  try {
    voiceNode.stop();
  } catch {
    /* ended */
  }
  voiceNode.disconnect();
  voiceNode = null;
}
export function stopVoice() {
  sequence++;
  stopVoiceNode();
  duck(false);
}
let speakingListeners = new Set<(on: boolean) => void>();
export function onSpeaking(fn: (on: boolean) => void) {
  speakingListeners.add(fn);
  return () => {
    speakingListeners = new Set([...speakingListeners].filter((f) => f !== fn));
  };
}
function duck(on: boolean) {
  speakingListeners.forEach((f) => f(on));
  if (!ctx || !musicBus) return;
  const target = MUSIC_BASE * volumes.music * (on ? 0.35 : 1);
  musicBus.gain.setTargetAtTime(target, ctx.currentTime, 0.12);
}

/**
 * Says voice lines one after another. Resolves `true` when all were played, `false` when
 * something else cut it off. Small gap between parts so "три плюс два" sounds natural.
 */
export async function say(keys: string[], gap = 0.12): Promise<boolean> {
  const my = ++sequence;
  stopVoiceNode();
  if (typeof window === "undefined" || !keys.length) return true;
  const list = await Promise.all(keys.map((k) => decode(voiceUrl(k))));
  if (my !== sequence) return false;
  const audio = context();
  duck(true);
  for (const buffer of list) {
    if (!buffer) continue;
    if (my !== sequence) return false;
    await new Promise<void>((resolve) => {
      const src = audio.createBufferSource();
      src.buffer = buffer;
      src.connect(voiceBus ?? audio.destination);
      voiceNode = src;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };
      src.onended = finish;
      // safety net: never hang if `ended` does not fire (suspended context, test browsers)
      const timer = setTimeout(finish, buffer.duration * 1000 + 1500);
      src.start();
    });
    if (my !== sequence) return false;
    await new Promise((r) => setTimeout(r, gap * 1000));
  }
  if (my === sequence) {
    voiceNode = null;
    duck(false);
  }
  return my === sequence;
}

// ---------- effects ----------
export type Sfx = "tap" | "pick" | "right" | "wrong" | "star" | "fanfare" | "step";
export async function sfx(name: Sfx, gain = 1) {
  if (typeof window === "undefined") return;
  const buffer = await decode(sfxUrl(name));
  if (!buffer || paused) return;
  const audio = context();
  const src = audio.createBufferSource();
  const g = audio.createGain();
  g.gain.value = gain;
  src.buffer = buffer;
  src.connect(g);
  g.connect(soundBus ?? audio.destination);
  src.start();
  src.onended = () => g.disconnect();
}
export function warmSfx() {
  for (const s of ["tap", "pick", "right", "wrong", "star", "fanfare", "step"] as Sfx[])
    void decode(sfxUrl(s));
}

// ---------- music: Kevin MacLeod "Easy Lemon" (CC BY 4.0), streamed through the music bus ----------
let music: HTMLAudioElement | null = null;
let musicWanted = false;
export function startMusic() {
  musicWanted = true;
  if (typeof window === "undefined" || volumes.music === 0 || paused) return;
  const audio = context();
  if (!music) {
    music = new Audio(musicUrl());
    music.loop = true;
    music.preload = "auto";
    music.crossOrigin = "anonymous";
    try {
      audio.createMediaElementSource(music).connect(musicBus ?? audio.destination);
    } catch {
      music.volume = MUSIC_BASE * volumes.music;
    }
  }
  if (music.paused) void music.play().catch(() => {});
}
export function stopMusic() {
  musicWanted = false;
  music?.pause();
}

// ---------- app hidden: freeze everything ----------
let musicWasPlaying = false;
export function pauseAudio() {
  if (paused) return;
  paused = true;
  stopVoice();
  if (ctx && ctx.state === "running") void ctx.suspend();
  musicWasPlaying = Boolean(music && !music.paused);
  music?.pause();
  silentEl?.pause();
}
export function resumeAudio() {
  paused = false;
  if (ctx && ctx.state !== "running") void ctx.resume();
  if (silentEl) void silentEl.play().catch(() => {});
  if (musicWasPlaying && music) void music.play().catch(() => {});
  musicWasPlaying = false;
}
