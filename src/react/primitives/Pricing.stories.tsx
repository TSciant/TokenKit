import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pricing } from "./Pricing";

const meta = {
  title: "04 Primitives/49 Pricing",
  component: Pricing,
  parameters: {
    docs: {
      description: {
        component:
          "Plans side by side, one card each: a name, a price and what it is per, who it is for, what it includes and one action. The cards wrap to as many columns as fit. The recommended plan says so in words and gets the solid button; nothing about it depends on colour. Each action names its plan for a screen reader.",
      },
    },
  },
  argTypes: {
    plans: { control: "object" },
    recommendedLabel: { control: "text" },
    level: { control: "inline-radio", options: [3, 4] },
  },
  args: {
    recommendedLabel: "Recommended",
    level: 3,
    plans: [
      {
        name: "Review",
        price: "From $4,000",
        summary: "A look at where you are, and a short list of what to do first.",
        features: ["Two-week review", "Written findings", "One follow-up call"],
        action: { label: "Ask about", href: "#main" },
      },
      {
        name: "Plan",
        price: "From $12,000",
        summary: "A review, then a plan with milestones you can run yourselves.",
        features: ["Everything in Review", "Six-week planning", "Roadmap and budget", "Monthly check-ins for a quarter"],
        action: { label: "Ask about", href: "#main" },
        recommended: true,
      },
      {
        name: "Partner",
        price: "Ask us",
        period: "per year",
        summary: "A plan, and a team alongside yours while it runs.",
        features: ["Everything in Plan", "A named lead", "Quarterly reviews"],
        action: { label: "Ask about", href: "#main" },
      },
    ],
  },
} satisfies Meta<typeof Pricing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
