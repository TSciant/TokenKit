#!/usr/bin/env node
/**
 * Packs as JSON. A pack's source is tokens/packs/<pack>.tokens.json; its CSS
 * (src/css/packs/<pack>.css) is generated from it and never edited by hand.
 * The JSON keeps everything the CSS said: the private ramp, every tk slot in
 * every context (default, inverse, scrim, …), the paint a scoped pack needs,
 * and every comment, because the comments are where the kit explains itself
 * (contrast ratios, why a slot exists).
 *
 * The six specimen brands (tk, door-shop, mohave, bathing-bagels, wandas,
 * muncheese) sit one step further up: their JSON is written by the brand
 * table in tools/gen-specimen-packs.mjs, which also does their contrast
 * nudging, so a change to those starts in the table. Its --check fails on a
 * hand edit to their JSON or CSS.
 *
 *   node tools/tokens-pack.mjs import <pack>     CSS -> JSON, once per pack (the migration)
 *   node tools/tokens-pack.mjs build [<pack>]    JSON -> CSS (all converted packs by default)
 *   node tools/tokens-pack.mjs check             fail if a generated CSS file differs from its JSON
 *   node tools/tokens-pack.mjs same <pack>       prove the JSON's CSS declares exactly what the
 *                                                hand-written CSS did (selectors, properties,
 *                                                values, order, comments), before replacing it
 *
 * Values: a reference to another custom property is written {name}, so
 * var(--wf-100) is "{wf-100}" and var(--tk-duration-fast) is
 * "{tk-duration-fast}". Expressions keep their form with references inside:
 * "color-mix(in srgb, {wf-500} 22%, transparent)". Values are resolved to
 * literals per context by the browser export (npm run tokens), which is what
 * a platform without CSS reads. See docs/11-tokens-and-contracts.md.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const JSON_DIR = join(ROOT, "tokens", "packs");
const CSS_DIR = join(ROOT, "src", "css", "packs");
const readText = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

/* ---- CSS -> model --------------------------------------------------------- */

/* A small reader for the one shape every pack has: an optional header comment,
   then @layer tokens { rules }, each rule a selector list and a body of
   comments and declarations. Anything else is refused, not guessed at. */
export function parsePack(css) {
  let i = 0;
  const peek = (s) => css.startsWith(s, i);
  const ws = () => { const s = i; while (i < css.length && /\s/.test(css[i])) i++; return css.slice(s, i); };
  const comment = () => { const end = css.indexOf("*/", i + 2); if (end < 0) throw new Error("unclosed comment"); const c = css.slice(i + 2, end); i = end + 2; return c; };
  const blankLines = (s) => Math.max(0, (s.match(/\n/g) ?? []).length - 1);
  /* The semicolon that ends a declaration: not one inside quotes or brackets (a data: URL has its own). */
  const endOf = (from) => {
    let q = null, depth = 0;
    for (let k = from; k < css.length; k++) {
      const ch = css[k];
      if (q) { if (ch === "\\") k++; else if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") q = ch;
      else if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === ";" && depth === 0) return k;
    }
    return -1;
  };

  ws();
  /* A generated file's banner is ours, not the pack's. */
  if (peek("/* Generated from ")) { comment(); ws(); }
  let header = null;
  if (peek("/*")) { header = comment(); ws(); }
  if (!peek("@layer")) throw new Error("expected @layer at " + i);
  const nameEnd = css.indexOf("{", i);
  const layer = css.slice(i + 6, nameEnd).trim();
  i = nameEnd + 1;
  const rules = [];
  for (;;) {
    const gap = ws();
    if (rules.length && blankLines(gap)) rules.push({ gap: blankLines(gap) });
    if (peek("}")) { i++; break; }
    if (peek("/*")) { rules.push({ note: comment() }); continue; }
    const open = css.indexOf("{", i);
    const selectors = css.slice(i, open).split(",\n").map((s) => s.trim()).filter(Boolean);
    i = open + 1;
    const items = [];
    for (;;) {
      const g = ws();
      if (items.length && blankLines(g)) items.push({ gap: blankLines(g) });
      if (peek("}")) { i++; break; }
      if (peek("/*")) { items.push({ note: comment() }); continue; }
      const colon = css.indexOf(":", i), semi = endOf(colon + 1);
      if (colon < 0 || semi < 0 || colon > semi) throw new Error("bad declaration at " + css.slice(i, i + 40));
      const prop = css.slice(i, colon).trim(), value = css.slice(colon + 1, semi).trim();
      i = semi + 1;
      const item = decl(prop, value);
      /* A comment on the same line belongs to this declaration. */
      const s = i;
      while (i < css.length && (css[i] === " " || css[i] === "\t")) i++;
      if (peek("/*")) {
        item.$comment = comment();
        while (i < css.length && (css[i] === " " || css[i] === "\t")) i++;
        if (peek(";")) { i++; item.$extraSemicolon = true; }
      } else i = s;
      items.push(item);
    }
    rules.push({ selectors, context: contextOf(selectors), items });
  }
  ws();
  if (i < css.length) throw new Error("unexpected text after the layer: " + css.slice(i, i + 40));
  return { header, layer, rules };
}

