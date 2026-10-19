/**
 * Which stories a change can reach, for the fast tier of `npm run check`.
 *
 *   a source file      every story that imports it, directly or through others
 *   a component sheet  every source that writes one of its data-tk names, and
 *                      so every story that renders those
 *   anything global    the tokens, the reset, a pack, a shell, Storybook's own
 *                      config, the gates' runner: one story from every stories
 *                      file, a sample that touches each component once
 *   anything else      docs, Figma records, other tools: no stories
 *
 * The full pass every evening still opens every story; this only decides what
 * is worth opening before a commit.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join, relative } from "node:path";

const norm = (p) => p.replaceAll("\\", "/");

/** Files changed against HEAD, staged or not, and new files git is not ignoring. */
export function changedFiles(root, { staged = false } = {}) {
  const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
  if (staged) return git("diff", "--cached", "--name-only", "--diff-filter=ACMR");
  return [...new Set([...git("diff", "--name-only", "HEAD"), ...git("ls-files", "-o", "--exclude-standard")])];
}

const GLOBAL = [
  /^src\/css\/(?!components\/)/, // tokens, reset, layers, packs, shells, fonts
  /^\.storybook\//,
  /^tools\/lib\/stories\.mjs$/,
  /^tools\/(browser-gates|a11y-gate|attribute-gate|radius-gate|reflow-gate|forced-colors-gate|motion-gate|controls-gate|titles-gate|property-gate)\.mjs$/,
  /^tools\/css-vocabulary\.mjs$/,
  /^package(-lock)?\.json$/,
];

/* src/css/index.css changed only by component imports added or removed (a new component's): not a global change,
   but a change to those sheets. Returns the sheets, or null when anything else in it changed. */
function importsOnly(root, staged) {
  let diff;
  try {
    diff = execFileSync("git", ["diff", ...(staged ? ["--cached"] : ["HEAD"]), "-U0", "--", "src/css/index.css"], { cwd: root, encoding: "utf8" });
  } catch { return null; }
  const lines = diff.split("\n").filter((l) => /^[+-](?![+-])/.test(l));
  const sheets = lines.map((l) => l.match(/^[+-]@import url\("\.\/(components\/[^"]+\.css)"\);\s*$/)?.[1]);
  return lines.length && sheets.every(Boolean) ? sheets.map((s) => `src/css/${s}`) : null;
}

export function affectedStories(root, files, entries, { staged = false } = {}) {
  const stories = entries.filter((e) => e.type === "story");
  if (files.includes("src/css/index.css")) {
    const sheets = importsOnly(root, staged);
    if (sheets) files = [...files.filter((f) => f !== "src/css/index.css"), ...sheets];
  }
  const byFile = new Map();
  for (const s of stories) {
    const f = norm(s.importPath.replace(/^\.\//, ""));
    if (!byFile.has(f)) byFile.set(f, []);
    byFile.get(f).push(s.id);
  }

  if (files.some((f) => GLOBAL.some((re) => re.test(f)))) {
    return { ids: new Set([...byFile.values()].map((ids) => ids[0])), broad: true };
  }

  /* Every source under src and who imports it. */
  const sources = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "src"], { cwd: root, encoding: "utf8" })
    .split("\n").filter((f) => /\.(tsx?|mjs)$/.test(f) && existsSync(join(root, f)));
  const importers = new Map(); // file -> Set(files importing it)
  const text = new Map();
  const resolveImport = (from, spec) => {
    const base = resolve(root, dirname(from), spec);
    for (const ext of ["", ".tsx", ".ts", ".mjs", "/index.ts", "/index.tsx"]) {
      const p = base + ext;
      if (existsSync(p) && statSync(p).isFile()) return norm(relative(root, p));
    }
    return null;
  };
  for (const f of sources) {
    const src = readFileSync(join(root, f), "utf8");
    text.set(f, src);
    for (const [, spec] of src.matchAll(/(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g)) {
      const to = resolveImport(f, spec);
      if (!to) continue;
      if (!importers.has(to)) importers.set(to, new Set());
      importers.get(to).add(f);
    }
  }

  /* Starting points: the changed sources, and for a changed component sheet, the sources writing its names. */
  const start = new Set(files.filter((f) => text.has(f)));
  for (const f of files.filter((f) => /^src\/css\/components\/.+\.css$/.test(f) && existsSync(join(root, f)))) {
    const names = new Set([...readFileSync(join(root, f), "utf8").matchAll(/data-tk="([a-z0-9-]+)"/g)].map((m) => m[1]));
    for (const [src, body] of text) {
      for (const n of names) if (body.includes(`"${n}"`)) { start.add(src); break; }
    }
  }

  const reached = new Set();
  const queue = [...start];
  while (queue.length) {
    const f = queue.pop();
    if (reached.has(f)) continue;
    reached.add(f);
    for (const by of importers.get(f) ?? []) queue.push(by);
  }

  const ids = new Set();
  for (const f of reached) for (const id of byFile.get(f) ?? []) ids.add(id);
  return { ids, broad: false };
}
