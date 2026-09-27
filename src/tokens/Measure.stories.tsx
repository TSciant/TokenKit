import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Page, Sub, type ContextGlobals } from "./doc";

/**
 * Pretext is loaded dynamically, and that is only half of what makes it
 * optional.
 *
 * The comment here used to say a dynamic import was enough to survive an
 * uninstalled devDependency. It is not, and believing it cost a debugging
 * session: Vite resolves a dynamic import with a LITERAL specifier at
 * transform time, exactly as it resolves a static one. A missing package
 * fails during transform with "Failed to resolve import", which is before any
 * JavaScript runs, so the .catch() below never existed yet. The guard was
 * guarding the wrong moment.
 *
 * What actually makes it optional is .storybook/main.ts, which checks whether
 * the package resolves and, when it does not, aliases it to a stub that throws
 * on import. That turns a build-time resolution failure into a runtime
 * rejection, which is the thing the .catch() was always waiting for. Both
 * paths are exercised: package present, and package removed.
 */
type PretextModule = typeof import("@chenglou/pretext");

function usePretext() {
  const [mod, setMod] = useState<PretextModule | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    import("@chenglou/pretext")
      .then((m) => live && setMod(m))
      .catch(() => live && setMissing(true));
    return () => {
      live = false;
    };
  }, []);

  return { pretext: mod, missing };
}

/**
 * Measure — the typographic half of what the contrast story does for colour.
 *
 * Pretext lays text out for real: line breaking, bidi, word-break, letter
 * spacing, the lot. So instead of asserting that a measure token is right, the
 * kit can ask what a real string in the real resolved font actually does at a
 * given width, and read the answer off.
 *
 * The finding that justified adding it: --tk-measure was 68ch and rendered at
 * 80 characters per line. `ch` is the advance width of the digit zero, wider
 * than the average character, so a measure in `ch` always reads longer than
 * its number suggests. 56ch lands at 66, which is the middle of the band.
 */

/** Real prose. Lorem has the wrong letter frequencies and measures short. */
const SAMPLE = `A design system is a contract between the people who choose values and the people who spend them. The token layer holds the decisions, the component layer holds the questions, and the cascade decides which answer applies where. When that boundary is clear a brand can be applied by editing one file, and when it is not the work turns into a search across every component for a hard-coded value that should never have been written down twice.`;

const TITLE = `Independent decisions, named once in the contract`;

/** Bringhurst's band: 45-75 characters, 66 ideal. A convention, not a finding. */
const CPL_MIN = 45;
const CPL_IDEAL = 66;
const CPL_MAX = 75;

type Row = {
  label: string;
  widthPx: number;
  fontPx: number;
  lines: number;
  cpl: number;
  state: "pass" | "fail" | "note";
  verdict: string;
};

