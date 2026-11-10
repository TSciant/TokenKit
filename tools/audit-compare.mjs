#!/usr/bin/env node
/**
 * Audit compare: an audit's before and after, from two site-quality runs on the same plan. It shows per page each
 * Lighthouse category, axe issues (light, dark, desktop and phone together), reflow at 320px, text at 200% and keyboard
 * stops without a visible focus, each as before → after, and what moved.
 *
 *   node tools/site-quality.mjs --dir <dir> --file quality-after.json        the re-check, once the fixes are live
 *   node tools/audit-compare.mjs --dir <dir> [--before quality.json] [--after quality-after.json]
 *
 * Writes <dir>/compare.md and compare.json, and prints the summary.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const dir = resolve(process.cwd(), arg("--dir", "."));
const A = JSON.parse(readFileSync(resolve(dir, arg("--before", "quality.json")), "utf8"));
const B = JSON.parse(readFileSync(resolve(dir, arg("--after", "quality-after.json")), "utf8"));
const CATS = [["performance", "Perf"], ["accessibility", "A11y"], ["best-practices", "Best"], ["seo", "SEO"]];
const axeN = (p) => Object.values(p?.axe ?? {}).reduce((n, v) => n + v.length, 0);
const unseen = (p) => p?.keyboard?.noVisibleFocus?.length ?? 0;
const path = (u) => u.replace(/^https?:\/\/[^/]+/, "") || "/";
const arrow = (a, b, better = "up") => (a === b ? `${a}` : `${a} → **${b}**${(better === "up" ? b > a : b < a) ? "" : " ▼"}`);

const rows = [], moved = [];
for (const after of B.pages) {
  const before = A.pages.find((p) => p.url === after.url);
  if (!before) continue;
  const r = { page: path(after.url), type: after.type };
  for (const [k, l] of CATS) { r[l] = [before.scores[k], after.scores[k]]; if (before.scores[k] !== after.scores[k]) moved.push(`${r.page} ${l} ${before.scores[k]} → ${after.scores[k]}`); }
  r.axe = [axeN(before), axeN(after)]; r.reflow = [before.reflow320, after.reflow320]; r.text = [before.text200, after.text200]; r.focus = [unseen(before), unseen(after)];
  r.fixedAxe = Object.values(before.axe).flat().map((v) => v.id).filter((id) => !Object.values(after.axe).flat().some((v) => v.id === id));
  r.newAxe = Object.values(after.axe).flat().map((v) => v.id).filter((id) => !Object.values(before.axe).flat().some((v) => v.id === id));
  rows.push(r);
}
const tot = (f) => rows.reduce((n, r) => n + f(r), 0);
const count = (f) => rows.filter(f).length;
const summary = {
  pages: rows.length,
  axe: [tot((r) => r.axe[0]), tot((r) => r.axe[1])],
  axeClean: [count((r) => r.axe[0] === 0), count((r) => r.axe[1] === 0)],
  a11y100: [count((r) => r.A11y[0] === 100), count((r) => r.A11y[1] === 100)],
  perf90: [count((r) => r.Perf[0] >= 90), count((r) => r.Perf[1] >= 90)],
  reflowOk: [count((r) => !r.reflow[0]), count((r) => !r.reflow[1])],
};
const yn = (v) => (v ? "sideways" : "ok");
const md = [
  "# Before and after",
  "",
  `**Before:** ${A.measured}. **After:** ${B.measured}. Both runs: ${B.how}`,
  "",
  `- **axe issues:** ${summary.axe[0]} → **${summary.axe[1]}**. Pages with none: ${summary.axeClean[0]} → **${summary.axeClean[1]}** of ${rows.length}.`,
  `- **Lighthouse accessibility 100:** ${summary.a11y100[0]} → **${summary.a11y100[1]}** of ${rows.length}.`,
  `- **Lighthouse performance 90+ (phone):** ${summary.perf90[0]} → **${summary.perf90[1]}** of ${rows.length}. Lighthouse moves a few points between runs, so read a change under 5 as noise.`,
  `- **No sideways scroll at 320px:** ${summary.reflowOk[0]} → **${summary.reflowOk[1]}** of ${rows.length}.`,
  "",
  "| Page | Perf | A11y | Best | SEO | axe | 320px | Unseen focus |",
  "|---|---|---|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.page} | ${arrow(...r.Perf)} | ${arrow(...r.A11y)} | ${arrow(...r.Best)} | ${arrow(...r.SEO)} | ${arrow(...r.axe, "down")} | ${r.reflow[0] === r.reflow[1] ? yn(r.reflow[1]) : `${yn(r.reflow[0])} → **${yn(r.reflow[1])}**`} | ${arrow(...r.focus, "down")} |`),
  "",
  "## axe, by rule",
  "",
  ...rows.filter((r) => r.fixedAxe.length || r.newAxe.length).map((r) => `- **${r.page}:** ${r.fixedAxe.length ? `gone: ${[...new Set(r.fixedAxe)].join(", ")}` : ""}${r.fixedAxe.length && r.newAxe.length ? "; " : ""}${r.newAxe.length ? `new: ${[...new Set(r.newAxe)].join(", ")}` : ""}`),
  "",
].join("\n");
writeFileSync(resolve(dir, "compare.md"), md);
writeFileSync(resolve(dir, "compare.json"), JSON.stringify({ before: A.measured, after: B.measured, summary, rows }, null, 2) + "\n");
console.log(md.split("\n").slice(0, 8).join("\n"));
console.log(`\nWrote ${resolve(dir, "compare.md")}`);
