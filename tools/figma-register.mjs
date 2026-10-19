#!/usr/bin/env node
/**
 * Register a component's Figma counterpart, and measure it: one command for
 * what was five hand edits and three commands.
 *
 *   npm run figma:register -- SaveStatus --node 497:2373 --skin <png url or path> --doc "What the skin shows"
 *
 *   --story <id>       the onion story, if not <its file>--onion-skin (found in the Storybook index)
 *   --target root      photograph the story's first child, not its first [data-tk]
 *   --max-mean <n>     an accepted ceiling above 8; say why in --doc
 *   --part             a part of a set (RailNav/Item): keys.json only, no skin or onion entry
 *   --url <storybook>  the running Storybook to measure against (default: this checkout's port)
 *   --no-check         register only; measure later with onion-check
 *
 * Writes figma/keys.json (the node, the story, the source), figma/onion.json
 * (the onion case and its doc), figma/skins/<Name>/default.png and its
 * index.json (size read from the PNG). Then runs the onion check, regenerates
 * figma/meta.json and the guidelines, and says whether the mean is under the
 * ceiling. The skin is a Figma screenshot at 1x (get_screenshot on the node,
 * contentsOnly); its URL or a saved file both do.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const flag = (n) => args.includes(`--${n}`);
const BARE = ["--part", "--no-check"]; // flags that take no value
const name = args.find((a, i) => !a.startsWith("--") && !(args[i - 1]?.startsWith("--") && !BARE.includes(args[i - 1])));
const node = opt("node");
const fail = (m) => { console.error(m); process.exit(1); };
if (!name || !node || !/^\d+:\d+$/.test(node)) fail("usage: npm run figma:register -- <Name> --node <id like 497:2373> --skin <url|path> --doc \"…\" [--story id] [--target root] [--max-mean n] [--part] [--url u] [--no-check]");

const readJson = (f) => JSON.parse(readFileSync(join(ROOT, f), "utf8"));
const writeJson = (f, j) => writeFileSync(join(ROOT, f), JSON.stringify(j, null, 2) + "\n");

/* The source: its own file, or the one that exports it. */
const base = name.split("/")[0];
const source = [`src/react/primitives/${base}.tsx`, `src/react/patterns/${base}.tsx`].find((f) => existsSync(join(ROOT, f)))
  ?? fail(`No source for ${base} in src/react/primitives or src/react/patterns.`);

/* The onion story: given, or <the stories file>--onion-skin from the last Storybook build's index. */
let story = opt("story");
if (!story) {
  const index = join(ROOT, "storybook-static/index.json");
  if (!existsSync(index)) fail("No storybook-static/index.json to find the onion story in: npm run build-storybook, or pass --story.");
  const storiesFile = `./${source.replace(/\.tsx$/, ".stories.tsx")}`;
  const hit = Object.values(JSON.parse(readFileSync(index, "utf8")).entries)
    .find((e) => e.type === "story" && e.importPath === storiesFile && /--onion-skin$/.test(e.id));
  story = hit?.id ?? fail(`No onion story in ${storiesFile} (an export named OnionSkin). Add one, rebuild, or pass --story.`);
}

const keys = readJson("figma/keys.json");
keys.components[name] = node;
keys.stories[name] = story;
keys.sources[name] = source;
writeJson("figma/keys.json", keys);
if (flag("part")) { console.log(`Registered part ${name} (${node}), keyed to ${story}.`); process.exit(0); }

/* The skin, at 1x: fetched from a screenshot URL or copied from a file. */
const skin = opt("skin") ?? fail("--skin: the Figma screenshot of the node (its URL, or a saved PNG).");
const dir = join(ROOT, "figma/skins", name);
mkdirSync(dir, { recursive: true });
const png = join(dir, "default.png");
if (/^https?:\/\//.test(skin)) {
  const res = await fetch(skin);
  if (!res.ok) fail(`The skin URL answered ${res.status}; screenshot URLs are short-lived, take a fresh one.`);
  writeFileSync(png, Buffer.from(await res.arrayBuffer()));
} else copyFileSync(resolve(skin), png);
const bytes = readFileSync(png);
if (bytes.toString("latin1", 1, 4) !== "PNG") fail(`${png} is not a PNG.`);
const w = bytes.readUInt32BE(16), h = bytes.readUInt32BE(20);
writeFileSync(join(dir, "index.json"), JSON.stringify({ component: name, node, skins: { "default.png": { w, h } } }));

const doc = opt("doc") ?? fail("--doc: what the skin shows (and, with --max-mean, why the ceiling is higher).");
const maxMean = opt("max-mean") ? Number(opt("max-mean")) : undefined;
const onion = readJson("figma/onion.json");
onion.components[name] = {
  story, pattern: ["state"], states: { default: {} }, single: true,
  ...(opt("target") === "root" ? { target: "root" } : {}),
  doc,
  ...(maxMean ? { maxMean } : {}),
};
writeJson("figma/onion.json", onion);
console.log(`Registered ${name}: node ${node}, story ${story}, skin ${w}×${h}.`);

if (flag("no-check")) process.exit(0);
const node_ = (script, ...a) => spawnSync(process.execPath, [join(ROOT, "tools", script), ...a], { cwd: ROOT, encoding: "utf8" });
const oc = node_("onion-check.mjs", name, ...(opt("url") ? ["--url", opt("url")] : []));
process.stdout.write(oc.stdout.split("\n").filter((l) => l.startsWith(`${name} /`) || /mean diff/.test(l)).join("\n") + "\n");
if (oc.status !== 0 && !oc.stdout.includes(`${name} /`)) fail(`The onion check did not run (is Storybook up?):\n${(oc.stderr || oc.stdout).trim().split("\n").slice(-4).join("\n")}`);
node_("figma-meta.mjs");
node_("figma-guidelines.mjs");
const mean = readJson("figma/checks.json").components?.[name]?.mean;
const ceiling = maxMean ?? 8;
console.log(mean == null ? "No onion mean recorded." : mean <= ceiling
  ? `Onion mean ${mean}, under its ceiling ${ceiling}. figma/meta.json and the guidelines are regenerated.`
  : `Onion mean ${mean} is OVER its ceiling ${ceiling}: fix the drawing or the code, or accept it with --max-mean and say why in --doc.`);
process.exit(mean != null && mean > ceiling ? 1 : 0);
