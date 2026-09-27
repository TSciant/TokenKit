/* ---------------------------------------------------------------------------
   Token Ipsum — placeholder prose that is about something.

   Lorem ipsum is deliberately meaningless so that nobody reads it. That works
   for a type specimen and fails for a wireframe, where the filler is standing
   in for a real page and a reviewer is trying to judge whether the layout
   holds. Meaningless text gets skipped; text about nothing gives a reviewer
   nothing to react to, and the thing they were supposed to be reviewing — the
   rhythm, the measure, the wrap — goes unexamined.

   So this filler has a subject: the kit's own argument. Tokens, container
   queries, cascade layers, concentric radii, density as a multiplier. It
   reads like real copy because it is real copy, which means it wraps like
   real copy, and anyone who does stop to read it learns why the thing they
   are looking at is built the way it is.

   Two properties that matter more than the prose:

   DETERMINISTIC. Every call is seeded. The same slot produces the same words
   on every reload, which is what makes two screenshots comparable and what
   keeps the contrast, type and radius gates from measuring a different
   sentence each run.

   LENGTH-HONEST. A headline is headline-length, a deck is deck-length, a card
   body is card-body-length. Filler that is uniformly medium hides exactly the
   failures a wireframe exists to find: the two-line heading that becomes
   four, the card that outgrows its neighbours.

   Swap it for the client's words as they arrive. Nothing here is load-bearing
   — that is the point of filler — but until those words exist this is better
   than grey rectangles and much better than lorem ipsum.
--------------------------------------------------------------------------- */

