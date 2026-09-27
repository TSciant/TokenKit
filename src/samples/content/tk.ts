import type { BrandContent } from "./types";

/**
 * TK — the house brand.
 *
 * The awkward one, and worth saying why rather than quietly writing it like
 * the other five. TK is not a business. It is the pack that stands in for a
 * client who has not arrived, so copy about doors or bagels would be a lie
 * about what this brand is, and copy in the ipsum's voice would leave it the
 * only member of the set with no voice of its own.
 *
 * What it actually is: the control. So it says so. This is the one pack whose
 * subject is the system itself — which is also the honest answer to "what
 * does a page look like before a brand book arrives", and that is a page a
 * client will genuinely be shown in week one.
 *
 * Deliberately plain. No display face, no posture, density 1.0, the kit's own
 * defaults throughout — so if a composition only looks right when a brand is
 * shouting, this is where that shows.
 */
export const TK: BrandContent = {
  slug: "tk",
  label: "Token Kit",

  nav: [
    { label: "Foundations", route: "services" },
    { label: "Components", route: "case-studies" },
    { label: "Patterns", route: "service-detail" },
    { label: "Accessibility", route: "team" },
    { label: "Notes", route: "insights" },
    { label: "Releases", route: "events" },
  ],

  spine: {
    engagement: "The control brand",
    client: "a client who has not arrived yet",
    outcome: "the system with nothing on top of it",
  },

  pages: {
    home: {
      hero: {
        label: "The system",
        slides: [
          {
            eyebrow: "Control",
            title: "This is what it looks like with nobody's brand on it",
            lede: "Every other pack in the toolbar replaces colour, type, spacing, texture and words. This one replaces nothing, which is the only way to see what the components are doing on their own.",
            cta: "Read the foundations",
            seed: 1,
            category: "drawing board",
          },
          {
            eyebrow: "Tokens",
            title: "A decision you only make once",
            lede: "Components never read a colour. They read a slot, and a pack decides what fills it — which is the entire mechanism by which a brand arrives later without a component being touched.",
            cta: "See the contract",
            seed: 4,
            category: "token table",
          },
          {
            eyebrow: "Checked",
            title: "Every claim on this page has a gate behind it",
            lede: "Contrast, accessibility, radius, attributes, vocabulary, controls. A system that cannot be checked is a style guide with good intentions.",
            cta: "What is measured",
            seed: 6,
            category: "test bench",
          },
        ],
      },

      proof: {
        heading: "What is actually enforced",
        deck: "Not aspirations. Each of these fails a build.",
        stats: [
          { value: "812", label: "contrast pairs, every pack" },
          { value: "332", label: "story runs, two viewports" },
          { value: "0", label: "colour literals outside packs" },
        ],
      },

      segments: {
        heading: "The layers, from the bottom",
        deck: "Five of them. Each one only knows about the one below it.",
        reachLabel: "What a pack owns",
        audiences: [
          { label: "Ramp", body: "Raw values with no jobs. A brand book, transcribed, and nothing reads it directly." },
          { label: "Contract", body: "Slots with jobs and no values. What every component reads." },
          { label: "Pack", body: "The mapping between the two, plus posture, texture and gradient." },
          { label: "Components", body: "Attributes in, CSS out. No component knows which brand it is rendering." },
          { label: "Content", body: "The words, per brand. Typed, so a missing page is a compile error." },
        ],
        reach: [
          "One contract, six packs",
          "Grayscale first; colour arrives late",
          "Every pack fills every slot the reference fills",
          "Attributes are the API, and a gate checks them",
        ],
      },

      features: {
        heading: "What the kit is made of",
        deck: "Six things, and the order matters more than the count.",
        items: ["Tokens", "Shells", "Primitives", "Patterns", "Packs", "Gates"],
        categories: ["token table", "grid sketch", "component sheet", "page layout", "swatch book", "test bench"],
      },

      articles: {
        heading: "Notes on the build",
        deck: "Mostly about things that failed silently.",
        kinds: ["Token", "Gate", "Craft"],
        cards: [
          "An @property the browser threw away, and the twelve that followed it",
          "Why an attribute nobody answers is worse than one that errors",
          "The concentric radius rule, and the cycle it caused",
          "Two lists that had to agree and did not",
          "Grayscale is a constraint, not a placeholder",
          "A filter region twenty per cent too big",
        ],
        categories: ["token table", "test bench", "corner detail", "two lists", "grey swatch", "noise field"],
      },

      event: {
        eyebrow: "Every release",
        heading: "The gates, run in full",
        body: "Contrast, accessibility at two viewports, radius, registered properties, attribute values, prop vocabularies, controls coverage and the type scale. Nothing ships with one of them red.",
        meta: "On every commit · all packs · both viewports",
        ctaLabel: "See the suite",
        seed: 2,
        category: "test bench",
      },
    },

    services: {
      title: "Foundations",
      deck: "The parts a brand does not get to change, and the reason each one is fixed.",
      intro:
        "A design system is mostly a set of decisions about what is allowed to vary. Everything on this page is the other half — the things that stay put so the varying parts have something to vary against.",
      modalBody:
        "If you are adopting this, the fastest route in is the contract page: seventy slots, each with a job, and every component reads only those.",
      feature: {
        eyebrow: "The contract",
        title: "Components read slots, never values",
        body: "A component that knows a hex value is a component a brand swap cannot reach. Every colour, size, radius and duration in this kit is a named slot with a job, filled by whichever pack is in force — which is why switching the toolbar changes six brands' worth of appearance and touches no component file.",
      },
      tileHeading: "The foundations",
      faq: [
        {
          q: "Why grayscale first?",
          a: "Because a layout that only works once it has colour has not been proved. The delivered prototype is unbranded on purpose, and colour arrives as a pack afterwards.",
        },
        {
          q: "Why attributes instead of props and classes?",
          a: "Three axes at four, ten and four positions is eighteen CSS rules. The class-per-variant equivalent is a hundred and sixty, and the props version is a lookup table nobody maintains.",
        },
        {
          q: "What happens if a pack forgets a slot?",
          a: "The token lint fails the build. Every pack has to fill every slot the reference pack fills, which is the only way an unfamiliar brand can be swapped in safely.",
        },
      ],
    },

    about: {
      title: "About Token Kit",
      deck: "A client-neutral system, built grayscale first, checked by machine.",
      proof: {
        heading: "The shape of it",
        deck: "Small on purpose. A system nobody can hold in their head gets forked.",
        stats: [
          { value: "70", label: "contract slots" },
          { value: "25", label: "composed patterns" },
          { value: "13", label: "gates in the suite" },
        ],
      },
      segments: {
        heading: "Principles, and what each one costs",
        deck: "Five. None of them is free and the price is worth naming.",
        showMap: false,
        reachLabel: "Constraints",
        audiences: [
          { label: "Grayscale first", body: "Costs: every review looks unfinished for weeks. Buys: a layout proved without colour doing the work." },
          { label: "Attributes as API", body: "Costs: TypeScript cannot check a string. Buys: eighteen rules where a class system needs a hundred and sixty — and a gate that checks the strings." },
          { label: "Derived, not listed", body: "Costs: indirection. Buys: two lists can never disagree, because there is only one." },
          { label: "Checked by machine", body: "Costs: a slow build. Buys: claims that survive somebody else reading them." },
          { label: "Nothing transcribed", body: "Costs: every doc page has to be live. Buys: a specimen sheet that cannot be quietly wrong." },
        ],
        reach: [
          "One contract, any number of packs",
          "WCAG 2.2 AA, gated rather than claimed",
          "No colour literal outside a pack",
          "No component knows its brand",
        ],
      },
      promo: {
        title: "The house brand is a placeholder and says so",
        body: "TK is not a business. It is the pack that fills the slots when no brand book has arrived, which is the state every engagement starts in and most of them spend longer in than anyone plans for.",
        modalBody:
          "The other five packs in the toolbar are specimens: original marks, invented names, and six unrelated identities filling one contract. They exist to prove the claim rather than to sell anything.",
      },
    },
  },
};
