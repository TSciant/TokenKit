import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { LogoLadder } from "../react/primitives/LogoLadder";
import { BrandCard, SPECIMENS } from "./specimens";
import { Page, type ContextGlobals } from "./doc";

/**
 * Brands — six identities, one contract.
 *
 * This page is about what each brand LOOKS like: mark, wordmark, tagline, and
 * how the logo reduces down the ladder. The values underneath it live next
 * door in Brand tokens, on purpose — an identity and the numbers that produce
 * it are read by different people at different moments, and a page that shows
 * both at once is a page nobody finishes.
 *
 * What both pages share is the source. Every card is one subtree with one
 * pack resolving in it, and nothing on either page is transcribed.
 */
function BrandSheet({ pack, density, root }: ContextGlobals) {
  const host = useRef<HTMLDivElement>(null);
  const deps = [pack, density, root];
  return (
    <Page
      hostRef={host}
      title="Brands"
      note={
        <>
          Six unrelated identities &mdash; a retailer, a delivery service, a
          bakery, a burger shop, a travel stop, and the kit&rsquo;s own house
          brand &mdash; filling one contract. No component below was changed,
          forked or told which brand it is rendering. Six packs are live in
          this one document at the same time, which works because custom
          properties resolve per element against inherited context rather than
          once at the root.
        </>
      }
      spec={
        <>
          The marks are original geometry drawn for this kit, and the packs
          behind them own proportion as well as colour &mdash; type ramp,
          display face and case, radius, density, measure and plate caps. The
          resolved values, the judged pairs and the nudge deltas are in{" "}
          <strong>Brand tokens</strong>.
        </>
      }
    >
      <div data-shell="stack" data-gap="5" style={{ padding: "var(--tk-space-5)" }}>
        {SPECIMENS.map((spec) => (
          <BrandCard key={spec.slug} spec={spec} deps={deps} view="identity" />
        ))}
      </div>
    </Page>
  );
}

function OneComponent() {
  const host = useRef<HTMLDivElement>(null);
  return (
    <Page
      hostRef={host}
      title="One component, six brands"
      note={
        <>
          The same <code>LogoLadder</code> element six times, in six subtrees
          that differ only by <code>data-brand</code>. Nothing below sets a
          colour: the mark paints with <code>currentColor</code>, the ladder
          resolves that from <code>--tk-logo-mark-ink</code>, and the pack
          fills the slot.
        </>
      }
      spec={
        <>
          Try the pack toolbar. The wireframe packs fill the same logo slots
          with greys, so the whole row drops back to the unbranded prototype
          without a prop changing &mdash; which is the delivery state the kit
          ships in, not a degraded one.
        </>
      }
    >
      <div
        data-shell="grid"
        data-fixed
        data-cols="3"
        data-gap="3"
        style={{ padding: "var(--tk-space-5)" }}
      >
        {SPECIMENS.map((spec) => (
          <div key={spec.slug} data-brand={spec.slug} data-tk="card">
            <div data-shell="stack" data-gap="3">
              <LogoLadder
                mark={spec.mark}
                word={spec.word}
                tagline={spec.tagline}
                smStage={spec.smStage}
                label={spec.name}
              />
              <p style={{ margin: 0, color: "var(--tk-text-secondary)" }}>{spec.body}</p>
              <div data-shell="inline" data-gap="2">
                <button type="button" data-tk="button" data-variant="solid" data-size="sm">
                  {spec.tagline}
                </button>
                <button type="button" data-tk="button" data-variant="outline" data-size="sm">
                  More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

const meta = {
  title: "02 Tokens/01 Colour/03 Brands",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Six identities and how each one reduces. */
export const Identities: Story = {
  name: "Identities",
  render: (_args, ctx) => <BrandSheet {...(ctx.globals as unknown as ContextGlobals)} />,
};

/** The claim in one row. */
export const OneComponentSevenBrands: Story = {
  name: "One component, six brands",
  render: () => <OneComponent />,
};
