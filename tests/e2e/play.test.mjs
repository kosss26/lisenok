// Plays the whole forest on a phone: nine stops, every task type, star and gift for each,
// the forest celebration, the album.
import { test } from "node:test";
import assert from "node:assert/strict";
import { openPhone, playStop, saved, STOPS } from "./helpers.mjs";

for (const level of [1, 2, 3]) {
  test(`world 1 can be finished at level ${level}`, async (t) => {
    const { page, errors } = await openPhone(t, {
      path: "/forest",
      progress: { intro: true, settings: { level, auto: false } },
    });
    for (const [i, id] of STOPS.entries()) {
      await page.waitForSelector(`.stop[data-stop="${id}"].is-next`);
      await playStop(page, id);
      assert.equal(await page.locator(".gift").count(), 1, `${id}: gift shown`);
      await page.click(".next-btn");
      await page.waitForSelector(".forest-screen");
      assert.match(await page.locator(".star-count").innerText(), new RegExp(`^${i + 1}`));
    }
    // all stars: celebration, then the album has all nine gifts
    await page.waitForSelector(".celebrate");
    await page.click(".celebrate .big-btn");
    assert.equal(await page.locator(".celebrate").count(), 0);
    const p = await saved(page);
    assert.equal(Object.keys(p.done).length, 9);
    assert.equal(p.gifts.length, 9);
    assert.equal(p.settings.level, level, "level stays when auto is off");
    await page.click(".back-btn");
    await page.click(".album-btn");
    assert.equal(await page.locator(".album-slot.is-have").count(), 9);
    assert.deepEqual(errors, []);
  });
}
