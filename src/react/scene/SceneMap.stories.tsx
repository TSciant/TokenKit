import type { Meta, StoryObj } from "@storybook/react-vite";
import { SceneMap } from "./SceneMap";

/* The map a scene draws: the kit's Map, given a place as two numbers. */
const meta: Meta<typeof SceneMap> = {
  title: "04 Primitives/57 Scene map",
  component: SceneMap,
  parameters: {
    docs: {
      description: {
        component:
          "The map a scene's `map` part draws: the kit's Map on the pack's basemap, centred on a longitude and latitude, with a pin. A scene's options are words, flags and numbers, so the place is two numbers rather than a pair. Without a network it shows the Map's own empty state.",
      },
    },
  },
  args: {
    label: "Map of the Greenwich office",
    longitude: 0,
    latitude: 51.4779,
    zoom: 14,
    marker: true,
    ratio: "16 / 9",
  },
  argTypes: {
    label: { control: "text" },
    longitude: { control: { type: "number", step: 0.0001 } },
    latitude: { control: { type: "number", step: 0.0001 } },
    zoom: { control: { type: "range", min: 2, max: 18, step: 0.5 } },
    marker: { control: "boolean" },
    ratio: { control: "inline-radio", options: ["16 / 9", "4 / 3", "1 / 1", "3 / 4", "21 / 9"] },
  },
};
export default meta;

export const Playground: StoryObj<typeof SceneMap> = {};
