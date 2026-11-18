// Music: map / tasks / celebration tracks change with the screen, the forest layer plays under them,
// and each has its own volume in the parents' corner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { hold, openPhone, saved } from "./helpers.mjs";

const tracks = (page) => page.evaluate(() => window.__tracks().sort().join(","));
const until = (page, want) =>
  page
    .waitForFunction((w) => window.__tracks().sort().join(",") === w, want, { timeout: 8000 })
    .catch(async (e) => {
      throw new Error(
        `tracks ${await tracks(page)} errors ${await page.evaluate(() => window.__musicErrors)} at ${page.url()}, want ${want}: ${e.message}`,
      );
    });

test("music follows the screen; forest sounds have their own volume", async (t) => {
  const { page, errors } = await openPhone(t, {
    path: "/forest/hedgehog",
    progress: { intro: true, settings: { level: 1, auto: false } },
  });
  await page.evaluate(() => (window.__musicErrors = []));
  await page.mouse.click(5, 300); // first tap unlocks sound
  await until(page, "forest,map");
  await page.click(".help-btn");
  await page.waitForSelector(".task");
  await until(page, "forest,tasks");
  await page.click(".back-btn");
  await until(page, "forest,map");

  await hold(page, ".parents-btn");
  await page.click(".parents-tab >> text=Звук");
  await page.locator("#vol-forest").fill("0");
  await until(page, "map");
  await page.locator("#vol-music").fill("0");
  await until(page, "");
  await page.locator("#vol-forest").fill("0.4");
  await until(page, "forest");
  assert.equal((await saved(page)).settings.volume.forest, 0.4);
  assert.equal(await tracks(page), "forest");
  assert.deepEqual(errors, []);
});
