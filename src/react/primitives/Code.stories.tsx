import type { Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "./Code";

const meta = {
  title: "04 Primitives/64 Code",
  component: Code,
  parameters: {
    docs: {
      description: {
        component:
          "A short piece of source, labelled: a snippet that illustrates a point. A figure with the label as its caption, in the pack's mono face on the sunken surface. Long lines wrap rather than scroll, so the snippet never needs a focus stop of its own. Highlighted by kind (keyword, tag, property, string, number, comment, punctuation) for CSS and SCSS, JS, JSX and TS, HTML and ActionScript, the colours from the pack's tk-code set: a pack that sets none paints code in its own text inks, so the wireframe reads as code in greys and a weight. Without a `language` it is inferred; `text` turns highlighting off. Screen readers hear the code as written.",
      },
    },
  },
  argTypes: {
    code: { control: "text" },
    label: { control: "text" },
    language: { control: "text" },
  },
  args: {
    label: "A component's rule, reading only tokens",
    language: "css",
    code: ':where([data-tk="button"]) {\n  background: var(--tk-action-fill);\n  color: var(--tk-action-text);\n  border-radius: var(--tk-radius-button);\n}',
  },
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Wrapping: Story = {
  name: "A long line wraps",
  parameters: { docs: { description: { story: "In an 18rem box a long selector wraps at the box instead of scrolling sideways." } } },
  args: {
    label: "A selector from 2014",
    code: ".page .main .card .card-body .actions .btn.btn-primary:hover { background: #2a6ab0 !important; }",
  },
  render: (args) => (
    <div style={{ maxInlineSize: "18rem" }}>
      <Code {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Code laid over this one: the default snippet, 480 wide." } },
    onion: { component: "Code", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 480 }}>
      <Code {...args} />
    </div>
  ),
};

const SNIPPETS: [string, string | undefined, string][] = [
  ["CSS", "css", '@container (inline-size > 30rem) {\n  :where([data-tk="card-body"]) { columns: 2; }\n}'],
  ["JSX", "jsx", "render() {\n  return <Button onClick={this.save}>Save</Button>;\n}"],
  ["A state machine", "js", 'const save = {\n  idle: { SUBMIT: "busy" },\n  busy: { DONE: "saved", FAIL: "error" },\n};'],
  ["HTML", "html", '<table width="800"><tr>\n  <td><img src="spacer.gif" width="20"></td>\n</tr></table>'],
  ["SCSS", "scss", "@media (max-width: 768px) {\n  .nav > li > a:hover { color: $brand !important; } // why\n}"],
  ["No language given: inferred", undefined, ".card {\n  padding: var(--tk-space-4); /* from the scale */\n}"],
];

export const Languages: Story = {
  name: "Highlighting by language",
  parameters: {
    docs: {
      description: {
        story:
          "One snippet per family. Switch the pack in the toolbar: the wireframe tells the kinds apart in greys and a weight; the tk pack puts violet on the words of the language and mint on the values written in it.",
      },
    },
  },
  render: () => (
    <div style={{ display: "grid", gap: "var(--tk-space-5)", maxInlineSize: "40rem" }}>
      {SNIPPETS.map(([label, language, code]) => (
        <Code key={label} label={label} language={language} code={code} />
      ))}
    </div>
  ),
};

export const TkPack: Story = {
  name: "In the tk pack",
  parameters: { docs: { description: { story: "The same three snippets in the tk pack's code colours." } } },
  render: () => (
    <div data-brand="tk" style={{ display: "grid", gap: "var(--tk-space-5)", maxInlineSize: "40rem", padding: "var(--tk-space-5)", background: "var(--tk-surface-base)" }}>
      {SNIPPETS.slice(0, 3).map(([label, language, code]) => (
        <Code key={label} label={label} language={language} code={code} />
      ))}
    </div>
  ),
};
