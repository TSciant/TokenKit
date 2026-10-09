import type { HTMLAttributes, ReactNode } from "react";
import { Heading } from "./Heading";

export type QuestionItem = { question: string; answer: ReactNode };

export interface QuestionListProps extends HTMLAttributes<HTMLDivElement> {
  items: QuestionItem[];
  /** Each question's heading level: h3 under a section's h2 (the default), h4 one deeper. */
  level?: 3 | 4;
}

/**
 * QuestionList — questions and their answers, all shown at once.
 *
 * Each question is a real heading, so a screen reader's heading list is the
 * list of questions, and each answer follows it in full. Use it when the
 * answers are short or most readers want several of them; when they are long
 * and readers want one, Faq hides the rest behind a disclosure each.
 */
export function QuestionList({ items, level = 3, ...rest }: QuestionListProps) {
  return (
    <div data-tk="question-list" {...rest}>
      {items.map((item) => (
        <div key={item.question} data-tk="question">
          <Heading level={level} text="heading-s" data-tk="question-text">
            {item.question}
          </Heading>
          <div data-tk="question-answer">{item.answer}</div>
        </div>
      ))}
    </div>
  );
}
