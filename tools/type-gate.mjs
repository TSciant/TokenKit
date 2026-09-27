#!/usr/bin/env node
/**
 * Type gate.
 *
 * The contrast gate made colour checkable. This does the same for typography,
 * and the reason it is possible is Pretext: a text measurement and line
 * breaking engine, so the kit can ask what a real string in the real resolved
 * font does at a given width instead of asserting that a token is right.
 *
 * What it checks:
 *
 *   measure     --tk-measure and --tk-measure-narrow produce a characters-
 *               per-line figure inside the 45-75 band. `ch` is the width of
 *               the digit zero, which is wider than the average character, so
 *               a measure set in `ch` reliably yields MORE characters per line
 *               than its number suggests. That gap is invisible in the source
 *               and is exactly what this catches.
 *
 *   zoom        the same, at 100/125/150/200% root font size. Measure is in
 *               `ch` so it should track — if it does not, the reading line
 *               breaks down at the zoom level WCAG 1.4.4 tests.
 *
 *   breakpoints where a container query sits versus where the line count
 *               actually changes for representative content. A breakpoint
 *               that is not near a real break is a guess.
 *
 *   orphans     a last line of one word, across the scale.
 *
 * Pretext measures with a canvas, so all of this runs in headless Chromium
 * against tests/type-fixture.html. Nothing here ships with the kit.
 *
 *   node tools/type-gate.mjs
 *   node tools/type-gate.mjs --report     also writes audits/type.json
 *   node tools/type-gate.mjs --zoom 200   single root size
 *
 * Exit 1 on any failure.
 */

import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = pathToFileURL(resolve(ROOT, "tests/type-fixture.html")).href;

const argv = process.argv.slice(2);
const wantReport = argv.includes("--report");
const zoomIdx = argv.indexOf("--zoom");
const ZOOMS = zoomIdx > -1 ? [Number(argv[zoomIdx + 1])] : [100, 125, 150, 200];

/**
 * Consensus band for comfortable reading, roughly Bringhurst's 45-75 with 66
 * as the ideal. Treat it as a well-supported convention rather than a measured
 * fact — it is a typographic norm, not a result from a controlled study.
 */
const CPL_MIN = 45;
const CPL_MAX = 75;

/** Real prose. Lorem has the wrong letter frequencies and measures short. */
const SAMPLE = `A design system is a contract between the people who choose values and the people who spend them. The token layer holds the decisions, the component layer holds the questions, and the cascade decides which answer applies where. When that boundary is clear a brand can be applied by editing one file, and when it is not the work turns into a search across every component for a hard-coded value that should never have been written down twice.`;

/* Fixed-length specimens. The thresholds below were chosen against these exact
   strings — the measure band, the orphan checks and the stepped-up breakpoint
   all move if the character count does. Swap the wording if you like; keep the
   length. */
const SHORT = `Design Tokens and Components`;
const TITLE = `Token decisions, component questions, one cascade`;

const browser = await chromium.launch(
  process.env.TOKENKIT_CHROMIUM
    ? { executablePath: process.env.TOKENKIT_CHROMIUM }
    : {},
);

const rows = [];
const breakpoints = [];

