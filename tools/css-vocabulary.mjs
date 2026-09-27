#!/usr/bin/env node
/**
 * The CSS vocabulary, read once and shared.
 *
 * Two gates need the same answer to the same question — what values does this
 * kit's CSS name, and which selectors name them:
 *
 *   tools/attribute-gate.mjs   asks a real browser whether the value on an
 *                              element was answered by a rule
 *   tools/vocabulary-gate.mjs  asks whether a component's TypeScript union
 *                              offers the same values the CSS does
 *
 * They used to be one file and could have stayed two, each with its own
 * parser. That is the shape of every drift bug found here so far — the
 * texture overlay list that had four of thirteen names, the icon sizes that
 * lived in TypeScript and in CSS at once. A second parser would be a second
 * list. So the parser lives here and neither gate has one.
 *
 * Everything below reads FILES, not document.styleSheets. The reasons are in
 * the block that follows: per-story chunking, pseudo-elements, and selectors
 * where the value's element is context rather than subject.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------------------------------------------------------------------
   THE VOCABULARY COMES FROM THE SOURCE, NOT FROM document.styleSheets.

   The first version of this gate read the live CSSOM and got three separate
   wrong answers out of it, all of which looked like findings:

     per-story sheets   Vite code-splits CSS, so the set of rules loaded in one
                        story's iframe is not the set loaded in another's. A
                        value declared in faq.css was "undeclared" in every
                        story that did not pull faq.css in, and the report was
                        a map of the chunk graph rather than of the kit.

     pseudo-elements    `[data-texture-overlay="hatch"]::after` is where the
                        texture actually lives. element.matches() cannot be
                        asked about a pseudo-element — there is no element to
                        match — so every overlay came back inert.

     context selectors  `[data-tk="stagger"] > *` styles the stagger's
                        CHILDREN. The stagger element itself matches no rule
                        keyed on its own value, and by a naive reading is
                        doing nothing. It is doing all of its work.

   So the selectors are parsed here, from the files, once — complete and in
   source order — and the browser is asked only the question it alone can
   answer: does this element match this selector. element.matches() does not
   care whether the rule was loaded into that page.
   ------------------------------------------------------------------------ */

const cssFiles = (function cssWalk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) cssWalk(p, acc);
    else if (e.name.endsWith(".css")) acc.push(p);
  }
  return acc;
})(resolve(ROOT, "src/css"));

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, " ");

/* Split on a delimiter that is at nesting depth zero — outside (), [] and
   quotes. `:where([data-tk="a"], [data-tk="b"]) > *` has a comma and two
   spaces that must not be split on, which is the whole reason this is a
   scanner and not a regex. */
function splitTop(text, isDelim) {
  const out = [];
  let buf = "";
  let paren = 0;
  let bracket = 0;
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      buf += c;
      if (c === quote && text[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === "(") paren++;
    else if (c === ")") paren--;
    else if (c === "[") bracket++;
    else if (c === "]") bracket--;
    if (!paren && !bracket && isDelim(c)) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  out.push(buf);
  return out;
}

/* `:where(…)` wrapping a WHOLE selector is this kit's house style — it is how
   every component rule keeps zero specificity so a consumer can override it
   with anything. To a compound scanner that looks like a single compound, and
   `:where([data-tk="stagger"] > *)` then claims that the stagger element must
   itself be the child. It must not: it is the parent.

   `:where(X)` matches exactly what `X` matches, so unwrapping is lossless
   apart from specificity, which this gate does not care about. Unwrap only
   when the functional pseudo-class spans the entire selector and holds a
   single argument — `:where(a, b)` is two selectors and is left alone. */
function unwrap(selector) {
  let s = selector.trim();
  for (;;) {
    const m = s.match(/^:(?:where|is)\(([\s\S]*)\)$/);
    if (!m) return s;
    const inner = m[1];
    /* Balanced across the whole argument, and not a list. */
    if (splitTop(inner, (c) => c === ",").length !== 1) return s;
    let depth = 0;
    let ok = true;
    for (const c of inner) {
      if (c === "(") depth++;
      else if (c === ")") depth--;
      if (depth < 0) { ok = false; break; }
    }
    if (!ok || depth !== 0) return s;
    s = inner.trim();
  }
}

/* A selector cut into compounds, keeping the combinator that preceded each so
   a prefix can be rebuilt verbatim. */
function compounds(selector) {
  const parts = splitTop(selector.trim(), (c) => c === " " || c === ">" || c === "+" || c === "~");
  const out = [];
  let combinator = "";
  for (const raw of parts) {
    const t = raw.trim();
    if (!t) continue;
    out.push({ text: t, combinator });
    combinator = " ";
  }
  /* splitTop drops the combinator character itself, so recover it by scanning
     the original for what sat between compound i-1 and compound i. */
  let cursor = 0;
  for (let i = 0; i < out.length; i++) {
    const at = selector.indexOf(out[i].text, cursor);
    if (i > 0) {
      const between = selector.slice(cursor, at);
      const sign = between.match(/[>+~]/);
      out[i].combinator = sign ? ` ${sign[0]} ` : " ";
    }
    cursor = at + out[i].text.length;
  }
  return out;
}

/* What the gate asks is structural: is there a rule in this kit keyed on this
   value that reaches this element. State is not part of the question — a
   :hover rule is live whether or not the pointer is there, and a reveal's
   `:not([data-fx-in])` stops matching precisely BECAUSE the reveal worked. So
   state pseudo-classes and pseudo-elements come off before matching, and what
   is left is the structure. */
const RELAX = [
  /::[a-z-]+(\([^)]*\))?/gi,
  /:not\((?:[^()]|\([^()]*\))*\)/gi,
  /:(hover|focus|focus-visible|focus-within|active|checked|disabled|enabled|target|visited|link|open|placeholder-shown|user-invalid|indeterminate|defined|empty)\b/gi,
  /:(nth-child|nth-of-type|nth-last-child|nth-last-of-type)\([^)]*\)/gi,
  /:(first-child|last-child|only-child|first-of-type|last-of-type|only-of-type)\b/gi,
];
const relax = (sel) => {
  let out = sel;
  for (const re of RELAX) out = out.replace(re, "");
  return out.trim();
};

