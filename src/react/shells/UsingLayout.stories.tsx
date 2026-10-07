import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Shell } from "./Shell";
import { Button } from "../primitives/Button";
import { ButtonGroup } from "../primitives/ButtonGroup";
import { Guidance, GuidancePair } from "../primitives/Guidance";

/* How to lay a page out, as Do and Don't pairs of live shells. From the
   ds-corpus grid brief (BBC GEL, Primer), in our words. Shares its title with
   Shell.stories.tsx, so it sits beside the shells. */
const meta = {
  title: "03 Foundations/03 Composition",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Rule = ({ title, children }: { title: string; children: ReactNode }) => (
  <section data-shell="stack" data-gap="3">
    <h2 style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>{title}</h2>
    {children}
  </section>
);

/* A narrow box: a phone, or a rail. Clipped, and contained in the inline
   direction so what overruns it cannot set its minimum width either: a Don't
   shows the overrun without pushing the page out (the reflow gate caught
   that it did). */
const Narrow = ({ children, width = "15rem" }: { children: ReactNode; width?: string }) => (
  <div style={{ inlineSize: `min(${width}, 100%)`, contain: "inline-size", overflow: "hidden", outline: "1px dashed var(--tk-line-default)", outlineOffset: 4 }}>
    {children}
  </div>
);

const Cell = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div className="tk-cell" style={style}>{children}</div>
);

