import type { Meta, StoryObj } from "@storybook/react-vite";
import { ResponsiveFrames, SingleFrame } from "./Frame";
import { DoorShopPage, MohavePage } from "./brand-pages";

/**
 * Two brands, two pages, one component library.
 *
 * The eleven compositions beside this file are the neutral prototype: one
 * spine, one signature, the shape a client's content lands in. Switch the
 * pack on any of them and you get the same page in a different colour, which
 * is a fair thing to be unimpressed by.
 *
 * These two are the answer to that. They differ in posture (the packs now own
 * type, proportion, radius, density and plate scale, not just palette), in
 * how much they put on the page, and in what the imagery is for. Nothing in
 * either page reads a brand name, and neither page contains a colour value.
 */
const meta = {
  title: "08 Prototype",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Brand compositions — the same component library composed as two different kinds of page, under two packs that own proportion rather than palette.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Loud, dense, seven bands. A 3.25rem headline in caps at 0.9 leading, square
 * corners, density 0.85, plates capped at 15rem.
 */
export const DoorShop: Story = {
  name: "Brand — Door Shop (loud retail)",
  render: () => <SingleFrame><DoorShopPage /></SingleFrame>,
};

/**
 * Quiet, sparse, four bands. A 2rem headline in lowercase at 1.2 leading,
 * density 1.3, a 64ch measure, and one plate at 30rem.
 */
export const Mohave: Story = {
  name: "Brand — Mohave (quiet editorial)",
  render: () => <SingleFrame><MohavePage /></SingleFrame>,
};

/**
 * The comparison, which is the only story here that makes the argument.
 *
 * In iframes, and that is not a styling choice. The first version of this
 * story rendered both page components directly into one document, which put
 * two <header>, two <main> and two <footer> elements on the page. The axe
 * gate failed it four ways — duplicate banner, duplicate main, duplicate
 * contentinfo, non-unique landmarks — and it was right to: a page has one
 * main, and "more than one main" is not a rule an aria-label can satisfy.
 *
 * A comparison of two pages is a comparison of two DOCUMENTS, so it gets two
 * documents. Each frame loads that brand's own story, which also means the
 * thing being compared is exactly the thing that ships rather than a copy of
 * it composed for the comparison.
 *
 * Worth noting what this does NOT undermine: the packs still resolve per
 * subtree, and the specimen sheet in 02 Tokens has all six live in one
 * document. That works because six brand CARDS are six sections of one page.
 * Six brand PAGES are six pages.
 */
export const SideBySide: Story = {
  name: "Brand — side by side",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(26rem, 100%), 1fr))",
        gap: "1rem",
        padding: "1rem",
        background: "#f4f4f4",
        blockSize: "100vh",
      }}
    >
      {[
        ["08-prototype--door-shop", "Door Shop — loud retail"],
        ["08-prototype--mohave", "Mohave — quiet editorial"],
      ].map(([id, title]) => (
        <iframe
          key={id}
          title={title}
          src={`iframe.html?id=${id}&viewMode=story`}
          style={{
            inlineSize: "100%",
            blockSize: "100%",
            border: "1px solid #d0d0d0",
            background: "#fff",
          }}
        />
      ))}
    </div>
  ),
};

/**
 * Door Shop at three widths. The density and the caps travel down with it —
 * a tight page stays tight on a phone rather than reverting to the kit's
 * spacing the moment the columns collapse.
 */
export const DoorShopResponsive: Story = {
  name: "Brand — Door Shop across widths",
  render: () => <ResponsiveFrames><DoorShopPage /></ResponsiveFrames>,
};
