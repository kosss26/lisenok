/**
 * Task generators: one stop = a short round of tasks for one skill at the child's level.
 * Pure functions (random source injectable) so they can be unit-tested.
 */
import type { Skill } from "../content/forest.ts";
import { letterKey, numKey, sylKey, wordKey } from "../content/voice.ts";
import {
  EASY_LETTERS,
  LETTER_NAMES,
  SENTENCES,
  SYLLABLES,
  WORDS,
  WORDS_BY_LEVEL,
  wordById,
} from "../content/words.ts";

export type Level = 1 | 2 | 3;
export type Rand = () => number;

export type Option = {
  id: string;
  /** big text on the card (letter, number, word, syllable, sign) */
  label?: string;
  /** picture (public/art) */
  pic?: string;
  /** how many pictures (compare groups) */
  count?: number;
  /** voice key spoken when tapped */
  say?: string;
};

export type Visual =
  | { type: "listen" }
  | { type: "picture"; pic: string; text?: string }
  | { type: "word"; text: string }
  | { type: "sentence"; text: string }
  | { type: "count"; pic: string; n: number; mode: "loose" | "rows" | "tens" }
  | { type: "math"; a: number; b: number; op: "+" | "-"; pic?: string }
  | { type: "compare"; left: string; right: string };

export type ChoiceTask = {
  kind: "choice";
  skill: Skill;
  prompt: string[];
  hint: string[];
  visual: Visual;
  layout: "letters" | "pictures" | "numbers" | "words" | "signs" | "groups" | "syllables";
  options: Option[];
  answer: string;
};

export type BuildTask = {
  kind: "build";
  skill: Skill;
  prompt: string[];
  hint: string[];
  pic: string;
  /** the pieces of the word in order (letters or syllables) */
  target: string[];
  /** shuffled pieces on the table, including distractors */
  pieces: string[];
  /** show faint letters in the slots (youngest level) */
  ghost: boolean;
  unit: "letter" | "syllable";
};

export type Task = ChoiceTask | BuildTask;

export const ROUND = 3;

// ---------- helpers ----------
export const pick = <T>(arr: readonly T[], rand: Rand): T => arr[Math.floor(rand() * arr.length)];
export function shuffle<T>(arr: readonly T[], rand: Rand): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const int = (lo: number, hi: number, rand: Rand) => lo + Math.floor(rand() * (hi - lo + 1));
/** `count` different items from `pool` (without `not`). */
function sample<T>(pool: readonly T[], count: number, rand: Rand, not: T[] = []): T[] {
  return shuffle(
    pool.filter((x) => !not.includes(x)),
    rand,
  ).slice(0, count);
}
/** Wrong numbers near the right one, all within [lo, hi]. */
function nearNumbers(answer: number, count: number, lo: number, hi: number, rand: Rand) {
  const out = new Set<number>();
  const spread = [1, -1, 2, -2, 10, -10, 3, -3, 5, -5];
  for (const d of shuffle(spread.slice(0, answer >= 20 ? 10 : 6), rand)) {
    const v = answer + d;
    if (v >= lo && v <= hi && v !== answer) out.add(v);
    if (out.size === count) break;
  }
  for (let v = lo; out.size < count && v <= hi; v++) if (v !== answer) out.add(v);
  return [...out];
}
const numberOptions = (answer: number, wrong: number[], rand: Rand): Option[] =>
  shuffle([answer, ...wrong], rand).map((n) => ({
    id: String(n),
    label: String(n),
    say: numKey(n),
  }));
const wordsAt = (level: Level) => WORDS_BY_LEVEL[level].map(wordById);
/** take from the start of a shuffled deck so a round never repeats an item */
function deck<T>(items: readonly T[], rand: Rand) {
  let d = shuffle(items, rand);
  return () => {
    if (!d.length) d = shuffle(items, rand);
    return d.shift() as T;
  };
}

