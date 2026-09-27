import type { BrandContent } from "./types";

/**
 * Door Shop — big-box retail.
 *
 * Loud, short, numeric. The pack already makes this brand shout: a 900 display
 * face at nearly twice the kit's default size, tracked in until the letters
 * touch, density 0.85 so more fits above the fold, every corner square. Copy
 * written in the kit's usual measured voice under that typography reads as a
 * design system wearing a costume.
 *
 * So the sentences are short enough to survive being set at 5rem, the claims
 * are prices and counts rather than qualities, and the imperative turns up in
 * roughly every third line. Retail sells by volume and its pages say so.
 */
export const DOOR_SHOP: BrandContent = {
  slug: "door-shop",
  label: "Door Shop",

  nav: [
    { label: "Shop", route: "services" },
    { label: "Deals", route: "case-studies" },
    { label: "Install", route: "service-detail" },
    { label: "Stores", route: "team" },
    { label: "Advice", route: "insights" },
    { label: "Events", route: "events" },
  ],

  spine: {
    engagement: "Everyday low prices",
    client: "428 stores and a truck that turns up",
    outcome: "fitted this week",
  },

  pages: {
    home: {
      hero: {
        label: "This week",
        slides: [
          {
            eyebrow: "Clearance",
            title: "Every door. Fitted.",
            lede: "Measured Tuesday, hung Thursday. No deposit, no callback fee, no second visit.",
            cta: "Book a fitter",
            seed: 1,
            category: "storefront",
          },
          {
            eyebrow: "New in",
            title: "Save more. Door more.",
            lede: "Eleven hundred doors in stock across the range. If it is on the shelf it is on the van.",
            cta: "Shop the range",
            seed: 3,
            category: "aisle",
          },
          {
            eyebrow: "Trade",
            title: "Open at six.",
            lede: "Trade counter before the site does. Bulk pricing from ten units, no account needed.",
            cta: "Trade pricing",
            seed: 5,
            category: "loading bay",
          },
        ],
      },

      proof: {
        heading: "The numbers, not the adjectives",
        deck: "Published monthly. If a figure moves the wrong way it still goes up here.",
        stats: [
          { value: "428", label: "stores open seven days" },
          { value: "48hr", label: "measure to fitted" },
          { value: "£0", label: "callback fee, ever" },
        ],
      },

      segments: {
        heading: "Who we open for",
        deck: "Four counters, one warehouse. The queue you join decides the price you pay.",
        reachLabel: "Where the vans go",
        audiences: [
          { label: "Trade", body: "Account or cash. Bulk from ten units, loaded before seven." },
          { label: "Self-fit", body: "You measure, we cut. Bring the numbers or bring the old door." },
          { label: "Fitted", body: "We measure, we hang, we take the old one away." },
          { label: "Landlord", body: "Fire doors, certified, with the paperwork that gets signed off." },
          { label: "Returns", body: "Sixty days, receipt or not, no conversation about it." },
        ],
        reach: [
          "Next-day to 94% of postcodes",
          "Saturday delivery at no extra",
          "Free collection at any store",
          "Two-man lift as standard over 40kg",
        ],
      },

      features: {
        heading: "Eleven hundred doors",
        deck: "Internal, external, fire-rated, glazed. One aisle, one price list.",
        items: [
          "Internal oak",
          "External composite",
          "Fire-rated FD30",
          "Glazed panel",
          "Bifold",
          "Garage up-and-over",
        ],
        categories: ["oak door", "composite door", "fire door", "glazed door", "bifold", "garage door"],
      },

      articles: {
        heading: "Advice that saves a second trip",
        deck: "Written by fitters. Two minutes each.",
        kinds: ["How to", "Buying", "Trade"],
        cards: [
          "Measure a door frame in ninety seconds",
          "Fire door regulations for rented property",
          "Which hinge for a 40kg door",
          "Trim a door without ruining the veneer",
          "Composite versus uPVC in a coastal wind",
          "What a fitter needs before they arrive",
        ],
        categories: ["tape measure", "fire door", "hinge", "workbench", "coastal house", "van"],
      },

      event: {
        eyebrow: "Trade morning",
        heading: "Breakfast at the counter",
        body: "First Saturday of the month. Bacon on, reps in, twenty per cent off the whole fitting range until eleven.",
        meta: "First Saturday · 06:00–11:00 · every store",
        ctaLabel: "Add to calendar",
        seed: 2,
        category: "trade counter",
      },
    },

    services: {
      title: "Shop",
      deck: "Eleven hundred doors, four ways to get one. Pick the one that matches how much of it you want to do yourself.",
      intro:
        "Everything in the range is in stock or next day. Nothing here is a special order, because a special order is a second trip and a second trip is the thing we sell against.",
      modalBody:
        "Tell us the opening and what is going in it. If you have the numbers we will price it now; if you do not, a fitter measures free and the measure comes off the fitting.",
      feature: {
        eyebrow: "Fitting",
        title: "Measured Tuesday, hung Thursday",
        body: "One visit to measure, one to fit, and the old door goes on the van. No deposit and no callback fee — if it is wrong we come back and that is not a charge, it is the job.",
      },
      tileHeading: "Departments",
      faq: [
        {
          q: "Do I need to be in for the measure?",
          a: "Someone over eighteen, yes. It takes about fifteen minutes and the fitter will want to see both sides of the opening.",
        },
        {
          q: "What happens to the old door?",
          a: "It goes on the van. No charge, no separate booking, and we take the frame too if we replaced it.",
        },
        {
          q: "Can I fit a fire door myself?",
          a: "Legally in your own home, yes. In anything rented or shared it has to be certified on installation, and that is a fitting job with paperwork.",
        },
      ],
    },

    about: {
      title: "About Door Shop",
      deck: "Four hundred and twenty-eight stores. One price list. Open at six for trade.",
      proof: {
        heading: "Since 1974",
        deck: "Started as one yard selling seconds. The seconds bit stopped; the price did not.",
        stats: [
          { value: "1974", label: "first yard opened" },
          { value: "428", label: "stores today" },
          { value: "6,100", label: "people on the counter" },
        ],
      },
      segments: {
        heading: "How we are set up",
        deck: "Warehouse, counter, van. There is no fourth thing and that is on purpose.",
        showMap: true,
        reachLabel: "Distribution",
        audiences: [
          { label: "Warehouse", body: "Eleven regional sheds. Nothing is more than four hours from a store." },
          { label: "Counter", body: "Every store carries the full range. Not a showroom — stock." },
          { label: "Fitting", body: "Employed fitters, not subcontracted. Same people every time in a region." },
          { label: "Trade", body: "Accounts settled monthly, pricing published, no negotiation." },
          { label: "Returns", body: "Sixty days. The policy is one sentence long deliberately." },
        ],
        reach: [
          "Eleven distribution centres",
          "428 stores in three countries",
          "Own fleet, own drivers",
          "94% of postcodes next day",
        ],
      },
      promo: {
        title: "We are not a showroom",
        body: "A showroom has one of each and orders the rest. We have eleven hundred of them in a shed four hours away, which is why the fitter can come on Thursday.",
        modalBody:
          "Store managers, regional fitters and the trade desk are all listed by region. If you need a specific store's counter, it is a direct line rather than a switchboard.",
      },
    },
  },
};
