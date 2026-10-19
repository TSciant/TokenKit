"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId, useState, type FieldsetHTMLAttributes, type ReactNode } from "react";

export type ChoiceOption = {
  value: string;
  label: ReactNode;
  /** A line under the label, read as the option's description. */
  hint?: ReactNode;
  disabled?: boolean;
};

export interface ChoiceGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue"> {
  /** checkbox: any number of the options. radio: exactly one. */
  type?: "checkbox" | "radio";
  /** The question the options answer. The group's name. */
  legend: ReactNode;
  /** The name the inputs share. */
  name: string;
  options: ChoiceOption[];
  /** Help that applies to the whole group, under the question. */
  hint?: string;
  /** What is wrong, when something is. Read with the question. */
  error?: string;
  required?: boolean;
  /** The chosen value (radio) or values (checkbox), when the caller keeps them. */
  value?: string | string[];
  /** The value or values chosen at first, when the component keeps its own. */
  defaultValue?: string | string[];
  /** Called with the new value (radio) or values (checkbox). */
  onChange?: (value: string | string[]) => void;
  /** Options one under another (default), or in a row, for two or three short ones ("Yes", "No"). */
  layout?: "stack" | "inline";
}

const asList = (v?: string | string[]) => (v === undefined ? undefined : Array.isArray(v) ? v : [v]);

/**
 * ChoiceGroup — a question answered by choosing from a few options: radio
 * buttons for one, checkboxes for any number.
 *
 * Use for: up to about seven options a reader should see all of at once.
 * Don't use for: a long list (a Select, or a search), a single on and off
 * setting that applies at once (a Switch), or options that need room to
 * explain themselves (ChoiceCard).
 *
 * A fieldset whose legend is the question, so each option is heard with it;
 * the group's hint and error describe it. Native inputs, so the keyboard
 * works as everywhere else (Tab into the group, arrows between radios, Space
 * to tick), drawn in the action colour. The error is described on the
 * fieldset and each input is marked invalid.
 */
export function ChoiceGroup({ type = "radio", legend, name, options, hint, error, required, value, defaultValue, onChange, layout = "stack", ...rest }: ChoiceGroupProps) {
  const base = useId();
  const [own, setOwn] = useState<string[]>(asList(defaultValue) ?? []);
  const chosen = asList(value) ?? own;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const pick = (v: string, on: boolean) => {
    const next = type === "radio" ? [v] : on ? [...chosen, v] : chosen.filter((x) => x !== v);
    if (value === undefined) setOwn(next);
    onChange?.(type === "radio" ? v : next);
  };
  return (
    <fieldset
      data-tk="choice-group"
      data-layout={layout}
      data-invalid={error ? "" : undefined}
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      {...rest}
    >
      <legend data-tk="field-label">
        {legend}
        {required ? (
          <>
            <span aria-hidden="true"> *</span>
            <span data-tk="visually-hidden"> (required)</span>
          </>
        ) : null}
      </legend>
      {hint ? (
        <p data-tk="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p data-tk="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
      <div data-tk="choice-group-options">
        {options.map((o, i) => {
          const id = `${base}-${i}`;
          return (
            <label key={o.value} data-tk="choice" htmlFor={id}>
              <input
                id={id}
                type={type}
                name={name}
                value={o.value}
                checked={chosen.includes(o.value)}
                disabled={o.disabled}
                required={type === "radio" ? required : undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={o.hint ? `${id}-hint` : undefined}
                onChange={(e) => pick(o.value, e.currentTarget.checked)}
              />
              <span data-tk="choice-text">
                <span data-tk="choice-label">{o.label}</span>
                {o.hint ? (
                  <span data-tk="choice-hint" id={`${id}-hint`}>
                    {o.hint}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
