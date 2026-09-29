#!/usr/bin/env node
/**
 * Figma manifest — every exported component's props, read from the TypeScript
 * source with the compiler, mapped to the Figma property type it becomes.
 *
 *   union of string literals  -> VARIANT   (one option per literal)
 *   boolean                   -> BOOLEAN
 *   string / number           -> TEXT
 *   ReactNode / element       -> SLOT      (instance swap or nested content)
 *   anything else             -> SKIP      (callbacks, refs, objects, arrays)
 *
 * The source of truth stays the code. The manifest is what a Figma build reads,
 * so a component's variant axes cannot drift from its props.
 *
 *   node tools/figma-manifest.mjs            -> node_modules/.cache/tokenkit/figma-components.json
 *
 * Not written under dist/: that folder is what `npm run deploy` uploads to the public
 * site, and a scratch file there would ship with it.
 *   node tools/figma-manifest.mjs --stdout
 */
import ts from "typescript";
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = [
  ["primitive", "src/react/primitives"],
  ["pattern", "src/react/patterns"],
];

const files = [];
for (const [layer, dir] of DIRS) {
  for (const f of readdirSync(join(ROOT, dir))) {
    if (/\.tsx$/.test(f) && !/\.stories\./.test(f) && f !== "MapLazy.tsx") files.push([layer, join(ROOT, dir, f)]);
  }
}

const program = ts.createProgram(files.map(([, f]) => f), {
  jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true, noEmit: true, allowJs: false,
});
const checker = program.getTypeChecker();

const kindOf = (type) => {
  const s = checker.typeToString(type);
  const nn = type.isUnion() ? type.types.filter((t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))) : [type];
  if (nn.length && nn.every((t) => t.isStringLiteral())) return { kind: "VARIANT", options: nn.map((t) => t.value) };
  if (nn.length > 1 && nn.every((t) => t.isNumberLiteral())) return { kind: "VARIANT", options: nn.map((t) => String(t.value)), numeric: true };
  if (nn.length && nn.every((t) => t.flags & ts.TypeFlags.BooleanLiteral)) return { kind: "BOOLEAN" };
  if (nn.length === 1 && nn[0].flags & ts.TypeFlags.String) return { kind: "TEXT" };
  if (nn.length === 1 && nn[0].flags & ts.TypeFlags.Number) return { kind: "TEXT", numeric: true };
  if (/ReactNode|ReactElement|JSX\.Element/.test(s)) return { kind: "SLOT" };
  return { kind: "SKIP", type: s.slice(0, 60) };
};

const defaultsOf = (fn) => {
  const out = {};
  const p = fn.parameters?.[0];
  if (p && ts.isObjectBindingPattern(p.name))
    for (const el of p.name.elements)
      if (el.initializer && ts.isIdentifier(el.name)) out[el.propertyName?.getText() ?? el.name.text] = el.initializer.getText().replace(/\s+/g, " ").slice(0, 60);
  return out;
};

const jsdoc = (node) => {
  const d = ts.getJSDocCommentsAndTags(node).find(ts.isJSDoc);
  return d ? ts.getTextOfJSDocComment(d.comment)?.replace(/\s+/g, " ").slice(0, 200) ?? "" : "";
};

const components = [];
for (const [layer, file] of files) {
  const sf = program.getSourceFile(file);
  ts.forEachChild(sf, (node) => {
    if (!ts.isFunctionDeclaration(node) || !node.name || !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return;
    if (!/^[A-Z]/.test(node.name.text)) return;
    const param = node.parameters[0];
    const props = [];
    if (param) {
      const type = checker.getTypeAtLocation(param);
      const defaults = defaultsOf(node);
      for (const sym of type.getProperties()) {
        const decl = sym.valueDeclaration ?? sym.declarations?.[0];
        if (decl && /node_modules|lib\.dom|@types\/react/.test(decl.getSourceFile().fileName)) continue; // inherited HTML attrs
        const t = checker.getTypeOfSymbolAtLocation(sym, node);
        props.push({ name: sym.name, optional: !!(sym.flags & ts.SymbolFlags.Optional), default: defaults[sym.name] ?? null, ...kindOf(t), doc: decl ? jsdoc(decl) : "" });
      }
    }
    components.push({ name: node.name.text, layer, file: relative(ROOT, file).split("\\").join("/"), doc: jsdoc(node), props });
  });
}

const manifest = { generated: new Date().toISOString(), count: components.length, components };
if (process.argv.includes("--stdout")) console.log(JSON.stringify(manifest, null, 1));
else {
  mkdirSync(join(ROOT, "node_modules/.cache/tokenkit"), { recursive: true });
  writeFileSync(join(ROOT, "node_modules/.cache/tokenkit/figma-components.json"), JSON.stringify(manifest, null, 1));
  const tally = {};
  for (const c of components) for (const p of c.props) tally[p.kind] = (tally[p.kind] || 0) + 1;
  console.log(`figma manifest — ${components.length} components, props: ${JSON.stringify(tally)}`);
  for (const c of components) console.log(`  ${c.layer.padEnd(9)} ${c.name.padEnd(18)} ${c.props.map((p) => p.name + ":" + p.kind[0]).join(" ")}`);
}
