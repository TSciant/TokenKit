import type { HTMLAttributes } from "react";
import { Icon } from "./Icon";

export type StepStatus = "complete" | "current" | "upcoming" | "error";

export type StepItem = {
  label: string;
  /** Where the step is. Left out, steps before the current one are complete and after it upcoming. */
  status?: StepStatus;
  /** Where to go back to a finished step, when a reader may. */
  href?: string;
};

export interface StepsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** What the steps are for ("Apply for a grant"). Names the list. */
  label: string;
  steps: StepItem[];
  /** In a row (default, falling to a column in a narrow box) or always in a column. */
  orientation?: "horizontal" | "vertical";
  /** The words said for each status, for a page in another language. */
  words?: Partial<Record<StepStatus, string>>;
}

const WORDS: Record<StepStatus, string> = { complete: "completed", current: "current step", upcoming: "not started", error: "has a problem" };

/**
 * Steps — where a reader is in a process with a set order: done, here, still
 * to come.
 *
 * Use for: a form or task in a few fixed stages, read in order (apply, check,
 * pay). Don't use for: tasks that can be done in any order (a TaskList),
 * navigating between pages that are not a sequence (section nav), or more
 * than about seven stages (fewer, bigger steps; or one question per page).
 *
 * An ordered list, so a screen reader hears how many steps there are and
 * which one this is; the current step is aria-current="step", and every
 * step says its status in words (visually hidden) after its name, so the
 * check marks and rings are never the only telling. Finished steps can be
 * links back. In a box under 32rem the row becomes a column: the wrapper is
 * the container, because a container query cannot restyle its own box.
 */
export function Steps({ label, steps, orientation = "horizontal", words: wordsIn, ...rest }: StepsProps) {
  const words = { ...WORDS, ...wordsIn };
  const currentAt = steps.findIndex((s) => s.status === "current");
  const status = (s: StepItem, i: number): StepStatus => s.status ?? (currentAt < 0 ? "upcoming" : i < currentAt ? "complete" : i === currentAt ? "current" : "upcoming");
  return (
    <div data-tk="steps" data-orientation={orientation} {...rest}>
      <ol data-tk="steps-list" aria-label={label}>
      {steps.map((s, i) => {
        const st = status(s, i);
        const name = (
          <>
            <span data-tk="steps-label">{s.label}</span>
            <span data-tk="visually-hidden">, {words[st]}</span>
          </>
        );
        return (
          <li key={i} data-tk="steps-step" data-status={st} aria-current={st === "current" ? "step" : undefined}>
            <span data-tk="steps-marker" aria-hidden="true">
              {st === "complete" ? <Icon name="check" size="sm" /> : st === "error" ? <Icon name="alert" size="sm" /> : i + 1}
            </span>
            {s.href && st === "complete" ? (
              <a data-tk="steps-link" href={s.href}>
                {name}
              </a>
            ) : (
              <span data-tk="steps-name">{name}</span>
            )}
          </li>
        );
      })}
      </ol>
    </div>
  );
}
