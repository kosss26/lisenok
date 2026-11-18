// Лесная полянка: opens after the forest, weak skill first, a find after every 5 tasks, finds in the album.
import { test } from "node:test";
import assert from "node:assert/strict";
import { STOPS, openPhone, saved, solveTask } from "./helpers.mjs";

const doneAll = Object.fromEntries(STOPS.map((s) => [s, 1]));

test("the glade is closed until the forest is done", async (t) => {
  const { page } = await openPhone(t, { path: "/glade", progress: { intro: true } });
  await page.waitForURL(/\/forest$/);
  assert.equal(await page.locator(".glade-btn").count(), 0);
});

test("practice round: weak skill first, a find, more rounds, album", async (t) => {
  const { page, errors } = await openPhone(t, {
    path: "/forest",
    progress: {
      intro: true,
      done: doneAll,
      forestCelebrated: true,
      settings: { level: 2, auto: false },
      skills: { sub: { tasks: 6, firstTry: 1, mistakes: 8, hints: 2 } },
    },
  });
  await page.click(".glade-btn");
  await page.waitForSelector(".glade-play");
  await page.click(".glade-play");
  await page.waitForSelector(".task");
  // the weak skill (subtraction) comes first
  assert.equal(await page.locator(".task-sub").count(), 1);
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector(".task");
    await solveTask(page);
    await page.waitForFunction(
      (n) =>
        document.querySelectorAll(".dot.is-done").length >= n ||
        document.querySelector(".glade-find"),
      i + 1,
      { timeout: 15000 },
    );
    await page.waitForTimeout(150);
  }
  await page.waitForSelector(".glade-find");
  assert.match(await page.locator(".glade-find h2").innerText(), /Находка: гриб/);
  assert.deepEqual((await saved(page)).finds, { grib: 1 });
  await page.click(".glade-again");
  await page.waitForSelector(".task");
  assert.equal(await page.locator(".dot.is-done").count(), 0);

  await page.goto(page.url().replace(/glade$/, "album"));
  await page.waitForSelector(".album-finds");
  assert.equal(await page.locator(".album-finds .is-have").count(), 1);
  assert.deepEqual(errors, []);
});
