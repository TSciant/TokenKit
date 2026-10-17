import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "04 Primitives/66 Tooltip",
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          "A few words about a control, shown on hover and on focus. Use for the name of an icon-only button, or a short supplement to a control that already says what it does. Don't use for anything a reader needs (put it on the page), touch-only interfaces, rich content or links (a Toggletip), or anything that cannot take focus. GOV.UK has no tooltip at all for these reasons; this one exists for the icon-button case and meets WCAG 1.4.13: it stays while the pointer is over it, until focus leaves or Escape is pressed. `labels` makes the words the element's name instead of a description.",
      },
    },
  },
  argTypes: {
    content: { control: "text" },
    labels: { control: "boolean" },
    placement: { control: "inline-radio", options: ["above", "below"] },
    children: { control: false },
    open: { control: "boolean" },
  },
  args: {
    content: "Downloads a PDF, 2 MB",
    placement: "above",
    labels: false,
    children: <Button variant="outline">Annual report</Button>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ paddingBlock: "var(--tk-space-8)" }}>
      <Tooltip {...args} />
    </div>
  ),
};

export const IconButton: Story = {
  name: "The name of an icon-only button",
  parameters: { docs: { description: { story: "With `labels`, the tooltip is the button's accessible name: the one case a tooltip carries something a reader needs, which is why it shows on focus as well as hover." } } },
  args: { content: "Settings", labels: true, children: <Button variant="quiet"><Icon name="settings" /></Button> },
  render: (args) => (
    <div style={{ paddingBlock: "var(--tk-space-8)" }}>
      <Tooltip {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Tooltip laid over this one: open, above an outline button." } },
    onion: { component: "Tooltip", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    /* Room for the open bubble (its height and the gap above; half its overhang each side), so the measured box is the bubble and the button, as in Figma. */
    <div style={{ display: "inline-block", paddingBlockStart: 42.2, paddingInline: 23.15 }}>
      <Tooltip {...args} open />
    </div>
  ),
};
