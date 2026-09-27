import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { contrastRatio, format, THRESHOLD } from "../lib/contrast";
import {
  Page,
  RAMP_STEPS,
  Sub,
  TokenRow,
  useTokenReader,
  type ContextGlobals,
} from "./doc";

/**
 * Continuous remap — proof that light/dark are two stops on one ramp.
 *
 * Paper index slides --tk-surface-* along --wf-*. Ink and lines are chosen
 * from the same ramp so required pairs meet the contract, or the stop fails.
 * --tk-scrim-ink stays --wf-1000 (darkest); sliding it would void scrim alphas.
 */

const WF: Record<number, string> = {
  0: "#ffffff",
  50: "#fafafa",
  100: "#f4f4f4",
  150: "#ededed",
  200: "#e4e4e4",
  300: "#d0d0d0",
  400: "#a8a8a8",
  500: "#808080",
  600: "#636363",
  700: "#4a4a4a",
  800: "#333333",
  900: "#1f1f1f",
  950: "#0f0f0f",
  1000: "#000000",
};

const STEPS = [...RAMP_STEPS];

function hex(step: number) {
  return WF[step] ?? "#808080";
}

/** Furthest ramp step that still clears `need` against `bg`, preferring dark ink on light paper. */
function pickStep(
  bgStep: number,
  need: number,
  prefer: "dark" | "light" | "auto",
): { step: number; ratio: number } | null {
  const bg = hex(bgStep);
  const order =
    prefer === "dark"
      ? [...STEPS].reverse()
      : prefer === "light"
        ? [...STEPS]
        : bgStep <= 500
          ? [...STEPS].reverse()
          : [...STEPS];

  for (const step of order) {
    const ratio = contrastRatio(hex(step), bg);
    if (ratio != null && ratio >= need) return { step, ratio };
  }
  return null;
}

function nearest(step: number, delta: number) {
  const i = STEPS.indexOf(step as (typeof STEPS)[number]);
  const j = Math.max(0, Math.min(STEPS.length - 1, i + delta));
  return STEPS[j];
}

type Polarity = "auto" | "dark" | "light";

type Remap = {
  paper: number;
  vars: Record<string, string>;
  pairs: { label: string; fg: string; bg: string; need: number; ratio: number | null; pass: boolean }[];
  pass: boolean;
};

