import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tachometer } from "./Tachometer";

const meta = {
  title: "04 Primitives/14 Tachometer",
  component: Tachometer,
  parameters: {
    docs: {
      description: {
        component:
          "Token-driven dial from QD/OutsideIn (P-12). Needle and glow resolve from --tk-* tokens. Canvas is decorative; role=meter + live text carry the accessible value. prefers-reduced-motion freezes the needle. Use for: Banded performance dials (risk, readiness, score ranges). Don't use for: Simple progress (Meter), or a single unlabeled decorative circle.",
      },
    },
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    animated: { control: "boolean" },
  },
  args: { value: 0.72, label: "ALIGN", reading: "72%", animated: true },
} satisfies Meta<typeof Tachometer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: "28rem", blockSize: "22rem" }}>
      <Tachometer {...args} />
    </div>
  ),
};

export const AutoCycle: Story = {
  args: { value: undefined, label: undefined, reading: undefined, animated: true },
  render: (args) => (
    <div style={{ maxInlineSize: "28rem", blockSize: "22rem" }}>
      <Tachometer {...args} />
    </div>
  ),
};

export const Pegged: Story = {
  args: { value: 0.92, label: "MEANT", reading: "≈Got", animated: false },
  render: (args) => (
    <div style={{ maxInlineSize: "28rem", blockSize: "22rem" }}>
      <Tachometer {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { value: 0.72, label: "ALIGN", reading: "72%", animated: false },
  parameters: {
    docs: { description: { story: "The Figma stand-in laid over this one: a picture of the dial at rest (needle at 72%, then pegged at 92%), because a canvas drawn in script is not a layout Figma can draw. Needle and glow are frozen so the picture is repeatable. Switch Onion in the toolbar." } },
    onion: { component: "Tachometer", target: "root", skin: (a: Record<string, unknown>) => (a.value === 0.92 ? "pegged.png" : "default.png") },
  },
  render: (args) => (
    <div style={{ inlineSize: "28rem", blockSize: "22rem" }}>
      <Tachometer {...args} />
    </div>
  ),
};
