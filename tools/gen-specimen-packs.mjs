#!/usr/bin/env node
/**
 * Specimen packs — emitted, not hand-maintained.
 *
 * Six brands, one contract. The packs exist to prove a claim the kit makes
 * everywhere else and had, until now, nothing to point at: that applying a
 * brand is a pack arriving, not a component being rewritten. Six files that
 * differ only in values is exactly the shape that rots when it is maintained
 * by hand — one gets a slot the others never get, and the divergence is
 * invisible until a component reads that slot. So the values live in one
 * table here and the CSS is emitted from it.
 *
 *   node tools/gen-specimen-packs.mjs            write the packs
 *   node tools/gen-specimen-packs.mjs --check    fail if any file is stale
 *
 * The emitted files ARE the source that ships — they are committed, readable,
 * and a consumer can lift one into their own project without this script.
 * What the script owns is that all six stay the same shape.
 *
 * ---------------------------------------------------------------------------
 * WHY THE PRIVATE PREFIX IS NEVER `--tk-`.
 *
 * The base brand's slug is `tk`, and the template says pack-private values are
 * named `--<brand>-*`. Followed literally that produces `--tk-ink`, which is
 * indistinguishable from the contract's own namespace: the token lint would
 * read it as a contract slot nothing declares, and worse, a component author
 * skimming a pack could not tell which names are promises and which are
 * plumbing. So the base brand's private prefix is `--house-`, which is what it
 * actually is — the house brand, standing in for a client that has not
 * arrived yet.
 *
 * ---------------------------------------------------------------------------
 * THE RULE FOR A BRAND COLOUR THAT FAILS: NUDGE FIRST, REASSIGN ONLY IF IT
 * CANNOT BE NUDGED.
 *
 * When a brand colour will not clear a contrast floor there are three moves,
 * and the order matters. The wrong first move — and the usual one — is to
 * hand the job to a different colour from the palette: a grey focus ring
 * instead of an orange one. It passes, and it quietly tells the client their
 * brand does not apply to the parts of the page people actually use.
 *
 * So every constrained colour below went through tools/nudge-color.mjs first.
 * That holds the hue exactly, walks lightness (then saturation, reluctantly)
 * until every constraint is met, and returns the passing colour closest to
 * the original in OKLab. ΔE is a perceptual distance: under ~0.03 is a
 * rendition of the same colour, over ~0.10 is a different one. The rule this
 * pack set follows:
 *
 *   ΔE < 0.05   ship the nudged value in the slots that have a floor, and
 *               keep the brand's stated value in the slots that do not.
 *   ΔE > 0.10   the nudge is a rebrand. Reassign the job, and record the
 *               number that justified it.
 *
 * What that produced, measured rather than argued:
 *
 *   bagels  — pink #E11D7A → #CE1B70. L -4.3, ΔE 0.0404. Clears 4.73:1 under
 *             a cream label where the stated value was 4.07:1, so pink keeps
 *             the buttons, the ring and the meter after all. An earlier pass
 *             of this file gave the actions to brown; that was the wrong
 *             move and a four-percent lightness change undoes it.
 *   mohave  — orange cannot be nudged. On its own the ring needs #CE8408
 *             (ΔE 0.0964, and 3.03:1 with no headroom) and the meter fill
 *             needs #B77608 (ΔE 0.1524, a different colour). Asked for both
 *             the ring AND dark ink at 4.5:1 on top, the solver returns NO
 *             SOLUTION ON THIS HUE — the two constraints pull lightness in
 *             opposite directions and orange has no room between them. So
 *             orange keeps the button, where it is excellent at 7.29:1, and
 *             slate takes the ring and the meter. That is a proof, not a
 *             preference.
 *   yellows — Door Shop #F5B800 needs ΔE 0.1922 to ring; Muncheese #F4C430
 *             needs 0.2253. Both are rebrands. Yellow does not ring on a
 *             light ground, which is a fact about yellow rather than about
 *             these two brands, and both keep yellow where it belongs: on the
 *             mark and the ICON tile, under ink.
 *   tk      — violet already clears every floor at ΔE 0, so there is nothing
 *             to nudge. Mint is asked to be a logo and nothing else, and a
 *             logo has no floor (WCAG 1.4.3). Mint would need ΔE 0.0989 to
 *             ring; it is not asked to.
 *
 * The exemption is the reason the logo slots are a separate family: a brand
 * keeps its stated colour on the mark in every pack here, including the two
 * whose UI value had to move.
 */

import { nudge } from "./nudge-color.mjs";
import { byLightness } from "../src/lib/oklab.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "src/css/packs");
const CHECK = process.argv.includes("--check");