function buildRemap(paperIndex: number, polarity: Polarity = "auto"): Remap {
  const paper = STEPS[paperIndex];
  const prefer: "dark" | "light" =
    polarity === "auto" ? (paper <= 500 ? "dark" : "light") : polarity;

  const primary = pickStep(paper, THRESHOLD.textNormal, prefer);
  const lineStrong = pickStep(paper, THRESHOLD.nonText, prefer);

  // Secondary / tertiary: walk from primary toward paper; keep last step that still passes 4.5:1
  let secStep = primary?.step ?? paper;
  let terStep = primary?.step ?? paper;
  if (primary) {
    const pi = STEPS.indexOf(primary.step as (typeof STEPS)[number]);
    const ti = STEPS.indexOf(paper as (typeof STEPS)[number]);
    const walking =
      pi <= ti ? STEPS.slice(pi, ti + 1) : [...STEPS.slice(ti, pi + 1)].reverse();
    const passing: number[] = [];
    for (const s of walking) {
      const r = contrastRatio(hex(s), hex(paper));
      if (r != null && r >= THRESHOLD.textNormal) passing.push(s);
    }
    if (passing.length) {
      secStep = passing[Math.min(1, passing.length - 1)] ?? passing[0];
      terStep = passing[Math.min(2, passing.length - 1)] ?? secStep;
      // Prefer readable hierarchy: primary = furthest, tertiary = closest to paper still passing
      secStep = passing[Math.floor((passing.length - 1) * 0.35)] ?? passing[0];
      terStep = passing[Math.floor((passing.length - 1) * 0.65)] ?? secStep;
    }
  }

  const raised = nearest(paper, prefer === "dark" ? 0 : 0);
  const base = nearest(paper, prefer === "dark" ? 1 : -1);
  const sunken = nearest(paper, prefer === "dark" ? 2 : -2);
  const inverse = prefer === "dark" ? 900 : 0;
  const actionFill = primary?.step ?? (prefer === "dark" ? 900 : 0);
  const actionText = pickStep(actionFill, THRESHOLD.textNormal, prefer === "dark" ? "light" : "dark");

  const vars: Record<string, string> = {
    "--tk-surface-default": `var(--wf-${paper})`,
    "--tk-surface-base": `var(--wf-${base})`,
    "--tk-surface-raised": `var(--wf-${raised})`,
    "--tk-surface-sunken": `var(--wf-${sunken})`,
    "--tk-surface-inverse": `var(--wf-${inverse})`,
    "--tk-text-primary": `var(--wf-${primary?.step ?? 900})`,
    "--tk-text-secondary": `var(--wf-${secStep})`,
    "--tk-text-tertiary": `var(--wf-${terStep})`,
    "--tk-text-inverse": `var(--wf-${prefer === "dark" ? 0 : 900})`,
    "--tk-text-disabled": `var(--wf-500)`,
    "--tk-line-subtle": `var(--wf-${nearest(paper, prefer === "dark" ? 2 : -2)})`,
    "--tk-line-default": `var(--wf-${nearest(paper, prefer === "dark" ? 3 : -3)})`,
    "--tk-line-strong": `var(--wf-${lineStrong?.step ?? 500})`,
    "--tk-action-fill": `var(--wf-${actionFill})`,
    "--tk-action-text": `var(--wf-${actionText?.step ?? (prefer === "dark" ? 0 : 900)})`,
    "--tk-action-quiet-text": `var(--wf-${primary?.step ?? 900})`,
    "--tk-scrim-ink": `var(--wf-1000)`,
    "--tk-text-on-scrim": `var(--wf-0)`,
  };

  const pairs = [
    {
      label: "text-primary on surface-default",
      fg: hex(primary?.step ?? 900),
      bg: hex(paper),
      need: THRESHOLD.textNormal,
      ratio: contrastRatio(hex(primary?.step ?? 900), hex(paper)),
      pass: false,
    },
    {
      label: "text-secondary on surface-default",
      fg: hex(secStep),
      bg: hex(paper),
      need: THRESHOLD.textNormal,
      ratio: contrastRatio(hex(secStep), hex(paper)),
      pass: false,
    },
    {
      label: "line-strong on surface-default",
      fg: hex(lineStrong?.step ?? 500),
      bg: hex(paper),
      need: THRESHOLD.nonText,
      ratio: contrastRatio(hex(lineStrong?.step ?? 500), hex(paper)),
      pass: false,
    },
    {
      label: "action-text on action-fill",
      fg: hex(actionText?.step ?? 0),
      bg: hex(actionFill),
      need: THRESHOLD.textNormal,
      ratio: contrastRatio(hex(actionText?.step ?? 0), hex(actionFill)),
      pass: false,
    },
  ].map((p) => ({
    ...p,
    pass: p.ratio != null && p.ratio >= p.need,
  }));

  return {
    paper,
    vars,
    pairs,
    pass: pairs.every((p) => p.pass) && primary != null && lineStrong != null,
  };
}

type BrandOverride = {
  id: string;
  label: string;
  blurb: string;
  vars: Record<string, string>;
};

const BRANDS: BrandOverride[] = [
  {
    id: "none",
    label: "Grayscale only",
    blurb: "No brand slots — pure progressive remap.",
    vars: {},
  },
  {
    id: "cobalt",
    label: "Cobalt blue",
    blurb: "Action + primary ink only — wireframe paper stays.",
    vars: {
      "--tk-action-fill": "#0B3D91",
      "--tk-action-fill-hover": "#0A3278",
      "--tk-action-fill-active": "#082960",
      "--tk-action-text": "#ffffff",
      "--tk-text-primary": "#0A2540",
      "--tk-line-strong": "#3D5A80",
      "--tk-focus-color": "#2B6CB0",
    },
  },
  {
    id: "sage",
    label: "Sage teal",
    blurb: "A cool accent on CTAs; surfaces stay on the ramp.",
    vars: {
      "--tk-action-fill": "#0F6B5C",
      "--tk-action-fill-hover": "#0C574B",
      "--tk-action-fill-active": "#0A463C",
      "--tk-action-text": "#ffffff",
      "--tk-text-primary": "#12352F",
      "--tk-line-strong": "#2A6F62",
      "--tk-focus-color": "#2A9D8F",
    },
  },
  {
    id: "ember",
    label: "Ember accent",
    blurb: "A single warm CTA hue — everything else progressive gray.",
    vars: {
      "--tk-action-fill": "#B33B1F",
      "--tk-action-fill-hover": "#9A321A",
      "--tk-action-fill-active": "#7A2714",
      "--tk-action-text": "#ffffff",
      "--tk-focus-color": "#D4572A",
    },
  },
];