// ---------- skills ----------
function letters(level: Level, rand: Rand): Task[] {
  if (level === 1) {
    const next = deck(EASY_LETTERS, rand);
    return Array.from({ length: ROUND }, () => {
      const l = next();
      const opts = shuffle([l, ...sample(EASY_LETTERS, 2, rand, [l])], rand);
      return {
        kind: "choice",
        skill: "letters",
        prompt: ["q-letter-find", letterKey(l)],
        hint: ["h-letter", letterKey(l)],
        visual: { type: "listen" },
        layout: "letters",
        options: opts.map((x) => ({ id: x, label: x, say: letterKey(x) })),
        answer: l,
      };
    });
  }
  const pool = wordsAt(level).filter((w) => w.word[0] !== "Ё");
  const next = deck(pool, rand);
  const all = Object.keys(LETTER_NAMES).filter((l) => !"ЙЪЬЁЩ".includes(l));
  return Array.from({ length: ROUND }, () => {
    const w = next();
    if (level === 2) {
      const l = w.word[0];
      const opts = shuffle([l, ...sample(all, 3, rand, [l])], rand);
      return {
        kind: "choice",
        skill: "letters",
        prompt: ["q-letter-first", wordKey(w.id)],
        hint: ["h-letter-first", wordKey(w.id)],
        visual: { type: "picture", pic: w.pic },
        layout: "letters",
        options: opts.map((x) => ({ id: x, label: x, say: letterKey(x) })),
        answer: l,
      };
    }
    // level 3: a letter is missing (not the first)
    const i = int(1, w.word.length - 1, rand);
    let at = i;
    while ("ЬЪ".includes(w.word[at])) at = at === 1 ? w.word.length - 1 : at - 1;
    const l = w.word[at];
    const opts = shuffle([l, ...sample(all, 3, rand, [l])], rand);
    return {
      kind: "choice",
      skill: "letters",
      prompt: ["q-letter-gap", wordKey(w.id)],
      hint: ["h-letter-gap", wordKey(w.id)],
      visual: {
        type: "picture",
        pic: w.pic,
        text: w.word.slice(0, at) + "_" + w.word.slice(at + 1),
      },
      layout: "letters",
      options: opts.map((x) => ({ id: x, label: x, say: letterKey(x) })),
      answer: l,
    };
  });
}

const COUNTABLE = ["cone", "acorn", "mushroom", "apple", "raspberry", "leaf", "strawberry"];

function count(level: Level, rand: Rand): Task[] {
  const pics = deck(COUNTABLE, rand);
  const used = new Set<number>();
  return Array.from({ length: ROUND }, () => {
    const pic = pics();
    let n = 0;
    do {
      n = level === 1 ? int(3, 10, rand) : level === 2 ? int(8, 20, rand) : int(21, 99, rand);
    } while (used.has(n));
    used.add(n);
    const lo = level === 1 ? 1 : level === 2 ? 5 : 11;
    const hi = level === 1 ? 10 : level === 2 ? 20 : 100;
    return {
      kind: "choice",
      skill: "count",
      prompt: [`q-count-${level}`],
      hint: [level === 3 ? "h-count-3" : "h-count"],
      visual: {
        type: "count",
        pic,
        n,
        mode: level === 1 ? "loose" : level === 2 ? "rows" : "tens",
      },
      layout: "numbers",
      options: numberOptions(n, nearNumbers(n, level === 1 ? 2 : 3, lo, hi, rand), rand),
      answer: String(n),
    };
  });
}

function build(level: Level, rand: Rand): Task[] {
  const next = deck(wordsAt(level), rand);
  const alphabet = "АОУИЫЭМСЛНДКРБТП".split("");
  return Array.from({ length: ROUND }, () => {
    const w = next();
    const target = [...w.word];
    const extra =
      level === 3
        ? sample(alphabet, 2, rand, target)
        : level === 2
          ? sample(alphabet, 1, rand, target)
          : [];
    return {
      kind: "build",
      skill: "build",
      prompt: ["q-build", wordKey(w.id)],
      hint: ["h-build", wordKey(w.id)],
      pic: w.pic,
      target,
      pieces: shuffle([...target, ...extra], rand),
      ghost: level === 1,
      unit: "letter",
    };
  });
}

