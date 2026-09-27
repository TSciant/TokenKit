#!/usr/bin/env node
/**
 * Contrast gate.
 *
 * The distinction that matters: this does not check a palette, it checks the
 * system. Every pair is read with getComputedStyle from a real element in a
 * real context, after the cascade has resolved custom properties against
 * whatever surface, density and brand that element actually sits in. A token
 * that is fine at :root and fails inside [data-density="compact"] on a sunken
 * surface is exactly the failure a palette-based check cannot see.
 *
 *   node tools/contrast-gate.mjs             assert, exit 1 on failure
 *   node tools/contrast-gate.mjs --report    also write audits/contrast.json
 *   node tools/contrast-gate.mjs --zoom 200  re-run at 200% text size
 *
 * Exit code 1 on any failure.
 */

import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { judge, format } from "../src/lib/contrast.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FIXTURE = pathToFileURL(resolve(ROOT, "tests/fixture.html")).href;

const args = process.argv.slice(2);
const wantReport = args.includes("--report");
const zoomIdx = args.indexOf("--zoom");
const zoom = zoomIdx > -1 ? Number(args[zoomIdx + 1]) : 100;

/**
 * Runs in the page. Collects raw computed colours — no judgement here, so
 * the maths stays in one module on the Node side.
 */
function collect() {
  const OPAQUE = (v) => {
    if (!v) return false;
    const m = /rgba?\(([^)]+)\)/.exec(v);
    if (!m) return v !== "transparent";
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    return parts.length < 4 || parseFloat(parts[3]) > 0;
  };

  const backdropOf = (el) => {
    let node = el.parentElement;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (OPAQUE(bg)) return bg;
      node = node.parentElement;
    }
    return "rgb(255, 255, 255)";
  };

  const selfOrBackdrop = (el) => {
    const own = getComputedStyle(el).backgroundColor;
    return OPAQUE(own) ? own : backdropOf(el);
  };

  const contextOf = (el) => {
    const ctx = el.closest("[data-surface]");
    const density = el.closest("[data-density]");
    const brand = el.closest("[data-brand]") || document.body;
    return [
      brand.getAttribute("data-brand") || "—",
      ctx ? ctx.getAttribute("data-surface") : "—",
      density ? density.getAttribute("data-density") : "default",
    ].join(" / ");
  };

  const out = [];
  for (const el of document.querySelectorAll("[data-check]")) {
    const spec = el.getAttribute("data-check");
    const [kind, target = "text"] = spec.split(":");
    const cs = getComputedStyle(el);
    const label = el.getAttribute("data-label") || el.tagName.toLowerCase();
    const context = contextOf(el);

    let fg = null;
    let bg = null;

    if (target === "text") {
      fg = cs.color;
      bg = selfOrBackdrop(el);
    } else if (target === "border") {
      const w = parseFloat(cs.borderTopWidth) || 0;
      if (w <= 0) continue;
      fg = cs.borderTopColor;
      bg = selfOrBackdrop(el);
    } else if (target === "outline") {
      fg = cs.outlineColor;
      bg = backdropOf(el);
    } else if (target === "scrim") {
      /* The image under a scrim is unknown, so the gate does not guess at it:
         it takes the only bound that always holds. No pixel is lighter than
         white, so compositing the wash over white gives the lightest the
         backdrop can ever be, and a pass there is a pass over any photograph
         at all. This is the whole reason the scrim's alphas are derived
         rather than chosen — see src/css/components/scrim.css. */
      const scrim = el.closest('[data-tk="scrim"]');
      if (!scrim) continue;
      const scs = getComputedStyle(scrim);
      const strength = scrim.getAttribute("data-strength");
      const token =
        strength === "aaa"
          ? "--tk-scrim-aaa"
          : strength === "large"
            ? "--tk-scrim-aa-large"
            : "--tk-scrim-aa";
      const alpha = parseFloat(scs.getPropertyValue(token));
      const ink = scs.getPropertyValue("--tk-scrim-ink").trim();
      let rgb = null;
      if (ink.startsWith("#")) {
        const h =
          ink.length === 4
            ? ink.slice(1).replace(/./g, (c) => c + c)
            : ink.slice(1);
        rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      } else {
        const m = /rgba?\(([^)]+)\)/.exec(ink);
        if (m) rgb = m[1].split(/[\s,\/]+/).filter(Boolean).slice(0, 3).map(Number);
      }
      if (!rgb || rgb.some(Number.isNaN) || Number.isNaN(alpha)) continue;
      const over = rgb.map((c) => Math.round(c * alpha + 255 * (1 - alpha)));
      /* A boundary on a wash has the same problem the text did: whatever is
         behind it is the wash, not the plate an ancestor walk would find. The
         kind decides which of the element's own colours is the foreground. */
      if (kind === "nonText") {
        const w = parseFloat(cs.borderTopWidth) || 0;
        if (w <= 0) continue;
        fg = cs.borderTopColor;
      } else {
        fg = cs.color;
      }
      bg = "rgb(" + over.join(", ") + ")";
    } else if (target === "background") {
      fg = cs.backgroundColor;
      bg = backdropOf(el);
    }

    if (!fg || !bg) continue;

    out.push({
      label,
      kind,
      target,
      context,
      fg,
      bg,
      backdrop: backdropOf(el),
      fontSize: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
    });
  }
  return out;
}

