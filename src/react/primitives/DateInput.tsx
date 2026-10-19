"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, useState, type FieldsetHTMLAttributes } from "react";
import { FieldError, RequiredMark } from "./field-parts";

export type DatePart = "day" | "month" | "year";
export type DateValue = Partial<Record<DatePart, string>>;

export interface DateInputProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue"> {
  /** The question: "What is your date of birth?". */
  legend: string;
  /** An example in the order the fields come: "For example, 27 3 2007". */
  hint?: string;
  error?: string;
  /** The parts in error, which alone take the error border. All of them when left out and there is an error. */
  errorParts?: DatePart[];
  /** Which parts to ask for: day, month and year, or month and year for a date people only know roughly. */
  parts?: DatePart[];
  /** Day first (most of the world) or month first (the US). */
  order?: "dmy" | "mdy";
  /** The month as a text field, or as a select of month names (easier for some; the names come from monthNames). */
  monthAs?: "input" | "select";
  monthNames?: string[];
  /** It is the reader's own date of birth: the fields say so to autofill (bday-day, bday-month, bday-year). */
  birthday?: boolean;
  /** The parts' ids are `${id}-day`, `${id}-month`, `${id}-year`: link an ErrorSummary to the first part in error. */
  id?: string;
  /** The parts' names are `${name}-day` and so on. */
  name?: string;
  value?: DateValue;
  defaultValue?: DateValue;
  onChange?: (value: DateValue) => void;
  required?: boolean;
  words?: Partial<Record<DatePart, string>>;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/* A part's width in characters (Field's data-chars): two for day and month, four for a year. */
const charsOf = (p: DatePart): 2 | 4 => (p === "year" ? 4 : 2);

/**
 * DateInput — a date someone already knows, in three short fields.
 *
 * Day, month and year in a fieldset whose legend is the question, each with
 * its own small label, sized to its answer (two, two and four characters).
 * Text fields with a numeric keypad, never number fields (which round, step
 * and scroll). Focus never jumps on by itself: a reader moves between them,
 * so they can go back and correct one. An error is said once, under the
 * hint, and borders only the parts in error. Ask for month and year alone
 * when the exact day is unlikely to be known. For choosing a date from a
 * calendar (booking, scheduling), a date picker, with typing still allowed.
 */
export function DateInput({
  legend,
  hint,
  error,
  errorParts,
  parts = ["day", "month", "year"],
  order = "dmy",
  monthAs = "input",
  monthNames = MONTHS,
  birthday,
  id,
  name,
  value,
  defaultValue,
  onChange,
  required,
  words,
  ...rest
}: DateInputProps) {
  const auto = useId();
  const base = id ?? auto;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const label: Record<DatePart, string> = { day: "Day", month: "Month", year: "Year", ...words };
  const [own, setOwn] = useState<DateValue>(defaultValue ?? {});
  const current = value ?? own;
  const set = (p: DatePart, v: string) => {
    const next = { ...current, [p]: v };
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const shown = (order === "mdy" ? (["month", "day", "year"] as DatePart[]) : (["day", "month", "year"] as DatePart[])).filter((p) => parts.includes(p));
  const bad = (p: DatePart) => Boolean(error) && (!errorParts || errorParts.includes(p));
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset {...rest} data-tk="date-input" data-invalid={error ? "" : undefined} aria-describedby={describedBy}>
      <legend data-tk="field-label">
        {legend}
        {required ? <RequiredMark /> : null}
      </legend>
      {hint ? (
        <p data-tk="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      <div data-tk="date-input-parts">
        {shown.map((p) => {
          const pid = `${base}-${p}`;
          const width = charsOf(p);
          const common = {
            id: pid,
            name: name ? `${name}-${p}` : undefined,
            value: current[p] ?? "",
            required,
            "aria-invalid": bad(p) ? true : undefined,
            autoComplete: birthday ? `bday-${p}` : undefined,
          } as const;
          return (
            <div key={p} data-tk="date-input-part">
              <label data-tk="date-input-label" htmlFor={pid}>
                {label[p]}
              </label>
              {p === "month" && monthAs === "select" ? (
                <select data-tk="select" data-chars={10} {...common} onChange={(e) => set(p, e.currentTarget.value)}>
                  <option value="" />
                  {monthNames.map((m, i) => (
                    <option key={m} value={String(i + 1)}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  data-tk="input"
                  data-chars={width}
                  type="text"
                  inputMode="numeric"
                  spellCheck={false}
                  {...common}
                  onChange={(e) => set(p, e.currentTarget.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
