#!/usr/bin/env node
/**
 * Property gate — does every @property actually register?
 *
 * 02-property.css opens by claiming registration buys three things: a type,
 * an initial value, and interpolation. It does, for the rules the browser
 * accepts. It buys nothing at all for the ones it silently throws away, and
 * a thrown-away @property looks exactly like a kept one in the source.
 *
 * THE RULE THAT CATCHES PEOPLE. `initial-value` for a registered <length>
 * must be COMPUTATIONALLY INDEPENDENT — it may not depend on a font size, a
 * root font size, a viewport or anything else resolved later. `0.25rem`,
 * `53ch` and `-0.02em` are all dependent, so every one of those rules is
 * invalid and the property stays unregistered. No console warning, no build
 * error; `--tk-space-5: bananas` simply starts working.
 *
 * Found by a readout on the token playground printing `calc(1.5rem * 1.6)`
 * where a length was expected. Eighteen slots had been unregistered since the
 * file was written, including the entire space ramp.
 *
 * HOW THIS CHECKS IT. Not by parsing — the parse is what looks fine. It sets
 * a garbage value on a probe element and reads the property back. A
 * registered property rejects the garbage and falls back to its initial
 * value; an unregistered one hands the garbage straight back. That is the
 * difference registration actually makes, tested the way a component would
 * experience it.
 *
 *   npm run build-storybook && node tools/property-gate.mjs
 *
 * `npm run gates` runs this in the same browser pass as the other story gates.
 * Exit code 1 on any @property that did not take.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, isMain, runChecks } from "./lib/stories.mjs";

const SOURCE = resolve(ROOT, "src/css/02-property.css");

/* Intentionally left unregistered, with the reason. These are NOT oversights:
   an em or ch length has to resolve against the element that CONSUMES it, and
   a registered <length> computes at the element that DECLARES it. Registering
   tracking would freeze it to the root font size, so a 3rem headline would
   get tracking sized for 16px body text — the exact bug the ramp exists to
   avoid. Unregistered is correct here, and the cost is only that a garbage
   value poisons rather than falls back. */
const DELIBERATELY_UNREGISTERED = new Map([
  ["--tk-tracking-display", "em must resolve against the consuming element's font size"],
  ["--tk-tracking-snug", "em must resolve against the consuming element's font size"],
  ["--tk-logo-word-tracking", "em must resolve against the consuming element's font size"],
  ["--tk-measure", "ch must be measured in the consuming element's own font"],
  ["--tk-measure-narrow", "ch must be measured in the consuming element's own font"],
]);

export function propertyCheck() {
  /* The names the source says are registered, with the syntax it asked for.
     Deliberately NOT the browser's list: the question is whether what the
     file declares is what the browser ended up with. */
  const declared = [
    ...readFileSync(SOURCE, "utf8").matchAll(
      /@property\s+(--[a-z0-9-]+)\s*\{[^}]*?syntax:\s*"([^"]+)"[^}]*?\}/gis,
    ),
  ].map(([, name, syntax]) => ({ name, syntax }));

  let results = [];

  return {
    name: "properties",

    async once(page) {
      results = await page.evaluate((names) => {
        const probe = document.createElement("div");
        document.body.appendChild(probe);
        const GARBAGE = "tokenkit-not-a-value";
        const out = names.map(({ name, syntax }) => {
          probe.style.setProperty(name, GARBAGE);
          const got = getComputedStyle(probe).getPropertyValue(name).trim();
          probe.style.removeProperty(name);
          return { name, syntax, got, registered: got !== GARBAGE };
        });
        probe.remove();
        return out;
      }, declared);
    },

    report() {
      const pad = (s, n) => String(s).padEnd(n);
      let failed = 0;
      let universal = 0;

      console.log(`\ntokenkit property gate — ${results.length} @property rules declared\n`);
      for (const r of results) {
        const excused = DELIBERATELY_UNREGISTERED.get(r.name);
        if (r.registered) continue;
        /* A universal property accepts any token stream, so garbage IS a valid
           value for it and this probe cannot tell registered from
           unregistered. Registration still buys inherits and an initial value
           there; it just cannot buy a type, which is the thing being tested.
           Skipped rather than excused, because there is nothing to excuse. */
        if (r.syntax.trim() === "*") {
          universal += 1;
          continue;
        }
        if (excused) {
          console.log(`note  ${pad(r.name, 28)} unregistered on purpose — ${excused}`);
          continue;
        }
        failed += 1;
        console.log(`FAIL  ${pad(r.name, 28)} ${pad(r.syntax, 22)} declared, but a garbage value survived`);
      }

      const registered = results.filter((r) => r.registered).length;
      console.log(
        `\n${registered} registered · ${universal} universal (untestable) · ` +
          `${DELIBERATELY_UNREGISTERED.size} unregistered by design · ${failed} fail`,
      );

      if (failed) {
        console.error(
          "\nProperty gate FAILED. An @property the browser rejected gives no type,\n" +
            "no fallback and no interpolation, and looks identical in the source.\n" +
            "The usual cause is an initial-value in rem, em, ch or %, which is not\n" +
            "computationally independent. Use an absolute length, or add the name to\n" +
            "DELIBERATELY_UNREGISTERED with the reason it has to stay relative.",
        );
        return false;
      }
      console.log("\nEvery @property the file declares is the one the browser kept.");
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([propertyCheck()])) ? 0 : 1);
}
