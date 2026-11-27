#!/usr/bin/env node
/**
 * Figma prop map: how each Figma component's properties become its React props.
 *
 * Figma's MCP now hands an agent the kit's real components (Code Connect), but
 * with Figma's property names: <Button label="Go" state="default" leading="34:115">.
 * The code says <Button leading={<Icon name="plus" />}>Go</Button>. This file is
 * the translation, generated from the two sides and never written by hand:
 *
 *   figma/props.json      each Figma component's properties (a snapshot of the
 *                         library, taken through the Figma MCP; refresh it when
 *                         a component's properties change)
 *   the code              each component's props, read by tools/figma-manifest.mjs
 *
 *   node tools/figma-propmap.mjs           -> figma/propmap.json
 *   node tools/figma-propmap.mjs --check   fail if it is out of date
 *
 * figma-guidelines.mjs prints it into the library guidelines, so Figma's own
 * agent and any agent reading the MCP output get the same rules.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "figma", "propmap.json");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const keys = read("figma/keys.json");
const props = read("figma/props.json");
const manifest = JSON.parse(execFileSync(process.execPath, [join(ROOT, "tools/figma-manifest.mjs"), "--stdout", "--packs"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, windowsHide: true }));
const code = new Map(manifest.components.map((c) => [c.name, c]));

const camel = (s) => s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toLowerCase());
const lc = (s) => String(s).toLowerCase();
/* Props that change behaviour, not what a frame shows: never a Figma gap. */
const NONVISUAL = /^(on[A-Z]|href|as|id|name|value|defaultValue|type|form|target|rel|className|style|ref|key|children|a11y|aria|role|tabIndex|delay|timeout|persist|remember|sync|focusOn|closeOn|autoFocus|initial|capture|source|index|replay|currentTime|state$|live|loading|busy|done|labels?$|decorative|doneLabel|align$|placement|position|contained|priority|stock|crop|scheme|navigation|scale|geolocate|fullscreen|marker|syncTabs|enabled|alert|singleExpand|focusOnShow)/;

/* Which code component draws a Figma component: the same name, the parent of a
   part (Pricing/Plan is drawn by Pricing), or the component its file is named for. */
function codeFor(kitName) {
  if (code.has(kitName)) return code.get(kitName);
  const parent = kitName.split("/")[0];
  if (kitName.includes("/") && code.has(parent)) return code.get(parent);
  const src = keys.sources?.[kitName];
  if (!src) return null;
  const inFile = manifest.components.filter((c) => c.file === src);
  return inFile.find((c) => kitName.startsWith(c.name)) ?? inFile[0] ?? null;
}

const STATE_CSS = new Set(["default", "hover", "active", "focus", "focused", "idle", "rest"]);

