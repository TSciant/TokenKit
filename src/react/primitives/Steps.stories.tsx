import type { Meta, StoryObj } from "@storybook/react-vite";
import { Steps } from "./Steps";

const meta = {
  title: "04 Primitives/70 Steps",
  component: Steps,
  parameters: {
    docs: {
      description: {
        component:
          "Where a reader is in a process with a set order. Use for a form or task in a few fixed stages. Don't use for tasks done in any order (a TaskList), or more than about seven stages. An ordered list: a screen reader hears how many steps and which one this is; the current step is aria-current=\"step\" and every step says its status in words, so the check marks and rings are never the only telling. Finished steps can link back. In a box under 32rem the row becomes a column.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    steps: { control: "object" },
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    words: { control: "object" },
  },
  args: {
    label: "Apply for a grant",
    orientation: "horizontal",
    steps: [
      { label: "Eligibility", href: "#eligibility" },
      { label: "Your organisation", href: "#organisation" },
      { label: "The project", status: "current" },
      { label: "Budget" },
      { label: "Check and send" },
    ],
  },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Narrow: Story = {
  name: "A narrow box",
  render: (args) => (
    <div style={{ maxInlineSize: "20rem" }}>
      <Steps {...args} />
    </div>
  ),
};

export const WithProblem: Story = {
  name: "A step with a problem",
  args: {
    steps: [
      { label: "Eligibility", href: "#eligibility" },
      { label: "Your organisation", status: "error" },
      { label: "The project", status: "current" },
      { label: "Budget" },
    ],
  },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Steps laid over this one: step 3 of 5 current, 720 wide." } },
    onion: { component: "Steps", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 720 }}>
      <Steps {...args} />
    </div>
  ),
};
