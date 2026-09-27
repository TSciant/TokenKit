import type { Meta, StoryObj } from "@storybook/react-vite";
import { contrastRatio, format } from "../lib/contrast";
import {
  judgePair,
  Page,
  Sub,
  TokenRow,
  useTokenReader,
  type ContextGlobals,
  type PairSpec,
} from "./doc";

/**
 * The gradient pair, and why it is not in PAIRS below.
 *
 * A contrast ratio is between two colours and a gradient is a RANGE. There is
 * no single figure to check: text that clears 4.5:1 against `from` can fail
 * against `to`, at one end of an element rather than across it. So these slots
 * carry no requirement — a gradient is decoration, and text over one belongs
 * on a scrim, which is checked against the worst backdrop it can be handed.
 *
 * The two ends are still listed, with both measured against the pack's ink, so
 * the range is visible even though it is not a verdict. 04 Primitives/24
 * Gradient shows the same two figures beside the thing they describe.
 */
const GRADIENT = [
  "--tk-gradient-from",
  "--tk-gradient-to",
  "--tk-gradient-angle",
  "--tk-gradient-stop",
  "--tk-gradient-origin",
];

/** Slots that carry no contrast requirement, with the reason. */
const SURFACES = [
  "--tk-surface-base",
  "--tk-surface-default",
  "--tk-surface-raised",
  "--tk-surface-sunken",
  "--tk-surface-inverse",
];

const PAIRS: PairSpec[] = [
  { token: "--tk-text-primary", against: "--tk-surface-default", kind: "textNormal" },
  { token: "--tk-text-secondary", against: "--tk-surface-default", kind: "textNormal" },
  { token: "--tk-text-tertiary", against: "--tk-surface-default", kind: "textNormal" },
  { token: "--tk-text-inverse", against: "--tk-surface-inverse", kind: "textNormal" },
  {
    token: "--tk-text-disabled",
    against: "--tk-surface-default",
    kind: "textNormal",
    exempt: "1.4.3 excludes disabled controls",
  },
  {
    token: "--tk-line-subtle",
    against: "--tk-surface-default",
    kind: "nonText",
    exempt: "decorative, not a UI boundary",
  },
  {
    token: "--tk-line-default",
    against: "--tk-surface-default",
    kind: "nonText",
    exempt: "decorative, not a UI boundary",
  },
  { token: "--tk-line-strong", against: "--tk-surface-default", kind: "nonText" },
  { token: "--tk-action-text", against: "--tk-action-fill", kind: "textNormal" },
  {
    token: "--tk-action-quiet-text",
    against: "--tk-surface-default",
    kind: "textNormal",
  },
  { token: "--tk-focus-color", against: "--tk-surface-default", kind: "focus" },
];

function Contract({ pack, density, root }: ContextGlobals) {
  const { ref, read } = useTokenReader([pack, density, root]);
  const results = PAIRS.map((p) => judgePair(p, read));
  const failing = results.filter((r) => r.state === "fail").length;

  return (
    <Page
      hostRef={ref}
      title="Contract"
      note={
        <>
          Components never read the ramp. They read these slots, and a pack
          decides what fills them. That indirection is the entire mechanism by
          which a brand gets applied later without a component being touched —
          switch the pack in the toolbar and every value below moves while the
          ramp stays put.
        </>
      }
      spec={
        <>
          <b>pack</b> {pack} · <b>density</b> {read("--tk-density") || "1"} ·{" "}
          <b>failing</b> {failing} of {results.length} checked pairs · verdicts
          computed by the same module <code>tools/contrast-gate.mjs</code> runs
        </>
      }
    >
      <Sub>Surface — no requirement, these are the grounds</Sub>
      {SURFACES.map((name) => (
        <TokenRow key={name} name={name} value={read(name)} />
      ))}

      <Sub>Gradient — a range, so there is no single ratio to check</Sub>
      {/* Painted by the pack, not by this file: [data-gradient] reads the two
          slots below, so the strip and the rows cannot disagree. */}
      <div
        data-gradient=""
        data-direction="inline-end"
        style={{
          blockSize: "3rem",
          borderRadius: "var(--tk-radius-sm)",
          border: "1px solid var(--tk-line-default)",
          marginBlockEnd: "var(--tk-space-3)",
        }}
        aria-hidden="true"
      />
      {GRADIENT.map((name) => {
        const value = read(name);
        /* Only the two ends are colours; the other three are an angle, a
           percentage and a position, and a swatch of "180deg" is a lie. */
        const isColour = name.endsWith("-from") || name.endsWith("-to");
        const against = isColour
          ? contrastRatio(read("--tk-text-primary"), value)
          : null;
        return (
          <TokenRow
            key={name}
            name={name}
            value={value}
            swatch={isColour ? value : "transparent"}
            verdict={
              against == null
                ? ""
                : `${format(against)} vs text-primary — measured, not required`
            }
          />
        );
      })}

      <Sub>Checked pairs</Sub>
      {results.map((r) => (
        <TokenRow
          key={r.token}
          name={r.token}
          value={r.value}
          verdict={r.verdict}
          state={r.state}
        />
      ))}

      <Sub>Status — carried by boundary and label, never by hue alone (1.4.1)</Sub>
      {["info", "success", "warning", "danger"].map((s) => (
        <TokenRow
          key={s}
          name={`--tk-status-${s}-line`}
          value={read(`--tk-status-${s}-line`)}
          verdict={`surface ${read(`--tk-status-${s}-surface`)}`}
        />
      ))}
    </Page>
  );
}

/* No `component` on this meta, and no `<typeof Contract>` on the Meta.

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
  title: "02 Tokens/02 Contract",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Slots: Story = {
  name: "Semantic slots",
  render: (_args, ctx) => <Contract {...(ctx.globals as unknown as ContextGlobals)} />,
};
