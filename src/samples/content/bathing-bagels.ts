import type { BrandContent } from "./types";

/**
 * Bathing Bagels — bakery.
 *
 * Round two, and the voice is the one the first three did not cover: process.
 * Door Shop sells an outcome, Mohave sells a guarantee and Wanda's sells a
 * room. A bakery sells a method — the thing that makes a bagel a bagel is
 * that it is boiled before it is baked, and a brand whose whole claim is "we
 * do the slow step" has to talk about the slow step.
 *
 * So the copy is procedural and measured in hours. It is also the only pack
 * in the set with no neutral end to its palette: cream to oxblood, so every
 * derived stop carries the brand, which is why the pages read warm even where
 * nothing is saying anything warm.
 */
export const BATHING_BAGELS: BrandContent = {
  slug: "bathing-bagels",
  label: "Bathing Bagels",

  nav: [
    { label: "The bake", route: "services" },
    { label: "Method", route: "about" },
    { label: "Bakeries", route: "team" },
    { label: "Wholesale", route: "service-detail" },
    { label: "Notes", route: "insights" },
    { label: "Classes", route: "events" },
  ],

  spine: {
    engagement: "Boiled, then baked",
    client: "four bakeries and a long overnight",
    outcome: "out of the water by six",
  },

  pages: {
    home: {
      hero: {
        label: "This morning",
        slides: [
          {
            eyebrow: "The method",
            title: "Boiled before baked",
            lede: "Thirty seconds a side in barley malt water. It is the step everyone skips and the only reason a bagel has a crust instead of a shell.",
            cta: "See the method",
            seed: 2,
            category: "boiling kettle",
          },
          {
            eyebrow: "Overnight",
            title: "Eighteen hours in the cold",
            lede: "The dough is mixed the day before and left to ferment slowly. You can taste the difference and you cannot hurry it.",
            cta: "Today's board",
            seed: 4,
            category: "proofing dough",
          },
          {
            eyebrow: "Open early",
            title: "Out of the water by six",
            lede: "Four bakeries, all of them baking on site from four in the morning. Nothing is delivered and nothing is reheated.",
            cta: "Find a bakery",
            seed: 6,
            category: "bakery window",
          },
        ],
      },

      proof: {
        heading: "Three numbers we do not move",
        deck: "Everything else about this bakery has changed at least twice.",
        stats: [
          { value: "18 hr", label: "cold ferment, minimum" },
          { value: "30 sec", label: "a side, in the kettle" },
          { value: "04:00", label: "when the first tray goes in" },
        ],
      },

      segments: {
        heading: "What comes out of the oven",
        deck: "Five things, and the order they come out in is the order they sell in.",
        reachLabel: "Where to find us",
        audiences: [
          { label: "Plain", body: "The test. If this one is wrong nothing else on the board is right." },
          { label: "Seeded", body: "Sesame and poppy, pressed on wet so they stay on through the bake." },
          { label: "Everything", body: "Seven things on top, mixed here, and the garlic is fresh rather than dried." },
          { label: "Pumpernickel", body: "A separate dough and a separate ferment. Ready an hour after the rest." },
          { label: "Wholesale", body: "Unsliced, in dozens, collected before seven. We do not deliver." },
        ],
        reach: [
          "Four bakeries, all baking on site",
          "Wholesale collection from 06:30",
          "Nothing frozen, nothing reheated",
          "Sold out is sold out",
        ],
      },

      features: {
        heading: "The long way round",
        deck: "Six steps, about twenty hours, most of it waiting.",
        items: ["Mix", "Cold ferment", "Shape", "The kettle", "Seed", "Bake"],
        categories: ["dough mixer", "cold store", "shaping bench", "boiling kettle", "seed tray", "deck oven"],
      },

      articles: {
        heading: "Notes from the bench",
        deck: "Mostly answers to things asked at the counter.",
        kinds: ["Method", "Ingredient", "Kitchen"],
        cards: [
          "Why barley malt and not sugar in the water",
          "What eighteen hours in the cold actually does",
          "Sesame falls off. Poppy does not. Here is why",
          "The difference between a bagel and a bread roll with a hole",
          "Feeding a starter that predates the second bakery",
          "Why we stop selling when we run out",
        ],
        categories: ["malt syrup", "cold store", "seed tray", "sliced bagel", "sourdough starter", "empty tray"],
      },

      event: {
        eyebrow: "Saturday mornings",
        heading: "Shape and boil, six to nine",
        body: "Three hours at the bench. You mix nothing — the dough was made yesterday, which is the lesson — and you shape, boil, seed and bake your own dozen to take home.",
        meta: "Saturdays · 06:00–09:00 · the first bakery",
        ctaLabel: "Take a place",
        seed: 3,
        category: "shaping bench",
      },
    },

    services: {
      title: "The bake",
      deck: "One dough, one kettle, six things on the board. The board is short because the method is long.",
      intro:
        "Everything here is made in the building it is sold in, from a dough mixed the previous afternoon. That is the whole operation and it is also the whole constraint: we cannot make more when we run out, because the thing we would need to make more of was started yesterday.",
      modalBody:
        "Wholesale is unsliced, by the dozen, collected before seven. Tell us the quantity and which bakery and we will tell you which mornings we can hold it.",
      feature: {
        eyebrow: "The kettle",
        title: "Thirty seconds a side",
        body: "Barley malt water, at a rolling boil, thirty seconds each way. It gelatinises the outside of the dough before the oven ever sees it, which is what produces a crust you can hear rather than a shell you have to get through. Skipping it saves twenty minutes and produces a bread roll with a hole in it.",
      },
      tileHeading: "On the board",
      faq: [
        {
          q: "Why do you sell out so early?",
          a: "Because the dough for tomorrow was mixed today. There is no way to make more of something that needs eighteen hours, and we would rather run out than shorten it.",
        },
        {
          q: "Do you deliver wholesale?",
          a: "No. Collection before seven, from the bakery that baked it. A bagel that has been in a van for an hour is a different product.",
        },
        {
          q: "Can I freeze them?",
          a: "Yes, on the day, sliced first. They come back well. What does not come back is one left out overnight.",
        },
      ],
    },

    about: {
      title: "About Bathing Bagels",
      deck: "Four bakeries. One dough. A step everybody else stopped doing.",
      proof: {
        heading: "Since 2009",
        deck: "One bakery, then three more, and the same starter throughout.",
        stats: [
          { value: "2009", label: "the first bakery" },
          { value: "4", label: "bakeries, all baking on site" },
          { value: "1", label: "starter, since the beginning" },
        ],
      },
      segments: {
        heading: "How the day is built",
        deck: "Five stages across about twenty hours, and only two of them involve doing anything.",
        showMap: true,
        reachLabel: "The four",
        audiences: [
          { label: "Afternoon", body: "Mix, then into the cold. The day's work for tomorrow is finished by four in the afternoon." },
          { label: "Overnight", body: "Eighteen hours minimum. Nothing happens and that is the part that matters." },
          { label: "Four in the morning", body: "Shape, boil, seed, bake. Four people, three hours, in that order." },
          { label: "Six", body: "Out of the water and onto the counter. Wholesale collects at half past." },
          { label: "Whenever", body: "We close when the board is empty, which is earlier on a Saturday than anyone expects." },
        ],
        reach: [
          "Four bakeries within one city",
          "All baking on site from 04:00",
          "Wholesale collection, no delivery",
          "One starter shared between them",
        ],
      },
      promo: {
        title: "We stopped opening new ones",
        body: "A fifth bakery needs a fifth person who can tell by hand when a dough is ready, and there is no shortcut to making one of those. Four is what we can do properly and it took twelve years to get here.",
        modalBody:
          "Every baker is listed by bakery, with how long they have been at the bench. The shortest is four years, which is roughly when the hand starts being reliable.",
      },
    },
  },
};
