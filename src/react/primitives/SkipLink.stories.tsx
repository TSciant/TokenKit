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

