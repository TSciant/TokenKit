#!/usr/bin/env node
/**
 * Onionskin — put the rebuild over the reference and look at the difference.
 *
 * Two layers on one plate. Drift is named on the image, not in a sidecar
 * document nobody opens: if a note about the gap is not on the plate, it does
 * not survive to the next iteration.
 *
 * This is a comparison instrument, not a pixel-diff gate. The rebuild is
 * supposed to differ — it is a grayscale wireframe of a branded site. What
 * onionskin is for is structural drift: a section that moved, a rhythm that
 * changed, a hierarchy that inverted.
 *
 *   node tools/onionskin.mjs --slug acme --rebuild http://localhost:3000 \\
 *        --map /=home --map /about=about-us
 *
 * --map <rebuildPath>=<referencePageSlug> pairs a rebuild route with a
 * captured reference page. Reference slugs come from inventory.json.
 *
 * Writes audits/<slug>/onionskin/{captures, index.html}
 */

import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BREAKPOINTS = [
  { name: "360", width: 360, height: 800 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 900 },
  { name: "1600", width: 1600, height: 1000 },
];

const argv = process.argv.slice(2);
const arg = (flag, fallback = null) => {
  const i = argv.indexOf(flag);
  return i > -1 ? argv[i + 1] : fallback;
};
const all = (flag) =>
  argv.reduce((acc, a, i) => (a === flag ? [...acc, argv[i + 1]] : acc), []);

const slug = arg("--slug", "audit");
const rebuild = arg("--rebuild");
const maps = all("--map").map((m) => {
  const [route, ref] = m.split("=");
  return { route, ref };
});

if (!rebuild || maps.length === 0) {
  console.error(
    "Usage: node tools/onionskin.mjs --slug <slug> --rebuild <baseUrl> --map /=<refSlug> [--map /about=<refSlug>]",
  );
  process.exit(1);
}

const dir = resolve(ROOT, "audits", slug);
const outDir = resolve(dir, "onionskin");
const shotDir = resolve(outDir, "captures");
await mkdir(shotDir, { recursive: true });

const site = JSON.parse(await readFile(resolve(dir, "inventory.json"), "utf8"));
const bySlug = Object.fromEntries(site.pages.map((p) => [p.slug, p]));

const executablePath = process.env.TOKENKIT_CHROMIUM || undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

const pairs = [];

for (const { route, ref } of maps) {
  const reference = bySlug[ref];
  if (!reference) {
    console.error(`No captured reference page with slug "${ref}" — skipping.`);
    continue;
  }

  const url = new URL(route, rebuild).href;
  const entry = { route, ref, url, shots: {} };
  console.log(`\n${url}  vs  ${reference.url}`);

  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage({
      viewport: { width: bp.width, height: bp.height },
    });
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(400);
      const file = `${ref}@${bp.name}.png`;
      await page.screenshot({ path: resolve(shotDir, file), fullPage: true });
      entry.shots[bp.name] = {
        rebuild: `captures/${file}`,
        reference: reference.breakpoints[bp.name]
          ? `../captures/${reference.breakpoints[bp.name]}`
          : null,
      };
      console.log(`  ${bp.name.padEnd(5)} ok`);
    } catch (err) {
      console.log(`  ${bp.name.padEnd(5)} failed: ${err.message}`);
    } finally {
      await page.close();
    }
  }
  pairs.push(entry);
}

