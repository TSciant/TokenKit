"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId } from "react";
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
  options,
  children,
  ...rest
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const controlProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "data-chars": chars,
    required,
    ...rest,
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
    </div>
  );
}

export const VisuallyHidden = ({ children }: { children: ReactNode }) => (
  <span data-tk="visually-hidden">{children}</span>
);
