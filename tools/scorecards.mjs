#!/usr/bin/env node
/**
 * Scorecards: the evidence for what each contract promises
 * (docs/11-tokens-and-contracts.md, part 3). One per component,
 * scorecards/<Name>.json, generated and never edited.
 *
 * Every claim names its check, its count and its date. Nothing here says
 * "compliant": a scorecard says what was measured, what passed, what the check
 * flagged, and, in `unchecked`, what nothing has tested yet. That list is never
 * empty.
 *
 * Read from the kit's own records, all committed:
 *   audits/contrast.json        the contrast gate: every pair it measured
 *   audits/browser-gates.json   axe, reflow, forced colours, motion, controls and
 *                               the rest: which stories each opened and flagged
 *                               (written by a full npm run gates)
 *   figma/checks.json           the onion check: design against code, per skin
 *   contracts/*.contract.json   what was promised, and which decisions are open
 *
 *   node tools/scorecards.mjs            write them
 *   node tools/scorecards.mjs --check    fail if any is stale against those records
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "scorecards");
const readJson = (p) => (existsSync(join(ROOT, p)) ? JSON.parse(readFileSync(join(ROOT, p), "utf8")) : null);

const kit = readJson("package.json").version;
const contrast = readJson("audits/contrast.json");
const gates = readJson("audits/browser-gates.json");
const onion = readJson("figma/checks.json")?.components ?? {};
/* Each story's file, from the browser record (Storybook's build is not committed, so the record carries it). */
const index = gates?.files ? Object.fromEntries(Object.entries(gates.files).map(([id, importPath]) => [id, { id, importPath, type: "story" }])) : null;
const contracts = readdirSync(join(ROOT, "contracts")).filter((f) => f.endsWith(".contract.json")).map((f) => JSON.parse(readFileSync(join(ROOT, "contracts", f), "utf8")));

