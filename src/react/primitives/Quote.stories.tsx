import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./Avatar";
import { Quote } from "./Quote";

const meta = {
  title: "04 Primitives/51 Quote",
  component: Quote,
  parameters: {
    docs: {
      description: {
        component:
          "Something someone said, and who said it: a figure holding the quotation (a blockquote) and its attribution (a figcaption with a name, a role and an organisation), so the words are never separated from the person. The quotation marks are drawn by the CSS in the reader's language, not typed into the text. Plain sits in running text; pull is large and ruled, for breaking up an article; testimonial is the quote in a Card with a small round portrait beside the name.",
      },
    },
  },
  argTypes: {
    text: { control: "text" },
    name: { control: "text" },
    role: { control: "text" },
    organisation: { control: "text" },
    portrait: { control: false, description: "Any small picture: an Avatar, an image, a Plate. Shown in a 48px circle." },
    variant: { control: "inline-radio", options: ["plain", "pull", "testimonial"] },
  },
  args: {
    text: "We stopped arguing about the schedule and started fixing it. The new rota took a month, and nobody wants the old one back.",
    name: "Sam Rivera",
    role: "Head of operations",
    organisation: "Northfield Supply",
    variant: "plain",
  },
} satisfies Meta<typeof Quote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Pull: Story = {
  name: "Pull quote in an article",
  parameters: {
    docs: {
      description: {
        story:
          "Large and ruled above and below, to break up a long read. A pull quote repeats words that are already on the page, so a reader who skips it misses nothing.",
      },
    },
  },
  render: () => (
    <article data-shell="stack" data-gap="5" style={{ maxInlineSize: "40rem" }}>
      <p style={{ margin: 0 }}>
        For two years the team planned the week on a whiteboard. Demand peaked on Mondays and Fridays, and the board
        spread people evenly across all five days, so the busiest hours were the thinnest.
      </p>
      <Quote
        variant="pull"
        text="The busiest hours were the thinnest, and the board was the reason."
        name="Sam Rivera"
        role="Head of operations"
        organisation="Northfield Supply"
      />
      <p style={{ margin: 0 }}>
        The fix was not more staff. It was a quarter of counting, hour by hour, and a rota rebuilt around what the
        counts said, with the people who would work it in the room.
      </p>
    </article>
  ),
};

export const Testimonials: Story = {
  name: "Testimonials",
  parameters: {
    docs: {
      description: {
        story:
          "Each in a card, with a portrait beside the name. The portrait is decoration (here an Avatar with initials); the name beside it says who. The names line up along the bottom however long the words run.",
      },
    },
  },
  render: () => (
    <div data-shell="grid" data-gap="4" data-cols="3">
      {[
        {
          text: "Clear from the first call. We always knew what was happening next and why.",
          name: "Priya Shah",
          role: "Director",
          organisation: "Riverside Books",
        },
        {
          text: "The review gave us a short list instead of a long report, and we finished it in a quarter.",
          name: "Tom Okafor",
          role: "Operations lead",
          organisation: "Westbury Library",
        },
        {
          text: "They worked with the people who do the job, not around them.\n\nThat is why the new process stuck.",
          name: "Mary Ellen Doyle",
          role: "Office manager",
        },
      ].map((q) => (
        <Quote key={q.name} variant="testimonial" portrait={<Avatar name={q.name} />} {...q} />
      ))}
    </div>
  ),
};
