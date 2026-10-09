/* ---------------------------------------------------------------------------
   Token Ipsum — placeholder prose that is about something.

   Lorem ipsum is deliberately meaningless so that nobody reads it. That works
   for a type specimen and fails for a wireframe, where the filler is standing
   in for a real page and a reviewer is trying to judge whether the layout
   holds. Meaningless text gets skipped; text about nothing gives a reviewer
   nothing to react to, and the thing they were supposed to be reviewing — the
   rhythm, the measure, the wrap — goes unexamined.

   So this filler has a subject, and a neutral one: the ordinary website of
   an ordinary organisation. Services, visits, bookings, accounts, events,
   opening hours, help. It reads like real copy because it is shaped like
   the copy a client's pages actually carry, which means it wraps like it,
   and it says nothing about this kit or any client, so it can sit in any
   engagement's wireframes without explaining itself.

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
  "Find the right service in a few steps",
  "Everything you need to know before your first visit",
  "New opening hours start at the beginning of May",
  "How we use your feedback to improve what we offer",
  "Book, change or cancel an appointment online",
  "A simpler way to manage your account",
  "Meet the team behind this year's programme",
  "What changes for members from the spring onwards",
  "Our guide to getting started, step by step",
  "Answers to the questions we are asked most",
  "Five things to check before you apply",
  "Local projects that made a difference this year",
  "Support is now available in more places than before",
  "Planning ahead makes the whole process faster",
  "We have updated how we look after your information",
] as const;

/** Deck / standfirst length — one long sentence or two short ones. */
const DECKS = [
  "Most requests can be made online in a few minutes. If you would rather talk to someone, our team is available by phone on weekdays and will call you back the same day.",
  "Before you start, gather the documents listed below. Having them to hand means you can finish in one sitting instead of saving your progress and coming back to it later in the week.",
  "We have changed our opening hours to fit around the times people actually visit. Evenings are longer during the week, we now open on Saturday mornings, and the first hour of each day is kept quiet for those who prefer it.",
  "This guide explains what happens after you apply, how long each stage usually takes, and who to contact if something does not go the way you expected or you need to change your details.",
  "Members can now manage bookings, payments and preferences in one place. Your existing details have been carried across, so there is nothing to set up again.",
  "Every year we ask the people who use our services what we should change. Here is what you told us, what we have done about it so far, and what comes next, with dates where we have them.",
  "Our events are free unless stated otherwise. Places are limited, so we recommend booking ahead, and we will send a reminder the day before.",
] as const;

/** Body-copy sentences. Combine for paragraphs. */
const SENTENCES = [
  "You can apply online at any time, and most applications take about ten minutes.",
  "We will send a confirmation email as soon as your request has been received.",
  "If you need to change your appointment, you can do it from your account up to a day before it is due.",
  "Our team is available by phone from nine in the morning until five in the afternoon, Monday to Friday.",
  "Parking is available on site, with spaces reserved near the entrance.",
  "Bring a form of identification and any letters we have sent you about your request.",
  "Most decisions are made within ten working days, and we will let you know straight away if yours is going to take longer than that.",
  "You do not need an account to make a general enquiry, but having one lets you follow its progress and see every message in one place.",
  "Prices are reviewed once a year, and members are told about any change at least a month before it takes effect, by email and by post.",
  "The building is step-free throughout, with lifts to every floor.",
  "We publish a summary of the feedback we receive every quarter, along with what we changed as a result of it.",
  "Children under twelve are welcome when they are accompanied by an adult, and there is a quiet room on the ground floor.",
  "If something has gone wrong, tell us and we will do our best to put it right as quickly as we can, and explain what happened.",
  "Information about upcoming events is updated every Monday, and you can sign up to hear about new dates as soon as they are announced.",
  "You can choose how we contact you, and change your mind whenever you like.",
  "Some services are only available to members, and these are marked clearly on each page where they appear.",
  "Large print, audio and translated versions of this information are available on request.",
  "We keep your details only for as long as we need them.",
  "Our volunteers give their time freely, and we are always glad to hear from people who would like to join them, whatever experience they have.",
  "Opening times can change on public holidays, so check this page before you travel.",
] as const;

/** Short labels — nav items, chips, filters, tile titles. */
const LABELS = [
  "Services", "Events", "Guides", "About", "Contact", "News",
  "Visit", "Membership", "Support", "Account", "Bookings", "Locations",
  "Opening hours", "Volunteering", "Careers", "Policies", "Help", "Resources",
] as const;

/** Slightly longer labels — card titles, list headings. */
const TITLES = [
  "Getting started with us",
  "Planning your first visit",
  "Managing your account",
  "Booking an appointment",
  "Opening hours and holidays",
  "Ways to get involved locally",
  "Help with the cost of membership",
  "Accessibility information",
  "Upcoming events this season",
  "Questions people often ask",
  "Contact the support team",
  "Latest updates and news",
] as const;

/** Eyebrow / kicker words. */
const EYEBROWS = [
  "Guide", "News", "Event", "Service", "Update",
  "Feature", "Case study", "How to", "Notice", "Resource",
] as const;

/** Person-shaped names for directory placeholders: plainly invented, so a
    placeholder card can never be mistaken for a real person. */
