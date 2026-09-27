import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page, Sub, useTokenReader, type ContextGlobals } from "./doc";

/**
 * Texture — kit-owned masks, pack-owned ink.
 *
 * Shapes live in 05-textures.css as mask-image tokens. Ink is --tk-texture-ink
 * from the brand pack. That split is the architecture: one asset per texture,
 * every pack, light and dark, with prefers-contrast:more wiping decoration.
 */

const meta = {
  title: "02 Tokens/07 Texture",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Wireframe presence without photographs. Masks are kit-owned; --tk-texture-ink is the pack contract slot. Apply with data-texture or data-texture-overlay.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* Two families, and the split is the point rather than a filing convenience.

   DRAFTING is a 1-bit mask at a small pitch: a pixel is on or off. That is
   the vocabulary of a drawing ABOUT a page, and it is correct for the
   unbranded grayscale wireframe the kit delivers in — a wireframe should
   look like a wireframe.

   MATERIAL is feTurbulence, which produces fractal noise and therefore
   continuous alpha — pixels that are 37% opaque rather than on or off. Same
   architecture, same masks, same --tk-texture-ink; the only change is that
   the alpha stopped being binary, and that alone is what separates a surface
   from an annotation. */
const DRAFTING = [
  ["hatch", "Photograph stand-in. The wireframe idiom for media."],
  ["dots", "Sunken canvas. Enough to say the surface is a surface."],
  ["rule", "Running-text stand-in when lorem would be noise."],
  ["grid", "Catalogue / structure bands. Orthogonal, denser than dots."],
  ["noise", "Soft presence without direction."],
  ["weave", "Crosshatch — cloth rather than a direction."],
  ["chevron", "The only drafting mask with a direction."],
  ["grain", "Scattered specks. The drafting family reaching for material and not quite getting there."],
] as const;

const MATERIAL = [
  ["paper", "Fine even grain, close to an uncoated stock. 180px tile."],
  ["stone", "Coarse and clumped — aggregate rather than grain. 220px."],
  ["mist", "Very low frequency: reads as depth, not surface. 900px, because a low-frequency tile has to be large enough to hold enough features that the repeat is not findable."],
  ["grit", "Dense film grain, at the threshold of noticing. 140px."],
  ["halftone", "The one material with a deliberate repeat, because a halftone screen is regular. Soft-edged dot against drafting `dots`' hard disc — the whole difference between print and drawing."],
  ["brand", "Whatever this pack chose. Change the pack in the toolbar and only this tile moves."],
] as const;

const KINDS = [...DRAFTING, ...MATERIAL] as const;

/* The third category, and the only one whose VALUE is not in this repo's CSS.
   Six brands, one attribute: `data-texture="signature"` resolves to whatever
   --tk-texture-signature the pack filled. */
const BRANDS = [
  ["tk", "TK", "The house grid. The control brand's signature is the kit's own idiom."],
  ["door-shop", "Door Shop", "Sparks off a saw — sparse, so it reads as incident rather than pattern."],
  ["mohave", "Mohave", "Sand over a dune line."],
  ["bathing-bagels", "Bathing Bagels", "Steam above, seeds below."],
  ["wandas", "Wanda's", "Milkshake swirls."],
  ["muncheese", "Muncheese", "Fur tufts and cheese holes."],
] as const;

export const Texture: Story = {
  name: "Texture",
  render: (_args, ctx) => {
    const g = ctx.globals as ContextGlobals;
    const { ref, read } = useTokenReader([g.pack, g.density, g.root]);
    const ink = read("--tk-texture-ink");

    return (
      <Page
        hostRef={ref}
        title="Texture"
        note={
          <>
            A wireframe that is only rectangles reads as unfinished. Texture buys
            enough presence to judge structure. These are decorative masks — they
            carry no information, and <code>prefers-contrast: more</code> drops
            them entirely.
          </>
        }
        spec={
          <>
            <b>kit-owned</b> mask shapes in <code>05-textures.css</code> ·{" "}
            <b>pack-owned</b> <code>--tk-texture-ink</code> ({ink || "—"}),{" "}
            <code>--tk-texture-paint</code> and <code>--tk-texture-signature</code> ·{" "}
            <b>coordinate</b> <code>data-texture</code> /{" "}
            <code>data-texture-overlay</code>
          </>
        }
      >
        <Sub>Fill textures</Sub>
        <div data-shell="grid" data-cols="3" data-gap="4" style={{ ["--_min" as string]: "10rem" }}>
          {KINDS.map(([name, why]) => (
            <figure key={name} data-shell="stack" data-gap="2" style={{ margin: 0 }}>
              <div
                data-texture={name}
                style={{
                  blockSize: "7rem",
                  borderRadius: "var(--tk-radius-nested)",
                  border: "1px solid var(--tk-line-default)",
                }}
                aria-hidden="true"
              />
              <figcaption data-shell="stack" data-gap="1">
                <code style={{ fontSize: "var(--tk-size-sm)" }}>data-texture=&quot;{name}&quot;</code>
                <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
                  {why}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>

        <Sub>Signature — the one texture the kit does not own</Sub>
        <p className="tk-doc-note">
          Every mask above means the same thing in every pack: <code>dots</code>{" "}
          is dots under Mohave and under Door Shop, which is what makes it
          kit-owned. <code>signature</code> means whatever this brand drew, so
          the value is emitted from the brand table into each pack rather than
          declared in <code>05-textures.css</code> — a file that belongs to
          nobody cannot hold a shape that belongs to somebody.
        </p>
        <p className="tk-doc-note">
          These six are the same attribute on the same element, six times. The
          tiles are black-only on purpose: a mask discards colour, so a tile
          drawn in the brand's red would look right in isolation and then
          ignore every pack it was put under. Shape is the contract;{" "}
          <code>--tk-texture-paint</code> is the paint.
        </p>
        <div
          data-shell="grid"
          data-cols="3"
          data-gap="4"
          style={{ ["--_min" as string]: "11rem" }}
        >
          {BRANDS.map(([brand, label, why]) => (
            <figure
              key={brand}
              data-brand={brand}
              data-shell="stack"
              data-gap="2"
              style={{ margin: 0 }}
            >
              <div
                data-texture="signature"
                style={{
                  blockSize: "7rem",
                  borderRadius: "var(--tk-radius-nested)",
                  border: "1px solid var(--tk-line-default)",
                }}
                aria-hidden="true"
              />
              <figcaption data-shell="stack" data-gap="1">
                <code style={{ fontSize: "var(--tk-size-sm)" }}>{label}</code>
                <p className="tk-doc-note" style={{ margin: 0, fontSize: "var(--tk-size-sm)" }}>
                  {why}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>

        <Sub>Overlay on a surface</Sub>
        <p className="tk-doc-note">
          The element keeps its background; the texture rides on a pseudo-element.
          Useful for sunken bands and hero scrim companions. Every name above
          works here — the two used to be separate lists in the CSS and the
          overlay list had four of the thirteen, so asking for one of the other
          nine produced an element with nothing on it.
        </p>
        <div
          data-shell="grid"
          data-cols="2"
          data-gap="4"
          style={{ ["--_min" as string]: "14rem" }}
        >
          {KINDS.map(([name]) => (
            <div
              key={name}
              data-texture-overlay={name}
              data-shell="stack"
              data-gap="2"
              style={{
                padding: "var(--tk-space-5)",
                background: "var(--tk-surface-sunken)",
                borderRadius: "var(--tk-radius-nested)",
                border: "1px solid var(--tk-line-default)",
                minBlockSize: "6rem",
              }}
            >
              <strong style={{ position: "relative" }}>{name} overlay</strong>
              <p className="tk-doc-note" style={{ margin: 0, position: "relative" }}>
                Type stays readable; decoration stays behind.
              </p>
            </div>
          ))}
        </div>
      </Page>
    );
  },
};