/* ---------------------------------------------------------------------------
   THE TABLE.

   `p` is the private prefix. `note` is the one line that goes at the top of
   the emitted file. `ramp` is the brand book transcribed; everything below it
   maps ramp keys into contract slots. Ramp keys are referenced by name, so a
   value appears exactly once.
--------------------------------------------------------------------------- */
const BRANDS = [
  {
    slug: "tk",
    p: "house",
    title: "TK — the house brand",
    note: [
      "The kit's own brand, and the placeholder every other pack is measured",
      "against. ToeKnee resolves to Token Kit; mint is the mark, violet does",
      "the work. They are different colours on purpose: mint is 2.5:1 on paper",
      "and cannot be a button, a ring or a rule. It can be a logo, because a",
      "logo is exempt (WCAG 1.4.3) — which is the whole reason the logo slots",
      "are separate from the action slots. Nothing here needs nudging: violet",
      "clears every floor as stated, at ΔE 0. Mint would need ΔE 0.0989 to",
      "ring, and is never asked to.",
    ],
    ramp: {
      danger: "#B91C1C",
      "danger-dark": "#991B1B",
      "danger-darker": "#7F1D1D",
      ink: "#0F172A",
      wash: "#000000",
      mint: "#10B981",
      violet: "#7C3AED",
      "violet-dark": "#6D28D9",
      "violet-darker": "#5B21B6",
      fog: "#E2E8F0",
      mist: "#EEF2F7",
      surface: "#F8FAFC",
      paper: "#FFFFFF",
      "ink-soft": "#475569",
      "ink-quiet": "#5A687D",
      "ink-faint": "#798697",
      rule: "#CBD5E1",
      "rule-faint": "#E9EEF4",
    },
    ladder: "Monogram mark and wordmark share letters, so MARK arrives early.",
    posture: {
      note: [
        "No posture. Deliberately — this is the control, and a set of six",
        "where every member is loud proves nothing. TK is what the kit does",
        "when nobody has asked it to be anybody, which is also what a client",
        "sees on day one before their brand book arrives.",
      ],
    },
    rejected: [["mint as a ring", "mint", { on: [["surface", 3], ["fog", 3]] }]],
  },
  {
    slug: "door-shop",
    p: "door",
    title: "Door Shop — big-box retail",
    note: [
      "Blue does the work and yellow is the mark. The instinct is the other",
      "way round — yellow is the louder half of the pair — but #F5B800 is",
      "1.79:1 against white, so a yellow button is a button with no label.",
      "Nudging does not rescue it: yellow needs ΔE 0.1922 to clear a 3:1 ring",
      "on white, which is a rebrand, and the same is true of Muncheese's",
      "yellow at 0.2253. Yellow does not ring on a light ground — a fact about",
      "yellow, not about these brands. It keeps the mark and the ICON tile,",
      "where it sits under ink and has no floor to clear.",
    ],
    ramp: {
      danger: "#B91C1C",
      "danger-dark": "#991B1B",
      "danger-darker": "#7F1D1D",
      ink: "#111827",
      wash: "#000000",
      blue: "#0B5CAD",
      "blue-dark": "#08487F",
      "blue-darker": "#063A67",
      yellow: "#F5B800",
      fog: "#E5EEF7",
      snow: "#FFFFFF",
      "ink-soft": "#3F4C63",
      "ink-quiet": "#52607A",
      "ink-faint": "#7B88A0",
      rule: "#C7D5E6",
      "rule-faint": "#EAF1F8",
    },
    ladder: "Prefers LOCKUP. WORD works alone in blue; ICON is yellow on blue.",
    posture: {
      note: [
        "Loud, tight, packed. Big-box retail sells by volume and its pages",
        "look like it: the headline is nearly twice the kit's default, set in",
        "caps, tracked in until the letters nearly touch, leading under 1 so",
        "two lines interlock. Corners are square because a rounded corner",
        "reads as friendly and this brand is not selling friendly.",
        "",
        "Density 0.85 is the part that carries furthest — every space token in",
        "the kit is the private ramp times this number, so one value pulls the",
        "whole page tighter and more of it fits above the fold. That is the",
        "actual retail argument, made in one line rather than in a layout.",
      ],
      font: {
        display: '"Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif',
      },
      size: { "4xl": "5rem", "3xl": "3.25rem", "2xl": "2.25rem", xl: "1.625rem" },
      leading: { display: "0.9", tight: "1.05" },
      tracking: { display: "-0.045em", tight: "-0.03em", wide: "0.12em" },
      weight: { bold: "900", semibold: "800", medium: "700" },
      /* --tk-radius-full too. It reads as "a pill" and every other pack
         leaves it at 9999px, but a brand that squares every other corner and
         then ships rounded chips has not squared its corners — it has
         squared the corners somebody remembered. Caught by looking at the
         page: the hero's offer rail came out as dark lozenges under a
         headline with no curve anywhere in it. */
      radius: { sm: "2px", md: "2px", lg: "3px", xl: "4px", full: "3px" },
      /* A heavy display face with hairline icons beside it reads as two brands. Icon weight follows type weight. */
      /* Newsprint. A flyer brand gets a print screen, not a drawing. */
      texture: { mask: "halftone", scale: "12px 12px" },
      iconStroke: "2.5",
      density: "0.85",
      measure: { base: "46ch", narrow: "38ch" },
      plate: { max: "15rem", portrait: "11rem" },
      displayCase: "uppercase",
    },
    rejected: [["yellow as a ring", "yellow", { on: [["snow", 3], ["fog", 3]] }]],
  },
  {
    slug: "mohave",
    p: "mohave",
    title: "Mohave — e-commerce, wordmark-led",
    note: [
      "The pack where the nudge fails, and fails provably. Orange is an",
      "excellent action fill carrying INK rather than white: 7.29:1 against",
      "2.15:1. It is also 2.15:1 on white, under the 3:1 floor for a focus",
      "ring, and 1.73:1 against a light meter track.",
      "",
      "Asked for a value on this hue that rings at 3:1 AND carries dark ink at",
      "4.5:1, tools/nudge-color.mjs returns no solution: ringing wants the",
      "orange darker and the ink-on-orange label wants it lighter, and there",
      "is no lightness between them. The rejected-probe block below is that",
      "result, recomputed, along with what each job would cost on its own.",
      "",
      "So slate rings and slate fills the meter, and that is a measurement",
      "rather than a preference. Nothing about the brand changed; the pack",
      "stopped pretending one colour can do every job.",
    ],
    ramp: {
      danger: "#B91C1C",
      "danger-dark": "#991B1B",
      "danger-darker": "#7F1D1D",
      ink: "#1B2430",
      wash: "#000000",
      slate: "#485563",
      orange: "#F59E0B",
      "orange-dark": "#E28E07",
      "orange-darker": "#D97706",
      fog: "#E5E7EB",
      snow: "#FFFFFF",
      "ink-soft": "#485563",
      "ink-quiet": "#5A6675",
      "ink-faint": "#7D848D",
      rule: "#D1D5DB",
      "rule-faint": "#EFF1F3",
    },
    ladder: "Wordmark-led: smStage=\"word\". The arc is the mark, under the name.",
    posture: {
      note: [
        "The opposite, and the reason this pack exists in the set. Nothing",
        "here shouts: the headline is SMALLER than the kit's default, set",
        "lowercase, tracked at almost nothing, with leading above 1.2 so the",
        "lines breathe rather than lock together. Bold means 600, because a",
        "brand this quiet has no 900 in it.",
        "",
        "Density 1.3 and a 64ch measure do the rest. The page is mostly air",
        "and long lines, which is what a calm editorial voice actually is —",
        "not a colour, a proportion. Plates run to 30rem because when there",
        "is this little text the image has to carry.",
      ],
      size: { "4xl": "2.75rem", "3xl": "2rem", "2xl": "1.5rem", xl: "1.25rem" },
      leading: { display: "1.2", tight: "1.3", normal: "1.65" },
      tracking: { display: "-0.005em", tight: "0em", wide: "0.02em" },
      weight: { bold: "600", semibold: "500", medium: "400" },
      radius: { sm: "6px", md: "12px", lg: "20px", xl: "28px" },
      /* Bold means 600 here, so the icons thin out to match rather than sitting on the page heavier than the headline. */
      /* Atmosphere rather than surface — the only mask that reads as distance. */
      texture: { mask: "mist", scale: "900px 900px" },
      iconStroke: "1.5",
      density: "1.3",
      measure: { base: "64ch", narrow: "52ch" },
      plate: { max: "30rem", portrait: "22rem" },
      displayCase: "lowercase",
    },
    /* Probes that are EXPECTED to fail or to cost too much. They emit no
       value; they exist so the header's claim about why slate rings is a
       number this file recomputed rather than a sentence somebody typed. */
    rejected: [
      /* The full job, which is the claim the note makes: ring on BOTH light
         grounds and still carry the dark label that makes orange a good
         button. Dropping the fog ground makes the ink constraint stop
         binding and the probe returns a solution — which is how the first
         draft of this list quietly disagreed with the paragraph above it. */
      [
        "orange ringing on both grounds AND under its ink label",
        "orange",
        { on: [["snow", 3], ["fog", 3]], under: [["ink", 4.5]] },
      ],
      ["orange ringing on both grounds, label ignored", "orange", { on: [["snow", 3], ["fog", 3]] }],
      ["orange as a ring on white alone", "orange", { on: [["snow", 3]] }],
      ["orange as a meter fill on the fog track alone", "orange", { on: [["fog", 3]] }],
    ],
  },
  {
    slug: "bathing-bagels",
    p: "bagel",
    title: "Bathing Bagels — breakfast, word plus ring",
    note: [
      "The pack that proves the nudge rule. Pink as stated fails under a cream",
      "label, and the obvious fix is to give the buttons to brown. A few",
      "percent of lightness is a better fix — the same colour in a slightly",
      "lower light, which then clears the label, rings, and fills a meter, so",
      "pink does every job it was drawn for. The exact numbers are below,",
      "recomputed each time this file is written rather than typed once.",
      "",
      "The stated value still appears, on the mark, because a logotype has no",
      "floor to clear (WCAG 1.4.3). That is the whole reason the -ui suffix",
      "exists rather than simply overwriting the brand's hex: the pack holds",
      "both, and each slot takes the one its own rules allow.",
    ],
    ramp: {
      danger: "#B42318",
      "danger-dark": "#912018",
      "danger-darker": "#7A1A14",
      ink: "#5C1A1A",
      wash: "#000000",
      brown: "#9A3412",
      "brown-dark": "#7C2A0E",
      "brown-darker": "#63220B",
      pink: "#E11D7A",
      orange: "#F97316",
      cream: "#FFF1E6",
      "cream-light": "#FFF8F2",
      paper: "#FFFFFF",
      "ink-soft": "#7A3A2A",
      "ink-quiet": "#8C4A34",
      "ink-faint": "#A98473",
      rule: "#E8CDB8",
      "rule-faint": "#F7E6D8",
    },
    ladder: "Prefers MARK early — the ring reads at 24px when the word does not.",
    posture: {
      note: [
        "Round and chunky. The radius family is the loudest thing this pack",
        "does — 22px on a card where the kit uses 8 — and it is the axis most",
        "systems never let a brand touch, which is why a rounded brand and a",
        "square one usually end up looking like the same site.",
        "",
        "Weight 800 and leading at 1.0 keep it cheerful rather than delicate.",
        "Concentric nesting does the hard part for free: the kit computes an",
        "inner radius from the outer one less the padding, so every nested box",
        "on the page re-solves itself when these four values change.",
      ],
      size: { "4xl": "3.5rem", "3xl": "2.75rem" },
      leading: { display: "1.0" },
      tracking: { display: "-0.025em" },
      weight: { bold: "800", semibold: "700" },
      radius: { sm: "14px", md: "22px", lg: "32px", xl: "44px" },
      /* The grain of an uncoated bag. */
      texture: { mask: "paper", scale: "180px 180px" },
      iconStroke: "2.25",
      density: "1.05",
      measure: { base: "50ch", narrow: "42ch" },
      plate: { max: "20rem" },
    },
    /* SOLVED, not typed. The three -ui values are whatever tools/nudge-color
       returns for these constraints at generation time, so the hex in the
       pack and the ΔE in its comment cannot disagree with each other or go
       stale when a ground moves. Targets carry headroom — 4.7 for a 4.5
       floor — because a pair that passes by 0.01 passes by luck. */
    nudges: {
      "pink-ui": { from: "pink", under: [["cream", 4.7]], on: [["cream-light", 3], ["cream", 3]] },
      /* From the RESTING FILL, not from the stated brand colour. A hover
         state is meant to be a visible step darker — measuring it against the
         brand asks whether it is still the brand, which is the wrong
         question and reports a press state as a rebrand. Solved in
         declaration order, so pink-ui exists by the time these read it. */
      "pink-ui-dark": { from: "pink-ui", under: [["cream", 5.7]] },
      "pink-ui-darker": { from: "pink-ui", under: [["cream", 6.2]] },
    },
  },
  {
    slug: "wandas",
    p: "wanda",
    title: "Wanda's — burger, custom word plus badge",
    note: [
      "The only pack where one brand colour does every job: red is the action",
      "fill, the focus ring and the mark, and clears every floor on both",
      "grounds. That is what a palette looks like when the brand was drawn",
      "with contrast in mind rather than corrected for it afterwards.",
    ],
    ramp: {
      "ink-lift": "#3A3330",
      ink: "#1C1917",
      wash: "#000000",
      brown: "#7C2D12",
      red: "#C8102E",
      "red-dark": "#A40D26",
      "red-darker": "#860A1F",
      cream: "#F5E6C8",
      fog: "#FDF6F0",
      paper: "#FFFFFF",
      "ink-soft": "#5A3A22",
      "ink-quiet": "#6B4A2E",
      "ink-faint": "#908370",
      rule: "#E3D3B5",
      "rule-faint": "#F3E9DC",
    },
    ladder: "FULL is badge + wordmark + tagline. Prefers WORD at sm — the name has the personality.",
    posture: {
      note: [
        "Editorial and hard-edged: a serif display face, square corners, a",
        "headline just under 4rem at nearly solid leading. The serif is the",
        "point — it is the one posture change that cannot be mistaken for a",
        "colour change, because it alters the shape of every letter in the",
        "headline while the body face stays exactly what it was.",
        "",
        "This is the pack that will carry the black-and-white palette. The",
        "proportions are already there; the colour is the part still to go.",
      ],
      font: { display: 'Georgia, "Times New Roman", Times, serif' },
      size: { "4xl": "4rem", "3xl": "2.75rem" },
      leading: { display: "0.98", tight: "1.1" },
      tracking: { display: "-0.03em", wide: "0.16em" },
      weight: { bold: "700", semibold: "600" },
      radius: { sm: "0px", md: "0px", lg: "0px", xl: "0px", full: "0px" },
      /* A serif display face wants finer icons; the contrast between thick and thin strokes is the brand's whole texture. */
      /* Film grain. The diner brand gets the texture of a photograph of a diner. */
      texture: { mask: "grit", scale: "140px 140px" },
      iconStroke: "1.75",
      density: "0.95",
      measure: { base: "58ch", narrow: "46ch" },
      plate: { max: "24rem" },
    },
  },
  {
    slug: "muncheese",
    p: "munch",
    title: "Muncheese — travel stop, mascot hero",
    note: [
      "A mascot brand, which is the case the ladder was built for: the critter",
      "is legible at 32px and the wordmark is not, so MARK arrives early and",
      "the ICON is the face alone on cream. Forest does the work; yellow is",
      "the ground the mascot sits on and never carries white. Nudging yellow",
      "into a ring costs ΔE 0.2253, which is a different colour, so it is not",
      "asked to be one.",
    ],
    ramp: {
      danger: "#B91C1C",
      "danger-dark": "#991B1B",
      "danger-darker": "#7F1D1D",
      ink: "#1C1917",
      wash: "#000000",
      beaver: "#6B4423",
      yellow: "#F4C430",
      forest: "#2F5D3A",
      "forest-dark": "#23472C",
      "forest-darker": "#1A3520",
      cream: "#F5E6C8",
      "cream-light": "#FDFAF2",
      paper: "#FFFFFF",
      "ink-soft": "#54402B",
      "ink-quiet": "#6B5439",
      "ink-faint": "#948162",
      rule: "#E3D3B5",
      "rule-faint": "#F4EEDF",
    },
    ladder: "Prefers MARK early. ICON is the face on a cream circle.",
    posture: {
      note: [
        "Imagery-forward. The plate caps are the posture here: 34rem instead",
        "of 22, and a 8rem floor instead of 4, so a picture on this brand's",
        "page is roughly half again the size it is anywhere else and refuses",
        "to shrink into a thumbnail.",
        "",
        "That cap is not decoration. A plate is the one element whose height",
        "comes from its ratio rather than its content, so raising it changes",
        "the rhythm of every page that has one — the text between images gets",
        "shorter relative to the images, which is what a lifestyle page IS.",
        "Type stays moderate on purpose: when the pictures are this big, a",
        "loud headline competes with them instead of introducing them.",
      ],
      size: { "4xl": "3.25rem", "3xl": "2.375rem" },
      leading: { display: "1.05", normal: "1.55" },
      tracking: { display: "-0.02em" },
      weight: { bold: "700" },
      radius: { sm: "8px", md: "16px", lg: "24px", xl: "32px" },
      /* Aggregate — roadside, not drawn. */
      texture: { mask: "stone", scale: "220px 220px" },
      iconStroke: "2.25",
      density: "1.15",
      measure: { base: "56ch", narrow: "46ch" },
      plate: { max: "34rem", portrait: "26rem", min: "8rem" },
    },
    rejected: [["yellow as a ring", "yellow", { on: [["cream-light", 3], ["cream", 3]] }]],
  },
];

