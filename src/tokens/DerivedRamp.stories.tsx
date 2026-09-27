import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { contrastRatio, format, THRESHOLD } from "../lib/contrast";
import { hex, oklab, parseHex, ramp as buildRamp } from "../lib/oklab";
import { Page, Sub } from "./doc";
import { Icon } from "../react/primitives/Icon";

/**
 * Derived ramp — a brand book gives you two colours; the system derives the
 * rest, and the contract is still checkable at every stop.
 *
 * 02 Continuous remap next door slides one paper index along a FIXED
 * fourteen-step grayscale and shows that light and dark are two stops on one
 * ramp. This asks the question one step earlier: where did the fourteen steps
 * come from?
 *
 * Nowhere, is the honest answer. Fourteen is a convention — Tailwind's ten,
 * Material's thirteen, everyone's slightly different — and a brand book
 * almost never hands you fourteen greys. It hands you a colour and a
 * background, and somebody in a design tool produces the rest by eye. That
 * "by eye" step is the one this page removes.
 *
 * TWO ENDS AND A COUNT. Give it the lightest colour a brand owns and the
 * darkest, say how many stops you want between them, and the ramp is
 * arithmetic. Then every stop is a candidate surface, and for each one the
 * contract's required pairs either clear their floors from within that same
 * ramp or the stop is not usable — which is a fact about the palette, found
 * before anything is built on it, rather than a bug found in review.
 *
 * WHY THE COUNT IS A SLIDER RATHER THAN A NUMBER. Because the interesting
 * answer is not "what does nine look like", it is "at what N do two adjacent
 * stops stop being distinguishable, and at what N does the ramp run out of
 * usable surfaces". Both are visible here by dragging, and neither is
 * visible in a palette that was drawn once.
 *
 * OKLCh, not HSL. Mid-way from a saturated blue to white in HSL is a blue
 * that has lost most of its chroma and none of its lightness, and the ramp
 * has a dead step in it. The maths is in src/lib/oklab.mjs, which is the
 * same file the pack generator and the colour nudger use.
 */

/* --- the ends ---------------------------------------------------------------
   Two colours per brand, taken from the specimen packs' own ramps: the
   lightest thing it owns and the darkest. Everything between them on this
   page is derived, which is the claim being made — so these twelve values
   are the only colours in this file, and each one is an END rather than a
   step.
   ------------------------------------------------------------------------ */
const ENDS = [
  ["tk", "TK", "#FFFFFF", "#0B0F1A", "The house brand: near-neutral, because it stands in for a client who has not arrived."],
  ["door-shop", "Door Shop", "#FFFFFF", "#111827", "A cool blue-black. The greys come out blue and the pack never has to say so."],
  ["mohave", "Mohave", "#FFFFFF", "#1C1917", "Warm black over white — the desert end of neutral."],
  ["bathing-bagels", "Bathing Bagels", "#FFF8F0", "#5C1A1A", "Cream to oxblood. Neither end is neutral, so every stop carries the brand."],
  ["wandas", "Wanda's", "#FDF6EC", "#1C1917", "Diner cream to near-black."],
  ["muncheese", "Muncheese", "#FFFBEB", "#14532D", "Butter to forest. The widest hue travel in the set."],
] as const;

const MIN_STEPS = 3;
const MAX_STEPS = 16;

/* --- picking slots out of a ramp -------------------------------------------
   The same discipline as 02 Continuous remap: a slot is not assigned, it is
   SOLVED. Given a paper, walk the ramp away from it and take the first stop
   that clears the floor — so a slot that cannot clear its floor comes back
   null and the stop is reported unusable rather than quietly shipped.
   ------------------------------------------------------------------------ */
type Pick = { index: number; ratio: number } | null;

function pick(steps: string[], paper: number, need: number): Pick {
  /* Away from the paper in both directions at once, nearest first. The
     nearest passing stop is the right one: a slot that clears its floor with
     room to spare has spent contrast it could have kept for hierarchy. */
  for (let d = 1; d < steps.length; d++) {
    for (const i of [paper + d, paper - d]) {
      if (i < 0 || i >= steps.length) continue;
      const ratio = contrastRatio(steps[i], steps[paper]);
      if (ratio != null && ratio >= need) return { index: i, ratio };
    }
  }
  return null;
}

