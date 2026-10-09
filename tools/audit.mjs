#!/usr/bin/env node
/**
 * Audit — turn inventory.json into a component audit you can argue from.
 *
 * The output is deliberately a draft with open questions in it, not a verdict.
 * The numbers are measured; the component boundaries are a judgement call that
 * belongs to a person. What this removes is the part where the judgement call
 * is made from memory of a few screenshots.
 *
 *   node tools/audit.mjs --slug acme
 *   node tools/audit.mjs --out ../acme-site/audit   (where capture --out wrote)
 *
 * Writes audits/<slug>/audit.md
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const argv = process.argv.slice(2);
const slug = argv[argv.indexOf("--slug") + 1] || "audit";
/* --out: the folder capture wrote to, when it was not audits/<slug>. */
const outArg = argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : null;
const dir = outArg ? resolve(process.cwd(), outArg) : resolve(ROOT, "audits", slug);

const site = JSON.parse(await readFile(resolve(dir, "inventory.json"), "utf8"));

const table = (rows, headers) =>
  [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

const px = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/* Distinct values are the headline number. A site using 23 font sizes does not
   have a type scale; it has 23 decisions nobody made on purpose. */
const counts = Object.fromEntries(
  Object.entries(site.styles).map(([k, v]) => [k, v.length]),
);

const sizes = (site.styles.fontSize || [])
  .map((r) => ({ ...r, n: px(r.value) }))
  .filter((r) => r.n)
  .sort((a, b) => a.n - b.n);

const spacing = [
  ...(site.styles.paddingTop || []),
  ...(site.styles.paddingLeft || []),
  ...(site.styles.marginBottom || []),
  ...(site.styles.gap || []),
]
  .map((r) => px(r.value))
  .filter((n) => n && n > 0);

const uniqueSpacing = [...new Set(spacing)].sort((a, b) => a - b);
const offGrid = uniqueSpacing.filter((n) => n % 4 !== 0);

const headingIssues = site.pages.flatMap((p) =>
  (p.inventory?.headingOrderIssues || []).map((i) => `${p.slug}: ${i}`),
);

const missingAlt = site.pages.reduce(
  (a, p) => a + (p.inventory?.imagesMissingAlt || 0),
  0,
);
const totalImages = site.pages.reduce(
  (a, p) => a + (p.inventory?.imageCount || 0),
  0,
);

const noLang = site.pages.filter((p) => p.inventory && !p.inventory.lang);

const md = `# Component audit — ${slug}

Generated ${new Date(site.generatedAt).toISOString().slice(0, 10)} from ${site.pageCount} pages.
Measured with \`tools/capture.mjs\`; the component boundaries below are proposals, not findings.

## What the site is made of

${table(
  [
    ["Type sizes in use", counts.fontSize ?? 0],
    ["Font families", counts.fontFamily ?? 0],
    ["Font weights", counts.fontWeight ?? 0],
    ["Text colours", counts.color ?? 0],
    ["Background colours", counts.backgroundColor ?? 0],
    ["Border colours", counts.borderColor ?? 0],
    ["Corner radii", counts.borderRadius ?? 0],
    ["Distinct spacing values", uniqueSpacing.length],
    ["Spacing values off a 4px grid", offGrid.length],
  ].map(([k, v]) => [k, String(v)]),
  ["Measure", "Count"],
)}

A design system replaces most of these with a scale. The gap between the counts
above and the kit's scales is the size of the normalisation job.

### Type sizes, by frequency

${table(
  sizes.slice(0, 14).map((r) => [r.value, String(r.count)]),
  ["Size", "Elements"],
)}

### Spacing values off the 4px grid

${
  offGrid.length
    ? offGrid.slice(0, 20).map((n) => `\`${n}px\``).join(", ")
    : "None — spacing is already on a 4px grid."
}

## Recurring structures

Ranked by how many pages they appear on. Anything on three or more pages is a
component candidate; anything on one is page-specific and should stay that way.

${table(
  site.recurringStructures
    .slice(0, 24)
    .map((r) => [`\`${r.signature}\``, String(r.pages), r.pages >= 3 ? "component" : "watch"]),
  ["Structure", "Pages", "Call"],
)}

## Accessibility observations

These are measured from the live DOM and are the cheapest findings available.
They are not an audit — no keyboard pass, no screen reader pass, no contrast
pass is included here.

${table(
  [
    ["Images missing alt", `${missingAlt} of ${totalImages}`],
    ["Pages with no lang attribute", String(noLang.length)],
    ["Heading order skips", String(headingIssues.length)],
    [
      "Landmarks present",
      [...new Set(site.pages.flatMap((p) => p.inventory?.landmarks || []))].join(", ") || "none",
    ],
  ],
  ["Check", "Result"],
)}

${
  headingIssues.length
    ? `### Heading order skips\n\n${headingIssues.slice(0, 15).map((i) => `- ${i}`).join("\n")}`
    : ""
}

## Proposed component list

Fill this in from the recurring structures above. The rule for the list: each
entry should span an axis of the system — a shell, a state pattern, or a
content type — so that the set demonstrates coverage rather than taste.

${table(
  site.recurringStructures
    .filter((r) => r.pages >= 3)
    .slice(0, 25)
    .map((r, i) => [String(i + 1), "", `\`${r.signature}\``, String(r.pages)]),
  ["#", "Component name", "Derived from", "Pages"],
)}

## Open questions

- Which of the one-page structures are genuinely page-specific, and which are
  the same component with drifted markup?
- Which type sizes are intentional and which are accidents of inherited CSS?
- Does any recurring structure carry interaction the inventory cannot see
  (menus, dialogs, filters) and therefore cost more than its shape suggests?

## Pages captured

${table(
  site.pages.map((p) => [
    p.url,
    p.error ? `failed: ${p.error}` : Object.keys(p.breakpoints).join(", "),
  ]),
  ["URL", "Breakpoints"],
)}
`;

await writeFile(resolve(dir, "audit.md"), md);
console.log(`Wrote ${resolve(dir, "audit.md")}`);
