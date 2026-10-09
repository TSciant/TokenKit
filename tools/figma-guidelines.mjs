#!/usr/bin/env node
/**
 * Write the Figma library's guidelines: one Markdown file for Figma's "Manage
 * library guidelines", the context its agent reads before it uses the kit's
 * library. Figma asks for what the assets alone don't say: anti-patterns and
 * practice. The kit already says those things, in four places, so this file
 * is generated from them and never written by hand:
 *
 *   docs/02-04            the token contract, composition, accessibility
 *   src/scene/vocabulary  each component's properties and their allowed values
 *   component sources     each component's own description (its doc comment)
 *   stories               every Do and Don't, with the reason it gives
 *
 *   npm run figma:guidelines           -> figma/guidelines.md
 *   npm run figma:guidelines -- --check   fail if the file is out of date
 *
 * Figma recommends under 100 KB in total; this stops at 90.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "figma", "guidelines.md");
const LIMIT = 90 * 1024;
const read = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

const meta = JSON.parse(read("figma/meta.json"));
const tokens = JSON.parse(read("figma/tokens.json"));
const { KINDS } = await import(pathToFileURL(join(ROOT, "src/scene/vocabulary.mjs")).href);
const pkg = JSON.parse(read("package.json"));
const stories = execFileSync("git", ["ls-files", "src/*.stories.tsx", "src/**/*.stories.tsx"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

/* ---- small readers ------------------------------------------------------- */

const decode = (s) =>
  s
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;|&apos;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* Every <Guidance tone="do|dont" note="…"> in a file: the note is the reason. */
function guidanceIn(file) {
  const src = read(file);
  const out = [];
  for (const m of src.matchAll(/<Guidance\s+tone="(do|dont)"\s+note=(?:"([^"]*)"|\{\s*"([^"]*)"\s*\}|\{`([^`]*)`\})/g)) {
    const note = decode(m[2] ?? m[3] ?? m[4] ?? "");
    if (note) out.push({ tone: m[1], note });
  }
  return out;
}

/* A component's own description: the doc comment just above its export. */
function describe(source, name) {
  if (!source || !existsSync(join(ROOT, source))) return "";
  const src = read(source);
  const at = src.search(new RegExp(`export\\s+(?:default\\s+)?(?:function|const)\\s+${name.split("/").pop()}\\b`));
  if (at < 0) return "";
  const before = src.slice(0, at);
  const open = before.lastIndexOf("/**");
  const close = before.lastIndexOf("*/");
  if (open < 0 || close < open || before.slice(close + 2).trim()) return "";
  const lines = before
    .slice(open + 3, close)
    .split("\n")
    .map((l) => l.replace(/^\s*\* ?/, ""));
  /* The first two paragraphs: what it is and when. The rest is implementation. */
  const paras = lines.join("\n").trim().split(/\n\s*\n/).slice(0, 2);
  return paras.map((p) => p.replace(/\s*\n\s*/g, " ").trim()).join("\n\n");
}

const kindFor = (name) => Object.values(KINDS).find((k) => k.name === name);
const propsLine = (kind) =>
  Object.entries(kind?.props ?? {})
    .map(([p, v]) => `\`${p}\`: ${Array.isArray(v) ? v.map((x) => `\`${x}\``).join(" · ") : v}`)
    .join("; ");

/* Doc files, without their first heading (the section supplies one). */
const doc = (p) => read(p).replace(/^# .*\n+/, "").trim();
const demote = (md) => md.replace(/^(#+) /gm, "$1## ");

/* ---- the file ------------------------------------------------------------ */

const modes = (c) => Object.keys(Object.values(tokens[c])[0]);
const packs = modes("tk").filter((m) => !m.endsWith("-inverse"));
const out = [];

out.push(`# token-kit: library guidelines

token-kit ${pkg.version}. A token-driven design system: components draw only from
variables, so a brand, a density or dark mode is a change of variable mode,
never a change to a component. Generated from the kit's own documentation,
stories and component sources; the code is the original and Storybook shows
every component live.

## The rules that matter most

