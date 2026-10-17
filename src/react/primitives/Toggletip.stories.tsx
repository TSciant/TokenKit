import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggletip } from "./Tooltip";

const meta = {
  title: "04 Primitives/67 Toggletip",
  component: Toggletip,
  parameters: {
    docs: {
      description: {
        component:
          "A button that shows a short piece of information beside itself, and says it when it does. Use for an explanation a reader may want and most do not (\"Why do we ask this?\"). Don't use for anything every reader needs, or more than a few sentences (a Disclosure). Pressing it shows the bubble and puts its words into a polite live region, so a screen reader reads them without moving focus; pressing it again, Escape, or a press elsewhere closes it. It may hold a link, which a tooltip cannot.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    content: { control: "text" },
    placement: { control: "inline-radio", options: ["above", "below"] },
  },
  args: {
    label: "Why we ask for your date of birth",
    content: "We use it to check you're old enough to apply. We don't share it.",
    placement: "above",
  },
} satisfies Meta<typeof Toggletip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <p style={{ paddingBlockStart: "var(--tk-space-8)", display: "flex", alignItems: "center", gap: "var(--tk-space-1)" }}>
      Date of birth <Toggletip {...args} />
    </p>
  ),
};
