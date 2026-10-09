#!/usr/bin/env node
/**
 * Generate the scene vocabulary from the components themselves.
 *
 *   node tools/gen-scene-vocabulary.mjs            write src/scene/vocabulary.mjs
 *   node tools/gen-scene-vocabulary.mjs --check    exit 1 if it is stale or unsorted
 *
 * A scene is a component described as data, and it may only say what the kit
 * can draw. The scene format used to keep its own list of kinds and options
 * beside the components, and the components moved on without it: no tone on
 * a button, no chars on a field, and a placeholder the kit had stopped
 * modelling. So the list is read now, not kept.
 *
 * src/scene/kinds.mjs says which component each kind is. This asks the
 * TypeScript checker for that component's props and sorts each one:
 *
 *   a union of string or number literals   its values
 *   boolean                                a flag
 *   string                                 text
 *   number                                 a whole number
 *   an array (of strings, of options)      a list
 *   IconName                               one of the kit's icons
 *   ReactNode                              text or an icon, if kinds.mjs says
 *                                          which; otherwise it has to be omitted
 *
 * Only props declared in this repo count; the DOM's own attributes are out
 * unless a kind includes them. A prop that is neither sorted nor omitted with
 * a reason stops the generator: a new prop is a decision, not a default.
 * The packs come from src/css/packs, so a new pack is a scene brand at once.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "src/scene/vocabulary.mjs");
const CHECK = process.argv.includes("--check");
const { KIND_MAP } = await import(pathToFileURL(resolve(ROOT, "src/scene/kinds.mjs")).href);

/* --- the program ---------------------------------------------------------- */
const files = [...new Set(Object.values(KIND_MAP).flatMap((k) => [k.from?.[0], ...Object.values(k.props ?? {}).map((p) => p[0])]).filter(Boolean))].map((f) => resolve(ROOT, f));
const program = ts.createProgram(files, {
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  esModuleInterop: true,
  resolveJsonModule: true,
  allowJs: true,
});
const checker = program.getTypeChecker();
const SRC = resolve(ROOT, "src") + sep;

function exported(file, name) {
  const sf = program.getSourceFile(resolve(ROOT, file));
  if (!sf) throw new Error(`${file}: not found`);
  const sym = checker.getExportsOfModule(checker.getSymbolAtLocation(sf)).find((s) => s.name === name);
  if (!sym) throw new Error(`${file}: no export named ${name}`);
  return { sym: sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym, sf };
}

/* The props of a component (its first parameter) or of a type. */
function propsOf(file, name) {
  const { sym, sf } = exported(file, name);
  if (sym.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)) return checker.getDeclaredTypeOfSymbol(sym);
  const type = checker.getTypeOfSymbolAtLocation(sym, sf);
  const sig = type.getCallSignatures()[0];
  if (!sig || !sig.parameters[0]) throw new Error(`${file}: ${name} takes no props`);
  return checker.getTypeOfSymbolAtLocation(sig.parameters[0], sf);
}

const own = (prop) => (prop.declarations ?? []).some((d) => resolve(d.getSourceFile().fileName).startsWith(SRC));
const docOf = (prop) => ts.displayPartsToString(prop.getDocumentationComment(checker)).trim();
const defined = (t) => (t.isUnion() ? t.types.filter((m) => !(m.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))) : [t]);

/** What a prop's type is, in scene terms, or null when a scene can't say it. */
function sort(type, prop, spec) {
  const name = prop.name;
  if (spec.values?.[name]) return spec.values[name];
  if (spec.iconProps?.includes(name)) return "icon";
  /* The checker expands IconName into its 222 names; the declaration still says IconName. */
  if (type.aliasSymbol?.name === "IconName" || prop.declarations?.some((d) => d.type?.getText() === "IconName")) return "icon";
  const members = defined(type);
  if (members.every((m) => m.flags & ts.TypeFlags.BooleanLiteral)) return "flag";
  if (members.every((m) => m.isStringLiteral() || m.isNumberLiteral())) return members.map((m) => m.value);
  if (members.length === 1 && members[0].flags & ts.TypeFlags.String) return "text";
  if (members.length === 1 && members[0].flags & ts.TypeFlags.Number) return "integer";
  if (members.length === 1 && checker.isArrayType(members[0])) return "list";
  if (spec.textProps?.includes(name)) return "text";
  return null;
}

