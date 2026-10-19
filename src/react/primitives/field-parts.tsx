import type { ReactNode } from "react";

/* The pieces every form control's frame shares, written once: Field, Combobox,
   FileUpload, ChoiceGroup, DateInput and InlineForm each had their own copy,
   and only FileUpload's error said "Error:" to a screen reader. */

/** After the label: a mark the eye reads, and the word a screen reader says. */
export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true"> *</span>
      <span data-tk="visually-hidden"> (required)</span>
    </>
  );
}

/**
 * The control's error, prefixed for a screen reader ("Error: Enter a date"),
 * so the message is not mistaken for a hint when it is read on its own
 * through aria-describedby.
 */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p data-tk="field-error" id={id}>
      <span data-tk="visually-hidden">Error: </span>
      {children}
    </p>
  );
}
