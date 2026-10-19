import type { Meta, StoryObj } from "@storybook/react-vite";
import { Guidance, GuidancePair } from "./Guidance";
import { LinkList } from "./LinkList";
import { SectionHeading } from "./SectionHeading";

const meta = {
  title: "04 Primitives/43 Section heading",
  component: SectionHeading,
  parameters: {
    docs: {
      description: {
        component:
          "The heading of one section of a page: an optional eyebrow, the heading, a sentence or two of introduction, and a link to everything of its kind at the end of the row. It introduces the content set below it and owns no surface, so a page of sections reads as an outline. h2 by default, h3 inside a section. Not the page's title, which is the page header's h1.",
      },
    },
  },
  argTypes: {
    eyebrow: { control: "text" },
    title: { control: "text" },
    headingLevel: { control: "inline-radio", options: [2, 3] },
    level: { control: false, table: { category: "Deprecated" }, description: "Use headingLevel." },
    children: { control: "text", description: "The introduction: a sentence or two." },
    action: { control: "object" },
    align: { control: "inline-radio", options: ["start", "center"] },
  },
  args: {
    eyebrow: "Insights",
    title: "Latest reports and briefs",
    headingLevel: 2,
    children: "Research and analysis from the team, newest first.",
    action: { label: "All insights", href: "#main" },
    align: "start",
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Centred: Story = {
  args: { align: "center", action: undefined, eyebrow: undefined, title: "How we work", children: "Three steps from first call to a plan you can act on." },
};

export const OverItsContent: Story = {
  name: "Over its content",
  parameters: { docs: { description: { story: "A section heading heads what follows: here, a list of links, which needs no title of its own." } } },
  render: (args) => (
    <div data-shell="stack" data-gap="4">
      <SectionHeading {...args} />
      <LinkList
        columns={2}
        items={[
          { label: "Annual report", href: "#main" },
          { label: "Quarterly brief", href: "#main" },
          { label: "Research notes", href: "#main" },
          { label: "Data downloads", href: "#main" },
        ]}
      />
    </div>
  ),
};

export const UsingSectionHeadings: Story = {
  name: "Using section headings",
  render: () => (
    <GuidancePair>
      <Guidance tone="do" note="Keep the introduction to a sentence or two that says what the section holds. A reader decides from it whether to read on.">
        <SectionHeading title="Upcoming events">Webinars and briefings for the next three months.</SectionHeading>
      </Guidance>
      <Guidance tone="dont" note="Don't set a heading on its own band of colour away from what it heads. Two regions read as two things; the heading belongs to its section.">
        <div style={{ padding: "var(--tk-space-4)", background: "var(--tk-surface-sunken)" }}>
          <SectionHeading title="Upcoming events" />
        </div>
      </Guidance>
    </GuidancePair>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma SectionHeading laid over this one: eyebrow, title, a line of text and the action, 800 wide." } },
    onion: { component: "SectionHeading", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 800 }}>
      <SectionHeading {...args} />
    </div>
  ),
};
