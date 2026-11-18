/**
 * Everything the game remembers, in localStorage ("lisenok:progress"):
 * collected stars and gifts, the child's level (adjusted automatically), skill stats for the
 * parents' corner, settings and today's play time.
 */
import { useSyncExternalStore } from "react";
import { FOREST, type Skill } from "../content/forest.ts";
import type { Level } from "./tasks.ts";

export const STORAGE_KEY = "lisenok:progress";

export type SkillStat = { tasks: number; firstTry: number; mistakes: number; hints: number };
/** per word: tasks seen, mistakes, hints, and the current run of clean answers */
export type WordStat = { seen: number; miss: number; hints: number; streak: number };
export type Settings = {
  name: string | null;
  level: Level;
  auto: boolean;
  /** minutes per day, 0 = no limit */
  limit: number;
  volume: { voice: number; sounds: number; music: number; forest: number };
};
export type Progress = {
  intro: boolean;
  /** stop id -> how many times solved */
  done: Record<string, number>;
  gifts: string[];
  /** mistakes in the last stops (for auto level) */
  recent: number[];
  skills: Partial<Record<Skill, SkillStat>>;
  /** word id -> stats (adaptation at the word level, details in the parents' corner) */
  words: Record<string, WordStat>;
  settings: Settings;
  /** "2026-11-18" -> seconds played */
  playLog: Record<string, number>;
  /** minutes a grown-up added today on the rest screen */
  extra: Record<string, number>;
  forestCelebrated: boolean;
};

const DEFAULT: Progress = {
  intro: false,
  done: {},
  gifts: [],
  recent: [],
  skills: {},
  words: {},
  settings: {
    name: null,
    level: 1,
    auto: true,
    limit: 0,
    volume: { voice: 1, sounds: 0.8, music: 0.5, forest: 0.6 },
  },
  playLog: {},
  extra: {},
  forestCelebrated: false,
};

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

function load(): Progress {
  if (typeof localStorage === "undefined") return DEFAULT;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      ...DEFAULT,
      ...saved,
      settings: {
        ...DEFAULT.settings,
        ...saved.settings,
        volume: { ...DEFAULT.settings.volume, ...saved.settings?.volume },
      },
    };
  } catch {
    return DEFAULT;
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();

export function getProgress() {
  return state;
}
export function update(fn: (p: Progress) => Progress) {
  state = fn(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode: keep in memory */
  }
  listeners.forEach((l) => l());
}
export function useProgress() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => DEFAULT,
  );
}
export const setSettings = (patch: Partial<Settings>) =>
  update((p) => ({ ...p, settings: { ...p.settings, ...patch } }));

export function resetProgress() {
  update((p) => ({ ...DEFAULT, settings: p.settings, intro: true }));
}

// ---------- the forest path ----------
export const starsIn = (p: Progress) => FOREST.filter((s) => p.done[s.id]).length;
/** Stops open one after another: the first unsolved one is the next. */
export const nextStopIndex = (p: Progress) => {
  const i = FOREST.findIndex((s) => !p.done[s.id]);
  return i === -1 ? FOREST.length : i;
};
export const stopOpen = (p: Progress, index: number) => index <= nextStopIndex(p);

// ---------- answers ----------
export function recordTask(skill: Skill, mistakes: number, hinted: boolean, word?: string) {
  update((p) => {
    const words = word
      ? { ...p.words, [word]: nextWordStat(p.words[word], mistakes, hinted) }
      : p.words;
    const s = p.skills[skill] ?? { tasks: 0, firstTry: 0, mistakes: 0, hints: 0 };
    return {
      ...p,
      words,
      skills: {
        ...p.skills,
        [skill]: {
          tasks: s.tasks + 1,
          firstTry: s.firstTry + (mistakes === 0 ? 1 : 0),
          mistakes: s.mistakes + mistakes,
          hints: s.hints + (hinted ? 1 : 0),
        },
      },
    };
  });
}

/**
 * A stop is solved: star + gift, and the automatic level check.
 * Two clean stops in a row -> a bit harder; two hard stops in a row -> a bit easier.
 */
export function finishStop(
  stopId: string,
  mistakes: number,
): { first: boolean; level: "up" | "down" | null } {
  const stop = FOREST.find((s) => s.id === stopId);
  const first = !state.done[stopId];
  let change: "up" | "down" | null = null;
  update((p) => {
    const recent = [...p.recent, mistakes].slice(-3);
    let level = p.settings.level;
    let keep = recent;
    if (p.settings.auto && recent.length >= 2) {
      const [a, b] = recent.slice(-2);
      if (a === 0 && b === 0 && level < 3) {
        level = (level + 1) as Level;
        change = "up";
        keep = [];
      } else if (a >= 3 && b >= 3 && level > 1) {
        level = (level - 1) as Level;
        change = "down";
        keep = [];
      }
    }
    return {
      ...p,
      done: { ...p.done, [stopId]: (p.done[stopId] ?? 0) + 1 },
      gifts: stop && !p.gifts.includes(stop.gift) ? [...p.gifts, stop.gift] : p.gifts,
      recent: keep,
      settings: { ...p.settings, level },
    };
  });
  return { first, level: change };
}

/** A clean answer without a hint adds to the streak; a mistake or a hint resets it. */
export function nextWordStat(s: WordStat | undefined, mistakes: number, hinted: boolean): WordStat {
  const old = s ?? { seen: 0, miss: 0, hints: 0, streak: 0 };
  const clean = mistakes === 0 && !hinted;
  return {
    seen: old.seen + 1,
    miss: old.miss + mistakes,
    hints: old.hints + (hinted ? 1 : 0),
    streak: clean ? old.streak + 1 : 0,
  };
}

/** Words to bring back: had a stumble and have not yet been answered cleanly twice in a row. */
export function weakWordIds(p: Progress): Set<string> {
  return new Set(
    Object.entries(p.words)
      .filter(([, w]) => (w.miss > 0 || w.hints > 0) && w.streak < 2)
      .map(([id]) => id),
  );
}

/** Skills that need practice: at least 3 tasks and fewer than 60% right on the first try. */
export function weakSkills(p: Progress): Skill[] {
  return (Object.entries(p.skills) as [Skill, SkillStat][])
    .filter(([, s]) => s.tasks >= 3 && s.firstTry / s.tasks < 0.6)
    .map(([k]) => k);
}

// ---------- play time ----------
export function addPlayTime(seconds: number) {
  const d = today();
  update((p) => ({ ...p, playLog: { [d]: (p.playLog[d] ?? 0) + seconds } }));
}
export function timeIsUp(p: Progress) {
  if (!p.settings.limit) return false;
  const d = today();
  return (p.playLog[d] ?? 0) >= (p.settings.limit + (p.extra[d] ?? 0)) * 60;
}
export function addTenMinutes() {
  const d = today();
  update((p) => ({ ...p, extra: { [d]: (p.extra[d] ?? 0) + 10 } }));
}

export const LEVEL_NAMES: Record<Level, string> = {
  1: "5–6 лет: буквы, звуки, счёт до 10",
  2: "6–7 лет: слоги, слова, счёт до 20",
  3: "8–9 лет: предложения, задачи до 100",
};
