/**
 * The wireframe library: sections of a page, as scene templates.
 *
 * A scene can name a whole section in one part:
 *
 *   { kind: "section", type: "hero", variant: "split",
 *     heading: "Find the right service", body: "…", actions: ["Get started", "Learn more"] }
 *
 * and `expandSections` turns it into the kit's own parts (shells, headings,
 * text, media, cards, buttons) before the scene is sanitized, so a section
 * can only draw what the kit draws, and the layers panel shows what it is
 * made of. The section keeps its type and variant, so a reader (and a
 * layers panel) still sees "Hero · split".
 *
 * The types are the audit taxonomy's ids (ds-corpus taxonomy.json): an
 * audited region of a site and a section here mean the same thing, so an
 * audit's findings become a page's scene directly. Variants are layouts,
 * named by how they look, not numbered.
 *
 * Anything it had to correct (a type the library lacks, a layout a type
 * doesn't have) goes into `notes`, the way sanitize names its corrections.
 *
 * What a section takes, all optional, with plain placeholders when left out:
 *   heading   its heading               body     a sentence or paragraph
 *   eyebrow   a label above the heading actions  button labels, the first is the main one
 *   items     how many items it repeats media    what its picture stands in for
 *
 * Plain JavaScript, like scene.mjs: a page with no build step can use it.
 */

const DEFAULT = {
  heading: "Section heading",
  body: "A sentence or two that says what this section is for and what the reader can do next.",
  eyebrow: "Label",
};

const t = (kind, text, extra = {}) => ({ kind, text, ...extra });
const words = (s, key) => (typeof s[key] === "string" && s[key].trim() ? s[key].trim() : DEFAULT[key]);
const actionsOf = (s, fallback) => (Array.isArray(s.actions) && s.actions.length ? s.actions.map(String) : fallback);
const count = (s, n, lo = 1, hi = 8) => Math.max(lo, Math.min(hi, Number.isInteger(s.items) ? s.items : n));
const buttons = (labels) => labels.map((label, i) => ({ kind: "button", text: label, variant: i === 0 ? "solid" : "outline" }));
const headingBlock = (s, { level = 2, look, eyebrow = true, align } = {}) => ({
  kind: "stack",
  gap: 2,
  ...(align ? { align } : {}),
  children: [
    ...(eyebrow && s.eyebrow !== false ? [t("eyebrow", typeof s.eyebrow === "string" ? s.eyebrow : DEFAULT.eyebrow)] : []),
    t("heading", words(s, "heading"), { level, ...(look ? { look } : {}) }),
    ...(s.body !== false ? [t("text", words(s, "body"), { look: "lead" })] : []),
  ],
});
const card = (i, { media = true, action } = {}) => ({
  kind: "card",
  children: [
    ...(media ? [{ kind: "media", ratio: "16 / 9", label: "Picture" }] : []),
    { kind: "card-header", children: [t("card-title", `Item ${i + 1} title`)] },
    t("card-body", "One or two lines about this item."),
    ...(action ? [{ kind: "card-footer", children: [{ kind: "button", text: action, variant: "outline", size: "sm" }] }] : []),
  ],
});

/* ---------- the library ---------------------------------------------------- */

