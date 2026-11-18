// Stage 8: visible counting, apples leaving the basket, the star hung in the sky, album gifts,
// vibration, time of day and weather; reduced motion respected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { openPhone, playStop, saved, STOPS, upTo } from "./helpers.mjs";

/** records navigator.vibrate calls (Chromium has the API; WebKit does not — then it is added) */
const recordVibrate = async (_ctx, page) =>
  page.addInitScript(() => {
    window.__buzz = [];
    navigator.vibrate = (p) => (window.__buzz.push(p), true);
  });

async function startStop(t, id, settings, extra = {}) {
  const r = await openPhone(t, {
    path: `/forest/${id}`,
    progress: { intro: true, done: upTo(id), settings: { auto: false, ...settings } },
    beforeGoto: recordVibrate,
    ...extra,
  });
  await r.page.click(".help-btn");
  await r.page.waitForSelector(".task");
  await r.page.waitForTimeout(500);
  return r;
}

test("counting: after the right answer the objects hop one by one as the voice counts", async (t) => {
  const { page, errors } = await startStop(t, "squirrel", { level: 1 });
  const n = await page.locator(".count-item").count();
  await page.evaluate(() => (window.__voice.length = 0));
  await page.click('.option[data-answer="1"]');
  await page.waitForSelector(".count-item.is-hop");
  await page.waitForFunction((k) => window.__voice.includes(`n-${k}`), n, { timeout: 15000 });
  const voice = await page.evaluate(() => window.__voice);
  const order = Array.from({ length: n }, (_, i) => voice.indexOf(`n-${i + 1}`));
  assert.ok(
    order.every((x, i) => x >= 0 && (i === 0 || x > order[i - 1])),
    `counted in order: ${voice}`,
  );
  assert.ok((await page.evaluate(() => window.__buzz)).length > 0, "buzz on the right answer");
  // the praise comes after the counting, then the next task
  await page.waitForFunction(() => document.querySelectorAll(".dot.is-done").length === 1, null, {
    timeout: 20000,
  });
  assert.deepEqual(errors, []);
});

test("subtraction: the apples taken away hop out of the basket", async (t) => {
  const { page } = await startStop(t, "badger", { level: 2, difficulty: "easy" });
  await page.waitForSelector(".math-basket");
  const leaving = page.locator(".math-pic.is-leaving");
  const b = await leaving.count();
  assert.ok(b > 0);
  const text = await page.locator(".math-line").innerText();
  assert.match(text.replace(/\s/g, ""), new RegExp(`−${b}=`));
  await page.waitForTimeout(1100 + b * 600 + 900);
  const opacity = await leaving.last().evaluate((el) => Number(getComputedStyle(el).opacity));
  assert.ok(opacity < 0.5, `left the basket (opacity ${opacity})`);
});

test("the star: the child hangs it in the sky; then the gift and the thanks", async (t) => {
  const { page, errors } = await openPhone(t, {
    path: "/forest",
    progress: { intro: true, settings: { level: 1, auto: false }, sky: { owl: [80, 70] } },
    beforeGoto: recordVibrate,
  });
  await playStop(page, "hedgehog");
  await page.waitForSelector(".place-star.is-waiting");
  await page.waitForFunction(() => window.__voice.includes("sky-place"));
  assert.equal(await page.locator(".gift").count(), 0, "the gift waits for the star");
  const star = await page.locator(".new-star").boundingBox();
  const sky = await page.locator(".sky-frame").boundingBox();
  const from = { x: star.x + star.width / 2, y: star.y + star.height / 2 };
  const to = { x: sky.x + sky.width * 0.3, y: sky.y + sky.height * 0.4 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++)
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 12, from.y + ((to.y - from.y) * i) / 12);
  await page.mouse.up();
  await page.waitForSelector(".place-star.is-placed");
  const [x, y] = (await saved(page)).sky.hedgehog;
  assert.ok(Math.abs(x - 30) < 6 && Math.abs(y - 40) < 8, `hung where dropped: ${x},${y}`);
  assert.equal(await page.locator(".sky-placed").count(), 2);
  await page.waitForSelector(".gift");
  await page.waitForSelector(".reward-talk");
  await page.click(".gift");
  await page.waitForFunction(() => window.__voice.includes("gift-hedgehog"));
  assert.deepEqual(errors, []);
});

test("a star not hung up by hand gets a free place in the sky", async (t) => {
  const { page } = await openPhone(t, {
    path: "/forest",
    progress: { intro: true, settings: { level: 1, auto: false } },
  });
  await playStop(page, "hedgehog");
  await page.click(".next-btn");
  await page.waitForSelector(".forest-screen");
  assert.ok((await saved(page)).sky.hedgehog, "placed");
});

test("album: new gifts wait in a box; a tap opens it, later taps spin it", async (t) => {
  const done = Object.fromEntries(STOPS.slice(0, 3).map((s) => [s, 1]));
  const { page, errors } = await openPhone(t, {
    path: "/album",
    progress: {
      intro: true,
      done,
      gifts: ["t-acorn", "t-feather", "t-clover"],
      opened: ["t-acorn"],
      sky: { hedgehog: [20, 30], squirrel: [50, 50], owl: [70, 40] },
    },
  });
  await page.waitForFunction(() => window.__voice.includes("album-open"));
  assert.equal(await page.locator(".album-slot.is-wrapped").count(), 2);
  await page.click('[data-gift="t-feather"]');
  await page.waitForSelector('[data-gift="t-feather"].is-opening');
  await page.waitForFunction(() => window.__voice.includes("gift-squirrel"));
  assert.ok((await saved(page)).opened.includes("t-feather"));
  await page.waitForSelector('[data-gift="t-feather"]:not(.is-wrapped)');
  await page.click('[data-gift="t-acorn"]');
  await page.waitForSelector('[data-gift="t-acorn"].is-spin');
  assert.equal(await page.locator(".album-sky .sky-placed").count(), 3);
  assert.deepEqual(errors, []);
});

test("time of day and weather change along the path", async (t) => {
  const look = async (id) => {
    const { page, browser } = await openPhone(null, {
      path: `/forest/${id}`,
      progress: { intro: true, done: upTo(id), settings: { level: 2 } },
    });
    const w = await page
      .locator(".stop-weather")
      .evaluate((el) => [el.dataset.time, el.dataset.weather]);
    await browser.close();
    return w.join(" ");
  };
  assert.equal(await look("hedgehog"), "morning clear");
  assert.equal(await look("squirrel-2"), "day rain");
  assert.equal(await look("bear"), "evening fog");
  assert.equal(await look("frog-2"), "dusk clear");
  const { page } = await openPhone(t, { path: "/forest", progress: { intro: true } });
  assert.equal(await page.locator(".forest-light").count(), 1);
  assert.ok((await page.locator(".forest-rain .drop").count()) > 10);
  assert.equal(await page.locator(".forest-mist").count(), 1);
});

test("reduced motion: no buzz, no falling drops", async (t) => {
  const { page } = await startStop(t, "squirrel-2", { level: 1 }, { reducedMotion: "reduce" });
  assert.equal(await page.locator(".stop-weather .drop").first().isVisible(), false);
  await page.click('.option[data-answer="1"]');
  await page.waitForTimeout(800);
  assert.deepEqual(await page.evaluate(() => window.__buzz), []);
});