/** Furthest stop from the paper, for the primary ink — maximum separation. */
function furthest(steps: string[], paper: number, need: number): Pick {
  for (let d = steps.length - 1; d >= 1; d--) {
    for (const i of [paper + d, paper - d]) {
      if (i < 0 || i >= steps.length) continue;
      const ratio = contrastRatio(steps[i], steps[paper]);
      if (ratio != null && ratio >= need) return { index: i, ratio };
    }
  }
  return null;
}

type Solved = {
  paper: number;
  primary: Pick;
  secondary: Pick;
  line: Pick;
  fill: Pick;
  fillText: Pick;
  pairs: { label: string; need: number; ratio: number | null; pass: boolean }[];
  ok: boolean;
};

function solve(steps: string[], paper: number): Solved {
  const primary = furthest(steps, paper, THRESHOLD.textNormal);
  /* Secondary is the NEAREST stop that still clears body text. Primary takes
     the far end; secondary takes the near one; the gap between them is the
     hierarchy, and it exists only if the ramp is long enough to have one. */
  const secondary = pick(steps, paper, THRESHOLD.textNormal);
  const line = pick(steps, paper, THRESHOLD.nonText);

  /* The action fill is the primary ink used as a ground, which is what every
     pack in the kit does — and then its label has to clear 4.5:1 against it,
     from the same ramp, with no third colour available. This is the pair
     that fails first on a short ramp. */
  const fill = primary;
  const fillText =
    fill == null
      ? null
      : (() => {
          for (let d = steps.length - 1; d >= 1; d--) {
            for (const i of [fill.index + d, fill.index - d]) {
              if (i < 0 || i >= steps.length) continue;
              const ratio = contrastRatio(steps[i], steps[fill.index]);
              if (ratio != null && ratio >= THRESHOLD.textNormal) return { index: i, ratio };
            }
          }
          return null;
        })();

  const pairs = [
    { label: "text-primary on surface", need: THRESHOLD.textNormal, ratio: primary?.ratio ?? null },
    { label: "text-secondary on surface", need: THRESHOLD.textNormal, ratio: secondary?.ratio ?? null },
    { label: "line-strong on surface", need: THRESHOLD.nonText, ratio: line?.ratio ?? null },
    { label: "action-text on action-fill", need: THRESHOLD.textNormal, ratio: fillText?.ratio ?? null },
  ].map((p) => ({ ...p, pass: p.ratio != null && p.ratio >= p.need }));

  return {
    paper,
    primary,
    secondary,
    line,
    fill,
    fillText,
    pairs,
    ok: pairs.every((p) => p.pass),
  };
}

/* --- the page --------------------------------------------------------------- */

