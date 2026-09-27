import type { Meta, StoryObj } from "@storybook/react-vite";
import { Shell } from "./Shell";

/**
 * Shells. Every knob is an attribute, not a class — a coordinate on an axis
 * rather than a branch. Three axes at four, ten and four positions is eighteen
 * CSS rules; the class-per-variant equivalent is a hundred and sixty.
 */
const meta = {
  title: "03 Foundations/03 Composition",
  component: Shell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A shell answers one question: how children sit relative to each other. It never styles a child and never sets colour or type. Any shell may contain any shell — a component is a shell holding primitives, a page is a shell holding components, and there is no third mechanism. Use for: Composing how children sit (stack, row, inline, grid, split, sidebar, center) with gap and container cues only. Don't use for: Painting look-and-feel (color, type, chrome live on primitives and packs), or inventing a second layout system beside Shell.",
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: "Slot — composed elements, not text.",
    },
    kind: {
      control: "select",
      options: ["stack", "row", "inline", "grid", "split", "sidebar", "center"],
    },
    gap: { control: { type: "range", min: 0, max: 9, step: 1 } },
    cols: { control: "inline-radio", options: [1, 2, 3, 4] },
    fixed: { control: "boolean" },
    side: { control: "inline-radio", options: [undefined, "start", "end"] },
    width: { control: "inline-radio", options: [undefined, "narrow", "wide"] },
    container: { control: "boolean" },
  },
  args: { kind: "grid", gap: 4, cols: 3 },
  render: (args) => (
    <div className="tk-stage">
      <Shell {...args}>
        {Array.from({ length: 6 }, (_, i) => (
          <div className="tk-cell" key={i}>
            {i + 1}
          </div>
        ))}
      </Shell>
    </div>
  ),
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Stack: Story = { args: { kind: "stack", gap: 3 } };
export const Row: Story = { args: { kind: "row", gap: 3 } };
export const Inline: Story = { args: { kind: "inline", gap: 2 } };
export const Grid: Story = { args: { kind: "grid", gap: 4, cols: 3 } };
export const Split: Story = { args: { kind: "split", gap: 4 } };
export const SidebarRail: Story = {
  name: "Sidebar",
  args: { kind: "sidebar", gap: 5 },
};
export const Center: Story = { args: { kind: "center", gap: 4 } };

export const GridCollapses: Story = {
  name: "Grid — auto-fit vs fixed",
  args: { kind: "grid", gap: 4, cols: 3 },
  render: (args) => (
    <div data-shell="stack" data-gap="5">
      <div>
        <p className="tk-doc-sub">auto-fit — collapses on available width</p>
        <div className="tk-stage">
          <Shell {...args}>
            {Array.from({ length: 6 }, (_, i) => (
              <div className="tk-cell" key={i}>
                {i + 1}
              </div>
            ))}
          </Shell>
        </div>
      </div>
      <div>
        <p className="tk-doc-sub">data-fixed — holds the column count</p>
        <div className="tk-stage">
          <Shell {...args} fixed>
            {Array.from({ length: 6 }, (_, i) => (
              <div className="tk-cell" key={i}>
                {i + 1}
              </div>
            ))}
          </Shell>
        </div>
      </div>
    </div>
  ),
};
