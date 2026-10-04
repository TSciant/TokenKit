"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */
import { useId } from "react";
import type { FormHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";

export interface InlineFormProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "children"> {
  /** The field's label. Always in the markup; `hideLabel` only takes it off screen. */
  label: string;
  /**
   * Visually hide the label (it is still the field's name). Only when the
   * submit button and the surrounding copy already say what goes in the box:
   * a placeholder is not a label, and it disappears the moment you type.
   */
  hideLabel?: boolean;
  /** The submit button's label: a verb for what happens ("Subscribe", "Get the guide"). */
  submitLabel: string;
  type?: "email" | "text" | "search" | "tel" | "url";
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  /** An error from the last attempt. Marks the field invalid and is read with it. */
  error?: string;
  /** Submitting: the button stays focusable and announces it is busy. */
  busy?: boolean;
  /** Extra props for the input (value, defaultValue, onChange…). */
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "name">;
  /** Anything that belongs under the row, after the hint and error: a consent line, a privacy link. */
  children?: ReactNode;
}

/**
 * Inline form — one field and its submit button on one line.
 *
 * The shape behind newsletter sign-ups, "get the guide" boxes and the
 * input-capture hero. It is a real <form>: Enter submits, it works without
 * JavaScript when given an `action`, and the browser's own validation runs on
 * `type` and `required`. The label is always there (visible unless hidden on
 * purpose), the hint and error are tied to the field with aria-describedby,
 * and the row wraps to a stack when the box is too narrow for both, field
 * first, so the reading order never changes.
 */
export function InlineForm({
  label,
  hideLabel,
  submitLabel,
  type = "email",
  name = type,
  placeholder,
  autoComplete = type === "email" ? "email" : undefined,
  required = true,
  hint,
  error,
  busy,
  inputProps,
  children,
  ...rest
}: InlineFormProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <form data-tk="inline-form" {...rest}>
      <label
        data-tk={hideLabel ? "visually-hidden" : "field-label"}
        htmlFor={id}
      >
        {label}
      </label>
      <div data-tk="inline-form-row">
        <input
          data-tk="input"
          id={id}
          type={type}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...inputProps}
        />
        <Button type="submit" busy={busy}>
          {submitLabel}
        </Button>
      </div>
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
      {children}
    </form>
  );
}
