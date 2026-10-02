import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Gradient } from "./Gradient";
import { Guidance, GuidancePair } from "./Guidance";
import { Icon } from "./Icon";
import { contrastRatio, format, THRESHOLD } from "../../lib/contrast";
import { useTokenReader, type ContextGlobals } from "../../tokens/doc";

const meta = {
  title: "04 Primitives/23 Gradient",
  component: Gradient,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Two pack-owned colours and three coordinates — shape, direction, emphasis — instead of a named gradient blob. Use for: a ground that needs to stop being flat. Don't use for: a ground under text without a scrim; a contrast ratio is between two colours and a gradient is a range.",
      },
    },
  },
  argTypes: {
    shape: { control: "inline-radio", options: ["linear", "radial", "conic", "fade"] },
    direction: {
      control: "select",
      options: [
        "block-end",
        "block-start",
        "inline-end",
        "inline-start",
        "diagonal",
        "diagonal-up",
      ],
    },
    emphasis: { control: "inline-radio", options: [undefined, "subtle", "strong"] },
    origin: { control: "text" },
    from: { control: "text" },
    to: { control: "text" },
    children: {
      control: false,
      description: "Slot. A gradient is a ground — text in it belongs on a scrim.",
    },
  },
  args: { shape: "linear", direction: "block-end" },
  render: (args) => (
    <Gradient {...args} style={{ blockSize: "12rem", borderRadius: "var(--tk-radius-lg)" }} />
  ),
} satisfies Meta<typeof Gradient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const SHAPES = [
  ["linear", "Two colours across the box. The angle comes from the direction."],
  ["radial", "A circle at the origin. Corner glows and spotlights."],
  ["conic", "A sweep from the angle. The only one where the angle is a start rather than a heading."],
  ["fade", "To nothing rather than to a second colour — the first colour at zero alpha, so it hands off to whatever is beneath."],
] as const;

const DIRECTIONS = [
  "block-start",
  "block-end",
  "inline-start",
  "inline-end",
  "diagonal",
  "diagonal-up",
] as const;

const tile = {
  blockSize: "7rem",
  borderRadius: "var(--tk-radius-md)",
  border: "1px solid var(--tk-line-subtle)",
};

/**
 * Four shapes, one pair of colours.
 *
 * Nothing below defines a gradient. Each tile sets `shape` and reads
 * `--tk-gradient-from` and `--tk-gradient-to` from whichever pack is in the
 * toolbar — switch it and all four change together, because there is one
 * declaration behind them.
 */
