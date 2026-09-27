import type { ReactNode } from "react";
import { Eyebrow } from "../react/primitives/Eyebrow";
import { Plate } from "../react/primitives/Plate";
import { Masthead, SiteFooter } from "../react/patterns/chrome";
import { ArrowCta, FeatureGrid, ProofStrip } from "../react/patterns/marketing";
import { CtaBlocks, MediaCards, TileGrid } from "../react/patterns/catalog";
import { DoorShopMark, MohaveMark } from "../brand/marks";
import { LogoLadder } from "../react/primitives/LogoLadder";

/**
 * Two pages that are not the same page.
 *
 * The eleven compositions in 08 Prototype share one signature and one spine,
 * which is right for what they are — a neutral prototype where the client's
 * content will land. It also means that applying a pack to them produces the
 * same page in a different colour, six times, and somebody looking at that is
 * entitled to conclude the design system does very little.
 *
 * These two are built to fail that reading. They differ on three axes at
 * once, and only one of the three is colour:
 *
 *   POSTURE   The packs now own proportion — type ramp, display face and
 *             case, radius, density, measure, plate caps. Door Shop's
 *             headline is 3.25rem in caps at 0.9 leading with a 0.85 density
 *             pulling every gap in; Mohave's is 2rem lowercase at 1.2 with a
 *             1.3 density pushing everything apart. Neither page asked for
 *             that. They inherited it from a data-brand attribute.
 *
 *   DENSITY OF CONTENT   Door Shop runs seven sections and shows twenty-odd
 *             items; Mohave runs four and shows six. A retail page and an
 *             editorial page differ in how much they put in front of you
 *             before they ask for anything, and no token can express that —
 *             it is a composition decision, which is why these are two
 *             functions rather than one function with a prop.
 *
 *   WHAT THE IMAGE IS FOR   Door Shop's plates are small, many and
 *             product-shaped. Mohave has one, and it is enormous, and the
 *             page is arranged around it.
 *
 * What is NOT different: every component on both pages. Same Masthead, same
 * TileGrid, same Plate, same footer, same props. Nothing below reads a brand
 * name to decide how to render, and neither page contains a colour.
 */

/* --- shell -----------------------------------------------------------------
   One shell for both, because the difference between these pages is what goes
   in them, not the frame. `data-brand` here rather than on <body> is the
   whole cascade argument: the pack resolves per subtree, so both pages can be
   open in one document — which is exactly what the Storybook docs page does.
--------------------------------------------------------------------------- */
function BrandShell({
  brand,
  children,
  footer = true,
  header,
}: {
  brand: string;
  children: ReactNode;
  footer?: boolean;
  header: ReactNode;
}) {
  return (
    <div
      data-brand={brand}
      data-tk="sample-page"
      style={{
        minBlockSize: "100%",
        background: "var(--tk-surface-default)",
        color: "var(--tk-text-primary)",
      }}
    >
      {header}
      <main>{children}</main>
      {footer ? <SiteFooter /> : null}
    </div>
  );
}

/* Section wrapper. Padding comes from the space ramp, which is the private
   ramp times --tk-density — so the SAME number here produces a tight band
   under Door Shop and a generous one under Mohave, with nothing on this page
   aware that happened. */
function Band({
  children,
  surface,
  tight,
}: {
  children: ReactNode;
  surface?: "sunken" | "inverse";
  tight?: boolean;
}) {
  return (
    <section
      data-surface={surface === "sunken" ? "sunken" : undefined}
      data-on={surface === "inverse" ? "inverse" : undefined}
      style={{
        paddingBlock: tight ? "var(--tk-space-6)" : "var(--tk-space-8)",
        paddingInline: "var(--tk-space-5)",
        background:
          surface === "sunken" ? "var(--tk-surface-sunken)" : undefined,
      }}
    >
      <div style={{ marginInline: "auto", maxInlineSize: "72rem" }}>{children}</div>
    </section>
  );
}

/* ===========================================================================
   DOOR SHOP — the storefront.

   Loud and packed. Seven bands, a headline that fills its line, an offer rail
   above the fold, and tiles in fours rather than threes. The page is trying to
   get as much in front of you as it can before you scroll, which is what the
   density value in the pack is for.
   ======================================================================== */

const DOOR_OFFERS = [
  "Bulk pricing",
  "Next-day pickup",
  "Trade accounts",
  "Price match",
];

const DOOR_TILES = [
  "Hardware",
  "Timber",
  "Paint",
  "Garden",
  "Tools",
  "Plumbing",
  "Electrical",
  "Storage",
];

const DOOR_STATS = [
  { value: "412", label: "Stores" },
  { value: "6am", label: "Doors open" },
  { value: "48hr", label: "Delivery" },
  { value: "30d", label: "Returns" },
];

