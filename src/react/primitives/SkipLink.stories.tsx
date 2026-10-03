import type { Meta, StoryObj } from "@storybook/react-vite";
import { SkipLink } from "./SkipLink";

const meta = {
  title: "04 Primitives/21 Skip link",
  component: SkipLink,
  argTypes: {
    href: { control: "text", description: "The landmark it jumps to." },
    children: { control: "text" },
  },
  args: { href: "#main", children: "Skip to main content" },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Skip to main content; hidden until focused. Use for: every page chrome. Don't use for: in-flow nav links, or as a substitute for landmarks.",
      },
    },
  },
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusToShow: Story = {
  name: "Focus to show",
  render: (args) => (
    <div data-shell="stack" data-gap="4">
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Tab once (or focus the control) — the skip link appears. Intentional hard radius; page chrome outside the concentric product chain.
      </p>
      <SkipLink {...args} />
      <main id="main" tabIndex={-1} style={{ padding: "var(--tk-space-4)", border: "1px dashed var(--tk-line-default)" }}>
        Main landmark
      </main>
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma component laid over this one in its focused state, the only one there is to see. A screenshot cannot Tab, so the story forces the state with an inline style: no transform, and the focus ring. Switch Onion in the toolbar." } },
    onion: { component: "SkipLink", target: "root", skin: () => "default.png" },
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", inlineSize: 203, blockSize: 68 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <SkipLink {...args} style={{ transform: "none", outline: "var(--tk-focus-width) solid var(--tk-focus-color)", outlineOffset: "var(--tk-focus-offset)" }} />
  ),
};
