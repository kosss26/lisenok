import { createHash } from "node:crypto";
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Every file under `dir`, as "/a/b.ext" URLs. */
function walk(dir: string, root = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory()
      ? walk(full, root)
      : ["/" + relative(root, full).split("\\").join("/")];
  });
}

/**
 * Offline play: after the build, writes dist/sw.js that precaches the whole game (code, art,
 * voice, sounds, music) on the first visit, then serves everything cache-first.
 * Media URLs carry ?v=<hash> (tools/asset-versions.mjs), so the worker caches exactly those.
 */
function offlinePlugin(): Plugin {
  let outDir = "dist";
  return {
    name: "lisenok:offline",
    apply: "build",
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      // AVIF / Opus copies made by tools/encode-media.py
      if (existsSync("tmp/media-cache")) cpSync("tmp/media-cache", outDir, { recursive: true });
      const versions = readFileSync("src/game/asset-versions.ts", "utf8");
      const v = Object.fromEntries(
        [...versions.matchAll(/"(\w+)": "(\w+)"/g)].map((m) => [m[1], m[2]]),
      );
      const files = walk(outDir).filter((f) => f !== "/sw.js" && !f.endsWith(".map"));
      const urls = files.map((f) => {
        const folder = f.split("/")[1];
        if (f === "/index.html") return "/";
        return v[folder] && ["art", "voice", "sfx", "music"].includes(folder)
          ? `${f}?v=${v[folder]}`
          : f;
      });
      const hash = createHash("sha1");
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const version = hash.digest("hex").slice(0, 10);
      const sw = readFileSync("src/sw-template.js", "utf8")
        .replace("__VERSION__", version)
        .replace("/*__URLS__*/ []", JSON.stringify(urls));
      writeFileSync(join(outDir, "sw.js"), sw);
    },
  };
}

/** Media is immutable (versioned URLs): long cache in dev too, like in production. */
function mediaCache(): Plugin {
  return {
    name: "lisenok:media-cache",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (/^\/(art|voice|sfx|music)\//.test(req.url ?? "") && (req.url ?? "").includes("?v=")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlinePlugin(), mediaCache()],
  server: { host: "0.0.0.0", port: 8080, allowedHosts: true },
  preview: { host: "0.0.0.0", port: 8081, allowedHosts: true },
});
