import propertySrc from "../css/02-property.css?raw";
import scaleSrc from "../css/03-scale.css?raw";

/**
 * The contract, derived from the source rather than listed by hand.
 *
 * A hand-written list of token names is a second source of truth, and a second
 * source of truth about which tokens exist is the one that goes stale first —
 * someone adds a slot, the export quietly omits it, and nothing says so.
 *
 * `?raw` hands Vite the stylesheet as a string at build time, so the list is
 * computed from the same files the browser is running. Two sources:
 *
 *   02-property.css   everything registered with @property — the contract
 *   03-scale.css      the motion slots, which have no @property syntax to be
 *                     registered under (a transition shorthand is two values)
 *
 * tools/tokens-export.mjs does exactly this against the same two files, which
 * is why the JSON in Tokens/Export and the JSON in dist/tokens/ agree.
 */

const registered = [...propertySrc.matchAll(/@property\s+(--tk-[\w-]+)/g)].map((m) => m[1]);
const motion = [...scaleSrc.matchAll(/(--tk-motion-[\w-]+)\s*:/g)].map((m) => m[1]);
const duration = [...scaleSrc.matchAll(/(--tk-(?:duration|ease)-[\w-]+)\s*:/g)].map((m) => m[1]);

export const SLOTS: string[] = [...new Set([...registered, ...motion, ...duration])].sort();