const toRef = (v) => v.replace(/var\(--([\w-]+)\)/g, "{$1}");
const fromRef = (v) => v.replace(/\{([\w-]+)\}/g, "var(--$1)");

function decl(prop, value) {
  const v = toRef(value);
  if (prop.startsWith("--tk-")) return { slot: prop.slice(5), $value: v };
  if (prop.startsWith("--")) return { private: prop.slice(2), $value: v };
  return { paint: prop, $value: v };
}

/* The context a rule sets, named for people and for the native emitters later. */
function contextOf(sel) {
  const s = sel.join(" ");
  if (/data-on="scrim"/.test(s)) return "scrim";
  if (/data-on="inverse"/.test(s)) return "inverse";
  if (/:root/.test(s)) return "default";
  return "paint";
}

/* ---- model -> CSS --------------------------------------------------------- */

export function packCss(model, source) {
  const out = [];
  out.push(`/* Generated from ${source} by tools/tokens-pack.mjs. Edit the JSON, then run it. */`);
  if (model.header !== null) out.push(`/*${model.header}*/`, "");
  out.push(`@layer ${model.layer} {`);
  for (const r of model.rules) {
    if (r.gap) { out.push(...Array(r.gap).fill("")); continue; }
    if (r.note !== undefined) { out.push(`  /*${r.note}*/`); continue; }
    out.push(r.selectors.map((s, k) => `  ${s}${k < r.selectors.length - 1 ? "," : " {"}`).join("\n"));
    for (const it of r.items) {
      if (it.gap) { out.push(...Array(it.gap).fill("")); continue; }
      if (it.note !== undefined) { out.push(`    /*${it.note}*/`); continue; }
      const prop = it.slot !== undefined ? `--tk-${it.slot}` : it.private !== undefined ? `--${it.private}` : it.paint;
      out.push(`    ${prop}: ${fromRef(it.$value)};${it.$comment !== undefined ? ` /*${it.$comment}*/${it.$extraSemicolon ? ";" : ""}` : ""}`);
    }
    out.push("  }");
  }
  out.push("}");
  return out.join("\n") + "\n";
}

/* What a stylesheet declares, comments included, without its formatting. */
export function declared(model) {
  const rows = [];
  if (model.header !== null) rows.push(["header", model.header.trim()]);
  for (const r of model.rules) {
    if (r.note !== undefined) rows.push(["note", r.note.trim()]);
    if (!r.selectors) continue;
    rows.push(["rule", r.selectors.join(", ")]);
    for (const it of r.items) {
      if (it.gap) continue;
      if (it.note !== undefined) rows.push(["note", it.note.trim()]);
      else rows.push(["decl", (it.slot ?? it.private ?? it.paint) + ": " + it.$value + (it.$comment !== undefined ? " /*" + it.$comment.trim() + "*/" : "")]);
    }
  }
  return rows;
}

/* ---- JSON ----------------------------------------------------------------- */

export function toJson(pack, model) {
  return {
    $schema: "../schema/pack.schema.json",
    pack,
    $description: model.header,
    layer: model.layer,
    rules: model.rules,
  };
}
export const fromJson = (j) => ({ header: j.$description ?? null, layer: j.layer, rules: j.rules });

/* ---- sheets: token files that are not packs (the scale) -------------------- */

/* A sheet is any token stylesheet: comments, one or more @layer blocks, rules,
   and at-rules nested inside (the scale's @media for the wide gutter). The
   JSON is a tree: { note } { gap } { at: "@layer tokens", body: [...] } and
   { selectors, items } with the same items a pack has. */
