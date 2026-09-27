import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

/**
 * Ethos — Browser truth at wireframe fidelity.
 *
 * Source of record: docs/00-browser-truth.md. This story is the same text,
 * rendered in the kit so the constitution and the system share one surface.
 */

const meta = {
  title: "01 Ethos/Browser truth",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The wireframe-level constitution of tokenkit. Design files and jackets are drafts; computed styles in a real document are the measurement. Use for: Aligning design, engineering, and leadership on one measurement: what a real document computes. Don't use for: Treating Figma, screenshots, or one-shot answers as the spine of the product when the browser can settle the question.",
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
        marginBlockStart: "var(--tk-space-7)",
        marginBlockEnd: "var(--tk-space-3)",
        fontSize: "var(--tk-size-xl)",
        letterSpacing: "var(--tk-tracking-snug)",
      }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p
      className="tk-doc-note"
      style={{ marginBlock: "var(--tk-space-2)", maxInlineSize: "var(--tk-measure)" }}
    >
      {children}
    </p>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code style={{ fontFamily: "var(--tk-font-mono)", fontSize: "var(--tk-size-sm)" }}>
      {children}
    </code>
  );
}

const TEETH: [string, string][] = [
  ["Browser is truth", "Storybook toolbar contexts; gates read computed styles"],
  ["Box over window", "Shells, container queries, concentric radius"],
  ["One DOM", "Shared modules; no per-breakpoint content forks"],
  ["Tokens as atoms", "lint:css, @property, pack contract"],
  ["Primitives as coordinates", "data-* attributes; React maps props → attributes only"],
  ["Brand as pack", "packs/wireframe.css · packs/wireframe-dark.css"],
  ["A11y in context", "contrast-gate · a11y-gate · type-gate · radius-gate"],
];

export const Constitution: Story = {
  name: "Constitution",
  render: () => (
    <article data-shell="stack" data-gap="4" style={{ padding: "var(--tk-space-5)" }}>
      <header data-shell="stack" data-gap="3">
        <p className="tk-doc-sub" style={{ margin: 0 }}>
          tokenkit · wireframe fidelity
        </p>
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          Browser truth
        </h1>
        <p className="tk-doc-note" style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
          The boilerplate every pack, primitive, gate, and sample page is
          supposed to obey. Not a brand manifesto — the constitution of a
          grayscale structural kit that stays honest when paint, platforms, and
          agents all show up hungry.
        </p>
        <div
          data-texture-overlay="noise"
          data-tk="alert"
          data-status="info"
          style={{ maxInlineSize: "var(--tk-measure)" }}
        >
          <div>
            <p data-tk="alert-title">In one breath</p>
            <p style={{ margin: 0 }}>
              Tokens are atoms. Primitives read only tokens and the box. Brand
              is a pack. One DOM, no Monty. Accessibility is gated in context.
              Jackets subscribe. The browser is the truth — where intention and
              production become an experience, not an artifact in a domain tool.
            </p>
          </div>
        </div>
      </header>

      <H2>The browser is the truth</H2>
      <P>
        Design files, frameworks, and model passes are drafts. What the user
        sees in a real document — computed styles, real width, real type — is
        the measurement. Everything else is a jacket until it shows up there.
      </P>
      <P>
        We do not collapse early for a privileged observer. Figma, a screenshot,
        or a one-shot answer does not own the spine. The runtime opens the box.
        Storybook globals change an ancestor; the cascade re-resolves. Gates
        read computed styles instead of trusting source text.
      </P>

      <H2>Box model(s)</H2>
      <P>
        Layout truth lives in the box. Prefer the geometry of <strong>this</strong>{" "}
        container over a map of the window. Shells and primitives are functions
        of their own attributes and available size (
        <Code>data-shell</Code>, <Code>data-gap</Code>, container queries,
        concentric <Code>--tk-radius-nested</Code>). Nested UI must not pretend
        the window is its parent.
      </P>

      <H2>DOM(s)</H2>
      <P>
        One content spine. One DOM. Paint may reflow; it does not run
        three-screen Monty — different decks of facts swapped by viewport.
      </P>
      <P>
        <strong>Sample Pages responsive frames are not Monty.</strong> The same
        page, same markup, shown at 360 / 768 / 1280 as narrower boxes. That is
        measuring the box. Monty is shipping three content trees and picking one
        by viewport.
      </P>

      <H2>Tokens</H2>
      <P>
        Tokens are the atoms — not the components. A fixed contract (
        <Code>--tk-*</Code> slots) is what every primitive reads. Packs fill the
        contract; they do not rename it. If it isn’t in the contract, it isn’t
        in the system. Texture follows the same split: kit-owned masks,
        pack-owned <Code>--tk-texture-ink</Code>.
      </P>

      <H2>Primitives</H2>
      <P>
        Props are coordinates, not branch forests — attributes CSS can match.
        Context resolves on ancestors. Don’t stamp a variant until a real state
        needs a branch (open, error, disabled, busy, pressed) — not decoration.
        Progressive enhancement adds layers on a native baseline.
      </P>

      <H2>Brands</H2>
      <P>
        Brand is a property, not a checkpoint. Same markup. Pack swap. Wireframe
        fidelity is the default pack — grayscale, structural, enough presence
        to sell structure without impersonating a painted brand. Jackets
        subscribe to the contract; they do not prescribe it.
      </P>

      <H2>Accessibility</H2>
      <P>
        Not a palette pass at <Code>:root</Code>. Check the system the way it
        ships: every surface, density, and brand context, after the cascade.
        Type measure is measured. Hit targets and focus are tokens with floors.
        Grayscale may carry meaning with boundary and label; color alone never
        does. Gates with exit codes beat screenshots as proof.
      </P>

      <H2>Paint, agents, and observers</H2>
      <P>
        Paint refuses content forks. Agents get a predictable embeddable chunk:
        semantics out, style at home — a contract a tool can execute without
        reinventing the design system every turn. Same spine for craft, jackets,
        gates, and agents.
      </P>

      <H2>Enforcement</H2>
      <div data-shell="stack" data-gap="0" style={{ maxInlineSize: "40rem" }}>
        {TEETH.map(([principle, where]) => (
          <div
            key={principle}
            data-shell="split"
            data-gap="4"
            style={{
              paddingBlock: "var(--tk-space-3)",
              borderBlockEnd: "1px solid var(--tk-line-subtle)",
            }}
          >
            <strong style={{ flex: "0 1 12rem" }}>{principle}</strong>
            <span className="tk-doc-note" style={{ margin: 0 }}>
              {where}
            </span>
          </div>
        ))}
      </div>

      <p className="tk-doc-spec" style={{ marginBlockStart: "var(--tk-space-6)" }}>
        <b>source of record</b> docs/00-browser-truth.md ·{" "}
        <b>out of ethos</b> a hex in a component, a second DOM for mobile, or a
        screenshot as the only proof
      </p>
    </article>
  ),
};
