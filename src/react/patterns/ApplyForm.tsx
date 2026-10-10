"use client";
/* Client component: it uses React state, effects or DOM APIs. See the note at the top of chrome.tsx. */

import { Text, Required } from "./form-parts";
import type { FormField } from "./form-parts";
import { ipsumLabels, ipsumHeadline } from "../../lib/token-ipsum";
import { useId } from "react";
import { ArrowCta } from "./ArrowCta";

/* ApplyForm, in a file of its own so a client cut can take it without the rest of templates.tsx, which re-exports it. */

export const APPLY_FIELDS: FormField[] = [
  { label: "Full name", required: true },
  { label: "Email", type: "email", required: true },
];

export const APPLY_ROLES = ipsumLabels(3, "apply-form-roles");

export const APPLY_HEADING = ipsumHeadline("apply-form-heading");

export type ApplyFormProps = {
  heading?: string;
  fields?: FormField[];
  roleLabel?: string;
  rolePlaceholder?: string;
  roles?: string[];
  resumeLabel?: string;
  resumeHint?: string;
  /** Value of the file input's accept attribute. */
  resumeAccept?: string;
  consentLabel?: string;
  submitLabel?: string;
};

/** 25 — single-column form with a file input and a consent checkbox. */
export function ApplyForm({
  heading = APPLY_HEADING,
  fields = APPLY_FIELDS,
  roleLabel = "Role of interest",
  rolePlaceholder = "Choose a role",
  roles = APPLY_ROLES,
  resumeLabel = "Résumé",
  resumeHint = "PDF or Word, up to 5 MB.",
  resumeAccept = ".pdf,.doc,.docx",
  consentLabel = "I agree to this application being stored for recruitment purposes",
  submitLabel = "Submit application",
}: ApplyFormProps = {}) {
  const fileId = useId();
  const consentId = useId();
  const roleId = useId();

  return (
    <section data-shell="center" data-gap="5" style={{ paddingBlock: "var(--tk-space-7)" }}>
      <h2 style={{ margin: 0 }}>{heading}</h2>
      <form data-shell="stack" data-gap="4" onSubmit={(e) => e.preventDefault()}>
        {fields.map((f) => (
          <Text key={f.label} {...f} />
        ))}
        <div data-tk="field">
          <label data-tk="field-label" htmlFor={roleId}>
            {roleLabel}
            <Required />
          </label>
          <select data-tk="select" id={roleId} required defaultValue="">
            <option value="" disabled>
              {rolePlaceholder}
            </option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        <div data-tk="field">
          <label data-tk="field-label" htmlFor={fileId}>
            {resumeLabel}
            <Required />
          </label>
          <input data-tk="input" id={fileId} type="file" required accept={resumeAccept} />
          <p data-tk="field-hint">{resumeHint}</p>
        </div>

        <label data-tk="choice" htmlFor={consentId}>
          <input id={consentId} type="checkbox" required />
          <span>
            {consentLabel}
            <Required />
          </span>
        </label>

        <div>
          <ArrowCta size="md">{submitLabel}</ArrowCta>
        </div>
      </form>
    </section>
  );
}