const NAMES = [
  "Alex Example", "Jordan Sample", "Sam Placeholder", "Taylor Draft",
  "Robin Standin", "Casey Template", "Morgan Mockup", "Jamie Example",
  "Riley Sample", "Drew Placeholder", "Charlie Draft", "Avery Standin",
] as const;

const ROLES = [
  "Director", "Operations manager", "Programme lead",
  "Customer support", "Communications", "Finance",
  "Volunteer coordinator", "Research", "Partnerships",
] as const;

const PLACES = [
  "Head office", "North branch", "City centre", "Online", "Riverside", "Community hall",
] as const;

/** Figures for a proof strip: deliberately round and obviously invented. */
const STAT_VALUES = ["90%", "3x", "24/7", "1,200", "15 min", "4.8/5", "40", "12"];
const STAT_LABELS = [
  "Of requests answered in a day",
  "More bookings made online",
  "Help available online",
  "Members across the region",
  "Average wait on the phone",
  "Average visitor rating",
  "Volunteers this year",
  "Locations",
];

/* ---------------------------------------------------------------------------
   Voices.

   A voice is every pool the functions below draw from. Each voice has the
   same pools at the same sizes, so a seed lands on the same slot whichever is
   in force: switching voice changes the words, never the shape of a page.

   The neutral voice above is the default. The kit's Storybook switches to
   the kit's own (token-ipsum-kit.ts) for its pages and the stories its Figma
   components are checked against; nothing else imports that file.
--------------------------------------------------------------------------- */

export interface IpsumVoice {
  headlines: readonly string[];
  decks: readonly string[];
  sentences: readonly string[];
  labels: readonly string[];
  titles: readonly string[];
  eyebrows: readonly string[];
  names: readonly string[];
  roles: readonly string[];
  places: readonly string[];
  statValues: readonly string[];
  statLabels: readonly string[];
}

export const NEUTRAL_VOICE: IpsumVoice = {
  headlines: HEADLINES,
  decks: DECKS,
  sentences: SENTENCES,
  labels: LABELS,
  titles: TITLES,
  eyebrows: EYEBROWS,
  names: NAMES,
  roles: ROLES,
  places: PLACES,
  statValues: STAT_VALUES,
  statLabels: STAT_LABELS,
};

let voice: IpsumVoice = NEUTRAL_VOICE;

/** Use this voice for every call from now on. Set it once, before anything renders. */
export function setIpsumVoice(next: IpsumVoice): void {
  voice = next;
}

/* ---------------------------------------------------------------------------
   The API.

   Every function takes a seed. Pass something stable and descriptive — the
   component name plus the slot — and the same words come back forever.
--------------------------------------------------------------------------- */

/** One headline. Six to eleven words. */
export function ipsumHeadline(seed = "headline"): string {
  return one(voice.headlines, seed);
}

/** One deck / standfirst. One long sentence or two short ones. */
export function ipsumDeck(seed = "deck"): string {
  return one(voice.decks, seed);
}

/** A card title — shorter than a headline, longer than a label. */
export function ipsumTitle(seed = "title"): string {
  return one(voice.titles, seed);
}

/** A single short label: nav item, chip, filter, tile. */
export function ipsumLabel(seed = "label"): string {
  return one(voice.labels, seed);
}

/** An eyebrow / kicker. */
export function ipsumEyebrow(seed = "eyebrow"): string {
  return one(voice.eyebrows, seed);
}

/** `count` distinct labels. */
export function ipsumLabels(count: number, seed = "labels"): string[] {
  return pick(voice.labels, count, seed);
}

/** `count` distinct titles. */
export function ipsumTitles(count: number, seed = "titles"): string[] {
  return pick(voice.titles, count, seed);
}

/** A paragraph of `sentences` sentences. Two is a card; four is an article. */
export function ipsumBody(sentences = 2, seed = "body"): string {
  return pick(voice.sentences, sentences, seed).join(" ");
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
  return pick(voice.sentences, count, seed);
}

/**
 * `count` label-and-body pairs, for segment lists and definition grids.
 */
export function ipsumPairs(
  count = 4,
  seed = "pairs",
): { label: string; body: string }[] {
  const labels = pick(voice.titles, count, `${seed}-l`);
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
  const idx = pick(
    voice.statValues.map((_, i) => i),
    count,
    seed,
  );
  return idx.map((i) => ({ value: voice.statValues[i], label: voice.statLabels[i] }));
}

/** Invented people for a directory. Not real, and not meant to look real. */
export function ipsumPeople(
  count = 4,
  seed = "people",
): { name: string; role: string; place: string }[] {
  const names = pick(voice.names, count, `${seed}-n`);
  const next = rng(`${seed}-r`);
  return names.map((name) => ({
    name,
    role: voice.roles[Math.floor(next() * voice.roles.length)],
    place: voice.places[Math.floor(next() * voice.places.length)],
  }));
}

/** A date-and-place line for an event or promo. */
export function ipsumWhen(seed = "when"): string {
  const next = rng(seed);
  const months = ["March", "April", "May", "June", "September", "October"];
  const d = 1 + Math.floor(next() * 27);
  const m = months[Math.floor(next() * months.length)];
  return `${d}–${d + 1} ${m} · ${one(voice.places, `${seed}-p`)}`;
}
