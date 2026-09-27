import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { useInlineSize } from "../lib/use-measure";

/**
 * Composition — shells inside shells inside shells.
 *
 * The claim is that layout is assembled by nesting a small set of containers
 * rather than by writing CSS per page. It is true, and the reason is narrower
 * and more useful than "it composes": every framework can nest.
 *
 * What makes nesting *closed* here is that a shell's behaviour depends on two
 * things only — its own attributes, and the inline size it happens to be
 * given. It never asks what contains it and never asks what it contains. So
 * seven shells at depth four are 7^4 arrangements with no combinatorial CSS
 * behind them, and no shell has to be told where it is.
 *
 * The condition that buys this is the interesting part, and it is the third
 * story below: a shell that decides from the *viewport* breaks composition,
 * because it is answering a question that is not about itself. Intrinsic
 * sizing and container queries are not a stylistic preference over media
 * queries. They are what makes the nesting hold.
 */

const meta = {
  title: "03 Foundations/03 Composition",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Shells nest without knowing their depth. Each one resolves against the inline size it is given, which is why nesting them is closed rather than combinatorial.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* --- a frame that reports its own resolved width --------------------------- */

const tag: React.CSSProperties = {
  fontFamily: "var(--tk-font-mono)",
  fontSize: "var(--tk-size-xs)",
  color: "var(--tk-text-tertiary)",
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--tk-space-3)",
};

/** A labelled frame. Prints what the shell inside it actually got to work with. */
function Level({
  label,
  children,
  depth = 0,
}: {
  label: string;
  children: ReactNode;
  depth?: number;
}) {
  const [ref, w] = useInlineSize();
  return (
    <div
      ref={ref}
      style={{
        border: "1px dashed var(--tk-line-strong)",
        borderRadius: "var(--tk-radius-nested)",
        padding: "var(--tk-space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--tk-space-2)",
        minInlineSize: 0,
      }}
    >
      <p style={{ ...tag, margin: 0 }}>
        <span>
          {"·".repeat(depth)} {label}
        </span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{w}px</span>
      </p>
      {children}
    </div>
  );
}

function Tile({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--tk-surface-sunken)",
        border: "1px solid var(--tk-line-default)",
        borderRadius: "var(--tk-radius-nested)",
        padding: "var(--tk-space-4)",
        fontSize: "var(--tk-size-sm)",
        minInlineSize: 0,
      }}
    >
      {children ?? "tile"}
    </div>
  );
}

/* --- 1. depth -------------------------------------------------------------- */

export const Nesting: Story = {
  name: "Shells within shells",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <header data-shell="stack" data-gap="2">
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          Shells within shells
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Five shells, five levels, no CSS written for this arrangement. Each
          frame prints the inline size it resolved against — which is the only
          thing any of them consulted. Drag the Storybook panel or resize the
          window and watch every number change and every shell keep working.
        </p>
      </header>

      <Level label='center width="wide"' depth={0}>
        <div data-shell="center" data-width="wide" data-gap="4">
          <Level label='sidebar side="start"' depth={1}>
            <div data-shell="sidebar" data-gap="4">
              <Level label="stack (the rail)" depth={2}>
                <div data-shell="stack" data-gap="2">
                  <Tile>rail</Tile>
                  <Tile>rail</Tile>
                </div>
              </Level>

              <Level label="stack (the main column)" depth={2}>
                <div data-shell="stack" data-gap="3">
                  <Level label='grid cols="3"' depth={3}>
                    <div data-shell="grid" data-cols="3" data-gap="3">
                      <Tile />
                      <Tile />
                      <Tile />
                      <Tile />
                      <Tile />
                      <Tile />
                    </div>
                  </Level>

                  <Level label="split" depth={3}>
                    <div data-shell="split" data-gap="3">
                      <Level label='inline (nested in the split)' depth={4}>
                        <div data-shell="inline" data-gap="2">
                          <Tile>a</Tile>
                          <Tile>b</Tile>
                        </div>
                      </Level>
                      <Tile>trailing</Tile>
                    </div>
                  </Level>
                </div>
              </Level>
            </div>
          </Level>
        </div>
      </Level>

      <p className="tk-doc-spec" style={{ margin: 0 }}>
        <b>what is not here</b> a breakpoint · a wrapper class · a modifier for
        &ldquo;grid inside a sidebar&rdquo; · any shell that knows its depth
      </p>
    </div>
  ),
};

