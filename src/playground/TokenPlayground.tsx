"use client";

import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "../react/primitives/Icon";

/**
 * The token playground.
 *
 * Every other page in the kit shows the system resolving its context. This
 * one hands you the context. The three toolbar axes are a pack, a density and
 * a root size picked from a list; here they are continuous, because the
 * question a designer actually has is not "is 0.75 or 1.25 better" but "where
 * does this stop working", and a list of three cannot answer it.
 *
 * ONE OF THESE KNOBS IS NOT LIKE THE OTHERS, and it is worth knowing why.
 *
 * Density, icon stroke and radius are custom properties, so they are set on
 * the wrapper and resolve down the subtree — the rest of Storybook is
 * untouched while you drag them.
 *
 * Root size cannot work that way. `rem` is relative to the ROOT element by
 * definition, not to the nearest ancestor with a font-size, so a scoped rem
 * slider would move nothing at all. It has to be written to
 * document.documentElement and undone on unmount, which is also what the
 * toolbar decorator does — and is the honest model anyway, because the real
 * version of this control is the reader's own browser setting, which is a
 * document-level fact. That is what WCAG 1.4.4 tests.
 *
 * The readout is getComputedStyle, not arithmetic: what the cascade produced,
 * not what this file thinks it should have.
 */

type Knob = {
  key: string;
  label: string;
  /** The contract slot, or "root" for the document font size. */
  token: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  unit?: string;
  note: string;
};

const KNOBS: Knob[] = [
  {
    key: "root",
    label: "Root font size",
    token: "root",
    min: 12,
    max: 32,
    step: 1,
    initial: 16,
    unit: "px",
    note: "The reader's browser setting. WCAG 1.4.4 asks for 200% — drag to 32 and nothing here may clip, overlap or scroll sideways.",
  },
  {
    key: "density",
    label: "Density",
    token: "--tk-density",
    min: 0.6,
    max: 1.6,
    step: 0.05,
    initial: 1,
    note: "Multiplies the whole space ramp. Target sizes deliberately do not follow it — 2.5.8 has a floor and density is not allowed to argue with it.",
  },
  {
    key: "stroke",
    label: "Icon stroke",
    token: "--tk-icon-stroke",
    min: 1,
    max: 3,
    step: 0.25,
    initial: 2,
    note: "Lucide keeps weight in stroke-width, a presentation attribute, so one property re-weights all 221 glyphs.",
  },
  {
    key: "radius",
    label: "Radius",
    token: "--tk-radius-xl",
    min: 0,
    max: 48,
    step: 1,
    initial: 32,
    unit: "px",
    note: "Seeds the concentric chain. Every nested corner below re-solves from it as outer radius less padding.",
  },
  {
    key: "measure",
    label: "Measure",
    token: "--tk-measure",
    min: 30,
    max: 90,
    step: 1,
    initial: 53,
    unit: "ch",
    note: "Line length in characters. Past roughly 90 the return sweep starts landing on the wrong line.",
  },
];

const READOUT = [
  "--tk-space-5",
  "--tk-space-8",
  "--tk-radius-xl",
  "--tk-radius-nested",
  "--tk-measure",
  "--tk-size-3xl",
  "--tk-icon-stroke",
  "--tk-target-comfortable",
];

