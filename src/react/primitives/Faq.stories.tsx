import type { Meta, StoryObj } from "@storybook/react-vite";
import { Faq } from "./Faq";

const DEMO = [
  {
    question: "How does a token get into the kit?",
    answer:
      "It starts as a decision somebody made twice. Name it, give it one value in the contract, and every component that read the old value follows it.",
    defaultOpen: true,
  },
  {
    question: "Can one component serve a sidebar and a full-bleed row?",
    answer:
      "Yes. It sizes from the box it was handed rather than from the window, so the same markup resolves twice without knowing where it is.",
  },
  {
    question: "Where does the brand sit relative to the ramp?",
    answer:
      "On top of it, and late. The grayscale ramp is the truth; a pack fills the contract slots without the component layer changing.",
  },
  {
    question: "Can we reuse this block for non-FAQ content?",
    answer:
      "Set tone=\"info\" for additional information, definitions, or programme footnotes. Same bones, different eyebrow and title defaults.",
  },
];

const meta = {
  title: "04 Primitives/10 FAQ",
  component: Faq,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "05.10 — Numbered disclosure stack. tone faq or info for FAQ vs additional information. singleExpand for one-open accordion. Prefer over ad-hoc details when the section is a primary page module. Use for: FAQ lists and additional-information stacks where one topic opens at a time or several. Don't use for: Primary navigation, long essays better as an article, or a single tip (use Alert or body copy).",
      },
    },
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["faq", "info"] },
    singleExpand: { control: "boolean" },
  },
} satisfies Meta<typeof Faq>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    tone: "faq",
    singleExpand: false,
    items: DEMO,
  },
};

export const InfoTone: Story = {
  name: "Additional information",
  args: {
    tone: "info",
    singleExpand: true,
    items: [
      {
        question: "What \"placement only\" means on plates",
        answer:
          "Stock photography is for composition. It is desaturated and marked so it never reads as a final brand asset.",
        defaultOpen: true,
      },
      {
        question: "Why the hero does not auto-advance",
        answer:
          "WCAG 2.2.2 needs a pause control for anything that moves alone. Pager buttons change the slide and the background together.",
      },
      {
        question: "Scrim strength on heroes",
        answer:
          "Default AA (not large). Headlines could clear 3:1 on a lighter wash; CTAs and pager need 4.5:1.",
      },
    ],
  },
};

export const SingleExpand: Story = {
  args: {
    tone: "faq",
    singleExpand: true,
    title: "Services FAQ",
    items: DEMO.map((d, i) => ({ ...d, defaultOpen: i === 0 })),
  },
};