/** Deterministic 32-bit hash. Same string in, same number out, every run. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A small deterministic PRNG, seeded by string. */
function rng(seed: string) {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

/** Pick `count` items from `pool`, without repeats, deterministically. */
function pick<T>(pool: readonly T[], count: number, seed: string): T[] {
  const next = rng(seed);
  const rest = [...pool];
  const out: T[] = [];
  const n = Math.min(count, rest.length);
  for (let i = 0; i < n; i += 1) {
    out.push(rest.splice(Math.floor(next() * rest.length), 1)[0]);
  }
  return out;
}

function one<T>(pool: readonly T[], seed: string): T {
  return pool[Math.floor(rng(seed)() * pool.length)];
}

/* ---------------------------------------------------------------------------
   The vocabulary.
--------------------------------------------------------------------------- */

/** Short, headline-shaped. Six to eleven words. */
const HEADLINES = [
  "A token is a decision you only make once",
  "The browser already knows how wide the box is",
  "Container queries ask the parent, not the page",
  "Breakpoints describe a device nobody is holding",
  "One contract, two packs, no exceptions",
  "Density is a multiplier, not a redesign",
  "Inner radius equals outer radius minus the gap",
  "Layers decide who wins before specificity is consulted",
  "A component that knows a hex value cannot be rethemed",
  "Measure the page, do not describe it",
  "Every scale step is a published decision",
  "The cascade is an API, not an accident",
  "Composition beats configuration at every size",
  "Intrinsic sizing is the layout doing its own arithmetic",
  "A wireframe should answer revisions, not generate them",
] as const;

/** Deck / standfirst length — one long sentence or two short ones. */
const DECKS = [
  "A token names a decision so the decision stops being retyped. Change the name's value and everything that read it changes with it, which is the only kind of consistency that survives a deadline.",
  "Container queries let a component size itself from the space it was handed rather than from the width of the window. The same card works in a sidebar, a three-up grid and a full-bleed row without knowing which one it is in.",
  "Breakpoints encode a guess about hardware. Containers encode a fact about layout, and facts age better than guesses — a component built against its own box keeps working on a screen that did not exist when it was written.",
  "Cascade layers settle precedence before specificity is ever consulted, so a utility can override a component without a selector arms race and a brand pack can override both without touching either.",
  "Density is one multiplier applied to a private spacing ramp. A comfortable page and a compact page are the same markup, the same components and the same tokens, resolving differently.",
  "Two rounded boxes whose arcs do not share a centre look approximate no matter how careful the rest of the page is. Inner radius is outer radius less the gap, and the eye catches the difference long before anyone can name it.",
  "Everything here is drawn from a grayscale contract on purpose. Colour arrives as a pack, late, and the layout has already been proved without it.",
] as const;

/** Body-copy sentences. Combine for paragraphs. */
const SENTENCES = [
  "A token is a named decision, and naming it is what stops it being made again.",
  "The value lives in one place; everything downstream reads it rather than repeats it.",
  "Container queries resolve against the element's own box, so a component can be honest about the space it was actually given.",
  "A media query asks how wide the window is, which is rarely the question the component needs answered.",
  "The same card in a sidebar and in a four-up grid is the same component, resolving twice.",
  "Cascade layers put the precedence argument in one line at the top of the file instead of in every selector.",
  "An unlayered rule beats every layered rule regardless of specificity, which is either a useful escape hatch or a silent bug depending on whether it was deliberate.",
  "Custom properties are substituted at computed-value time and inherited as values, so a derivation has to be restated wherever its input can change.",
  "Density multiplies a private spacing ramp rather than being applied at each call site, which is what lets a nested region actually nest.",
  "Pointer targets have a floor that density is not allowed to argue with.",
  "Intrinsic sizing lets the content do the arithmetic, and the content is the only party that knows how long it is.",
  "Type scales with the box it sits in, because a heading that is right at one width is wrong at another.",
  "Concentric corners are not a preference; there is exactly one inner radius that shares a centre with a given outer one.",
  "Contrast is a property of a pair in a context, so it is checked in context rather than asserted from a palette.",
  "A grayscale wireframe proves the structure before anyone can be distracted by the colour.",
  "The brand arrives as a pack of values, late, and nothing in the component layer has to be rewritten to receive it.",
  "Motion reads its pace from the same tokens as everything else, so the whole interface moves at one speed.",
  "Reduced motion is a preference the system honours rather than an option it offers.",
  "Every claim the system makes about itself is checked by something that runs, because a claim nobody measures is a claim that quietly stops being true.",
  "What renders in the browser is the artifact; everything before it was a description of the artifact.",
] as const;

/** Short labels — nav items, chips, filters, tile titles. */
const LABELS = [
  "Tokens", "Contract", "Packs", "Scales", "Density", "Layers",
  "Shells", "Containers", "Measure", "Contrast", "Motion", "Corners",
  "Primitives", "Patterns", "Composition", "Surfaces", "Typography", "Texture",
] as const;

/** Slightly longer labels — card titles, list headings. */
const TITLES = [
  "Naming the decision once",
  "Asking the box, not the window",
  "Precedence before specificity",
  "One ramp, one multiplier",
  "Arcs that share a centre",
  "Proving it in context",
  "Colour arrives last",
  "The measure sets the column",
  "Shells within shells",
  "Everything is a published step",
  "Pace from the same tokens",
  "Structure before surface",
] as const;

/** Eyebrow / kicker words. */
const EYEBROWS = [
  "Foundations", "Contract", "Method", "Reference", "Principle",
  "Pattern", "Doctrine", "Rationale", "Specimen", "Note",
] as const;

/** Person-shaped names for directory placeholders — invented, not real. */
const NAMES = [
  "Avery Cascade", "Rowan Gutter", "Sasha Leading", "Micah Baseline",
  "Noor Tracking", "Quinn Kerning", "Sky Measure", "Ellis Ramp",
  "Reese Container", "Harper Token", "Frankie Layer", "Jules Viewport",
] as const;

const ROLES = [
  "Systems lead", "Principal, layout", "Type and measure",
  "Contrast and colour", "Motion", "Accessibility",
  "Tokens and packs", "Composition", "Documentation",
] as const;

const PLACES = [
  "Remote", "Studio", "Atelier", "Workshop", "Annex", "Loft",
] as const;

/* ---------------------------------------------------------------------------
   The API.

   Every function takes a seed. Pass something stable and descriptive — the
   component name plus the slot — and the same words come back forever.
--------------------------------------------------------------------------- */

/** One headline. Six to eleven words. */
export function ipsumHeadline(seed = "headline"): string {
  return one(HEADLINES, seed);
}

/** One deck / standfirst. One long sentence or two short ones. */
export function ipsumDeck(seed = "deck"): string {
  return one(DECKS, seed);
}

/** A card title — shorter than a headline, longer than a label. */
export function ipsumTitle(seed = "title"): string {
  return one(TITLES, seed);
}

/** A single short label: nav item, chip, filter, tile. */
export function ipsumLabel(seed = "label"): string {
  return one(LABELS, seed);
}

/** An eyebrow / kicker. */
export function ipsumEyebrow(seed = "eyebrow"): string {
  return one(EYEBROWS, seed);
}

/** `count` distinct labels. */
export function ipsumLabels(count: number, seed = "labels"): string[] {
  return pick(LABELS, count, seed);
}

/** `count` distinct titles. */
export function ipsumTitles(count: number, seed = "titles"): string[] {
  return pick(TITLES, count, seed);
}

/** A paragraph of `sentences` sentences. Two is a card; four is an article. */
export function ipsumBody(sentences = 2, seed = "body"): string {
  return pick(SENTENCES, sentences, seed).join(" ");
}

/** `count` paragraphs, each of two to four sentences. */
export function ipsumParagraphs(count = 3, seed = "paragraphs"): string[] {
  const next = rng(seed);
  return Array.from({ length: count }, (_, i) =>
    ipsumBody(2 + Math.floor(next() * 3), `${seed}-${i}`),
  );
}

/** `count` list items — one sentence each. */
export function ipsumList(count = 4, seed = "list"): string[] {
  return pick(SENTENCES, count, seed);
}

/**
 * `count` label-and-body pairs, for segment lists and definition grids.
 */
export function ipsumPairs(
  count = 4,
  seed = "pairs",
): { label: string; body: string }[] {
  const labels = pick(TITLES, count, `${seed}-l`);
  return labels.map((label, i) => ({
    label,
    body: ipsumBody(1, `${seed}-b-${i}`),
  }));
}

/**
 * Figures for a proof strip. Deliberately round and obviously invented —
 * a placeholder statistic that looks precise is a placeholder somebody will
 * eventually quote.
 */
export function ipsumStats(
  count = 3,
  seed = "stats",
): { value: string; label: string }[] {
  const values = ["100%", "3x", "24px", "1.25", "0ms", "4.5:1", "7", "12"];
  const labels = [
    "Of decisions named once",
    "Contexts, one component",
    "Minimum pointer target",
    "Comfortable density",
    "Layout shift budget",
    "Normal-text contrast floor",
    "Layers in the cascade",
    "Steps in the space ramp",
  ];
  const idx = pick(
    values.map((_, i) => i),
    count,
    seed,
  );
  return idx.map((i) => ({ value: values[i], label: labels[i] }));
}

/** Invented people for a directory. Not real, and not meant to look real. */
export function ipsumPeople(
  count = 4,
  seed = "people",
): { name: string; role: string; place: string }[] {
  const names = pick(NAMES, count, `${seed}-n`);
  const next = rng(`${seed}-r`);
  return names.map((name) => ({
    name,
    role: ROLES[Math.floor(next() * ROLES.length)],
    place: PLACES[Math.floor(next() * PLACES.length)],
  }));
}

/** A date-and-place line for an event or promo. */
export function ipsumWhen(seed = "when"): string {
  const next = rng(seed);
  const months = ["March", "April", "May", "June", "September", "October"];
  const d = 1 + Math.floor(next() * 27);
  const m = months[Math.floor(next() * months.length)];
  return `${d}–${d + 1} ${m} · ${one(PLACES, `${seed}-p`)}`;
}
