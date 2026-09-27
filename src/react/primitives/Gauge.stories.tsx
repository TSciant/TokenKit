import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tachometer } from "./Tachometer";

/** Story kept under Gauge title redirects attention to Tachometer. */
const meta = {
  title: "04 Primitives/13 Gauge",
  component: Tachometer,
  parameters: {
    docs: {
      description: {
        component:
          "Alias story — the kit dial is Tachometer (tokenized QD lineage). Open Components/Tachometer for the full control set. Use for: A single radial reading against a scale when a dial reads clearer than a bar. Don't use for: Multi-band performance stories (Tachometer), or simple percent bars (Meter).",
      },
    },
  },
  args: { value: 0.64, label: "CQ", reading: "box" },
} satisfies Meta<typeof Tachometer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SeeTachometer: Story = {
  name: "Use Tachometer",
  render: (args) => (
    <div style={{ maxInlineSize: "28rem", blockSize: "22rem" }}>
      <Tachometer {...args} />
    </div>
  ),
};
