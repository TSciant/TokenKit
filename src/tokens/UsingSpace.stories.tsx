import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../react/primitives/Button";
import { Card, CardBody, CardTitle } from "../react/primitives/Card";
import { Guidance, GuidancePair } from "../react/primitives/Guidance";

/* How to use space, as Do and Don't pairs of live components. From the
   ds-corpus spacing brief (Carbon, Primer), in our words. Shares its title
   with Scales.stories.tsx, so it sits beside the space ramp. Stories are
   outside the spacing lint, which is how a Don't can show a literal. */
const meta = {
  title: "02 Tokens/03 Scales",
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

const Muted = ({ children }: { children: ReactNode }) => (
  <p data-text="small" style={{ margin: 0, color: "var(--tk-text-secondary)" }}>{children}</p>
);

/* A narrow screen, for the gutter pair: a phone's width at a fifth less. */
const Phone = ({ children }: { children: ReactNode }) => (
  <div style={{ inlineSize: "min(17rem, 100%)", border: "1px solid var(--tk-line-default)", borderRadius: "var(--tk-radius-nested)", overflow: "hidden" }}>
    {children}
  </div>
);

const BAND_TEXT = "Every scale step is a published decision";

export const UsingSpace: Story = {
  name: "Using space",
  parameters: {
    docs: {
      description: {
        story:
          "The rules for space, each with its reason, as Do and Don't pairs of live components. Drawn from the ds-corpus spacing brief: Carbon on relationship, hierarchy, dividers and letting the parent place; Primer on one gutter, on the content and not its parent.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ maxInlineSize: "56rem" }}>
      <Rule title="Near means related">
        <GuidancePair>
          <Guidance tone="do" note="Keep what belongs together close, and put more space between groups than inside them. The date sits under its title; the paragraph is a step further off; the action further still. The reader sees three things, not five.">
            <div data-shell="stack" data-gap="5">
              <div data-shell="stack" data-gap="1">
                <strong data-text="heading-s">Version 2.0</strong>
                <Muted>Released 5 October 2026</Muted>
              </div>
              <p style={{ margin: 0 }}>Forms check themselves, and every pack has link colours.</p>
              <div><Button variant="outline">Read the notes</Button></div>
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't space everything the same. Even gaps say every line is its own thing, so the date floats between the title and the paragraph and belongs to neither.">
            <div data-shell="stack" data-gap="4">
              <strong data-text="heading-s">Version 2.0</strong>
              <Muted>Released 5 October 2026</Muted>
              <p style={{ margin: 0 }}>Forms check themselves, and every pack has link colours.</p>
              <div><Button variant="outline">Read the notes</Button></div>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Space instead of a line">
        <GuidancePair>
          <Guidance tone="do" note="Separate groups with space. A larger gap already says where one group ends, and it does so without adding a mark the eye has to read past.">
            <div data-shell="stack" data-gap="6">
              <div data-shell="stack" data-gap="1"><strong>Account</strong><Muted>Name, email, password</Muted></div>
              <div data-shell="stack" data-gap="1"><strong>Billing</strong><Muted>Plan, invoices, card</Muted></div>
              <div data-shell="stack" data-gap="1"><strong>Team</strong><Muted>Members and roles</Muted></div>
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't rule a line between every group to make up for gaps that are too small. Lines between everything turn the list into a table, and they compete with the content for attention.">
            <div data-shell="stack" data-gap="2">
              <div data-shell="stack" data-gap="1"><strong>Account</strong><Muted>Name, email, password</Muted></div>
              <hr style={{ margin: 0 }} />
              <div data-shell="stack" data-gap="1"><strong>Billing</strong><Muted>Plan, invoices, card</Muted></div>
              <hr style={{ margin: 0 }} />
              <div data-shell="stack" data-gap="1"><strong>Team</strong><Muted>Members and roles</Muted></div>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="More space around what matters">
        <GuidancePair>
          <Guidance tone="do" note="Give the main thing room. Space around the one action on the panel says it is the one, before anyone reads the label.">
            <div data-shell="stack" data-gap="6">
              <div data-shell="stack" data-gap="2">
                <strong data-text="heading-m">Start a project</strong>
                <Muted>Pick a pack; you can change it later.</Muted>
              </div>
              <div><Button>Create project</Button></div>
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't pack the important thing in with everything else. Squeezed between the text and the edge, the action reads as one more line.">
            <div data-shell="stack" data-gap="1">
              <strong data-text="heading-m">Start a project</strong>
              <Muted>Pick a pack; you can change it later.</Muted>
              <div><Button size="sm">Create project</Button></div>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Let the parent place">
        <GuidancePair>
          <Guidance tone="do" note="Space things with the gap of the shell that holds them. The gap sits only between items, so the card's padding stays even on every side, whatever is last.">
            <Card>
              <div data-shell="stack" data-gap="3">
                <CardTitle>Invoices</CardTitle>
                <CardBody>Twelve this year, all paid.</CardBody>
              </div>
            </Card>
          </Guidance>
          <Guidance tone="dont" note="Don't give each item its own margin. The last one carries its margin out to the edge, so the card has more room at the bottom than the top, and moving an item moves the problem with it.">
            <Card>
              <CardTitle style={{ marginBlockEnd: "var(--tk-space-3)" }}>Invoices</CardTitle>
              <CardBody style={{ marginBlockEnd: "var(--tk-space-5)" }}>Twelve this year, all paid.</CardBody>
            </Card>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="One gutter">
        <GuidancePair>
          <Guidance tone="do" note="Inset the content from the screen's edge once, by the gutter. On a phone every pixel of width is lines the reader does not have to scroll.">
            <Phone>
              <div style={{ background: "var(--tk-surface-sunken)", paddingBlock: "var(--tk-space-5)" }}>
                <div data-shell="center">
                  <p data-text="heading-m" style={{ margin: 0 }}>{BAND_TEXT}</p>
                </div>
              </div>
            </Phone>
          </Guidance>
          <Guidance tone="dont" note="Don't pad a band and then pad the content inside it too. Each layer meant well; together they take a quarter of a phone's width, and the title breaks a line earlier for nothing.">
            <Phone>
              <div style={{ background: "var(--tk-surface-sunken)", padding: "var(--tk-space-5)" }}>
                <div data-shell="center">
                  <p data-text="heading-m" style={{ margin: 0 }}>{BAND_TEXT}</p>
                </div>
              </div>
            </Phone>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Density for the whole, not a patch">
        <GuidancePair>
          <Guidance tone="do" note="When a view needs to be denser, set density on it. Every gap, padding and control in it steps down together, so the rhythm survives at the smaller size.">
            <div data-density="compact" data-shell="stack" data-gap="3">
              <strong>Recent activity</strong>
              <div data-shell="inline" data-gap="2"><Button size="sm" variant="outline">Filter</Button><Button size="sm" variant="quiet">Export</Button></div>
              <Muted>Three changes today.</Muted>
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't shave padding off one part to make room. That part no longer matches the ones beside it, and the next person shaves another.">
            <div data-shell="stack" data-gap="3">
              <strong>Recent activity</strong>
              <div data-shell="inline" data-gap="2">
                <Button size="sm" variant="outline" style={{ paddingInline: "var(--tk-space-1)" }}>Filter</Button>
                <Button size="sm" variant="quiet">Export</Button>
              </div>
              <Muted>Three changes today.</Muted>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>
    </div>
  ),
};