function read(level: Level, rand: Rand): Task[] {
  const pool = wordsAt(level);
  const next = deck(pool, rand);
  return Array.from({ length: ROUND }, () => {
    const w = next();
    // distractors: prefer words that start with the same letter, so reading matters
    const others = WORDS.filter((x) => x.id !== w.id && x.pic !== w.pic);
    const similar = shuffle(
      others.filter((x) => x.word[0] === w.word[0]),
      rand,
    );
    const rest = shuffle(
      others.filter((x) => x.word[0] !== w.word[0]),
      rand,
    );
    const n = level === 3 ? 3 : 2;
    const wrong = [...(level === 1 ? [] : similar), ...rest].slice(0, n);
    return {
      kind: "choice",
      skill: "read",
      prompt: ["q-read"],
      hint: ["h-read", wordKey(w.id)],
      visual: { type: "word", text: w.word },
      layout: "pictures",
      options: shuffle([w, ...wrong], rand).map((x) => ({ id: x.id, pic: x.pic })),
      answer: w.id,
    };
  });
}

function addSub(op: "+" | "-", level: Level, rand: Rand): Task[] {
  const seen = new Set<string>();
  return Array.from({ length: ROUND }, () => {
    let a = 0;
    let b = 0;
    do {
      if (level === 1) {
        if (op === "+") {
          a = int(1, 4, rand);
          b = int(1, Math.min(4, 6 - a), rand);
        } else {
          a = int(3, 7, rand);
          b = int(1, a - 1, rand);
        }
      } else if (level === 2) {
        if (op === "+") {
          a = int(3, 12, rand);
          b = int(2, 20 - a, rand);
        } else {
          a = int(8, 20, rand);
          b = int(2, a - 2, rand);
        }
      } else if (op === "+") {
        a = int(12, 70, rand);
        b = int(5, 99 - a, rand);
      } else {
        a = int(30, 99, rand);
        b = int(5, a - 10, rand);
      }
    } while (seen.has(`${a}${op}${b}`));
    seen.add(`${a}${op}${b}`);
    const answer = op === "+" ? a + b : a - b;
    const pic = op === "+" ? "honey" : "apple";
    const hi = level === 1 ? 10 : level === 2 ? 20 : 100;
    return {
      kind: "choice",
      skill: op === "+" ? "add" : "sub",
      prompt: [
        level === 3 ? "q-solve" : op === "+" ? "q-add-story" : "q-sub-story",
        numKey(a),
        op === "+" ? "plus" : "minus",
        numKey(b),
      ],
      hint: [op === "+" ? (level === 3 ? "h-add-3" : "h-add") : level === 3 ? "h-sub-3" : "h-sub"],
      visual: { type: "math", a, b, op, pic: level === 3 || a > 12 ? undefined : pic },
      layout: "numbers",
      options: numberOptions(answer, nearNumbers(answer, level === 1 ? 2 : 3, 0, hi, rand), rand),
      answer: String(answer),
    };
  });
}

function syllables(level: Level, rand: Rand): Task[] {
  if (level === 1) {
    const next = deck(SYLLABLES, rand);
    return Array.from({ length: ROUND }, () => {
      const s = next();
      // distractors share a letter, so the child really listens
      const close = SYLLABLES.filter((x) => x !== s && (x[0] === s[0] || x[1] === s[1]));
      const wrong = sample(close.length >= 2 ? close : SYLLABLES, 2, rand, [s]);
      return {
        kind: "choice",
        skill: "syllables",
        prompt: ["q-syl-find", sylKey(s)],
        hint: ["h-letter", sylKey(s)],
        visual: { type: "listen" },
        layout: "syllables",
        options: shuffle([s, ...wrong], rand).map((x) => ({ id: x, label: x, say: sylKey(x) })),
        answer: s,
      };
    });
  }
  const pool = WORDS.filter((w) => {
    const n = w.syl.split("-").length;
    if (w.syl.startsWith("Ё-")) return false; // a lone "ё" syllable sounds unclear
    return level === 2 ? n === 2 && w.word.length <= 5 : n >= 2 && w.word.length >= 5;
  });
  const next = deck(pool, rand);
  const allSyl = [...new Set(WORDS.flatMap((w) => w.syl.split("-")))];
  return Array.from({ length: ROUND }, () => {
    const w = next();
    const target = w.syl.split("-");
    const extra = sample(allSyl, level === 2 ? 1 : 2, rand, target);
    return {
      kind: "build",
      skill: "syllables",
      prompt: ["q-syl-build", wordKey(w.id)],
      hint: ["h-syl", wordKey(w.id)],
      pic: w.pic,
      target,
      pieces: shuffle([...target, ...extra], rand),
      ghost: false,
      unit: "syllable",
    };
  });
}

