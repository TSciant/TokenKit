#!/usr/bin/env node
/**
 * Start a kit component: the five places a new primitive has to be, written
 * at once, in the kit's own shape.
 *
 *   npm run new:component -- SaveStatus
 *   npm run new:component -- SaveStatus --title "Save status" --tag span
 *
 *   src/react/primitives/SaveStatus.tsx           props, doc comment, data-tk="save-status"
 *   src/react/primitives/SaveStatus.stories.tsx   the next "04 Primitives" number, argTypes for
 *                                                 every prop (the controls gate), a Playground
 *                                                 and an Onion skin story
 *   src/css/components/save-status.css            the rule its data-tk names (the attribute gate)
 *   src/css/index.css                             the import
 *   src/react/primitives/index.ts                 the export and its props type
 *
 * The doc comment and the story's description say TODO until they are
 * written: the first two paragraphs of the comment become the component's
 * entry in the Figma guidelines. Then, once its Figma counterpart is drawn:
 *
 *   npm run figma:register -- SaveStatus --node 497:2373 --skin <url> --doc "…"
 *
 * Refuses to overwrite anything that is already there.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const name = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!name || !/^[A-Z][A-Za-z0-9]+$/.test(name)) {
  console.error("usage: npm run new:component -- <PascalName> [--title \"Words\"] [--tag div|span|section]");
  process.exit(2);
}
const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
const words = opt("title") ?? kebab.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
const tag = opt("tag") ?? "div";
const element = { div: "HTMLDivElement", span: "HTMLSpanElement", section: "HTMLElement" }[tag];
if (!element) { console.error(`--tag ${tag}: div, span or section`); process.exit(2); }

const PRIM = join(ROOT, "src/react/primitives");
const files = {
  tsx: join(PRIM, `${name}.tsx`),
  stories: join(PRIM, `${name}.stories.tsx`),
  css: join(ROOT, `src/css/components/${kebab}.css`),
};
const there = Object.values(files).filter((f) => existsSync(f));
if (there.length) { console.error(`Already there, nothing written:\n  ${there.join("\n  ")}`); process.exit(1); }

/* The next number in the primitives' story order. */
const numbers = readdirSync(PRIM)
  .filter((f) => f.endsWith(".stories.tsx"))
  .map((f) => readFileSync(join(PRIM, f), "utf8").match(/title:\s*"04 Primitives\/(\d+) /)?.[1])
  .filter(Boolean)
  .map(Number);
const next = Math.max(0, ...numbers) + 1;

/* Edit a file keeping its line endings. */
const edit = (file, fn) => {
  const raw = readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  const out = fn(raw.replace(/\r\n/g, "\n"));
  writeFileSync(file, crlf ? out.replace(/\n/g, "\r\n") : out);
};

writeFileSync(files.tsx, `import type { HTMLAttributes, ReactNode } from "react";

export interface ${name}Props extends HTMLAttributes<${element}> {
  /** TODO: what goes in it. */
  children?: ReactNode;
}

/**
 * ${name} — TODO: what it is, in one line.
 *
 * TODO: when to use it and when not, and what it does for the reader. These
 * first two paragraphs are its entry in the Figma guidelines; what follows
 * them is for the code.
 */
export function ${name}({ children, ...rest }: ${name}Props) {
  return (
    <${tag} {...rest} data-tk="${kebab}">
      {children}
    </${tag}>
  );
}
`);

writeFileSync(files.stories, `import type { Meta, StoryObj } from "@storybook/react-vite";
import { ${name} } from "./${name}";

const meta = {
  title: "04 Primitives/${next} ${words}",
  component: ${name},
  parameters: {
    docs: {
      description: {
        component:
          "TODO: what it is, when to use it and when not, and the corpus pages it was specified from.",
      },
    },
  },
  argTypes: {
    children: { control: "text" },
  },
  args: { children: "${words}" },
} satisfies Meta<typeof ${name}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma ${name} laid over this one." } },
    onion: { component: "${name}", skin: () => "default.png" },
  },
};
`);

writeFileSync(files.css, `/* ---------------------------------------------------------------------------
   ${name} — TODO: what it is, in a line, and what its rules are for.
--------------------------------------------------------------------------- */

@layer components {
  :where([data-tk="${kebab}"]) {
    display: ${tag === "span" ? "inline-block" : "block"};
  }
}
`);

edit(join(ROOT, "src/css/index.css"), (s) => {
  const imports = [...s.matchAll(/^@import url\("\.\/components\/[^"]+"\);$/gm)];
  const last = imports.at(-1);
  const at = last.index + last[0].length;
  return `${s.slice(0, at)}\n@import url("./components/${kebab}.css");${s.slice(at)}`;
});

edit(join(PRIM, "index.ts"), (s) => `${s.replace(/\n*$/, "\n")}export { ${name} } from "./${name}";\nexport type { ${name}Props } from "./${name}";\n`);

console.log(`${name}: story ${next}, data-tk="${kebab}"
  wrote  src/react/primitives/${name}.tsx
  wrote  src/react/primitives/${name}.stories.tsx
  wrote  src/css/components/${kebab}.css
  added  its import to src/css/index.css and its export to src/react/primitives/index.ts

Next:
  - write the doc comment and the story description (they say TODO), the props, and argTypes for each
  - any text it shows on a surface: a pair in tests/fixture.html for the contrast gate
  - npm run check:fast
  - draw it in Figma, then: npm run figma:register -- ${name} --node <id> --skin <url> --doc "<what the skin shows>"`);
