#!/usr/bin/env node
/**
 * Every gate that reads rendered stories, in one browser pass.
 *
 *   npm run build-storybook && npm run gates
 *   npm run gates -- --verbose
 *   npm run gates -- --affected [--staged]   only the stories a change can reach (the fast tier)
 *
 * The checks are the same ones `npm run a11y`, `radius`, `properties`,
 * `attrs`, `controls`, `titles`, `reflow`, `forced-colors` and `motion` run on their own; see each file for what it checks
 * and why. Together they open each story once per viewport instead of once
 * per gate. Every report prints, and the exit code is 1 if any check failed.
 */

import { ROOT, readIndex, runChecks } from "./lib/stories.mjs";
import { affectedStories, changedFiles } from "./lib/affected.mjs";
import { controlsCheck } from "./controls-gate.mjs";
import { propertyCheck } from "./property-gate.mjs";
import { radiusCheck } from "./radius-gate.mjs";
import { attributeCheck } from "./attribute-gate.mjs";
import { a11yCheck } from "./a11y-gate.mjs";
import { forcedColorsCheck } from "./forced-colors-gate.mjs";
import { titlesCheck } from "./titles-gate.mjs";
import { reflowCheck } from "./reflow-gate.mjs";
import { motionCheck } from "./motion-gate.mjs";

/* Read-only probes first on each page, axe after them: the checks share one
   settled page, and none of them should see anything another one injected.
   Forced colours last of all, because it changes the media emulation and
   moves focus (it resets both when it is done). Motion after that: it pauses
   the page, emulates reduced motion and presses a data element's control,
   and puts each back. */
const checks = [controlsCheck(), propertyCheck(), radiusCheck(), attributeCheck(), titlesCheck(), a11yCheck(), reflowCheck(), forcedColorsCheck(), motionCheck()];

/* The fast tier: only what the change can reach. The controls gate asks whether ANY story drives each prop, a
   question about every story at once, so it waits for the full pass; every other check judges each story alone. */
if (process.argv.includes("--affected")) {
  const files = changedFiles(ROOT, { staged: process.argv.includes("--staged") });
  const { ids, broad } = affectedStories(ROOT, files, Object.values(readIndex().entries), { staged: process.argv.includes("--staged") });
  if (!ids.size) {
    console.log(`
Browser gates, fast tier: ${files.length} changed file(s) reach no story. Nothing to open.`);
    process.exit(0);
  }
  console.log(`
Browser gates, fast tier: ${ids.size} stor${ids.size === 1 ? "y" : "ies"} ${broad ? "(a global file changed: one story per file)" : "reached by the change"}; controls wait for the full pass.`);
  process.exit((await runChecks(checks.filter((c) => c.name !== "controls"), { only: ids })) ? 0 : 1);
}

process.exit((await runChecks(checks)) ? 0 : 1);
