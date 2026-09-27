import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

/* One React, not two — by installation, not by alias.

   This app lives beside the kit rather than containing it: the components come
   from ../src and their dependencies (motion, maplibre-gl, react-icons) are
   installed in the repo root. When this directory had its own node_modules,
   Node resolution gave ../src the root React and ./app the local one. Two
   copies of React is two copies of the hook dispatcher, and the build died
   prerendering Next's own not-found page with "Cannot read properties of null
   (reading 'useContext')" — a message that reads like a bug in a component and
   is not.

   An `alias: { react: <path> }` looks like the fix and is a worse bug:
   aliasing to a directory bypasses the package's exports map, so the React
   Server Components graph stops resolving through the "react-server"
   condition and quietly gets the client build instead. The fix is to have one
   node_modules. This directory declares no dependencies at all; `next` is a
   devDependency of the repo root and the app builds from there with
   `npm run next:build`. */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /* The kit source is outside this directory, so tracing has to start above it
     or the standalone output misses half the app. */
  outputFileTracingRoot: repo,

  /* react-icons ships one module per icon behind a barrel; without this the
     54 icons Icon.tsx imports drag the whole set into the client bundle. */
  experimental: {
    optimizePackageImports: ["react-icons"],
  },

  /* Ship the source maps. This is a prototype that a client team will open
     devtools on, and a minified stack trace from someone else's wireframe is
     not a useful thing to hand anybody. Lighthouse agrees — missing source
     maps for first-party JavaScript is a best-practices audit. They cost
     nothing at runtime: the browser fetches a .map only when devtools is
     open. */
  productionBrowserSourceMaps: true,
};

export default nextConfig;
