import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { BrandCard, SPECIMENS } from "./specimens";
import { Page, type ContextGlobals } from "./doc";

/**
 * Brand tokens — what each identity resolves to, and what it had to clear.
 *
 * The page next door shows what the brands look like. This one shows the
 * numbers: every slot's resolved value, the five pairs each brand has to
 * clear, and — where a brand colour could not clear a floor as stated — how
 * far it had to move and whether that move was still the same colour.
 *
 * NOTHING HERE IS TRANSCRIBED. Every swatch, hex and ratio is read with
 * getComputedStyle off a live element inside that brand's own subtree, after
 * the cascade resolved it. A pack that stops filling a slot blanks its row
 * rather than staying correct. The nudge figures come from
 * src/brand/nudges.json, which tools/gen-specimen-packs.mjs writes in the
 * same pass that writes the packs, so the page and the CSS cannot disagree.
 */
function TokenSheet({ pack, density, root }: ContextGlobals) {
  const host = useRef<HTMLDivElement>(null);
  const deps = [pack, density, root];
  return (
    <Page
      hostRef={host}
      title="Brand tokens"
      note={
        <>
          The same six subtrees as <strong>Brands</strong>, read rather than
          looked at. Each card reports what the cascade actually produced
          inside it, judges the five pairs every brand has to clear, and shows
          any colour that had to be moved to get there.
        </>
      }
      spec={
        <>
          The logo row is marked exempt because WCAG 1.4.3 excludes text that
          is part of a logo or brand name from the contrast minimum, which is
          the reason <code>--tk-logo-*</code> is a separate family from{" "}
          <code>--tk-action-*</code>.
          <br />
          <br />
          Where a brand colour failed, the first move was to nudge it rather
          than replace it: <code>tools/nudge-color.mjs</code> holds the hue
          exactly, walks lightness, and returns the passing value closest in
          OKLab. Under &Delta;E 0.05 that is a rendition of the same colour and
          it ships; over 0.10 it is a different colour and the job goes
          elsewhere, with the number recorded. Bathing Bagels needed 0.04 and
          kept its buttons. Mohave has no solution on its hue at all.
        </>
      }
    >
      <div data-shell="stack" data-gap="5" style={{ padding: "var(--tk-space-5)" }}>
        {SPECIMENS.map((spec) => (
          <BrandCard key={spec.slug} spec={spec} deps={deps} view="tokens" />
        ))}
      </div>
    </Page>
  );
}

const meta = {
  title: "02 Tokens/01 Colour/04 Brand tokens",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Resolved values, judged pairs, and every nudge that was needed or refused. */
export const Resolved: Story = {
  name: "Resolved values",
  render: (_args, ctx) => <TokenSheet {...(ctx.globals as unknown as ContextGlobals)} />,
};
