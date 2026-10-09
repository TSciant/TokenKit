#!/usr/bin/env node
/**
 * Attribute gate — does every data-* value this kit writes actually select?
 *
 * THE BUG THIS EXISTS FOR. The input component is `data-tk="input"`. Somebody
 * — me — wrote `data-tk="field"` on an <input>, and nothing happened. No
 * console warning, no build error, no red squiggle: an attribute selector that
 * matches nothing is not an error in CSS, it is simply a selector that matches
 * nothing. The element rendered as an unstyled browser input, which on a
 * grayscale wireframe pack looks close enough to intentional that it survived
 * review.
 *
 * That is the whole class. The kit's API is attribute values, not imports and
 * not props, so a typo in one is a typo in a public API call that the compiler
 * has no opinion about. TypeScript cannot help: every value is a string.
 *
 * THREE THINGS GO WRONG, and they need separating because only two are typos.
 *
 *   undeclared   `data-tk="field"` — no rule anywhere names this value. The
 *                attribute is decoration. Always a bug unless it is a JS hook,
 *                which is what SCRIPT_ONLY is for.
 *
 *   inert here   `data-variant="flat"` on a button when only the card declares
 *                a flat variant. The value is real, the rules that claim it
 *                exist, and not one of them matches THIS element. Reads as a
 *                variant, behaves as nothing.
 *
 *   never in CSS  an attribute the source writes that no selector in the kit
 *                mentions at all. Usually a script hook and fine; occasionally
 *                a component that was renamed on one side only. Reported as a
 *                note, not a failure, because this gate cannot tell a hook
 *                from an orphan — only the allowlist can, which is why every
 *                entry in it carries a reason.
 *
 * HOW. At runtime, in a real browser, over the built stories — not by parsing
 * the source. A parse can tell you which strings appear in which file; it
 * cannot tell you whether a selector matched, and "did it match" is the entire
 * question. Every check below ends in `element.matches(selector)`, which is
 * the same answer the cascade gave.
 *
 *   npm run build-storybook && node tools/attribute-gate.mjs
 *   node tools/attribute-gate.mjs --verbose    every element, not a sample
 *
 * `npm run gates` runs this in the same browser pass as the other story gates.
 * Exit code 1 on any undeclared or inert value.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { readVocabulary } from "./css-vocabulary.mjs";
import { ROOT, isMain, runChecks } from "./lib/stories.mjs";

/* Attributes the browser, React or Storybook put on elements themselves. None
   of these is the kit's API, so a value in one is not the kit's to check. */
const FOREIGN = /^data-(reactroot|testid|test-id|index|rr-ui|floating|radix|headlessui|sb-|storybook)/;

/* Values that are deliberately not in the CSS, with the reason. A JS hook is
   a real use of a data attribute and the gate cannot tell one from a typo —
   only this list can, which is why an entry without a reason is not an entry.

   Keyed "attribute" for a whole attribute that is script-only, or
   "attribute=value" for one value of an attribute the CSS otherwise uses. */
const SCRIPT_ONLY = new Map([
  ["data-modal-trigger", "querySelector hook — the dialog is opened by script, not styled by the attribute"],
  ["data-map-activate", "click target for the map's deferred load; the button beside it carries the styling"],
  ["data-faq-panel", "disclosure hook read by the accordion script"],
  ["data-header-menu", "hook for the header's outside-click close"],
  ["data-state", "written by script to reflect open/closed for the hook above; the CSS reads data-open"],
  ["data-scene-node", "a scene part's place in its scene, read by Scene and SceneLayers to light it; the CSS reads data-scene-active"],
  ["data-section-variant", "a library section's layout, named for layers panels and audits; its shells draw the layout, so the CSS has nothing to add"],
]);