/* --- slot maps -------------------------------------------------------------
   One per brand, keyed by ramp name. Written out rather than derived, because
   the mapping IS the pack — deriving it would be the system guessing at the
   one decision a brand is entitled to make.
--------------------------------------------------------------------------- */
const MAP = {
  tk: {
    base: "mist", default: "surface", raised: "paper", sunken: "fog", inverse: "ink",
    primary: "ink", secondary: "ink-soft", tertiary: "ink-quiet", disabled: "ink-faint",
    lineSubtle: "rule-faint", lineDefault: "rule", lineStrong: "ink-faint",
    fill: "violet", hover: "violet-dark", active: "violet-darker", actionText: "paper",
    quietHover: "fog", quietActive: "rule-faint", quietText: "violet",
    danger: "danger", dangerHover: "danger-dark", dangerActive: "danger-darker", dangerText: "paper", dangerQuiet: "danger",
    focus: "violet",
    data: "violet",
    logoInk: "mint", logoMark: "mint", logoWord: "ink", logoTagline: "ink-quiet", logoTile: "ink",
    dangerLine: "ink-faint", texture: "rule", paint: ["violet", "mint"],
  },
  "door-shop": {
    base: "fog", default: "snow", raised: "snow", sunken: "fog", inverse: "ink",
    primary: "ink", secondary: "ink-soft", tertiary: "ink-quiet", disabled: "ink-faint",
    lineSubtle: "rule-faint", lineDefault: "rule", lineStrong: "ink-faint",
    fill: "blue", hover: "blue-dark", active: "blue-darker", actionText: "snow",
    quietHover: "fog", quietActive: "rule-faint", quietText: "blue",
    danger: "danger", dangerHover: "danger-dark", dangerActive: "danger-darker", dangerText: "snow", dangerQuiet: "danger",
    focus: "blue",
    data: "blue",
    logoInk: "blue", logoMark: "yellow", logoWord: "blue", logoTagline: "ink-quiet", logoTile: "blue",
    dangerLine: "ink-faint", texture: "rule", paint: ["blue", "yellow"],
  },
  mohave: {
    base: "fog", default: "snow", raised: "snow", sunken: "fog", inverse: "ink",
    primary: "ink", secondary: "ink-soft", tertiary: "ink-quiet", disabled: "ink-faint",
    lineSubtle: "rule-faint", lineDefault: "rule", lineStrong: "ink-faint",
    fill: "orange", hover: "orange-dark", active: "orange-darker", actionText: "ink",
    quietHover: "fog", quietActive: "rule-faint", quietText: "slate",
    danger: "danger", dangerHover: "danger-dark", dangerActive: "danger-darker", dangerText: "snow", dangerQuiet: "danger",
    focus: "slate",
    data: "slate",
    logoInk: "ink", logoMark: "orange", logoWord: "ink", logoTagline: "ink-quiet", logoTile: "ink",
    dangerLine: "ink-faint", texture: "rule", paint: ["orange", "slate"],
    /* Mohave's signature is scattered grains at r0.4–0.55 in a 16px tile, so
       the mask survives a far smaller fraction of each tile than any other
       brand's. At the shared 55/28 it was invisible — not subtle, invisible.
       Coverage and alpha trade against each other, and a per-brand pair is
       the honest place to settle that rather than redrawing somebody's
       tile to suit one number. */
    paintAlpha: [90, 55],
  },
  "bathing-bagels": {
    base: "cream", default: "cream-light", raised: "paper", sunken: "cream", inverse: "ink",
    primary: "ink", secondary: "ink-soft", tertiary: "ink-quiet", disabled: "ink-faint",
    lineSubtle: "rule-faint", lineDefault: "rule", lineStrong: "ink-faint",
    fill: "pink-ui", hover: "pink-ui-dark", active: "pink-ui-darker", actionText: "cream",
    quietHover: "cream", quietActive: "rule-faint", quietText: "brown",
    danger: "danger", dangerHover: "danger-dark", dangerActive: "danger-darker", dangerText: "paper", dangerQuiet: "danger",
    focus: "pink-ui",
    data: "pink-ui",
    /* The mark keeps the stated hex. A logotype has no floor. */
    logoInk: "pink", logoMark: "pink", logoWord: "ink", logoTagline: "ink-quiet", logoTile: "ink",
    dangerLine: "pink-ui", texture: "rule", paint: ["pink", "brown"],
  },
  wandas: {
    base: "fog", default: "paper", raised: "paper", sunken: "cream", inverse: "ink",
    primary: "ink", secondary: "ink-soft", tertiary: "ink-quiet", disabled: "ink-faint",
    lineSubtle: "rule-faint", lineDefault: "rule", lineStrong: "ink-faint",
    fill: "red", hover: "red-dark", active: "red-darker", actionText: "fog",
    quietHover: "cream", quietActive: "rule-faint", quietText: "red",
    danger: "ink", dangerHover: "ink-lift", dangerActive: "wash", dangerText: "paper", dangerQuiet: "ink",
    focus: "red",
    data: "red",
    logoInk: "red", logoMark: "red", logoWord: "red", logoTagline: "ink-quiet", logoTile: "cream",
    dangerLine: "red", texture: "rule", paint: ["red", "cream"],
  },
  muncheese: {
    base: "cream", default: "cream-light", raised: "paper", sunken: "cream", inverse: "ink",
    primary: "ink", secondary: "ink-soft", tertiary: "ink-quiet", disabled: "ink-faint",
    lineSubtle: "rule-faint", lineDefault: "rule", lineStrong: "ink-faint",
    fill: "forest", hover: "forest-dark", active: "forest-darker", actionText: "cream",
    quietHover: "cream", quietActive: "rule-faint", quietText: "forest",
    danger: "danger", dangerHover: "danger-dark", dangerActive: "danger-darker", dangerText: "cream-light", dangerQuiet: "danger",
    focus: "forest",
    data: "forest",
    logoInk: "beaver", logoMark: "beaver", logoWord: "ink", logoTagline: "ink-quiet", logoTile: "yellow",
    dangerLine: "ink-faint", texture: "rule", paint: ["forest", "yellow"],
  },
};

