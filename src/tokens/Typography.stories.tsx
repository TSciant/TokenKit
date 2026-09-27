import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page, Sub, useTokenReader, TYPE_STEPS, type ContextGlobals } from "./doc";

/**
 * Typography — the whole type contract on one page.
 *
 * Every number here is read off a real element after the cascade resolved it,
 * so what you are looking at is what the pack and the toolbar actually
 * produced, not a transcription of the source.
 */

const meta = {
  title: "02 Tokens/04 Typography",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The face, the size ramp with its paired leading and tracking, the weights, the OpenType features in use, and the measure. Read from computed styles in whatever context the toolbar is set to.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SPECIMEN = "Type scale and measure after the 2026 gate";

/* The ramp, with the leading and tracking each step is paired with in
   04-elements.css. Kept here as the mapping, read as values below. */
const ROLES = [
  { step: "4xl", el: "display", leading: "display", tracking: "display", weight: "bold" },
  { step: "3xl", el: "h1", leading: "display", tracking: "display", weight: "bold" },
  { step: "2xl", el: "h2", leading: "tight", tracking: "tight", weight: "semibold" },
  { step: "xl", el: "h3", leading: "tight", tracking: "tight", weight: "semibold" },
  { step: "lg", el: "h4", leading: "tight", tracking: "snug", weight: "semibold" },
  { step: "md", el: "h5", leading: "snug", tracking: "snug", weight: "semibold" },
  { step: "base", el: "body", leading: "relaxed", tracking: "normal", weight: "normal" },
  { step: "sm", el: "small / eyebrow", leading: "snug", tracking: "wide", weight: "medium" },
  { step: "xs", el: "caption / mono", leading: "snug", tracking: "wide", weight: "medium" },
] as const;

const WEIGHTS = ["normal", "medium", "semibold", "bold"] as const;

const FEATURES = [
  ["tnum", "Tabular figures", "1,204,880 / 9,317,006", "Columns of numbers line up or they are not a column. On tables, times and meters."],
  ["case", "Case-sensitive forms", "(TOKENS) — 2026", "Punctuation rises to match capitals. On the eyebrow, which is uppercase."],
  ["liga", "Common ligatures", "efficient office", "Corrections, not decoration: fi and ffi stop colliding."],
  ["calt", "Contextual alternates", "Illustration 1 l I", "The face's own contextual fixes."],
] as const;

export const Typography: Story = {
  name: "Typography",
  render: (_args, ctx) => {
    const g = ctx.globals as ContextGlobals;
    const { ref, read, readPx } = useTokenReader([g.pack, g.density, g.root]);

    const rootPx = readPx("font-size") || 16;
    const family = read("--tk-font-sans").split(",")[0].replace(/["']/g, "");
    const measurePx = readPx("--tk-measure");

    return (
      <Page
        hostRef={ref}
        title="Typography"
        note={
          <>
            The face, the ramp, and the leading and tracking each step is paired
            with. Nothing here is transcribed — every value is read off a real
            element after the cascade resolved it, so switching pack, density or
            root size in the toolbar changes the numbers on this page.
          </>
        }
        spec={
          <>
            <b>measure</b> {read("--tk-measure")} = {Math.round(measurePx)}px at a{" "}
            {rootPx}px root · derived by <code>tools/type-gate.mjs</code>, not by
            eye · <b>narrow</b> {read("--tk-measure-narrow")}
          </>
        }
      >
        <Sub>The face</Sub>
        <div className="tk-stage" data-shell="stack" data-gap="3">
          <p
            style={{
              margin: 0,
              fontSize: "var(--tk-size-3xl)",
              lineHeight: "var(--tk-leading-display)",
              letterSpacing: "var(--tk-tracking-display)",
              fontWeight: "var(--tk-weight-bold)",
            }}
          >
            {family}
          </p>
          <p className="tk-doc-note" style={{ margin: 0 }}>
            Resolved from <code>--tk-font-sans</code>. A brand pack remaps that
            slot like any other, so this line is the one place the kit says
            which face it is actually running.
          </p>
          <p style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <br />
            abcdefghijklmnopqrstuvwxyz
            <br />
            0123456789 &amp; ? ! — “ ” ‘ ’
          </p>
        </div>

        <Sub>The ramp</Sub>
        <p className="tk-doc-note">
          Leading and tracking step with the size rather than sitting at one
          value for the whole ramp. At 16px a face wants air between letters and
          room between lines; at 48px the same air is a gap. One value across six
          levels is the loudest tell that a scale was listed rather than drawn.
        </p>

        <div data-shell="stack" data-gap="4">
          {ROLES.map((r) => {
            const sizePx = readPx(`--tk-size-${r.step}`);
            return (
              <div
                key={r.step}
                className="tk-stage"
                data-shell="stack"
                data-gap="2"
                style={{ overflow: "hidden" }}
              >
                <div
                  data-shell="inline"
                  data-gap="3"
                  style={{
                    fontFamily: "var(--tk-font-mono)",
                    fontSize: "var(--tk-size-xs)",
                    color: "var(--tk-text-secondary)",
                    flexWrap: "wrap",
                  }}
                >
                  <code>--tk-size-{r.step}</code>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {read(`--tk-size-${r.step}`)} · {Math.round(sizePx)}px
                  </span>
                  <span>{r.el}</span>
                  <span>
                    leading {read(`--tk-leading-${r.leading}`)} · tracking{" "}
                    {read(`--tk-tracking-${r.tracking}`)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: `var(--tk-size-${r.step})`,
                    lineHeight: `var(--tk-leading-${r.leading})`,
                    letterSpacing: `var(--tk-tracking-${r.tracking})`,
                    fontWeight: `var(--tk-weight-${r.weight})`,
                    textWrap: "balance",
                  }}
                >
                  {SPECIMEN}
                </p>
              </div>
            );
          })}
        </div>

        <Sub>Weight</Sub>
        <p className="tk-doc-note">
          Four static weights, subsetted to 13KB each. Four rather than a
          variable axis because the npm distribution of the face has no{" "}
          <code>fvar</code> table, and four subsets beat one full variable file
          when four is all the kit uses.
        </p>
        <div className="tk-stage" data-shell="stack" data-gap="3">
          {WEIGHTS.map((w) => (
            <div key={w} data-shell="split" data-gap="4" style={{ alignItems: "baseline" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--tk-size-lg)",
                  fontWeight: `var(--tk-weight-${w})`,
                }}
              >
                {SPECIMEN}
              </p>
              <code
                style={{
                  fontSize: "var(--tk-size-xs)",
                  color: "var(--tk-text-secondary)",
                  flex: "0 0 auto",
                }}
              >
                {w} · {read(`--tk-weight-${w}`)}
              </code>
            </div>
          ))}
        </div>

        <Sub>Features</Sub>
        <p className="tk-doc-note">
          Turned on in <code>04-elements.css</code> rather than left to chance.
          Each of these is a correction the face already ships and the browser
          will not apply by default.
        </p>
        <div data-shell="stack" data-gap="3">
          {FEATURES.map(([tag, name, sample, why]) => (
            <div key={tag} className="tk-stage" data-shell="stack" data-gap="1">
              <div data-shell="inline" data-gap="3" style={{ alignItems: "baseline" }}>
                <code style={{ fontSize: "var(--tk-size-xs)" }}>{tag}</code>
                <strong style={{ fontSize: "var(--tk-size-sm)" }}>{name}</strong>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--tk-size-lg)",
                  fontVariantNumeric: tag === "tnum" ? "tabular-nums" : undefined,
                  fontFeatureSettings: `"${tag}" 1`,
                }}
              >
                {sample}
              </p>
              <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
                {why}
              </p>
            </div>
          ))}
        </div>

        <Sub>Measure</Sub>
        <p className="tk-doc-note">
          <code>ch</code> is the advance width of the digit zero, which is wider
          than the average character, so a measure in <code>ch</code> always
          renders more characters per line than its number suggests. That is why
          this token is derived by measurement rather than chosen — see{" "}
          <b>Tokens/Measure</b>, which lays real text out with Pretext and reads
          the count off.
        </p>
        <div className="tk-stage">
          <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
            A measure has always carried more weight than its one-line
            definition suggests. What changes here is the evidence standard: the
            token is derived by laying real text out and counting rather than
            asserted from a number, which moves the argument earlier.
          </p>
        </div>

        <div data-shell="stack" data-gap="1" style={{ marginBlockStart: "var(--tk-space-4)" }}>
          {TYPE_STEPS.map((step) => (
            <div
              key={step}
              className="tk-row"
              style={{ fontFamily: "var(--tk-font-mono)", fontSize: "var(--tk-size-xs)" }}
            >
              <code>--tk-size-{step}</code>
              <span className="tk-value">
                {read(`--tk-size-${step}`)} · {Math.round(readPx(`--tk-size-${step}`))}px
              </span>
            </div>
          ))}
        </div>
      </Page>
    );
  },
};
