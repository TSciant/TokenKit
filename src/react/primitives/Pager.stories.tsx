import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pager } from "./Pager";

const meta = {
  title: "04 Primitives/41 Pager",
  component: Pager,
  parameters: {
    docs: {
      description: {
        component:
          "The way through a long list, a page at a time: worded links back and on, absent (not disabled) at the ends, and where you are between them. With numbers, the first, the last and the pages either side of this one, with gaps marked; on a narrow container they fold back to \"Page 3 of 12\". Every page is a link with its own address. Not for steps through a form. Drawn from a members' message board built on the kit, GOV.UK, USWDS and Primer.",
      },
    },
  },
  argTypes: {
    page: { control: { type: "number", min: 1 } },
    total: { control: { type: "number", min: 1 } },
    href: { control: false },
    prevLabel: { control: "text" },
    nextLabel: { control: "text" },
    numbers: { control: "boolean" },
    label: { control: "text" },
  },
  args: { page: 3, total: 12, href: (n: number) => `#page-${n}`, prevLabel: "Newer conversations", nextLabel: "Older conversations", label: "More conversations" },
} satisfies Meta<typeof Pager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithNumbers: Story = {
  name: "With numbers",
  args: { numbers: true, page: 6, prevLabel: "Previous", nextLabel: "Next", label: "Results pages" },
};

export const Ends: Story = {
  name: "First and last page",
  parameters: { docs: { description: { story: "Nothing to go back to on the first page and nothing on after the last, so those links are not there; the count holds the middle." } } },
  render: (args) => (
    <div data-shell="stack" data-gap="5">
      <Pager {...args} page={1} label="More conversations, first page" />
      <Pager {...args} page={12} label="More conversations, last page" />
    </div>
  ),
};

/** Page 6 of 12 with numbers at 640px, for the Figma Pager to be laid over. */
export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { numbers: true, page: 6, prevLabel: "Previous", nextLabel: "Next", label: "Results pages" },
  parameters: {
    docs: { description: { story: "The Figma Pager laid over this one: page 6 of 12 with numbers, 640 wide." } },
    onion: { component: "Pager", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 640 }}>
      <Pager {...args} />
    </div>
  ),
};
