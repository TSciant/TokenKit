import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plate } from "./Plate";

const meta = {
  title: "04 Primitives/16 Plate",
  component: Plate,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The stand-in for a photograph. It draws its own composition — light source, horizon, texture — from a seed, so the same slot looks the same on every reload and two screenshots stay comparable. Use for: any image-shaped hole in a wireframe, and any card or hero that will eventually carry art. Don't use for: real content images, which are Figure or Media; a plate is aria-hidden and carries no information.",
      },
    },
  },
  argTypes: {
    ratio: {
      control: "select",
      options: ["21 / 9", "16 / 9", "16 / 10", "4 / 3", "1 / 1", "3 / 4"],
    },
    label: { control: "text", description: "Optional caption drawn inside the plate." },
    texture: {
      control: "select",
      options: [
        "hatch", "dots", "rule", "grid", "noise", "weave", "chevron", "grain",
        "paper", "stone", "mist", "grit", "halftone", "brand", "signature", "none",
      ],
    },
    crop: { control: "inline-radio", options: ["portrait", undefined] },
    bleed: {
      control: "inline-radio",
      options: [false, true, "full"],
      description: "Flush to the parent's edge; the parent supplies the corners and clips.",
    },
    seed: { control: { type: "range", min: 1, max: 6, step: 1 } },
    stock: {
      control: "boolean",
      description:
        "Fill with a photograph from STOCK_BY_SEED instead of drawing one. That map is empty in the kit — photography is licensed per engagement and lives under src/client/ — so this changes nothing until one is supplied.",
    },
    src: { control: "text", description: "Explicit image URL; overrides the seed." },
    placement: {
      control: "inline-radio",
      options: [false, "quiet", "loud"],
      description: "The honesty chip that marks a plate as a stand-in.",
    },
    priority: {
      control: "boolean",
      description:
        "Mark the one plate visible before any scrolling. Everything else withholds its src until it is near the viewport.",
    },
    fx: { control: false, description: "Motion FX. true infers from stock + bleed." },
    style: { control: "object" },
  },
  args: {
    ratio: "16 / 9",
    seed: 1,
    texture: "hatch",
    stock: false,
    placement: "quiet",
    priority: false,
    bleed: false,
  },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: "32rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Plate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Drawn: Story = { name: "Drawn" };

/* Six seeds side by side. The point is that they differ and that each one is
   the same on every run — a placeholder that reshuffles makes every screenshot
   diff a false positive. */
export const Seeds: Story = {
  name: "Seeds",
  render: () => (
    <div data-shell="grid" data-cols="3" data-gap="3">
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <Plate key={s} seed={s} ratio="4 / 3" placement={false} />
      ))}
    </div>
  ),
};

export const Textures: Story = {
  name: "Textures",
  render: () => (
    <div data-shell="grid" data-cols="2" data-gap="3">
      {(["hatch", "dots", "rule", "none"] as const).map((t) => (
        <Plate key={t} seed={2} ratio="16 / 9" texture={t} label={t} placement={false} />
      ))}
    </div>
  ),
};

export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  args: { texture: "hatch", seed: 1, stock: false },
  parameters: {
    docs: { description: { story: "The Figma component laid over this one at the 512px it is drawn at, one ratio at a time (the ratio control picks the skin). The height is capped at 22rem, so 4:3, 1:1 and 3:4 are the same height. Switch Onion in the toolbar." } },
    onion: { component: "Plate", skin: (a: Record<string, unknown>) => `${String(a.ratio ?? "16 / 9").replace(/\s*\/\s*/, "x")}.png` },
  },
};
