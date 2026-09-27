import type { Meta, StoryObj } from "@storybook/react-vite";
import { contrastRatio, parseColor } from "../lib/contrast";

/**
 * Scrim — text over media, with the ratio proved rather than asserted.
 *
 * The usual objection to setting a title over a photograph is that the
 * photograph is unknown, so the contrast is unknown. True, and it does not
 * follow that nothing can be guaranteed: the image is unknown but bounded. No
 * pixel is lighter than white. Composite a wash of known colour and known
 * alpha over white and you have the lightest backdrop that can ever occur,
 * which is exactly what a success criterion needs.
 *
 * So the three alphas in the scale are solved, not chosen, and the gate checks
 * the solution in every pack, surface and density.
 */

const meta = {
  title: "03 Foundations/04 Scrim",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A wash with a computable worst case — only where you need it. data-from (top|bottom|start|end) anchors the edge; data-cover (25|40|55|70|85|100) limits how far it reaches. Alphas are solved, not picked; the gate checks them. Use for: text over unknown photos. Don't use for: painting the whole frame when only a text band needs contrast.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* The same arithmetic the gate runs, in the page, so the numbers on screen are
   computed rather than typed. One copy of the WCAG maths — src/lib/contrast. */
const WHITE = "#ffffff";
const over = (alpha: number) => {
  const c = Math.round(255 * (1 - alpha));
  return `rgb(${c}, ${c}, ${c})`;
};

const LEVELS = [
  {
    strength: "large" as const,
    token: "--tk-scrim-aa-large",
    alpha: 0.42,
    need: 3,
    why: "1.4.3 — large text, 24px or 18.66px bold and up",
  },
  {
    strength: undefined,
    token: "--tk-scrim-aa",
    alpha: 0.54,
    need: 4.5,
    why: "1.4.3 — normal text. The default.",
  },
  {
    strength: "aaa" as const,
    token: "--tk-scrim-aaa",
    alpha: 0.66,
    need: 7,
    why: "1.4.6 — AAA, for anything that has to survive a bad photograph",
  },
];

const mono = {
  fontFamily: "var(--tk-font-mono)",
  fontSize: "var(--tk-size-xs)",
  color: "var(--tk-text-tertiary)",
};

export const Guarantee: Story = {
  name: "The guarantee",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <header data-shell="stack" data-gap="2">
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          Scrim
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Each row is a scrim at one of the three derived alphas. The left
          plate is the wireframe case — a textured placeholder. The right plate
          is the <em>worst</em> case: pure white underneath, the lightest thing
          an unknown photograph can be. If the right plate passes, every
          photograph passes.
        </p>
      </header>

      <div data-shell="stack" data-gap="5">
        {LEVELS.map((l) => {
          const bg = over(l.alpha);
          const ratio = contrastRatio(parseColor(WHITE)!, parseColor(bg)!);
          return (
            <div key={l.token} data-shell="stack" data-gap="2">
              <p style={{ margin: 0, ...mono }}>
                {l.token} = {l.alpha} · needs {l.need}:1
              </p>

              <div data-shell="grid" data-cols="2" data-gap="4">
                <div
                  data-tk="scrim"
                  data-strength={l.strength}
                  style={{ borderRadius: "var(--tk-radius-nested)", blockSize: "10rem" }}
                >
                  <div
                    data-texture-overlay="hatch"
                    style={{ background: "var(--tk-surface-sunken)" }}
                  />
                  <div data-tk="scrim-content">
                    <span data-tk="eyebrow">wireframe plate</span>
                    <p
                      style={{
                        margin: 0,
                        color: "inherit",
                        fontSize: l.need === 3 ? "var(--tk-size-xl)" : undefined,
                        fontWeight: l.need === 3 ? "var(--tk-weight-bold)" : undefined,
                      }}
                    >
                      Rate setting after the 2026 rule
                    </p>
                  </div>
                </div>

                <div
                  data-tk="scrim"
                  data-strength={l.strength}
                  style={{ borderRadius: "var(--tk-radius-nested)", blockSize: "10rem" }}
                >
                  <div style={{ background: WHITE }} />
                  <div data-tk="scrim-content">
                    <span data-tk="eyebrow">worst case — pure white</span>
                    <p
                      style={{
                        margin: 0,
                        color: "inherit",
                        fontSize: l.need === 3 ? "var(--tk-size-xl)" : undefined,
                        fontWeight: l.need === 3 ? "var(--tk-weight-bold)" : undefined,
                      }}
                    >
                      Rate setting after the 2026 rule
                    </p>
                  </div>
                </div>
              </div>

              <p className="tk-doc-spec" style={{ margin: 0 }}>
                <b>{(ratio ?? 0).toFixed(2)}:1</b> against {bg} — the lightest
                composite this alpha can produce. {l.why}
              </p>
            </div>
          );
        })}
      </div>

      <div data-tk="alert" data-status="info">
        <div>
          <p data-tk="alert-title">What the gate caught here</p>
          <p style={{ margin: 0 }}>
            The first version of the scrim borrowed{" "}
            <code>[data-on=&quot;inverse&quot;]</code> for its text. Inverse
            means the opposite of the pack&rsquo;s default — light ink in a
            light pack, <em>dark</em> ink in a dark one — while the wash is the
            pack&rsquo;s darkest value in both. So under{" "}
            <code>wireframe-dark</code> it put near-black text on a near-black
            wash at 2.28:1, and it looked plausible in the light pack the whole
            time. A scrim paints its own ground, so it cannot borrow a context;
            it names its own slot, <code>--tk-text-on-scrim</code>.
          </p>
        </div>
      </div>
    </div>
  ),
};

