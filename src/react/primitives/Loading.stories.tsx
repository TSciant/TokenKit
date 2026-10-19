import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Skeleton, SkeletonGroup, Spinner } from "./Loading";

const meta = {
  title: "04 Primitives/81 Loading",
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component:
          "Two ways to say a wait is under way, without moving focus. Spinner when what is coming is unknown: an arc in the text's own colour and size, its words in one polite status region, shown only after a short delay so a quick load never flashes, and the end of the wait said too when it is not otherwise obvious. Name it with visible words (label), hidden words (a11yLabel) or mark it decorative when something else already says it; exactly one. Skeleton when the shape is known: lines, blocks and circles that stand for the content, in the text colour at a tenth, hidden from screen readers inside a SkeletonGroup that says what is loading. Don't use both at once, don't use skeletons for toasts, menus or dialogs, and don't use a spinner for a long wait: say how long instead. Inside a button, Button's busy. Both stop moving under reduced motion. From CMS, Paste, Orbit, PatternFly, Zendesk Garden, Pajamas, Carbon, AGDS and Helsinki.",
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["inherit", "sm", "md", "lg"] },
    placement: { control: "inline-radio", options: ["inline", "center"] },
    loading: { control: "boolean" },
    delay: { control: "number" },
  },
  args: { label: "Loading your invoices…", delay: 0 },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ThreeWaysToName: Story = {
  name: "Three ways to name it",
  parameters: { docs: { description: { story: "Visible words; hidden words; decorative, beside something that already speaks (here a heading that says it). Exactly one per spinner." } } },
  render: () => (
    <div data-shell="stack" data-gap="4">
      <Spinner label="Loading your invoices…" delay={0} />
      <Spinner a11yLabel="Loading search results" delay={0} />
      <p style={{ margin: 0, display: "flex", gap: "var(--tk-space-2)", alignItems: "center" }}>
        <Spinner decorative delay={0} /> Checking the address
      </p>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div data-shell="inline" data-gap="5" style={{ alignItems: "center" }}>
      <Spinner a11yLabel="Loading" delay={0} />
      <Spinner a11yLabel="Loading" size="sm" delay={0} />
      <Spinner a11yLabel="Loading" size="md" delay={0} />
      <Spinner a11yLabel="Loading" size="lg" delay={0} />
    </div>
  ),
};

/** A wait that ends: the region stays and says it is over. */
function Wait() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!loading) return; const t = setTimeout(() => setLoading(false), 2500); return () => clearTimeout(t); }, [loading]);
  return (
    <div data-shell="stack" data-gap="4" style={{ maxInlineSize: "28rem" }}>
      <div style={{ minBlockSize: "9rem", border: "1px solid var(--tk-line-default)", borderRadius: "var(--tk-radius-md)", display: "grid" }}>
        {loading ? <Spinner placement="center" label="Loading your invoices…" doneLabel="Invoices loaded" /> : <p style={{ margin: "var(--tk-space-4)" }}>3 invoices, the latest from 12 October.</p>}
      </div>
      <div><Button variant="outline" size="sm" onClick={() => setLoading(true)} disabled={loading}>Load again</Button></div>
    </div>
  );
}

export const AWaitThatEnds: Story = {
  name: "A wait that ends",
  parameters: { docs: { description: { story: "Centred in the box that is loading, shown after the delay, and the finish said (\"Invoices loaded\"). Focus never moves." } } },
  render: () => <Wait />,
};

export const SkeletonShapes: Story = {
  name: "Skeleton: a list of people",
  parameters: { docs: { description: { story: "The shape is known, so a skeleton: a circle for each avatar and two short lines beside it, inside a group that says \"Loading team members\" once. The shapes are hidden from screen readers." } } },
  render: () => (
    <SkeletonGroup label="Loading team members" style={{ maxInlineSize: "28rem" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", gap: "var(--tk-space-3)", alignItems: "center" }}>
          <Skeleton shape="circle" />
          <div style={{ flex: 1 }}><Skeleton lines={2} /></div>
        </div>
      ))}
    </SkeletonGroup>
  ),
};

/* Skeleton's own panel: the meta is Spinner's, so these are declared here. */
export const SkeletonPlayground: StoryObj<typeof Skeleton> = {
  name: "Skeleton: playground",
  render: (args) => (
    <SkeletonGroup label="Loading" style={{ maxInlineSize: "24rem" }}>
      <Skeleton {...args} />
    </SkeletonGroup>
  ),
  argTypes: {
    shape: { control: "inline-radio", options: ["text", "block", "circle"] },
    lines: { control: "inline-radio", options: [1, 2, 3] },
    width: { control: "text", description: "Any CSS length." },
    height: { control: "text", description: "A block's height, any CSS length." },
    animated: { control: "boolean" },
  },
  args: { shape: "text", lines: 3, animated: true },
};

export const SkeletonBlock: Story = {
  name: "Skeleton: a card",
  render: () => (
    <SkeletonGroup label="Loading the report" style={{ maxInlineSize: "20rem" }}>
      <Skeleton shape="block" height="8rem" />
      <Skeleton width="70%" />
      <Skeleton lines={3} />
    </SkeletonGroup>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin: spinner (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Spinner laid over this one: the arc with its words, photographed still (reduced motion)." } },
    onion: { component: "Spinner", skin: () => "default.png" },
  },
  args: { label: "Loading your invoices…", delay: 0 },
};

export const OnionSkinSkeleton: Story = {
  name: "Onion skin: skeleton (Figma)",
  parameters: {
    docs: { description: { story: "The Figma Skeleton laid over this one: three people, a circle and two lines each, 400 wide, photographed still." } },
    onion: { component: "Skeleton", skin: () => "default.png" },
  },
  render: () => (
    <div style={{ inlineSize: 400 }}>
      <SkeletonGroup label="Loading team members">
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", gap: "var(--tk-space-3)", alignItems: "center" }}>
            <Skeleton shape="circle" />
            <div style={{ flex: 1 }}><Skeleton lines={2} /></div>
          </div>
        ))}
      </SkeletonGroup>
    </div>
  ),
};
