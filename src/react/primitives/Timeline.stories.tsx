import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import type { ReactNode } from "react";
import { Code } from "./Code";
import { Plate } from "./Plate";
import { Timeline, type TimelineLane } from "./Timeline";

/* A product's year, in weeks: three threads that overlap, with two milestones. */
const PLAN: TimelineLane[] = [
  {
    label: "Research",
    items: [
      { start: 1, end: 6, label: "Interviews" },
      { start: 5, end: 10, label: "Synthesis" },
      { start: 10, label: "Findings shared" },
    ],
  },
  {
    label: "Design",
    items: [
      { start: 8, end: 20, label: "Wireframes", current: true, detail: <p style={{ margin: 0 }}>Grey, in the real components, tested with five people a fortnight.</p> },
      { start: 18, end: 30, label: "Brand pack" },
    ],
  },
  {
    label: "Build",
    items: [
      { start: 14, end: 40, label: "Components" },
      { start: 30, end: 48, label: "Pages" },
      { start: 48, label: "Launch" },
    ],
  },
];

const weeks = (v: number) => `Week ${v}`;

const meta = {
  title: "04 Primitives/63 Timeline",
  component: Timeline,
  parameters: {
    docs: {
      description: {
        component:
          "Things across time, in lanes: spans (a start and an end) and milestones (a single point), on one scale. Use for how several threads ran side by side and overlapped; not for one thread of dated events (an event list) or exact values to compare (a table). It is lists underneath: each lane a labelled group, each item a list item that says its dates in words; the bars and the axis are drawing, hidden from assistive technology. Items that overlap stack into rows. In a box under 40rem the drawing goes and the lists show. `view` is the window onto the scale, two registered numbers, so panning and zooming is a transition in the kit's motion. The current item is aria-current, which is also what draws it, and its detail (any content) shows under the chart. A change of current item is announced politely to a screen reader. Bars clear 3:1 on every surface; forced colours draw every mark in the system's ink. `datetime` writes a point as a time element only when it is a date; `words` translates what the timeline says for itself.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    start: { control: "number" },
    end: { control: "number" },
    step: { control: "number" },
    lanes: { control: "object" },
    view: { control: "object" },
    now: { control: "number" },
    nowLabel: { control: "text" },
    variant: { control: "inline-radio", options: ["lanes", "journey"] },
    reveal: { control: { type: "range", min: 0, max: 52, step: 0.5 } },
    tell: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    format: { control: false },
    datetime: { control: false },
    words: { control: "object" },
  },
  args: {
    label: "A product's year",
    start: 0,
    end: 52,
    step: 4,
    lanes: PLAN,
    now: 22,
    nowLabel: "Today",
    format: weeks,
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PanAndZoom: Story = {
  name: "Pan and zoom",
  parameters: {
    docs: {
      description: {
        story: "The same plan, a quarter at a time. Each button moves the view: two numbers change, and the kit's motion carries the chart across. With reduced motion it jumps.",
      },
    },
  },
  render: (args) => {
    const [view, setView] = useState<[number, number]>([0, 16]);
    return (
      <div data-shell="stack" data-gap="4">
        <div data-shell="inline" data-gap="2">
          {[0, 12, 24, 36].map((q) => (
            <Button key={q} size="sm" variant={view[0] === q ? "solid" : "outline"} aria-pressed={view[0] === q} onClick={() => setView([q, q + 16])}>
              {`Weeks ${q}–${q + 16}`}
            </Button>
          ))}
        </div>
        <Timeline {...args} view={view} step={2} />
      </div>
    );
  },
};

/* One milestone, its detail three ways: a milestone's detail is whatever
   the moment needs, not a feature of the timeline. */
const DETAILS: [string, ReactNode][] = [
  ["Text", <p style={{ margin: 0 }}>Grey, in the real components, with five people a fortnight.</p>],
  [
    "Code",
    <div style={{ display: "grid", gap: "var(--tk-space-3)" }}>
      <p style={{ margin: 0 }}>The card's padding came from the scale, not a number.</p>
      <Code label="CSS" language="css" code={":where([data-tk=\"card\"]) {\n  padding: var(--tk-space-4);\n}"} />
    </div>,
  ],
  [
    "Media",
    <div style={{ display: "grid", gap: "var(--tk-space-3)" }}>
      <p style={{ margin: 0 }}>Tested on the laptops the team actually uses.</p>
      <Plate ratio="16 / 9" seed={2} placement={false} label="The wireframe under test, on a laptop" />
    </div>,
  ],
];

export const MilestoneDetail: Story = {
  name: "A milestone's detail: any content",
  parameters: {
    docs: {
      description: {
        story:
          "The current milestone's detail is any content: a sentence, a sentence and a Code snippet, a Plate or a Figure. The Timeline lays it out and shows it while the milestone is current; what it holds is up to the story being told.",
      },
    },
  },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--tk-space-7)" }}>
      {DETAILS.map(([kind, detail]) => (
        <section key={kind} aria-label={kind} style={{ display: "grid", gap: "var(--tk-space-2)" }}>
          <p style={{ margin: 0, color: "var(--tk-text-secondary)", fontSize: "var(--tk-size-sm)" }}>{kind}</p>
          <Timeline
            {...args}
            label={`A product's year: ${kind.toLowerCase()} detail`}
            variant="journey"
            reveal={20.6}
            view={[8, 32]}
            step={4}
            now={undefined}
            lanes={[{ label: "Milestones", items: [{ start: 3, label: "First interviews" }, { start: 20, label: "Wireframes tested", current: true, detail }] }]}
          />
        </section>
      ))}
    </div>
  ),
};

export const Narrow: Story = {
  name: "A narrow box",
  parameters: {
    docs: { description: { story: "In a box under 40rem the chart becomes the lists it always was: each lane a heading and its items with their dates in words." } },
  },
  render: (args) => (
    <div style={{ maxInlineSize: "22rem" }}>
      <Timeline {...args} />
    </div>
  ),
};

/* A story told one moment at a time: the same plan as a journey. */
const TOLD: TimelineLane[] = [
  {
    label: "Moments",
    items: [
      { start: 3, label: "First interviews", side: "above" },
      { start: 10, label: "Findings shared", side: "below" },
      { start: 20, label: "Wireframes tested", side: "above", current: true, detail: <p style={{ margin: 0 }}>Grey, in the real components, with five people a fortnight.</p> },
      { start: 30, label: "Brand pack applied", side: "below" },
      { start: 48, label: "Launch", side: "above" },
    ],
  },
  {
    label: "Phases",
    items: [
      { start: 0, end: 10, label: "Research" },
      { start: 10, end: 30, label: "Design", current: true },
      { start: 30, end: 52, label: "Build" },
    ],
  },
];

export const Journey: Story = {
  name: "Journey: a story told as the line travels",
  parameters: {
    docs: {
      description: {
        story:
          "variant=\"journey\": one line. Milestones are dots on it; the current one unfolds into a callout (the dot lands, a stem draws, a rule runs out, the year rises from behind it, then the name and the detail) and folds back into its dot when the story moves on. Spans are phases in a band under the line. reveal is how far the story has got: the line is drawn to it, dots land as it reaches them, phases grow with it. Use the buttons: on a page each step is a transition in the kit's motion. Drag tell to scrub one milestone's telling, as a film does. A milestone placed below starts its stem under the band, so nothing is drawn across the axis.",
      },
    },
  },
  args: { variant: "journey", lanes: TOLD, reveal: 20.6, view: [8, 32], step: 4, now: undefined },
  render: (args) => {
    const [reveal, setReveal] = useState(args.reveal ?? 20.6);
    const stops = [3, 10, 20, 30, 48];
    const at = (r: number) => [Math.max(0, r - 16), Math.max(0, r - 16) + 24] as [number, number];
    return (
      <div data-shell="stack" data-gap="4">
        <div data-shell="inline" data-gap="2">
          {stops.map((w) => (
            <Button key={w} size="sm" variant="outline" onClick={() => setReveal(w + 0.6)}>
              {`Week ${w}`}
            </Button>
          ))}
        </div>
        <Timeline {...args} reveal={reveal} view={at(reveal)} lanes={TOLD.map((lane) => ({ ...lane, items: lane.items.map((it) => ({ ...it, current: it.end === undefined ? it.start === Math.max(...stops.filter((w) => w <= reveal)) : reveal >= it.start && reveal < it.end })) }))} />
      </div>
    );
  },
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Timeline laid over this one: the product year in lanes, Wireframes current, today at week 22, 960 wide." } },
    onion: { component: "Timeline", target: "root", skin: () => "default.png" },
  },
  render: (args) => (
    <div style={{ inlineSize: 960 }}>
      <Timeline {...args} />
    </div>
  ),
};

/* The journey held still: week 20 told in full, the line just past it. */
const STILL: TimelineLane[] = TOLD.map((lane) => ({
  ...lane,
  items: lane.items.map((it) => ({ ...it, current: it.end === undefined ? it.start === 20 : it.start === 10 })),
}));

export const OnionSkinJourney: Story = {
  name: "Onion skin (Figma): journey",
  parameters: {
    docs: { description: { story: "The Figma Timeline journey laid over this one: week 20 told, the line at 20.6, weeks 8 to 32 in view, 960 wide." } },
    onion: { component: "TimelineJourney", target: "root", skin: () => "default.png" },
  },
  args: { variant: "journey", lanes: STILL, reveal: 20.6, view: [8, 32], step: 4, now: undefined, tell: 1 },
  render: (args) => (
    <div style={{ inlineSize: 960 }}>
      <Timeline {...args} />
    </div>
  ),
};