function mapComponent(kitName, node) {
  const f = props[node];
  if (!f) return null;
  const c = codeFor(kitName);
  const cp = new Map((c?.props ?? []).map((p) => [lc(p.name), p]));
  const pascal = (s) => camel(s).replace(/^./, (x) => x.toUpperCase());
  /* The code prop a Figma property names: the same name, or with/show + it (withMegaMenu, showSearch). */
  const has = (n) => cp.get(lc(camel(n))) ?? cp.get(lc("with" + pascal(n))) ?? cp.get(lc("show" + pascal(n)));
  const rows = [], used = new Set();
  const use = (p) => (used.add(lc(p.name)), p.name);
  const part = kitName.includes("/") && c && c.name !== kitName.split("/").pop();
  /* "Nav 3" is the third of an array prop: navItems[2], navs[2]. */
  const nth = (name) => {
    const m = name.match(/^(.*?)\s+(\d+)$/);
    if (!m) return null;
    const base = lc(camel(m[1]));
    const arr = (c?.props ?? []).find((p) => p.kind === "SKIP" && (lc(p.name) === base + "s" || lc(p.name) === base + "items" || lc(p.name).startsWith(base)));
    return arr ? `${use(arr)}[${m[2] - 1}]` : null;
  };
  const HTML_STATE = { disabled: "disabled", readonly: "readOnly", required: "required", checked: "checked", invalid: "aria-invalid", error: "aria-invalid", on: "checked", off: "checked={false}" };
  for (const [name, t, opt] of f.p) {
    const key = camel(name);
    if (t === "T") {
      if (has(name)) rows.push([name, use(has(name))]);
      /* children is rarely in the manifest (it is React's own prop, filtered with the inherited ones), so a label-like text is children unless a prop claims it */
      else if (["label", "text", "content", "words", "body", "panel"].includes(lc(name))) rows.push([name, "children"]);
      else if (cp.has("text") && lc(name) === "quote") rows.push([name, use(cp.get("text"))]);
      else rows.push([name, nth(name) ?? (part ? `${kitName.split("/")[0]} data` : null)]);
    } else if (t === "B") {
      if (/^Show /.test(name)) {
        const rest = name.slice(5);
        const target = has(rest);
        rows.push([name, target ? (target.kind === "BOOLEAN" ? use(target) : `${use(target)} (omit it to hide)`) : has(name) ? use(has(name)) : /\d$/.test(rest) ? "how many items you pass" : part ? `${kitName.split("/")[0]} data` : null]);
      } else rows.push([name, has(name) ? use(has(name)) : part ? `${kitName.split("/")[0]} data` : null]);
    } else if (t === "I") {
      const p = has(name);
      rows.push([name, p ? `${use(p)}={<Icon name="…" />}` : null]);
    } else if (t === "V") {
      if (lc(name) === "state") {
        const parts = [];
        for (const v of opt) {
          const b = has(v) ?? (["error", "invalid"].includes(lc(v)) ? cp.get("invalid") ?? cp.get("error") : null);
          if (STATE_CSS.has(lc(v))) parts.push(`${v}: CSS`);
          else if (b) parts.push(`${v}: ${use(b)}`);
          else if (HTML_STATE[lc(v)]) parts.push(`${v}: ${HTML_STATE[lc(v)]}`);
          else parts.push(`${v}: runtime, not a prop`);
        }
        rows.push([name, parts.join(", ")]);
        continue;
      }
      if (lc(name) === "container") { rows.push([name, "the box it sits in (a container query), not a prop"]); continue; }
      if (lc(name) === "open") {
        const o = cp.get("initialopen") ?? cp.get("open") ?? cp.get("defaultopen") ?? (c?.props ?? []).find((p) => /InitialOpen$/.test(p.name));
        rows.push([name, o ? `${use(o)} (true/false)` : "user state (a click), not a prop"]); continue;
      }
      const p = has(name);
      const yesNo = opt.length === 2 && opt.every((v) => /^(true|false|yes|no|on|off)$/i.test(v));
      if (p && p.kind === "BOOLEAN") { rows.push([name, `${use(p)} (true/false)`]); continue; }
      if (!p && yesNo && part) { rows.push([name, `${kitName.split("/")[0]} data`]); continue; }
      if (p && p.kind === "VARIANT") {
        use(p);
        const co = (p.options ?? []).map(lc), fo = opt.map(lc);
        const fOnly = opt.filter((v) => !co.includes(lc(v)) && !(lc(v) === "default" || lc(v) === "none"));
        const cOnly = (p.options ?? []).filter((v) => !fo.includes(lc(v)));
        const caseDiff = opt.some((v) => co.includes(lc(v)) && !(p.options ?? []).includes(v));
        rows.push([name, p.name + (caseDiff ? " (lower case)" : "") + (fOnly.length ? `; Figma only: ${fOnly.join(", ")}` : "") + (cOnly.length ? `; code also: ${cOnly.join(", ")}` : "")]);
      } else if (p && p.kind === "BOOLEAN") rows.push([name, `${use(p)} (true/false)`]);
      else if (p) rows.push([name, use(p)]);
      else rows.push([name, null]);
    }
  }
  const codeOnly = (c?.props ?? []).filter((p) => !used.has(lc(p.name)) && ["VARIANT", "BOOLEAN"].includes(p.kind) && !NONVISUAL.test(p.name)).map((p) => p.name);
  return { figma: f.name, node, code: c?.name ?? null, file: c?.file ?? keys.sources?.[kitName] ?? null, exposed: f.x, map: rows, codeOnly };
}

const out = { note: "Generated by tools/figma-propmap.mjs from figma/props.json and the code. Do not edit.", components: {} };
const seen = new Set();
for (const [kitName, node] of Object.entries(keys.components)) {
  /* Two kit names on one node (ContactCta draws with Button's): the first owns it. */
  if (seen.has(node)) continue;
  seen.add(node);
  const m = mapComponent(kitName, node);
  if (m) out.components[kitName] = m;
}
/* Imported by tools/contracts.mjs, which writes each component's map into its contract. */
export const propmap = out.components;
export { manifest, codeFor };
const MAIN = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
/* Since the contracts (2026-11-27) the map lives in each contracts/<Name>.contract.json
   and this file is a library. Run directly, it prints the map for a look. */
if (MAIN) {
  const all = Object.values(out.components), gaps = all.flatMap((c) => c.map.filter(([, v]) => v === null).map(([n]) => c.figma + "." + n));
  if (process.argv.includes("--print")) console.log(JSON.stringify(out, null, 1));
  console.log(`figma prop map: ${all.length} Figma components; ${gaps.length} properties with no code prop (written into the contracts by tools/contracts.mjs)`);
}
