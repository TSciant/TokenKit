"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useId } from "react";
import { Arrow } from "../primitives/Arrow";
import { Plate } from "../primitives/Plate";
import { ArrowCta } from "./marketing";
import type { Cols } from "./types";
import { PageHero } from "./chrome";
import {
  ipsumBody,
  ipsumDeck,
  ipsumEyebrow,
  ipsumHeadline,
  ipsumLabel,
  ipsumLabels,
  ipsumPairs,
  ipsumParagraphs,
  ipsumPeople,
  ipsumTitle,
  ipsumTitles,
} from "../../lib/token-ipsum";

/* ---------------------------------------------------------------------------
   12, 21-23, 25 — forms and page templates.

   Same two conventions as Home.tsx: defaults are exported constants rather
   than inline literals, and props carry content and shape but never styling.
   A reviewer can retype a field set or drop the lead form to one column from
   the Controls panel; nobody can repaint it from there.

   The prose is Token Ipsum — seeded, deterministic placeholder copy (see
   src/lib/token-ipsum.ts). Every seed is a stable string of component plus
   slot, so the same words come back on every reload and two screenshots stay
   comparable. Defaults stay exported constants rather than inline calls,
   because tools/gen-component-stories.mjs reads a default as written and can
   only emit an identifier or a literal.

   Form field labels are deliberately plain rather than Token Ipsum. A form
   whose fields read as nonsense cannot be reviewed as a form, and `type` is
   load-bearing: it picks the mobile keyboard and the autocomplete token.
--------------------------------------------------------------------------- */

/** Required is stated in text as well as marked, because 1.4.1 forbids
    carrying meaning by colour or glyph alone. */
