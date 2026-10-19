#!/usr/bin/env node
/**
 * npm run check — every gate, then a summary.
 *
 * This used to be one `&&` chain, which stopped at the first failure: a red
 * vocabulary step hid four other failing gates behind it for as long as
 * nobody fixed the first one. Now every step runs and the summary says
 * everything that is wrong at once. The browser gates read the Storybook
 * build, so they are skipped when the build fails rather than run against a
 * stale one.
 *
 *   npm run check                  every step, every story (the evening run, before a release)
 *   npm run check -- --fast        the fast tier: every static step, then the
 *                                  Storybook build and the story gates only
 *                                  for the stories the change can reach, and
 *                                  none at all when it reaches none
 *   npm run check -- --fast --staged   the same for what is staged (the pre-commit hook)
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { affectedStories, changedFiles } from "./lib/affected.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FAST = process.argv.includes("--fast");
const STAGED = process.argv.includes("--staged");

const STEPS = [
  { name: "token lint", cmd: "node tools/lint-tokens.mjs" },
  { name: "vocabulary", cmd: "node tools/vocabulary-gate.mjs" },
  {
    name: "generated files",
    cmd:
      "node tools/gen-specimen-packs.mjs --check && node tools/gen-icon-set.mjs --check" +
      " && node tools/gen-component-stories.mjs --check && node tools/gen-scene-vocabulary.mjs --check && node tools/figma-guidelines.mjs --check",
  },
  { name: "scene", cmd: "node tools/scene-gate.mjs" },
  { name: "boundary", cmd: "node tools/boundary-gate.mjs" },
  { name: "neutral", cmd: "node tools/neutral-gate.mjs" },
  { name: "client", cmd: "node tools/client-gate.mjs" },
  { name: "export sort", cmd: "node tools/export-kit.mjs --check" },
  { name: "media", cmd: "node tools/media-gate.mjs" },
  { name: "contrast", cmd: "node tools/contrast-gate.mjs" },
  { name: "type", cmd: "node tools/type-gate.mjs" },
  { name: "storybook build", cmd: "npm run -s build-storybook", required: true },
  { name: "figma", cmd: "node tools/figma-gate.mjs" },
  { name: "browser gates", cmd: FAST ? `node tools/browser-gates.mjs --affected${STAGED ? " --staged" : ""}` : "node tools/browser-gates.mjs" },
];

/* The fast tier skips the build and the story pass when the change reaches no story: a docs or tools commit
   takes seconds. The last build's index says which stories exist; with none yet, it builds. */
if (FAST) {
  const index = resolve(ROOT, "storybook-static/index.json");
  const files = changedFiles(ROOT, { staged: STAGED });
  const reaches = !existsSync(index) || affectedStories(ROOT, files, Object.values(JSON.parse(readFileSync(index, "utf8")).entries), { staged: STAGED }).ids.size > 0;
  if (!reaches) for (const s of STEPS) if (s.name === "storybook build" || s.name === "browser gates") s.skip = "reaches no story";
}

const results = [];
let blocked = false;

for (const step of STEPS) {
  if (blocked || step.skip) {
    results.push({ ...step, status: step.skip ? "n/a" : "skipped", seconds: 0 });
    continue;
  }
  console.log(`\n━━ ${step.name} ${"━".repeat(Math.max(0, 70 - step.name.length))}`);
  const start = Date.now();
  const { status } = spawnSync(step.cmd, { stdio: "inherit", shell: true });
  const ok = status === 0;
  results.push({ ...step, status: ok ? "pass" : "FAIL", seconds: (Date.now() - start) / 1000 });
  if (!ok && step.required) blocked = true;
}

console.log(`\n${"━".repeat(74)}\ntokenkit check${FAST ? " (fast tier)" : ""}\n`);
for (const r of results) {
  console.log(`  ${r.status.padEnd(8)} ${r.name.padEnd(18)} ${r.status === "skipped" ? "" : r.skip ? r.skip : `${r.seconds.toFixed(0)}s`}`);
}
const failed = results.filter((r) => r.status !== "pass" && r.status !== "n/a");
console.log(failed.length ? `\n${failed.length} of ${results.length} steps did not pass.` : `\nAll ${results.length} steps passed.`);
process.exit(failed.length ? 1 : 0);
