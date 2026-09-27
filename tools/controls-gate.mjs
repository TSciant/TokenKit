#!/usr/bin/env node
/**
 * Controls gate — every component exposes its whole prop surface.
 *
 * "Parameterized" is a claim about the Controls panel, not about the source.
 * Two things can make it false, and neither is visible by reading a story:
 *
 *   1. A story declares `argTypes` and the panel is still empty, because the
 *      args never reached the running preview.
 *   2. A story shows *some* controls while the component has props that are
 *      not among them — which is the more common and more misleading case,
 *      since the panel looks populated.
 *
 * So this reads the kit's own declared prop types out of the TypeScript
 * source, asks the running Storybook preview what each story actually
 * exposes, and fails on the difference. It is the difference that matters: a
 * count of controls proves nothing about coverage.
 *
 *   npm run build-storybook && npm run controls
 *   npm run controls -- --verbose     list every prop, not just the gaps
 *
 * `npm run gates` runs this in the same browser pass as the other story gates.
 *
 * Inherited DOM attributes (className, style, onClick, the rest of
 * HTMLAttributes) are not counted. They are an escape hatch every wrapper
 * forwards, not a designed API, and putting 250 of them in the panel would
 * bury the dozen that are the component.
 */

import ts from "typescript";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, isMain, runChecks } from "./lib/stories.mjs";

/* ---------------------------------------------------------------------------
   Not every exported function that returns markup is kit API.

   These are the documentation's own furniture and Storybook-only harness:
   they exist to render the docs, are not exported for anyone to use, and have
   no props a consumer would set. Listed by name rather than by a pattern so
   that adding one is a deliberate act with a reason next to it.
--------------------------------------------------------------------------- */
const NOT_KIT_API = new Map([
  ["Page", "doc-page layout in src/tokens/doc.tsx"],
  ["TokenRow", "doc-page table row in src/tokens/doc.tsx"],
  ["Sub", "doc-page subheading in src/tokens/doc.tsx"],
  ["ResponsiveFrames", "Storybook-only viewport harness"],
  ["SingleFrame", "Storybook-only viewport harness"],
  ["PrototypeHeader", "internal to the clickable prototype"],
  ["PresencePanel", "loader shim; the panel's own props are on PresencePanel"],
  /* Caught by this gate the moment the brand sheet was split into two doc
     pages and its card moved out of a .stories. file into src/tokens/
     specimens.tsx. Correct catch, wrong verdict: it renders one specimen for
     the two Colour doc pages, takes a Specimen object and a view name, and
     has nothing a consumer would set. Named here rather than pattern-matched
     on src/tokens/ so that the next one is also a deliberate act. */
  ["BrandCard", "doc-page brand sheet in src/tokens/specimens.tsx"],
  ["Filmstrip", "doc-page logo ladder strip in src/tokens/specimens.tsx"],
  /* A context provider, not a component anyone renders. It takes a pack slug
     and children and paints nothing; the thing a consumer actually sets is
     the pack in the toolbar, which .storybook/preview.tsx passes straight
     through. A control for `brand` here would be a second, disagreeing way to
     choose a brand on one page. */
  ["ContentProvider", "context provider in src/samples/content — the toolbar drives it"],
]);