/* --- 2. the same shell, four widths --------------------------------------- */

const WIDTHS = [
  { label: "full width", flex: "0 0 100%" },
  { label: "three quarters", flex: "0 0 74%" },
  { label: "one half", flex: "0 0 49%" },
  { label: "one third", flex: "0 0 32%" },
];

export const SameShellEveryDepth: Story = {
  name: "One shell, four contexts",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <header data-shell="stack" data-gap="2">
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          One shell, four contexts
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          The markup below is copied four times without a character changed —
          the same <code>grid</code> shell with the same{" "}
          <code>data-cols=&quot;3&quot;</code> and the same six tiles. It
          resolves to three columns, then two, then one, because{" "}
          <code>auto-fit</code> over a <code>minmax()</code> floor is a
          statement about the tiles rather than about the page.
        </p>
        <p className="tk-doc-spec" style={{ margin: 0 }}>
          <b>data-cols</b> is a floor, not a count. It says how narrow a column
          may get before one has to go — which is a property of the content, so
          it travels with the component instead of with the layout.
        </p>
      </header>

      <div data-shell="stack" data-gap="4">
        {WIDTHS.map((w) => (
          <div key={w.label} style={{ flex: w.flex, inlineSize: w.flex.split(" ")[2] }}>
            <Level label={w.label}>
              <div data-shell="grid" data-cols="3" data-gap="3">
                <Tile />
                <Tile />
                <Tile />
                <Tile />
                <Tile />
                <Tile />
              </div>
            </Level>
          </div>
        ))}
      </div>
    </div>
  ),
};

/* --- 3. the condition ------------------------------------------------------ */

export const WhyItComposes: Story = {
  name: "Why it composes",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <style>{`
        /* The counter-example, written the way most systems still write it. */
        .mq-grid {
          display: grid;
          gap: var(--tk-space-3);
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 45rem) {
          .mq-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header data-shell="stack" data-gap="2">
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          Why it composes
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Nesting is not the property. Every system can nest. The property is
          that a shell consults only information <em>about itself</em>, and
          that is what a media query gives up: it asks about the window, which
          is not where the shell lives.
        </p>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Both columns below are the same six tiles in a three-column grid,
          dropped into a narrow parent on a wide screen. One of them notices.
        </p>
      </header>

      <div data-shell="grid" data-cols="2" data-gap="5">
        <Level label="intrinsic — auto-fit over a minmax floor">
          <div data-shell="grid" data-cols="3" data-gap="3">
            <Tile />
            <Tile />
            <Tile />
            <Tile />
            <Tile />
            <Tile />
          </div>
          <p className="tk-doc-spec" style={{ margin: 0 }}>
            <b>correct</b> the parent is narrow, so the grid is narrow, so the
            columns fold. Nothing was told anything.
          </p>
        </Level>

        <Level label="media query — repeat(3, 1fr) until the window is small">
          <div className="mq-grid">
            <Tile />
            <Tile />
            <Tile />
            <Tile />
            <Tile />
            <Tile />
          </div>
          <p className="tk-doc-spec" style={{ margin: 0 }}>
            <b>wrong, and confidently</b> the window is wide, so the query does
            not fire, so three columns are crushed into a half-width parent.
            The rule is doing exactly what it says.
          </p>
        </Level>
      </div>

      <div data-tk="alert" data-status="info">
        <div>
          <p data-tk="alert-title">The general form</p>
          <p style={{ margin: 0 }}>
            A layout primitive composes under nesting if and only if its output
            is a function of its own attributes and its own available size. Add
            any other input — the viewport, a parent&rsquo;s class, a prop
            threaded down a tree — and the primitives stop being closed under
            composition: arrangements start needing cases, and cases multiply
            with depth. That is the whole argument for container queries and
            intrinsic sizing, and it is a structural argument rather than a
            stylistic one.
          </p>
        </div>
      </div>
    </div>
  ),
};
