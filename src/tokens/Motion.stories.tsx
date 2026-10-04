import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Page, Sub, useTokenReader, type ContextGlobals } from "./doc";
import { easeToArray, parseMotionToken, useMotionTokens } from "../lib/motion-tokens";

/**
 * Motion — the curves, the durations, and the contract that pairs them.
 *
 * The specimens below are driven by Motion (formerly Framer Motion) reading the
 * same CSS tokens the stylesheets read. That is the whole point of the bridge
 * in src/lib/motion-tokens.ts: a JS animation and a CSS transition that are
 * meant to match cannot drift, because there is only one value and both sides
 * resolve it from the document.
 */

const meta = {
  title: "02 Tokens/06 Motion",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Three durations, three curves, nine contract slots, and the Motion FX layer (scroll reveal + parallax) paced by those same slots. Components never name a number. fx={true} infers a recipe from the host.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DURATIONS = ["fast", "base", "slow"] as const;

const EASES = [
  ["standard", "Both ends are eased. The default: something that was on screen moving to somewhere else on screen."],
  ["entrance", "Starts at full speed, decelerates in. For something arriving — it should already be moving when you notice it."],
  ["exit", "Accelerates away. For something leaving, which should not linger."],
] as const;

const CONTRACT = [
  ["ink", "colour of text", "A word changing colour disturbs almost nothing, so it is quick."],
  ["surface", "background fills", "Hover and selection. Quick, for the same reason."],
  ["line", "borders and rules", "Paired with surface so a boundary and its fill arrive together."],
  ["elevation", "shadow", "Slower: a shadow implies distance and distance takes time."],
  ["opacity", "fades", "Slower than a colour change — a fade is a thing appearing, not a thing changing."],
  ["transform", "translate, scale, rotate", "Position is the slowest kind of change because the eye tracks it."],
  ["size", "width, height, disclosure", "Reflow, so it has to be followable."],
  ["enter", "arriving", "Entrance curve: at speed on the first frame."],
  ["exit", "leaving", "Exit curve and the fast duration: gone before it is missed."],
] as const;

/** The curve, plotted. A cubic-bezier is easier to read as a line than as four numbers. */
function Curve({ ease, size = 96 }: { ease: string; size?: number }) {
  const [x1, y1, x2, y2] = easeToArray(ease);
  // SVG y grows downward; progress grows upward, so y is flipped.
  const d = `M 0 ${size} C ${x1 * size} ${size - y1 * size} ${x2 * size} ${
    size - y2 * size
  } ${size} 0`;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{
        border: "1px solid var(--tk-line-default)",
        borderRadius: "var(--tk-radius-nested)",
        background: "var(--tk-surface-sunken)",
        flex: "0 0 auto",
      }}
    >
      <line x1="0" y1={size} x2={size} y2="0" stroke="var(--tk-line-default)" strokeDasharray="2 3" />
      <path d={d} fill="none" stroke="var(--tk-text-primary)" strokeWidth="2" />
    </svg>
  );
}