/* --- solving ---------------------------------------------------------------
   Turn a brand's `nudges` and `rejected` declarations into resolved values
   and into the prose that justifies them. Both run at generation time, which
   is the point: a ΔE typed into a comment is a number that was true once.
--------------------------------------------------------------------------- */

/** `[["cream", 4.7]]` → the shape nudge() wants, with ramp keys resolved. */
const constraints = (ramp, spec = {}) => [
  ...(spec.on ?? []).map(([key, ratio]) => ({ against: ramp[key], ratio, role: "ink" })),
  ...(spec.under ?? []).map(([key, ratio]) => ({ against: ramp[key], ratio, role: "ground" })),
];

const sign = (n) => (n >= 0 ? "+" : "\u2212") + Math.abs(n).toFixed(1);

/**
 * Resolve every declared nudge into the ramp and return one comment line per
 * solved value. Throws rather than emitting a pack with an unsolved slot in
 * it: a nudge that stopped being solvable is a brand constraint that changed,
 * and the right response is a person looking at it, not a silent fallback.
 */
function solveNudges(brand) {
  const ramp = { ...brand.ramp };
  const lines = [];
  const records = [];
  for (const [key, spec] of Object.entries(brand.nudges ?? {})) {
    const from = ramp[spec.from];
    if (!from) throw new Error(`${brand.slug}: nudge "${key}" references unknown ramp key "${spec.from}"`);
    const r = nudge(from, constraints(ramp, spec));
    if (!r) throw new Error(`${brand.slug}: no value on the hue of ${from} satisfies "${key}"`);
    ramp[key] = r.to;
    /* "rendition / noticeable / REBRAND" answers "is this still the brand
       colour", which is only a question when the baseline is one. A value
       solved from another solved value is a state step, and the delta there
       means "how visible is the change", not "how far from the brand". */
    const fromStated = Object.hasOwn(brand.ramp, spec.from);
    records.push({
      key,
      fromKey: spec.from,
      fromStated,
      from: r.from,
      to: r.to,
      dl: Number(r.dl.toFixed(1)),
      deltaE: Number(r.delta.toFixed(4)),
      verdict: fromStated ? r.verdict : "state step",
    });
    lines.push(
      `${key}: ${r.from} \u2192 ${r.to} \u00b7 L ${sign(r.dl)} \u00b7 \u0394E ${r.delta.toFixed(4)}` +
        (fromStated ? ` (${r.verdict})` : ` (step from ${spec.from})`),
    );
  }
  return { ramp, lines, records };
}

/** Re-run the probes that are expected to fail, and report what they cost. */
function solveRejected(brand) {
  const records = (brand.rejected ?? []).map(([label, key, spec]) => {
    const from = brand.ramp[key];
    const r = nudge(from, constraints(brand.ramp, spec));
    return r
      ? { label, from: r.from, to: r.to, deltaE: Number(r.delta.toFixed(4)), verdict: r.verdict }
      : { label, from, to: null, deltaE: null, verdict: "no solution" };
  });
  const lines = records.map((x) =>
    x.to
      ? `${x.label}: ${x.from} \u2192 ${x.to} costs \u0394E ${x.deltaE.toFixed(4)} (${x.verdict})`
      : `${x.label}: NO SOLUTION on this hue \u2014 the constraints pull lightness apart`,
  );
  return { records, lines };
}

