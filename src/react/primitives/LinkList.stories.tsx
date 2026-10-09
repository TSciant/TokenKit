import type { Meta, StoryObj } from "@storybook/react-vite";
import { Guidance, GuidancePair } from "./Guidance";
import { LinkList } from "./LinkList";

const ITEMS = [
  { label: "Strategy and planning", href: "#main" },
  { label: "Programme design", href: "#main" },
  { label: "Policy analysis", href: "#main" },
  { label: "Evaluation", href: "#main" },
  { label: "Process improvement", href: "#main" },
  { label: "Technology advice", href: "#main" },
];

const meta = {
  title: "04 Primitives/44 Link list",
  component: LinkList,
  parameters: {
    docs: {
      description: {
        component:
          "Links to other pages as short labels: the pages under a section, related reading, quick links. Each row is a whole link with an arrow at its end, ruled off from the next, and the list takes two or three columns when its container is wide enough. It sits in the content, not in a navigation landmark. When each link needs a picture or a paragraph, use a card collection.",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
    items: { control: "object" },
    columns: { control: "inline-radio", options: [1, 2, 3] },
  },
  args: { title: "Our services", items: ITEMS, columns: 2 },
} satisfies Meta<typeof LinkList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithDescriptions: Story = {
  name: "With descriptions",
  args: {
    title: "Related reading",
    columns: 1,
    items: [
      { label: "Getting started", href: "#main", description: "What to do first, and who to ask." },
      { label: "Planning a project", href: "#main", description: "Scope, timeline and budget, step by step." },
      { label: "Measuring results", href: "#main", description: "Which figures to track and how often." },
    ],
  },
};

export const UsingLinkLists: Story = {
  name: "Using link lists",
  render: () => (
    <GuidancePair>
      <Guidance tone="do" note="Label each link with where it goes, in the words of the page it opens. The arrow says it is a link; the label says which.">
        <LinkList items={ITEMS.slice(0, 3)} />
      </Guidance>
      <Guidance tone="dont" note="Don't give every row its own 'Explore' button. Six buttons with one label are six identical links to a screen reader, and the row itself is already the link.">
        <LinkList items={ITEMS.slice(0, 3).map((i) => ({ ...i, label: `${i.label} — Explore` }))} />
      </Guidance>
    </GuidancePair>
  ),
};
