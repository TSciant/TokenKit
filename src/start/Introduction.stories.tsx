import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

/**
 * 00 Start — how to read tokenkit in Storybook.
 * Numbered IA is the contract: chapter → section → story.
 */

const meta = {
  title: "00 Start/01 Introduction",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Numbered Storybook curriculum for a grayscale, browser-true kit. Soft Use for / Don't use for guidance helps assemblers ship faster without turning Docs into a policy manual. Built so engineers assemble with confidence and leadership can see structure before paint spend.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function H2({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        marginBlockStart: "var(--tk-space-6)",
        marginBlockEnd: "var(--tk-space-3)",
        fontSize: "var(--tk-size-xl)",
        letterSpacing: "var(--tk-tracking-snug)",
      }}
    >
      {children}
    </h2>
  );
}

function Row({
  num,
  name,
  body,
}: {
  num: string;
  name: string;
  body: string;
}) {
  return (
    <div
      data-shell="row"
      data-gap="4"
      style={{
        alignItems: "flex-start",
        paddingBlock: "var(--tk-space-3)",
        borderBlockStart: "1px solid var(--tk-line-subtle, var(--tk-border-default))",
      }}
    >
      <span
        style={{
          fontFamily: "var(--tk-font-mono)",
          fontSize: "var(--tk-size-sm)",
          color: "var(--tk-text-tertiary)",
          minInlineSize: "2.5rem",
        }}
      >
        {num}
      </span>
      <div data-shell="stack" data-gap="1" style={{ flex: 1 }}>
        <strong style={{ fontWeight: "var(--tk-weight-semibold)" }}>{name}</strong>
        <p data-tk="card-body" style={{ margin: 0 }}>
          {body}
        </p>
      </div>
    </div>
  );
}

const CHAPTERS = [
  {
    num: "00",
    name: "Start",
    body: "Orientation. Read Introduction, then the system map before diving into tokens.",
  },
  {
    num: "01",
    name: "Ethos",
    body: "Browser truth — computed styles in a real document are the measurement.",
  },
  {
    num: "02",
    name: "Tokens",
    body: "Ramp, contract, scales, type, measure, motion, texture, contrast, export.",
  },
  {
    num: "03",
    name: "Foundations",
    body: "Layers, context, composition and the layout shells (stack, row, grid, split…), scrim, concentric corners, usable props, token optionality.",
  },
  {
    num: "04",
    name: "Primitives",
    body: "The components, numbered by role. Docs cover props, a11y, and soft Use for / Don't use for — guidance that helps, not restricts.",
  },
  {
    num: "05",
    name: "Patterns",
    body: "Composed patterns — masthead, heroes, grids, directories, whole page templates — parameterised by props.",
  },
  {
    num: "06",
    name: "Motion",
    body: "FX system — fx prop, host inference, reduced motion.",
  },
  {
    num: "07",
    name: "Playground",
    body: "Drive the tokens and watch every slot resolve.",
  },
  {
    num: "08",
    name: "Prototype",
    body: "Optional clickable dogfood. Proof of assembly — not the product a team ships from.",
  },
  {
    num: "09",
    name: "Client",
    body: "Where a fork's own primitives and patterns go, behind the client boundary.",
  },
];

const COMPONENTS = [
  ["01", "Button", "Primary actions. On-scrim pairs come from the pack, not the component."],
  ["02", "Chip", "Compact labels / filters. Fit-content so they do not stretch in columns."],
  ["03", "Field", "Labeled inputs with required / error slots."],
  ["04", "Icon", "Lucide set via name — size tokens only."],
  ["05", "Card", "Query container; title steps with container width."],
  ["06", "Media", "Image / video frame with motion fx."],
  ["07", "Figure", "Captioned media with optional credit."],
  ["08", "Alert", "Status message — status is not colour alone."],
  ["09", "Modal", "Native dialog + ModalTrigger compose."],
  ["10", "FAQ", "Numbered disclosure for FAQ or additional info (tone)."],
  ["11", "Search results", "Hit list with type tags."],
  ["12", "Meter", "Scalar progress."],
  ["13", "Gauge", "Radial reading."],
  ["14", "Tachometer", "Banded dial."],
  ["15", "Map", "MapLibre light/dark + token-styled controls."],
  ["16", "Plate", "Photograph stand-in; bleed flushes inside cards."],
  ["17", "Eyebrow", "Uppercase kicker above a headline."],
  ["18", "Disclosure", "Panel entrance via @starting-style."],
  ["19", "Search", "Header search that collapses, does not swap DOM."],
  ["20", "Site header", "Brand, nav, optional mega sheet — no Monty."],
  ["21", "Skip link", "Focus-revealed skip to main."],
  ["22", "Logo ladder", "A logo that picks its own stage, full lockup to bare mark, from the box it is given."],
  ["23", "Gradient", "A brand gradient as four coordinates; the pack owns the colours."],
  ["24", "Guidance", "Do / Don't that says it in words, not only in colour."],
];

