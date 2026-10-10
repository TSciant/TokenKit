import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArticleMeta } from "./ArticleMeta";
import { Heading } from "./Heading";

const meta = {
  title: "04 Primitives/53 Article meta",
  component: ArticleMeta,
  parameters: {
    docs: {
      description: {
        component:
          "The line under an article's title: what it is, when it was published (and updated), who wrote it, how long it takes and what it is about. One row that wraps, as a list, so a screen reader takes it a piece at a time; the dots between the pieces are drawn in CSS and read as nothing. Dates are time elements with the ISO date in datetime, written out in words for the locale. Not a place for actions: sharing and saving belong in their own row.",
      },
    },
  },
  argTypes: {
    type: { control: "text" },
    date: { control: "text" },
    dateLabel: { control: "text" },
    updated: { control: "text" },
    authors: { control: "object" },
    readingTime: { control: "text" },
    topics: { control: "object" },
    locale: { control: "inline-radio", options: ["en-US", "en-GB", "fr-FR", "de-DE"] },
  },
  args: {
    type: "Blog",
    date: "2026-09-08",
    authors: [{ name: "Alex Morgan", href: "#main" }],
    readingTime: "6 min read",
    topics: [{ label: "Research" }, { label: "Accessibility" }],
    locale: "en-US",
  },
} satisfies Meta<typeof ArticleMeta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const UnderATitle: Story = {
  name: "Under a title",
  parameters: {
    docs: {
      description: {
        story:
          "In place: the title above, the summary below. Updated since it was published, three authors written as a byline, and topics that each have a page, so they are links rather than chips.",
      },
    },
  },
  args: {
    type: "Report",
    date: "2026-06-30",
    updated: "2026-09-21",
    authors: [
      { name: "Sam Okafor", href: "#main" },
      { name: "Priya Nair", href: "#main" },
      { name: "Jordan Lee" },
    ],
    readingTime: "14 min read",
    topics: [
      { label: "Housing", href: "#main" },
      { label: "Local services", href: "#main" },
    ],
  },
  render: (args) => (
    <div data-shell="stack" data-gap="3" style={{ maxInlineSize: "44rem" }}>
      <Heading level={1} text="heading-l">
        What a year of shorter waits taught us about planning
      </Heading>
      <ArticleMeta {...args} />
      <p data-text="lead">
        Twelve months of measuring demand by the hour, and what changed when the schedule followed it.
      </p>
    </div>
  ),
};

export const Minimal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Only the date is required. Here it is given in words with dateLabel, for a piece where the exact day matters less than the season; the ISO date is still in the markup.",
      },
    },
  },
  args: {
    type: undefined,
    date: "2026-10-01",
    dateLabel: "Autumn 2026",
    authors: undefined,
    readingTime: "24 min listen",
    topics: undefined,
  },
};
