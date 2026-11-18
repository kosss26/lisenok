// Shared helpers for the browser tests (mobile viewport, iPhone 13).
// BASE_URL    — where the game runs (default: the dev server, http://127.0.0.1:8080/)
// PW_CHROMIUM — optional path to a Chrome/Chromium binary (otherwise Playwright's own browser)
// PW_BROWSER  — "webkit" runs the tests in WebKit (Safari's engine) instead of Chromium
import { chromium, devices, webkit } from "playwright";

const WEBKIT = process.env.PW_BROWSER === "webkit";

export const BASE = process.env.BASE_URL || "http://127.0.0.1:8080/";
export const STOPS = [
  "hedgehog",
  "squirrel",
  "hare",
  "owl",
  "bear",
  "beaver",
  "badger",
  "mouse",
  "frog",
];
export const KEY = "lisenok:progress";
/** a picture in any shipped format: AVIF in production where supported, WebP otherwise */
export const artRe = (name) => new RegExp(`/art/${name}\\.(avif|webp)(\\?|$)`);

/** `t` is the node:test context: the browser closes even when an assertion fails. */
export async function openPhone(t, { progress, path = "", offline = false } = {}) {
  const browser = WEBKIT
    ? await webkit.launch()
    : await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
  t?.after(() => browser.close().catch(() => {}));
  const context = await browser.newContext({ ...devices["iPhone 13"], serviceWorkers: "allow" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !(offline && /Failed to load resource/.test(m.text())))
      errors.push(m.text());
  });
  if (process.env.PW_FALLBACK)
    await page.addInitScript(() => {
      const can = HTMLMediaElement.prototype.canPlayType;
      HTMLMediaElement.prototype.canPlayType = function (type) {
        return /ogg|opus/.test(type) ? "" : can.call(this, type);
      };
      const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
      Object.defineProperty(HTMLImageElement.prototype, "src", {
        ...src,
        set(v) {
          src.set.call(
            this,
            String(v).startsWith("data:image/avif") ? "data:image/avif;base64,AA" : v,
          );
        },
      });
    });
  await page.addInitScript(
    ([seed, key]) => {
      window.__voice = [];
      const orig = window.fetch;
      window.fetch = (u, ...a) => {
        const s = String(u);
        // production builds ask for Opus (.ogg) where it plays, MP3 elsewhere
        const m = s.match(/\/voice\/([^/?]+)\.(mp3|ogg)/);
        if (m) window.__voice.push(m[1]);
        return orig(u, ...a);
      };
      if (seed && !sessionStorage.getItem("seeded")) {
        sessionStorage.setItem("seeded", "1");
        localStorage.setItem(key, JSON.stringify(seed));
      }
    },
    [progress ?? null, KEY],
  );
  await page.goto(BASE + path.replace(/^\//, ""), { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  return { browser, context, page, errors };
}

export const saved = (page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}"), KEY);

/** Grown-up press: hold the button for 2.8 s. */
export async function hold(page, selector) {
  const box = await page.locator(selector).first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2800);
  await page.mouse.up();
  await page.waitForTimeout(300);
}

/** Solves the current task with the right answer (build tasks: every piece in order). */
export async function solveTask(page) {
  if (await page.locator(".task-build").count()) {
    for (let i = 0; i < 12 && (await page.locator(".slot:not(.is-filled)").count()); i++) {
      await page.locator('.piece[data-answer="1"]').first().click();
      await page.waitForTimeout(120);
    }
  } else {
    await page.locator('.option[data-answer="1"]').click();
  }
}

/** Opens a stop from the forest path and plays its whole round. Returns after the reward screen. */
export async function playStop(page, id) {
  await page.click(`.stop[data-stop="${id}"]`);
  await page.waitForSelector(".help-btn");
  await page.click(".help-btn");
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector(".task");
    await solveTask(page);
    await page.waitForFunction(
      (n) =>
        document.querySelectorAll(".dot.is-done").length >= n || document.querySelector(".reward"),
      i + 1,
      { timeout: 15000 },
    );
    await page.waitForTimeout(150);
  }
  await page.waitForSelector(".reward");
}

/** Drags an element onto another with small mouse steps (like a finger), then lets go. */
export async function dragTo(page, from, to, { drop = true } = {}) {
  const a = await (typeof from === "string" ? page.locator(from).first() : from).boundingBox();
  const b = await (typeof to === "string" ? page.locator(to).first() : to).boundingBox();
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  await page.mouse.move(ax, ay);
  await page.mouse.down();
  const steps = 12;
  for (let i = 1; i <= steps; i++)
    await page.mouse.move(
      ax + ((b.x + b.width / 2 - ax) * i) / steps,
      ay + ((b.y + b.height / 2 - ay) * i) / steps,
    );
  await page.waitForTimeout(60);
  if (drop) await page.mouse.up();
}