export const SECTIONS = {
  "site-header": {
    name: "Site header",
    about: "the brand, the main navigation and a call to action, across the top of every page",
    variants: {
      inline: {
        about: "brand, links and action in one row",
        build: (s) => ({
          kind: "row",
          gap: 5,
          align: "center",
          justify: "between",
          children: [
            t("heading", words(s, "heading") === DEFAULT.heading ? "Brand" : words(s, "heading"), { level: 2, look: "heading-s" }),
            { kind: "inline", gap: 4, children: actionsOf(s, ["About", "Services", "Insights", "Events", "Contact"]).slice(0, 7).map((l) => ({ kind: "button", text: l, variant: "quiet", size: "sm" })) },
            { kind: "row", gap: 2, align: "center", children: [{ kind: "icon", icon: "search", label: "Search" }, { kind: "button", text: "Contact us", size: "sm" }] },
          ],
        }),
      },
      stacked: {
        about: "brand and action above, links below: for many top-level links",
        build: (s) => ({
          kind: "stack",
          gap: 3,
          children: [
            {
              kind: "row",
              gap: 4,
              align: "center",
              justify: "between",
              children: [t("heading", words(s, "heading") === DEFAULT.heading ? "Brand" : words(s, "heading"), { level: 2, look: "heading-s" }), { kind: "button", text: "Contact us", size: "sm" }],
            },
            { kind: "inline", gap: 4, children: actionsOf(s, ["About", "Team", "Services", "Case studies", "Insights", "Events"]).slice(0, 9).map((l) => ({ kind: "button", text: l, variant: "quiet", size: "sm" })) },
          ],
        }),
      },
    },
  },

  "page-header": {
    name: "Page header",
    about: "the page's title, with at most a label above it and an introduction under it; no picture",
    variants: {
      title: {
        about: "the title alone",
        build: (s) => headingBlock({ ...s, body: false }, { level: 1, look: "title" }),
      },
      intro: {
        about: "label, title and an introduction",
        build: (s) => headingBlock(s, { level: 1, look: "title" }),
      },
    },
  },

  hero: {
    name: "Hero",
    about: "the page's opening statement over or beside a picture, with one or two actions",
    variants: {
      split: {
        about: "words on one side, the picture on the other",
        build: (s) => ({
          kind: "split",
          gap: 6,
          align: "center",
          children: [
            { kind: "stack", gap: 4, children: [headingBlock(s, { level: 1, look: "display" }), { kind: "row", gap: 3, children: buttons(actionsOf(s, ["Get started", "Learn more"]).slice(0, 2)) }] },
            { kind: "media", ratio: "4 / 3", label: typeof s.media === "string" ? s.media : "Hero picture" },
          ],
        }),
      },
      centred: {
        about: "a centred statement above a wide picture",
        build: (s) => ({
          kind: "stack",
          gap: 5,
          align: "center",
          children: [
            { kind: "center", children: [headingBlock(s, { level: 1, look: "display", align: "center" })] },
            { kind: "row", gap: 3, justify: "center", children: buttons(actionsOf(s, ["Get started", "Learn more"]).slice(0, 2)) },
            { kind: "media", ratio: "21 / 9", label: typeof s.media === "string" ? s.media : "Hero picture" },
          ],
        }),
      },
      "text-only": {
        about: "a large statement and actions, no picture",
        build: (s) => ({ kind: "stack", gap: 4, children: [headingBlock(s, { level: 1, look: "display" }), { kind: "row", gap: 3, children: buttons(actionsOf(s, ["Get started"]).slice(0, 2)) }] }),
      },
    },
  },

  "call-to-action": {
    name: "Call to action",
    about: "a short band that asks the reader to do one thing",
    variants: {
      band: {
        about: "heading, a sentence and one action, in a card",
        build: (s) => ({
          kind: "card",
          variant: "flat",
          children: [
            { kind: "card-header", children: [t("card-title", words(s, "heading"))] },
            t("card-body", words(s, "body")),
            { kind: "card-footer", children: buttons(actionsOf(s, ["Talk to us"]).slice(0, 2)) },
          ],
        }),
      },
      split: {
        about: "the words on the left, the action on the right",
        build: (s) => ({
          kind: "sidebar",
          gap: 5,
          side: "end",
          align: "center",
          children: [headingBlock({ ...s, eyebrow: false }, { level: 2, look: "heading-m" }), { kind: "row", gap: 3, children: buttons(actionsOf(s, ["Talk to us"]).slice(0, 2)) }],
        }),
      },
    },
  },

  "card-collection": {
    name: "Card collection",
    about: "a set of like cards under a heading, each an entry point to more",
    variants: {
      "grid-3": {
        about: "three columns of cards with pictures",
        build: (s) => ({ kind: "stack", gap: 5, children: [headingBlock({ ...s, eyebrow: false }), { kind: "grid", gap: 5, cols: 3, children: Array.from({ length: count(s, 3) }, (_, i) => card(i)) }] }),
      },
      "grid-4": {
        about: "four columns of smaller cards",
        build: (s) => ({ kind: "stack", gap: 5, children: [headingBlock({ ...s, eyebrow: false }), { kind: "grid", gap: 4, cols: 4, children: Array.from({ length: count(s, 4) }, (_, i) => card(i)) }] }),
      },
      "text-cards": {
        about: "cards without pictures, each with an action",
        build: (s) => ({
          kind: "stack",
          gap: 5,
          children: [headingBlock({ ...s, eyebrow: false }), { kind: "grid", gap: 5, cols: 3, children: Array.from({ length: count(s, 3) }, (_, i) => card(i, { media: false, action: "Learn more" })) }],
        }),
      },
    },
  },

  "feature-list": {
    name: "Feature list",
    about: "short items, each a bold lead and a sentence, often with an icon",
    variants: {
      list: {
        about: "one column, icon and lead per item",
        build: (s) => ({
          kind: "stack",
          gap: 5,
          children: [
            headingBlock({ ...s, eyebrow: false }),
            {
              kind: "stack",
              gap: 3,
              children: Array.from({ length: count(s, 5) }, (_, i) => ({
                kind: "row",
                gap: 3,
                align: "start",
                children: [{ kind: "icon", icon: "chevronRight" }, { kind: "stack", gap: 1, children: [t("heading", `Item ${i + 1}`, { level: 3, look: "heading-xs" }), t("text", "One sentence about it.")] }],
              })),
            },
          ],
        }),
      },
      grid: {
        about: "items in columns",
        build: (s) => ({
          kind: "stack",
          gap: 5,
          children: [
            headingBlock({ ...s, eyebrow: false }),
            {
              kind: "grid",
              gap: 5,
              cols: 3,
              children: Array.from({ length: count(s, 6) }, (_, i) => ({ kind: "stack", gap: 2, children: [{ kind: "icon", icon: "check" }, t("heading", `Item ${i + 1}`, { level: 3, look: "heading-xs" }), t("text", "One sentence about it.")] })),
            },
          ],
        }),
      },
    },
  },

  "media-with-text": {
    name: "Media with text",
    about: "a picture beside a heading, a paragraph and an action",
    variants: {
      "picture-left": {
        about: "the picture first",
        build: (s) => ({
          kind: "split",
          gap: 6,
          align: "center",
          children: [{ kind: "media", ratio: "4 / 3", label: typeof s.media === "string" ? s.media : "Picture" }, { kind: "stack", gap: 4, children: [headingBlock(s), { kind: "row", gap: 3, children: buttons(actionsOf(s, ["Find out more"]).slice(0, 1)) }] }],
        }),
      },
      "picture-right": {
        about: "the words first",
        build: (s) => ({
          kind: "split",
          gap: 6,
          align: "center",
          children: [{ kind: "stack", gap: 4, children: [headingBlock(s), { kind: "row", gap: 3, children: buttons(actionsOf(s, ["Find out more"]).slice(0, 1)) }] }, { kind: "media", ratio: "4 / 3", label: typeof s.media === "string" ? s.media : "Picture" }],
        }),
      },
    },
  },

  "newsletter-signup": {
    name: "Newsletter signup",
    about: "an invitation to subscribe, with an email field or a single sign-up action",
    variants: {
      field: {
        about: "heading, sentence, email field and subscribe",
        build: (s) => ({
          kind: "sidebar",
          gap: 5,
          side: "end",
          align: "end",
          children: [headingBlock({ ...s, eyebrow: false }, { level: 2, look: "heading-m" }), { kind: "row", gap: 2, align: "end", children: [{ kind: "field", label: "Email address", type: "email" }, { kind: "button", text: actionsOf(s, ["Subscribe"])[0] }] }],
        }),
      },
      link: {
        about: "a band whose one action is to sign up",
        build: (s) => ({ kind: "stack", gap: 4, children: [headingBlock({ ...s, eyebrow: false }, { level: 2, look: "heading-m" }), { kind: "row", gap: 3, children: buttons(actionsOf(s, ["Sign up now"]).slice(0, 1)) }] }),
      },
    },
  },

  "article-body": {
    name: "Article body",
    about: "running text at a reading measure: paragraphs, subheadings and a list",
    variants: {
      prose: {
        about: "subheadings and paragraphs, centred at the measure",
        build: (s) => ({
          kind: "center",
          children: [
            {
              kind: "stack",
              gap: 4,
              children: [
                t("heading", words(s, "heading"), { level: 2 }),
                t("text", "A paragraph of the article. It runs to the measure, so a line is comfortable to read, and continues as long as it needs to."),
                t("text", "A second paragraph. Real copy replaces this; until then it shows how much room the text takes."),
                t("heading", "A subheading", { level: 3 }),
                t("text", "More of the article under its subheading."),
              ],
            },
          ],
        }),
      },
    },
  },

  "site-footer": {
    name: "Site footer",
    about: "the site's closing links, contact and legal lines",
    variants: {
      columns: {
        about: "brand and columns of links, legal line below",
        build: (s) => ({
          kind: "stack",
          gap: 5,
          children: [
            {
              kind: "grid",
              gap: 5,
              cols: 4,
              children: [
                { kind: "stack", gap: 2, children: [t("heading", words(s, "heading") === DEFAULT.heading ? "Brand" : words(s, "heading"), { level: 2, look: "heading-s" }), t("text", "A line about the organisation.", { look: "small" })] },
                ...["Services", "About", "Insights"].map((col) => ({ kind: "stack", gap: 2, children: [t("heading", col, { level: 3, look: "heading-xs" }), ...["First link", "Second link", "Third link"].map((l) => ({ kind: "button", text: l, variant: "quiet", size: "sm" }))] })),
              ],
            },
            { kind: "divider" },
            { kind: "row", gap: 4, justify: "between", children: [t("text", "© Organisation", { look: "small" }), { kind: "inline", gap: 3, children: ["Privacy", "Terms", "Accessibility"].map((l) => ({ kind: "button", text: l, variant: "quiet", size: "sm" })) }] },
          ],
        }),
      },
      simple: {
        about: "one row of legal links",
        build: () => ({
          kind: "row",
          gap: 4,
          justify: "between",
          align: "center",
          children: [t("text", "© Organisation", { look: "small" }), { kind: "inline", gap: 3, children: ["Privacy", "Terms", "Accessibility", "Contact"].map((l) => ({ kind: "button", text: l, variant: "quiet", size: "sm" })) }],
        }),
      },
    },
  },
};

