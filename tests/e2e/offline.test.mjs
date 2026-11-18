// Offline: after the first visit the whole game (voice and pictures too) works without network.
// Needs the production build: npm run build && npm run preview, then
//   OFFLINE=1 BASE_URL=http://127.0.0.1:8081/ npm run test:e2e
import { test } from "node:test";
import assert from "node:assert/strict";
import { openPhone, playStop } from "./helpers.mjs";

test("plays a stop with the network off", { skip: !process.env.OFFLINE }, async (t) => {
  const { page, context, errors } = await openPhone(t, {
    offline: true,
    progress: { intro: true },
  });
  await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 30000 });
  // wait until everything is cached
  await page.waitForFunction(
    async () => {
      const keys = await caches.keys();
      if (!keys.length) return false;
      const c = await caches.open(keys[0]);
      return (await c.keys()).length > 600;
    },
    null,
    { timeout: 60000, polling: 1000 },
  );
  await context.setOffline(true);
  await page.goto(new URL("forest", page.url()).href);
  await page.waitForSelector(".forest-screen");
  const images = await page.evaluate(() =>
    [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  );
  assert.ok(images, "pictures load offline");
  await playStop(page, "hedgehog");
  assert.deepEqual(errors, []);
});
