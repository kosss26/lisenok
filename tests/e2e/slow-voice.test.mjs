// A slow network must not stall the game: after a right answer the next task comes even when the
// praise clip is still downloading (it used to wait for the clip with no upper bound).
import { test } from "node:test";
import assert from "node:assert/strict";
import { openPhone, solveTask } from "./helpers.mjs";

test("next task comes even when voice clips load very slowly", async (t) => {
  const { page, context, errors } = await openPhone(t, {
    path: "/forest/hedgehog",
    progress: { intro: true, settings: { level: 1, auto: false } },
  });
  // from now on every voice clip takes 20 s to arrive
  await context.route(/\/voice\//, async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.continue().catch(() => {});
  });
  await page.click(".help-btn");
  await page.waitForSelector(".task");
  const t0 = Date.now();
  await solveTask(page);
  await page.waitForFunction(() => document.querySelectorAll(".dot.is-done").length >= 1, null, {
    timeout: 8000,
  });
  assert.ok(Date.now() - t0 < 8000, `advanced after ${Date.now() - t0} ms`);
  await context.unrouteAll({ behavior: "ignoreErrors" });
  assert.deepEqual(errors, []);
});