/* --- the vocabulary --------------------------------------------------------- */
const KINDS = {};
const unsorted = [];
for (const [kind, spec] of Object.entries(KIND_MAP)) {
  const out = { name: spec.name, about: spec.about };
  if (spec.text) out.text = spec.text;
  if (spec.children) out.children = spec.children;
  if (spec.within) out.within = spec.within;
  const props = {};
  const rename = spec.rename ?? {};

  if (spec.from) {
    const type = propsOf(...spec.from);
    for (const prop of checker.getPropertiesOfType(type)) {
      const name = prop.name;
      if (name === spec.text || name === "children" && (spec.text === "children" || spec.children)) continue;
      if (spec.omit?.[name]) continue;
      if (!own(prop) && !spec.include?.includes(name)) continue;
      /* "grid only — …" in a shell prop's comment: the CSS answers it on that shell and no other. */
      const only = /^(\w+) only\b/.exec(docOf(prop))?.[1];
      if (spec.shell && only && only !== spec.shell) continue;
      const t = sort(checker.getTypeOfSymbol(prop), prop, spec);
      if (t == null) {
        unsorted.push(`${kind}.${name} (${checker.typeToString(checker.getTypeOfSymbol(prop))})`);
        continue;
      }
      props[rename[name] ?? name] = t;
    }
  }
  for (const [name, [file, typeName]] of Object.entries(spec.props ?? {})) {
    const { sym } = exported(file, typeName);
    const t = sort(checker.getDeclaredTypeOfSymbol(sym), { name }, spec);
    if (t == null) unsorted.push(`${kind}.${name} (${typeName})`);
    else props[name] = t;
  }
  /* Props a kind declares outright: the section kind's types and variants
     come from the wireframe library itself, not from a component's types. */
  for (const [name, allowed] of Object.entries(spec.fixed ?? {})) props[name] = allowed;
  for (const name of Object.keys(spec.omit ?? {})) {
    if (spec.from && !checker.getPropertiesOfType(propsOf(...spec.from)).some((p) => p.name === name)) unsorted.push(`${kind}.${name}: omitted, but ${spec.from[1]} has no such prop`);
  }
  if (Object.keys(props).length) out.props = props;
  KINDS[kind] = out;
}
if (unsorted.length) {
  console.error("Props a scene can't say yet. Sort each in src/scene/kinds.mjs (textProps, iconProps, values) or omit it with the reason:\n");
  for (const u of unsorted) console.error("  " + u);
  process.exit(1);
}

/* The packs: every stylesheet in src/css/packs, named by its header. */
const PACKS = {};
for (const f of readdirSync(resolve(ROOT, "src/css/packs")).filter((f) => f.endsWith(".css") && !f.startsWith("_")).sort()) {
  const slug = f.slice(0, -4);
  const head = readFileSync(resolve(ROOT, "src/css/packs", f), "utf8").split(/\r?\n/).find((l) => /^\s+\S/.test(l)) ?? slug;
  const named = head.trim().replace(/^Pack:\s*/, "").split(/\s+[—-]\s+/)[0].replace(/'/g, "’");
  /* A pack whose header names only its slug reads as words: wireframe-dark is "Wireframe dark". */
  PACKS[slug] = named === slug ? slug[0].toUpperCase() + slug.slice(1).replace(/-/g, " ") : named;
}

const body = `/* GENERATED by tools/gen-scene-vocabulary.mjs from src/scene/kinds.mjs and the
   components' own prop types. Do not edit: change the component or kinds.mjs
   and run the generator; \`--check\` fails when this file has drifted.

   A kind's props: an array is its allowed values; "text", "flag", "integer",
   "list" and "icon" are kinds of value. */

export const PACKS = ${JSON.stringify(PACKS, null, 2)};

export const KINDS = ${JSON.stringify(KINDS, null, 2)};
`;

const current = existsSync(OUT) ? readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
if (CHECK) {
  if (current !== body) {
    console.error(`${relative(ROOT, OUT)} is stale — run \`node tools/gen-scene-vocabulary.mjs\``);
    process.exit(1);
  }
  console.log(`scene vocabulary current — ${Object.keys(KINDS).length} kinds, ${Object.keys(PACKS).length} packs`);
} else {
  if (current !== body) writeFileSync(OUT, body);
  console.log(`${current === body ? "unchanged" : "wrote"} ${relative(ROOT, OUT)} — ${Object.keys(KINDS).length} kinds, ${Object.keys(PACKS).length} packs`);
}