/* Stories belong to the components whose source file the story file sits beside. */
const storiesByFile = new Map();
if (index) for (const e of Object.values(index)) {
  if (e.type !== "story") continue;
  const src = e.importPath.replace(/^\.\//, "").replace(/\.stories\.tsx$/, ".tsx");
  (storiesByFile.get(src) ?? storiesByFile.set(src, []).get(src)).push(e.id);
  /* Pattern stories sit together as patterns/stories/NN-Name.stories.tsx: matched by name. */
  const m = e.importPath.match(/\/stories\/\d+-([\w-]+)\.stories\.tsx$/);
  if (m) { const key = "name:" + m[1].toLowerCase(); (storiesByFile.get(key) ?? storiesByFile.set(key, []).get(key)).push(e.id); }
}

const HAND_GAPS = {
  a11y: "the accessibility contract (role, keys, focus) is not written yet, so keyboard behaviour is checked only by the generic gates",
  events: "what it may report is not declared, so analytics is unchecked",
  privacy: "no privacy rule is recorded",
};
const keyboard = readJson("audits/keyboard.json");
const events = readJson("audits/events.json");

const cards = {};
for (const c of contracts) {
  const evidence = {};

  /* Contrast: the gate's pairs labelled with this component's data-tk names. */
  if (contrast) {
    const names = new Set([...c.dataTk, c.component.toLowerCase()]);
    const rows = contrast.rows.filter((r) => names.has(r.label.split("/")[0]));
    if (rows.length) {
      const worst = rows.reduce((a, r) => (r.ratio / r.required < a.ratio / a.required ? r : a));
      evidence.contrast = { source: "audits/contrast.json", checkedAt: contrast.generatedAt, cases: rows.length, failed: rows.filter((r) => !r.pass).length, closest: `${worst.ratio.toFixed(2)}:1 for ${worst.label} (${worst.context}), needs ${worst.required}:1` };
    }
  }

  /* The browser gates: this component's stories, per check. */
  const stories = storiesByFile.get(c.sources.react) ?? storiesByFile.get("name:" + c.component.toLowerCase()) ?? [];
  if (gates && stories.length) {
    const per = {};
    for (const id of stories) for (const [check, verdict] of Object.entries(gates.stories[id] ?? {})) {
      const p = (per[check] ??= { stories: 0, flagged: [] });
      p.stories++;
      if (verdict === "flagged") p.flagged.push(id);
    }
    for (const [check, p] of Object.entries(per)) evidence[check] = { source: "audits/browser-gates.json", checkedAt: gates.generatedAt, stories: p.stories, flagged: p.flagged };
  }

  /* The onion check: each Figma component that draws it. */
  const skins = c.figma.map((f) => [f.name, onion[f.name]]).filter(([, o]) => o);
  if (skins.length) evidence.onion = { source: "figma/checks.json", parts: Object.fromEntries(skins.map(([n, o]) => [n, { skins: o.skins, mean: o.mean, worst: o.worst, checkedAt: o.checkedAt }])) };

  if (c.figma.length) evidence.figma = { nodes: c.figma.map((f) => f.node), codeConnect: c.figma.every((f) => f.codeConnect), propertiesDecided: c.figma.reduce((n, f) => n + Object.keys(f.map).length + f.unpaired.length, 0) };
  evidence.tokens = { reads: c.tokens.length, source: "contracts (found in its CSS)" };

  /* Keyboard: each key its contract promises, pressed (tools/keyboard-gate.mjs). */
  const kb = keyboard?.components?.[c.component];
  if (kb) evidence.keyboard = { source: "audits/keyboard.json", checkedAt: keyboard.generatedAt, keys: kb.results.length, failed: kb.results.filter((r) => !r.pass).map((r) => `${r.key}: ${r.says}`) };

  /* Events: each tk:event its contract declares, triggered and checked against it (tools/event-gate.mjs). */
  const ev = events?.components?.[c.component];
  if (ev && ev.declared.length) evidence.events = { source: "audits/events.json", checkedAt: events.generatedAt, declared: ev.declared.length, seen: ev.seen.length, failed: ev.declared.filter((k) => !ev.seen.includes(k)) };

  const unchecked = ["screen-reader wording and reading order, heard by a person", "native platforms (no SwiftUI or Compose kit yet)"];
  for (const [k, why] of Object.entries(HAND_GAPS)) if (c[k] === null) unchecked.push(why);
  if (c.events && Object.keys(c.events).some((k) => !k.startsWith("$")) && !ev) unchecked.push("its events are declared but the event gate has not run on them");
  if (c.a11y && !kb) unchecked.push("its keyboard contract is written but the keyboard gate has not run on it");
  if (stories.length && gates && (!evidence.rtl || !evidence.expansion)) unchecked.push("right-to-left and text expansion have not run on its stories");
  if (!stories.length) unchecked.push("no story renders it, so no browser gate has opened it");
  else if (!gates) unchecked.push("the browser gates have not written their record yet");
  if (!evidence.contrast) unchecked.push("no contrast pair is labelled with its elements; its colours are checked only through the components it uses");
  if (!c.figma.length) unchecked.push("not in the Figma library");
  else if (!skins.length) unchecked.push("no onion skin: design against code not measured");
  if (!c.tokens.length) unchecked.push("its styles are not in the kit's stylesheets (a pack element or an SVG), so token use is not traced");

  cards[c.component] = {
    $comment: "Generated by tools/scorecards.mjs from the kit's own check records. Evidence, not a certificate: see `unchecked`.",
    component: c.component,
    kit,
    contract: `contracts/${c.component}.contract.json`,
    evidence,
    unchecked,
  };
}

const CHECK = process.argv.includes("--check");
mkdirSync(OUT, { recursive: true });
let stale = 0, written = 0;
for (const [name, card] of Object.entries(cards)) {
  const path = join(OUT, `${name}.json`), text = JSON.stringify(card, null, 1) + "\n";
  const now = existsSync(path) ? readFileSync(path, "utf8").replace(/\r\n/g, "\n") : null;
  if (now === text) continue;
  if (CHECK) { stale++; console.error(`stale  scorecards/${name}.json`); continue; }
  writeFileSync(path, text); written++;
}
/* The passport: contract and scorecard together, one file, for Storybook's Passport panel. */
const passport = { $comment: "Generated by tools/scorecards.mjs for the Passport panel in Storybook. Do not edit.", kit, byFile: {}, components: {} };
for (const c of contracts) {
  (passport.byFile[c.sources.react] ??= []).push(c.component);
  const card = cards[c.component];
  passport.components[c.component] = {
    about: c.about,
    layer: c.layer,
    props: Object.keys(c.props).length,
    tokens: c.tokens.length,
    figma: c.figma.map((f) => ({ name: f.name, node: f.node, codeConnect: f.codeConnect })),
    decided: { paired: Object.keys(c.decisions?.pairWith ?? {}).length, omitted: Object.keys(c.decisions?.omit ?? {}).length },
    open: ["a11y", "i18n", "events", "privacy"].filter((k) => c[k] === null),
    evidence: card.evidence,
    unchecked: card.unchecked,
  };
}
{
  const path = join(OUT, "passport.json"), text = JSON.stringify(passport) + "\n";
  const now = existsSync(path) ? readFileSync(path, "utf8").replace(/\r\n/g, "\n") : null;
  if (now !== text) { if (CHECK) { stale++; console.error("stale  scorecards/passport.json"); } else writeFileSync(path, text); }
}
for (const f of readdirSync(OUT).filter((x) => x.endsWith(".json") && x !== "passport.json" && !cards[basename(x, ".json")])) { console.error(`scorecards/${f}: no contract of that name`); stale++; }
const flaggedAny = Object.values(cards).filter((k) => Object.values(k.evidence).some((e) => e.flagged?.length || (Array.isArray(e.failed) ? e.failed.length : e.failed))).length;
if (CHECK) {
  if (stale) { console.error(`\n${stale} scorecard(s) stale: node tools/scorecards.mjs`); process.exit(1); }
  console.log(`scorecards current: ${Object.keys(cards).length}`);
} else console.log(`scorecards: ${Object.keys(cards).length} (${written} written); ${flaggedAny} with something flagged; browser record ${gates ? "from " + gates.generatedAt : "missing (run npm run gates)"}`);