export const UsingLayout: Story = {
  name: "Using layout",
  parameters: {
    docs: {
      description: {
        story:
          "The rules for laying a page out, each with its reason, as Do and Don't pairs of live shells. Drawn from the ds-corpus grid brief: BBC GEL on starting with one column, ratio columns and reflow; Primer on panes beside content and on reading order.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ maxInlineSize: "56rem" }}>
      <Rule title="Let the shell choose the columns">
        <GuidancePair>
          <Guidance tone="do" note="Ask for a column count and let the grid fit what the space allows. In a narrow box three columns become one, without a breakpoint and without anyone deciding which phone is narrow.">
            <Narrow>
              <Shell kind="grid" cols={3} gap={3}>
                <Cell>Downloads</Cell><Cell>Accessibility</Cell><Cell>Licensing</Cell>
              </Shell>
            </Narrow>
          </Guidance>
          <Guidance tone="dont" note="Don't fix a count the space cannot hold. Three columns forced into a phone's width are three slivers, and whatever is in them breaks a word a line.">
            <Narrow>
              <Shell kind="grid" cols={3} fixed gap={3}>
                <Cell style={{ overflowWrap: "anywhere" }}>Downloads</Cell><Cell style={{ overflowWrap: "anywhere" }}>Accessibility</Cell><Cell style={{ overflowWrap: "anywhere" }}>Licensing</Cell>
              </Shell>
            </Narrow>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Content and its aside at a ratio">
        {/* One above the other, not side by side: a ratio grid needs 36rem
            before it splits, wider than half this page. */}
        <div data-shell="stack" data-gap="4">
          <Guidance tone="do" note="Give the main content the larger share. A 2:1 ratio says which column is the page, and the aside still stacks under it when the space runs out.">
            <Shell kind="grid" ratio="2:1" gap={3}>
              <Cell>Content</Cell>
              <Cell>Aside</Cell>
            </Shell>
          </Guidance>
          <Guidance tone="dont" note="Don't split content and its aside in halves. Equal columns say they matter equally, and the reading column loses half its line length to a list of links.">
            <Shell kind="grid" cols={2} fixed gap={3}>
              <Cell>Content</Cell>
              <Cell>Aside</Cell>
            </Shell>
          </Guidance>
        </div>
      </Rule>

      <Rule title="A component answers to its own box">
        <GuidancePair>
          <Guidance tone="do" note="Lay a component out by the box it is put in. This group of buttons stacks in a narrow rail on any screen, because it asks how wide its container is, not how wide the screen is.">
            <Narrow width="12rem">
              <ButtonGroup label="Draft" actions={[{ label: "Discard changes", variant: "quiet" }, { label: "Save draft" }]} />
            </Narrow>
          </Guidance>
          <Guidance tone="dont" note="Don't let a row decide its layout from the screen. On a wide screen it stays a row, even inside a narrow rail, and the last button is cut off.">
            <Narrow width="12rem">
              <div style={{ display: "flex", flexWrap: "nowrap", gap: "var(--tk-space-2)" }}>
                <Button variant="quiet" tabIndex={-1} style={{ flexShrink: 0 }}>Discard changes</Button>
                <Button tabIndex={-1} style={{ flexShrink: 0 }}>Save draft</Button>
              </div>
            </Narrow>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Keep the reading order">
        <GuidancePair>
          <Guidance tone="do" note="Put things in the source in the order they are read, and let the layout follow. A screen reader, a keyboard and a stacked phone layout all take that order, so it has to be the right one.">
            <Shell kind="row" gap={3}>
              <Cell>1 Title</Cell>
              <Cell>2 Summary</Cell>
            </Shell>
          </Guidance>
          <Guidance tone="dont" note="Don't reorder with CSS to get a look. Reversed visually, the summary comes first on screen and second for everyone moving by keyboard or listening.">
            <div style={{ display: "flex", flexDirection: "row-reverse", justifyContent: "flex-end", gap: "var(--tk-space-3)" }}>
              <Cell>1 Title</Cell>
              <Cell>2 Summary</Cell>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="One edge to align to">
        <GuidancePair>
          <Guidance tone="do" note="Line things up on one edge. The eye finds the start of each item where it found the last one.">
            <Shell kind="stack" gap={2}>
              <strong>Billing</strong>
              <span style={{ color: "var(--tk-text-secondary)" }}>Plan, invoices, card</span>
              <div><Button size="sm" variant="outline">Manage</Button></div>
            </Shell>
          </Guidance>
          <Guidance tone="dont" note="Don't centre one line, start the next at the edge and push the button to the other side. Three alignments make the reader look for each line separately.">
            <Shell kind="stack" gap={2}>
              <strong style={{ textAlign: "center" }}>Billing</strong>
              <span style={{ color: "var(--tk-text-secondary)" }}>Plan, invoices, card</span>
              <div style={{ textAlign: "end" }}><Button size="sm" variant="outline">Manage</Button></div>
            </Shell>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Nothing scrolls sideways">
        <GuidancePair>
          <Guidance tone="do" note="When something is wider than the screen on purpose, a table, let it scroll in its own box, focusable so a keyboard can scroll it. The page around it stays put.">
            <Narrow>
              <p style={{ margin: "0 0 var(--tk-space-3)" }}>Every plan includes the full kit.</p>
              <div role="region" aria-label="Plans compared" tabIndex={0} style={{ overflowX: "auto" }}>
                <table style={{ minInlineSize: "24rem" }}>
                  <thead><tr><th>Plan</th><th>Seats</th><th>Storage</th><th>Support</th></tr></thead>
                  <tbody><tr><td>Team</td><td>10</td><td>100 GB</td><td>Email</td></tr></tbody>
                </table>
              </div>
            </Narrow>
          </Guidance>
          <Guidance tone="dont" note="Don't let one wide thing widen the page. Then everything scrolls sideways, every line of text runs off the screen, and reading means scrolling in two directions (WCAG 1.4.10).">
            <Narrow>
              {/* The page widened by the table: the paragraph above it now
                  runs to the table's width and off the screen too. */}
              <p style={{ margin: "0 0 var(--tk-space-3)", inlineSize: "24rem", maxInlineSize: "none" }} aria-hidden="true">Every plan includes the full kit, and every line now runs past the edge of the screen.</p>
              <table style={{ minInlineSize: "24rem" }} aria-hidden="true">
                <thead><tr><th>Plan</th><th>Seats</th><th>Storage</th><th>Support</th></tr></thead>
                <tbody><tr><td>Team</td><td>10</td><td>100 GB</td><td>Email</td></tr></tbody>
              </table>
            </Narrow>
          </Guidance>
        </GuidancePair>
      </Rule>
    </div>
  ),
};
