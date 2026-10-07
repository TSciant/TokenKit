import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Guidance, GuidancePair } from "../react/primitives/Guidance";
import { Heading } from "../react/primitives/Heading";

/* How to set type, as Do and Don't pairs of live text. From the ds-corpus
   type brief (Primer, Atlassian, Carbon, BBC GEL), in our words. Shares its
   title with Typography.stories.tsx, so it sits beside the type tokens. A
   Don't that shows a structural failure (a skipped heading level) is
   aria-hidden: it is a picture of the mistake, and its note says what is
   wrong in words. */
const meta = {
  title: "02 Tokens/04 Typography",
  parameters: {
    layout: "padded",
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

const LONG =
  "A count appears under the field once a limit is set. It says the limit until something is typed, then how many characters are left, and it speaks only near the end, so a reader hears it when it matters and not with every key.";

export const UsingType: Story = {
  name: "Using type",
  parameters: {
    docs: {
      description: {
        story:
          "The rules for setting type, each with its reason, as Do and Don't pairs of live text. Drawn from the ds-corpus type brief: Primer on keeping heading levels apart from their look and on left, ragged-right text; Atlassian on one h1 and no skipped levels; BBC GEL on line length; Carbon on italics and weight.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ maxInlineSize: "56rem" }}>
      <Rule title="The level is the outline; the style is the look">
        <GuidancePair>
          <Guidance tone="do" note="Pick the heading level for where the section sits in the page, and its look with a text style. Here both sections are h4s under the title's h3, because that is where they sit; the second is a small aside, so Heading's text makes it look like one, and a screen reader's list of headings keeps its shape.">
            <div data-shell="stack" data-gap="2">
              <Heading level={3} text="title" style={{ margin: 0 }}>Release notes <span data-text="caption" aria-hidden="true">(h3)</span></Heading>
              <Heading level={4} text="heading-m" style={{ margin: 0 }}>What changed <span data-text="caption" aria-hidden="true">(h4)</span></Heading>
              <Heading level={4} text="heading-xs" style={{ margin: 0 }}>Thanks <span data-text="caption" aria-hidden="true">(h4, styled heading-xs)</span></Heading>
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't choose a level for its size. An h5 because it should be small files Thanks under What changed, as if it were part of it; someone moving through the page by headings gets the wrong outline, and a level skipped for size is the same mistake one step further.">
            <div data-shell="stack" data-gap="2" aria-hidden="true">
              <p data-text="title" style={{ margin: 0 }}>Release notes <span data-text="caption">(h3)</span></p>
              <p data-text="heading-m" style={{ margin: 0 }}>What changed <span data-text="caption">(h4)</span></p>
              <p data-text="heading-xs" style={{ margin: 0 }}>Thanks <span data-text="caption">(h5, chosen for its size)</span></p>
            </div>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Keep the line to a reading length">
        <GuidancePair>
          <Guidance tone="do" note="Let running text sit at the measure, about 45 to 75 characters a line (the kit's is 66). The eye finds the start of the next line without hunting for it.">
            <p data-text="body" style={{ margin: 0 }}>{LONG}</p>
          </Guidance>
          <Guidance tone="dont" note="Don't make long lines readable by making the type smaller. Small type in a wide column is more characters per line, not fewer, and every return trip is longer.">
            <p data-text="caption" style={{ margin: 0, maxInlineSize: "none" }}>{LONG} {LONG}</p>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Left and ragged right">
        <GuidancePair>
          <Guidance tone="do" note="Set running text flush left with a ragged right edge. Every line starts in the same place, and the spaces between words stay the size the face was drawn for.">
            <p style={{ margin: 0 }}>{LONG}</p>
          </Guidance>
          <Guidance tone="dont" note="Don't centre or justify a paragraph. Centred lines each start somewhere new; justified ones stretch the spaces into gaps that run down the column. Centre a short title or a single line, if anything.">
            <p style={{ margin: 0, textAlign: "center" }}>{LONG}</p>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Capitals for labels, not for sentences">
        <GuidancePair>
          <Guidance tone="do" note="Use the eyebrow style for a word or two over a title. Short capitals, opened up a little, read as a label.">
            <div data-shell="stack" data-gap="1">
              <p data-text="eyebrow" style={{ margin: 0, color: "var(--tk-text-secondary)" }}>Version 2.0</p>
              <p data-text="heading-m" style={{ margin: 0 }}>Forms check themselves</p>
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't set a sentence in capitals. Words lose the shapes of their ascenders and descenders, every one becomes a rectangle, and the reader has to spell their way through.">
            <p data-text="eyebrow" style={{ margin: 0 }}>Forms check themselves, and every pack now has link colours of its own.</p>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Italics for titles and terms">
        <GuidancePair>
          <Guidance tone="do" note="Use italics for the title of a work, a term being defined, a word in another language. They mark a few words out from the sentence around them.">
            <p style={{ margin: 0 }}>
              The rule comes from <i>The Elements of Typographic Style</i>: a <em>measure</em> is the length of a line.
            </p>
          </Guidance>
          <Guidance tone="dont" note="Don't set a whole passage in italics to make it stand apart. Italic is slower to read at length, and once everything is marked nothing is.">
            <p style={{ margin: 0, fontStyle: "italic" }}>{LONG}</p>
          </Guidance>
        </GuidancePair>
      </Rule>

      <Rule title="Bold sparingly">
        <GuidancePair>
          <Guidance tone="do" note="Make one thing heavier: the fact the reader came for. Weight is the loudest thing type can do without changing size, so it works once per paragraph.">
            <p style={{ margin: 0 }}>
              A count appears under the field once a limit is set, and <strong>it never cuts off what was typed</strong>.
            </p>
          </Guidance>
          <Guidance tone="dont" note="Don't bold everything that matters. A paragraph of bold phrases has no emphasis left, only a texture, and the reader skims the bold and misses the sentence.">
            <p style={{ margin: 0 }}>
              <strong>A count appears</strong> under the field <strong>once a limit is set</strong>, and it <strong>never cuts off</strong> what was <strong>typed</strong>.
            </p>
          </Guidance>
        </GuidancePair>
      </Rule>
    </div>
  ),
};
