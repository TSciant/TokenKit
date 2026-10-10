"use client";
/* Client component: it uses React state, effects or DOM APIs. See the note at the top of chrome.tsx. */

import { useId } from "react";

/* Shared by the patterns that left templates.tsx for files of their own. */

/** Required is stated in text as well as marked, because 1.4.1 forbids
    carrying meaning by colour or glyph alone. */
export function Required() {
  return (
    <>
      <span aria-hidden="true"> *</span>
      <span data-tk="visually-hidden"> (required)</span>
    </>
  );
}

/** One text input in a form's field set. `type` goes straight to the input,
    so it also picks the mobile keyboard and the autocomplete token. */
export type FormField = {
  label: string;
  required?: boolean;
  type?: string;
  hint?: string;
};

export function Text({ label, required, type = "text", hint }: FormField) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div data-tk="field">
      <label data-tk="field-label" htmlFor={id}>
        {label}
        {required ? <Required /> : null}
      </label>
      <input
        data-tk="input"
        id={id}
        type={type}
        required={required}
        aria-describedby={hintId}
        autoComplete={type === "email" ? "email" : undefined}
      />
      {hint ? (
        <p data-tk="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
