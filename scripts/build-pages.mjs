/**
 * GitHub Pages production build.
 *
 * 1. Re-runs the normal typecheck + build with GITHUB_PAGES=1 so Vite
 *    emits assets under /ArtSphereA-ZMarket/ (see vite.config.ts).
 * 2. Copies index.html to 404.html — GitHub serves 404.html for unknown
 *    paths, which lets the SPA router handle deep links like /discover
 *    or /artwork/:id on hard refresh and direct navigation.
 * 3. Writes .nojekyll so Pages serves files as-is (skips Jekyll processing).
 *
 * Usage: npm run build:pages
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
console.log(`> Building for GitHub Pages (GITHUB_PAGES=1)...`);
const build = spawnSync(npmCmd, ["run", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, GITHUB_PAGES: "1" },
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

copyFileSync(join(dist, "index.html"), join(dist, "404.html"));
writeFileSync(join(dist, ".nojekyll"), "");

console.log("✓ Pages build ready in dist/ — 404.html fallback and .nojekyll written.");
