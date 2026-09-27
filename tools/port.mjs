/**
 * Port derivation, shared by the static server and Storybook.
 *
 * The port comes from the project folder's name rather than being picked, so
 * every checkout on a machine lands somewhere different and two of them never
 * collide. 20000-29999 sits clear of every common dev port and below the
 * ephemeral range.
 *
 * `offset` gives one project several stable ports: 0 for the static server,
 * 1 for Storybook, and so on.
 */

import { createConnection } from "node:net";
import { createHash } from "node:crypto";

/** Ports something else on this machine is likely to want. */
export const RESERVED = new Map([
  [1999, "partykit"],
  [3000, "next / express"],
  [3001, "next, second instance"],
  [4321, "astro default"],
  [4173, "vite preview"],
  [5173, "vite dev"],
  [5432, "postgres"],
  [5500, "live server"],
  [5918, "astro dev, another project"],
  [6006, "storybook, default"],
  [6007, "storybook, second instance"],
  [7860, "gradio / a1111"],
  [8000, "python http.server / sillytavern"],
  [8080, "generic"],
  [8188, "comfyui"],
  [8888, "jupyter"],
  [9229, "node inspector"],
  [11434, "ollama"],
]);

export function derivePort(name, offset = 0) {
  const h = createHash("sha256").update(name).digest();
  return 20000 + (((h[0] << 8) | h[1]) % 10000) + offset;
}

export function inUse(port) {
  return new Promise((done) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    const settle = (v) => {
      socket.destroy();
      done(v);
    };
    socket.setTimeout(300);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(false));
    socket.once("error", () => settle(false));
  });
}

export async function findPort(start, span = 40) {
  for (let p = start; p < start + span; p++) {
    if (RESERVED.has(p)) continue;
    if (!(await inUse(p))) return p;
  }
  throw new Error(`No free port in ${start}-${start + span}.`);
}

export function projectName(root) {
  return root.split(/[\\/]/).filter(Boolean).pop() || "tokenkit";
}
