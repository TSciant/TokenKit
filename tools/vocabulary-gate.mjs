#!/usr/bin/env node
/**
 * Vocabulary gate — does the component offer what the CSS answers?
 *
 * THE BUG THIS EXISTS FOR. `Plate` declared
 *
 *     texture?: "hatch" | "dots" | "rule" | "none"
 *
 * while 05-textures.css named sixteen. Twelve of them — every material
 * texture, the brand's own, the brand's signature — were unreachable from the
 * component that most wants them, and nothing said so. The CSS worked. The
 * component worked. TypeScript was satisfied, because a union is only wrong
 * against another union and there was no other union to be wrong against.
 *
 * That is the shape of it: a hand-written list in TypeScript standing beside a
 * hand-written list in CSS, with nothing in between. They start equal and they
 * drift, always in the same direction — the CSS grows and the union does not,
 * because adding a texture is one rule and remembering the prop is a separate
 * act of memory.
 *
 * TWO DIRECTIONS, and both are failures.
 *
 *   narrow   the union offers fewer values than the CSS answers. The kit can
 *            do the thing and the component will not let you ask for it.
 *
 *   invented the union offers a value the CSS never names. The prop typechecks,
 *            the attribute renders, and nothing happens — the same silence
 *            tools/attribute-gate.mjs hunts at runtime, caught here without
 *            needing the element to exist.
 *
 * SCOPE is the whole difficulty, and it is handled in css-vocabulary.mjs. A
 * value belongs to the component it shares a selector compound with:
 * `data-tone` names four values and no component offers all four. A value
 * named with no `data-tk` beside it — `[data-texture="hatch"]` — belongs to
 * nobody and is therefore available to everybody.
 *
 * WHEN A NARROW UNION IS RIGHT. Sometimes. A component may deliberately expose
 * a subset — a slot that only makes sense with two of six values. Say so where
 * the prop is, and say why:
 *
 *     // tk-vocab: texture omits signature — a plate is not a brand surface
 *
 * Static. No build, no browser: this reads .tsx and .css and nothing else.
 *
 *   node tools/vocabulary-gate.mjs
 *
 * Exit code 1 on any narrow or invented union.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readVocabulary } from "./css-vocabulary.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/* Declared defaults are already folded in, and already scoped to the rule each
   marker sits above — which is the part that matters. Pooling them globally
   made `data-variant="solid"`, the button's base state, a legal variant of the
   card, and this gate then reported Card's union as missing it. */
const { scoped, global: globalValues } = readVocabulary();

const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.tsx$/.test(e.name) && !/\.stories\./.test(e.name)) acc.push(p);
  }
  return acc;
};

const files = [
  ...walk(resolve(ROOT, "src/react")),
  ...walk(resolve(ROOT, "src/samples")),
  ...walk(resolve(ROOT, "src/playground")),
];

