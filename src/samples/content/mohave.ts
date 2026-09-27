import type { BrandContent } from "./types";

/**
 * Mohave — desert commerce and logistics.
 *
 * The opposite pole from Door Shop, and chosen as the second pack for exactly
 * that reason: if the same components carry both, they carry anything in
 * between. Where Door Shop is loud, short and numeric, this is quiet, long
 * and geographic. The pack gives it a 300px mist texture, hairline icons at
 * 1.5 and generous density, so the copy is written to be read slowly — longer
 * sentences, fewer of them, and almost no imperatives.
 *
 * The claims are distances and durations rather than prices. A brand whose
 * product is "it arrives" measures itself in time and miles.
 */
export const MOHAVE: BrandContent = {
  slug: "mohave",
  label: "Mohave",

  nav: [
    { label: "Network", route: "services" },
    { label: "Lanes", route: "case-studies" },
    { label: "Terminals", route: "team" },
    { label: "Tracking", route: "service-detail" },
    { label: "Field notes", route: "insights" },
    { label: "Briefings", route: "events" },
  ],

  spine: {
    engagement: "Overland freight",
    client: "the corridor between two coasts",
    outcome: "on the dock before the shift starts",
  },

  pages: {
    home: {
      hero: {
        label: "The corridor",
        slides: [
          {
            eyebrow: "Overland",
            title: "Nine hundred miles of nothing in particular",
            lede: "Which is the point. The corridor has no ports to queue at, no bridges to close and no weather that stops a truck for more than an afternoon.",
            cta: "See the lanes",
            seed: 2,
            category: "dunes at dawn",
          },
          {
            eyebrow: "Terminals",
            title: "Eleven yards, one dispatch",
            lede: "Every yard runs off the same board. A load that changes hands at three in the morning does not change systems with it.",
            cta: "Find a terminal",
            seed: 4,
            category: "desert terminal",
          },
          {
            eyebrow: "Tracking",
            title: "You will know before we do",
            lede: "Position every four minutes, exceptions the moment they happen, and a phone number that reaches the dispatcher rather than a queue.",
            cta: "Track a load",
            seed: 6,
            category: "highway at night",
          },
        ],
      },

      proof: {
        heading: "Measured in miles and hours",
        deck: "Rolling twelve months, published whether or not it flatters us.",
        stats: [
          { value: "96.4%", label: "delivered inside the window" },
          { value: "4 min", label: "between position updates" },
          { value: "11", label: "terminals on the corridor" },
        ],
      },

      segments: {
        heading: "What moves out here",
        deck: "Five kinds of freight, one road. The differences are in the paperwork and the temperature.",
        reachLabel: "The corridor",
        audiences: [
          {
            label: "Dry van",
            body: "The default. Palletised, sealed at origin, opened at destination, and nothing in between.",
          },
          {
            label: "Temperature",
            body: "Reefer units with a logger per trailer. The chart goes to the consignee whether or not they ask.",
          },
          {
            label: "Oversize",
            body: "Permitted loads across three states. The permits are ours to chase, not yours.",
          },
          {
            label: "Expedited",
            body: "Team drivers, no overnight stop. Used sparingly, because it is expensive and we will say so.",
          },
          {
            label: "Drayage",
            body: "Port to yard and yard to rail. Short legs, tight windows, the least forgiving work we do.",
          },
        ],
        reach: [
          "Nine hundred miles, coast to interior",
          "Eleven terminals, none more than ninety minutes apart",
          "Three state permitting offices on account",
          "Overnight relay at the midpoint yard",
        ],
      },

      features: {
        heading: "The corridor, in eleven pieces",
        deck: "Each terminal is a yard, a dock and a dispatcher who has worked that stretch for years.",
        items: [
          "Coast yard",
          "Pass terminal",
          "Basin relay",
          "Midpoint crossdock",
          "Rail interchange",
          "Interior yard",
        ],
        categories: [
          "coastal yard",
          "mountain pass",
          "desert basin",
          "crossdock",
          "rail siding",
          "interior yard",
        ],
      },

      articles: {
        heading: "Field notes",
        deck: "Written from the yards. Longer than they need to be, on purpose.",
        kinds: ["Route", "Equipment", "Weather"],
        cards: [
          "Why the pass closes for wind and not for snow",
          "Reading a reefer chart when the consignee disputes it",
          "The four hours that decide a coast-to-interior run",
          "What a permit office actually needs from you",
          "Relay versus team driving on a nine-hundred-mile lane",
          "Summer surface temperatures and tyre policy",
        ],
        categories: [
          "mountain pass",
          "reefer trailer",
          "highway at night",
          "permit office",
          "truck cab",
          "hot asphalt",
        ],
      },

      event: {
        eyebrow: "Quarterly briefing",
        heading: "The corridor in the next ninety days",
        body: "Lane capacity, permit changes across the three states, and what the summer surface temperatures do to schedules. An hour, at the midpoint yard, with the dispatchers who run it.",
        meta: "Quarterly · 10:00 · midpoint yard and online",
        ctaLabel: "Reserve a place",
        seed: 5,
        category: "briefing room",
      },
    },

    services: {
      title: "Network",
      deck: "Eleven terminals on one road, running off one dispatch board. The network is the product; the trucks are how it is delivered.",
      intro:
        "Every lane below is scheduled rather than brokered. That distinction matters more than anything else on this page: a scheduled lane has a truck assigned to it before you book, and a brokered one has a phone call that has not happened yet.",
      modalBody:
        "Tell us the origin, the destination and the window. If it is on the corridor we will quote against the schedule; if it is not, we will say so rather than broker it out and mark it up.",
      feature: {
        eyebrow: "Dispatch",
        title: "One board, eleven yards",
        body: "A load that changes hands at three in the morning does not change systems with it. The dispatcher at the midpoint sees what the coast dispatcher saw, including the notes, which is why an exception gets a phone call instead of an email the next day.",
      },
      tileHeading: "Lanes",
      faq: [
        {
          q: "Do you broker anything?",
          a: "No. If a load is off the corridor we will tell you who does it well, and we do not take a margin for the introduction.",
        },
        {
          q: "How current is the tracking?",
          a: "Position every four minutes while moving, and an exception the moment the driver logs one. Not once an hour, and not on request.",
        },
        {
          q: "Who chases the permits?",
          a: "We do, across all three states. It is on our account and in our schedule, and a delayed permit is our delay rather than yours.",
        },
      ],
    },

    about: {
      title: "About Mohave",
      deck: "One road, learned properly, for twenty-two years.",
      proof: {
        heading: "Since 2004",
        deck: "One truck and one lane to start with. The lane has not changed.",
        stats: [
          { value: "2004", label: "first lane run" },
          { value: "22 yrs", label: "on the same corridor" },
          { value: "340", label: "drivers, all employed" },
        ],
      },
      segments: {
        heading: "How the network is held together",
        deck: "Five things, and none of them is software.",
        showMap: true,
        reachLabel: "Coverage",
        audiences: [
          {
            label: "Dispatch",
            body: "One board across eleven yards. A load never changes system when it changes hands.",
          },
          {
            label: "Drivers",
            body: "Employed, not contracted. The same people run the same stretch for years and it shows in the exception rate.",
          },
          {
            label: "Terminals",
            body: "Owned yards, not rented dock space. Ninety minutes apart the whole way.",
          },
          {
            label: "Permitting",
            body: "On account in three states, chased by us, scheduled as part of the lane.",
          },
          {
            label: "Equipment",
            body: "Owned fleet with loggers per reefer trailer. Nothing subcontracted.",
          },
        ],
        reach: [
          "Nine hundred miles of corridor",
          "Eleven owned terminals",
          "340 employed drivers",
          "Three states permitted",
        ],
      },
      promo: {
        title: "We only know one road",
        body: "There are carriers who will quote you anywhere. We will quote you nine hundred miles, and the reason the window holds is that everyone involved has driven it several hundred times.",
        modalBody:
          "Terminal managers and lane dispatchers are listed by yard. Each is a direct line — the person who answers is the one looking at the board.",
      },
    },
  },
};
