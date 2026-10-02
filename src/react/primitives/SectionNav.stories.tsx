import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionNav, type SectionNavItem } from "./SectionNav";

const ITEMS: SectionNavItem[] = [
  { label: "Overview", href: "#overview" },
  { label: "Specifications", href: "#specifications", current: true },
  { label: "Compatibility", href: "#compatibility" },
  { label: "Downloads", href: "#downloads" },
  { label: "Support", href: "#support" },
];

const MANY: SectionNavItem[] = [
  ...ITEMS,
  { label: "Release notes", href: "#release-notes" },
  { label: "Accessibility", href: "#accessibility" },
  { label: "Licensing", href: "#licensing" },
  { label: "Contact", href: "#contact" },
];

const meta = {
  title: "04 Primitives/26 Section nav",
  component: SectionNav,
  parameters: {
    docs: {
      description: {
        component:
          "Local navigation: the pages beside this one, in a row under a hairline. Use for: the siblings in the section you are in (a product's overview, specs and support; a brand's pages) so the masthead does not have to carry them. Don't use for: the site's primary navigation (use the masthead), the steps of a form, or switching views on one page (those are tabs, which are buttons). It fills its container and scrolls sideways instead of wrapping, so one line stays one line. The current page is aria-current, which is also what marks it.",
      },
    },
  },
  argTypes: { label: { control: "text" }, items: { control: "object" } },
  args: { label: "In this section", items: ITEMS },
  decorators: [(Story) => <div style={{ inlineSize: 720 }}><Story /></div>],
} satisfies Meta<typeof SectionNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overflowing: Story = {
  name: "Too many to fit",
  args: { items: MANY },
  parameters: { docs: { description: { story: "Nine links in a 420px box. The row scrolls sideways; it does not wrap and it does not truncate a label." } } },
  decorators: [(Story) => <div style={{ inlineSize: 420 }}><Story /></div>],
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 720px width it was drawn at. Switch Onion in the toolbar." } },
    onion: { component: "SectionNav", skin: () => "default.png" },
  },
};
