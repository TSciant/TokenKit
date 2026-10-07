import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, type TextStyle } from "./Heading";

const STYLES: { text: TextStyle; use: string; sample: string }[] = [
  { text: "display", use: "The top line of a landing page", sample: "Tokens, not templates" },
  { text: "title", use: "A page's title; the h1 default", sample: "Release notes" },
  { text: "heading-l", use: "A section; the h2 default", sample: "What changed" },
  { text: "heading-m", use: "A subsection; the h3 default", sample: "Fields" },
  { text: "heading-s", use: "A small group, a card's title; the h4 default", sample: "Character count" },
  { text: "heading-xs", use: "The smallest heading; the h5 default", sample: "Known issues" },
  { text: "eyebrow", use: "A label over a title; the h6 default", sample: "Version 2.0" },
  { text: "lead", use: "The paragraph that says what a page is for", sample: "Forms check themselves, and every pack has link colours." },
  { text: "body", use: "Running text", sample: "A count appears under the field once a limit is set, and speaks only near it." },
  { text: "small", use: "Secondary text, hints, metadata", sample: "Updated 5 October 2026" },
  { text: "caption", use: "Fine print, credits; sparingly", sample: "Photograph: the kit's own plate" },
  { text: "metric", use: "A number that is the point", sample: "1,092" },
];

const meta = {
  title: "04 Primitives/33 Heading",
  component: Heading,
  parameters: {
    docs: {
      description: {
        component:
          "A heading whose level and look are chosen separately. `level` is the outline: one h1 per page, no skipped levels, what a screen reader lists. `text` is how it looks, one of the kit's text styles (size, leading, tracking and weight together). Leave `text` unset and the level's own style applies. The styles also work on any element as `data-text` (a lead paragraph, a metric). Use for: page and section headings, and text that needs a style without the CSS. Don't use for: choosing a level by its size.",
      },
    },
  },
  argTypes: {
    level: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
    text: { control: "select", options: [undefined, ...STYLES.map((s) => s.text)] },
    children: { control: "text" },
  },
  args: { level: 2, children: "What changed" },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every style, on a paragraph, so the level never enters into it. */
export const TextStyles: Story = {
  name: "Text styles",
  parameters: {
    docs: { description: { story: "The twelve styles, each on a paragraph with `data-text`, with what it is for. Switch the pack in the toolbar: a pack changes the faces, the top of the size ramp, leading and tracking, and every style follows." } },
  },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "48rem" }}>
      {STYLES.map((s) => (
        <div key={s.text} data-shell="stack" data-gap="1">
          <p data-text="caption" style={{ margin: 0, color: "var(--tk-text-secondary)", fontFamily: "var(--tk-font-mono)" }}>
            data-text=&quot;{s.text}&quot; · {s.use}
          </p>
          <p data-text={s.text} style={{ margin: 0 }}>
            {s.sample}
          </p>
        </div>
      ))}
    </div>
  ),
};

/** Level for the outline, text for the look. */
export const LevelAndLook: Story = {
  name: "Level and look",
  parameters: {
    docs: { description: { story: "A page whose outline needs an h2 for each section, where one section is a small aside. The aside is still an h2, so a screen reader's list of headings has it at the right depth; it looks like a heading-s." } },
  },
  render: () => (
    <div data-shell="stack" data-gap="4" style={{ maxInlineSize: "40rem" }}>
      <Heading level={1}>Release notes</Heading>
      <p data-text="lead" style={{ margin: 0 }}>Forms check themselves, and every pack has link colours.</p>
      <Heading level={2}>What changed</Heading>
      <p style={{ margin: 0 }}>Fields size to their answer, count characters and show a password on request.</p>
      <Heading level={2} text="heading-s">Thanks</Heading>
      <p style={{ margin: 0 }}>To everyone who reported a field that was too wide.</p>
    </div>
  ),
};

/** One line in each style, for the Figma TextStyles component to be laid over. */
export const OnionSkinTextStyles: Story = {
  name: "Onion skin: text styles (Figma)",
  parameters: {
    docs: { description: { story: "One line in each of the twelve styles at 768px, for the Figma TextStyles component (one text per tk/ text style) to be laid over. Figma rounds a percentage line height per line, so a style can differ by a fraction of a pixel." } },
    onion: { component: "TextStyles", target: "root", skin: () => "default.png" },
  },
  render: () => (
    <div data-shell="stack" data-gap="4" style={{ inlineSize: 768 }}>
      {STYLES.map((s) => (
        <p key={s.text} data-text={s.text} style={{ margin: 0, maxInlineSize: "none", color: "var(--tk-text-primary)" }}>
          {s.sample}
        </p>
      ))}
    </div>
  ),
};