/* Every selector list in a file, in source order. A `{` at any nesting depth
   closes a head; `}` and `;` throw one away (a declaration, or the end of a
   block). Quotes are tracked so a brace inside a data URI is just a brace. */
function ruleHeads(css) {
  const out = [];
  let buf = "";
  let quote = null;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) {
      buf += c;
      if (c === quote && css[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === "{") {
      const head = buf.trim();
      if (head && !head.startsWith("@")) out.push(head);
      buf = "";
      continue;
    }
    if (c === "}" || c === ";") { buf = ""; continue; }
    buf += c;
  }
  return out;
}

const PAIR = /\[\s*(data-[a-z0-9-]+)\s*(?:([~^|$*]?)=\s*["']?([^\]"']*)["']?)?\s*[isIS]?\s*\]/g;

const claims = new Map(); // "attr=value" -> [prefix selector]
const declared = new Map(); // attr -> Set(value)
const bare = new Set(); // attr used as a presence selector
const defaults = new Map(); // "attr=value" -> file that declares it

/* SCOPE, which is what makes a vocabulary answerable.

   Pooling every value of an attribute across the whole kit gives a set nobody
   should offer. `data-tone` names four values — do, dont, loud, info — and no
   component has all four: do and dont are the guidance figure's, loud is a
   plate placement's, info is the FAQ's. Asked "does Guidance offer every tone
   there is", a pooled set says no and is wrong.

   So a value is recorded against the data-tk it shares a COMPOUND with, which
   is the same element. `[data-tk="guidance"][data-tone="do"]` scopes do to
   guidance. A pair in a compound with no data-tk — `[data-texture="hatch"]`,
   `[data-shell="grid"]` — belongs to no component and applies to all of them,
   so it goes in the global set and every component inherits it. */
const scoped = new Map(); // data-tk value -> attr -> Set(value)
const globalValues = new Map(); // attr -> Set(value)

const add = (map, key, value) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value);
};

/* THE DEFAULT IS THE HARD CASE, and it is not a loophole.

   `data-variant="solid"` has no rule anywhere, because solid IS the button —
   the base rule paints it and outline and quiet subtract from that. So the
   most common value of the most-used attribute in the kit looks, to a gate
   that only reads selectors, exactly like a typo. A `data-variant="sold"`
   looks identical.

   An allowlist inside this file would separate them and would then rot, the
   way every list that lives away from the thing it describes rots. So the
   declaration lives beside the base rule it describes, in the component's own
   CSS, as a comment the gate reads:

     /* tk-default: data-variant=solid, data-size=md *\/
     :where([data-tk="button"]) { … }

   Which also makes the file say out loud what a reader otherwise has to infer
   from the absence of a rule. */
const DEFAULT_MARK = /tk-default:\s*([^*\n]+)/g;