/**
 * A brand's proportion, as CSS.
 *
 * Every slot below was already in the contract and already overridable — the
 * packs simply never reached past colour, which is why six brands produced
 * six versions of one page. Nothing here is a new capability; it is the
 * capability finally being used.
 *
 * Order matters in one place: --tk-density must land in the same rule as the
 * space ramp that multiplies it, which 03-scale.css now restates on
 * [data-brand] for exactly this reason.
 */

/* --- signature tiles --------------------------------------------------------
   The one texture the kit does not own.

   Every other mask in 05-textures.css means the same thing in every pack —
   `dots` is dots under Mohave and under Door Shop — which is exactly what
   makes it kit-owned. A signature means "whatever this brand drew", so it
   cannot live in a file that belongs to nobody. It lives here, in the table
   that already owns everything else brand-specific, and is emitted into each
   pack as --tk-texture-signature.

   Black only, and that is load-bearing rather than tidy: these are MASKS.
   Colour inside the SVG would be discarded, so a tile drawn in the brand's
   red would look right in isolation and then ignore every pack it was put
   under. The shape is the kit's contract; the paint is --tk-texture-paint.

   Shapes originate from a Cursor/Grok pass on the pre-extraction repo (PR #1
   on the old remote), whose histories are disjoint from this one — ported
   rather than merged, because there is no merge base in either direction.
   ------------------------------------------------------------------------ */
const tile = (w, h, body) =>
  `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" ` +
  `width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>')`;

const SIGNATURE = {
  /* A drafting grid with two registration dots — the house brand's signature
     is the kit's own idiom, which is the joke and also the point. */
  tk: tile(12, 12,
    '<path d="M0 4h12M0 8h12M4 0v12M8 0v12" stroke="%23000" stroke-width="0.6" fill="none"/>' +
    '<circle cx="4" cy="4" r="0.7" fill="%23000"/>' +
    '<circle cx="8" cy="8" r="0.7" fill="%23000"/>'),

  /* Sparks off a saw. Sparse, so it reads as incident rather than as pattern. */
  "door-shop": tile(16, 16,
    '<path d="M3 2.5l0.6 1.5 1.5 0.6-1.5 0.6-0.6 1.5-0.6-1.5-1.5-0.6 1.5-0.6z" fill="%23000"/>' +
    '<path d="M11 5l0.4 1 1 0.4-1 0.4-0.4 1-0.4-1-1-0.4 1-0.4z" fill="%23000"/>' +
    '<path d="M7 11l0.5 1.2 1.2 0.5-1.2 0.5-0.5 1.2-0.5-1.2-1.2-0.5 1.2-0.5z" fill="%23000"/>' +
    '<circle cx="13.5" cy="12.5" r="0.6" fill="%23000"/>' +
    '<circle cx="2" cy="13" r="0.45" fill="%23000"/>'),

  /* Sand grains over a dune line. */
  mohave: tile(16, 16,
    '<circle cx="2" cy="2.5" r="0.55" fill="%23000"/><circle cx="5.5" cy="1.5" r="0.45" fill="%23000"/>' +
    '<circle cx="9" cy="3" r="0.5" fill="%23000"/><circle cx="13" cy="2" r="0.4" fill="%23000"/>' +
    '<circle cx="1.5" cy="7" r="0.5" fill="%23000"/><circle cx="4.5" cy="8.5" r="0.4" fill="%23000"/>' +
    '<circle cx="8" cy="6.5" r="0.55" fill="%23000"/><circle cx="11.5" cy="8" r="0.45" fill="%23000"/>' +
    '<circle cx="14.5" cy="7" r="0.4" fill="%23000"/><circle cx="3" cy="12.5" r="0.5" fill="%23000"/>' +
    '<circle cx="7" cy="13.5" r="0.4" fill="%23000"/><circle cx="10.5" cy="12" r="0.55" fill="%23000"/>' +
    '<circle cx="14" cy="13.5" r="0.4" fill="%23000"/>' +
    '<path d="M0 10c3-1.5 5 1.5 8 0s5-1.5 8 0" stroke="%23000" stroke-width="0.5" fill="none" opacity="0.55"/>'),

  /* Steam curls above, seeds below — a bagel out of the water. */
  "bathing-bagels": tile(24, 24,
    '<path d="M4 3c0.8-2 2.5-2.5 3-1s-0.6 2.2 0 3.5" stroke="%23000" stroke-width="1.1" stroke-linecap="round" fill="none"/>' +
    '<path d="M11 1.5c0.7-1.6 2.2-2 2.6-0.7s-0.5 1.8 0 3" stroke="%23000" stroke-width="1.1" stroke-linecap="round" fill="none"/>' +
    '<path d="M18 3.2c0.8-1.8 2.4-2 2.8-0.8s-0.7 1.7 0 2.9" stroke="%23000" stroke-width="1.1" stroke-linecap="round" fill="none"/>' +
    '<ellipse cx="5" cy="14" rx="1.4" ry="0.7" fill="%23000" transform="rotate(-22 5 14)"/>' +
    '<ellipse cx="10" cy="17" rx="1.2" ry="0.6" fill="%23000" transform="rotate(18 10 17)"/>' +
    '<ellipse cx="15.5" cy="14.5" rx="1.5" ry="0.7" fill="%23000" transform="rotate(-12 15.5 14.5)"/>' +
    '<ellipse cx="20" cy="18.5" rx="1.1" ry="0.55" fill="%23000" transform="rotate(28 20 18.5)"/>' +
    '<ellipse cx="7.5" cy="20.5" rx="1" ry="0.5" fill="%23000" transform="rotate(-8 7.5 20.5)"/>' +
    '<ellipse cx="13.5" cy="21" rx="1.3" ry="0.6" fill="%23000" transform="rotate(10 13.5 21)"/>'),

  /* Milkshake swirls. */
  wandas: tile(24, 24,
    '<path d="M2 12c3.5-7 8.5-7 12 0s8.5 7 12 0" stroke="%23000" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
    '<path d="M1 16.5c4-5 9-4.2 12.5 0.8s8 5 10.5 0" stroke="%23000" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.7"/>' +
    '<path d="M4 6.5c2.5-3.2 6-2.5 8.5 0.8" stroke="%23000" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.55"/>' +
    '<circle cx="18.5" cy="5" r="1.2" fill="%23000"/>' +
    '<circle cx="5.5" cy="19.5" r="1" fill="%23000"/>'),

  /* Fur tufts and cheese holes. */
  muncheese: tile(24, 24,
    '<path d="M3 2l1.2 3.2 0.8-2.4 0.8 2.8 1.2-3.4" stroke="%23000" stroke-width="0.9" fill="none" stroke-linecap="round"/>' +
    '<path d="M11 1.5l0.9 2.8 0.7-2 0.8 3.1 0.9-2.7" stroke="%23000" stroke-width="0.9" fill="none" stroke-linecap="round"/>' +
    '<path d="M18.5 3l1.1 2.6 0.5-1.9 0.8 3 0.8-2.3" stroke="%23000" stroke-width="0.9" fill="none" stroke-linecap="round"/>' +
    '<path d="M4 11.5l0.9 2.4 0.7-1.6 0.5 2.8 0.8-2.3" stroke="%23000" stroke-width="0.85" fill="none" stroke-linecap="round"/>' +
    '<path d="M13.5 10.5l1.1 3 0.7-2.2 0.8 2.7 1.1-3" stroke="%23000" stroke-width="0.85" fill="none" stroke-linecap="round"/>' +
    '<path d="M2.5 18.5l1.1 2.6 0.7-1.9 0.8 3 0.8-2.2" stroke="%23000" stroke-width="0.85" fill="none" stroke-linecap="round"/>' +
    '<path d="M11.5 17.5l0.9 2.7 0.7-1.9 0.8 3 0.9-2.6" stroke="%23000" stroke-width="0.85" fill="none" stroke-linecap="round"/>' +
    '<path d="M19 19l0.9 2.2 0.5-1.5 0.7 2.6 0.8-1.9" stroke="%23000" stroke-width="0.85" fill="none" stroke-linecap="round"/>' +
    '<circle cx="8" cy="8.5" r="2.2" fill="%23000"/>' +
    '<circle cx="17" cy="14.5" r="2.6" fill="%23000"/>' +
    '<circle cx="21" cy="6" r="1.4" fill="%23000"/>'),
};

