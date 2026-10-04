import type { Meta, StoryObj } from "@storybook/react-vite";
import { Hero, ProofStrip } from "./marketing";

/* Hand-written beside the generated 26-Hero stories (which tools/gen-component-
   stories.mjs owns and would overwrite): these are arrangements of the Hero
   with its neighbours, not controls for the Hero itself, so they live here. */
const meta = {
  title: "05 Patterns/26 Hero",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The utility strip, before and after.
 *
 * Before: the eyebrow is the strip above the title, one short line that
 * places the page (a category, an announcement, "new"). After: the proof
 * strip with no heading of its own, so it reads as the facts under the hero
 * rather than another section asking to be read. Neither is a new component;
 * both are the existing parts with less in them.
 */
export const WithUtilityStrips: Story = {
  name: "With utility strips",
  parameters: {
    docs: {
      description: {
        story:
          "Before the hero: its eyebrow, one short line that places the page. After it: ProofStrip with no heading or deck, so the facts read as part of the hero rather than a new section. Neither is a new component. Keep the strip short (three facts, a few words each); if it needs a heading, it is a section, not a strip.",
      },
    },
  },
  render: () => (
    <>
      <Hero eyebrow="New" layout="split" />
      <ProofStrip heading="" deck="" />
    </>
  ),
};

/** The input-capture hero with the strip under it: the common sign-up page top. */
export const CaptureWithStrip: Story = {
  name: "Capture, with a strip",
  render: () => (
    <>
      <Hero actions="capture" layout="split" />
      <ProofStrip heading="" deck="" />
    </>
  ),
};