/* --- textures -------------------------------------------------------------- */

const TEXTURES = [
  ["hatch", "45° at 8px. The wireframe idiom for a photograph, without the crossed-out box that reads as an error."],
  ["dots", "Lattice at 8px. For sunken bands and canvas — enough to say the surface is a surface."],
  ["rule", "Hairlines at 6px. For blocks standing in for running text at sizes where real copy would be unreadable."],
] as const;

export const Textures: Story = {
  name: "Textures",
  render: () => (
    <div data-shell="stack" data-gap="5">
      <header data-shell="stack" data-gap="2">
        <h1 className="tk-doc-title" style={{ margin: 0 }}>
          Textures
        </h1>
        <p className="tk-doc-note" style={{ margin: 0 }}>
          Masks, not images. An SVG data URI cannot read{" "}
          <code>currentColor</code>, so a texture shipped as a background
          carries its own colour and needs one copy per pack — the exact
          coupling the kit exists to avoid. As a mask the shape is kit-owned
          and the ink is <code>--tk-texture-ink</code>, so one asset works in
          every pack. Switch the pack in the toolbar and nothing here is
          reloaded.
        </p>
        <p className="tk-doc-spec" style={{ margin: 0 }}>
          <b>decorative by construction</b> none of these carries information,
          all are <code>aria-hidden</code> by virtue of being a background, and
          all drop out under <code>prefers-contrast: more</code>.
        </p>
      </header>

      <div data-shell="grid" data-cols="3" data-gap="4">
        {TEXTURES.map(([name, why]) => (
          <figure key={name} style={{ margin: 0 }} data-shell="stack" data-gap="2">
            <div
              data-texture-overlay={name}
              style={{
                aspectRatio: "4 / 3",
                background: "var(--tk-surface-sunken)",
                border: "1px solid var(--tk-line-default)",
                borderRadius: "var(--tk-radius-nested)",
              }}
            />
            <figcaption data-shell="stack" data-gap="1">
              <span style={mono}>data-texture-overlay=&quot;{name}&quot;</span>
              <span style={{ fontSize: "var(--tk-size-sm)", color: "var(--tk-text-secondary)" }}>
                {why}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  ),
};

export const Anchors: Story = {
  name: "Anchors and cover",
  parameters: {
    docs: {
      description: {
        story:
          "Wash only where contrast is needed. data-from anchors the edge; data-cover (25-100) is how far it reaches. Outside that band the photograph stays clear — the cure for an even grey slab and a harsh horizon.",
      },
    },
  },
  render: () => (
    <div data-shell="grid" data-cols="2" data-gap="4">
      {(
        [
          ["bottom", "70"],
          ["top", "40"],
          ["start", "55"],
          ["end", "55"],
        ] as const
      ).map(([from, cover]) => (
        <div key={from + cover} data-shell="stack" data-gap="2">
          <p style={{ margin: 0, ...mono }}>
            {"data-from=\""}{from}{"\" data-cover=\""}{cover}{"\""}
          </p>
          <div
            data-tk="scrim"
            data-from={from}
            data-cover={cover}
            style={{ borderRadius: "var(--tk-radius-nested)", blockSize: "12rem" }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, var(--tk-surface-sunken), var(--tk-surface-raised))",
                blockSize: "100%",
              }}
            />
            <div data-tk="scrim-content" data-on="scrim">
              <p style={{ margin: 0, fontWeight: 600 }}>
                Text rides the wash
              </p>
              <p style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
                Photo stays clear past cover.
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

