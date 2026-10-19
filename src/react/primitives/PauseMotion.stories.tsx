import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { PauseMotion } from "./PauseMotion";
import { Skeleton, SkeletonGroup, Spinner } from "./Loading";

const meta = {
  title: "04 Primitives/94 Pause motion",
  component: PauseMotion,
  parameters: {
    docs: {
      description: {
        component:
          "One button that pauses every loop on the page and plays them again: spinners, skeletons, a busy button's turn, the tachometer, and any motion of the page's own marked data-motion-class=\"decor\" (the kit's CSS stops it) or drawn in script that reads useMotionPaused(). WCAG 2.2.2: motion that starts on its own, lasts more than five seconds and sits beside other content can be paused, and a device's reduced-motion setting does not reach readers whose device does not offer one. Its words name the action, \"Pause animations\" then \"Play animations\", and change when it is pressed, so it has no pressed state (APG's rotation control). Put it once, early in the page, before the moving content; the header's utilities are the place. The choice is kept for the next page. When the device asks for reduced motion nothing loops, so it shows as paused, stays focusable and says why. From the APG carousel and PatternFly's AnimationsProvider.",
      },
    },
  },
  /* Stories leave the page as they found it: a paused page would stop every spinner in the next story. */
  decorators: [
    (Story) => {
      useEffect(() => () => { delete document.documentElement.dataset.motion; }, []);
      return <Story />;
    },
  ],
  argTypes: {
    pauseLabel: { control: "text" },
    playLabel: { control: "text" },
    reducedReason: { control: "text" },
    variant: { control: "inline-radio", options: ["solid", "outline", "quiet"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    remember: { control: "boolean", description: "Keep the choice for the next page. Off in these stories, so one does not pause the next." },
    onChange: { control: false },
  },
  args: { remember: false },
} satisfies Meta<typeof PauseMotion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WhatItStops: Story = {
  name: "What it stops",
  parameters: { docs: { description: { story: "A spinner, a skeleton and a busy button, all looping. Pause: every one stands still, and their words still say what is happening. Play: they move again. Nothing else on the page changes." } } },
  render: (args) => (
    <div data-shell="stack" data-gap="5" style={{ maxInlineSize: "28rem" }}>
      <div><PauseMotion {...args} /></div>
      <Spinner label="Loading your invoices…" delay={0} />
      <SkeletonGroup label="Loading team members">
        <div style={{ display: "flex", gap: "var(--tk-space-3)", alignItems: "center" }}>
          <Skeleton shape="circle" />
          <div style={{ flex: 1 }}><Skeleton lines={2} /></div>
        </div>
      </SkeletonGroup>
      <div><Button busy busyLabel="Saving…">Save</Button></div>
    </div>
  ),
};

export const InTheHeader: Story = {
  name: "In the header's utilities",
  parameters: { docs: { description: { story: "Once per page, early, beside the other page-wide settings: before any of the motion it stops." } } },
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--tk-space-4)", paddingBlock: "var(--tk-space-3)", borderBlockEnd: "1px solid var(--tk-line-default)" }}>
      <strong>Service name</strong>
      <div style={{ display: "flex", gap: "var(--tk-space-2)", alignItems: "center" }}>
        <PauseMotion {...args} />
        <Button variant="quiet" size="sm">Sign out</Button>
      </div>
    </div>
  ),
};

/** A ticker of figures and the table that says the same, one in place of the other. */
function Ticker() {
  const [table, setTable] = useState(false);
  const rows = [["Turnout", "64%"], ["Counted", "412 of 650"], ["Declared", "38 seats"]];
  return (
    <div data-shell="stack" data-gap="3" style={{ maxInlineSize: "32rem" }}>
      <style>{"@keyframes tk-story-ticker { from { transform: translateX(100%); } to { transform: translateX(-100%); } }"}</style>
      <div>
        <Button variant="outline" size="sm" aria-controls="tk-results-table" onClick={() => setTable((t) => !t)}>
          {table ? "Show as a ticker" : "Show as a table"}
        </Button>
      </div>
      {table ? null : (
        <div data-motion-class="data" data-equivalent="#tk-results-table" style={{ overflow: "hidden", whiteSpace: "nowrap", paddingBlock: "var(--tk-space-2)", borderBlock: "1px solid var(--tk-line-default)" }}>
          <div style={{ display: "inline-flex", gap: "var(--tk-space-6)", animation: "tk-story-ticker 20s linear infinite" }}>
            {rows.map(([k, v]) => <span key={k}>{k}: <strong>{v}</strong></span>)}
          </div>
        </div>
      )}
      <table id="tk-results-table" hidden={!table}>
        <caption style={{ textAlign: "start" }}>Results so far</caption>
        <tbody>
          {rows.map(([k, v]) => <tr key={k}><th scope="row" style={{ textAlign: "start", paddingInlineEnd: "var(--tk-space-4)" }}>{k}</th><td>{v}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

export const DataMotion: Story = {
  name: "Motion that carries information",
  parameters: { docs: { description: { story: "Pause motion is for decor. Motion that carries information (a ticker, a feed, a rolling number) conforms another way: it names a static equivalent with the same words (data-motion-class=\"data\", data-equivalent=\"#id\") and a control on the page puts the equivalent in its place, so hiding the motion loses nothing. Or the equivalent is the default and the motion is something they start. A live region in the equivalent stays off while the motion runs. tools/motion-gate.mjs checks every part of it." } } },
  render: () => <Ticker />,
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma PauseMotion laid over this one: quiet, small, the pause icon and its words." } },
    onion: { component: "PauseMotion", skin: () => "default.png" },
  },
};
