// World 2, the sea: locked until the forest is done, then 18 stops on a phone (every task type,
// star in the sky, gift), the sea celebration and the album. 5–6-year-olds never get + or −.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE, forestDone, openPhone, playStop, saved, SEA_STOPS, STOPS } from "./helpers.mjs";

test("the sea is locked until every forest star is back", async (t) => {
  const { page, errors } = await openPhone(t, {
    path: "/map",
    progress: { intro: true, done: { hedgehog: 1 } },
  });
  await page.waitForSelector(".world-sea.is-locked");
  await page.click(".world-sea");
  assert.match(page.url(), /\/map$/, "a tap on the locked sea stays on the map");
  // typing the address does not open it either
  await page.goto(`${BASE}sea/sea-crab`);
  await page.waitForURL(/\/map$/);
  assert.deepEqual(errors, []);
});

test("after the forest the sea opens on the map with its own star count", async (t) => {
  const { page, errors } = await openPhone(t, {
    path: "/map",
    progress: { intro: true, forestCelebrated: true, done: forestDone() },
  });
  await page.waitForSelector(".world-sea.is-open");
  assert.match(await page.locator(".world-sea").innerText(), /0\/18/);
  assert.match(await page.locator(".world-forest").innerText(), /18\/18/);
  assert.match(await page.locator(".top-bar .star-count").innerText(), /^18/);
  await page.click(".world-sea");
  await page.waitForSelector(".world-sea .stop");
  assert.equal(await page.locator(".stop").count(), 18);
  assert.equal(await page.locator(".stop.is-next").getAttribute("data-stop"), "sea-crab");
  assert.match(page.url(), /\/sea$/);
  assert.deepEqual(errors, []);
});

for (const level of [1, 3]) {
  test(`world 2 (the sea) can be finished at level ${level}`, async (t) => {
    const { page, errors } = await openPhone(t, {
      path: "/sea",
      progress: {
        intro: true,
        forestCelebrated: true,
        done: forestDone(),
        settings: { level, auto: false },
      },
    });
    // counts every arithmetic card that appears (the app is one page: the observer stays)
    await page.evaluate(() => {
      window.__mathSeen = 0;
      new MutationObserver(() => {
        if (document.querySelector(".card-math:not([data-seen])")) {
          document.querySelector(".card-math").setAttribute("data-seen", "");
          window.__mathSeen++;
        }
      }).observe(document.body, { childList: true, subtree: true });
    });
    for (const [i, id] of SEA_STOPS.entries()) {
      await page.waitForSelector(`.stop[data-stop="${id}"].is-next`, { state: "attached" });
      await playStop(page, id);
      await page.click(".new-star");
      await page.waitForSelector(".gift");
      await page.click(".next-btn");
      await page.waitForSelector(".world-sea");
      assert.match(await page.locator(".star-count").innerText(), new RegExp(`^${i + 1}`));
    }
    const math = await page.evaluate(() => window.__mathSeen);
    if (level === 1) assert.equal(math, 0, "no + or − at age 5–6");
    else assert.ok(math > 0, "arithmetic stops at level 3");
    await page.waitForSelector(".celebrate-card");
    assert.match(await page.locator(".celebrate-card").innerText(), /Море сияет/);
    await page.click(".celebrate .big-btn");
    const p = await saved(page);
    assert.equal(Object.keys(p.done).length, STOPS.length + SEA_STOPS.length);
    assert.equal(p.gifts.length, SEA_STOPS.length, "the forest gifts were not in this save");
    assert.equal(p.seaCelebrated, true);
    assert.equal(Object.keys(p.sky).length, SEA_STOPS.length, "every sea star hangs in the sky");
    await page.click(".back-btn");
    await page.click(".album-btn");
    await page.waitForSelector(".album-sea .album-slot");
    assert.equal(await page.locator(".album-sea .album-slot.is-have").count(), SEA_STOPS.length);
    assert.deepEqual(errors, []);
  });
}