await browser.close();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Onionskin — ${slug}</title>
<style>
  :root { color-scheme: light dark; --ui: #6b7280; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 1.5rem;
    font: 14px/1.5 ui-sans-serif, system-ui, sans-serif;
    background: Canvas; color: CanvasText;
  }
  h1 { font-size: 1.125rem; margin: 0 0 1rem; }
  .bar {
    position: sticky; top: 0; z-index: 10;
    display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;
    padding: .75rem 0; margin-bottom: 1rem;
    background: Canvas; border-bottom: 1px solid var(--ui);
  }
  label { display: flex; align-items: center; gap: .5rem; }
  select, input[type=range] { font: inherit; }
  .plate { margin-bottom: 2.5rem; }
  .plate > h2 { font-size: .875rem; font-weight: 600; margin: 0 0 .5rem; }
  .stage {
    position: relative; border: 1px solid var(--ui); overflow: auto;
    max-height: 80vh; background: #fff;
  }
  .stage img { display: block; width: 100%; }
  .stage img.over {
    position: absolute; inset: 0; width: 100%;
    opacity: var(--mix, .5);
  }
  [data-mode="difference"] .stage img.over { mix-blend-mode: difference; opacity: 1; }
  [data-mode="side"] .stage { display: grid; grid-template-columns: 1fr 1fr; }
  [data-mode="side"] .stage img.over { position: static; opacity: 1; }
  .missing { padding: 2rem; color: var(--ui); }
  .note {
    margin-top: .5rem; inline-size: 100%; min-height: 3rem;
    font: inherit; padding: .5rem; border: 1px solid var(--ui); background: transparent;
    color: inherit;
  }
  .legend { color: var(--ui); font-size: .8125rem; margin: 0 0 1rem; }
</style>
</head>
<body data-mode="blend">
<h1>Onionskin — ${slug}</h1>
<p class="legend">
  Reference under, rebuild over. The rebuild is grayscale on purpose — look for
  structure that moved, rhythm that changed, hierarchy that inverted. Write what
  you see in the box under each plate; notes print with the page.
</p>

<div class="bar">
  <label>Breakpoint
    <select id="bp">
      ${BREAKPOINTS.map((b, i) => `<option value="${b.name}"${i === 2 ? " selected" : ""}>${b.name}</option>`).join("")}
    </select>
  </label>
  <label>Mode
    <select id="mode">
      <option value="blend">blend</option>
      <option value="difference">difference</option>
      <option value="side">side by side</option>
    </select>
  </label>
  <label>Mix
    <input id="mix" type="range" min="0" max="100" value="50">
  </label>
  <button id="print">Print</button>
</div>

<div id="plates"></div>

<script>
const DATA = ${JSON.stringify(pairs, null, 2)};

const plates = document.getElementById("plates");
const bpSel = document.getElementById("bp");
const modeSel = document.getElementById("mode");
const mix = document.getElementById("mix");

function render() {
  const bp = bpSel.value;
  plates.innerHTML = "";
  for (const p of DATA) {
    const shot = p.shots[bp];
    const el = document.createElement("section");
    el.className = "plate";
    const notes = localStorage.getItem("onion:" + p.ref + ":" + bp) || "";
    el.innerHTML = shot && shot.reference
      ? \`<h2>\${p.ref} — \${p.route} @ \${bp}</h2>
         <div class="stage">
           <img src="\${shot.reference}" alt="reference">
           <img class="over" src="\${shot.rebuild}" alt="rebuild">
         </div>
         <textarea class="note" data-key="onion:\${p.ref}:\${bp}"
           placeholder="Region — what was meant vs what we got. Align / Accept / Replace.">\${notes}</textarea>\`
      : \`<h2>\${p.ref} @ \${bp}</h2><div class="stage"><p class="missing">No capture pair at this breakpoint.</p></div>\`;
    plates.append(el);
  }
}

plates.addEventListener("input", (e) => {
  if (e.target.matches(".note")) {
    try { localStorage.setItem(e.target.dataset.key, e.target.value); } catch {}
  }
});

bpSel.addEventListener("change", render);
modeSel.addEventListener("change", () => {
  document.body.dataset.mode = modeSel.value;
});
mix.addEventListener("input", () => {
  document.documentElement.style.setProperty("--mix", mix.value / 100);
});
document.getElementById("print").addEventListener("click", () => window.print());

document.documentElement.style.setProperty("--mix", 0.5);
render();
</script>
</body>
</html>
`;

await writeFile(resolve(outDir, "index.html"), html);
console.log(`\nWrote audits/${slug}/onionskin/index.html\n`);
