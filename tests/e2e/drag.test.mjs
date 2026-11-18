// Drag and drop: letters into the word, numbers into the "?" box, apples into the basket.
// A wrong piece springs back; tapping keeps working (the other tests answer by tapping).
import { test } from "node:test";
import assert from "node:assert/strict";
import { dragTo, openPhone, upTo } from "./helpers.mjs";

async function startStop(t, id, level = 1) {
  const r = await openPhone(t, {
    path: `/forest/${id}`,
    progress: { intro: true, done: upTo(id), settings: { level, auto: false } },
  });
  await r.page.click(".help-btn");
  await r.page.waitForSelector(".task");
  await r.page.waitForTimeout(400);
  return r;
}

test("build a word by dragging letters; a wrong letter springs back", async (t) => {
  const { page, errors } = await startStop(t, "hare");
  const wrong = page.locator(".piece:not([data-answer]):not(.is-used)").first();
  const before = await wrong.boundingBox();
  await dragTo(page, wrong, ".slot.is-current");
  await page.waitForTimeout(500);
  const after = await wrong.boundingBox();
  assert.ok(Math.abs(after.x - before.x) < 2 && Math.abs(after.y - before.y) < 2, "sprang back");
  assert.equal(await page.locator(".slot.is-filled").count(), 0);

  const total = await page.locator(".slot").count();
  for (let i = 0; i < total; i++) {
    await dragTo(page, '.piece[data-answer="1"]', ".slot.is-current");
    await page.waitForTimeout(250);
  }
  await page.waitForFunction(() => document.querySelectorAll(".slot.is-landed").length > 0);
  assert.equal(await page.locator(".slot.is-filled").count(), total);
  await page.waitForFunction(() => document.querySelectorAll(".dot.is-done").length >= 1, null, {
    timeout: 8000,
  });
  assert.deepEqual(errors, []);
});

test("magnet: the target lights up when a number comes close; dropping answers", async (t) => {
  const { page, errors } = await startStop(t, "bear", 2);
  await dragTo(page, '.option[data-answer="1"]', ".math-answer", { drop: false });
  assert.equal(await page.locator(".drop-card.is-near").count(), 1);
  await page.mouse.up();
  await page.waitForSelector(".math-answer.is-filled");
  assert.equal(await page.locator(".option.is-right").count(), 1);
  assert.deepEqual(errors, []);
});

test("count by carrying apples into the basket; the voice counts along", async (t) => {
  const { page, errors } = await startStop(t, "squirrel");
  // leave one apple outside so tapping can still be checked (two to five apples here)
  const k = Math.min((await page.locator(".count-item").count()) - 1, 3);
  for (let i = 0; i < k; i++) {
    await dragTo(page, ".count-item:not(.is-in-basket)", ".count-basket");
    await page.waitForTimeout(250);
  }
  assert.equal(await page.locator(".basket-count").innerText(), String(k));
  const voice = await page.evaluate(() => window.__voice);
  for (const key of ["n-1", "n-2", "n-3"].slice(0, k)) assert.ok(voice.includes(key), key);
  // tapping still counts
  await page.locator(".count-item:not(.is-marked)").first().click();
  assert.equal(await page.locator(".count-item.is-marked").count(), k + 1);
  assert.deepEqual(errors, []);
});
