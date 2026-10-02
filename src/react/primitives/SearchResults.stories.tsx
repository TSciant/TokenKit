import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchResults, type SearchResultItem } from "./SearchResults";

const SAMPLE: SearchResultItem[] = [
  {
    id: "1",
    title: "Search results and how they wrap",
    description: "How a long snippet truncates while the type chip holds its row.",
    type: "Insight",
    meta: "12 min read",
    href: "#",
  },
  {
    id: "2",
    title: "Container queries overview",
    description: "Cascade layers, container queries, and scope.",
    type: "Service",
    meta: "Practice area",
    href: "#",
  },
  {
    id: "3",
    title: "Density and spacing contract",
    description: "One ramp, one multiplier, and a pointer floor.",
    type: "Client",
    meta: "Segment",
    href: "#",
  },
  {
    id: "4",
    title: "Concentric corners workshop",
    description: "Annual convening on radius arithmetic.",
    type: "Event",
    meta: "Oct 14 Studio",
    href: "#",
  },
  {
    id: "5",
    title: "Cascade layers briefing",
    description: "Precedence settled before specificity is consulted.",
    type: "Insight",
    meta: "8 min read",
    href: "#",
  },
  {
    id: "6",
    title: "Contact the systems lead",
    description: "Route a question to whoever owns that token.",
    type: "Page",
    meta: "Contact",
    href: "#",
  },
];

const meta = {
  title: "04 Primitives/11 Search results",
  component: SearchResults,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Gorgeous results list with type chips and plain text includes-filter. No fuzzy library — predictable, fast, easy to reason about. Use for: Search hit lists with type tags and a simple includes filter. Don't use for: Site-wide nav, autocomplete that must hit an API (wire that outside), or card grids that are not search results.",
      },
    },
  },
  args: { items: SAMPLE },
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Prefiltered: Story = {
  args: { defaultQuery: "corners" },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 640px it is drawn at. Switch Onion in the toolbar." } },
    onion: { component: "SearchResults", skin: () => "default.png" },
  },
  decorators: [(Story) => <div style={{ inlineSize: 640 }}><Story /></div>],
};
