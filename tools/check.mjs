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
 *   npm run check
 */

import { spawnSync } from "node:child_process";

const STEPS = [
  { name: "token lint", cmd: "node tools/lint-tokens.mjs" },
  { name: "vocabulary", cmd: "node tools/vocabulary-gate.mjs" },
  {
    name: "generated files",
    cmd:
      "node tools/gen-specimen-packs.mjs --check && node tools/gen-icon-set.mjs --check" +
      " && node tools/gen-component-stories.mjs --check",
  },
  { name: "boundary", cmd: "node tools/boundary-gate.mjs" },
  { name: "neutral", cmd: "node tools/neutral-gate.mjs" },
  { name: "contrast", cmd: "node tools/contrast-gate.mjs" },
  { name: "type", cmd: "node tools/type-gate.mjs" },
  { name: "storybook build", cmd: "npm run -s build-storybook", required: true },
  { name: "figma", cmd: "node tools/figma-gate.mjs" },
  { name: "browser gates", cmd: "node tools/browser-gates.mjs" },
];

const results = [];
let blocked = false;

for (const step of STEPS) {
  if (blocked) {
    results.push({ ...step, status: "skipped", seconds: 0 });
    continue;
  }
  console.log(`\n━━ ${step.name} ${"━".repeat(Math.max(0, 70 - step.name.length))}`);
  const start = Date.now();
  const { status } = spawnSync(step.cmd, { stdio: "inherit", shell: true });
  const ok = status === 0;
  results.push({ ...step, status: ok ? "pass" : "FAIL", seconds: (Date.now() - start) / 1000 });
  if (!ok && step.required) blocked = true;
}

console.log(`\n${"━".repeat(74)}\ntokenkit check\n`);
for (const r of results) {
  console.log(`  ${r.status.padEnd(8)} ${r.name.padEnd(18)} ${r.status === "skipped" ? "" : `${r.seconds.toFixed(0)}s`}`);
}
const failed = results.filter((r) => r.status !== "pass");
console.log(failed.length ? `\n${failed.length} of ${results.length} steps did not pass.` : `\nAll ${results.length} steps passed.`);
process.exit(failed.length ? 1 : 0);
