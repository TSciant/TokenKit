import type { BrandContent } from "./types";

/**
 * Wanda's — roadside burger diner.
 *
 * The third pack, and the one that tests something the other two do not:
 * warmth. Door Shop is loud and Mohave is quiet, but both are institutional —
 * they talk about themselves in the plural and measure in numbers. A diner
 * talks in the first person singular and measures in years and names.
 *
 * So the voice here is one person's. It uses "I" where the others use "we",
 * it names staff, and its proof points are a founding year and a recipe that
 * has not changed rather than a delivery percentage. The pack gives it a
 * serif display face, cream grounds and a film-grain texture; the copy is
 * written to sit under that without turning into nostalgia for its own sake.
 */
export const WANDAS: BrandContent = {
  slug: "wandas",
  label: "Wanda's",

  nav: [
    { label: "Menu", route: "services" },
    { label: "The story", route: "about" },
    { label: "Locations", route: "team" },
    { label: "Catering", route: "service-detail" },
    { label: "Recipes", route: "insights" },
    { label: "What's on", route: "events" },
  ],

  spine: {
    engagement: "Griddle and counter",
    client: "one road, three rooms",
    outcome: "the same burger since 1961",
  },

  pages: {
    home: {
      hero: {
        label: "Tonight",
        slides: [
          {
            eyebrow: "Since 1961",
            title: "Still the same burger",
            lede: "Chuck ground every morning, smashed on a flat-top that has not been replaced since my mother ran it. Everything else on the menu has changed at least once.",
            cta: "See the menu",
            seed: 3,
            category: "griddle",
          },
          {
            eyebrow: "The counter",
            title: "Eleven stools and no reservations",
            lede: "Sit where there is room. The counter turns over about every twenty minutes and nobody has ever waited more than one cup of coffee.",
            cta: "Find us",
            seed: 1,
            category: "diner counter",
          },
          {
            eyebrow: "Late",
            title: "Open until the pie runs out",
            lede: "Usually around eleven, sometimes a lot earlier on a Friday. The sign in the window is more accurate than the one on the internet.",
            cta: "Tonight's pie",
            seed: 5,
            category: "pie case",
          },
        ],
      },

      proof: {
        heading: "Three things I will not change",
        deck: "Everything else is negotiable and most of it has been.",
        stats: [
          { value: "1961", label: "the year, and the recipe" },
          { value: "11", label: "stools at the counter" },
          { value: "4am", label: "when the grinding starts" },
        ],
      },

      segments: {
        heading: "How people eat here",
        deck: "Four ways in. The counter is the good one but I would say that.",
        reachLabel: "Where to find me",
        audiences: [
          {
            label: "The counter",
            body: "Eleven stools, no reservations, and you will end up talking to whoever is next to you.",
          },
          {
            label: "Booths",
            body: "Six of them, good for four, and the one by the window is worth waiting for.",
          },
          {
            label: "Takeaway",
            body: "Call ahead and it will be on the pass. Do not ask me to keep fries hot, I will not do it.",
          },
          {
            label: "Catering",
            body: "Griddle on a trailer. Weddings, wakes, and one very strange corporate thing in 2019.",
          },
          {
            label: "Early",
            body: "Coffee and eggs from five. Half the room is on its way to a shift.",
          },
        ],
        reach: [
          "One room on the old highway",
          "Parking for fourteen, more on the verge",
          "Cash and card, no minimum",
          "The trailer travels about an hour",
        ],
      },

      features: {
        heading: "What comes off the griddle",
        deck: "Six things I am confident about. There are others.",
        items: ["The burger", "Chilli", "Eggs any way", "Pie", "Coffee", "Shakes"],
        categories: ["smashed burger", "chilli bowl", "eggs", "pie slice", "coffee pot", "milkshake"],
      },

      articles: {
        heading: "From the kitchen",
        deck: "Things I get asked at the counter often enough to write down.",
        kinds: ["Recipe", "Kitchen", "History"],
        cards: [
          "Why a smashed patty beats a thick one",
          "Grinding chuck at four in the morning",
          "The pie crust I got from my mother and changed twice",
          "Seasoning a flat-top that is older than I am",
          "What happened to the second location",
          "How to order like you have been here before",
        ],
        categories: ["smashed burger", "meat grinder", "pie crust", "flat top", "old photo", "diner counter"],
      },

      event: {
        eyebrow: "Every Thursday",
        heading: "Pie and records night",
        body: "Whole pies at counter price from seven, and whoever brings the best record gets theirs free. It has been running since 1994 and the rules have never been written down.",
        meta: "Thursdays · from 19:00 · the counter",
        ctaLabel: "Put it in the diary",
        seed: 4,
        category: "record player",
      },
    },

    services: {
      title: "Menu",
      deck: "Short, because a long menu means most of it is frozen. Everything here comes off the griddle or out of the oven in this room.",
      intro:
        "The burger has not changed since 1961 and the rest of the menu has changed constantly, which is the opposite of how most places do it. I would rather cook six things properly than forty things adequately, and the six move with the season.",
      modalBody:
        "If you are catering, tell me how many and where. The trailer travels about an hour and I will need a flat spot and somewhere to plug in.",
      feature: {
        eyebrow: "The burger",
        title: "Chuck, ground at four, smashed at eleven",
        body: "One cut, ground every morning, smashed thin on a flat-top that has been seasoned continuously since my mother ran it. No blend, no aging, nothing rested. It is a simple thing done the same way for sixty-five years and that is the entire trick.",
      },
      tileHeading: "The board",
      faq: [
        {
          q: "Can I book a table?",
          a: "No, and I am sorry about it. Eleven stools and six booths do not survive a booking system. The counter turns over fast.",
        },
        {
          q: "Do you do anything vegetarian?",
          a: "Yes, and it is a proper thing rather than the burger without the burger. Ask at the counter, it changes.",
        },
        {
          q: "What time do you actually close?",
          a: "When the pie runs out. Usually around eleven, occasionally by nine on a Friday. The sign in the window is right; the internet is not.",
        },
      ],
    },

    about: {
      title: "About Wanda's",
      deck: "My mother opened it in 1961. I have changed almost everything except the thing people come for.",
      proof: {
        heading: "Sixty-five years on one corner",
        deck: "Two generations, one griddle, and a second location that did not work.",
        stats: [
          { value: "1961", label: "opened by my mother" },
          { value: "2", label: "generations behind the counter" },
          { value: "1", label: "location, after some trying" },
        ],
      },
      segments: {
        heading: "How the room works",
        deck: "Five things, none of them complicated, all of them load-bearing.",
        showMap: false,
        reachLabel: "The room",
        audiences: [
          {
            label: "The griddle",
            body: "Seasoned continuously since 1961. It has been repaired and never replaced, which people find sentimental and I find practical.",
          },
          {
            label: "The counter",
            body: "Eleven stools. It is where the room happens and it is why there are no reservations.",
          },
          {
            label: "Four in the morning",
            body: "Grinding, stock, pie crust. Everything that makes the day possible happens before anyone arrives.",
          },
          {
            label: "The staff",
            body: "Six people, most of them here longer than a decade. That is the only hiring policy I have.",
          },
          {
            label: "The trailer",
            body: "A griddle on wheels for catering. It travels about an hour and comes home the same night.",
          },
        ],
        reach: [
          "One room on the old highway",
          "Open from five, closed when the pie goes",
          "Six staff, most over ten years",
          "Catering within about an hour",
        ],
      },
      promo: {
        title: "The second location did not work",
        body: "We tried, in 1988, about forty minutes away. The burger was identical and the room was not, and it turned out the room was most of it. I have not tried again and I am not going to.",
        modalBody:
          "Everyone who works here is listed, including how long they have been at it. Two of them have been here longer than I have been running the place.",
      },
    },
  },
};
