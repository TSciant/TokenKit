#!/usr/bin/env node
/**
 * Token lint — the discipline, enforced.
 *
 * Three rules, each of which is the thing that quietly rots a design system:
 *
 *   1. No colour literals outside src/css/packs/. A component that knows a hex
 *      value is a component a brand swap cannot reach.
 *   2. Every --tk-* a component reads is declared somewhere. An undeclared
 *      custom property resolves to guaranteed-invalid and silently drops the
 *      whole declaration.
 *   3. Every pack fills every contract slot the reference pack fills. An
 *      unfilled slot falls back to its @property initial-value, which renders
 *      but is not on brand.
 *   4. Every file parses. Added after a generated pack shipped with a nested
 *      CSS comment in its header — `/* solved *\/` written inside another
 *      comment, which closes it, because CSS comments do not nest. Browsers
 *      recover from that by skipping to the next brace, so the contrast gate
 *      reported 812 passing pairs against a file the build rejected outright.
 *      A lint that reads CSS with regexes cannot see this; a parser can, and
 *      it costs one pass over files this tool was already reading.
 *
 *   node tools/lint-tokens.mjs
 *
 * Exit code 1 on any error. Unfilled pack slots are warnings, not errors —
 * a pack in progress is a normal state.
 */

import postcss from "postcss";
import { readdir, readFile } from "node:fs/promises";
import { resolve, dirname, relative, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSS = resolve(ROOT, "src/css");
const PACKS = resolve(CSS, "packs");

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (entry.name.endsWith(".css")) out.push(p);
  }
  return out;
}

const files = await walk(CSS);
const errors = [];
const warnings = [];

/* Rule 4, first, because every rule below reads these files as text and a
   file that does not parse makes the rest of this tool confidently wrong. */
for (const file of files) {
  const source = await readFile(file, "utf8");
  try {
    postcss.parse(source, { from: file });
  } catch (err) {
    /* A plain string: the reporter at the bottom interpolates these directly,
       and an object there prints as [object Object] — which is how the first
       version of this check reported a real failure as noise. */
    errors.push(
      `${relative(ROOT, file)} does not parse — ${err.reason ?? err.message}` +
        (err.line ? ` (line ${err.line}, column ${err.column})` : ""),
    );
  }
}

