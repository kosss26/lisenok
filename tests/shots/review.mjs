// Screenshots for the visual review (iPhone 13): node tests/shots/review.mjs <prefix>
import { openPhone, playStop, upTo } from "../e2e/helpers.mjs";
const pre = process.argv[2] || "before";
const out = (n) => `/workspace/screens/review-${pre}-${n}.png`;
const base = { intro: true, settings: { level: 2, auto: false } };
async function shot(name, opts, act) {
  const { page, browser } = await openPhone(null, { reducedMotion: "reduce", ...opts });
  try {
    if (act) await act(page);
    await page.waitForTimeout(900);
    await page.screenshot({ path: out(name) });
  } finally {
    await browser.close();
  }
}
const stops = (id) => ({ ...base, done: upTo(id) });
await shot("forest-8-9", { path: "/forest", progress: stops("frog") }, async (p) => {
  await p.locator('.stop[data-stop="frog"]').scrollIntoViewIfNeeded();
});
await shot("forest-15-17", { path: "/forest", progress: stops("badger-2") }, async (p) => {
  await p.locator('.stop[data-stop="badger-2"]').scrollIntoViewIfNeeded();
});
await shot("dialogue", { path: "/forest/hedgehog", progress: base });
await shot("count", { path: "/forest/squirrel", progress: stops("squirrel") }, async (p) => {
  await p.click(".help-btn");
  await p.waitForSelector(".task");
});
await shot("reward", { path: "/forest", progress: base }, async (p) => {
  await playStop(p, "hedgehog");
});