for (const file of cssFiles) {
  const raw = readFileSync(file, "utf8");
  const short = file.replace(`${ROOT}/`, "");
  for (const m of raw.matchAll(DEFAULT_MARK)) {
    /* The marker's OWNER is whichever component the next selector names.
 
       It matters, and the first version got it wrong by ignoring it. Keyed by
       pair alone, `tk-default: data-variant=solid` in button.css made `solid`
       a legal variant of the card as well — so tools/vocabulary-gate.mjs
       reported Card's union as missing a value the card's CSS has never heard
       of. A default belongs to the rule it sits above, which is exactly where
       it is written, so the owner is read from there rather than declared a
       second time. */
    const after = raw.slice(m.index + m[0].length, m.index + m[0].length + 600);
    const owner = after.match(/data-tk="([a-z0-9-]+)"/)?.[1] ?? null;
    for (const entry of m[1].split(",")) {
      const t = entry.trim().replace(/["']/g, "");
      if (!/^data-[a-z0-9-]+=\S+$/.test(t)) continue;
      /* Two components can share a default — `data-size=md` is the button's
         and the icon's — so the file list is a list. */
      if (!defaults.has(t)) defaults.set(t, []);
      defaults.get(t).push(short);

      const [attr, value] = t.split("=");
      if (owner) {
        if (!scoped.has(owner)) scoped.set(owner, new Map());
        add(scoped.get(owner), attr, value);
      } else {
        add(globalValues, attr, value);
      }
    }
  }
  const css = stripComments(raw);
  /* Rule heads: whatever sits between the last block delimiter and a `{`.
     Scanned rather than matched, because a selector list is full of the
     characters a regex would have to exclude — `:where(…)` has parentheses,
     `[data-tk="x"]` has quotes, and 05-textures.css has `{` inside a data URI.
     An at-rule prelude is a condition rather than a selector, so heads
     beginning with `@` are dropped. */
  for (const head of ruleHeads(css)) {
    if (!head.includes("[data-")) continue;
    for (const part of splitTop(head, (c) => c === ",")) {
      const sel = unwrap(part);
      if (!sel) continue;
      const cs = compounds(sel);
      for (let i = 0; i < cs.length; i++) {
        /* Two passes over the compound: the first finds which component this
           element IS, the second files each of its values under that. A
           single pass cannot, because `[data-tone="do"][data-tk="guidance"]`
           is the same element written the other way round. */
        const pairs = [...cs[i].text.matchAll(PAIR)].filter(
          ([, , op, value]) => !op && value !== undefined && value !== "",
        );
        const owner = pairs.find(([, attr]) => attr === "data-tk")?.[3];
        for (const [, attr, , value] of pairs) {
          if (attr === "data-tk") continue;
          if (owner) {
            if (!scoped.has(owner)) scoped.set(owner, new Map());
            add(scoped.get(owner), attr, value);
          } else {
            add(globalValues, attr, value);
          }
        }

        for (const [, attr, op, value] of cs[i].text.matchAll(PAIR)) {
          if (value === undefined || value === "") {
            bare.add(attr);
            continue;
          }
          /* Only exact `=` declares a value. `*=`, `^=` and friends match a
             substring, so they claim a shape rather than a name. */
          if (op) continue;
          if (!declared.has(attr)) declared.set(attr, new Set());
          declared.get(attr).add(value);

          /* The prefix is everything up to and including the compound that
             carries the pair. For `[data-tk="stagger"] > *` asked about
             stagger, that is `[data-tk="stagger"]` — which is the honest
             test, because an element that establishes context for its
             children is not inert. */
          const prefix = relax(
            cs.slice(0, i + 1).map((c, n) => (n ? c.combinator + c.text : c.text)).join(""),
          );
          if (!prefix) continue;
          const key = `${attr}=${value}`;
          if (!claims.has(key)) claims.set(key, new Set());
          claims.get(key).add(prefix);
        }
      }
    }
  }
}

/* A declared default is a value the CSS deliberately does not name, so it must
   not then be hunted for a matching rule. It joins the vocabulary and is
   exempt from the match test. */
const DEFAULTS = [...defaults.keys()];
for (const key of DEFAULTS) {
  const [attr, value] = key.split("=");
  if (!declared.has(attr)) declared.set(attr, new Set());
  declared.get(attr).add(value);
}


/**
 * @returns {{
 *   claims: Map<string, Set<string>>,   // "attr=value" -> prefix selectors
 *   declared: Map<string, Set<string>>, // attr -> values named by some selector
 *   bare: Set<string>,                  // attr used as a presence selector
 *   defaults: Map<string, string[]>,    // "attr=value" -> files declaring it a base state
 *   scoped: Map<string, Map<string, Set<string>>>, // data-tk value -> attr -> values
 *   global: Map<string, Set<string>>,   // attr -> values named with no data-tk in the compound
 * }}
 */
export function readVocabulary() {
  return { claims, declared, bare, defaults, scoped, global: globalValues, cssFiles };
}
