import type { Meta, StoryObj } from "@storybook/react-vite";
import { Guidance, GuidancePair } from "./Guidance";

const meta = {
  title: "04 Primitives/24 Guidance",
  component: Guidance,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Do and Don't, encoded so that colour is the last channel rather than the only one. The word, the icon and the border style each carry the difference on their own; the status colours reinforce it. Use for: any guidance a reader could follow incorrectly. Don't use for: status of a thing that happened — that is an Alert.",
      },
    },
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["do", "dont"] },
    note: { control: "text" },
    label: { control: "text" },
    children: { control: false },
  },
  args: {
    tone: "do",
    note: "Say why. A rule with no reason is a rule people route around the first time it is inconvenient.",
  },
} satisfies Meta<typeof Guidance>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = { name: "One panel" };

/**
 * The pair, which is how it is nearly always used.
 */
export const Pair: Story = {
  name: "Do and Don't",
  render: () => (
    <GuidancePair>
      <Guidance
        tone="do"
        note="Set body text to the measure token. Somewhere near 66 characters is where the eye finds the next line without hunting for it."
      >
        <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
          A line this long gives the eye a reliable return sweep, which is the
          whole job of a measure — it is about finding the next line, not about
          how much text fits on the screen.
        </p>
      </Guidance>
      <Guidance
        tone="dont"
        note="Don't let text run the full width of a wide container. Past roughly 90 characters the return sweep starts landing on the wrong line and readers lose their place."
      >
        <p style={{ margin: 0 }}>
          A line allowed to run the entire width of its container makes the eye
          travel much further to find the start of the next one, and the longer
          that journey is the more often it arrives somewhere wrong, which is
          the failure people describe as the text being tiring rather than as
          the line being too long.
        </p>
      </Guidance>
    </GuidancePair>
  ),
};

/**
 * The accessibility argument, made by removing the thing under argument.
 *
 * Switch the pack toolbar to either wireframe and this page loses all of its
 * colour. It should lose none of its meaning: the word, the icon and the
 * solid-versus-dashed border are each sufficient on their own. That is the
 * test to apply to anything added to this component.
 */
export const WithoutColour: Story = {
  name: "With the colour removed",
  render: () => (
    <div data-shell="stack" data-gap="4">
      <p className="tk-doc-note" style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
        Rendered with the status colours forced to the surface and line tokens,
        which is roughly what a reader with deuteranopia gets from the usual
        green-box-red-box encoding. Nothing here becomes ambiguous, because
        nothing here depended on hue.
      </p>
      <div
        style={{
          ["--tk-status-success-line" as string]: "var(--tk-line-strong)",
          ["--tk-status-success-surface" as string]: "var(--tk-surface-sunken)",
          ["--tk-status-success-text" as string]: "var(--tk-text-primary)",
          ["--tk-status-danger-line" as string]: "var(--tk-line-strong)",
          ["--tk-status-danger-surface" as string]: "var(--tk-surface-sunken)",
          ["--tk-status-danger-text" as string]: "var(--tk-text-primary)",
        }}
      >
        <GuidancePair>
          <Guidance
            tone="do"
            note="Solid border, a check, and the word. Three channels, none of them colour."
          />
          <Guidance
            tone="dont"
            note="Dashed border, a cross, and the word. Still unmistakable with every hue in the panel identical."
          />
        </GuidancePair>
      </div>
    </div>
  ),
};

/**
 * The words are overridable, because "Do" and "Don't" are often too absolute.
 */
export const Verbs: Story = {
  name: "Prefer and Avoid",
  render: () => (
    <GuidancePair>
      <Guidance
        tone="do"
        label="Prefer"
        note="A container query, when the component can appear in slots of different widths."
      />
      <Guidance
        tone="dont"
        label="Avoid"
        note="A viewport breakpoint for a component that does not span the viewport — it will be wrong in a sidebar and wrong again in a modal."
      />
    </GuidancePair>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { note: "Why this is the right or wrong move.", children: "Example content" },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one, at the 320px width the design was drawn at. Switch Onion in the toolbar; tone picks the skin." } },
    onion: { component: "Guidance", skin: (a: Record<string, unknown>) => `${(a.tone as string) ?? "do"}.png` },
  },
  decorators: [(Story) => <div style={{ inlineSize: 320 }}><Story /></div>],
};