export function parseSheet(css) {
  let i = 0;
  const peek = (s) => css.startsWith(s, i);
  const ws = () => { const s = i; while (i < css.length && /\s/.test(css[i])) i++; return css.slice(s, i); };
  const comment = () => { const end = css.indexOf("*/", i + 2); if (end < 0) throw new Error("unclosed comment"); const c = css.slice(i + 2, end); i = end + 2; return c; };
  const blankLines = (s) => Math.max(0, (s.match(/\n/g) ?? []).length - 1);
  const endOf = (from) => {
    let q = null, depth = 0;
    for (let k = from; k < css.length; k++) {
      const ch = css[k];
      if (q) { if (ch === "\\") k++; else if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") q = ch;
      else if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === ";" && depth === 0) return k;
    }
    return -1;
  };
  const items = () => {
    const out = [];
    for (;;) {
      const g = ws();
      if (out.length && blankLines(g)) out.push({ gap: blankLines(g) });
      if (peek("}")) { i++; return out; }
      if (peek("/*")) { out.push({ note: comment() }); continue; }
      const colon = css.indexOf(":", i), semi = endOf(colon + 1);
      if (colon < 0 || semi < 0) throw new Error("bad declaration at " + css.slice(i, i + 40));
      const rawValue = css.slice(colon + 1, semi);
      const item = decl(css.slice(i, colon).trim(), rawValue.trim());
      /* Layout kept where it isn't the plain form: a value on its own line, a comment aligned with others. */
      const lead = rawValue.match(/^\s*/)[0];
      if (lead !== " ") item.$lead = lead;
      i = semi + 1;
      const s = i;
      while (i < css.length && (css[i] === " " || css[i] === "\t")) i++;
      if (peek("/*")) { const padText = css.slice(s, i); if (padText !== " ") item.$pad = padText; item.$comment = comment(); } else i = s;
      out.push(item);
    }
  };
  const body = (top) => {
    const out = [];
    for (;;) {
      const g = ws();
      if (out.length && blankLines(g)) out.push({ gap: blankLines(g) });
      if (i >= css.length) { if (top) return out; throw new Error("unclosed block"); }
      if (peek("}")) { if (top) throw new Error("stray } at " + i); i++; return out; }
      if (peek("/*")) { out.push({ note: comment() }); continue; }
      const open = css.indexOf("{", i);
      const prelude = css.slice(i, open).trim();
      i = open + 1;
      if (prelude.startsWith("@")) out.push({ at: prelude, body: body(false) });
      else out.push({ selectors: prelude.split(",\n").map((s) => s.trim()).filter(Boolean), items: items() });
    }
  };
  ws();
  if (peek("/* Generated from ")) { comment(); ws(); }
  return body(true);
}

export function sheetCss(tree, source) {
  const out = [`/* Generated from ${source} by tools/tokens-pack.mjs. Edit the JSON, then run it. */`];
  const pad = (d) => "  ".repeat(d);
  const walk = (nodes, d) => {
    for (const n of nodes) {
      if (n.gap) out.push(...Array(n.gap).fill(""));
      else if (n.note !== undefined) out.push(`${pad(d)}/*${n.note}*/`);
      else if (n.at) { out.push(`${pad(d)}${n.at} {`); walk(n.body, d + 1); out.push(`${pad(d)}}`); }
      else {
        out.push(n.selectors.map((s, k) => `${pad(d)}${s}${k < n.selectors.length - 1 ? "," : " {"}`).join("\n"));
        for (const it of n.items) {
          if (it.gap) { out.push(...Array(it.gap).fill("")); continue; }
          if (it.note !== undefined) { out.push(`${pad(d + 1)}/*${it.note}*/`); continue; }
          const prop = it.slot !== undefined ? `--tk-${it.slot}` : it.private !== undefined ? `--${it.private}` : it.paint;
          out.push(`${pad(d + 1)}${prop}:${it.$lead ?? " "}${fromRef(it.$value)};${it.$comment !== undefined ? `${it.$pad ?? " "}/*${it.$comment}*/` : ""}`);
        }
        out.push(`${pad(d)}}`);
      }
    }
  };
  walk(tree, 0);
  return out.join("\n") + "\n";
}

const SHEET_DIR = join(ROOT, "tokens");
const sheets = () => (existsSync(SHEET_DIR) ? readdirSync(SHEET_DIR).filter((f) => f.endsWith(".tokens.json")).map((f) => join(SHEET_DIR, f)) : []);
const sheetOut = (j) => sheetCss(j.body, rel(join(SHEET_DIR, `${j.sheet}.tokens.json`)));

