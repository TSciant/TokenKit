import type { Meta, StoryObj } from "@storybook/react-vite";
import { OnThisPage, type OnThisPageItem } from "./OnThisPage";

const ITEMS: OnThisPageItem[] = [
  { label: "Why a measure, not a width", href: "#why" },
  {
    label: "How the grid decides",
    href: "#grid",
    current: true,
    items: [
      { label: "Minimum tile width", href: "#min" },
      { label: "Gaps", href: "#gaps" },
    ],
  },
  { label: "Containers instead of breakpoints", href: "#containers" },
  { label: "What to test", href: "#test" },
];

const meta = {
  title: "04 Primitives/27 On this page",
  component: OnThisPage,
  parameters: {
    docs: {
      description: {
        component:
          "The contents of a long page, as a list of its headings. Use for: an article, guide or policy long enough to need a way back up, in a side rail beside it. Don't use for: moving between pages (use a section nav or the rail nav), or for a page short enough to read without it. The heading you are at is aria-current=location; marking it as the reader scrolls is the page's job, and this component draws what it is told. It fills its container.",
      },
    },
  },
  argTypes: { title: { control: "text" }, items: { control: "object" } },
  args: { title: "On this page", items: ITEMS },
  decorators: [(Story) => <div style={{ inlineSize: 240 }}><Story /></div>],
} satisfies Meta<typeof OnThisPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Narrow: Story = {
  name: "Narrow rail",
  parameters: { docs: { description: { story: "The same list in a 160px rail: long headings wrap inside it and the mark stays on the rule." } } },
  decorators: [(Story) => <div style={{ inlineSize: 160 }}><Story /></div>],
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 240px width it was drawn at. Switch Onion in the toolbar." } },
    onion: { component: "OnThisPage", skin: () => "default.png" },
  },
};