export const Motion: Story = {
  name: "Motion",
  render: (_args, ctx) => {
    const g = ctx.globals as ContextGlobals;
    const { ref, read } = useTokenReader([g.pack, g.density, g.root]);
    const tokens = useMotionTokens(ref.current);
    const [on, setOn] = useState(false);
    const [shown, setShown] = useState(true);

    return (
      <Page
        hostRef={ref}
        title="Motion"
        note={
          <>
            Three durations and three curves are the raw material. A component
            never names them, for the same reason it never names a hex — they
            are the ramp, not the contract. What a component names is one of the
            nine slots below, each a complete <code>&lt;duration&gt; &lt;easing&gt;</code>{" "}
            paired to a <em>kind of change</em>.
          </>
        }
        spec={
          <>
            <b>pack-owned</b> pace and curve are brand properties, so the packs
            fill these slots · <b>reduced motion</b> every duration collapses to
            zero rather than the animation being skipped, so end states still
            land and nothing downstream has to branch
          </>
        }
      >
        <Sub>Curves</Sub>
        <div data-shell="stack" data-gap="3">
          {EASES.map(([name, why]) => {
            const value = read(`--tk-ease-${name}`);
            return (
              <div
                key={name}
                className="tk-stage"
                data-shell="inline"
                data-gap="5"
                style={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <Curve ease={value} />
                <div data-shell="stack" data-gap="1" style={{ flex: "1 1 16rem", minInlineSize: 0 }}>
                  <code style={{ fontSize: "var(--tk-size-sm)" }}>--tk-ease-{name}</code>
                  <span
                    style={{
                      fontFamily: "var(--tk-font-mono)",
                      fontSize: "var(--tk-size-xs)",
                      color: "var(--tk-text-secondary)",
                      wordBreak: "break-all",
                    }}
                  >
                    {value || "—"}
                  </span>
                  <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
                    {why}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Sub>Durations</Sub>
        <div data-shell="stack" data-gap="1">
          {DURATIONS.map((d) => (
            <div className="tk-row" key={d}>
              <code>--tk-duration-{d}</code>
              <span className="tk-value" style={{ fontVariantNumeric: "tabular-nums" }}>
                {read(`--tk-duration-${d}`) || "—"}
              </span>
            </div>
          ))}
        </div>

        <Sub>The contract</Sub>
        <p className="tk-doc-note">
          One slot per kind of change. Pairing motion to <em>what moves</em>{" "}
          rather than to a t-shirt size is what makes it consistent: every
          surface in the kit changes at the same rate because they all read the
          same slot, and a brand that wants to feel quicker moves one value
          instead of auditing every component for a stray 200ms.
        </p>
        <div data-shell="stack" data-gap="1">
          {CONTRACT.map(([name, what, why]) => {
            const value = read(`--tk-motion-${name}`);
            const parsed = parseMotionToken(value || "");
            return (
              <div
                key={name}
                className="tk-stage"
                data-shell="stack"
                data-gap="1"
                style={{ paddingBlock: "var(--tk-space-3)" }}
              >
                <div data-shell="inline" data-gap="3" style={{ flexWrap: "wrap", alignItems: "baseline" }}>
                  <code style={{ fontSize: "var(--tk-size-sm)" }}>--tk-motion-{name}</code>
                  <span
                    style={{
                      fontFamily: "var(--tk-font-mono)",
                      fontSize: "var(--tk-size-xs)",
                      color: "var(--tk-text-secondary)",
                    }}
                  >
                    {value || "—"}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--tk-font-mono)",
                      fontSize: "var(--tk-size-xs)",
                      color: "var(--tk-text-tertiary)",
                    }}
                  >
                    → motion: {JSON.stringify(parsed)}
                  </span>
                </div>
                <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
                  <b>{what}</b> — {why}
                </p>
              </div>
            );
          })}
        </div>

        <Sub>Driven by the tokens</Sub>
        <p className="tk-doc-note">
          Both specimens are animated by Motion, with the transition read off the
          same custom properties the stylesheets use. Change the pack in the
          toolbar and the JavaScript picks up the new pace without a reload,
          because nothing here has a number in it.
        </p>

        <div className="tk-stage" data-shell="stack" data-gap="4">
          <div data-shell="inline" data-gap="3" style={{ flexWrap: "wrap" }}>
            <button type="button" data-tk="button" data-size="sm" onClick={() => setOn((v) => !v)}>
              Move it — <code>--tk-motion-transform</code>
            </button>
            <button
              type="button"
              data-tk="button"
              data-size="sm"
              data-variant="outline"
              onClick={() => setShown((v) => !v)}
            >
              {shown ? "Dismiss" : "Bring it back"} —{" "}
              <code>--tk-motion-enter</code> / <code>--tk-motion-exit</code>
            </button>
          </div>

          <div
            style={{
              blockSize: "4rem",
              display: "flex",
              alignItems: "center",
              borderBlockEnd: "1px solid var(--tk-line-subtle)",
            }}
          >
            <motion.div
              animate={{ x: on ? 220 : 0 }}
              transition={tokens.transform}
              style={{
                inlineSize: "3rem",
                blockSize: "3rem",
                background: "var(--tk-action-fill)",
                borderRadius: "var(--tk-radius-nested)",
              }}
            />
          </div>

          <div style={{ blockSize: "5rem" }}>
            <AnimatePresence>
              {shown ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0, transition: tokens.enter }}
                  exit={{ opacity: 0, y: -8, transition: tokens.exit }}
                  data-tk="alert"
                  data-status="info"
                >
                  <div>
                    <p data-tk="alert-title">Enters on the entrance curve</p>
                    <p style={{ margin: 0 }}>
                      Leaves on the exit curve, at the fast duration. Both read
                      from the contract, neither written down here.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <Sub>Motion FX</Sub>
        <p className="tk-doc-note">
          Scroll reveal and parallax are progressive enhancement on top of the
          contract above — not a second set of durations. IntersectionObserver
          decides <em>when</em>; <code>--tk-motion-enter</code>,{" "}
          <code>--tk-motion-transform</code>, and{" "}
          <code>--tk-motion-opacity</code> decide <em>how fast</em>. CSS writes
          the transform from <code>--tk-fx-y</code>. Prefer{" "}
          <code>prefers-reduced-motion</code> and every FX duration collapses to
          zero with the rest of the kit.
        </p>
        <p className="tk-doc-note">
          Hosts that accept <code>fx</code> (Card, Media, Figure, Plate, and the{" "}
          <code>MotionFx</code> wrapper) take a shorthand:{" "}
          <code>true</code> infers a parallax amount from composition context and
          never a reveal: nothing in the kit animates because it arrived. A string
          (<code>{'fx="rise"'}</code>) or an object asks for a reveal explicitly,
          for a product that wants one. Prefer the boolean so the kit picks the
          amount, not every call site.
        </p>
        <Sub>{"fx={true} by host"}</Sub>
        <p className="tk-doc-note">
          Inference lives in <code>inferFx</code> / <code>normalizeFx</code>{" "}
          (<code>src/react/motion/types.ts</code>). Plate picks{" "}
          <code>plate</code>, <code>plate-stock</code>, or{" "}
          <code>plate-hero</code> from stock/src and bleed via{" "}
          <code>plateFxContext</code>. Interactive specimens:{" "}
          <em>Motion / FX</em>.
        </p>
        <div data-shell="stack" data-gap="1">
          {(
            [
              ["card", "none", "0.10", "Card roots"],
              ["media", "none", "0.08", "Media layout objects"],
              ["figure", "none", "0.12", "Figure (photo + caption)"],
              ["plate", "none", "0.06", "Synthetic Plate (no photo)"],
              ["plate-stock", "none", "0.14", "Plate with stock or src"],
              ["plate-hero", "none", "0.20", "Stock/src Plate with bleed"],
              ["section", "none", "0.08", "MotionFx wrapper default"],
              ["default", "none", "0.10", "Fallback context"],
            ] as const
          ).map(([ctx, reveal, para, where]) => (
            <div
              key={ctx}
              className="tk-stage"
              data-shell="inline"
              data-gap="3"
              style={{
                flexWrap: "wrap",
                alignItems: "baseline",
                paddingBlock: "var(--tk-space-2)",
              }}
            >
              <code style={{ fontSize: "var(--tk-size-sm)" }}>{ctx}</code>
              <span
                style={{
                  fontFamily: "var(--tk-font-mono)",
                  fontSize: "var(--tk-size-xs)",
                  color: "var(--tk-text-secondary)",
                }}
              >
                reveal: {reveal} · parallax: {para}
              </span>
              <span
                className="tk-doc-note"
                style={{ margin: 0, fontSize: "var(--tk-size-sm)", flex: "1 1 12rem" }}
              >
                {where}
              </span>
            </div>
          ))}
        </div>

      </Page>
    );
  },
};