/** Every `data-x={expr}` in a file, with the offsets the expression spans. */
function bindings(text) {
  const out = [];
  const re = /(data-[a-z0-9-]+)=\{/g;
  for (const m of text.matchAll(re)) {
    const attr = m[1];
    let i = m.index + m[0].length;
    let depth = 1;
    let quote = null;
    while (i < text.length && depth > 0) {
      const c = text[i];
      if (quote) {
        if (c === quote && text[i - 1] !== "\\") quote = null;
      } else if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      i++;
    }
    out.push({ attr, at: m.index, expr: text.slice(m.index + m[0].length, i - 1) });
  }
  return out;
}

/**
 * Which component is this attribute on?
 *
 * The `data-tk` literal in the same JSX opening tag. Found by scanning back
 * from the binding to the `<` that opened the tag — attributes of one element
 * are contiguous, so the tag is the right unit and the nearest enclosing one
 * is the right tag. Returns null for an element with no data-tk, which then
 * gets the global vocabulary and nothing else.
 */
function ownerOf(text, at) {
  const open = text.lastIndexOf("<", at);
  if (open < 0) return null;
  const close = text.indexOf(">", at);
  const tag = text.slice(open, close < 0 ? text.length : close);
  return tag.match(/data-tk=\{?"([a-z0-9-]+)"/)?.[1] ?? null;
}

/**
 * WHICH VALUES CAN ACTUALLY REACH THE ATTRIBUTE.
 *
 * Not the union — the union is the prop, and the binding sits between the prop
 * and the attribute. Three shapes, and reading them apart is most of what this
 * file does:
 *
 *   data-width={width}
 *       Everything the union holds is written out. `width="default"` renders
 *       `data-width="default"`, which no selector answers. The union is the
 *       candidate set.
 *
 *   data-variant={variant === "default" ? undefined : variant}
 *       The identifier still reaches the output, so this is a pass-through —
 *       but one value has been GUARDED away, because it is the base state and
 *       renders no attribute at all. The candidate set is the union minus the
 *       guards. This is the kit's idiom for a default and it is correct; a
 *       gate that called it a fault would be arguing with the right answer.
 *
 *   data-on={surface === "inverse" ? "inverse" : undefined}
 *       The identifier does NOT reach the output. One prop feeds two
 *       attributes here — the other line is `data-surface` — so the union
 *       spans both and neither attribute is responsible for all of it. Only
 *       the literals can be written, so only the literals are checked, and
 *       asking whether this binding covers the vocabulary is meaningless.
 */
function reachable(expr, name, union) {
  const guards = [
    ...expr.matchAll(new RegExp(`\\b${name}\\s*[!=]==?\\s*"([^"]*)"`, "g")),
    ...expr.matchAll(new RegExp(`"([^"]*)"\\s*[!=]==?\\s*\\b${name}\\b`, "g")),
  ].map((m) => m[1]);

  const stripped = expr
    .replace(new RegExp(`\\b${name}\\s*[!=]==?\\s*"[^"]*"`, "g"), " ")
    .replace(new RegExp(`"[^"]*"\\s*[!=]==?\\s*\\b${name}\\b`, "g"), " ");

  if (new RegExp(`\\b${name}\\b`).test(stripped)) {
    return { values: union.filter((v) => !guards.includes(v)), guards, complete: true };
  }
  const literals = [...expr.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  return { values: [...new Set(literals)], guards, complete: false };
}

/** Identifiers in an expression, minus string contents and JS keywords. */
const KEYWORDS = new Set([
  "undefined", "null", "true", "false", "String", "Number", "Boolean",
  "props", "args", "ctx", "e", "String",
]);
const identifiers = (expr) =>
  [...expr.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, " ").matchAll(/\b([a-zA-Z_$][\w$]*)\b/g)]
    .map((m) => m[1])
    .filter((n) => !KEYWORDS.has(n));

/**
 * The string-literal union a name is declared with, in this file.
 *
 * Handles both the inline form (`texture?: "a" | "b"`) and one level of alias
 * (`texture?: Texture` with `type Texture = "a" | "b"` in the same file),
 * because the kit uses both and an alias is not a different promise.
 */
function unionFor(text, name) {
  const inline = text.match(
    new RegExp(`\\b${name}\\??\\s*:\\s*((?:"[^"]+"\\s*\\|\\s*)+"[^"]+")`),
  );
  if (inline) return [...inline[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  const alias = text.match(new RegExp(`\\b${name}\\??\\s*:\\s*([A-Z][\\w]*)\\b`));
  if (!alias) return null;
  const def = text.match(
    new RegExp(`type\\s+${alias[1]}\\s*=\\s*((?:\\s*\\|?\\s*"[^"]+")+)`),
  );
  if (!def) return null;
  return [...def[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/* `// tk-vocab: <prop> omits <a>, <b> — <reason>` anywhere in the file. */
const exemptions = (text) => {
  const out = new Map();
  for (const [, prop, list] of text.matchAll(
    /tk-vocab:\s*(\w+)\s+omits\s+([^\n]+)/g,
  )) {
    const values = list
      .split(/[,—-]/)[0]
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[a-z0-9-]+$/.test(s));
    const all = list.split("—")[0].split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9-]+$/.test(s));
    out.set(prop, new Set(all.length ? all : values));
  }
  return out;
};

const findings = [];
let checked = 0;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (!text.includes("data-")) continue;
  const short = file.replace(`${ROOT}/`, "");
  const exempt = exemptions(text);
  const seen = new Set();

  for (const b of bindings(text)) {
    const owner = ownerOf(text, b.at);
    for (const name of identifiers(b.expr)) {
      const union = unionFor(text, name);
      if (!union || union.length < 2) continue;

      const allowed = new Set([
        ...(globalValues.get(b.attr) ?? []),
        ...(scoped.get(owner)?.get(b.attr) ?? []),
      ]);
      if (allowed.size === 0) continue; // attribute the CSS never values

      const key = `${short}|${name}|${b.attr}`;
      if (seen.has(key)) continue;
      seen.add(key);
      checked += 1;

      const omitted = exempt.get(name) ?? new Set();
      const { values, guards, complete } = reachable(b.expr, name, union);
      if (!values.length) continue;

      const invented = values.filter((v) => !allowed.has(v));
      /* Only a pass-through binding is answerable for the whole vocabulary. A
         binding that writes one literal is an opt-in, not an offer.
 
         A GUARDED value counts as offered. `status="info"` renders no
         attribute because info is the alert's base state, and the CSS says so
         with a tk-default marker — so the value is in the vocabulary, in the
         union, and correctly absent from the DOM. Leaving guards out of this
         subtraction reported every well-behaved default as a gap. */
      const missing = complete
        ? [...allowed].filter(
            (v) => !values.includes(v) && !guards.includes(v) && !omitted.has(v),
          )
        : [];

      if (invented.length) {
        findings.push({ kind: "invented", short, name, attr: b.attr, owner, values: invented, union });
      }
      if (missing.length) {
        findings.push({ kind: "narrow", short, name, attr: b.attr, owner, values: missing, union });
      }
    }
  }
}

console.log(
  `\ntokenkit vocabulary gate — ${files.length} components, ${checked} prop/attribute pairs\n`,
);

for (const f of findings) {
  const where = f.owner ? `[data-tk="${f.owner}"]` : "no data-tk";
  console.log(
    `${f.kind === "narrow" ? "FAIL  narrow  " : "FAIL  invented"}  ${f.short}  ${f.name} → ${f.attr}  (${where})`,
  );
  console.log(`        union: ${f.union.join(" | ")}`);
  console.log(
    `        ${f.kind === "narrow" ? "CSS also answers" : "CSS never names"}: ${f.values.join(", ")}`,
  );
}

console.log(
  `\n${checked} checked · ${findings.filter((f) => f.kind === "narrow").length} narrow · ` +
    `${findings.filter((f) => f.kind === "invented").length} invented`,
);

if (findings.length) {
  console.error(
    "\nVocabulary gate FAILED.\n" +
      "  narrow   — the CSS answers values this component will not let you ask\n" +
      "             for. Widen the union, or write `// tk-vocab: <prop> omits\n" +
      "             <values> — <reason>` beside the prop if the omission is a\n" +
      "             decision rather than an oversight.\n" +
      "  invented — the union offers a value no selector names. It typechecks,\n" +
      "             it renders, and it does nothing.",
  );
  process.exit(1);
}
console.log("\nEvery union offers exactly what the CSS answers.");