export const Shapes: Story = {
  name: "Shapes",
  render: () => (
    <div data-shell="stack" data-gap="4" style={{ padding: "var(--tk-space-5)" }}>
      <div data-shell="grid" data-cols="4" data-gap="4">
        {SHAPES.map(([shape, why]) => (
          <figure key={shape} data-shell="stack" data-gap="2" style={{ margin: 0 }}>
            <Gradient shape={shape} direction="diagonal" style={tile} />
            <figcaption data-shell="stack" data-gap="1">
              <code style={{ fontSize: "var(--tk-size-sm)" }}>shape=&quot;{shape}&quot;</code>
              <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
                {why}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  ),
};

/**
 * Six directions, and the reason they are named the way they are.
 *
 * `inline-end` rather than `right`, because the inline end is the right edge
 * in English and the left in Arabic. A CSS angle has no opinion about writing
 * mode, so the rtl flip is four extra rules in 06-gradient.css rather than a
 * pretence that 90deg means "towards the end".
 */
export const Directions: Story = {
  name: "Direction",
  render: () => (
    <div data-shell="stack" data-gap="5" style={{ padding: "var(--tk-space-5)" }}>
      <div data-shell="grid" data-cols="3" data-gap="4">
        {DIRECTIONS.map((direction) => (
          <figure key={direction} data-shell="stack" data-gap="2" style={{ margin: 0 }}>
            <Gradient direction={direction} style={tile} />
            <figcaption>
              <code style={{ fontSize: "var(--tk-size-sm)" }}>{direction}</code>
            </figcaption>
          </figure>
        ))}
      </div>

      <div dir="rtl" data-shell="stack" data-gap="2">
        <span data-tk="eyebrow">The same two, under dir=&quot;rtl&quot;</span>
        <div data-shell="grid" data-cols="2" data-gap="4">
          {(["inline-end", "diagonal"] as const).map((direction) => (
            <figure key={direction} data-shell="stack" data-gap="2" style={{ margin: 0 }}>
              <Gradient direction={direction} style={tile} />
              <figcaption>
                <code style={{ fontSize: "var(--tk-size-sm)" }}>{direction}</code>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Text on a gradient, measured at both ends.
 *
 * This is the story the component exists to make unnecessary. A contrast
 * ratio is between two colours; a gradient is a range. The figures below are
 * read off the live pack and computed with the same module the contrast gate
 * uses, so if a pack ships a pair that cannot carry text, this says so here
 * before anything is built on it.
 */
function BothEnds() {
  const host = useRef<HTMLDivElement>(null);
  const { ref, read } = useTokenReader([]);
  const from = read("--tk-gradient-from");
  const to = read("--tk-gradient-to");
  const ink = read("--tk-text-primary");

  const atFrom = contrastRatio(ink, from);
  const atTo = contrastRatio(ink, to);
  const worst = Math.min(atFrom ?? 0, atTo ?? 0);
  const need = THRESHOLD.textNormal;

  return (
    <div ref={host} data-shell="stack" data-gap="4" style={{ padding: "var(--tk-space-5)" }}>
      <div ref={ref} data-shell="stack" data-gap="3">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto auto auto",
            gap: "var(--tk-space-2) var(--tk-space-4)",
            alignItems: "center",
            fontSize: "var(--tk-size-sm)",
          }}
        >
          {[
            ["text-primary on gradient-from", from, atFrom],
            ["text-primary on gradient-to", to, atTo],
          ].map(([label, colour, ratio]) => {
            const pass = typeof ratio === "number" && ratio >= need;
            return (
              <div key={String(label)} style={{ display: "contents" }}>
                <Icon name={pass ? "check" : "close"} size="sm" />
                <span>{label}</span>
                <code>{String(colour) || "—"}</code>
                <code>{format(typeof ratio === "number" ? ratio : null)}</code>
              </div>
            );
          })}
        </div>

        <p className="tk-doc-note" style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
          The gradient carries text only if BOTH clear {need}:1. Worst end:{" "}
          <code>{format(worst || null)}</code>. Change the pack in the toolbar —
          a pair that passes in grayscale is not a pair that passes in colour,
          which is exactly why this is measured rather than assumed.
        </p>
      </div>

      <GuidancePair>
        <Guidance
          tone="do"
          note="Put the text on a scrim and let the gradient be a ground. The scrim composites a wash whose alpha was solved against the lightest backdrop a photograph can produce, so it does not care what is underneath it — including a gradient whose ends it has never seen."
        >
          <div data-tk="scrim" style={{ blockSize: "8rem", borderRadius: "var(--tk-radius-md)" }}>
            <Gradient
              shape="radial"
              direction="diagonal"
              style={{ position: "absolute", inset: 0 }}
              aria-hidden="true"
            />
            <div data-tk="scrim-content">
              <strong>Readable at both ends</strong>
            </div>
          </div>
        </Guidance>
        <Guidance
          tone="dont"
          note="Don't set text straight onto a gradient because it looked right in the screenshot. The ratio changes across the element, and the half that fails is the half nobody captured."
        >
          {/* aria-hidden, and not as a dodge. This panel is a PICTURE of a
              contrast failure — under Door Shop the blue end measures 2.66:1
              — so axe is right to flag it and the gate would be right to
              fail. Hiding it from the accessibility tree says what it is: an
              illustration, not content, with the real figures given above in
              text that anyone can read. */}
          <Gradient
            direction="inline-end"
            aria-hidden="true"
            style={{
              blockSize: "8rem",
              borderRadius: "var(--tk-radius-md)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <strong>Fine at one end</strong>
          </Gradient>
        </Guidance>
      </GuidancePair>
    </div>
  );
}

export const Legibility: Story = {
  name: "Text on a gradient",
  render: () => <BothEnds />,
};

/* Only here to keep the unused-import checker honest about the globals type
   the toolbar hands every story; the reader above uses no globals of its own
   because it reads whatever the decorator resolved. */
export type _Globals = ContextGlobals;

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The Figma component laid over this one at 480 by 192 (12rem): the shape and direction controls pick the skin, in the kit's wireframe pair. Switch Onion in the toolbar." } },
    onion: { component: "Gradient", target: "root", skin: (a: Record<string, unknown>) => `${a.shape ?? "linear"}-${String(a.direction ?? "block-end").replace(/-/g, "")}.png` },
  },
  decorators: [(Story) => <div style={{ inlineSize: 480 }}><Story /></div>],
};
