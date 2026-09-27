import type { Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useReducer, useRef, useState } from "react";
import { contrastRatio, format, THRESHOLD } from "../lib/contrast";
import { Page, Sub, type ContextGlobals } from "./doc";

/**
 * Live contrast guard.
 *
 * The gate in CI asserts the same pairs by mounting a fixture in headless
 * Chromium. This story does it in the browser you are already looking at, so a
 * pack you are editing reports before you commit rather than after.
 */

type Probe = {
  label: string;
  kind: keyof typeof THRESHOLD;
  render: (ref: (el: HTMLElement | null) => void) => React.ReactNode;
  /** Which computed property carries the foreground. */
  source: "color" | "borderTopColor" | "backgroundColor" | "outlineColor";
};

const PROBES: Probe[] = [
  {
    label: "Body text on surface",
    kind: "textNormal",
    source: "color",
    render: (ref) => (
      <p ref={ref} style={{ margin: 0 }}>
        Primary body text
      </p>
    ),
  },
  {
    label: "Secondary text on surface",
    kind: "textNormal",
    source: "color",
    render: (ref) => (
      <p ref={ref} style={{ margin: 0, color: "var(--tk-text-secondary)" }}>
        Secondary body text
      </p>
    ),
  },
  {
    label: "Solid button ink on fill",
    kind: "textNormal",
    source: "color",
    render: (ref) => (
      <button ref={ref as never} data-tk="button">
        Solid
      </button>
    ),
  },
  {
    label: "Outline button boundary",
    kind: "nonText",
    source: "borderTopColor",
    render: (ref) => (
      <button ref={ref as never} data-tk="button" data-variant="outline">
        Outline
      </button>
    ),
  },
  {
    label: "Input boundary",
    kind: "nonText",
    source: "borderTopColor",
    render: (ref) => <input
        ref={ref as never}
        data-tk="input"
        defaultValue="value"
        aria-label="Contrast probe — input"
      />,
  },
  {
    label: "Chip label on chip fill",
    kind: "textNormal",
    source: "color",
    render: (ref) => (
      <span ref={ref as never} data-tk="chip">
        chip
      </span>
    ),
  },
  {
    label: "Meter fill on track",
    kind: "nonText",
    source: "backgroundColor",
    render: (ref) => (
      <div data-tk="meter-track" style={{ inlineSize: "8rem" }}>
        <div
          ref={ref as never}
          data-tk="meter-fill"
          style={{ ["--tk-meter-value" as string]: 64 }}
        />
      </div>
    ),
  },
];

const OPAQUE = (v: string) => {
  const m = /rgba?\(([^)]+)\)/.exec(v || "");
  if (!m) return Boolean(v) && v !== "transparent";
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length < 4 || parseFloat(parts[3]) > 0;
};

function backdropOf(el: HTMLElement): string {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (OPAQUE(bg)) return bg;
    node = node.parentElement;
  }
  return "rgb(255, 255, 255)";
}

function ContrastGuard({ pack, density, root }: ContextGlobals) {
  const host = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLElement | null)[]>([]);
  const [rows, setRows] = useState<
    { label: string; ratio: number | null; required: number; pass: boolean }[]
  >([]);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useLayoutEffect(() => {
    const next = PROBES.map((probe, i) => {
      const el = els.current[i];
      const required = THRESHOLD[probe.kind];
      if (!el) return { label: probe.label, ratio: null, required, pass: false };
      const cs = getComputedStyle(el);
      const fg = cs[probe.source];
      const bg =
        probe.source === "color" && OPAQUE(cs.backgroundColor)
          ? cs.backgroundColor
          : backdropOf(el);
      const ratio = contrastRatio(fg, bg);
      return { label: probe.label, ratio, required, pass: ratio != null && ratio >= required };
    });
    setRows(next);
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack, density, root]);

  const failing = rows.filter((r) => !r.pass).length;

  return (
    <Page
      hostRef={host}
      title="Contrast"
      note={
        <>
          Every row is measured off the rendered element beside it, not from a
          palette. That is the distinction that matters: a palette check cannot
          see a token that resolves correctly at <code>:root</code> and fails two
          levels down inside a density or an inverted plate. Change the pack and
          the numbers move.
        </>
      }
      spec={
        <>
          <b>{rows.length - failing}</b> pass · <b>{failing}</b> fail · the CI
          gate asserts 133 pairs across every surface, density and pack —{" "}
          <code>npm run gate</code>
        </>
      }
    >
      <Sub>Specimens</Sub>
      <div
        className="tk-stage"
        data-shell="row"
        data-gap="4"
        style={{ alignItems: "center" }}
      >
        {PROBES.map((probe, i) => (
          <span key={probe.label}>
            {probe.render((el) => {
              els.current[i] = el;
            })}
          </span>
        ))}
      </div>

      <Sub>Measured</Sub>
      {rows.map((r) => (
        <div className="tk-row" key={r.label}>
          <span />
          <code>{r.label}</code>
          <span className="tk-value">needs {r.required}:1</span>
          <span className="tk-verdict" data-state={r.pass ? "pass" : "fail"}>
            {format(r.ratio)}
          </span>
        </div>
      ))}
    </Page>
  );
}

/* No `component` on this meta, and no `<typeof ContrastGuard>` on the Meta.

   Both of those make Storybook infer the story's args from the component's
   props — and this page has no args. It is driven entirely by the toolbar
   globals (pack, density, root); every render here reads ctx.globals and
   ignores what it was handed. Binding the two made the component's props
   required args, so each story was a type error for not supplying values that
   would have been overwritten on the next line. The prose in
   parameters.docs.description is what the docs page needed from `component`
   anyway; a props table of three globals would have been a lie about where
   they come from. */
const meta = {
  title: "02 Tokens/08 Contrast",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveGuard: Story = {
  name: "Live guard",
  render: (_args, ctx) => (
    <ContrastGuard {...(ctx.globals as unknown as ContextGlobals)} />
  ),
};
