#!/usr/bin/env node
/**
 * Generate the Storybook stories for the 25 composed patterns.
 *
 * Storybook shows a Controls panel when a story declares what its component
 * takes. These twenty-five started life as fixed compositions — no props at
 * all — so the panel was empty on every one of them, and the only way to see a
 * different heading or a three-column grid was to edit the source.
 *
 * They now take their content and their shape as props. This reads those prop
 * types and their default values straight out of the TypeScript source and
 * writes the matching `args` and `argTypes`, so the panel cannot drift from
 * the API: add a prop to a component, re-run this, and the control is there.
 *
 *   node tools/gen-component-stories.mjs
 *   node tools/gen-component-stories.mjs --check    exit 1 if anything is stale
 *
 * THE PROSE COMES FROM THE COMPONENT, NOT FROM HERE.
 *
 * Each docs page's description is the component's own leading JSDoc comment,
 * read out of the pattern file. The previous version of this tool kept the
 * description inside the generated story and preserved it across runs, which
 * meant the sentence explaining a component lived somewhere the next person to
 * read that component would never look, and could be edited in one place and
 * not the other. One home. If the docs page says the wrong thing, fix the
 * comment above the function — which is the thing you wanted fixed anyway.
 *
 * Everything else about a generated file is generated. Do not hand-edit one;
 * --check will fail and the edit will be overwritten.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/* The sidebar section these stories land in.

   A constant because it was a literal inside a template string, and when the
   sections were renumbered a search for the quoted form found every generated
   file and missed the generator that writes them — so 25 files said one thing
   and their source of truth said another. `--check` caught it, which is the
   only reason this is a comment rather than a bug. */
const SECTION = "05 Patterns";

const SRC = resolve(ROOT, "src/react/patterns");
const OUT = resolve(SRC, "stories");
const check = process.argv.includes("--check");

/* ---------------------------------------------------------------------------
   Which story renders which component.

   The numbers are the pattern's own — they are in each component's JSDoc, they
   are the order the patterns were built in, and they are what the sidebar
   sorts by. `02 Mega menu` is the one entry that is not its own component: it
   is the masthead with its dropdown open, which is a different thing to look
   at and a different set of controls to drive, and so gets its own page.
--------------------------------------------------------------------------- */
const STORIES = [
  ["01", "Masthead", "chrome", "Masthead"],
  ["02", "Mega menu", "chrome", "Masthead", { withMegaMenu: true }],
  ["03", "Contact CTA", "chrome", "ContactCta"],
  ["04", "Header search", "chrome", "HeaderSearch"],
  ["05", "Hero carousel", "marketing", "HeroCarousel"],
  ["06", "Arrow CTA", "marketing", "ArrowCta"],
  ["07", "Proof strip", "marketing", "ProofStrip"],
  ["08", "Segment list", "marketing", "SegmentList"],
  ["09", "Feature grid", "marketing", "FeatureGrid"],
  ["10", "Article feed", "marketing", "ArticleFeed"],
  ["11", "Event promo", "marketing", "EventPromo"],
  ["12", "Lead form", "templates", "LeadForm"],
  ["13", "Site footer", "chrome", "SiteFooter"],
  ["14", "Page hero", "chrome", "PageHero"],
  ["15", "Tile grid", "catalog", "TileGrid"],
  ["16", "Hub cards", "catalog", "HubCards"],
  ["17", "CTA blocks", "catalog", "CtaBlocks"],
  ["18", "Filter bar", "catalog", "FilterBar"],
  ["19", "Media cards", "catalog", "MediaCards"],
  ["20", "People directory", "catalog", "PeopleDirectory"],
  ["21", "Segment page", "templates", "SegmentPage"],
  ["22", "Sub-brand page", "templates", "SubBrandPage"],
  ["23", "Article page", "templates", "ArticlePage"],
  ["24", "Event list", "catalog", "EventList"],
  ["25", "Apply form", "templates", "ApplyForm"],
];

const MODULES = ["chrome", "marketing", "catalog", "templates"];

/** `Mega menu` -> `MegaMenu`, so the filename is greppable from the title. */
const pascal = (s) =>
  s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => (w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1)))
    .join("");

/* ---------------------------------------------------------------------------
   Read the components: for each exported function, its destructured parameter
   names, each one's default initializer, the declared type of each member of
   the matching `XxxProps` type, and the function's own leading JSDoc.
--------------------------------------------------------------------------- */
const api = new Map(); // "marketing.ProofStrip" -> { props, doc }

