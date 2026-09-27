import type { Meta, StoryObj } from "@storybook/react-vite";
/* MapLazy, not Map — this is the one the barrel exports and the one every
   page composition gets, so it is the one whose props belong in the panel.
   It is the eager Map plus the three props below that decide when 800 KB of
   maplibre is allowed to arrive. */
import { Map } from "./MapLazy";

const meta = {
  title: "04 Primitives/15 Map",
  component: Map,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "MapLibre map with light / dark basemaps and token-styled controls. scheme=\"auto\" follows the Storybook pack (wireframe vs wireframe-dark). Use for: Location context, reach, and office geography beside related copy. Don't use for: As the only content on a page, or as decoration without a label and a reason to pan/zoom.",
      },
    },
  },
  argTypes: {
    scheme: {
      control: "inline-radio",
      options: ["auto", "light", "dark"],
    },
    navigation: { control: "boolean" },
    scale: { control: "boolean" },
    geolocate: { control: "boolean" },
    fullscreen: { control: "boolean" },
    marker: { control: "boolean" },
    zoom: { control: { type: "range", min: 2, max: 18, step: 0.5 } },
    activate: {
      control: "inline-radio",
      options: ["view", "interaction"],
      description:
        "view loads as the map nears the viewport; interaction draws a placeholder with a button and loads nothing until it is pressed. Use interaction for a map above the fold.",
    },
    rootMargin: {
      control: "text",
      description: "How early activate=\"view\" starts loading, as a CSS margin around the viewport.",
    },
    activateLabel: {
      control: "text",
      description: "Button label when activate=\"interaction\".",
    },
  },
} satisfies Meta<typeof Map>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    activate: "view",
    rootMargin: "100% 0px",
    scheme: "auto",
    navigation: true,
    scale: true,
    geolocate: false,
    fullscreen: true,
    marker: true,
    zoom: 11,
    label: "Metro area map",
  },
};

export const Light: Story = {
  name: "Light basemap",
  args: {
    scheme: "light",
    navigation: true,
    scale: true,
    fullscreen: true,
    marker: true,
    zoom: 12,
    center: [-77.4107, 39.3954],
    label: "Regional area, light basemap",
  },
};

export const Dark: Story = {
  name: "Dark basemap",
  args: {
    scheme: "dark",
    navigation: true,
    scale: true,
    fullscreen: true,
    geolocate: true,
    marker: true,
    zoom: 11,
    pitch: 45,
    bearing: -20,
    label: "Metro area — dark",
  },
};

export const Compact: Story = {
  name: "Compact ratio",
  args: {
    scheme: "auto",
    ratio: "21 / 9",
    navigation: true,
    scale: false,
    marker: true,
    zoom: 10,
  },
  render: (args) => (
    <div data-shell="stack" data-gap="4" style={{ maxInlineSize: "48rem" }}>
      <p className="tk-doc-note" style={{ margin: 0 }}>
        Flip the Pack toolbar to wireframe-dark — scheme=\"auto\" swaps the basemap.
      </p>
      <Map {...args} />
    </div>
  ),
};