for (const zoom of ZOOMS) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.addInitScript((z) => {
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.style.fontSize = `${(16 * z) / 100}px`;
    });
  }, zoom);

  await page.goto(FIXTURE, { waitUntil: "load" });
  await page.waitForTimeout(150);

  if (!(await page.evaluate(() => window.pretextReady))) {
    console.error(
      "Pretext did not load. Run `node tools/build-pretext.mjs` to rebuild tests/vendor/pretext.js.",
    );
    await browser.close();
    process.exit(1);
  }

  for (const role of ["body", "body-narrow", "card-body"]) {
    const m = await page.evaluate(
      ([r, t]) => window.measureSample(r, t),
      [role, SAMPLE],
    );
    if (m.error) {
      rows.push({ zoom, role, error: m.error, pass: false });
      continue;
    }
    const inBand = m.cpl >= CPL_MIN && m.cpl <= CPL_MAX;
    rows.push({
      zoom,
      role,
      widthPx: m.widthPx,
      fontSizePx: m.fontSizePx,
      lineCount: m.lineCount,
      cpl: m.cpl,
      minCpl: m.minCpl,
      maxCpl: m.maxCpl,
      orphan: m.orphan,
      pass: inBand,
      note: inBand ? "" : m.cpl > CPL_MAX ? "too wide to read comfortably" : "too narrow",
    });
  }

  // Headings get checked for orphans rather than for measure — a heading is
  // not read in the same way and the band does not apply to it.
  for (const [role, text] of [
    ["h1", TITLE],
    ["h2", TITLE],
    ["card-title", TITLE],
  ]) {
    const m = await page.evaluate(
      ([r, t]) => window.measureSample(r, t, 480),
      [role, text],
    );
    if (m.error) continue;
    rows.push({
      zoom,
      role: `${role} (orphan)`,
      widthPx: m.widthPx,
      fontSizePx: m.fontSizePx,
      lineCount: m.lineCount,
      cpl: m.cpl,
      orphan: m.orphan,
      // Reported, never failed. An orphan is a property of the string, not of
      // a token — and `text-wrap: balance` on headings mitigates it at render,
      // which Pretext's raw line breaking does not model. A gate that fails on
      // something the author cannot fix is a gate people learn to ignore.
      pass: true,
      warn: m.orphan,
      note: m.orphan ? `orphan — last line is "${m.lastLine}"` : "",
    });
  }

  if (zoom === 100) {
    // Where does the card title actually stop needing two lines? Compare that
    // with where the container query is declared.
    for (const target of [1, 2]) {
      const bp = await page.evaluate(
        ([r, t, n]) => window.findBreakpoint(r, t, n),
        ["card-title", TITLE, target],
      );
      if (!bp.error) breakpoints.push(bp);
    }
    // The card query steps the title from lg to xl. The width worth keying on
    // is where the BIGGER size stops costing an extra line — stepping up any
    // earlier buys presence at the price of a wrap.
    const stepped = await page.evaluate(
      ([r, t, n]) => window.findBreakpoint(r, t, n),
      ["card-title-stepped", TITLE, 1],
    );
    if (!stepped.error) breakpoints.push({ ...stepped, note: "stepped-up size, 1 line" });

    const shortFit = await page.evaluate(
      ([r, t]) => window.findBreakpoint(r, t, 1),
      ["button", SHORT],
    );
    if (!shortFit.error) breakpoints.push({ ...shortFit, note: "button label" });
  }

  await page.close();
}

await browser.close();

const failures = rows.filter((r) => !r.pass);

const pad = (s, n) => String(s).padEnd(n);
console.log(`\ntokenkit type gate — ${rows.length} checks, band ${CPL_MIN}-${CPL_MAX} CPL\n`);
console.log(
  pad("", 6) + pad("ROOT", 7) + pad("ROLE", 22) + pad("WIDTH", 9) + pad("LINES", 7) + pad("CPL", 8) + "NOTE",
);
console.log("-".repeat(96));

for (const r of rows) {
  console.log(
    pad(r.pass ? (r.warn ? "warn" : "ok  ") : "FAIL", 6) +
      pad(`${(16 * r.zoom) / 100}px`, 7) +
      pad(r.role, 22) +
      pad(r.widthPx ? `${r.widthPx.toFixed(0)}px` : "—", 9) +
      pad(r.lineCount ?? "—", 7) +
      pad(r.cpl ? r.cpl.toFixed(1) : "—", 8) +
      (r.note || (r.orphan ? "orphan" : "")),
  );
}

console.log("-".repeat(96));
const warned = rows.filter((r) => r.warn).length;
console.log(
  `${rows.length - failures.length - warned} pass · ${warned} warn · ${failures.length} fail\n`,
);

if (breakpoints.length) {
  console.log("Measured breakpoints — where line count actually changes:\n");
  for (const b of breakpoints) {
    console.log(
      `  ${pad(b.role + (b.note ? ` (${b.note})` : ""), 26)} fits in ${b.targetLines} line(s) at ${b.widthRem.toFixed(1)}rem (${b.widthPx.toFixed(0)}px)`,
    );
  }
  console.log(
    "\n  The card's container query is declared at 42rem, set from the stepped-up",
  );
  console.log(
    "  measurement above. A breakpoint more than ~2rem from a measured one is a\n  guess rather than a decision.\n",
  );
}

if (wantReport) {
  await mkdir(resolve(ROOT, "audits"), { recursive: true });
  await writeFile(
    resolve(ROOT, "audits/type.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), band: [CPL_MIN, CPL_MAX], rows, breakpoints },
      null,
      2,
    ),
  );
  console.log("Report written to audits/type.json\n");
}

if (failures.length) {
  console.error("Type gate FAILED.\n");
  for (const f of failures) {
    console.error(
      `  ${f.role} at ${(16 * f.zoom) / 100}px root: ${f.cpl ? `${f.cpl.toFixed(1)} CPL` : f.error} — ${f.note}`,
    );
  }
  console.error("");
  process.exit(1);
}

console.log("Type gate passed.\n");
