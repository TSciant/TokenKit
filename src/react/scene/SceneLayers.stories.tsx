import type { Meta, StoryObj } from "@storybook/react-vite";
import { EXAMPLES } from "../../scene/examples.mjs";
import { cleanScene } from "./Scene";
import { SceneLayers } from "./SceneLayers";

const { scene: PRICING } = cleanScene(EXAMPLES[0]);

const meta = {
  title: "04 Primitives/35 Scene layers",
  component: SceneLayers,
  parameters: {
    docs: {
      description: {
        component:
          "A scene's structure as a nested list, one layer per part: its name, then its words and the options that matter. Pointing at a layer or focusing it lights its part through `onActive`; pressing it pins the light, so a keyboard user can light a part and look. Give it `active` from the Scene beside it and pointing at a part lights its layer. Use for: showing structure beside a Scene. Don't use for: site navigation (it is not a nav).",
      },
    },
  },
  argTypes: {
    scene: { control: "object" },
    active: { control: "text" },
    onActive: { action: "active" },
    label: { control: "text" },
  },
  args: { scene: PRICING, active: "0.3", label: "Pricing card layers" },
} satisfies Meta<typeof SceneLayers>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
