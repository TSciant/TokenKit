import type { BrandContent } from "./types";

/**
 * Muncheese — roadside travel stop.
 *
 * The fifth voice, and the one that had to be different from Wanda's without
 * being the opposite of it. Both are food on a road. A diner is a
 * destination — one room, one griddle, sixty-five years on a corner. A travel
 * stop is emphatically not: nobody plans to be here, everybody is going
 * somewhere else, and the entire proposition is that stopping costs you as
 * little time as possible.
 *
 * So the copy is written to be read at speed and from a car park. Second
 * person throughout, because the subject is the person passing through rather
 * than the business. The numbers are minutes and exits rather than years.
 */
export const MUNCHEESE: BrandContent = {
  slug: "muncheese",
  label: "Muncheese",

  nav: [
    { label: "Food", route: "services" },
    { label: "Stops", route: "team" },
    { label: "Fuel", route: "service-detail" },
    { label: "Showers", route: "case-studies" },
    { label: "On the road", route: "insights" },
    { label: "What's open", route: "events" },
  ],

  spine: {
    engagement: "Every exit that matters",
    client: "whoever is four hours from home",
    outcome: "back on the road in eleven minutes",
  },

  pages: {
    home: {
      hero: {
        label: "Right now",
        slides: [
          {
            eyebrow: "Open",
            title: "Eleven minutes, average",
            lede: "Park, eat, fill up, go. That is the whole promise and we time it, because the thing you are actually short of is not money.",
            cta: "Find the next one",
            seed: 1,
            category: "roadside sign",
          },
          {
            eyebrow: "24 hours",
            title: "Someone is always awake",
            lede: "Every stop, every night, including the kitchen. Three in the morning is a normal time to want a hot meal and we have never pretended otherwise.",
            cta: "What's open now",
            seed: 5,
            category: "night forecourt",
          },
          {
            eyebrow: "Showers",
            title: "Hot water and a clean towel",
            lede: "Fourteen stops with showers, cleaned between every use, and you do not need to buy anything first.",
            cta: "Which stops",
            seed: 3,
            category: "shower block",
          },
        ],
      },

      proof: {
        heading: "What we actually measure",
        deck: "Time, mostly. The rest is easy and time is not.",
        stats: [
          { value: "11 min", label: "average stop, park to road" },
          { value: "62", label: "exits with one of ours" },
          { value: "24/7", label: "kitchen, not just the counter" },
        ],
      },

      segments: {
        heading: "Why people pull in",
        deck: "Five reasons. Most people arrive for one and leave having done three.",
        reachLabel: "The network",
        audiences: [
          { label: "Fuel", body: "Every stop, every grade, and the pumps are the fast ones." },
          { label: "Food", body: "A kitchen rather than a warmer. Hot, to order, and quick because it has to be." },
          { label: "Showers", body: "Fourteen stops. Cleaned between every use, no purchase needed." },
          { label: "Parking", body: "Long vehicles at every stop, lit, with space to turn without reversing." },
          { label: "Overnight", body: "Eleven stops you can legally and comfortably sleep at." },
        ],
        reach: [
          "62 exits across the corridor",
          "Never more than 90 minutes apart",
          "14 with showers, 11 with overnight parking",
          "Open every hour of every day",
        ],
      },

      features: {
        heading: "What you get without asking",
        deck: "Six things that are the same at all sixty-two.",
        items: ["Hot kitchen", "Fast pumps", "Clean rooms", "Long parking", "Free water", "Air and screenwash"],
        categories: ["kitchen pass", "fuel pump", "washroom", "truck parking", "water fountain", "air hose"],
      },

      articles: {
        heading: "On the road",
        deck: "Short. You are reading this in a car park.",
        kinds: ["Route", "Rest", "Food"],
        cards: [
          "Where to stop on a nine-hour drive, and where not to",
          "How long a proper break actually needs to be",
          "Eating at three in the morning without regretting it",
          "The showers, honestly reviewed by the people who clean them",
          "Winter parking at the high stops",
          "What eleven minutes buys you",
        ],
        categories: ["highway at night", "rest area", "night kitchen", "shower block", "snow parking", "clock"],
      },

      event: {
        eyebrow: "Every stop, every winter",
        heading: "Free coffee when it drops below zero",
        body: "If the sign outside reads under zero, the coffee is free, all night, whether or not you buy anything else. It has run every winter since 2011 and nobody has ever had to ask for it.",
        meta: "Below 0° · all night · all 62 stops",
        ctaLabel: "How it works",
        seed: 6,
        category: "coffee counter",
      },
    },

    services: {
      title: "Food",
      deck: "A kitchen, not a warmer. Short menu, cooked to order, fast because the whole point is that you are not staying.",
      intro:
        "Everything on the board can be cooked in under six minutes, and that is a constraint we designed the menu around rather than an excuse for the menu we have. A travel stop that keeps you forty minutes has failed at the only job it had.",
      modalBody:
        "Tell us the stop and roughly when. If you are a fleet we can have it ready on arrival, and we will not charge for that because it saves us time as well as yours.",
      feature: {
        eyebrow: "The kitchen",
        title: "Under six minutes, cooked",
        body: "Not held under a lamp, not microwaved from a bag. The menu is short specifically so that everything on it can be cooked properly inside the time you were going to spend queueing anyway. Twenty-four hours a day, which is the part most places quietly stop doing after ten.",
      },
      tileHeading: "The board",
      faq: [
        {
          q: "Is the kitchen really open all night?",
          a: "Yes, at all sixty-two. Not a reduced menu after midnight either — the same board, the same times.",
        },
        {
          q: "Do I have to buy something to use the showers?",
          a: "No. It is fourteen stops, hot water and a clean towel, and there is no purchase attached.",
        },
        {
          q: "Can I sleep in the car park?",
          a: "At eleven of them, yes, and those are lit and patrolled. The other fifty-one are not set up for it and we would rather say so than let you find out at two in the morning.",
        },
      ],
    },

    about: {
      title: "About Muncheese",
      deck: "Sixty-two exits. Nobody plans to be here. That is the whole design brief.",
      proof: {
        heading: "Since 1998",
        deck: "One stop on one road, then sixty-one more on the same principle.",
        stats: [
          { value: "1998", label: "the first exit" },
          { value: "62", label: "stops today" },
          { value: "0", label: "franchised" },
        ],
      },
      segments: {
        heading: "How a stop is put together",
        deck: "Five things, and every one of them is about the clock.",
        showMap: true,
        reachLabel: "The corridor",
        audiences: [
          { label: "The forecourt", body: "Fast pumps and a layout you can leave without reversing. Most of the eleven minutes is won or lost here." },
          { label: "The kitchen", body: "Short menu, everything under six minutes, open every hour." },
          { label: "The washrooms", body: "Checked hourly, logged, and the log is on the wall." },
          { label: "The parking", body: "Long vehicles everywhere, overnight at eleven, lit at all of them." },
          { label: "The people", body: "Employed, not franchised. Nights are staffed properly because nights are when it matters." },
        ],
        reach: [
          "62 exits, none more than 90 minutes apart",
          "All company-operated",
          "24-hour kitchens throughout",
          "14 with showers, 11 overnight",
        ],
      },
      promo: {
        title: "We do not franchise",
        body: "A franchise would let us be at a hundred exits by now. It would also mean the kitchen at exit forty closes at ten because closing it is cheaper for whoever runs that one, and then the promise is not a promise.",
        modalBody:
          "Stop managers are listed by exit number with a direct line. The night managers are listed separately, because at three in the morning the day manager is asleep and you need the person who is not.",
      },
    },
  },
};