function fontOf(el: Element) {
  const cs = getComputedStyle(el);
  const style = cs.fontStyle === "normal" ? "" : `${cs.fontStyle} `;
  return `${style}${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

function measure(
  px: PretextModule,
  el: HTMLElement,
  text: string,
  widthPx: number,
) {
  const cs = getComputedStyle(el);
  const lineHeight =
    cs.lineHeight === "normal"
      ? parseFloat(cs.fontSize) * 1.2
      : parseFloat(cs.lineHeight);
  const prepared = px.prepareWithSegments(text, fontOf(el), {
    letterSpacing: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing),
  });
  const out = px.layoutWithLines(prepared, widthPx, lineHeight);
  const lines = out.lines.map((l) => l.text.replace(/\s+$/, ""));
  const counts = lines.map((l) => [...l].length);
  const body = counts.length > 1 ? counts.slice(0, -1) : counts;
  return {
    lines,
    lineCount: out.lineCount,
    cpl: body.reduce((a, b) => a + b, 0) / body.length,
    fontPx: parseFloat(cs.fontSize),
  };
}

/** Smallest width at which the string fits in `target` lines. */
function breakpointFor(
  px: PretextModule,
  el: HTMLElement,
  text: string,
  target: number,
) {
  const cs = getComputedStyle(el);
  const prepared = px.prepareWithSegments(text, fontOf(el), {
    letterSpacing: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing),
  });
  let lo = 32;
  let hi = 4000;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    if (px.measureLineStats(prepared, mid).lineCount <= target) hi = mid;
    else lo = mid;
  }
  return hi;
}

function MeasureStory({ pack, density, root }: ContextGlobals) {
  const { pretext, missing } = usePretext();
  const host = useRef<HTMLDivElement>(null);
  const bodyProbe = useRef<HTMLParagraphElement>(null);
  const titleProbe = useRef<HTMLHeadingElement>(null);
  const steppedProbe = useRef<HTMLHeadingElement>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [breaks, setBreaks] = useState<{ label: string; rem: number }[]>([]);
  const [sampleLines, setSampleLines] = useState<string[]>([]);

  useLayoutEffect(() => {
    const el = bodyProbe.current;
    const h = host.current;
    if (!el || !h || !pretext) return;

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const cs = getComputedStyle(el);
    const measurePx = parseFloat(cs.maxInlineSize);

    const next: Row[] = [];

    const judge = (label: string, widthPx: number) => {
      const m = measure(pretext, el, SAMPLE, widthPx);
      const ok = m.cpl >= CPL_MIN && m.cpl <= CPL_MAX;
      next.push({
        label,
        widthPx,
        fontPx: m.fontPx,
        lines: m.lineCount,
        cpl: m.cpl,
        state: ok ? "pass" : "fail",
        verdict: ok
          ? `${m.cpl.toFixed(1)} CPL`
          : `${m.cpl.toFixed(1)} CPL · ${m.cpl > CPL_MAX ? "too wide" : "too narrow"}`,
      });
      return m;
    };

    const atMeasure = judge("--tk-measure", measurePx);
    setSampleLines(atMeasure.lines);

    const narrowPx =
      parseFloat(
        getComputedStyle(h).getPropertyValue("--tk-measure-narrow"),
      ) * (getComputedStyle(el).fontSize ? 1 : 1);
    // --tk-measure-narrow is in ch; resolve it by applying it to the probe.
    el.style.maxInlineSize = "var(--tk-measure-narrow)";
    const narrowResolved = parseFloat(getComputedStyle(el).maxInlineSize);
    judge("--tk-measure-narrow", Number.isFinite(narrowResolved) ? narrowResolved : narrowPx);
    el.style.maxInlineSize = "";

    // What the band would look like at the edges, for orientation.
    judge(`ideal ${CPL_IDEAL} CPL`, (measurePx * CPL_IDEAL) / atMeasure.cpl);
    judge(`limit ${CPL_MAX} CPL`, (measurePx * CPL_MAX) / atMeasure.cpl);

    setRows(next);

    const t = titleProbe.current;
    const st = steppedProbe.current;
    setBreaks([
      ...(t
        ? [
            { label: "card title · 1 line", rem: breakpointFor(pretext, t, TITLE, 1) / rem },
            { label: "card title · 2 lines", rem: breakpointFor(pretext, t, TITLE, 2) / rem },
          ]
        : []),
      ...(st
        ? [
            {
              label: "stepped-up size · 1 line",
              rem: breakpointFor(pretext, st, TITLE, 1) / rem,
            },
          ]
        : []),
    ]);
  }, [pack, density, root, pretext]);

  if (missing) {
    return (
      <div ref={host}>
        <h1 className="tk-doc-title">Measure</h1>
        <p className="tk-doc-note">
          This story measures real text with{" "}
          <code>@chenglou/pretext</code>, which is declared as a devDependency
          but is not installed in this checkout.
        </p>
        <div data-tk="alert" data-status="warning" style={{ maxInlineSize: "48rem" }}>
          <div>
            <p data-tk="alert-title">Run npm install</p>
            Everything else in this Storybook works without it — Pretext is used
            for measurement only and never ships with the kit.
          </div>
        </div>
        <p className="tk-doc-spec">
          The same engine backs <code>npm run type-gate</code>, which loads a
          committed bundle at <code>tests/vendor/pretext.js</code> and does not
          need the package installed.
        </p>
      </div>
    );
  }

  if (!pretext) {
    return (
      <div ref={host}>
        <h1 className="tk-doc-title">Measure</h1>
        <p className="tk-doc-note">Loading the layout engine…</p>
      </div>
    );
  }

  return (
    <Page
      hostRef={host}
      title="Measure"
      note={
        <>
          Every number below is laid out by Pretext against the font the cascade
          actually resolved, at the width the token actually computes to. The
          band is 45-75 characters per line with 66 as the ideal — a typographic
          convention rather than a controlled result, but a well-supported one.
          Change the root size in the toolbar: measure is in <code>ch</code>, so
          the character count should hold while the pixel width moves.
        </>
      }
      spec={
        <>
          <b>@chenglou/pretext</b> · measurement only, never shipped with the
          kit · the same engine backs <code>npm run type-gate</code>
        </>
      }
    >
      {/* Probes carrying the real computed type of each role. */}
      <div style={{ position: "absolute", visibility: "hidden", pointerEvents: "none" }}>
        <p ref={bodyProbe} />
        <h3 ref={titleProbe} data-tk="card-title" />
        <h3 ref={steppedProbe} data-tk="card-title" style={{ fontSize: "var(--tk-size-xl)" }} />
      </div>

      <Sub>Characters per line</Sub>
      {rows.map((r) => (
        <div className="tk-row" key={r.label}>
          <span />
          <code>{r.label}</code>
          <span className="tk-value">
            {r.widthPx.toFixed(0)}px · {r.lines} lines
          </span>
          <span className="tk-verdict" data-state={r.state}>
            {r.verdict}
          </span>
        </div>
      ))}

      <Sub>Measured breakpoints — where the line count actually changes</Sub>
      {breaks.map((b) => (
        <div className="tk-row" key={b.label}>
          <span />
          <code>{b.label}</code>
          <span className="tk-value">{(b.rem * 16).toFixed(0)}px at 16px root</span>
          <span className="tk-verdict">{b.rem.toFixed(1)}rem</span>
        </div>
      ))}
      <p className="tk-doc-spec">
        The card's container query is set at <b>42rem</b>, taken from the last
        row. Below it, stepping the title up buys presence at the price of a
        wrap — it used to be 30rem, and nothing in the source said so.
      </p>

      <Sub>The sample, broken as Pretext breaks it at --tk-measure</Sub>
      <div
        style={{
          maxInlineSize: "var(--tk-measure)",
          borderInlineStart: "1px solid var(--tk-line-strong)",
          paddingInlineStart: "var(--tk-space-4)",
        }}
      >
        {sampleLines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: "var(--tk-font-mono)",
              fontSize: "var(--tk-size-xs)",
              color: "var(--tk-text-tertiary)",
              whiteSpace: "nowrap",
            }}
          >
            {/* Not opacity. A 0.6 alpha over --tk-text-tertiary composites to #9d9d9d,
                which is 2.46:1 on the base surface — axe caught it here. Opacity is a
                contrast decision that does not look like one, so the de-emphasis is a
                token and the hierarchy comes from size. */}
            <span style={{ color: "var(--tk-text-tertiary)" }}>{String(i + 1).padStart(2, "0")} </span>
            {line}
            <span style={{ color: "var(--tk-text-tertiary)" }}> · {[...line].length}</span>
          </div>
        ))}
      </div>
      <p className="tk-doc-spec">
        Line numbers and character counts come from the layout engine, not from
        the rendered DOM — which is why this works before anything is painted.
      </p>
    </Page>
  );
}

/* No `component` on this meta, and no `<typeof MeasureStory>` on the Meta.

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
  title: "02 Tokens/05 Measure",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CharactersPerLine: Story = {
  name: "Characters per line",
  render: (_args, ctx) => (
    <MeasureStory {...(ctx.globals as unknown as ContextGlobals)} />
  ),
};