export function attributeCheck(argv = process.argv.slice(2)) {
  const verbose = argv.includes("--verbose");

  /* The vocabulary is parsed from the FILES, by tools/css-vocabulary.mjs, and
     not read from document.styleSheets. That module's header says why; the
     short version is that the CSSOM gave three kinds of wrong answer, each of
     which looked like a finding.

     The browser is asked only the question it alone can answer: does this
     element match this selector. element.matches() does not care whether the
     rule was ever loaded into that page. */
  const { claims, declared, bare, defaults, cssFiles } = readVocabulary();

  /* A declared default is a value the CSS deliberately does not name, so it
     must not then be hunted for a matching rule. It joins the vocabulary and
     is exempt from the match test. */
  const DEFAULTS = [...defaults.keys()];
  for (const key of DEFAULTS) {
    const [attr, value] = key.split("=");
    if (!declared.has(attr)) declared.set(attr, new Set());
    declared.get(attr).add(value);
  }

  const CLAIMS = Object.fromEntries([...claims].map(([k, v]) => [k, [...v]]));
  const DECLARED = Object.fromEntries([...declared].map(([k, v]) => [k, [...v]]));
  const BARE = [...bare];
  const vocabulary = Object.values(DECLARED).reduce((n, v) => n + v.length, 0);

  /* key -> { kind, attr, value, tag, stories:Set } */
  const found = new Map();
  let elements = 0;
  let rendered = 0;

  return {
    name: "attributes",
    viewports: ["desktop"],

    async visit(page, story) {
      rendered += 1;
      const report = await page.evaluate(
        ({ FOREIGN_SRC, CLAIMS, DECLARED, BARE, DEFAULTS }) => {
          const FOREIGN_RE = new RegExp(FOREIGN_SRC);
          const bare = new Set(BARE);
          const defaults = new Set(DEFAULTS);
          const out = [];
          const root = document.getElementById("storybook-root");
          const all = root ? root.querySelectorAll("*") : [];
          for (const el of all) {
            for (const { name, value } of el.attributes) {
              if (!name.startsWith("data-")) continue;
              if (FOREIGN_RE.test(name)) continue;
              if (value === "") continue; // presence-only, e.g. data-density=""
              const known = DECLARED[name];
              const tag = el.tagName.toLowerCase();

              if (!known || known.length === 0) {
                /* The CSS names no value for this attribute. Either it is used
                   as a presence selector, where the value is free-form and
                   there is nothing to typo, or the CSS does not know it. */
                if (!bare.has(name)) out.push({ kind: "never-in-css", attr: name, value, tag });
                continue;
              }
              if (!known.includes(value)) {
                out.push({ kind: "undeclared", attr: name, value, tag });
                continue;
              }
              /* Declared as the base state in the component's own file. There
                 is no rule to match and that is the point. */
              if (defaults.has(`${name}=${value}`)) continue;
              const hit = (CLAIMS[`${name}=${value}`] || []).some((sel) => {
                try {
                  return el.matches(sel);
                } catch {
                  return false;
                }
              });
              if (!hit) out.push({ kind: "inert", attr: name, value, tag });
            }
          }
          return { out, elements: all.length };
        },
        { FOREIGN_SRC: FOREIGN.source, CLAIMS, DECLARED, BARE, DEFAULTS },
      );

      elements += report.elements;
      for (const r of report.out) {
        const key = `${r.kind}|${r.attr}|${r.value}|${r.tag}`;
        if (!found.has(key)) found.set(key, { ...r, stories: new Set() });
        found.get(key).stories.add(story.id);
      }
    },

    report() {
      /* --- the static half: attributes the source writes that no selector
         names. The runtime pass only sees elements that rendered. A data
         attribute on a component nobody wrote a story for is invisible to it,
         so the source is swept too — cheaply, for attribute NAMES only,
         because a name is the one thing a regex can read out of TSX without
         lying about it. Values are left to the browser. */
      const read = (dir, acc = []) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, e.name);
          if (e.isDirectory()) read(p, acc);
          else if (/\.(tsx|ts|html)$/.test(e.name)) acc.push(p);
        }
        return acc;
      };

      const cssAll = cssFiles.map((f) => readFileSync(f, "utf8")).join("\n");
      const cssAttrs = new Set([...cssAll.matchAll(/\[(data-[a-z0-9-]+)/gi)].map(([, a]) => a));

      const sourceAttrs = new Map(); // attr -> Set(file)
      for (const f of read(resolve(ROOT, "src"), [])) {
        const text = readFileSync(f, "utf8");
        for (const [, attr] of text.matchAll(/\b(data-[a-z0-9-]+)\s*=/gi)) {
          if (FOREIGN.test(attr)) continue;
          if (!sourceAttrs.has(attr)) sourceAttrs.set(attr, new Set());
          sourceAttrs.get(attr).add(relative(ROOT, f).replaceAll("\\", "/"));
        }
      }

      const orphans = [...sourceAttrs]
        .filter(([attr]) => !cssAttrs.has(attr) && !SCRIPT_ONLY.has(attr))
        .sort();

      const excused = (r) => SCRIPT_ONLY.get(r.attr) ?? SCRIPT_ONLY.get(`${r.attr}=${r.value}`);

      const rows = [...found.values()];
      const fails = rows.filter((r) => r.kind !== "never-in-css" && !excused(r));
      const notes = rows.filter((r) => r.kind === "never-in-css" || excused(r));

      console.log(
        `\ntokenkit attribute gate — ${rendered} stories, ${elements} elements, ` +
          `${vocabulary} declared attribute values\n`,
      );

      const show = (r) => {
        const where = [...r.stories];
        const tail = verbose
          ? where.join(", ")
          : where.slice(0, 2).join(", ") + (where.length > 2 ? ` +${where.length - 2}` : "");
        return `<${r.tag}> ${r.attr}="${r.value}"  —  ${tail}`;
      };

      for (const r of fails.filter((r) => r.kind === "undeclared")) {
        console.log(`FAIL  undeclared  ${show(r)}`);
      }
      for (const r of fails.filter((r) => r.kind === "inert")) {
        console.log(`FAIL  inert       ${show(r)}`);
      }
      for (const r of notes) {
        const why = excused(r);
        console.log(`note  ${why ? "script-only" : "no CSS    "}  ${show(r)}${why ? `\n        ${why}` : ""}`);
      }
      for (const [key, files] of defaults) {
        console.log(`note  default     ${key.replace("=", '="')}" — base state, declared in ${files.join(", ")}`);
      }
      for (const [attr, files] of orphans) {
        console.log(`note  unstyled    ${attr} — written in ${[...files].slice(0, 3).join(", ")}, named by no selector`);
      }

      console.log(
        `\n${vocabulary} values declared · ${fails.filter((r) => r.kind === "undeclared").length} undeclared · ` +
          `${fails.filter((r) => r.kind === "inert").length} inert · ${notes.length + orphans.length} notes`,
      );

      if (fails.length) {
        console.error(
          "\nAttribute gate FAILED.\n" +
            "  undeclared — no selector in the kit names this value. The attribute is\n" +
            "               decoration: it renders, it is in the DOM, and it styles\n" +
            "               nothing. Check the spelling against the component's own\n" +
            "               CSS file, or add it to SCRIPT_ONLY with the reason it is\n" +
            "               a hook rather than a class.\n" +
            "  inert      — the value exists, but on another component. A variant of\n" +
            "               one part written onto a different part reads as a variant\n" +
            "               and behaves as nothing.",
        );
        return false;
      }
      console.log("\nEvery attribute value the DOM carries is one a selector answers to.");
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([attributeCheck()])) ? 0 : 1);
}
