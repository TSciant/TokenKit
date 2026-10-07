import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EXAMPLES } from "../../scene/examples.mjs";
import { PACKS } from "../../scene/scene.mjs";
import { Scene, cleanScene } from "./Scene";
import { SceneLayers } from "./SceneLayers";

const PACK_NAMES = PACKS as Record<string, string>;
const [PRICING, HERO, SETTINGS] = EXAMPLES as unknown[];

const meta = {
  title: "04 Primitives/34 Scene",
  component: Scene,
  parameters: {
    docs: {
      description: {
        component:
          "A component described as data, drawn with the kit's own components. A scene is `{ title, brand, root }`, and each part is a `kind` (card, field, button, the seven shells…) with its words and its options. The kinds and the options they take are generated from the components' prop types, so a scene can only say what the kit can draw, and a change to a component reaches every scene. Whatever comes in, from a model's function call, pasted JSON or a file, is sanitized first: what the kit doesn't have is left out and named in the notes. Use for: showing structure beside a component, generating screens, checking a model's output. Don't use for: pages a person writes by hand (use the components).",
      },
    },
  },
  argTypes: {
    scene: { control: "object" },
    brand: { control: "select", options: [undefined, ...Object.keys(PACK_NAMES)] },
    active: { control: "text" },
    onActive: { action: "active" },
  },
  args: { scene: PRICING },
} satisfies Meta<typeof Scene>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A scene beside its layers: point at either and the other lights. */
function WithLayers({ scene }: { scene: unknown }) {
  const [active, setActive] = useState<string | null>(null);
  const { scene: clean } = cleanScene(scene);
  return (
    <div data-shell="sidebar" data-gap="5">
      <SceneLayers scene={clean} active={active} onActive={setActive} label={`${clean.title} layers`} />
      <Scene scene={clean} active={active} onActive={setActive} />
    </div>
  );
}

export const Playground: Story = {};

export const PricingCard: Story = {
  name: "Pricing card",
  parameters: { docs: { description: { story: "A card header with an eyebrow and subtitle, a metric, chips and a button group. Point at a layer to light its part, or at a part to light its layer; press a layer to pin it." } } },
  render: () => <WithLayers scene={PRICING} />,
};

export const SignUpHero: Story = {
  name: "Sign-up hero",
  parameters: { docs: { description: { story: "A split: the words and two buttons beside a plate. The plate draws itself in the pack; the scene says only what it stands in for." } } },
  render: () => <WithLayers scene={HERO} />,
};

export const SettingsForm: Story = {
  name: "Settings form",
  parameters: { docs: { description: { story: "A sidebar of sections beside a narrow form: fields sized to their answers, a choice group, flat cards in a grid and a button group with a danger action." } } },
  render: () => <WithLayers scene={SETTINGS} />,
};

export const EveryPack: Story = {
  name: "Every pack",
  parameters: { docs: { description: { story: "One scene, every pack. The scene names no colour, face or corner: the pack is the whole of the difference." } } },
  render: () => (
    <div data-shell="grid" data-cols="2" data-gap="4">
      {Object.keys(PACK_NAMES).map((slug) => (
        <div key={slug} data-shell="stack" data-gap="2">
          <p data-text="caption" style={{ margin: 0, color: "var(--tk-text-secondary)" }}>
            {PACK_NAMES[slug]}
          </p>
          <Scene scene={PRICING} brand={slug} aria-label={`Pricing card in ${PACK_NAMES[slug]}`} />
        </div>
      ))}
    </div>
  ),
};

export const Notes: Story = {
  name: "What the sanitizer leaves out",
  parameters: { docs: { description: { story: "A scene with mistakes in it: a placeholder (the kit doesn't model them), a part the kit doesn't have, a chip inside a button group and a pack that doesn't exist. Each is left out and named; what is left is drawn." } } },
  render: () => {
    const messy = {
      title: "Messy sign-in",
      brand: "neon",
      root: {
        kind: "card",
        children: [
          { kind: "card-title", text: "Sign in" },
          { kind: "field", label: "Email", type: "email", placeholder: "you@example.com" },
          { kind: "marquee", text: "Welcome!" },
          { kind: "button-group", text: "Sign-in actions", children: [{ kind: "button", variant: "solid", text: "Sign in" }, { kind: "chip", text: "New" }] },
        ],
      },
    };
    const { notes } = cleanScene(messy);
    return (
      <div data-shell="stack" data-gap="4">
        <div data-tk="alert" data-status="warning">
          <div>
            <p data-tk="alert-title">Left out</p>
            <ul>
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
        <Scene scene={messy} />
      </div>
    );
  },
};

/** The pricing card at 480px, for the Figma scene drawn from it (tools/scene-figma.mjs) to be laid over. */
export const OnionSkinPricing: Story = {
  name: "Onion skin: pricing card (Figma)",
  parameters: {
    docs: { description: { story: "The pricing card scene at 480px. Its Figma twin is not drawn by hand: `node tools/scene-figma.mjs 0 --width 480` prints the script that builds it from the kit's own Figma components and variables, and the onion check lays one over the other." } },
    onion: { component: "ScenePricing", target: "root", skin: () => "default.png" },
  },
  render: () => <Scene scene={PRICING} style={{ inlineSize: 480 }} />,
};

/** The settings form at 1024px, for its Figma twin (tools/scene-figma.mjs 2 --width 1024). */
export const OnionSkinSettings: Story = {
  name: "Onion skin: settings form (Figma)",
  parameters: {
    docs: { description: { story: "The settings form scene at 1024px: a sidebar, a centred measure, fields, an alert, choice cards, a grid of flat cards and a button group with a danger action, laid over the Figma frame built from the same scene." } },
    onion: { component: "SceneSettings", target: "root", skin: () => "default.png" },
  },
  render: () => <Scene scene={SETTINGS} style={{ inlineSize: 1024 }} />,
};
