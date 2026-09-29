import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],

  addons: [
    // axe on every story. Set to fail rather than warn once a component is
    // clean — a warning nobody must clear becomes a backlog.
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  staticDirs: [
    /* The wordmark, served at /wordmark.svg: the manager's sidebar brand, and the
       one copy the README title points at. */
    { from: "./static", to: "/" },
    /* The Figma skins the Onion toolbar switch lays over a component. Served
       at /onion; requested only while the switch is on. */
    { from: "../figma/skins", to: "/onion" },
    /* maplibre's web worker, served where Map.tsx's TK_MAP_WORKER_URL expects
       it. maplibre resolves its own worker from import.meta.url, which inside
       a bundled chunk is not an http(s) URL, so it has to be a real served
       file. The Next app copies the same file into public/. */
    {
      from: "../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
      to: "/maplibre-gl-worker.mjs",
    },
  ],

  core: { disableTelemetry: true },

  /* Pre-bundle the two dependencies stories reach lazily, so Vite does not
     discover them mid-session and full-reload the preview. */
  viteFinal: async (config) => ({
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [...(config.optimizeDeps?.include ?? []), "@chenglou/pretext", "motion/react"],
    },
  }),
  typescript: {
    // Props tables are generated from the TypeScript types rather than
    // hand-written, so a prop and its documentation cannot drift.
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
