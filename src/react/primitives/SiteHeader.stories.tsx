import type { Meta, StoryObj } from "@storybook/react-vite";
import { SiteHeader } from "./SiteHeader";
import { Search } from "./Search";

const meta = {
  title: "04 Primitives/20 Site header",
  component: SiteHeader,
  argTypes: {
    brand: { control: "text", description: "Wordmark slot." },
    nav: {
      control: "object",
      description: "Primary nav, as { label, href } rows.",
    },
    withMegaMenu: {
      control: "boolean",
      description: "Mega sheet on small boxes instead of a stacked restructure.",
    },
    actions: { control: false, description: "Slot — Search lives here." },
  },
  args: {
    brand: "Token Kit",
    nav: [
      { label: "Services", href: "#main" },
      { label: "About", href: "#main" },
      { label: "Insights", href: "#main" },
      { label: "Contact", href: "#main" },
    ],
    withMegaMenu: false,
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Site chrome with brand, nav, and optional mega sheet on small boxes. Use for: page header. Don't use for: in-page section titles, or a second mobile DOM (sheet, not Monty).",
      },
    },
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
  render: (args) => <SiteHeader {...args} actions={<Search />} />,
};

export const MegaSheet: Story = {
  name: "Mega sheet",
  args: { withMegaMenu: true },
  render: (args) => <SiteHeader {...args} actions={<Search />} />,
};