function Required() {
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

function Text({ label, required, type = "text", hint }: FormField) {
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

export const SEGMENT_CRUMBS = ["Home", ...ipsumLabels(1, "segment-page-crumbs")];

export const SEGMENT_FEATURES = ipsumTitles(5, "segment-page-capabilities");

export const SEGMENT_TITLE = ipsumHeadline("segment-page-title");

export const SEGMENT_DECK = ipsumDeck("segment-page-deck");

export const SEGMENT_INTRO = ipsumBody(3, "segment-page-intro");

export const SEGMENT_CTA_HEADING = ipsumTitle("segment-page-cta-title");

export type SegmentPageProps = {
  title?: string;
  crumbs?: string[];
  deck?: string;
  intro?: string;
  capabilitiesHeading?: string;
  capabilities?: string[];
  ctaHeading?: string;
  ctaLabel?: string;
  /** 1-6. Picks the stand-in photograph. */
  seed?: number;
  ratio?: string;
};

/** 21 — the audience landing pattern. */
export function SegmentPage({
  title = SEGMENT_TITLE,
  crumbs = SEGMENT_CRUMBS,
  deck = SEGMENT_DECK,
  intro = SEGMENT_INTRO,
  capabilitiesHeading = "Capabilities",
  capabilities = SEGMENT_FEATURES,
  ctaHeading = SEGMENT_CTA_HEADING,
  ctaLabel = "Contact us",
  seed = 2,
  ratio = "4 / 3",
}: SegmentPageProps = {}) {
  return (
    <article>
      <PageHero title={title} crumbs={crumbs} deck={deck} />

      <div data-shell="center" data-width="wide" data-gap="6" style={{ paddingBlock: "var(--tk-space-7)" }}>
        <p data-tk="card-body" style={{ fontSize: "var(--tk-size-md)" }}>
          {intro}
        </p>

        <div data-shell="sidebar" data-gap="6">
          <div data-shell="stack" data-gap="3" style={{ flexBasis: "18rem" }}>
            <h2 style={{ margin: 0, fontSize: "var(--tk-size-xl)" }}>{capabilitiesHeading}</h2>
            <ul data-shell="stack" data-gap="2">
              {capabilities.map((c) => (
                <li key={c} data-shell="row" data-gap="2" style={{ flexWrap: "nowrap" }}>
                  <Arrow />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <Plate fx={true} stock ratio={ratio} seed={seed} />
        </div>
      </div>

      <div
        data-on="inverse"
        data-shell="split"
        data-gap="4"
        style={{ padding: "var(--tk-space-6) var(--tk-gutter)" }}
      >
        <h2 style={{ margin: 0, fontSize: "var(--tk-size-xl)" }}>
          {ctaHeading}
        </h2>
        <ArrowCta size="md" variant="outline">
          {ctaLabel}
        </ArrowCta>
      </div>
    </article>
  );
}

export type Fact = { label: string; value: string };

export const SUBBRAND_CRUMBS = ["Home", ...ipsumLabels(1, "subbrand-page-crumbs")];

export const SUBBRAND_FACTS: Fact[] = ipsumPairs(4, "subbrand-page-facts").map(
  (p) => ({ label: p.label, value: p.body }),
);

export const SUBBRAND_TITLE = ipsumLabel("subbrand-page-title");

export const SUBBRAND_BODY = ipsumBody(3, "subbrand-page-body");

export type SubBrandPageProps = {
  title?: string;
  crumbs?: string[];
  body?: string;
  facts?: Fact[];
  ctaLabel?: string;
  /** 1-6. Picks the stand-in photograph. */
  seed?: number;
  ratio?: string;
};

/** 22 — portfolio and acquisition brand page. */
export function SubBrandPage({
  title = SUBBRAND_TITLE,
  crumbs = SUBBRAND_CRUMBS,
  body = SUBBRAND_BODY,
  facts = SUBBRAND_FACTS,
  ctaLabel = "Visit the site",
  seed = 6,
  ratio = "3 / 2",
}: SubBrandPageProps = {}) {
  return (
    <article>
      <PageHero title={title} crumbs={crumbs} />

      <div data-shell="center" data-width="wide" data-gap="6" style={{ paddingBlock: "var(--tk-space-7)" }}>
        <div data-shell="sidebar" data-gap="6">
          <div data-shell="stack" data-gap="4" style={{ flexBasis: "14rem" }}>
            <Plate fx={true} stock ratio={ratio} texture="none" seed={seed} />
            <ArrowCta size="sm" variant="outline">
              {ctaLabel}
            </ArrowCta>
          </div>

          <div data-shell="stack" data-gap="4">
            <p data-tk="card-body" style={{ fontSize: "var(--tk-size-md)" }}>
              {body}
            </p>

            <dl data-shell="stack" data-gap="0" style={{ margin: 0 }}>
              {facts.map((f) => (
                <div
                  key={f.label}
                  data-shell="split"
                  data-gap="4"
                  style={{
                    paddingBlock: "var(--tk-space-3)",
                    borderBlockEnd: "1px solid var(--tk-line-subtle)",
                  }}
                >
                  <dt style={{ color: "var(--tk-text-secondary)" }}>{f.label}</dt>
                  <dd style={{ margin: 0, fontWeight: "var(--tk-weight-medium)" }}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </article>
  );
}

export const ARTICLE_CRUMBS = ["Home", ...ipsumLabels(1, "article-page-crumbs")];

export const ARTICLE_BODY = ipsumParagraphs(2, "article-page-body");

export const ARTICLE_TITLE = ipsumHeadline("article-page-heading");

export const ARTICLE_KIND = ipsumEyebrow("article-page-kind");

export const ARTICLE_LEDE = ipsumDeck("article-page-lede");

export const ARTICLE_SECTION_HEADING = ipsumTitle("article-page-section-heading");

export const ARTICLE_SECTION_BODY = ipsumBody(3, "article-page-section-body");

const ARTICLE_AUTHOR = ipsumPeople(1, "article-page-author")[0];

export const ARTICLE_AUTHOR_NAME = ARTICLE_AUTHOR.name;

export const ARTICLE_AUTHOR_ROLE = ARTICLE_AUTHOR.role;

export type ArticlePageProps = {
  title?: string;
  crumbs?: string[];
  kind?: string;
  meta?: string;
  lede?: string;
  /** One paragraph per entry, above the section heading. */
  body?: string[];
  sectionHeading?: string;
  sectionBody?: string;
  /** false drops the byline card off the foot of the article. */
  showAuthor?: boolean;
  authorName?: string;
  authorRole?: string;
  /** 1-6. Picks the stand-in portrait. */
  seed?: number;
};

/** 23 — the long-form content template. */
export function ArticlePage({
  title = ARTICLE_TITLE,
  crumbs = ARTICLE_CRUMBS,
  kind = ARTICLE_KIND,
  meta = "12 March 2026 · 8 min read",
  lede = ARTICLE_LEDE,
  body = ARTICLE_BODY,
  sectionHeading = ARTICLE_SECTION_HEADING,
  sectionBody = ARTICLE_SECTION_BODY,
  showAuthor = true,
  authorName = ARTICLE_AUTHOR_NAME,
  authorRole = ARTICLE_AUTHOR_ROLE,
  seed = 1,
}: ArticlePageProps = {}) {
  return (
    <article>
      <PageHero title={title} crumbs={crumbs} />

      <div data-shell="center" data-gap="5" style={{ paddingBlock: "var(--tk-space-7)" }}>
        <div data-shell="inline" data-gap="3">
          <span data-tk="chip">{kind}</span>
          <span style={{ fontSize: "var(--tk-size-sm)", color: "var(--tk-text-tertiary)" }}>
            {meta}
          </span>
        </div>

        <p data-tk="card-body" style={{ fontSize: "var(--tk-size-md)" }}>
          {lede}
        </p>

        {body.map((p) => (
          <p key={p}>{p}</p>
        ))}

        <h2 style={{ marginBlockStart: "var(--tk-space-5)" }}>{sectionHeading}</h2>
        <p>{sectionBody}</p>

        {showAuthor ? (
        <div
          data-tk="card"
          data-variant="flat"
          style={{ marginBlockStart: "var(--tk-space-6)" }}
        >
          <div data-shell="row" data-gap="4" style={{ flexWrap: "nowrap" }}>
            <Plate fx={true} stock ratio="1 / 1" crop="portrait" seed={seed} style={{ inlineSize: "4.5rem", flex: "0 0 auto" }} />
            <div data-shell="stack" data-gap="1">
              <p style={{ margin: 0, fontWeight: "var(--tk-weight-semibold)" }}>{authorName}</p>
              <p style={{ margin: 0, fontSize: "var(--tk-size-sm)", color: "var(--tk-text-secondary)" }}>
                {authorRole}
              </p>
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </article>
  );
}
