import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";

/**
 * Concentric corners — the corner-audit surface.
 *
 * One rule: inner radius = outer radius minus the gap (the host padding).
 * --tk-radius-nested is a running total, not a fixed step.
 */

const meta = {
  title: "03 Foundations/05 Concentric corners",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Corner audit: inner radius = outer radius minus the host padding. Page-level seed is --tk-radius-xl (2rem). A host with fat pad must seed as pad + desired leaf (not a fixed lg), or layer three goes to zero — buttons inside a CTA plate, for example. Use for nested rounded surfaces that share a centre. Don't use for: capsules (--tk-radius-full), bleeding media flush to the parent edge, or page chrome (skip link) outside the product chain.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const mono: CSSProperties = {
  fontFamily: "var(--tk-font-mono)",
  fontSize: "var(--tk-size-sm)",
  color: "var(--tk-text-secondary)",
  margin: 0,
};

function Host({
  label,
  gap,
  children,
  publish,
}: {
  label: string;
  gap: string;
  children: ReactNode;
  publish: boolean;
}) {
  const style: CSSProperties = {
    ["--_radius" as string]: "var(--tk-radius-nested)",
    ["--_radius-gap" as string]: gap,
    borderRadius: "var(--_radius)",
    padding: gap,
    background: "var(--tk-surface-raised)",
    border: "1px solid var(--tk-line-strong)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--tk-space-3)",
    maxInlineSize: "22rem",
  };
  return (
    <div style={style}>
      <p style={{ ...mono, color: "var(--tk-text-tertiary)" }}>{label}</p>
      {publish ? (
        <div
          style={{
            ["--tk-radius-nested" as string]:
              "max(0px, calc(var(--_radius) - var(--_radius-gap)))",
            display: "flex",
            flexDirection: "column",
            gap: "var(--tk-space-3)",
          }}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function Leaf({ label }: { label: string }) {
  return (
    <div
      style={{
        borderRadius: "var(--tk-radius-nested)",
        padding: "var(--tk-space-4)",
        background: "var(--tk-surface-sunken)",
        border: "1px solid var(--tk-line-default)",
        fontSize: "var(--tk-size-sm)",
      }}
    >
      {label}
    </div>
  );
}

const FORMULA = [
  ':where([data-tk="thing"]) {',
  "  --_radius: var(--tk-radius-nested);",
  "  --_radius-gap: var(--tk-space-5);",
  "  border-radius: var(--_radius);",
  "}",
  ':where([data-tk="thing"]) > * {',
  "  --tk-radius-nested: max(0px, calc(var(--_radius) - var(--_radius-gap)));",
  "}",
].join("\n");

export const Formula: Story = {
  name: "01 Formula",
  render: () => (
    <main
      data-shell="stack"
      data-gap="5"
      style={{ padding: "var(--tk-space-6)", maxInlineSize: "44rem" }}
    >
      <header data-shell="stack" data-gap="2">
        <p className="tk-doc-sub" style={{ margin: 0 }}>
          03 Foundations / 05 Concentric corners
        </p>
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          One rule, everywhere
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Inner radius = outer radius minus the gap. The gap is the host&rsquo;s
          padding on that side.{" "}
          <code>--tk-radius-nested</code> is a running total published on
          children so the container never reads and writes the same custom
          property (that cycle squares every corner).
        </p>
      </header>

      <pre
        style={{
          margin: 0,
          padding: "var(--tk-space-4)",
          background: "var(--tk-surface-sunken)",
          border: "1px solid var(--tk-line-default)",
          borderRadius: "var(--tk-radius-nested)",
          fontFamily: "var(--tk-font-mono)",
          fontSize: "var(--tk-size-sm)",
          overflow: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {FORMULA}
      </pre>

      <p style={mono}>
        Seed at the page: nested starts as lg. Modal and dialog panels re-seed
        at lg because they are top-level surfaces. Leaves (button, field,
        media) consume nested and do not republish unless they become hosts.
      </p>
    </main>
  ),
};

export const SideBySide: Story = {
  name: "02 Wrong vs right",
  render: () => (
    <main
      data-shell="stack"
      data-gap="5"
      style={{ padding: "var(--tk-space-6)", maxInlineSize: "52rem" }}
    >
      <header data-shell="stack" data-gap="2">
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          Wrong vs right
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Same outer radius and same padding. The left leaf reuses the host
          radius (approximate arcs). The right leaf uses outer minus gap
          (shared centre).
        </p>
      </header>

      <div data-shell="row" data-gap="5" style={{ flexWrap: "wrap" }}>
        <div data-shell="stack" data-gap="2">
          <p style={{ ...mono, fontWeight: 600 }}>Guessing (same radius)</p>
          <Host
            label="host · gap space-5 · no publish"
            gap="var(--tk-space-5)"
            publish={false}
          >
            <Leaf label="leaf still at host radius" />
          </Host>
        </div>
        <div data-shell="stack" data-gap="2">
          <p style={{ ...mono, fontWeight: 600 }}>Concentric (outer − gap)</p>
          <Host
            label="host · gap space-5 · publishes"
            gap="var(--tk-space-5)"
            publish={true}
          >
            <Leaf label="leaf = host − padding" />
          </Host>
        </div>
      </div>
    </main>
  ),
};

const EXCEPTIONS: [string, string][] = [
  [
    "Capsules",
    "Chip, pill Button, Meter track, eyebrow — --tk-radius-full is a shape. Subtracting a gap from a pill is meaningless.",
  ],
  [
    "Bleeding media",
    "card-media with data-bleed takes the parent arc (or square on untouched corners). Gap is zero; parent clips.",
  ],
  [
    "Top-level seeds",
    "Modal panel and native dialog re-seed at --tk-radius-lg. They are new surfaces, not children of the page card.",
  ],
  [
    "Floating map chrome",
    "MapLibre control groups share the map nested radius by inheritance. Overlay chrome, not padded inset boxes.",
  ],
  [
    "Page / doc chrome",
    "Skip link and Storybook doc UI may use sm/md/lg hard tokens. Outside the product concentric chain on purpose.",
  ],
];

export const Exceptions: Story = {
  name: "03 Intentional exceptions",
  render: () => (
    <main
      data-shell="stack"
      data-gap="5"
      style={{ padding: "var(--tk-space-6)", maxInlineSize: "44rem" }}
    >
      <header data-shell="stack" data-gap="2">
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          Intentional differences
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Corner audits ask: consistent with the formula, or different on
          purpose? Soft guidance — not a ban list.
        </p>
      </header>

      <ul
        data-shell="stack"
        data-gap="3"
        style={{ margin: 0, padding: 0, listStyle: "none" }}
      >
        {EXCEPTIONS.map(([title, body]) => (
          <li
            key={title}
            data-tk="card"
            data-shell="stack"
            data-gap="2"
            style={{ padding: "var(--tk-space-4)" }}
          >
            <strong>{title}</strong>
            <p data-tk="card-body" style={{ margin: 0 }}>
              {body}
            </p>
          </li>
        ))}
      </ul>

      <p style={mono}>
        Gate: npm run build-storybook && npm run radius — walks Audit/ and
        Components/ stories and checks outer minus padding approximately equals
        inner (±1.5px).
      </p>
    </main>
  ),
};