1. **Variables only.** Every fill, stroke, radius, gap, padding and text style
   comes from a variable in \`tk\`, \`tk-density\` or \`tk-type\`. A raw hex,
   a raw number or a local style is the one thing a pack, a density or dark
   mode cannot reach, so it is always wrong, even when it matches today.
2. **Grayscale first.** The \`wireframe\` and \`wireframe-dark\` modes are the
   working state. Structure and hierarchy have to read in gray before any
   brand is applied; colour reinforces meaning and never carries it alone.
3. **Change modes, not components.** Brand: the \`tk\` collection's mode
   (${packs.map((p) => `\`${p}\``).join(", ")}). Density: \`tk-density\`
   (${modes("tk-density").slice(0, 3).map((p) => `\`${p}\``).join(", ")}). Never
   detach an instance to restyle it.
4. **Use the component, then its properties.** Reach for a variant or property
   before an override, and an override before a detach. A need no property
   covers is a gap in the kit worth reporting, not a one-off.
5. **Concentric radii.** A nested surface's radius is its parent's minus the
   gap between them, never larger; no more than three levels deep.
6. **Layout is shells.** Arrange with the seven layout shells (stack, row,
   inline, grid, split, sidebar, center) and their gap scale, not with
   absolute positioning or hand-set spacing.
7. **Words carry meaning.** A status says its state in words, an icon-only
   control has a name, and Do/Don't is marked by text and shape before colour.
8. **Nothing moves on its own.** No entrance animations or scroll reveals;
   motion answers an action, from the kit's motion slots only.
9. **Accessible by default.** Text contrast 4.5:1 (3:1 for large text and
   control boundaries), targets at least 24 px square,
   a visible focus ring, and layouts that reflow to 320 px wide.
`);

out.push(`## Tokens\n\n${demote(doc("docs/02-token-contract.md"))}\n`);
out.push(`## Composition\n\n${demote(doc("docs/03-composition.md"))}\n`);
out.push(`## Accessibility\n\n${demote(doc("docs/04-accessibility.md"))}\n`);

/* Foundation guidance: the Using … stories. */
const foundation = stories.filter((f) => /\/Using[A-Z]/.test(f));
const foundationOut = [];
for (const f of foundation) {
  const g = guidanceIn(f);
  if (!g.length) continue;
  const title = basename(f, ".stories.tsx").replace(/^Using/, "Using ").replace(/([a-z])([A-Z])/g, "$1 $2");
  foundationOut.push(`### ${title}\n\n${g.map((x) => `- **${x.tone === "do" ? "Do" : "Don't"}:** ${x.note}`).join("\n")}\n`);
}
if (foundationOut.length) out.push(`## Practice\n\n${foundationOut.join("\n")}`);

/* Components, in the order the Figma file builds them. */
const comps = [];
for (const [name, m] of Object.entries(meta.components)) {
  if (name.includes("/")) continue; // sub-components are covered by their parent
  const about = describe(m.source, name);
  const kind = kindFor(name);
  const storyFile = m.source?.replace(/\.tsx$/, ".stories.tsx");
  const g = storyFile && stories.includes(storyFile) ? guidanceIn(storyFile) : [];
  const parts = [`### ${name}`, ""];
  if (about) parts.push(about, "");
  if (kind?.about) parts.push(`*Use for:* ${kind.about}.`, "");
  const pl = propsLine(kind);
  if (pl) parts.push(`*Properties:* ${pl}.`, "");
  for (const x of g) parts.push(`- **${x.tone === "do" ? "Do" : "Don't"}:** ${x.note}`);
  if (g.length) parts.push("");
  parts.push(`Figma: node \`${m.node}\`.`, "");
  comps.push(parts.join("\n"));
}
out.push(`## Components\n\n${comps.join("\n")}`);

let text = out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
const size = Buffer.byteLength(text);
if (size > LIMIT) {
  console.error(`figma/guidelines.md would be ${(size / 1024).toFixed(1)} KB, over the ${LIMIT / 1024} KB budget. Trim before uploading.`);
  process.exit(1);
}

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== text) {
    console.error("figma/guidelines.md is out of date: npm run figma:guidelines");
    process.exit(1);
  }
  console.log(`figma/guidelines.md is current (${(size / 1024).toFixed(1)} KB).`);
} else {
  writeFileSync(OUT, text);
  const panels = (text.match(/\*\*(Do|Don't):\*\*/g) ?? []).length;
  console.log(`figma/guidelines.md: ${(size / 1024).toFixed(1)} KB, ${comps.length} components, ${panels} Do/Don't notes. Upload it in Figma: Libraries > token-kit > Manage library guidelines.`);
}
