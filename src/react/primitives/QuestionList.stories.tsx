import type { Meta, StoryObj } from "@storybook/react-vite";
import { Guidance, GuidancePair } from "./Guidance";
import { QuestionList } from "./QuestionList";

const ITEMS = [
  { question: "How long does it take?", answer: "Most projects take six to twelve weeks, depending on scope." },
  { question: "What does it cost?", answer: "It depends on scope. We agree a fixed price before work starts." },
  { question: "Can you work with the systems we have?", answer: "Yes. We start from what is in place and recommend changes only where they pay for themselves." },
];

const meta = {
  title: "04 Primitives/46 Questions and answers",
  component: QuestionList,
  parameters: {
    docs: {
      description: {
        component:
          "Questions and their answers, all shown at once. Each question is a real heading, so a screen reader's heading list is the list of questions, and each answer follows in full. For short answers, or when most readers want several. When answers are long and readers want one, the disclosure FAQ hides the rest.",
      },
    },
  },
  argTypes: {
    items: { control: "object" },
    level: { control: "inline-radio", options: [3, 4] },
  },
  args: { items: ITEMS, level: 3 },
} satisfies Meta<typeof QuestionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const UsingQuestionLists: Story = {
  name: "Using questions and answers",
  render: () => (
    <GuidancePair>
      <Guidance tone="do" note="Write each question as a reader would ask it, and answer it in the first sentence. The rest of the answer is detail for those who want it.">
        <QuestionList items={ITEMS.slice(0, 1)} />
      </Guidance>
      <Guidance tone="dont" note="Don't set questions as bold paragraphs. They look like headings and are not, so nobody can jump between them, and the page has no outline.">
        <div>
          <p>
            <strong>How long does it take?</strong>
          </p>
          <p>Most projects take six to twelve weeks, depending on scope.</p>
        </div>
      </Guidance>
    </GuidancePair>
  ),
};
