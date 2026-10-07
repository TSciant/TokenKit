/**
 * Scenes: a component described as data, made only of the kit's real parts.
 *
 *   { title, brand, root: { kind: "card", children: [ { kind: "card-title", text: "Pro plan" }, … ] } }
 *
 * A scene can come from anywhere (a model's function call, pasted JSON, a
 * file), so every one passes through `sanitize` before it is drawn: what is
 * left can only say what the kit can draw, and everything that was not is
 * named in `notes`. A clean scene with no notes is valid kit; each note is a
 * specific mistake, which also makes the notes a score for whatever wrote it.
 *
 * The vocabulary (vocabulary.mjs) is generated from the components' own prop
 * types by tools/gen-scene-vocabulary.mjs; this file only reads it. Plain
 * JavaScript, so a page with no build step can use it as it is.
 */

import { KINDS, PACKS } from "./vocabulary.mjs";

export { KINDS, PACKS };

export const LIMITS = { nodes: 150, depth: 10, text: 240, title: 80, options: 12 };

/* Words a kind needs to make sense when a scene leaves them out. */
const FALLBACK_TEXT = { "button-group": "Actions", "choice-group": "Choose one", choice: "Option" };

const same = (a, b) => String(a).replace(/\s+/g, "") === String(b).replace(/\s+/g, "");
const clip = (v, n) => String(v).replace(/\s+/g, " ").trim().slice(0, n);
const RESERVED = new Set(["kind", "text", "children"]);

/* --- the schema ---------------------------------------------------------------- */

/**
 * A JSON Schema for a scene, for any function-calling API: the kinds, each
 * one's options and their values, all from the same vocabulary the sanitizer
 * and the renderers read, so the three cannot disagree about what a kind is.
 * Pass the icon names to list them; leave them out to accept any string and
 * let the sanitizer name the ones the kit does not have.
 */
export function sceneSchema({ icons } = {}) {
  const props = {};
  for (const spec of Object.values(KINDS)) {
    for (const [prop, allowed] of Object.entries(spec.props ?? {})) {
      if (Array.isArray(allowed)) {
        const prev = props[prop]?.enum ?? [];
        props[prop] = { type: typeof allowed[0] === "number" ? "integer" : "string", enum: [...new Set([...prev, ...allowed])] };
      } else if (!props[prop]) {
        props[prop] =
          allowed === "icon" ? (icons ? { type: "string", enum: [...icons] } : { type: "string" })
          : allowed === "flag" ? { type: "boolean" }
          : allowed === "integer" ? { type: "integer" }
          : allowed === "list" ? { type: "array", items: { type: "string" } }
          : { type: "string" };
      }
    }
  }
  return {
    type: "object",
    required: ["title", "root"],
    properties: {
      title: { type: "string", description: "A short name for what this is, e.g. Pricing card" },
      brand: { type: "string", enum: Object.keys(PACKS), description: "Which pack dresses it" },
      root: { $ref: "#/$defs/node" },
    },
    $defs: {
      node: {
        type: "object",
        required: ["kind"],
        properties: {
          kind: { type: "string", enum: Object.keys(KINDS) },
          text: { type: "string", description: "The words, for kinds marked [text]" },
          children: { type: "array", items: { $ref: "#/$defs/node" }, description: "For kinds marked [children]" },
          ...props,
        },
      },
    },
  };
}

/** One line per kind, for a model's instructions: what it is and what it takes. */
export function describeKinds() {
  return Object.entries(KINDS)
    .map(([kind, s]) => {
      const bits = [`${kind}: ${s.about}`];
      if (s.props) bits.push(`(options: ${Object.keys(s.props).join(", ")})`);
      if (s.text) bits.push("[text]");
      if (s.children) bits.push(Array.isArray(s.children) ? `[children: ${s.children.join(", ")}]` : "[children]");
      if (s.within) bits.push(`[inside ${s.within.join(", ")}]`);
      return bits.join(" ");
    })
    .join("\n");
}

/* --- the sanitizer ------------------------------------------------------------- */

/**
 * A clean scene from anything. Unknown kinds, options and values are left out
 * and named in `notes`, never guessed at; a part in a place its kind can't go
 * is left out and named; text is text; the tree is capped in size and depth.
 * Throws only when there is nothing to show.
 *
 * @param {unknown} input  a scene object, or its JSON
 * @param {{ icons?: Set<string> }} [options]  the kit's icon names, to check icon options against
 * @returns {{ scene: { title: string, brand: string, root: object }, notes: string[] }}
 */