const SIGNATURE_SCALE = {
  tk: "12px 12px",
  "door-shop": "16px 16px",
  mohave: "16px 16px",
  "bathing-bagels": "24px 24px",
  wandas: "24px 24px",
  muncheese: "24px 24px",
};

function solvePosture(brand) {
  const q = brand.posture;
  if (!q) return { lines: [], note: [] };
  const out = [];
  const put = (name, value) => value && out.push(`    --tk-${name}: ${value};`);

  put("font-display", q.font?.display);
  put("font-sans", q.font?.sans);
  for (const [k, v] of Object.entries(q.size ?? {})) put(`size-${k}`, v);
  for (const [k, v] of Object.entries(q.leading ?? {})) put(`leading-${k}`, v);
  for (const [k, v] of Object.entries(q.tracking ?? {})) put(`tracking-${k}`, v);
  for (const [k, v] of Object.entries(q.weight ?? {})) put(`weight-${k}`, v);
  for (const [k, v] of Object.entries(q.radius ?? {})) put(`radius-${k}`, v);
  put("display-case", q.displayCase);
  put("icon-stroke", q.iconStroke);
  put("texture-mask", q.texture?.mask && `var(--tk-texture-${q.texture.mask})`);
  put("texture-scale", q.texture?.scale);
  put("measure", q.measure?.base);
  put("measure-narrow", q.measure?.narrow);
  put("plate-max", q.plate?.max);
  put("plate-max-portrait", q.plate?.portrait);
  put("plate-min", q.plate?.min);
  put("density", q.density);

  return { lines: out, note: q.note ?? [] };
}

const block = (lines, indent) =>
  lines.length
    ? lines.map((l) => `${indent}${l}`).join("\n")
    : `${indent}(none)`;

