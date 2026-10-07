import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "../react/primitives/Alert";
import { Button } from "../react/primitives/Button";
import { Field } from "../react/primitives/Field";
import { Guidance, GuidancePair } from "../react/primitives/Guidance";
import { Plate } from "../react/primitives/Plate";

/* How to use colour, as Do and Don't pairs of live components. The Don'ts that
   are "only colour" use the pack's action fills, the colours in it that look
   most like colour; the status text slots are tuned for contrast and read as
   near-ink in most packs, which would hide the very thing being shown. From the
   ds-corpus colour brief (USWDS, Spectrum, IBM, GOV.UK, Carbon), in our words.
   Documentation, not a component, so no `component` on the meta. */
const meta = {
  title: "02 Tokens/01 Colour/07 Using colour",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The rules for colour, each with its reason, as Do and Don't pairs of live components. Drawn from the ds-corpus colour brief: USWDS on starting in black and white and never colour alone, Spectrum on not deriving colours, IBM on text over gradients and pictures, GOV.UK on colours that mean something.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Rule = ({ title, children }: { title: string; children: ReactNode }) => (
  <section data-shell="stack" data-gap="3">
    <h2 style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>{title}</h2>
    {children}
  </section>
);

/* A small block of content, for the first rule. */
const Notice = ({ titleStyle }: { titleStyle?: CSSProperties }) => (
  <div data-shell="stack" data-gap="2">
    <span data-tk="eyebrow">Release notes</span>
    <strong style={{ fontSize: "var(--tk-size-xl)", lineHeight: 1.2, ...titleStyle }}>Version 2.0 is out</strong>
    <p style={{ margin: 0, color: "var(--tk-text-secondary)" }}>Forms check themselves, and every pack has link colours.</p>
  </div>
);

export const UsingColour: Story = {
  name: "Using colour",
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ maxInlineSize: "56rem" }}>
      <Rule title="Start in grey">
        <GuidancePair>
          <Guidance tone="do" note="Design in the wireframe pack first. If the order of things reads in grey, from size, weight and space, colour can only add to it; a brand pack then changes the mood, not the meaning.">
            <div data-brand="wireframe" style={{ background: "transparent" }}>
              <Notice />
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't let colour do the work of hierarchy. A title that is only a different colour from its text is the same size and weight as it, and in grey, in print or to someone who does not see that hue it is just another line.">
            <Notice titleStyle={{ fontSize: "var(--tk-size-base)", fontWeight: "var(--tk-weight-normal)", color: "var(--tk-action-fill)" }} />
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Colour is never the only signal">
        <GuidancePair>
          <Guidance tone="do" note="Say it in words and show it in shape, then colour it. An error is a message at the field and a heavier border; the colour is the third way of saying it, for the readers it helps.">
            <Field label="Email address" type="email" autoComplete="email" defaultValue="name.example.com" error="Enter an email address in the correct format, like name@example.com" />
          </Guidance>
          <Guidance tone="dont" note="Don't mark a problem with colour alone. A red border tells someone who cannot tell red from grey nothing at all, and tells everyone else something is wrong but not what.">
            <div data-shell="stack" data-gap="2">
              <label htmlFor="using-colour-email" style={{ fontSize: "var(--tk-size-sm)", fontWeight: "var(--tk-weight-medium)" }}>
                Email address
              </label>
              <input id="using-colour-email" data-tk="input" type="email" autoComplete="email" defaultValue="name.example.com" style={{ borderColor: "var(--tk-action-danger-fill)" }} />
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Status colours mean status">
        <GuidancePair>
          <Guidance tone="do" note="Keep the status colours for status: success, warning, danger, information. Then a reader who has learned that red means stop can trust it everywhere.">
            <Alert status="success" title="Version 2.0 is out">Your projects were updated automatically.</Alert>
          </Guidance>
          <Guidance tone="dont" note="Don't borrow the danger red to make something stand out. Used for decoration it stops meaning danger, and the next real error has to shout over it.">
            <div data-shell="stack" data-gap="2">
              <span data-tk="eyebrow" style={{ color: "var(--tk-action-danger-fill)" }}>New</span>
              <strong>Version 2.0 is out</strong>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Links are underlined">
        <GuidancePair>
          <Guidance tone="do" note="Leave the underline on links in running text. It is the signal; a pack's link colour, when it has one, is a second channel on top of it.">
            <p style={{ margin: 0 }}>
              Read the <a href="#terms">terms of service</a> before you sign.
            </p>
          </Guidance>
          <Guidance tone="dont" note="Don't make a link a colour and nothing else. Among words of nearly the same lightness it disappears for anyone who does not see the hue, and nothing says it can be pressed until a pointer finds it.">
            {/* A picture of the failure: a span, not a link, so nothing focusable is hidden. */}
            <p style={{ margin: 0 }} aria-hidden="true">
              Read the <span style={{ color: "var(--tk-action-fill)" }}>terms of service</span> before you sign.
            </p>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Words on a picture go on a scrim">
        <GuidancePair>
          <Guidance tone="do" note="Put text over a photograph or a gradient on a scrim. Its wash is solved against the lightest picture there could be, so the words stay readable whatever is underneath, and the contrast gate checks it.">
            <div data-tk="scrim" style={{ blockSize: "10rem", borderRadius: "var(--tk-radius-md)" }}>
              <Plate fx={false} seed={2} ratio="16 / 9" style={{ position: "absolute", inset: 0 }} />
              <div data-tk="scrim-content">
                <strong>Readable on any picture</strong>
              </div>
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't set text straight onto a picture because it read well on the one you tried. The next picture has a light patch where the words are, and the screenshot never shows that one.">
            <div aria-hidden="true" style={{ position: "relative", blockSize: "10rem", borderRadius: "var(--tk-radius-md)", overflow: "hidden" }}>
              <Plate fx={false} seed={2} ratio="16 / 9" style={{ position: "absolute", inset: 0 }} />
              <strong style={{ position: "absolute", insetInlineStart: "var(--tk-space-4)", insetBlockEnd: "var(--tk-space-4)" }}>Readable on this one</strong>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Use the pack's colours, don't make new ones">
        <GuidancePair>
          <Guidance tone="do" note="When something needs to be quieter, use the slot made for it: an outline or quiet button, secondary text. Each one is a pair the contrast gate has measured in every pack.">
            <div data-shell="inline" data-gap="3">
              <Button>Publish</Button>
              <Button variant="outline">Save draft</Button>
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't fade, lighten or mix a colour to get another one. A button at 55% opacity is a colour no pack chose and no gate measured, and here its label has dropped below the contrast it needs.">
            {/* A picture of the failure, kept out of the tab order and the accessibility tree. */}
            <div data-shell="inline" data-gap="3" aria-hidden="true">
              <Button tabIndex={-1}>Publish</Button>
              <Button tabIndex={-1} style={{ opacity: 0.55 }}>Save draft</Button>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>
    </div>
  ),
};