/* A private pack (the family's own, never in the public kit) keeps its JSON and its CSS together in private/packs. */
const PRIVATE_DIR = join(ROOT, "private", "packs");
const isPrivate = (p) => existsSync(join(PRIVATE_DIR, `${p}.tokens.json`));
const jsonPath = (p) => join(isPrivate(p) ? PRIVATE_DIR : JSON_DIR, `${p}.tokens.json`);
const cssPath = (p) => join(isPrivate(p) ? PRIVATE_DIR : CSS_DIR, `${p}.css`);
const listed = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".tokens.json")).map((f) => f.replace(".tokens.json", "")) : []);
const converted = () => [...listed(JSON_DIR), ...listed(PRIVATE_DIR)];
const rel = (p) => p.slice(ROOT.length + 1).split("\\").join("/");

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "import-sheet") {
    /* node tools/tokens-pack.mjs import-sheet scale src/css/03-scale.css */
    const [, name, file] = process.argv.slice(2);
    const css = readText(join(ROOT, file));
    const j = { $schema: "./schema/sheet.schema.json", sheet: name, css: file, body: parseSheet(css) };
    const text = sheetOut(j).replace(/^\/\* Generated from [^\n]*\n/, "");
    if (text !== css.replace(/^\/\* Generated from [^\n]*\n/, "")) { console.error(`${file}: the JSON would not regenerate it byte for byte; not written`); process.exit(1); }
    writeFileSync(join(SHEET_DIR, `${name}.tokens.json`), JSON.stringify(j, null, 1) + "\n");
    const count = (ns) => ns.reduce((n, x) => n + (x.body ? count(x.body) : x.items ? x.items.filter((y) => y.$value !== undefined).length : 0), 0);
    console.log(`tokens/${name}.tokens.json: ${count(j.body)} declarations; regenerates ${file} byte for byte`);
  } else if (cmd === "import") {
    const model = parsePack(readText(cssPath(arg)));
    mkdirSync(JSON_DIR, { recursive: true });
    writeFileSync(jsonPath(arg), JSON.stringify(toJson(arg, model), null, 1) + "\n");
    const n = model.rules.flatMap((r) => r.items ?? []).filter((x) => x.$value !== undefined).length;
    console.log(`${rel(jsonPath(arg))}: ${n} declarations in ${model.rules.filter((r) => r.selectors).length} rules`);
  } else if (cmd === "same") {
    const before = declared(parsePack(readText(cssPath(arg))));
    const j = JSON.parse(readText(jsonPath(arg)));
    const after = declared(parsePack(packCss(fromJson(j), rel(jsonPath(arg))).replace(/^\/\* Generated[^\n]*\n/, "")));
    const a = JSON.stringify(before), b = JSON.stringify(after);
    /* And the text itself: the generated file, less its banner, is the hand-written one. */
    const own = readText(cssPath(arg)).replace(/^\/\* Generated from [^\n]*\n/, "");
    const text = packCss(fromJson(j), rel(jsonPath(arg))).replace(/^\/\* Generated from [^\n]*\n/, "");
    if (text !== own) { console.error(`${arg}: the generated text differs from the CSS (declarations ${a === b ? "match" : "differ"})`); process.exit(1); }
    if (a !== b) {
      const k = before.findIndex((row, n) => JSON.stringify(row) !== JSON.stringify(after[n]));
      console.error(`${arg}: differs at row ${k}:\n  css:  ${JSON.stringify(before[k])}\n  json: ${JSON.stringify(after[k])}`);
      process.exit(1);
    }
    console.log(`${arg}: the JSON declares exactly what the CSS did (${before.filter((r) => r[0] === "decl").length} declarations, ${before.filter((r) => r[0] === "note").length} notes, same order)`);
  } else if (cmd === "build" || cmd === "check") {
    const packs = arg && cmd === "build" ? [arg] : converted();
    let bad = 0;
    for (const p of packs) {
      const css = packCss(fromJson(JSON.parse(readText(jsonPath(p)))), rel(jsonPath(p)));
      if (cmd === "build") { writeFileSync(cssPath(p), css); console.log(`${rel(cssPath(p))} generated`); }
      else if (!existsSync(cssPath(p)) || readText(cssPath(p)) !== css) { console.error(`${rel(cssPath(p))} differs from ${rel(jsonPath(p))}: edit the JSON and run node tools/tokens-pack.mjs build ${p}`); bad++; }
    }
    const sh = arg && cmd === "build" ? [] : sheets();
    for (const f of sh) {
      const j = JSON.parse(readText(f)), css = sheetOut(j), out = join(ROOT, j.css);
      if (cmd === "build") { writeFileSync(out, css); console.log(`${j.css} generated`); }
      else if (!existsSync(out) || readText(out) !== css) { console.error(`${j.css} differs from ${rel(f)}: edit the JSON and run node tools/tokens-pack.mjs build`); bad++; }
    }
    if (cmd === "check") { if (bad) process.exit(1); console.log(`generated from JSON: ${packs.length} packs, ${sh.length} sheet(s), current`); }
  } else {
    console.error("usage: node tools/tokens-pack.mjs import|build|check|same [<pack>]");
    process.exit(2);
  }
}
