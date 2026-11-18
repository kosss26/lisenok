// Every generated task is solvable: the answer is among the options, every voice key and
// picture exists. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { FOREST } from "../content/forest.ts";
import { introKey, outroKey, voiceLines } from "../content/voice.ts";
import { makeRound, type Level } from "./tasks.ts";

const lines = voiceLines();
const hasPic = (p: string) => existsSync(`public/art/${p}.webp`);

test("all skills × levels give valid rounds", () => {
  for (let seed = 0; seed < 60; seed++) {
    let s = seed * 9301 + 49297;
    const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (const stop of FOREST) {
      for (const level of [1, 2, 3] as Level[]) {
        const round = makeRound(stop.skill, level, rand);
        assert.equal(round.length, 3);
        for (const t of round) {
          for (const k of [...t.prompt, ...t.hint]) assert.ok(lines[k], `voice ${k}`);
          if (t.kind === "choice") {
            const ids = t.options.map((o) => o.id);
            assert.ok(
              ids.includes(t.answer),
              `${stop.skill} L${level}: answer ${t.answer} in ${ids}`,
            );
            assert.equal(
              new Set(ids).size,
              ids.length,
              `${stop.skill} L${level}: unique options ${ids}`,
            );
            for (const o of t.options) {
              if (o.say) assert.ok(lines[o.say], `voice ${o.say}`);
              if (o.pic) assert.ok(hasPic(o.pic), `pic ${o.pic}`);
            }
            const v = t.visual;
            if ("pic" in v && v.pic) assert.ok(hasPic(v.pic), `pic ${v.pic}`);
          } else {
            assert.ok(hasPic(t.pic), `pic ${t.pic}`);
            for (const p of t.target) assert.ok(t.pieces.includes(p));
          }
        }
      }
    }
  }
});

test("every stop has art and voice", () => {
  for (const stop of FOREST) {
    assert.ok(hasPic(stop.resident) && hasPic(stop.gift), stop.id);
    assert.ok(stop.intro.length && stop.outro.length);
    stop.intro.forEach((l, i) => assert.equal(lines[introKey(stop.id, i)], l.text));
    stop.outro.forEach((l, i) => assert.equal(lines[outroKey(stop.id, i)], l.text));
  }
});
