import type { Meta, StoryObj } from "@storybook/react-vite";
import { CaseStudy } from "./CaseStudy";

const meta = {
  title: "04 Primitives/48 Case study",
  component: CaseStudy,
  parameters: {
    docs: {
      description: {
        component:
          "One piece of work told as a story: who it was for, what was wrong, what was done and what came of it. The parts are a description list, the results a row of figures, and the whole an article, because it stands on its own. A grid of case-study teasers is a card collection, each with its summary and link only.",
      },
    },
  },
  argTypes: {
    client: { control: "text" },
    title: { control: "text" },
    summary: { control: "text" },
    parts: { control: "object" },
    results: { control: "object" },
    link: { control: "object" },
    level: { control: "inline-radio", options: [2, 3] },
  },
  args: {
    client: "Regional services provider",
    title: "Shorter waits by planning around demand",
    summary: "A provider with long queues at peak times, and a schedule built for the quiet ones.",
    parts: [
      { label: "Challenge", body: "Demand peaked on two days a week, and the schedule spread staff evenly across five." },
      { label: "Approach", body: "We measured demand by hour for a quarter, then rebuilt the rota around it with the people who work it." },
      { label: "Outcome", body: "Peak queues fell within a month, with no change to total hours." },
    ],
    results: [
      { value: "38%", label: "shorter peak waits" },
      { value: "0", label: "extra staff hours" },
      { value: "4 weeks", label: "from start to new rota" },
    ],
    link: { label: "Read the full story", href: "#main" },
    level: 3,
  },
} satisfies Meta<typeof CaseStudy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Teaser: Story = {
  parameters: { docs: { description: { story: "Summary and link only: how each one appears in a collection." } } },
  args: { parts: undefined, results: undefined },
};
