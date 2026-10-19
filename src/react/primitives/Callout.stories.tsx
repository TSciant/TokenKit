import type { Meta, StoryObj } from "@storybook/react-vite";
import { Callout } from "./Callout";

const meta = {
  title: "04 Primitives/77 Callout",
  component: Callout,
  parameters: {
    docs: {
      description: {
        component:
          "A block set apart from the body text, in two strengths. Inset text: content that should stand out but that a reader will be fine without, marked by a thick rule and no fill. Warning: what a reader must not miss (time-critical, could affect someone's safety, money or rights, or corrects a common mistake), with a short specific heading, the warning icon and a full border on the warning surface. At most two warnings on a page; put a paragraph between two callouts, and give the text after one its own heading. Don't use for a status message about something that just happened (an Alert or a Toast), or in a form's questions. Both carry a hidden label (\"Information\", \"Important\"), so a screen reader hears where the callout starts; a warning heading that already says important does without. Neither is a live region: a callout is content, there when the page loads.",
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["inset", "warning"] },
    title: { control: "text" },
    headingLevel: { control: "inline-radio", options: [2, 3, 4] },
    label: { control: "text" },
    children: { control: false },
  },
  args: {
    variant: "inset",
    headingLevel: 3,
    children: <p>If you renew early, the months left on your old passport are not added to the new one.</p>,
  },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Travelling in the next 3 weeks",
    children: <p>Apply by phone instead. An application made online can take up to 3 weeks, and it cannot be sped up once it has started.</p>,
  },
};

export const InPage: Story = {
  name: "In a page",
  parameters: {
    docs: {
      description: {
        story: "Each in its place: inset text beside the paragraph it qualifies, a warning with a paragraph before it and a heading after it.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "40rem" }}>
      <h2 style={{ margin: 0 }}>How long it takes</h2>
      <p style={{ margin: 0 }}>Most renewals arrive within 3 weeks. It can take longer if we need more information from you.</p>
      <Callout>
        <p>If you renew early, the months left on your old passport are not added to the new one.</p>
      </Callout>
      <p style={{ margin: 0 }}>You can track your application with the reference number in your confirmation email.</p>
      <Callout variant="warning" title="Important: do not book travel yet">
        <p>Wait until your new passport arrives. We cannot speed up an application once it has started.</p>
      </Callout>
      <h2 style={{ margin: 0 }}>Getting a photo</h2>
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Callout laid over this one: the warning, 480 wide." } },
    onion: { component: "Callout", target: "root", skin: () => "default.png" },
  },
  args: {
    variant: "warning",
    title: "Travelling in the next 3 weeks",
    /* A sentence a line, so Figma (which sets this face a touch wider) wraps where the code does. */
    children: (
      <p>
        Apply by phone instead.
        <br />
        An application made online can take up to 3 weeks.
      </p>
    ),
  },
  render: (args) => (
    <div style={{ inlineSize: 480 }}>
      <Callout {...args} />
    </div>
  ),
};