const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\boklch\s*\(|\blab\s*\(/g;

/* Colour words that are structural rather than chosen: these carry no brand. */
const ALLOWED_KEYWORDS = new Set(["transparent", "currentColor", "inherit"]);

const declared = new Set();
const referenced = new Map(); // name -> [file...]
const packSlots = new Map(); // packFile -> Set(slot)

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join("/");
  const src = await readFile(file, "utf8");
  const inPacks = file.startsWith(PACKS);
  const isProperty = file.endsWith("02-property.css");

  // --- rule 1: colour literals -------------------------------------------
  if (!inPacks && !isProperty) {
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      if (line.trim().startsWith("*") || line.trim().startsWith("/*")) return;
      // rgb(0 0 0 / x) in a shadow token is a shade, not a brand colour, and
      // lives in the scale file by design.
      if (file.endsWith("03-scale.css") && /--tk-shadow/.test(line)) return;
      if (file.endsWith("04-elements.css") && /::backdrop/.test(lines[i - 1] || "")) return;

      /* Relative colour syntax over a contract token is a derivation, not a
         literal. `rgb(from var(--tk-scrim-ink) r g b / var(--tk-scrim-aa))`
         states no colour: it reads whichever one the pack supplied and
         changes only its alpha, which is exactly the separation this rule
         exists to protect. Matching on `from var(--tk-` keeps the exception
         narrow — `rgb(from #1f1f1f ...)` is still a literal and still fails. */
      if (/\b(?:rgba?|hsla?|oklch|lab|color)\s*\(\s*from\s+var\(--tk-/.test(line)) return;
      const matches = line.match(COLOR_LITERAL);
      if (matches) {
        errors.push(
          `${rel}:${i + 1}  colour literal outside packs/ — ${matches[0].trim()}`,
        );
      }
    });
  }

  // --- collect declarations and references --------------------------------
  for (const m of src.matchAll(/(--tk-[a-z0-9-]+)\s*:/g)) declared.add(m[1]);
  for (const m of src.matchAll(/@property\s+(--tk-[a-z0-9-]+)/g)) declared.add(m[1]);
  /* Capture whether the reference supplies a fallback. `var(--x)` and
     `var(--x, something)` are different claims: the first says the token
     exists, the second says it might not and here is what to do about it. */
  for (const m of src.matchAll(/var\(\s*(--tk-[a-z0-9-]+)\s*(,?)/g)) {
    const [, name, comma] = m;
    if (!referenced.has(name)) referenced.set(name, { files: new Set(), bare: 0, guarded: 0 });
    const rec = referenced.get(name);
    rec.files.add(rel);
    if (comma === ",") rec.guarded++;
    else rec.bare++;
  }

  if (inPacks) {
    const slots = new Set();
    for (const m of src.matchAll(/(--tk-[a-z0-9-]+)\s*:/g)) slots.add(m[1]);
    packSlots.set(rel, slots);
  }
}

// --- rule 2: every reference is declared, or has an inline fallback --------
/* The distinction this rule used to document but never implement.

   `var(--tk-nope)` with nothing declared is invalid at computed-value time —
   the declaration is dropped and the property falls back to its initial
   value, silently. That is an error.

   `var(--tk-nope, var(--tk-real))` resolves correctly every time. It is not a
   bug and reporting it as one sends people hunting for a failure that is not
   there — which is exactly what happened. It is still worth surfacing,
   because a fallback chain onto a slot that does not exist means the
   component is reaching past the contract for a name nobody defined. That is
   a warning: working, and worth tidying. */
for (const [name, rec] of referenced) {
  if (declared.has(name)) continue;
  const where = [...rec.files].join(", ");
  if (rec.bare > 0) {
    errors.push(
      `undeclared token ${name} — referenced without a fallback in ${where}` +
        (rec.guarded ? ` (${rec.guarded} other reference(s) do have one)` : ""),
    );
  } else {
    warnings.push(
      `${name} is not a contract slot — every reference supplies a fallback so it ` +
        `resolves, but it names something the contract does not define. ${where}`,
    );
  }
}

// --- rule 3: pack coverage against the reference pack ---------------------
const referencePack = "src/css/packs/wireframe.css";
const reference = packSlots.get(referencePack);

if (!reference) {
  errors.push(`reference pack missing: ${referencePack}`);
} else {
  for (const [pack, slots] of packSlots) {
    if (pack === referencePack) continue;
    if (pack.endsWith("_template.css")) continue;
    const missing = [...reference].filter((s) => !slots.has(s));
    if (missing.length) {
      warnings.push(
        `${pack} leaves ${missing.length} contract slot(s) unfilled: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? ", …" : ""}`,
      );
    }
  }
}

/* --- unused declarations ---------------------------------------------------
   The scales are a published API — a step nothing happens to use yet is not a
   defect, it is a scale with a gap in demand. Only semantic slots are worth
   flagging, because an unread semantic slot usually means a rename went half
   way. */
const SCALE_FAMILY =
  /^--tk-(space|size|leading|tracking|weight|radius|duration|ease|shadow|measure|target|font|density|meter)-?/;

for (const name of declared) {
  if (referenced.has(name)) continue;
  if (SCALE_FAMILY.test(name)) continue;
  if (name.startsWith("--tk-status")) continue;
  warnings.push(`${name} is declared but never read`);
}

console.log(`\ntokenkit token lint — ${files.length} files, ${declared.size} tokens\n`);

for (const w of warnings) console.log(`  warn   ${w}`);
for (const e of errors) console.log(`  ERROR  ${e}`);

console.log(
  `\n${errors.length} error(s) · ${warnings.length} warning(s)\n`,
);

process.exit(errors.length > 0 ? 1 : 0);