export function TokenPlayground() {
  const [values, setValues] = useState<Record<string, number>>(
    () => Object.fromEntries(KNOBS.map((k) => [k.key, k.initial])),
  );
  const scopeRef = useRef<HTMLDivElement>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  /* Root font size is a document fact, so it is written to the document and
     put back on the way out. Leaving it set would follow you to every other
     story in the sidebar, which is the bug this cleanup exists to prevent. */
  useEffect(() => {
    const doc = document.documentElement;
    const previous = doc.style.fontSize;
    doc.style.fontSize = `${values.root}px`;
    return () => {
      doc.style.fontSize = previous;
    };
  }, [values.root]);

  /* Re-read after the browser has applied the new values, not during the
     render that set them. */
  useLayoutEffect(() => {
    bump();
  }, [values]);

  const scopeStyle: CSSProperties = {
    ["--tk-density" as string]: values.density,
    ["--tk-icon-stroke" as string]: values.stroke,
    ["--tk-radius-xl" as string]: `${values.radius}px`,
    ["--tk-measure" as string]: `${values.measure}ch`,
  };

  const read = (name: string) => {
    const el = scopeRef.current;
    if (!el) return "";
    return getComputedStyle(el).getPropertyValue(name).trim();
  };

  const reset = () =>
    setValues(Object.fromEntries(KNOBS.map((k) => [k.key, k.initial])));

  return (
    <div data-shell="stack" data-gap="5" style={{ padding: "var(--tk-space-5)" }}>
      <div data-shell="split" data-gap="5" style={{ alignItems: "start" }}>
        {/* --- the knobs ---------------------------------------------------- */}
        <div data-shell="stack" data-gap="4" style={{ minInlineSize: "min(20rem, 100%)" }}>
          {KNOBS.map((knob) => (
            <div key={knob.key} data-shell="stack" data-gap="1">
              <label
                htmlFor={`pg-${knob.key}`}
                data-shell="inline"
                data-gap="2"
                style={{ justifyContent: "space-between", alignItems: "baseline" }}
              >
                <span>{knob.label}</span>
                <code style={{ fontSize: "var(--tk-size-sm)" }}>
                  {values[knob.key]}
                  {knob.unit ?? ""}
                </code>
              </label>
              <input
                id={`pg-${knob.key}`}
                type="range"
                min={knob.min}
                max={knob.max}
                step={knob.step}
                value={values[knob.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [knob.key]: Number(e.target.value) }))
                }
                style={{ inlineSize: "100%" }}
              />
              <p
                className="tk-doc-note"
                style={{ margin: 0, fontSize: "var(--tk-size-xs)" }}
              >
                <code>{knob.token}</code> — {knob.note}
              </p>
            </div>
          ))}

          <div data-shell="inline" data-gap="2">
            <button
              type="button"
              data-tk="button"
              data-variant="outline"
              data-size="sm"
              onClick={reset}
            >
              <Icon name="refresh" size="sm" />
              Reset
            </button>
          </div>
        </div>

        {/* --- what the cascade produced ------------------------------------ */}
        <div data-shell="stack" data-gap="2">
          <span data-tk="eyebrow">Resolved</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto auto",
              gap: "var(--tk-space-1) var(--tk-space-4)",
              fontSize: "var(--tk-size-sm)",
            }}
          >
            {READOUT.map((name) => (
              <div key={name} style={{ display: "contents" }}>
                <code>{name.replace("--tk-", "")}</code>
                <span style={{ color: "var(--tk-text-tertiary)" }}>
                  {read(name) || "—"}
                </span>
              </div>
            ))}
          </div>
          <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-xs)" }}>
            Read with getComputedStyle from the panel below, after the cascade
            resolved it. <code>radius-nested</code> and every space token are
            derived, not set — which is why they move when you have not touched
            them.
          </p>
        </div>
      </div>

      {/* --- the specimen ---------------------------------------------------
          Real components, not a diagram of them. Everything here reads the
          contract and nothing reads a value from this file, so if a knob moves
          something on this panel the system is doing the work.
          ------------------------------------------------------------------ */}
      {/* data-density="" is load-bearing and was missing in the first version.

          --tk-space-* is derived as the private ramp times --tk-density, and
          03-scale.css restates that derivation on `:root, [data-density],
          [data-brand]` for a reason: a custom property is substituted at
          computed-value time and then INHERITED AS A VALUE. An element that
          sets --tk-density without matching one of those selectors inherits
          the space tokens its ancestors already computed, so the slider moves
          the number and nothing on the page moves at all.

          The readout is what caught it — space-5 was reporting an unresolved
          calc() inherited from above rather than a length computed here. It
          is the third time this exact trap has surfaced: the packs hit it
          when they first tried to own density, and 03-scale.css warns about
          it two paragraphs above the selector list. Worth knowing that the
          fix is an attribute, not a value. */}
      <div
        ref={scopeRef}
        data-density=""
        style={scopeStyle}
        data-shell="stack"
        data-gap="4"
      >
        <section data-tk="card">
          <span data-tk="eyebrow">Specimen</span>
          <h2 style={{ margin: 0 }}>Everything below reads the contract</h2>
          <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
            Drag any slider and watch which parts move. The card's corner, the
            button inside it, the gap between these lines and the width of this
            paragraph are four different tokens, and three of them are derived
            from ones you are not touching directly.
          </p>
          <div data-shell="inline" data-gap="2" style={{ flexWrap: "wrap" }}>
            <button type="button" data-tk="button" data-variant="solid" data-size="md">
              <Icon name="check" size="sm" />
              Primary
            </button>
            <button type="button" data-tk="button" data-variant="outline" data-size="md">
              <Icon name="externalLink" size="sm" />
              Secondary
            </button>
            <span data-tk="chip">
              <Icon name="tag" size="sm" />
              Chip
            </span>
            <span data-tk="chip" data-emphasis="strong">
              Strong
            </span>
          </div>
          <label data-shell="stack" data-gap="1" style={{ maxInlineSize: "20rem" }}>
            <span>Field</span>
            <input data-tk="input" type="text" defaultValue="Nested one level in" />
          </label>
          {/* data-status, not data-tone. The alert's axis is status; tone is
              the FAQ's and the guidance figure's. Both are four letters, both
              take "info", and writing the wrong one produces a perfectly
              ordinary-looking alert with no status on it — which is the whole
              reason tools/attribute-gate.mjs exists. */}
          <div data-tk="alert" data-status="info">
            <Icon name="info" size="sm" />
            An alert nested inside the card, so its corner is the card's corner
            less the card's padding.
          </div>
        </section>

        <div data-shell="grid" data-gap="3" data-cols="3">
          {(["truck", "calendar", "package", "mapPin", "clock", "users"] as const).map(
            (n) => (
              <div key={n} data-tk="card" data-variant="flat" style={{ alignItems: "center" }}>
                <Icon name={n} size="lg" />
                <code style={{ fontSize: "var(--tk-size-xs)" }}>{n}</code>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