function DerivedRamp() {
  const host = useRef<HTMLDivElement>(null);
  const [brand, setBrand] = useState(0);
  const [steps, setSteps] = useState(9);
  const [paper, setPaper] = useState(0);
  const [customLight, setCustomLight] = useState("");
  const [customDark, setCustomDark] = useState("");

  const [, label, endLight, endDark, blurb] = ENDS[brand];
  const light = parseHex(customLight) ? customLight : endLight;
  const dark = parseHex(customDark) ? customDark : endDark;

  const scale = useMemo(
    () => buildRamp(light, dark, steps).map(hex),
    [light, dark, steps],
  );

  /* The paper index is held as a FRACTION of the ramp rather than as an
     absolute stop, so dragging the step count does not jump the paper from
     "near the light end" to "somewhere in the middle". Two sliders that fight
     each other are two sliders nobody can read. */
  const paperIndex = Math.min(scale.length - 1, Math.round(paper * (scale.length - 1)));
  const solved = useMemo(() => solve(scale, paperIndex), [scale, paperIndex]);

  /* Which stops could be a surface at all. This is the number that actually
     answers "is this palette usable", and it is one arithmetic pass rather
     than a review meeting. */
  const usable = useMemo(
    () => scale.map((_, i) => solve(scale, i).ok),
    [scale],
  );
  const usableCount = usable.filter(Boolean).length;

  /* Smallest perceptual gap between neighbours. Below about 0.02 in OKLab L,
     two stops are the same colour with extra steps — which is what a ramp
     looks like when N has been pushed past what the two ends can carry. */
  const tightest = useMemo(() => {
    let min = Infinity;
    for (let i = 1; i < scale.length; i++) {
      const a = parseHex(scale[i - 1]);
      const b = parseHex(scale[i]);
      if (!a || !b) continue;
      min = Math.min(min, Math.abs(oklab(a).L - oklab(b).L));
    }
    return min === Infinity ? 0 : min;
  }, [scale]);

  const at = (p: Pick) => (p ? scale[p.index] : "transparent");

  /* The derived slots, written onto a scope as contract tokens. Everything in
     the specimen below reads the contract and knows nothing about this page. */
  const scope: CSSProperties = {
    ["--tk-surface-default" as string]: scale[paperIndex],
    ["--tk-surface-base" as string]: scale[Math.max(0, paperIndex - 1)],
    ["--tk-surface-raised" as string]: scale[Math.max(0, paperIndex - 1)],
    ["--tk-surface-sunken" as string]: scale[Math.min(scale.length - 1, paperIndex + 1)],
    ["--tk-text-primary" as string]: at(solved.primary),
    ["--tk-text-secondary" as string]: at(solved.secondary),
    ["--tk-text-tertiary" as string]: at(solved.secondary),
    ["--tk-line-subtle" as string]: scale[Math.min(scale.length - 1, paperIndex + 1)],
    ["--tk-line-default" as string]: at(solved.line),
    ["--tk-line-strong" as string]: at(solved.line),
    ["--tk-action-fill" as string]: at(solved.fill),
    ["--tk-action-text" as string]: at(solved.fillText),
    ["--tk-focus-color" as string]: at(solved.primary),
  };

  const slider = (
    id: string,
    text: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (n: number) => void,
    read: string,
  ) => (
    <div data-shell="stack" data-gap="1" style={{ minInlineSize: "16rem", flex: 1 }}>
      <label
        htmlFor={id}
        data-shell="inline"
        data-gap="2"
        style={{ justifyContent: "space-between", alignItems: "baseline" }}
      >
        <span>{text}</span>
        <code style={{ fontSize: "var(--tk-size-sm)" }}>{read}</code>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ inlineSize: "100%" }}
      />
    </div>
  );

  return (
    <Page
      hostRef={host}
      title="Derived ramp"
      note={
        <>
          A brand book hands over a colour and a background. Everything between
          them is usually produced by eye in a design tool, which is where a
          palette acquires the stop that looks fine and fails 4.5:1. Here the
          two ends are the input, the count is a slider, and every stop is
          judged before anything is built on it.
        </>
      }
      spec={
        <>
          <b>OKLCh</b> interpolation in <code>src/lib/oklab.mjs</code> — the same
          file the pack generator and <code>tools/nudge-color.mjs</code> use ·{" "}
          <b>floors</b> from <code>src/lib/contrast.mjs</code>, so these verdicts
          and the gate's are one implementation
        </>
      }
    >
      <Sub>The two ends</Sub>
      <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
        {ENDS.map(([slug, name], i) => (
          <button
            key={slug}
            type="button"
            data-tk="button"
            data-variant={i === brand ? "solid" : "outline"}
            data-size="sm"
            onClick={() => {
              setBrand(i);
              setCustomLight("");
              setCustomDark("");
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <p className="tk-doc-note" style={{ maxInlineSize: "var(--tk-measure)" }}>
        {blurb}
      </p>

      <div data-shell="inline" data-gap="4" style={{ flexWrap: "wrap", alignItems: "end" }}>
        <label data-shell="stack" data-gap="1" style={{ inlineSize: "10rem" }}>
          <span>Light end</span>
          <input
            data-tk="input"
            type="text"
            value={customLight}
            placeholder={endLight}
            onChange={(e) => setCustomLight(e.target.value)}
          />
        </label>
        <label data-shell="stack" data-gap="1" style={{ inlineSize: "10rem" }}>
          <span>Dark end</span>
          <input
            data-tk="input"
            type="text"
            value={customDark}
            placeholder={endDark}
            onChange={(e) => setCustomDark(e.target.value)}
          />
        </label>
      </div>

      <Sub>N stops between them</Sub>
      <div data-shell="inline" data-gap="5" style={{ flexWrap: "wrap" }}>
        {slider("dr-steps", "Steps", steps, MIN_STEPS, MAX_STEPS, 1, setSteps, String(steps))}
        {slider(
          "dr-paper",
          "Paper",
          paper,
          0,
          1,
          0.01,
          setPaper,
          `${paperIndex} of ${scale.length - 1}`,
        )}
      </div>

      {/* The ramp. Each stop is a button: the marks under it say whether that
          stop can be a surface, which is the whole question. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${scale.length}, minmax(0, 1fr))`,
          gap: "2px",
          marginBlock: "var(--tk-space-3)",
        }}
      >
        {scale.map((c, i) => (
          <button
            key={`${c}-${i}`}
            type="button"
            onClick={() => setPaper(i / (scale.length - 1))}
            aria-pressed={i === paperIndex}
            aria-label={`Stop ${i}, ${c}${usable[i] ? ", usable as a surface" : ", not usable as a surface"}`}
            style={{
              border: 0,
              padding: 0,
              cursor: "pointer",
              background: "transparent",
            }}
          >
            <span
              style={{
                display: "block",
                blockSize: i === paperIndex ? "5rem" : "4rem",
                background: c,
                border:
                  i === paperIndex
                    ? "3px solid var(--tk-focus-color)"
                    : "1px solid var(--tk-line-default)",
              }}
            />
            <span
              data-shell="inline"
              data-gap="1"
              style={{
                justifyContent: "center",
                fontSize: "var(--tk-size-xs)",
                color: usable[i] ? "var(--tk-text-secondary)" : "var(--tk-text-tertiary)",
                paddingBlockStart: "var(--tk-space-1)",
              }}
            >
              <Icon name={usable[i] ? "check" : "close"} size="sm" />
              {i}
            </span>
          </button>
        ))}
      </div>

      <p className="tk-doc-note" style={{ maxInlineSize: "var(--tk-measure)" }}>
        <b>{usableCount} of {scale.length}</b> stops can carry a surface — that
        is, body text, secondary text, a non-text boundary and a filled button's
        label all clear their floors from inside this ramp with no colour
        brought in from outside. Tightest neighbouring gap:{" "}
        <code>ΔL {tightest.toFixed(3)}</code>
        {tightest < 0.02 ? (
          <> — below about 0.02 two stops are the same colour with extra steps.</>
        ) : null}
      </p>

      <Sub>What this paper solved to</Sub>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto auto",
          gap: "var(--tk-space-2) var(--tk-space-4)",
          alignItems: "center",
          fontSize: "var(--tk-size-sm)",
        }}
      >
        {solved.pairs.map((p) => (
          <div key={p.label} style={{ display: "contents" }}>
            <Icon name={p.pass ? "check" : "close"} size="sm" />
            <span>{p.label}</span>
            <code>{format(p.ratio)}</code>
            <span style={{ color: "var(--tk-text-tertiary)" }}>needs {p.need}:1</span>
          </div>
        ))}
      </div>
      {!solved.ok ? (
        <div data-tk="alert" data-status="warning" style={{ marginBlockStart: "var(--tk-space-3)" }}>
          <Icon name="warning" size="sm" />
          This stop cannot carry a surface. Nothing in the ramp clears every
          floor against it — which is a fact about these two ends and this
          count, not about the component that would have been built on it.
        </div>
      ) : null}

      {/* --- the specimen -------------------------------------------------
          Real components under the derived slots. Nothing below reads a value
          from this file: if the derivation is wrong the page looks wrong,
          which is the only honest way to show it.
          ---------------------------------------------------------------- */}
      <Sub>Live under the derived slots</Sub>
      <div
        style={{ ...scope, padding: "var(--tk-space-5)", background: "var(--tk-surface-default)" }}
        data-shell="stack"
        data-gap="4"
      >
        <div data-tk="card">
          <span data-tk="eyebrow">{label}</span>
          {/* h2, not h3. Sub() renders an eyebrow rather than a heading, so
              the only heading above this on the page is the Page title's h1 —
              and axe is right that a level may not be skipped. Caught at the
              phone viewport, where nothing else was in the way. */}
          <h2 style={{ margin: 0, fontSize: "var(--tk-size-xl)" }}>Derived, not drawn</h2>
          <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
            Every colour on this panel came out of two hex values and a number.
            Drag the step count and watch the boundary move before the text
            does — a non-text floor is 3:1 and a body floor is 4.5:1, so lines
            survive a shorter ramp than words do.
          </p>
          <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
            <button type="button" data-tk="button" data-variant="solid" data-size="md">
              Primary
            </button>
            <button type="button" data-tk="button" data-variant="outline" data-size="md">
              Secondary
            </button>
            <span data-tk="chip">Chip</span>
          </div>
        </div>
      </div>
    </Page>
  );
}

const meta = {
  title: "02 Tokens/01 Colour/05 Derived ramp",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Two colours and a count produce a ramp; every stop is then judged against the contract before anything is built on it. 02 Continuous remap slides a paper index along a fixed fourteen-step grayscale — this asks where the fourteen came from.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Derived: Story = {
  name: "Derived ramp",
  render: () => <DerivedRamp />,
};
