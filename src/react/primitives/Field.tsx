"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, useRef, useState } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export type FieldControl = "input" | "textarea" | "select";

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type Shared = {
  label: string;
  hint?: string;
  error?: string;
  /** Progressive required marking — text + asterisk, not colour alone. */
  required?: boolean;
  /**
   * Marks the label "(optional)" instead. Mark the minority: when most of a
   * form's fields are required, mark the few that are optional; when most are
   * optional, mark the required ones. Ignored if `required` is set.
   */
  optional?: boolean;
  control?: FieldControl;
  /**
   * How many characters the answer is expected to be. Sizes the control to
   * fit it (a year is 4, a postcode 10, a phone number 20), because the box's
   * size is a hint about the answer's size. Leave it out to fill the
   * container. Never wider than the container.
   */
  chars?: 2 | 3 | 4 | 5 | 10 | 20 | 30;
  /**
   * A short unit before the input ("$", "£") or after it ("kg", "%"). Drawn
   * attached to the input but outside it, and hidden from screen readers so
   * it is not read as part of the value: say the unit in the label or hint
   * too ("Price, in dollars"). Short only; anything longer is a hint. Inputs
   * and selects, not textareas.
   */
  prefix?: string;
  suffix?: string;
  /**
   * For `type="password"`: a Show / Hide button beside the field, on by
   * default. Seeing what you typed is how you catch the typo before the form
   * rejects it. Set false only where the value must never be shown.
   */
  reveal?: boolean;
  /**
   * A character limit, shown as a count under the field ("You have 12
   * characters remaining"). Not the native maxlength: typing past it is
   * allowed and shown as too many, never silently cut off. The count is
   * announced to screen readers when typing pauses, and only near or over the
   * limit. Inputs and textareas.
   */
  maxChars?: number;
  options?: FieldOption[];
  children?: ReactNode;
};

export type FieldProps = Shared &
  Omit<
    InputHTMLAttributes<HTMLInputElement> &
      TextareaHTMLAttributes<HTMLTextAreaElement> &
      SelectHTMLAttributes<HTMLSelectElement>,
    "id" | "children"
  >;

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true"> *</span>
      <span data-tk="visually-hidden"> (required)</span>
    </>
  );
}

/**
 * Field. Baseline: labelled input. Progressive layers:
 * hint → describedby; error → invalid + error text; required → announced;
 * control=select|textarea → same wiring, native control (works without JS).
 */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  control = "input",
  chars,
  prefix,
  suffix,
  reveal = true,
  maxChars,
  options,
  children,
  ...rest
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  /* Character count. */
  const counts = Boolean(maxChars) && control !== "select" && !children;
  const countId = counts ? `${id}-count` : undefined;
  const initialLength = String(rest.value ?? rest.defaultValue ?? "").length;
  const [length, setLength] = useState(initialLength);
  const [spoken, setSpoken] = useState("");
  /* Nothing is announced until someone types: a field that loads over its
     limit says so visibly, and its error will say so on submit. */
  const [typed, setTyped] = useState(false);
  const remaining = (maxChars ?? 0) - length;
  const over = counts && remaining < 0;
  const countText = !counts
    ? ""
    : length === 0
      ? `You can enter up to ${maxChars} characters`
      : remaining >= 0
        ? `You have ${remaining} character${remaining === 1 ? "" : "s"} remaining`
        : `You have ${-remaining} character${remaining === -1 ? "" : "s"} too many`;
  /* Spoken once typing pauses, and only in the last fifth or over: a live
     region that talks on every keystroke is noise. */
  useEffect(() => {
    if (!counts) return;
    const near = remaining <= Math.ceil((maxChars ?? 0) * 0.2);
    if (!typed) return;
    const t = setTimeout(() => setSpoken(length > 0 && near ? countText : ""), 800);
    return () => clearTimeout(t);
  }, [counts, typed, length, remaining, maxChars, countText]);

  const describedBy = [hintId, errorId, countId].filter(Boolean).join(" ") || undefined;

  /* Password reveal. The button's words change (Show, Hide) and its name says
     what it does to what ("Show password"); it is not a pressed toggle, because
     a control whose name and pressed state both change contradicts itself. A
     polite status line says what happened. The field goes back to hidden when
     its form is submitted, so a browser never stores or sends it as plain
     text, and spellcheck and autocorrect stay off while it is shown. */
  const isPassword = control === "input" && rest.type === "password" && reveal && !children;
  const [shown, setShown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!isPassword || !form) return;
    const hide = () => setShown(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, [isPassword]);

  const controlProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "data-chars": chars,
    "data-over": over ? "" : undefined,
    required,
    ...rest,
    onChange: counts
      ? (e: { currentTarget: { value: string } }) => {
          setLength(e.currentTarget.value.length);
          setTyped(true);
          (rest.onChange as ((e: unknown) => void) | undefined)?.(e);
        }
      : rest.onChange,
  };

  let controlNode: ReactNode;
  if (children) {
    controlNode = children;
  } else if (control === "textarea") {
    controlNode = <textarea data-tk="textarea" {...controlProps} />;
  } else if (control === "select") {
    controlNode = (
      <select data-tk="select" {...controlProps} defaultValue={rest.defaultValue ?? ""}>
        {(options ?? []).map((o) => (
          <option key={o.value || "__empty"} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (isPassword) {
    controlNode = (
      <div data-tk="field-control">
        <input
          data-tk="input"
          ref={inputRef}
          {...controlProps}
          type={shown ? "text" : "password"}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button
          type="button"
          data-tk="button"
          data-variant="outline"
          data-reveal=""
          aria-controls={id}
          aria-label={shown ? "Hide password" : "Show password"}
          onClick={() => setShown(!shown)}
        >
          {shown ? "Hide" : "Show"}
        </button>
        <span data-tk="visually-hidden" aria-live="polite">
          {shown ? "Your password is visible" : ""}
        </span>
      </div>
    );
  } else {
    controlNode = <input data-tk="input" {...controlProps} />;
  }

  if ((prefix || suffix) && !children && control !== "textarea") {
    controlNode = (
      <div data-tk="field-control">
        {prefix ? (
          <span data-tk="field-affix" data-side="prefix" aria-hidden="true">
            {prefix}
          </span>
        ) : null}
        {controlNode}
        {suffix ? (
          <span data-tk="field-affix" data-side="suffix" aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div data-tk="field">
      <label data-tk="field-label" htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : optional ? <span data-tk="field-optional"> (optional)</span> : null}
      </label>
      {controlNode}
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
      {counts ? (
        <>
          {/* The visible count updates on every keystroke and is hidden from
              the accessibility tree; the field is described by the limit, and
              the live line below speaks the count when it matters. */}
          <p data-tk="field-count" data-over={over ? "" : undefined} aria-hidden="true">
            {countText}
          </p>
          <span data-tk="visually-hidden" id={countId}>
            You can enter up to {maxChars} characters
          </span>
          <span data-tk="visually-hidden" aria-live="polite">
            {spoken}
          </span>
        </>
      ) : null}
    </div>
  );
}

export const VisuallyHidden = ({ children }: { children: ReactNode }) => (
  <span data-tk="visually-hidden">{children}</span>
);
