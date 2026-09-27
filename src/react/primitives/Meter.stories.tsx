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
