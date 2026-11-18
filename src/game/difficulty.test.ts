// The difficulty curve: slow and even along the path, «легко / средне / трудно» on top,
// quick ease after mistakes, and never any arithmetic for 5–6-year-olds.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FOREST } from "../content/forest.ts";
import { SEA } from "../content/sea.ts";
import { ALL_STOPS, WORLD } from "../content/worlds.ts";
import { countRange, makeRound, mathMax, playableSkill, type Level } from "./tasks.ts";
import { grade, nextAdapt, ADAPT_MIN, type Progress, type Difficulty } from "./progress.ts";

const prog = (difficulty: Difficulty, adapt = 0, level: Level = 2) =>
  ({ adapt, settings: { level, difficulty, auto: true } }) as unknown as Progress;
let seed = 7;
const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

test("the path is long and every stop has 5 tasks", () => {
  assert.ok(FOREST.length >= 15 && FOREST.length <= 18, `${FOREST.length} stops`);
  for (const s of FOREST) assert.equal(makeRound(s.skill, { level: 2, g: 0.5 }, rand).length, 5);
});

test("difficulty rises slowly and evenly along the path", () => {
  const g = FOREST.map((_, i) => grade(prog("medium"), i));
  assert.equal(g[0], 0);
  for (let i = 1; i < g.length; i++) {
    assert.ok(g[i] >= g[i - 1], "never goes down along the path");
    assert.ok(g[i] - g[i - 1] <= 0.051, `step ${i}: ${g[i - 1]} → ${g[i]} is small`);
  }
  assert.ok(g[g.length - 1] <= 0.7, "the last stop at «средне» is not the hardest");
  // easy / hard move the whole curve
  for (let i = 0; i < FOREST.length; i++) {
    assert.ok(grade(prog("easy"), i) <= grade(prog("medium"), i));
    assert.ok(grade(prog("hard"), i) >= grade(prog("medium"), i));
  }
  assert.equal(grade(prog("easy"), 4), 0, "«легко» keeps the first part of the path easiest");
});

test("slow up, quick down", () => {
  let a = 0;
  for (let i = 0; i < 3; i++) a = nextAdapt(a, 0);
  assert.ok(a > 0 && a <= 0.12, `three clean stops: only +${a}`);
  assert.ok(nextAdapt(0, 4) <= -0.2, "a hard stop takes off a lot at once");
  assert.ok(nextAdapt(ADAPT_MIN, 9) >= ADAPT_MIN);
});

test("the sea: 18 stops of 5 tasks, and it continues the forest's curve up to the top", () => {
  assert.equal(SEA.length, 18);
  for (const s of SEA) assert.equal(makeRound(s.skill, { level: 2, g: 0.8 }, rand).length, 5);
  const { span } = WORLD.sea;
  const g = SEA.map((_, i) => grade(prog("medium"), i, SEA.length, span));
  const forestEnd = grade(prog("medium"), FOREST.length - 1);
  assert.ok(
    g[0] < forestEnd && forestEnd - g[0] <= 0.25,
    `a small step back: ${forestEnd} → ${g[0]}`,
  );
  for (let i = 1; i < g.length; i++) {
    assert.ok(g[i] >= g[i - 1]);
    assert.ok(g[i] - g[i - 1] <= 0.035, `sea step ${i}: ${g[i - 1]} → ${g[i]}`);
  }
  assert.equal(g[g.length - 1], 1, "the last sea stop reaches the top of the age level");
  // arithmetic comes gradually: never in the first third of the sea
  const firstMath = SEA.findIndex((s) => s.skill === "add" || s.skill === "sub");
  assert.ok(firstMath >= SEA.length / 3, `first + or − at sea stop ${firstMath + 1}`);
});

test("every + or − stop has its own no-arithmetic version for 5–6-year-olds", () => {
  for (const stop of ALL_STOPS) {
    if (stop.skill !== "add" && stop.skill !== "sub") continue;
    assert.ok(stop.young, `${stop.id} has a young version`);
    assert.ok(!["add", "sub"].includes(stop.young.skill), `${stop.id}: ${stop.young.skill}`);
    for (const g of [0, 0.5, 1])
      for (const t of makeRound(stop.young.skill, { level: 1, g }, rand))
        assert.ok(t.skill !== "add" && t.skill !== "sub");
  }
});

test("age 5–6: no arithmetic anywhere, at any difficulty", () => {
  for (const stop of ALL_STOPS)
    for (const g of [0, 0.5, 1]) {
      assert.notEqual(playableSkill(stop.skill, 1), "add");
      assert.notEqual(playableSkill(stop.skill, 1), "sub");
      for (const t of makeRound(stop.skill, { level: 1, g }, rand)) {
        assert.ok(t.skill !== "add" && t.skill !== "sub", `${stop.id}: ${t.skill}`);
        if (t.kind === "choice") assert.notEqual(t.visual.type, "math");
      }
    }
  assert.equal(mathMax({ level: 1, g: 1 }), 0);
});

test("counting goes to 5 first, then to 10 (age 5–6)", () => {
  assert.deepEqual(countRange({ level: 1, g: 0 }), [1, 5]);
  assert.ok(countRange({ level: 1, g: 0.4 })[1] <= 5);
  assert.equal(countRange({ level: 1, g: 1 })[1], 10);
  for (let i = 0; i < 30; i++)
    for (const t of makeRound("count", { level: 1, g: 0.2 }, rand))
      if (t.kind === "choice" && t.visual.type === "count") assert.ok(t.visual.n <= 5);
});

test("arithmetic only late on the path, numbers grow slowly", () => {
  const firstMath = FOREST.findIndex((s) => s.skill === "add" || s.skill === "sub");
  assert.ok(firstMath >= FOREST.length * 0.6, `first + or − at stop ${firstMath + 1}`);
  assert.ok(mathMax({ level: 2, g: 0 }) <= 10);
  assert.ok(mathMax({ level: 2, g: 1 }) <= 20);
  for (const t of makeRound("add", { level: 2, g: 0.2 }, rand))
    if (t.kind === "choice") assert.ok(Number(t.answer) <= 10, t.answer);
});

test("words get longer and options more numerous with difficulty", () => {
  const avg = (g: number) => {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < 40; i++)
      for (const t of makeRound("read", { level: 2, g }, rand))
        if (t.kind === "choice" && t.visual.type === "word") {
          sum += t.visual.text.length;
          n++;
        }
    return sum / n;
  };
  assert.ok(avg(0) < avg(1), `${avg(0)} < ${avg(1)}`);
  const opts = (g: number) => makeRound("letters", { level: 1, g }, rand)[0];
  const o0 = opts(0);
  const o1 = opts(0.6);
  assert.ok(o0.kind === "choice" && o1.kind === "choice");
  if (o0.kind === "choice" && o1.kind === "choice")
    assert.ok(o0.options.length < o1.options.length);
});

test("two-step problems only at the end of age level 3", () => {
  const two = (level: Level, g: number) =>
    makeRound("add", { level, g }, rand).some(
      (t) => t.kind === "choice" && t.visual.type === "math" && t.visual.c !== undefined,
    );
  assert.equal(two(2, 1), false);
  assert.equal(two(3, 0.3), false);
  assert.equal(two(3, 0.9), true);
});
