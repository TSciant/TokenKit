import type { Meta, StoryObj } from "@storybook/react-vite";
import { DrawerPanel } from "./Drawer";
import { Field } from "./Field";

const meta = {
  title: "04 Primitives/38 Drawer panel",
  component: DrawerPanel,
  parameters: {
    docs: {
      description: {
        component:
          "The panel a Drawer draws, in place in the page: for guidance and documentation, since a real drawer sits in the top layer over everything, one at a time. It takes the height of what holds it. It has no focus handling and no role, so it is not a way to build a drawer.",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    children: { control: false },
    actions: { control: "object" },
    footer: { control: false },
    side: { control: "inline-radio", options: ["end", "start", "bottom"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  args: {
    title: "Filters",
    description: "Narrow the list; the count on the button says how many are left.",
    actions: [{ label: "Clear", variant: "outline" }, { label: "Show 24 results", variant: "solid" }],
    side: "end",
    size: "md",
  },
  render: (args) => (
    <div style={{ blockSize: 480, display: "flex", flexDirection: "column" }}>
      <DrawerPanel {...args}>
        <Field label="Sort by" control="select" options={[{ value: "new", label: "Newest first" }]} />
      </DrawerPanel>
    </div>
  ),
} satisfies Meta<typeof DrawerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