export const SECTION_TYPES = Object.keys(SECTIONS);
export const SECTION_VARIANTS = [...new Set(Object.values(SECTIONS).flatMap((x) => Object.keys(x.variants)))];

/** The section's parts, from its type, variant and words. Unknown variants fall back to the first. */
export function buildSection(node, notes) {
  const spec = SECTIONS[node.type];
  if (!spec) {
    notes?.push(`left out a section the library doesn’t have: “${String(node.type ?? "no type").slice(0, 40)}”`);
    return null;
  }
  const variant = spec.variants[node.variant] ? node.variant : Object.keys(spec.variants)[0];
  if (node.variant && variant !== node.variant) notes?.push(`drew the ${spec.name.toLowerCase()} as “${variant}”: it has no “${String(node.variant).slice(0, 24)}” layout`);
  const built = spec.variants[variant].build(node);
  return { kind: "section", type: node.type, variant, ...(node.label ? { label: node.label } : {}), children: [built] };
}

/**
 * Expand every short section in a scene into its parts. A section that
 * already has its parts (children) is left as written: someone has drawn it
 * by hand, and that wins over the template.
 */
export function expandSections(node, notes) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return node;
  if (node.kind === "section" && !(Array.isArray(node.children) && node.children.length)) {
    return buildSection(node, notes) ?? null;
  }
  if (Array.isArray(node.children)) return { ...node, children: node.children.map((c) => expandSections(c, notes)).filter(Boolean) };
  return node;
}
