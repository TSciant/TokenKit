#!/usr/bin/env node
/**
 * Component contracts: one file per component, contracts/<Name>.contract.json,
 * what the component promises (docs/11-tokens-and-contracts.md, part 2).
 *
 * Two kinds of field. Facts are generated and rewritten on every run:
 *
 *   props    from the code (tools/figma-manifest.mjs reads them with the
 *            TypeScript compiler): type, values, default, and the Figma
 *            property each one pairs with
 *   figma    each Figma component that draws it (node, Code Connect), with
 *            the Figma-to-code map and the Figma properties no prop takes
 *            (tools/figma-propmap.mjs, from figma/props.json)
 *   tokens   every tk slot its stylesheet reads, found in the CSS rules that
 *            style the component's own data-tk elements
 *   checks   which of the kit's checks cover it today
 *
 * Decisions are written by people and never touched by a run: `decisions`
 * (omit and pairWith, each with its reason), `a11y`, `i18n`, `events` and
 * `privacy`. Until someone fills one in it stays null, and the gate reports it
 * as open rather than inventing it.
 *
 *   node tools/contracts.mjs            write every contract
 *   node tools/contracts.mjs --check    fail if any contract's facts are stale
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { propmap, manifest, codeFor } from "./figma-propmap.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "contracts");
const read = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");
const keys = JSON.parse(read("figma/keys.json"));
const onion = JSON.parse(read("figma/onion.json")).components;
const codeConnect = new Set(JSON.parse(read("figma/code-connect.json")).map((r) => r.node));
const HAND = ["decisions", "a11y", "i18n", "events", "privacy"];

/* ---- CSS: the tk slots each data-tk element's rules read --------------------- */
const rules = [];
for (const dir of ["src/css/components", "src/css/shells", "src/css"]) {
  if (!existsSync(join(ROOT, dir))) continue;
  for (const f of readdirSync(join(ROOT, dir)).filter((x) => x.endsWith(".css"))) {
    const css = read(`${dir}/${f}`).replace(/\/\*[\s\S]*?\*\//g, "");
    /* Innermost rules only: a selector, then a body with no braces in it. */
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) rules.push({ selector: m[1].trim(), body: m[2], file: `${dir}/${f}` });
  }
}
/* The element a rule styles is in the last compound of each selector in its list. */
const styled = (selector) => selector.split(",").map((s) => {
  const parts = s.trim().split(/\s+|>|\+|~/).filter(Boolean);
  return [...(parts.at(-1) ?? "").matchAll(/data-tk="([\w-]+)"/g)].map((x) => x[1]);
}).flat();
const tokensFor = (tks) => {
  const out = new Set(), files = new Set();
  for (const r of rules) if (styled(r.selector).some((t) => tks.has(t))) { files.add(r.file); for (const m of r.body.matchAll(/var\(--tk-([\w-]+)/g)) out.add(m[1]); }
  return { tokens: [...out].sort(), files: [...files].sort() };
};
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();

/* ---- props ------------------------------------------------------------------- */
const typeOf = (p) => {
  if (p.kind === "VARIANT") return { type: "enum", values: p.options };
  if (p.kind === "BOOLEAN") return { type: "boolean" };
  if (p.kind === "TEXT") return { type: p.numeric ? "number" : "text" };
  if (p.kind === "SLOT") return { type: /icon|leading|trailing|mark/i.test(p.name) ? "icon or content" : "content" };
  if (/^on[A-Z]/.test(p.name)) return { type: "event" };
  return { type: "other", ts: p.type ?? null };
};

const figmaByCode = new Map();
for (const [kitName, node] of Object.entries(keys.components)) {
  const m = propmap[kitName];
  if (!m) continue;
  const c = codeFor(kitName);
  if (!c) continue;
  (figmaByCode.get(c.name) ?? figmaByCode.set(c.name, []).get(c.name)).push({ kitName, m });
}

const contracts = {};
for (const c of manifest.components) {
  const src = read(c.file);
  const ownRoot = kebab(c.name);
  /* data-tk="chip" in JSX and "data-tk": "chip" in a props object both count. */
  const written = [...new Set([...src.matchAll(/data-tk["']?\s*[:=]\s*["']([\w-]+)["']/g)].map((m) => m[1]))];
  const own = written.filter((t) => t === ownRoot || t.startsWith(ownRoot + "-"));
  /* A pattern that composes kit pieces has no elements of its own: it reads what it composes. */
  const tks = new Set(own.length ? own : written);
  const { tokens, files } = tokensFor(tks);
  const figma = (figmaByCode.get(c.name) ?? []).map(({ kitName, m }) => ({
    name: kitName,
    node: m.node,
    codeConnect: codeConnect.has(m.node),
    map: Object.fromEntries(m.map.filter(([, v]) => v !== null).map(([k, v]) => [k, v])),
    unpaired: m.map.filter(([, v]) => v === null).map(([k]) => k),
  }));
  const pairedFrom = (prop) => figma.flatMap((f) => Object.entries(f.map).filter(([, v]) => new RegExp(`^${prop}\\b`).test(v)).map(([k]) => `${f.name}.${k}`));
  const props = {};
  for (const p of c.props) {
    const t = typeOf(p);
    const fig = pairedFrom(p.name);
    props[p.name] = { ...t, ...(p.default !== null ? { default: p.default } : {}), ...(p.optional ? {} : { required: true }), ...(fig.length ? { figma: fig } : {}), ...(p.doc ? { about: p.doc } : {}) };
  }
  const checks = [];
  if (keys.components[c.name] || figma.length) checks.push("figma");
  if (onion[c.name] || figma.some((f) => onion[f.name])) checks.push("onion");
  if (figma.some((f) => f.codeConnect)) checks.push("code-connect");
  if (tokens.length) checks.push("contrast", "token-lint");
  contracts[c.name] = {
    $schema: "./contract.schema.json",
    component: c.name,
    layer: c.layer,
    about: c.doc || null,
    sources: { react: c.file, swiftui: null, compose: null },
    css: files,
    dataTk: [...tks].sort(),
    figma,
    props,
    tokens,
    checks,
  };
}

/* ---- write, keeping what people wrote ------------------------------------------ */
const CHECK = process.argv.includes("--check");
mkdirSync(OUT, { recursive: true });
let stale = 0, written = 0, open = 0;
const undecided = [];
for (const [name, facts] of Object.entries(contracts)) {
  const path = join(OUT, `${name}.contract.json`);
  const prev = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  const doc = { ...facts };
  for (const k of HAND) doc[k] = prev[k] ?? null;
  open += HAND.filter((k) => doc[k] === null).length;
  /* Every Figma property no prop takes needs a decision: paired under another name, or omitted with a reason. */
  for (const f of doc.figma) for (const u of f.unpaired) {
    const key = `${f.name}.${u}`;
    if (!doc.decisions?.pairWith?.[key] && !doc.decisions?.omit?.[key]) { undecided.push(`${name}: ${key}`); }
  }
  const text = JSON.stringify(doc, null, 1) + "\n";
  const now = existsSync(path) ? readFileSync(path, "utf8").replace(/\r\n/g, "\n") : null;
  if (now === text) continue;
  if (CHECK) { stale++; console.error(`stale  contracts/${name}.contract.json`); continue; }
  writeFileSync(path, text);
  written++;
}
const orphans = readdirSync(OUT).filter((f) => f.endsWith(".contract.json") && !contracts[basename(f, ".contract.json")]);
for (const o of orphans) { console.error(`contracts/${o}: no component of that name in the code`); stale++; }
for (const u of undecided) console.error(`undecided  ${u}: record it in decisions.pairWith (its code form) or decisions.omit (why no prop takes it)`);
if (CHECK) {
  if (stale || undecided.length) { console.error(`\n${stale} contract(s) out of date, ${undecided.length} Figma propert${undecided.length === 1 ? "y" : "ies"} undecided`); process.exit(1); }
  console.log(`contracts current: ${Object.keys(contracts).length} components, ${open} decision fields still open`);
} else {
  const unpaired = Object.values(contracts).reduce((n, c) => n + c.figma.reduce((m, f) => m + f.unpaired.length, 0), 0);
  console.log(`contracts: ${Object.keys(contracts).length} components (${written} written); ${unpaired} Figma properties unpaired; ${open} decision fields open`);
}
