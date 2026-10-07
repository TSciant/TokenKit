import type { Meta, StoryObj } from "@storybook/react-vite";
import { RailNav, type RailNavItem } from "./RailNav";

const ITEMS: RailNavItem[] = [
  {
    label: "Getting started",
    open: true,
    items: [
      { label: "Overview", href: "#overview" },
      { label: "Current page with a longer label that wraps", href: "#current", current: true },
    ],
  },
  { label: "Reference", href: "#reference" },
  { label: "Guides", items: [{ label: "Tokens", href: "#tokens" }, { label: "Components", href: "#components" }] },
  { label: "Settings", href: "#settings" },
];

const meta = {
  title: "04 Primitives/25 Rail nav",
  component: RailNav,
  parameters: {
    docs: {
      description: {
        component:
          "Category navigation for a side rail. Use for: a right or left rail of sections, a docs or guide index, a drawer's list of categories. Don't use for: the site's primary navigation (use the masthead), or a menu of actions (use buttons). It fills its container, so the rail's width is the page's decision, not the viewport's. Groups are native details elements and work without script; the current page is aria-current, which is also what bolds it. Inset radius is concentric with the outer: radius-lg minus the gap.",
      },
    },
  },
  argTypes: { title: { control: "text" }, items: { control: "object" } },
  args: { title: "Categories", items: ITEMS },
  decorators: [(Story) => <div style={{ inlineSize: 280 }}><Story /></div>],
} satisfies Meta<typeof RailNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InAWiderRail: Story = {
  name: "Wider container",
  parameters: { docs: { description: { story: "The same component in a 420px container. Nothing about the viewport changed: the rail is as wide as it is put." } } },
  decorators: [(Story) => <div style={{ maxInlineSize: 420 }}><Story /></div>],
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 280px width it was drawn at. Switch Onion in the toolbar." } },
    onion: { component: "RailNav", skin: () => "default.png" },
  },
};
