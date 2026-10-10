"use client";
/* Client component: it uses React state, effects or DOM APIs. See the note at the top of chrome.tsx. */

import { Text, Required } from "./form-parts";
import type { FormField } from "./form-parts";
import { ipsumLabels, ipsumHeadline } from "../../lib/token-ipsum";
import type { Cols } from "./types";
import { useId } from "react";
import { ArrowCta } from "./ArrowCta";

/* LeadForm, in a file of its own so a client cut can take it without the rest of templates.tsx, which re-exports it. */

export const LEAD_FIELDS: FormField[] = [
  { label: "First name", required: true },
  { label: "Last name", required: true },
  { label: "Email", type: "email", required: true },
  { label: "Phone", type: "tel" },
  { label: "Organisation", required: true },
  { label: "Job title", required: true },
];

export const LEAD_CATEGORIES = ipsumLabels(6, "lead-form-categories");

export const LEAD_HEADING = ipsumHeadline("lead-form-heading");

export type LeadFormProps = {
  heading?: string;
  deck?: string;
  fields?: FormField[];
  columns?: Cols;
  industryLabel?: string;
  /** The disabled first option, which is what makes the select required-able. */
  industryPlaceholder?: string;
  industries?: string[];
  detailLabel?: string;
  /** Visible rows on the detail textarea. */
  detailRows?: number;
  /** false drops the verification note. */
  showVerification?: boolean;
  verificationTitle?: string;
  verificationBody?: string;
  submitLabel?: string;
};

/** 12 — the lead capture form. */
export function LeadForm({
  heading = LEAD_HEADING,
  deck = "Fields marked required must be completed before the form can be sent.",
  fields = LEAD_FIELDS,
  columns = 2,
  industryLabel = "Category",
  industryPlaceholder = "Choose a category",
  industries = LEAD_CATEGORIES,
  detailLabel = "What are you working on",
  detailRows = 5,
  showVerification = true,
  verificationTitle = "Verification",
  verificationBody = "A challenge sits here in production. Any challenge used must offer a non-cognitive alternative — 3.3.8 does not accept a puzzle as the only route through.",
  submitLabel = "Send",
}: LeadFormProps = {}) {
  const industryId = useId();
  const detailId = useId();

  return (
    <section
      data-on="inverse"
      style={{ padding: "var(--tk-space-7) var(--tk-gutter)" }}
    >
      <form
        data-shell="stack"
        data-gap="5"
        onSubmit={(e) => e.preventDefault()}
        style={{ maxInlineSize: "48rem", marginInline: "auto" }}
      >
        <div data-shell="stack" data-gap="2">
          <h2 style={{ margin: 0 }}>{heading}</h2>
          <p data-tk="card-body">{deck}</p>
        </div>

        <div data-shell="grid" data-cols={String(columns)} data-gap="4">
          {fields.map((f) => (
            <Text key={f.label} {...f} />
          ))}
        </div>

        <div data-tk="field">
          <label data-tk="field-label" htmlFor={industryId}>
            {industryLabel}
            <Required />
          </label>
          <select data-tk="select" id={industryId} required defaultValue="">
            <option value="" disabled>
              {industryPlaceholder}
            </option>
            {industries.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div data-tk="field">
          <label data-tk="field-label" htmlFor={detailId}>
            {detailLabel}
            <Required />
          </label>
          <textarea data-tk="textarea" id={detailId} required rows={detailRows} />
        </div>

        {showVerification ? (
          <div data-tk="alert">
            <div>
              <p data-tk="alert-title">{verificationTitle}</p>
              {verificationBody}
            </div>
          </div>
        ) : null}

        <div>
          <ArrowCta size="md" variant="outline">
            {submitLabel}
          </ArrowCta>
        </div>
      </form>
    </section>
  );
}