const emit = (brand) => {
  const { slug, p, title, note, ladder } = brand;
  const m = MAP[slug];
  const { ramp, lines: nudgeLines } = solveNudges(brand);
  const { lines: rejectedLines } = solveRejected(brand);
  const { lines: postureLines, note: postureNote } = solvePosture(brand);
  const v = (key) => {
    if (!(key in ramp)) throw new Error(`${slug}: slot maps to unknown ramp key "${key}"`);
    return `var(--${p}-${key})`;
  };
  const stated = new Set(Object.keys(brand.ramp));
  /* LIGHTEST FIRST, every pack, without exception.
 
     The table above is authored in the order a brand book presents itself —
     the primary, then its two press states, then the mark, then the greys —
     which is the order a person thinks in and a terrible order to read a
     palette in. Emitted that way, --door-ink (the darkest) sat above
     --door-snow (white) with four blues in between, and a reader scanning the
     block had no way to see that the greys form a ramp at all.
 
     Sorted by OKLab L, the block IS the ramp: light at the top, dark at the
     bottom, and the gaps visible as gaps. Nothing depends on declaration
     order — these are literal hexes and none of them references another — so
     the only thing the sort changes is whether the file can be read.
 
     By OKLab rather than by the sRGB numbers: #F5B800 and #0B5CAD have
     similar sRGB sums and are nowhere near each other in lightness. */
  const ramps = byLightness(Object.entries(ramp), ([, hex]) => hex)
    .map(([k, hex]) =>
      `    --${p}-${k}: ${hex};${stated.has(k) ? "" : " /* solved */"}`,
    )
    .join("\n");

  return `/* ---------------------------------------------------------------------------
   ${title}

${note.map((l) => `   ${l}`).join("\n")}

   Ladder: ${ladder}

   NUDGED VALUES — solved at generation time by tools/nudge-color.mjs, which
   holds the hue exactly and returns the passing colour closest in OKLab.
   Anything tagged "solved" in the ramp below came from here, and the brand's
   stated value is still in the ramp beside it for the slots that have no
   floor to clear (the mark: WCAG 1.4.3 exempts a logotype).

   Note for anyone editing the template that writes this header: CSS comments
   do not nest. Writing the tag with its delimiters in this paragraph closed
   the comment twenty lines early and turned the rest of the file into
   garbage declarations, which postcss-import rejected outright and the
   browser silently recovered from — so the contrast gate reported 812 passes
   against a stylesheet that would not build.

${block(nudgeLines, "     ")}

   NUDGES TRIED AND REJECTED — recomputed every time this file is written, so
   the reason a job went to another colour is a number rather than a memory.
   Under ΔE 0.05 is a rendition of the same colour; over 0.10 is a different
   one and the job gets reassigned.

${block(rejectedLines, "     ")}

   GENERATED by tools/gen-specimen-packs.mjs — edit the table there, not here.
   \`node tools/gen-specimen-packs.mjs --check\` fails if this file has drifted.

   A specimen, not a real brand. The marks and names are original; the point
   of the set is that six unrelated identities fill the same slots and no
   component knows which one it is rendering.
--------------------------------------------------------------------------- */

@layer tokens {
  [data-brand="${slug}"] {
    /* --- pack-private: the brand book, transcribed --------------------- */
${ramps}

    /* --- contract ------------------------------------------------------ */

    /* surface */
    --tk-surface-base: ${v(m.base)};
    --tk-surface-default: ${v(m.default)};
    --tk-surface-raised: ${v(m.raised)};
    --tk-surface-sunken: ${v(m.sunken)};
    --tk-surface-inverse: ${v(m.inverse)};

    /* text */
    --tk-text-primary: ${v(m.primary)};
    --tk-text-secondary: ${v(m.secondary)};
    --tk-text-tertiary: ${v(m.tertiary)};
    --tk-text-inverse: ${v(m.default)};
    --tk-text-disabled: ${v(m.disabled)};

    /* line — line-strong clears 3:1 against every surface above */
    --tk-line-subtle: ${v(m.lineSubtle)};
    --tk-line-default: ${v(m.lineDefault)};
    --tk-line-strong: ${v(m.lineStrong)};

    /* action — action-text clears 4.5:1 against all three fills */
    --tk-action-fill: ${v(m.fill)};
    --tk-action-fill-hover: ${v(m.hover)};
    --tk-action-fill-active: ${v(m.active)};
    --tk-action-text: ${v(m.actionText)};

    --tk-action-quiet-fill: transparent;
    --tk-action-quiet-fill-hover: ${v(m.quietHover)};
    --tk-action-quiet-fill-active: ${v(m.quietActive)};
    --tk-action-quiet-text: ${v(m.quietText)};

    /* action, danger tone — a second axis on the button, not a fourth
       variant: danger-text clears 4.5:1 on all three fills, and
       danger-quiet-text (outline and quiet) clears 4.5:1 on every surface.
       Optional in the contract: a pack without them gets its action
       colours, which is what the grayscale wireframe wants. */
    --tk-action-danger-fill: ${v(m.danger)};
    --tk-action-danger-fill-hover: ${v(m.dangerHover)};
    --tk-action-danger-fill-active: ${v(m.dangerActive)};
    --tk-action-danger-text: ${v(m.dangerText)};
    --tk-action-danger-quiet-text: ${v(m.dangerQuiet)};

    /* focus — clears 3:1 against every surface it can land on */
    --tk-focus-color: ${v(m.focus)};

    /* data ink — a bare graphic against its own track. Usually the action
       fill; separate wherever the action fill only works under a label. */
    --tk-data-ink: ${v(m.data)};

    /* scrim and texture. The alphas are arithmetic and live in the scale;
       the ink is a colour and lives here.

       The wash is BLACK in every pack, and that is not laziness — it is the
       only value the alphas were solved for. At the AA alpha a black wash
       composites to 4.65:1 against white, which clears the 4.5 floor by
       0.15. The brand's own ink does not: Wanda's #1C1917 is a 17:1 ink and
       still lands at 3.78:1 through the same alpha, and Bathing Bagels'
       #5C1A1A at 3.38:1. Both were caught by the contrast gate the moment
       these packs were added to tests/fixture.html, which is the entire
       argument for adding them. A brand-tinted wash spends headroom the
       guarantee does not have. */
    --tk-scrim-ink: ${v("wash")};
    --tk-text-on-scrim: ${v(m.raised)};
    --tk-texture-ink: ${v(m.texture)};

    /* What the masks cut.
 
       Every one of these packs used to paint --tk-texture-ink, and every one
       of them maps that to the RULE grey — so six brands with six palettes
       had six identical grey textures, and the only brand-specific thing
       about a textured surface was which mask it used. Two brand colours at
       low alpha, running across the tile, is the cheapest way to make a
       surface belong to a brand without putting anything legible in it.
 
       Alpha rather than a solid mix, because the mask's own alpha multiplies
       with this and the result composites over whatever is behind — which is
       usually the pack's surface, but is a photograph often enough that
       assuming the surface would be wrong.
 
       The wireframe packs do NOT get this. They stay flat ink: the delivered
       prototype is grayscale, and a gradient is not grey just because both
       of its stops are. */
    --tk-texture-paint: linear-gradient(
      135deg,
      color-mix(in srgb, ${v(m.paint[0])} ${m.paintAlpha?.[0] ?? 55}%, transparent) 0%,
      color-mix(in srgb, ${v(m.paint[1])} ${m.paintAlpha?.[1] ?? 28}%, transparent) 100%
    );

    /* The gradient's two ends — the SAME pair the texture paints, from one
       paint declaration in the table above (no backticks around that word:
       this comment lives inside a JS template literal and a backtick here
       ends the string, which is a different flavour of the same trap as the
       CSS comment that did not nest). A brand's textured surface and
       its gradient surfaces should be the same two colours doing the same job
       at different opacities; two declarations would be two things to keep in
       step, and they would not stay in step.

       Full strength here, unlike the texture paint: a texture is cut by a
       mask that is mostly holes, and a gradient is not. */
    --tk-gradient-from: ${v(m.paint[0])};
    --tk-gradient-to: ${v(m.paint[1])};

    /* The brand's own shape, and the size it was drawn at. Kit-owned masks
       mean the same thing in every pack; this one means whatever this brand
       drew, which is why it is emitted from the table rather than declared in
       05-textures.css. */
    --tk-texture-signature: ${SIGNATURE[slug] ?? "var(--tk-texture-mask)"};
    --tk-texture-signature-scale: ${SIGNATURE_SCALE[slug] ?? "var(--tk-texture-scale)"};

    /* glass — chrome over imagery the pack does not control, so it owns
       both sides of the pair and does not flip with context. */
    --tk-glass-fill: ${v(m.raised)};
    --tk-glass-ink: ${v(m.primary)};
    --tk-glass-line: ${v(m.lineDefault)};

    /* logo — the one place a pack is meant to look like itself, and the one
       place exempt from the contrast floor (WCAG 1.4.3). */
    --tk-logo-ink: ${v(m.logoInk)};
    --tk-logo-mark-ink: ${v(m.logoMark)};
    --tk-logo-word-ink: ${v(m.logoWord)};
    --tk-logo-tagline-ink: ${v(m.logoTagline)};
    --tk-logo-tile: ${v(m.logoTile)};

    /* status — surface is the sunken ground, text is the primary ink, and
       the line is the only slot a brand's own colour gets to touch. */
    --tk-status-info-line: ${v(m.lineStrong)};
    --tk-status-info-surface: ${v(m.sunken)};
    --tk-status-info-text: ${v(m.primary)};

    --tk-status-success-line: ${v(m.lineStrong)};
    --tk-status-success-surface: ${v(m.sunken)};
    --tk-status-success-text: ${v(m.primary)};

    --tk-status-warning-line: ${v(m.lineStrong)};
    --tk-status-warning-surface: ${v(m.sunken)};
    --tk-status-warning-text: ${v(m.primary)};

    --tk-status-danger-line: ${v(m.dangerLine)};
    --tk-status-danger-surface: ${v(m.sunken)};
    --tk-status-danger-text: ${v(m.primary)};

    /* elevation — specimens stay flat, like the wireframe pack. A brand that
       wants shadow says so here and nothing else changes. */
    --tk-shadow-sm: none;
    --tk-shadow-md: none;

    /* motion — pace and curve are brand properties. These restate the kit's
       defaults; a brand that wants to feel quicker changes them here. */
    --tk-motion-ink: var(--tk-duration-fast) var(--tk-ease-standard);
    --tk-motion-surface: var(--tk-duration-fast) var(--tk-ease-standard);
    --tk-motion-line: var(--tk-duration-fast) var(--tk-ease-standard);
    --tk-motion-elevation: var(--tk-duration-base) var(--tk-ease-standard);
    --tk-motion-opacity: var(--tk-duration-base) var(--tk-ease-standard);
    --tk-motion-transform: var(--tk-duration-base) var(--tk-ease-standard);
    --tk-motion-size: var(--tk-duration-base) var(--tk-ease-standard);
    --tk-motion-enter: var(--tk-duration-base) var(--tk-ease-entrance);
    --tk-motion-exit: var(--tk-duration-fast) var(--tk-ease-exit);

    /* --- posture ---------------------------------------------------------
       What this brand owns beyond colour.

${postureNote.length ? postureNote.map((l) => `       ${l}`).join("\n") : "       Nothing. This pack is colour only."}
       ------------------------------------------------------------------ */
${postureLines.length ? postureLines.join("\n") : "    /* (colour only) */"}
  }

  /* --- painting -----------------------------------------------------------
     A pack scoped mid-tree has to paint. Custom properties inherit, but an
     already-computed inherited property does not re-resolve further down: a
     <p> with no colour of its own inherits the value body computed under the
     OUTER pack, so remapping the token underneath it changes nothing and the
     text renders in the wrong ink on the right ground. This rule is what makes
     two packs on one page work.
     ---------------------------------------------------------------------- */
  [data-brand="${slug}"] {
    background-color: ${v(m.default)};
    color: ${v(m.primary)};
  }

  /* --- inverse context ----------------------------------------------------
     Deliberately a COMPLETE slot set. Remapping only the text colour leaves
     quiet buttons, borders and focus rings resolving against the light
     surface — invisible ink on a dark plate, which reads as a missing element
     rather than a contrast bug.

     Painted from the ramp, not from --tk-surface-inverse: this same rule
     remaps that slot, so painting from it would flip straight back.
     ---------------------------------------------------------------------- */
  [data-brand="${slug}"] :where([data-on="inverse"]),
  [data-brand="${slug}"][data-on="inverse"] {
    background-color: ${v(m.inverse)};
    color: ${v(m.raised)};

    --tk-surface-base: ${v(m.inverse)};
    --tk-surface-default: ${v(m.inverse)};
    --tk-surface-raised: ${v(m.inverse)};
    --tk-surface-sunken: ${v(m.inverse)};
    --tk-surface-inverse: ${v(m.raised)};

    --tk-text-primary: ${v(m.raised)};
    --tk-text-secondary: ${v(m.raised)};
    --tk-text-tertiary: ${v(m.raised)};
    --tk-text-inverse: ${v(m.inverse)};
    --tk-text-disabled: color-mix(in srgb, ${v(m.raised)} 62%, transparent);

    --tk-line-subtle: color-mix(in srgb, ${v(m.raised)} 14%, transparent);
    --tk-line-default: color-mix(in srgb, ${v(m.raised)} 22%, transparent);
    --tk-line-strong: ${v(m.raised)};

    --tk-scrim-ink: ${v("wash")};
    --tk-text-on-scrim: ${v(m.raised)};
    --tk-texture-ink: color-mix(in srgb, ${v(m.raised)} 22%, transparent);

    --tk-action-fill: ${v(m.raised)};
    --tk-action-fill-hover: ${v(m.sunken)};
    --tk-action-fill-active: ${v(m.lineDefault)};
    --tk-action-text: ${v(m.inverse)};

    --tk-action-quiet-fill: transparent;
    --tk-action-quiet-fill-hover: color-mix(in srgb, ${v(m.raised)} 14%, transparent);
    --tk-action-quiet-fill-active: color-mix(in srgb, ${v(m.raised)} 22%, transparent);
    --tk-action-quiet-text: ${v(m.raised)};

    /* A brand's danger red has no guarantee on the inverse plate, so danger
       here is the plate's own action colour; the label carries the meaning. */
    --tk-action-danger-fill: var(--tk-action-fill);
    --tk-action-danger-fill-hover: var(--tk-action-fill-hover);
    --tk-action-danger-fill-active: var(--tk-action-fill-active);
    --tk-action-danger-text: var(--tk-action-text);
    --tk-action-danger-quiet-text: var(--tk-action-quiet-text);

    --tk-focus-color: ${v(m.raised)};
    --tk-data-ink: ${v(m.raised)};

    /* On inverse the logo drops to paper. A brand colour that cleared the
       light ground has no guarantee on the dark one, and a logo is the one
       element nobody wants to see half-legible. */
    --tk-logo-ink: ${v(m.raised)};
    --tk-logo-mark-ink: ${v(m.raised)};
    --tk-logo-word-ink: ${v(m.raised)};
    --tk-logo-tagline-ink: color-mix(in srgb, ${v(m.raised)} 78%, transparent);
    --tk-logo-tile: color-mix(in srgb, ${v(m.raised)} 14%, transparent);

    --tk-status-info-line: ${v(m.raised)};
    --tk-status-info-surface: ${v(m.inverse)};
    --tk-status-info-text: ${v(m.raised)};
    --tk-status-success-line: ${v(m.raised)};
    --tk-status-success-surface: ${v(m.inverse)};
    --tk-status-success-text: ${v(m.raised)};
    --tk-status-warning-line: ${v(m.raised)};
    --tk-status-warning-surface: ${v(m.inverse)};
    --tk-status-warning-text: ${v(m.raised)};
    --tk-status-danger-line: ${v(m.raised)};
    --tk-status-danger-surface: ${v(m.inverse)};
    --tk-status-danger-text: ${v(m.raised)};
  }

  /* --- on a scrim ---------------------------------------------------------
     Identical in every pack, and that is the point: the ground under a scrim
     is the same ground everywhere, because the alphas in 03-scale.css were
     solved against a black wash. Borrowing [data-on="inverse"] here would put
     near-black controls on a near-black wash in a dark pack.

     Nothing paints a background — the wash IS the ground — and nothing
     de-emphasises by colour, because a scrim has exactly the headroom the
     alpha bought it and none spare. Hierarchy comes from size and weight.
     ---------------------------------------------------------------------- */
  [data-brand="${slug}"] :where([data-on="scrim"], [data-tk="scrim-content"]) {
    color: #ffffff;

    --tk-text-primary: #ffffff;
    --tk-text-secondary: #ffffff;
    --tk-text-tertiary: #ffffff;
    --tk-text-inverse: ${v(m.inverse)};
    --tk-text-disabled: color-mix(in srgb, #ffffff 70%, transparent);

    --tk-line-subtle: color-mix(in srgb, #ffffff 58%, transparent);
    --tk-line-default: #ffffff;
    --tk-line-strong: #ffffff;

    --tk-action-fill: #ffffff;
    --tk-action-fill-hover: ${v(m.sunken)};
    --tk-action-fill-active: ${v(m.lineDefault)};
    --tk-action-text: ${v(m.inverse)};

    --tk-action-quiet-fill: color-mix(in srgb, var(--tk-scrim-ink) 72%, transparent);
    --tk-action-quiet-fill-hover: color-mix(in srgb, var(--tk-scrim-ink) 88%, transparent);
    --tk-action-quiet-fill-active: color-mix(in srgb, var(--tk-scrim-ink) 94%, transparent);
    --tk-action-quiet-text: #ffffff;

    --tk-action-danger-fill: var(--tk-action-fill);
    --tk-action-danger-fill-hover: var(--tk-action-fill-hover);
    --tk-action-danger-fill-active: var(--tk-action-fill-active);
    --tk-action-danger-text: var(--tk-action-text);
    --tk-action-danger-quiet-text: var(--tk-action-quiet-text);

    --tk-focus-color: #ffffff;

    --tk-logo-ink: #ffffff;
    --tk-logo-mark-ink: #ffffff;
    --tk-logo-word-ink: #ffffff;
    --tk-logo-tagline-ink: color-mix(in srgb, #ffffff 82%, transparent);
    --tk-logo-tile: color-mix(in srgb, #ffffff 16%, transparent);
  }
}
`;
};