const SIGNS: Option[] = [
  { id: "<", label: "<", say: "less" },
  { id: "=", label: "=", say: "equal" },
  { id: ">", label: ">", say: "more" },
];

function compare(level: Level, rand: Rand): Task[] {
  if (level === 1) {
    return Array.from({ length: ROUND }, (_, i) => {
      const more = i % 2 === 0 ? rand() < 0.7 : rand() < 0.3;
      let l = int(1, 8, rand);
      let r = int(1, 8, rand);
      while (Math.abs(l - r) < 2) r = int(1, 8, rand);
      if (rand() < 0.5) [l, r] = [r, l];
      const pic = pick(["cheese", "strawberry", "acorn"], rand);
      const answer = more ? (l > r ? "left" : "right") : l < r ? "left" : "right";
      return {
        kind: "choice",
        skill: "compare",
        prompt: [more ? "q-cmp-more" : "q-cmp-less"],
        hint: ["h-cmp"],
        visual: { type: "listen" },
        layout: "groups",
        options: [
          { id: "left", pic, count: l, say: numKey(l) },
          { id: "right", pic, count: r, say: numKey(r) },
        ],
        answer,
      };
    });
  }
  const kinds = shuffle(["<", ">", "="].concat(rand() < 0.5 ? ["<"] : [">"]), rand).slice(0, ROUND);
  return kinds.map((want) => {
    let left = "";
    let right = "";
    let lv = 0;
    let rv = 0;
    const max = level === 2 ? 20 : 100;
    if (level === 2) {
      lv =
        want === "<" ? int(1, max - 3, rand) : want === ">" ? int(4, max, rand) : int(1, max, rand);
      rv = want === "=" ? lv : want === "<" ? int(lv + 1, max, rand) : int(1, lv - 1, rand);
      left = String(lv);
      right = String(rv);
    } else {
      const a = int(10, 60, rand);
      const b = int(2, 30, rand);
      lv = a + b;
      rv = want === "=" ? lv : lv + (want === "<" ? int(1, 9, rand) : -int(1, 9, rand));
      left = `${a} + ${b}`;
      right = String(rv);
    }
    const sign = lv < rv ? "<" : lv > rv ? ">" : "=";
    return {
      kind: "choice",
      skill: "compare",
      prompt: ["q-cmp-sign"],
      hint: ["h-cmp-sign"],
      visual: { type: "compare", left, right },
      layout: "signs",
      options: SIGNS,
      answer: sign,
    } satisfies ChoiceTask;
  });
}

function sentence(level: Level, rand: Rand): Task[] {
  if (level === 1) {
    const next = deck(wordsAt(1), rand);
    return Array.from({ length: ROUND }, () => {
      const w = next();
      const wrong = sample(wordsAt(1), 2, rand, [w]);
      return {
        kind: "choice",
        skill: "sentence",
        prompt: ["q-word-find", wordKey(w.id)],
        hint: ["h-word-find", wordKey(w.id)],
        visual: { type: "listen" },
        layout: "words",
        options: shuffle([w, ...wrong], rand).map((x) => ({ id: x.id, label: x.word })),
        answer: w.id,
      };
    });
  }
  const next = deck(
    SENTENCES.filter((s) => s.level === level),
    rand,
  );
  return Array.from({ length: ROUND }, () => {
    const s = next();
    return {
      kind: "choice",
      skill: "sentence",
      prompt: [level === 3 ? "q-sentence-3" : "q-sentence"],
      hint: ["h-sentence", `sen-${s.id}`],
      visual: { type: "sentence", text: s.text },
      layout: "pictures",
      options: shuffle([s.answer, ...s.options], rand).map((p) => ({ id: p, pic: p })),
      answer: s.answer,
    };
  });
}

export function makeRound(skill: Skill, level: Level, rand: Rand = Math.random): Task[] {
  switch (skill) {
    case "letters":
      return letters(level, rand);
    case "count":
      return count(level, rand);
    case "build":
      return build(level, rand);
    case "read":
      return read(level, rand);
    case "add":
      return addSub("+", level, rand);
    case "sub":
      return addSub("-", level, rand);
    case "syllables":
      return syllables(level, rand);
    case "compare":
      return compare(level, rand);
    case "sentence":
      return sentence(level, rand);
  }
}