export function sanitize(input, { icons } = {}) {
  let raw = input;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      throw new Error("That isn't JSON.");
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("A scene is an object with a root part.");
  const root = raw.root ?? (raw.kind ? raw : null);
  if (!root || typeof root !== "object") throw new Error('A scene needs a root part: { "root": { "kind": "card", … } }.');

  const notes = new Set();
  let count = 0;

  function clean(node, depth, parent) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return null;
    const spec = KINDS[node.kind];
    if (!spec) {
      notes.add(`left out a part the kit doesn’t have: “${clip(node.kind ?? "unnamed", 40)}”`);
      return null;
    }
    const where = parent ? KINDS[parent.kind].name.toLowerCase() : "the scene";
    if (spec.within && !spec.within.includes(parent?.kind)) {
      notes.add(`left out a ${spec.name.toLowerCase()} outside a ${spec.within.join(" or ")}`);
      return null;
    }
    if (parent && Array.isArray(KINDS[parent.kind].children) && !KINDS[parent.kind].children.includes(node.kind)) {
      notes.add(`left out a ${spec.name.toLowerCase()} inside ${where}, which holds only ${KINDS[parent.kind].children.join(", ")}`);
      return null;
    }
    if (depth > LIMITS.depth) {
      notes.add(`stopped at ${LIMITS.depth} levels deep`);
      return null;
    }
    if (++count > LIMITS.nodes) {
      notes.add(`stopped at ${LIMITS.nodes} parts`);
      return null;
    }

    const out = { kind: node.kind };
    const name = spec.name.toLowerCase();
    if (node.text != null && String(node.text).trim()) {
      if (spec.text) out.text = clip(node.text, LIMITS.text);
      else notes.add(`ignored text on ${name}, which has no words`);
    }
    for (const [prop, allowed] of Object.entries(spec.props ?? {})) {
      const v = node[prop];
      if (v == null || v === "") continue;
      if (Array.isArray(allowed)) {
        const hit = allowed.find((a) => same(a, v));
        if (hit === undefined) notes.add(`ignored ${prop} “${clip(v, 24)}” on ${name}`);
        else out[prop] = hit;
      } else if (allowed === "icon") {
        if (!icons || icons.has(String(v))) out[prop] = String(v);
        else notes.add(`left out an icon the kit doesn’t have: “${clip(v, 24)}”`);
      } else if (allowed === "flag") {
        if (v === true || v === "true") out[prop] = true;
        else if (v !== false && v !== "false") notes.add(`ignored ${prop} “${clip(v, 24)}” on ${name}: it is on or off`);
      } else if (allowed === "integer") {
        const n = Math.round(Number(v));
        if (Number.isFinite(n) && n > 0) out[prop] = Math.min(n, 10000);
        else notes.add(`ignored ${prop} “${clip(v, 24)}” on ${name}: it is a whole number`);
      } else if (allowed === "list") {
        const list = (Array.isArray(v) ? v : [v]).map((o) => clip(typeof o === "object" && o ? (o.label ?? o.value ?? "") : o, 60)).filter(Boolean);
        if (list.length) out[prop] = list.slice(0, LIMITS.options);
        if (list.length > LIMITS.options) notes.add(`kept the first ${LIMITS.options} ${prop} on ${name}`);
      } else {
        out[prop] = clip(v, LIMITS.text);
      }
    }
    for (const key of Object.keys(node)) {
      if (!RESERVED.has(key) && !(key in (spec.props ?? {}))) notes.add(`ignored ${clip(key, 24)} on ${name}, which doesn’t take it`);
    }
    if (Array.isArray(node.children)) {
      if (spec.children) {
        const kids = node.children.map((c) => clean(c, depth + 1, node)).filter(Boolean);
        if (kids.length) out.children = kids;
      } else if (node.children.length) {
        notes.add(`left out what was inside ${name}, which holds no parts`);
      }
    }
    if (spec.text && !out.text && FALLBACK_TEXT[node.kind]) out.text = FALLBACK_TEXT[node.kind];
    if (node.kind === "field" && !out.label) out.label = "Label";
    return out;
  }

  const cleanRoot = clean(root, 1, null);
  if (!cleanRoot) throw new Error(`Nothing in that scene is a kit part${notes.size ? `: ${[...notes][0]}` : ""}.`);
  const brand = PACKS[raw.brand] ? raw.brand : "tk";
  if (raw.brand && !PACKS[raw.brand]) notes.add(`“${clip(raw.brand, 24)}” isn’t one of the packs, so it wears ${PACKS.tk}`);
  const scene = { title: clip(raw.title || raw.label || PACKS[brand] + " scene", LIMITS.title), brand, root: cleanRoot };
  return { scene, notes: [...notes] };
}

/* --- for layers ------------------------------------------------------------------ */

const SUMMARY_KEYS = ["variant", "tone", "size", "status", "level", "look", "cols", "ratio", "gap", "side", "width", "control", "type", "emphasis", "icon"];

/** The line a layer shows after its name: the words, then the options that matter. */
export function summary(node) {
  const bits = [];
  const t = node.text ?? node.label;
  if (t) bits.push(`“${t.length > 28 ? t.slice(0, 27) + "…" : t}”`);
  for (const key of SUMMARY_KEYS) {
    const v = node[key];
    if (v == null || v === "default" || v === "neutral") continue;
    bits.push(key === "gap" ? `gap ${v}` : key === "cols" ? `${v} cols` : key === "level" ? `h${v}` : String(v));
  }
  return bits.join(" · ");
}

/** Every node with its path ("0", "0.1", "0.1.2"), in reading order. */
export function walk(root, visit, path = "0", depth = 0) {
  visit(root, path, depth);
  (root.children ?? []).forEach((c, i) => walk(c, visit, `${path}.${i}`, depth + 1));
}