// Honour an explicit Chromium when the environment pins one (CI images and
// locked-down VDIs routinely do). Otherwise Playwright resolves its own.
const executablePath = process.env.TOKENKIT_CHROMIUM || undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});

if (zoom !== 100) {
  // Emulate the user's browser font-size setting, which is what 1.4.4 tests.
  await page.addInitScript((z) => {
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.style.fontSize = `${(16 * z) / 100}px`;
    });
  }, zoom);
}

await page.goto(FIXTURE, { waitUntil: "load" });
await page.waitForTimeout(120);

const raw = await page.evaluate(collect);
await browser.close();

if (raw.length === 0) {
  console.error("Contrast gate found no checks. Is tests/fixture.html intact?");
  process.exit(1);
}

const rows = raw.map((r) => {
  // Large-text relief only where the text genuinely qualifies (1.4.3):
  // >= 24px, or >= 18.66px when bold.
  const bold = Number(r.fontWeight) >= 700;
  const isLarge = r.fontSize >= 24 || (bold && r.fontSize >= 18.66);
  const kind =
    r.kind === "textNormal" && isLarge ? "textLarge" : r.kind;
  const verdict = judge(r.fg, r.bg, kind, r.backdrop);
  return { ...r, kind, ...verdict };
});

const failures = rows.filter((r) => !r.pass);

const pad = (s, n) => String(s).padEnd(n);
console.log(
  `\ntokenkit contrast gate — ${rows.length} pairs, root font-size ${(16 * zoom) / 100}px\n`,
);
console.log(
  pad("", 6) + pad("PAIR", 26) + pad("CONTEXT", 34) + pad("KIND", 14) + "RATIO",
);
console.log("-".repeat(96));

for (const r of rows) {
  const tag = r.pass ? "ok  " : "FAIL";
  const ratio = `${format(r.ratio)} (needs ${r.required}:1)`;
  console.log(
    pad(tag, 6) + pad(r.label, 26) + pad(r.context, 34) + pad(r.kind, 14) + ratio,
  );
}

console.log("-".repeat(96));
console.log(
  `${rows.length - failures.length} pass · ${failures.length} fail\n`,
);

if (wantReport) {
  await mkdir(resolve(ROOT, "audits"), { recursive: true });
  await writeFile(
    resolve(ROOT, "audits/contrast.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        rootFontSizePx: (16 * zoom) / 100,
        total: rows.length,
        failed: failures.length,
        rows,
      },
      null,
      2,
    ),
  );
  console.log("Report written to audits/contrast.json\n");
}

if (failures.length > 0) {
  console.error("Contrast gate FAILED.\n");
  for (const f of failures) {
    console.error(
      `  ${f.label} in ${f.context}: ${f.fg} on ${f.bg} = ${format(f.ratio)}, needs ${f.required}:1`,
    );
  }
  console.error("");
  process.exit(1);
}

console.log("Contrast gate passed.\n");