const PATTERN_FAMILIES = [
  ["chrome.tsx", "What every page carries — masthead, mega menu, header search, page hero, footer."],
  ["marketing.tsx", "The campaign surface — hero carousel, arrow CTA, proof strip, segment list, feature grid, article feed, event promo."],
  ["catalog.tsx", "Browse and repeating records — tile grid, hub cards, CTA blocks, filter bar, media cards, people directory, event list."],
  ["templates.tsx", "Whole-page compositions and capture — lead form, apply form, segment page, sub-brand page, article page."],
];

export const Introduction: Story = {
  name: "01 Introduction",
  render: () => (
    <main
      data-shell="stack"
      data-gap="5"
      style={{
        maxInlineSize: "44rem",
        padding: "var(--tk-space-6)",
      }}
    >
      <header data-shell="stack" data-gap="2">
        <p className="tk-doc-sub" style={{ margin: 0 }}>
          tokenkit · Storybook IA
        </p>
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          How to read this kit
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          The sidebar is a numbered curriculum, not a dump of files. Chapters are
          two digits. Inside Tokens, Foundations, Primitives and Patterns,
          sections keep a local sequence so you can cite &ldquo;04.09 Modal&rdquo;
          in review.
        </p>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          This is a client-neutral kit, not one client&rsquo;s site. It ships a
          token contract, two grayscale packs, the primitives, and a set of
          composed patterns. You fork it and add a client&rsquo;s own primitives
          and components additively, so delivering to one client hands them
          their work and not everything else.
        </p>
      </header>

      <H2>Two readers, one kit</H2>
      <div data-shell="stack" data-gap="3">
        <p data-tk="card-body" style={{ margin: 0 }}>
          <strong>Engineers</strong> get shells, primitives, and Docs that say
          what to reach for without locking you out of a good judgment call.
          Soft Use for / Don&rsquo;t use for lines are guidance for speed, not
          lint rules. Compose pages from Shells + Components; flip Pack /
          Density / Root in the toolbar and watch the cascade resolve.
        </p>
        <p data-tk="card-body" style={{ margin: 0 }}>
          <strong>Leadership</strong> gets a single browser-true source of
          structure before brand paint. Wireframe fidelity means fewer
          &ldquo;which mock is real?&rdquo; loops, cite-able reviews
          (chapter.section), and a kit a team can assemble from instead of
          reinterpreting every screen. Ethos is the constitution; Sample Pages
          and the optional Prototype are proof, not the product.
        </p>
      </div>

      <H2>Chapters</H2>
      <div data-shell="stack" data-gap="0">
        {CHAPTERS.map((c) => (
          <Row key={c.num} num={c.num} name={c.name} body={c.body} />
        ))}
      </div>

      <H2>04 Primitives — role order</H2>
      <p data-tk="card-body" style={{ margin: 0 }}>
        Not alphabetical. These are the primitives: each reads only tokens and
        its own box, and knows nothing about the page it lands on. Open a
        component&rsquo;s Docs tab for the contract (props, a11y, and soft Use
        for / Don&rsquo;t use for guidance).
      </p>
      <div data-shell="stack" data-gap="0">
        {COMPONENTS.map(([num, name, body]) => (
          <Row key={num} num={num} name={name} body={body} />
        ))}
      </div>

      <H2>Composed patterns</H2>
      <p data-tk="card-body" style={{ margin: 0 }}>
        Above the primitives sit the patterns — headers, heroes, grids,
        directories, whole page templates — in{" "}
        <code>src/react/patterns/</code>, four files by family. They are
        parameterised: content and shape arrive as props, so the same pattern
        serves a different client by taking different arguments, not a fork.
        Each has a story in 05 Patterns, and they are assembled into whole
        pages in 08 Prototype.
      </p>
      <div data-shell="stack" data-gap="0">
        {PATTERN_FAMILIES.map(([name, body]) => (
          <Row key={name} num="" name={name} body={body} />
        ))}
      </div>

      <H2>Forking for a client</H2>
      <p data-tk="card-body" style={{ margin: 0 }}>
        Add, do not edit. A client&rsquo;s brand is a pack — copy{" "}
        <code>src/css/packs/_template.css</code> and fill the contract slots;
        the components do not change. A client&rsquo;s own primitives and
        patterns go in beside the kit&rsquo;s, under the client boundary, so
        what ships is the kit plus that client&rsquo;s work and nothing from
        anyone else&rsquo;s.
      </p>

      <H2>Toolbar axes</H2>
      <p data-tk="card-body" style={{ margin: 0 }}>
        Pack (wireframe / wireframe-dark), Density, and Root font size are
        context — not component variants. Flip them on any story to see the
        cascade resolve.
      </p>

      <H2>Where to click first</H2>
      <ol style={{ margin: 0, paddingInlineStart: "1.25rem", maxInlineSize: "var(--tk-measure)" }}>
        <li>01 Ethos &rarr; Browser truth</li>
        <li>02 Tokens &rarr; 01 Colour &rarr; 01 Ramp, then 02 Contract</li>
        <li>03 Foundations &rarr; 03 Composition (the shells: layout with no visual opinion)</li>
        <li>04 Primitives &rarr; 01 Button (soft Use for / Don&rsquo;t use for)</li>
        <li>03 Foundations &rarr; 06 Usable props, then 07 Token optionality</li>
        <li>Optional proof: 08 Prototype</li>
      </ol>
    </main>
  ),
};