function ContinuousRemap({
  pack,
  density,
  root,
  showBrandPicker = false,
  initialBrand = "none",
}: ContextGlobals & { showBrandPicker?: boolean; initialBrand?: string }) {
  const { ref } = useTokenReader([pack, density, root]);
  const [index, setIndex] = useState(0);
  const [polarity, setPolarity] = useState<Polarity>("auto");
  const [brandId, setBrandId] = useState(initialBrand);
  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];
  const stations = useMemo(
    () => STEPS.map((_, i) => buildRemap(i, polarity)),
    [polarity],
  );
  const current = stations[index];
  const passCount = stations.filter((s) => s.pass).length;

  return (
    <Page
      hostRef={ref}
      title={showBrandPicker ? "Branded progressive theming" : "Progressive theming"}
      note={
        <>
          One ramp, many papers. The slider chooses a paper step on{" "}
          <code>--wf-*</code>; contract slots remap from that step. Required
          pairs are gated live — mid-gray papers often fail until ink flips.
          Scrim ink stays <code>--wf-1000</code>. Binary light/dark packs remain
          the named legal stops; this is the proof that a slider is possible.
        </>
      }
      spec={
        <>
          <b>{passCount}</b> of <b>{stations.length}</b> stations pass text
          4.5:1 + line-strong 3:1 + action text · paper{" "}
          <code>--wf-{current.paper}</code>
        </>
      }
    >
      <Sub>Ink polarity</Sub>
      <div
        role="group"
        aria-label="Ink polarity"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--tk-space-2)",
          marginBlockEnd: "var(--tk-space-4)",
        }}
      >
        {(
          [
            ["auto", "Auto (flip at mid)"],
            ["dark", "Lock dark ink"],
            ["light", "Lock light ink"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            data-tk="button"
            data-variant={polarity === value ? "solid" : "outline"}
            data-size="sm"
            onClick={() => setPolarity(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="tk-doc-note" style={{ marginBlockEnd: "var(--tk-space-4)" }}>
        Auto matches the two packs: ink flips when paper crosses mid-gray.
        Locking polarity reveals the dead zone — gray paper with the wrong ink
        fails 4.5:1.
      </p>
      
      {showBrandPicker ? (
        <>
          <Sub>Brand overrides (thin slots)</Sub>
          <p className="tk-doc-note" style={{ marginBlockEnd: "var(--tk-space-3)" }}>
            Well-intentioned overrides on a few contract slots — not a second
            palette. Progressive paper stays; brand is n directions from the
            same structure. {brand.blurb}
          </p>
          <div
            role="group"
            aria-label="Brand override"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--tk-space-2)",
              marginBlockEnd: "var(--tk-space-5)",
            }}
          >
            {BRANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                data-tk="button"
                data-variant={brandId === b.id ? "solid" : "outline"}
                data-size="sm"
                onClick={() => setBrandId(b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <Sub>Station strip — click a stop</Sub>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--tk-space-2)",
          marginBlockEnd: "var(--tk-space-5)",
        }}
      >
        {stations.map((s, i) => (
          <button
            key={s.paper}
            type="button"
            onClick={() => setIndex(i)}
            title={`wf-${s.paper} · ${s.pass ? "pass" : "fail"}`}
            style={{
              inlineSize: "2rem",
              blockSize: "2rem",
              borderRadius: "var(--tk-radius-sm)",
              border:
                i === index
                  ? "2px solid var(--tk-focus-color, #06c)"
                  : "1px solid var(--tk-line-default)",
              background: hex(s.paper),
              boxShadow: s.pass
                ? "inset 0 0 0 2px color-mix(in srgb, #0a0 55%, transparent)"
                : "inset 0 0 0 2px color-mix(in srgb, #a00 70%, transparent)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span data-tk="visually-hidden">
              wf-{s.paper} {s.pass ? "pass" : "fail"}
            </span>
          </button>
        ))}
      </div>

      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--tk-space-2)",
          marginBlockEnd: "var(--tk-space-5)",
          maxInlineSize: "36rem",
        }}
      >
        <span className="tk-doc-sub" style={{ margin: 0 }}>
          Paper index {index} · --wf-{current.paper} ·{" "}
          {current.pass ? "PASSING band" : "outside a11y band"}
        </span>
        <input
          type="range"
          min={0}
          max={STEPS.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
        />
      </label>

      <Sub>Live specimen (remapped slots)</Sub>
      <div
        style={{
          ...current.vars,
          ...brand.vars,
          background: "var(--tk-surface-base)",
          color: "var(--tk-text-primary)",
          padding: "var(--tk-space-5)",
          borderRadius: "var(--tk-radius-lg)",
          border: "1px solid var(--tk-line-default)",
          maxInlineSize: "28rem",
          marginBlockEnd: "var(--tk-space-5)",
        }}
      >
        <div
          data-tk="card"
          style={{
            background: "var(--tk-surface-raised)",
            borderColor: "var(--tk-line-strong)",
          }}
        >
          <p data-tk="eyebrow" style={{ margin: 0 }}>
            Progressive theming
          </p>
          {/* h2, not h3: this card is the first heading under the story's h1,
              and a skipped level is a heading-order failure (WCAG 1.3.1).
              data-tk carries the card-title styling, so the level is free to
              be whatever the document outline needs. */}
          <h2 data-tk="card-title" style={{ color: "var(--tk-text-primary)" }}>
            Paper at wf-{current.paper}
          </h2>
          <p data-tk="card-body" style={{ color: "var(--tk-text-secondary)" }}>
            Secondary copy must clear 4.5:1 on this paper. Tertiary follows.
          </p>
          <p style={{ color: "var(--tk-text-tertiary)", margin: 0 }}>
            Tertiary / quiet meta
          </p>
          <div
            style={{
              display: "flex",
              gap: "var(--tk-space-3)",
              marginBlockStart: "var(--tk-space-4)",
            }}
          >
            <button type="button" data-tk="button" data-variant="solid">
              Solid CTA
            </button>
            <button type="button" data-tk="button" data-variant="outline">
              Outline
            </button>
          </div>
        </div>
      </div>

      <Sub>Required pairs at this stop</Sub>
      {current.pairs.map((p) => (
        <TokenRow
          key={p.label}
          name={p.label}
          value={`${format(p.ratio)} (need ${p.need}:1)`}
          swatch={p.fg}
          state={p.pass ? "pass" : "fail"}
          verdict={p.pass ? "pass" : "fail"}
        />
      ))}

      <Sub>Active brand overrides</Sub>
      {Object.keys(brand.vars).length === 0 ? (
        <p className="tk-doc-note">None — grayscale contract only.</p>
      ) : (
        Object.entries(brand.vars).map(([name, value]) => (
          <TokenRow key={name} name={name} value={value} swatch={value} />
        ))
      )}

      <Sub>Remapped contract (CSS variables)</Sub>
      {Object.entries(current.vars).map(([name, value]) => (
        <TokenRow key={name} name={name} value={value} />
      ))}
    </Page>
  );
}

/* No `component` on this meta, and no `<typeof ContinuousRemap>` on the Meta.

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
  title: "02 Tokens/01 Colour/02 Continuous remap",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Progressive theming: slide paper along --wf-* and remap --tk-* slots, with an a11y-passing band. Branded overrides then tint a few contract slots — same structure, n brand directions. Use for: exploring continuous remap and thin brand packs. Don't use for: shipping un-gated mid stops, or moving --tk-scrim-ink off the darkest step.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProgressiveTheming: Story = {
  name: "Progressive theming",
  render: (_args, ctx) => (
    <ContinuousRemap {...(ctx.globals as unknown as ContextGlobals)} />
  ),
};

export const BrandedOverrides: Story = {
  name: "Branded overrides",
  render: (_args, ctx) => (
    <ContinuousRemap
      {...(ctx.globals as unknown as ContextGlobals)}
      showBrandPicker
      initialBrand="cobalt"
    />
  ),
};