for (const mod of MODULES) {
  const file = resolve(SRC, `${mod}.tsx`);
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  /* The prop types, by name: ProofStripProps -> { heading: "string", ... } */
  const propTypes = new Map();
  const typeDocs = new Map();
  const jsdocText = (node) =>
    (node.jsDoc ?? [])
      .map((d) => (typeof d.comment === "string" ? d.comment : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  for (const st of sf.statements) {
    if (!ts.isTypeAliasDeclaration(st)) continue;
    if (!ts.isTypeLiteralNode(st.type)) continue;
    const members = new Map();
    for (const m of st.type.members) {
      if (!ts.isPropertySignature(m) || !m.name || !m.type) continue;
      members.set(m.name.getText(sf), { type: m.type.getText(sf), doc: jsdocText(m) });
    }
    propTypes.set(st.name.text, members);
    /* Some components carry their leading comment above `XxxProps` rather
       than above the function — the props are what a caller reads first, so
       it is a reasonable place to have put it. Either position counts. */
    typeDocs.set(st.name.text, jsdocText(st));
  }

  for (const st of sf.statements) {
    if (!ts.isFunctionDeclaration(st) || !st.name) continue;
    if (!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    const param = st.parameters[0];
    if (!param || !ts.isObjectBindingPattern(param.name)) continue;

    /* The declared member types, from a named `XxxProps` alias or — for the
       components that type their parameter inline — from the literal on the
       parameter itself. Without the second case every prop reads as unknown
       and every control degrades to a JSON editor. */
    let declared = propTypes.get(`${st.name.text}Props`);
    if (!declared && param.type && ts.isTypeLiteralNode(param.type)) {
      declared = new Map();
      for (const m of param.type.members) {
        if (!ts.isPropertySignature(m) || !m.name || !m.type) continue;
        declared.set(m.name.getText(sf), { type: m.type.getText(sf), doc: jsdocText(m) });
      }
    }
    declared ??= new Map();

    const props = [];
    for (const el of param.name.elements) {
      const name = el.name.getText(sf);
      const info = declared.get(name);
      const init = el.initializer;
      props.push({
        name,
        type: info?.type ?? "unknown",
        doc: info?.doc ?? "",
        init: init ? init.getText(sf) : undefined,
        initIsIdentifier: init ? ts.isIdentifier(init) : false,
      });
      /* A default that is a call expression reads fine here and breaks the
         emit below, which can only write an identifier or a literal into the
         story's args. Fail loudly rather than silently drop the default. */
      if (init && !ts.isIdentifier(init) && !ts.isLiteralExpression(init) &&
          ![ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword]
            .includes(init.kind) &&
          !ts.isPropertyAccessExpression(init) && !ts.isElementAccessExpression(init) &&
          !ts.isPrefixUnaryExpression(init)) {
        throw new Error(
          `${mod}.tsx: ${st.name.text}'s default for \`${name}\` is ` +
            `\`${init.getText(sf)}\`. A prop default must be a literal or a reference to an ` +
            `exported module constant — this tool can only emit one of those into the story's args.`,
        );
      }
    }

    api.set(`${mod}.${st.name.text}`, {
      props,
      doc: jsdocText(st) || typeDocs.get(`${st.name.text}Props`) || "",
    });
  }
}

/* ---------------------------------------------------------------------------
   Prop type -> control.

   The mapping is deliberately boring. A control that guesses wrong is worse
   than a text box, because a text box is at least honest about what it does
   not know.
--------------------------------------------------------------------------- */
const RATIOS = ["21 / 9", "16 / 9", "16 / 10", "4 / 3", "1 / 1", "3 / 4"];

function controlFor({ name, type, init, initIsIdentifier }) {
  /* children is two different props wearing one name. When a component
     defaults it to a string it is the label — the thing a reviewer most wants
     to retype — and it gets a text box. When it is a slot for other elements a
     text box is a lie, so the panel lists it and says what it is. */
  if (name === "children") {
    const isText = init !== undefined && !initIsIdentifier && /^["'`]/.test(init);
    return isText
      ? { control: "text" }
      : { control: false, description: "Slot — composed elements, not text." };
  }

  const unionOf = (t) => {
    const parts = t.split("|").map((p) => p.trim());
    if (!parts.length || !parts.every((p) => /^"[^"]*"$/.test(p))) return null;
    return parts.map((p) => p.slice(1, -1));
  };

  if (type === "Cols") return { control: "inline-radio", options: [1, 2, 3, 4] };
  if (name === "seed") return { control: { type: "range", min: 1, max: 6, step: 1 } };
  if (/ratio$/i.test(name)) return { control: "select", options: RATIOS };

  const lits = unionOf(type);
  if (lits) return { control: lits.length > 4 ? "select" : "inline-radio", options: lits };

  if (type === "boolean") return { control: "boolean" };
  if (type === "number") return { control: { type: "number" } };
  if (type === "string") return { control: "text" };
  if (type === "string[]" || /\[\]$/.test(type)) return { control: "object" };
  if (type === "ReactNode") return { control: "text" };
  return { control: "object" };
}

/* A long paragraph in a one-line text box is unusable; Storybook has a
   multiline control and these decks are the reason it exists. */
const LONG = /^(deck|body|lede|intro|blurb|verificationBody|sectionBody)$/;

function argTypeSource(prop) {
  const ctl = LONG.test(prop.name) ? { control: { type: "text" } } : controlFor(prop);
  /* controlFor may supply its own description for a slot; the declared JSDoc
     wins when there is one. */
  const summary = prop.init && prop.initIsIdentifier ? prop.init : undefined;
  return json({
    ...ctl,
    ...(prop.doc ? { description: prop.doc } : {}),
    ...(summary ? { table: { defaultValue: { summary } } } : {}),
  });
}

/** JSON with unquoted keys and no trailing comma noise — this is source, not data. */
function json(v, indent = 4) {
  const pad = " ".repeat(indent);
  if (Array.isArray(v)) return `[${v.map((x) => json(x, indent)).join(", ")}]`;
  if (v && typeof v === "object") {
    const entries = Object.entries(v).filter(([, x]) => x !== undefined);
    if (!entries.length) return "{}";
    const inner = entries
      .map(
        ([k, x]) =>
          `${pad}  ${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${json(x, indent + 2)}`,
      )
      .join(",\n");
    return `{\n${inner},\n${pad}}`;
  }
  return JSON.stringify(v);
}

/* ---------------------------------------------------------------------------
   Emit.
--------------------------------------------------------------------------- */
mkdirSync(OUT, { recursive: true });

const expected = new Set();
let wrote = 0;
const stale = [];

for (const [num, label, mod, comp, extraArgs] of STORIES) {
  const slug = `${num}-${pascal(label)}`;
  const file = join(OUT, `${slug}.stories.tsx`);
  expected.add(`${slug}.stories.tsx`);

  const entry = api.get(`${mod}.${comp}`);
  if (!entry) throw new Error(`${mod}.tsx exports no component named ${comp}`);
  const { props, doc } = entry;

  /* The JSDoc carries its own pattern number ("07 — the proof strip."). The
     sidebar already numbers the page; repeating it in the description reads
     like a stutter. */
  const description = doc.replace(/^\d{2}\s*[—-]\s*/, "").trim();
  if (!description) {
    throw new Error(
      `${mod}.tsx: ${comp} has no leading JSDoc. The docs page's description is that comment — ` +
        `write one above the function.`,
    );
  }

  const argLines = [];
  for (const p of props) {
    if (p.init === undefined) continue;
    /* An identifier default is an exported constant — reference it rather than
       copying its contents, so the panel and the component cannot disagree
       about what the default is. */
    argLines.push(`    ${p.name}: ${p.initIsIdentifier ? `${mod}.${p.init}` : p.init},`);
  }
  for (const [k, v] of Object.entries(extraArgs ?? {})) {
    const i = argLines.findIndex((l) => l.trimStart().startsWith(`${k}:`));
    const line = `    ${k}: ${JSON.stringify(v)},`;
    if (i >= 0) argLines[i] = line;
    else argLines.push(line);
  }
  const argTypeLines = props.map((p) => `    ${p.name}: ${argTypeSource(p)},`);

  const metaTail = props.length
    ? `  argTypes: {
${argTypeLines.join("\n")}
  },
  args: {
${argLines.join("\n")}
  },
`
    : "";

  const next = `import type { Meta, StoryObj } from "@storybook/react-vite";
import * as ${mod} from "../${mod}";

/* Generated by tools/gen-component-stories.mjs from ${mod}.tsx's own prop types,
   default values and JSDoc. Do not hand-edit: \`npm run gen:stories -- --check\`
   will fail and the next run will overwrite it. To change the text on the docs
   page, edit the comment above \`${comp}\` in ${mod}.tsx. */
const meta = {
  title: ${JSON.stringify(`${SECTION}/${num} ${label}`)},
  component: ${mod}.${comp},
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          ${JSON.stringify(description)},
      },
    },
  },
${metaTail}} satisfies Meta<typeof ${mod}.${comp}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: ${JSON.stringify(label)},
};
`;

  // Compare as LF: git checks files out CRLF on Windows.
  const existing = existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
  if (next !== existing) {
    if (check) stale.push(slug);
    else {
      writeFileSync(file, next);
      wrote += 1;
    }
  }
}

/* A story left behind after its component was renamed is a page that renders
   something nobody is maintaining. The directory is generated, so it is also
   pruned. */
const orphans = readdirSync(OUT).filter((f) => f.endsWith(".stories.tsx") && !expected.has(f));
if (orphans.length) {
  if (check) stale.push(...orphans.map((f) => `${f} (orphan)`));
  else for (const f of orphans) rmSync(join(OUT, f));
}

if (check) {
  if (stale.length) {
    console.log(`\n${stale.length} pattern story file(s) stale — run \`npm run gen:stories\`\n`);
    for (const s of stale) console.log(`  ${s}`);
    process.exit(1);
  }
  console.log("\nPattern stories are up to date with their prop types.\n");
  process.exit(0);
}

const propCount = [...api.values()].reduce((a, e) => a + e.props.length, 0);
console.log(
  `\n${wrote} of ${STORIES.length} pattern stories rewritten` +
    (orphans.length ? `, ${orphans.length} orphan(s) removed` : "") +
    `; ${propCount} props wired across ${api.size} components\n`,
);
