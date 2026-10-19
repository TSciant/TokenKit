import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Panel } from "./Panel";

const meta = {
  title: "04 Primitives/79 Panel",
  component: Panel,
  parameters: {
    docs: {
      description: {
        component:
          "A page's one prominent message, in two kinds. Confirmation: the task is done, at the top of a confirmation page, with the reference large enough to note down; say what happens next on the page under it, and offer a way to give feedback. Interruption: the journey pauses before a likely mistake (the reader can go on without changing their answer, unlike an error), before something serious that cannot be undone, or to show something important that was missed; the inverse surface, a heading that says it is an interruption, a little content, one Button to go on and one link to go back, and nothing else on the page. Use interruptions sparingly: seen often, they stop being seen, and a journey that needs many should be redesigned. Don't use an interruption for terms to agree to, for content the reader sees every time, or with form fields inside it. Neither kind is announced as it loads, so the heading must say what is going on.",
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["confirmation", "interruption"] },
    title: { control: "text" },
    headingLevel: { control: "inline-radio", options: [1, 2] },
    reference: { control: "text" },
    referenceLabel: { control: "text" },
    actions: { control: false },
    children: { control: false },
  },
  args: {
    variant: "confirmation",
    title: "Application complete",
    headingLevel: 1,
    reference: "HDJ2123F",
    referenceLabel: "Your reference number",
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmation: Story = {};

export const Interruption: Story = {
  args: {
    variant: "interruption",
    title: "Check your salary",
    reference: undefined,
    children: (
      <>
        <p>You said your yearly salary is £1,500,000. That is much higher than most people applying.</p>
        <p>If it is right, you can carry on. If not, go back and change it.</p>
      </>
    ),
    actions: (
      <>
        <Button>Yes, this is correct</Button>
        <a href="#income">Go back to income details</a>
      </>
    ),
  },
};

export const ConfirmationPage: Story = {
  name: "Confirmation page",
  parameters: { docs: { description: { story: "The panel, then what happens next and how long it takes, then a way to give feedback." } } },
  render: (args) => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "40rem" }}>
      <Panel {...args} />
      <p style={{ margin: 0 }}>We have sent you a confirmation email.</p>
      <h2 style={{ margin: 0 }}>What happens next</h2>
      <p style={{ margin: 0 }}>We have sent your application to be checked. We will contact you within 10 working days to tell you what happens next.</p>
      <p style={{ margin: 0 }}>
        <a href="#feedback">What did you think of this service?</a> (takes 30 seconds)
      </p>
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Panel laid over this one: the confirmation, 480 wide." } },
    onion: { component: "Panel", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 480 }}>
      <Panel {...args} />
    </div>
  ),
};
