import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* A client's own stories, from their own repository, when asked for.

   Set only by `npm run storybook -- --client <folder>` (tools/storybook.mjs),
   for that dev session. Unset, which is always the case for `storybook
   build` and therefore for the site, this adds nothing: client work is
   previewed against the kit and never becomes part of it.

   The client's files import the kit as `tokenkit/react` and `tokenkit/css`,
   the same names the package exports, so they read the same way they would
   in the client's app. React is deduped so the client's folder, which has
   its own node_modules, does not bring a second copy and break hooks. */
const CLIENT_DIR = process.env.TK_CLIENT_DIR;
const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: StorybookConfig = {
  stories: [
    "../src/**/*.stories.@(ts|tsx)",
    ...(CLIENT_DIR ? [{ directory: CLIENT_DIR, files: "**/*.stories.@(ts|tsx)" }] : []),
  ],

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
    ...(CLIENT_DIR
      ? {
          resolve: {
            ...config.resolve,
            dedupe: [...(config.resolve?.dedupe ?? []), "react", "react-dom"],
            alias: [
              ...(Array.isArray(config.resolve?.alias) ? config.resolve.alias : []),
              { find: /^tokenkit\/react$/, replacement: resolve(KIT, "src/react/index.ts") },
              { find: /^tokenkit\/css$/, replacement: resolve(KIT, "src/css/index.css") },
            ],
          },
          server: {
            ...config.server,
            fs: { ...config.server?.fs, allow: [...(config.server?.fs?.allow ?? []), KIT, CLIENT_DIR] },
          },
        }
      : {}),
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