/* ---------------------------------------------------------------------------
   The kit's own declared props, from source.
--------------------------------------------------------------------------- */
function declaredProps() {
  /* `-co --exclude-standard`: tracked files AND untracked ones git is not
     ignoring. Plain `git ls-files` lists only what is staged, so a component
     added this session would not be checked at all — and the gate would
     report full coverage while saying nothing about the newest code in the
     repo. A gate that silently narrows its own input is worse than no gate.
     The index also still lists a file deleted from disk until the deletion
     is staged, so those are skipped rather than read. */
  const files = execSync("git ls-files -co --exclude-standard src", { cwd: ROOT })
    .toString()
    .split("\n")
    .filter((f) => f && /\.tsx?$/.test(f) && !f.includes(".stories."))
    .filter((f) => existsSync(join(ROOT, f)));

  const out = new Map();

  for (const rel of files) {
    const file = join(ROOT, rel);
    const sf = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const types = new Map();

    const membersOf = (node) => {
      const names = [];
      if (!node) return names;
      if (ts.isTypeLiteralNode(node)) {
        for (const m of node.members)
          if (ts.isPropertySignature(m) && m.name) names.push(m.name.getText(sf));
      } else if (ts.isIntersectionTypeNode(node)) {
        for (const t of node.types) names.push(...membersOf(t));
      } else if (ts.isTypeReferenceNode(node)) {
        const n = node.typeName.getText(sf);
        if (types.has(n)) names.push(...types.get(n));
      }
      return names;
    };

    const indexTypes = () => {
      for (const st of sf.statements) {
        if (ts.isTypeAliasDeclaration(st)) types.set(st.name.text, membersOf(st.type));
        if (ts.isInterfaceDeclaration(st)) {
          const names = st.members
            .filter(ts.isPropertySignature)
            .map((m) => m.name.getText(sf));
          for (const h of st.heritageClauses ?? [])
            for (const e of h.types) {
              const n = e.expression.getText(sf);
              if (types.has(n)) names.push(...types.get(n));
            }
          types.set(st.name.text, names);
        }
      }
    };
    indexTypes();
    indexTypes(); // again, so forward references resolve

    for (const st of sf.statements) {
      if (!ts.isFunctionDeclaration(st) || !st.name) continue;
      if (!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      if (!/^[A-Z]/.test(st.name.text)) continue; // components, not hooks
      const p = st.parameters[0];
      let props = [];
      if (p?.type) props = membersOf(p.type);
      if (!props.length && p && ts.isObjectBindingPattern(p.name))
        props = p.name.elements.map((e) => e.name.getText(sf));
      out.set(st.name.text, { file: rel, props: [...new Set(props)] });
    }
  }
  return out;
}

export function controlsCheck(argv = process.argv.slice(2)) {
  const verbose = argv.includes("--verbose");
  const byComponent = new Map(); // component name -> { title, keys, controls }
  const panels = []; // every story's exposed keys, named or not
  let checked = 0;

  return {
    name: "controls",
    viewports: ["desktop"],
    /* Every story, in every section, and every story rather than one per file:
       a story that sets no `component` is a documentation page and contributes
       nothing, and sampling the first story per title once made three
       components look unparameterized because their panel was second. */
    stories: (e) => e.type === "story",

    async visit(page, story) {
      checked += 1;
      const info = await page.evaluate(async (id) => {
        const p = window.__STORYBOOK_PREVIEW__;
        if (!p) return null;
        const s = await p.storyStore.loadStory({ storyId: id });
        const at = s.argTypes ?? {};
        return {
          name: s.component?.displayName || s.component?.name || null,
          keys: Object.keys(at),
          controls: Object.keys(at).filter((k) => at[k]?.control !== false && at[k]?.control != null).length,
        };
      }, story.id);

      if (!info) return;
      /* Keep the richest entry per component: a component with several
         stories may expose more in one than another, and the question is
         whether the panel offers the prop anywhere. */
      if (info.name) {
        const prev = byComponent.get(info.name);
        if (!prev || info.keys.length > prev.keys.length) {
          byComponent.set(info.name, { title: story.title, ...info });
        }
      }
      /* Every panel, whatever it is named after. Storybook takes `component`
         only on a meta, so a second component documented in the same file — a
         ModalTrigger beside a Modal — can have a complete set of controls and
         no way to say whose they are. The panels are kept and matched by what
         they cover. */
      if (info.keys.length) panels.push({ title: story.title, keys: info.keys });
    },

    report() {
      const rows = [];
      for (const [name, { file, props }] of declaredProps()) {
        if (NOT_KIT_API.has(name)) continue;
        if (!props.length) continue; // nothing to expose, nothing to check

        let story = byComponent.get(name);
        let missing = story ? props.filter((p) => !story.keys.includes(p)) : props;

        /* No story named after it, or one that does not cover it: look for any
           panel that drives every prop. The page compositions share one
           signature and one panel documents it; ModalTrigger's controls live
           in the Modal file. Both are covered in fact, and this asks about
           fact. */
        if (missing.length) {
          const covering = panels.find((pan) => props.every((p) => pan.keys.includes(p)));
          if (covering) {
            story = { title: covering.title, keys: covering.keys };
            missing = [];
          }
        }
        rows.push({ name, file, props, missing, story: story?.title ?? null });
      }

      const failing = rows.filter((r) => r.missing.length);
      const totalProps = rows.reduce((a, r) => a + r.props.length, 0);
      const totalShown = rows.reduce((a, r) => a + (r.props.length - r.missing.length), 0);

      console.log(
        `\ntokenkit controls gate — ${checked} stories, ${rows.length} components, ` +
          `${totalShown}/${totalProps} declared props exposed as controls\n`,
      );

      if (verbose) {
        for (const r of rows.sort((a, b) => a.name.localeCompare(b.name))) {
          const mark = r.missing.length ? "FAIL" : "ok  ";
          console.log(
            `${mark}  ${r.name.padEnd(22)} ${String(r.props.length - r.missing.length).padStart(3)}/${String(r.props.length).padEnd(3)} ${r.story ?? "(no panel)"}`,
          );
        }
        console.log("");
      }

      for (const r of failing) {
        console.log(
          `FAIL  ${r.name} (${r.file}) — ${r.story ? "not in the panel" : "no panel drives it"}: ${r.missing.join(", ")}`,
        );
      }

      console.log(`\n${rows.length - failing.length} component(s) fully exposed · ${failing.length} fail\n`);
      if (failing.length) {
        console.log("Controls gate FAILED.");
        return false;
      }
      console.log("Controls gate passed.");
      return true;
    },
  };
}

if (isMain(import.meta.url)) {
  process.exit((await runChecks([controlsCheck()])) ? 0 : 1);
}
