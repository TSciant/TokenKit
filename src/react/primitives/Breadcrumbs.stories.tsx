import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs } from "./Breadcrumbs";
import { Heading } from "./Heading";

const meta = {
  title: "04 Primitives/59 Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    docs: {
      description: {
        component:
          "Where this page sits: the pages above it, each a link, from the top of the site down. Use on sites more than two levels deep, where a reader may arrive from search and want to go up a level. Don't use for the steps of a form or for history. An ordered list in a landmark named Breadcrumb; the chevrons are drawn in CSS, so nothing is read between crumbs. In a box under 30rem the trail folds to the parent alone, as a back link.",
      },
    },
  },
  argTypes: {
    items: { control: "object" },
    current: { control: "text" },
    label: { control: "text" },
    collapse: { control: "boolean" },
  },
  args: {
    items: [
      { label: "Home", href: "#main" },
      { label: "Services", href: "#main" },
      { label: "Community programmes", href: "#main" },
    ],
    current: "Care coordination",
    label: "Breadcrumb",
    collapse: true,
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OverATitle: Story = {
  name: "Over a title",
  parameters: {
    docs: {
      description: {
        story: "In place, over the page's heading. The heading says the page's name, so the trail leaves it out (no current) and ends at the parent.",
      },
    },
  },
  args: { current: undefined },
  render: (args) => (
    <div data-shell="stack" data-gap="3" style={{ maxInlineSize: "44rem" }}>
      <Breadcrumbs {...args} />
      <Heading level={1} text="heading-l">
        Care coordination
      </Heading>
    </div>
  ),
};

export const Folded: Story = {
  name: "Folded, a narrow box",
  parameters: {
    docs: {
      description: {
        story: "The same trail in a 20rem box: only the parent shows, as a back link with the chevron turned to point up the trail. Turn collapse off and it wraps instead.",
      },
    },
  },
  render: (args) => (
    <div style={{ maxInlineSize: "20rem" }}>
      <Breadcrumbs {...args} />
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Breadcrumbs laid over this one: three links and the current page, 640 wide, unfolded." } },
    onion: { component: "Breadcrumbs", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 640 }}>
      <Breadcrumbs {...args} />
    </div>
  ),
};
