import type { Meta, StoryObj } from "@storybook/react-vite";
import { SiteHeader } from "./SiteHeader";
import { Search } from "./Search";
import { PhaseBanner } from "./PhaseBanner";

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
      description:
        "Mega sheet on small boxes instead of a stacked restructure.",
    },
    actions: { control: false, description: "Slot — Search lives here." },
    banner: {
      control: false,
      description: "Optional strip above the header: a PhaseBanner.",
    },
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
        component:
          "Site chrome with brand, nav, and optional mega sheet on small boxes. Use for: page header. Don't use for: in-page section titles, or a second mobile DOM (sheet, not Monty).",
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

export const WithPhaseBanner: Story = {
  name: "With a phase banner",
  parameters: {
    docs: {
      description: {
        story:
          "The optional banner slot: a PhaseBanner above the header saying the site is a prototype, a beta or a preview. See Phase banner for when to use one.",
      },
    },
  },
  render: (args) => (
    <SiteHeader
      {...args}
      actions={<Search />}
      banner={
        <PhaseBanner sticky={false} label="Prototype" title="Home">
          A clickable prototype for review. Content and links are placeholders.
        </PhaseBanner>
      }
    />
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  argTypes: {
    container: { control: "inline-radio", options: ["wide", "narrow"] },
  } as never,
  parameters: {
    docs: {
      description: {
        story:
          "The Figma component laid over this one. Container is the width the header sits in: wide is 960px, narrow is 800px, and below 56rem the nav is hidden by a container query on the header itself, so the same component answers to where it is put. Switch Onion in the toolbar; withMegaMenu shows the Menu button.",
      },
    },
    onion: {
      component: "SiteHeader",
      skin: (a: Record<string, unknown>) =>
        `${(a as { container?: string }).container ?? "wide"}-${a.withMegaMenu ? "true" : "false"}.png`,
    },
  },
  render: ({
    container = "wide",
    ...args
  }: Record<string, unknown> & { container?: string }) => (
    <div style={{ inlineSize: container === "narrow" ? 800 : 960 }}>
      <SiteHeader {...(args as object)} />
    </div>
  ),
};