/* The same records, for the specimen sheet.

   02 Tokens/01 Ramp/Brands claims that nothing on it is transcribed. That
   claim was false for the nudge figures, which were typed into the story by
   hand from a terminal run — exactly the thing the rest of the page refuses
   to do. They come from here now, so a constraint change moves the pack and
   the page together or moves neither. */
const sidecar = Object.fromEntries(
  BRANDS.map((brand) => [
    brand.slug,
    {
      nudged: solveNudges(brand).records,
      rejected: solveRejected(brand).records,
      /* The pack's private ramp, by NAME, lightest first — the same order the
         pack file emits.
 
         Names, not values. The specimen sheet reads every colour off a live
         element with getComputedStyle, and putting hexes in this file would
         make it the second place each brand's palette is written down, which
         is the one thing that page's own copy says it does not do. A name is
         not a value: it is where to look. */
      prefix: brand.p,
      ramp: byLightness(
        Object.entries(solveNudges(brand).ramp),
        ([, hex]) => hex,
      ).map(([key]) => key),
    },
  ]),
);
const SIDECAR = resolve(ROOT, "src/brand/nudges.json");
const sidecarText = JSON.stringify(sidecar, null, 2) + "\n";

/* Compare as LF. git checks files out CRLF on Windows, and a byte-for-byte
   compare would call every pack stale there. */
const readLF = async (path) =>
  existsSync(path) ? (await readFile(path, "utf8")).replace(/\r\n/g, "\n") : null;

let stale = 0;
{
  const prev = await readLF(SIDECAR);
  if (prev !== sidecarText) {
    if (CHECK) {
      stale += 1;
      console.error("stale  src/brand/nudges.json");
    } else {
      await writeFile(SIDECAR, sidecarText, "utf8");
      console.log(`${prev === null ? "wrote " : "update"} src/brand/nudges.json`);
    }
  }
}

for (const brand of BRANDS) {
  const path = resolve(OUT, `${brand.slug}.css`);
  const next = emit(brand);
  const prev = await readLF(path);
  if (prev === next) continue;
  if (CHECK) {
    stale += 1;
    console.error(`stale  src/css/packs/${brand.slug}.css`);
    continue;
  }
  await writeFile(path, next, "utf8");
  console.log(`${prev === null ? "wrote " : "update"} src/css/packs/${brand.slug}.css`);
}

if (CHECK) {
  if (stale) {
    console.error(`\n${stale} pack(s) out of date — run: node tools/gen-specimen-packs.mjs`);
    process.exit(1);
  }
  console.log(`specimen packs current (${BRANDS.length})`);
} else {
  console.log(`\n${BRANDS.length} specimen packs`);
}
