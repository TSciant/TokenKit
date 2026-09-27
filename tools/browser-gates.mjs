#!/usr/bin/env node
/**
 * Every gate that reads rendered stories, in one browser pass.
 *
 *   npm run build-storybook && npm run gates
 *   npm run gates -- --verbose
 *
 * The checks are the same ones `npm run a11y`, `radius`, `properties`,
 * `attrs` and `controls` run on their own; see each file for what it checks
 * and why. Together they open each story once per viewport instead of once
 * per gate. Every report prints, and the exit code is 1 if any check failed.
 */

import { runChecks } from "./lib/stories.mjs";
import { controlsCheck } from "./controls-gate.mjs";
import { propertyCheck } from "./property-gate.mjs";
import { radiusCheck } from "./radius-gate.mjs";
import { attributeCheck } from "./attribute-gate.mjs";
import { a11yCheck } from "./a11y-gate.mjs";

/* Read-only probes first on each page, axe last: the checks share one settled
   page, and none of them should see anything another one injected. */
const checks = [controlsCheck(), propertyCheck(), radiusCheck(), attributeCheck(), a11yCheck()];

process.exit((await runChecks(checks)) ? 0 : 1);
