import type { Meta, StoryObj } from "@storybook/react-vite";
import { Meter } from "./Meter";

const meta = {
  title: "04 Primitives/12 Meter",
  component: Meter,
  parameters: {
    docs: {
      description: {
        component:
          "The value is exposed three ways: as text, as ARIA state, and as width. Width alone communicates nothing to a screen reader and nothing to anyone comparing two bars by eye. Use for: Scalar progress toward a known maximum (completion, capacity). Don't use for: Categorical comparisons (use Gauge/Tachometer), or indeterminate spinners.",
      },
    },
  },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
  args: { label: "Coverage", value: 64 },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Range: Story = {
  render: () => (
    <div data-shell="stack" data-gap="4" style={{ maxInlineSize: "24rem" }}>
      {[0, 25, 64, 100].map((v) => (
        <Meter key={v} label={`At ${v}`} value={v} />
      ))}
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { label: "Label", value: 50 },
  argTypes: { value: { control: { type: "select" }, options: [0, 25, 50, 75, 100] } },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 240px width the design was drawn at. Switch Onion in the toolbar; value picks the skin (0, 25, 50, 75, 100)." } },
    onion: { component: "Meter", skin: (a: Record<string, unknown>) => `${a.value ?? 50}.png` },
  },
  render: (args) => <div style={{ inlineSize: 240 }}><Meter {...args} display={`${args.value}%`} /></div>,
};