export function DoorShopPage({ header }: { header?: ReactNode } = {}) {
  return (
    <BrandShell
      brand="door-shop"
      header={
        header ?? (
          <Masthead
            brand="DOOR SHOP"
            navItems={["Departments", "Trade", "Services", "Deals", "Stores"]}
            withMegaMenu
            megaTrigger="Departments"
            showSearch
            showContactCta
          />
        )
      }
    >
      {/* The hero. Note what is NOT here: no image. A retail hero sells the
          offer, and the offer is words and a price. The headline carries it,
          which it can because the pack made it able to. */}
      <Band tight>
        <div data-shell="stack" data-gap="4">
          <div style={{ inlineSize: "min(20rem, 60%)" }}>
            <LogoLadder
              mark={<DoorShopMark />}
              word="DOOR SHOP"
              tagline="Save more"
              label="Door Shop"
            />
          </div>
          <h1 style={{ margin: 0, maxInlineSize: "22ch" }}>
            Everything for the job. Open at six.
          </h1>
          <p
            style={{
              margin: 0,
              maxInlineSize: "var(--tk-measure)",
              fontSize: "var(--tk-size-md)",
              color: "var(--tk-text-secondary)",
            }}
          >
            Four hundred stores, one price list, and a trade counter that knows
            what a joist hanger is.
          </p>
          <div data-shell="inline" data-gap="2">
            <button type="button" data-tk="button" data-variant="solid" data-size="lg">
              Shop the catalogue
            </button>
            <button type="button" data-tk="button" data-variant="outline" data-size="lg">
              Open a trade account
            </button>
          </div>
          {/* The offer rail. Chips, above the fold, because retail puts the
              reasons to stay where you cannot miss them. */}
          <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
            {DOOR_OFFERS.map((offer) => (
              <span key={offer} data-tk="chip" data-emphasis="strong">
                {offer}
              </span>
            ))}
          </div>
        </div>
      </Band>

      <Band tight surface="sunken">
        <ProofStrip
          heading="The numbers"
          deck="What the network actually does, measured monthly."
          stats={DOOR_STATS}
          columns={4}
        />
      </Band>

      {/* Eight tiles in fours, compact. The plate cap in this pack is 15rem,
          so the pictures stay product-sized and the grid stays a grid rather
          than becoming a stack of billboards. */}
      <Band tight>
        <TileGrid heading="Departments" tiles={DOOR_TILES} columns={4} compact />
      </Band>

      <Band tight surface="sunken">
        <CtaBlocks columns={2} />
      </Band>

      <Band tight>
        <MediaCards heading="How-to" columns={3} />
      </Band>

      <Band tight surface="inverse">
        <div data-shell="stack" data-gap="3">
          <Eyebrow>Trade</Eyebrow>
          <h2 style={{ margin: 0, maxInlineSize: "20ch" }}>
            Accounts open in a day
          </h2>
          <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
            Terms, a named contact, and one invoice a month instead of forty.
          </p>
          <div data-shell="inline" data-gap="2">
            <button type="button" data-tk="button" data-variant="solid" data-size="md">
              Apply now
            </button>
          </div>
        </div>
      </Band>
    </BrandShell>
  );
}

/* ===========================================================================
   MOHAVE — the editorial.

   Four bands. One image. A headline smaller than the kit's default, set
   lowercase, with a 64ch measure under it and a 1.3 density pushing the whole
   page apart. Everything this brand does is a refusal to raise its voice, and
   all of it arrives from the pack.
   ======================================================================== */

export function MohavePage({ header }: { header?: ReactNode } = {}) {
  return (
    <BrandShell
      brand="mohave"
      header={
        header ?? (
          <Masthead
            brand="mohave"
            navItems={["Shop", "Stories", "About"]}
            showSearch={false}
            showContactCta={false}
          />
        )
      }
    >
      {/* Type only. No image, no chips, no second button — the hero is a
          sentence and a link, and the air around it is the design. */}
      <Band>
        <div data-shell="stack" data-gap="5">
          <div style={{ inlineSize: "min(18rem, 60%)" }}>
            <LogoLadder
              mark={<MohaveMark />}
              word="mohave"
              tagline="From cart to porch"
              smStage="word"
              label="Mohave"
            />
          </div>
          <h1 style={{ margin: 0, maxInlineSize: "16ch" }}>
            from cart to porch
          </h1>
          <p
            style={{
              margin: 0,
              maxInlineSize: "var(--tk-measure)",
              fontSize: "var(--tk-size-lg)",
              lineHeight: "var(--tk-leading-relaxed)",
              color: "var(--tk-text-secondary)",
            }}
          >
            We move things across a desert. The interesting part is not the
            speed — plenty of people are fast — it is that the box arrives in
            the condition it left in, which turns out to be a harder promise.
          </p>
          <ArrowCta size="lg">Read how it works</ArrowCta>
        </div>
      </Band>

      {/* The image moment. One plate, bleeding, capped at 30rem by the pack
          rather than by anything on this page. Door Shop runs eight plates at
          15rem; this runs one at double that, and the component is identical. */}
      <Band>
        <Plate ratio="21 / 9" texture="hatch" label="Desert route at dawn" bleed />
      </Band>

      <Band surface="sunken">
        <FeatureGrid
          heading="three things we are strict about"
          deck="Not a list of features. A list of arguments we have already had."
          columns={3}
        />
      </Band>

      {/* Closing note at full measure — the longest line on either page, and
          the reason --tk-measure is a pack slot. 64ch here, 46ch at Door Shop. */}
      <Band>
        <div data-shell="stack" data-gap="4">
          <h2 style={{ margin: 0, maxInlineSize: "20ch" }}>
            the boring commitment
          </h2>
          <p
            style={{
              margin: 0,
              maxInlineSize: "var(--tk-measure)",
              lineHeight: "var(--tk-leading-relaxed)",
            }}
          >
            Every route is driven by someone who has driven it before. Every
            handover is photographed. Neither of those is a differentiator in
            any market we know of, and both are the reason the return rate is
            what it is.
          </p>
          <ArrowCta size="md">See the route map</ArrowCta>
        </div>
      </Band>
    </BrandShell>
  );
}
