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
  control?: FieldControl;
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
  control = "input",
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

  return (
    <div data-tk="field">
      <label data-tk="field-label" htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
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
