import { useId, type HTMLAttributes, type ReactNode } from "react";

export type TaskStatus = "complete" | "in-progress" | "not-started" | "cannot-start" | "error";

export type TaskItem = {
  label: string;
  /** Where the task is done. A task that cannot be started yet has none. */
  href?: string;
  /** A line under the name: what it involves. */
  hint?: ReactNode;
  status: TaskStatus;
  /** Words for this status, when the defaults do not fit. */
  statusLabel?: string;
};

export interface TaskListProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  items: TaskItem[];
  /** The words said for each status, for a page in another language. */
  words?: Partial<Record<TaskStatus, string>>;
}

const WORDS: Record<TaskStatus, string> = {
  complete: "Completed",
  "in-progress": "In progress",
  "not-started": "Not yet started",
  "cannot-start": "Cannot start yet",
  error: "There is a problem",
};

/**
 * TaskList — the parts of a long job, each with where it is, done in any
 * order.
 *
 * Use for: a service or form with several sections a reader may come back to
 * over time (GOV.UK's task list). Don't use for: stages that must go in order
 * (Steps), or a to-do list a reader ticks (checkboxes).
 *
 * A list of rows: each task's name is a link to where it is done, and its
 * status is the link's description, so a screen reader hears "Company
 * details, link, In progress". Completed reads as plain text; the statuses
 * still to do are tags, so what needs doing stands out, as GOV.UK has it.
 * A task that cannot start yet is not a link.
 */
export function TaskList({ items, words: wordsIn, ...rest }: TaskListProps) {
  const base = useId();
  const words = { ...WORDS, ...wordsIn };
  return (
    <ul data-tk="task-list" {...rest}>
      {items.map((t, i) => {
        const statusId = `${base}-${i}-status`;
        const hintId = t.hint ? `${base}-${i}-hint` : undefined;
        const describedBy = [hintId, statusId].filter(Boolean).join(" ");
        return (
          <li key={i} data-tk="task" data-status={t.status}>
            <div data-tk="task-name">
              {t.href && t.status !== "cannot-start" ? (
                <a data-tk="task-link" href={t.href} aria-describedby={describedBy}>
                  {t.label}
                </a>
              ) : (
                <span data-tk="task-label">{t.label}</span>
              )}
              {t.hint ? (
                <span data-tk="task-hint" id={hintId}>
                  {t.hint}
                </span>
              ) : null}
            </div>
            <span data-tk="task-status" id={statusId}>
              {t.statusLabel ?? words[t.status]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
