"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "./Button";

export type ErrorPageKind = "not-found" | "problem" | "unavailable";

const TITLE: Record<ErrorPageKind, string> = {
  "not-found": "Page not found",
  problem: "Sorry, there is a problem with the service",
  unavailable: "Sorry, the service is unavailable",
};

export interface ErrorPageProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** not-found (404), problem (500, any unexpected problem), unavailable (503: closed, for now or for good). */
  kind?: ErrorPageKind;
  /** The heading. Each kind's words are the tested ones: change them only with content sign-off. */
  title?: string;
  /** In place of each kind's own words, for the body. */
  children?: ReactNode;
  /** When an unavailable service is back, as a day, date and time: "9am on Monday 3 November 2026". */
  availableFrom?: string;
  /** What happened to what they entered: "We saved your answers. They will be available for 30 days." */
  answers?: ReactNode;
  /** How to get help: a link to a page with numbers and opening times, or those details (ContactDetails). */
  contact?: ReactNode;
  /** Another service they can use instead. */
  alternative?: { label: string; href: string };
  /** One way on, when there is one: "Go to the homepage". */
  action?: { label: string; href: string };
  /** A search box, only when the header has none. */
  search?: ReactNode;
  /** Sets the document title to "[heading] – [service name]", so a screen reader hears what happened with the page. */
  serviceName?: string;
  /** Move focus to the heading when shown (an app that changes route without loading a page). */
  focusOnShow?: boolean;
}

/**
 * ErrorPage — the page that says a page is missing, the service is broken
 * or the service is closed, and what to do.
 *
 * Inside the site's usual header and footer, without breadcrumbs: the
 * heading in plain words, a short body, what happened to their answers,
 * how to get help, and at most one way on. No error code, no jargon
 * ("404", "bad request"), no humour ("oops"), no red, and no blame. The
 * server still sends the real status. Not for a form's validation errors
 * (ErrorSummary) or for planned downtime while the service still works
 * (an Alert).
 */
export function ErrorPage({ kind = "not-found", title, children, availableFrom, answers, contact, alternative, action, search, serviceName, focusOnShow = false, ...rest }: ErrorPageProps) {
  const heading = title ?? TITLE[kind];
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (serviceName && typeof document !== "undefined") document.title = `${heading} – ${serviceName}`;
    if (focusOnShow) h1.current?.focus();
  }, [heading, serviceName, focusOnShow]);

  const body = children ?? (
    kind === "not-found" ? (
      <>
        <p>If you typed the web address, check it is correct.</p>
        <p>If you pasted the web address, check you copied the entire address.</p>
      </>
    ) : kind === "problem" ? (
      <p>Try again later.</p>
    ) : availableFrom ? (
      <p>You will be able to use the service from {availableFrom}.</p>
    ) : null
  );

  return (
    <div {...rest} data-tk="error-page">
      <h1 data-tk="error-page-title" ref={h1} tabIndex={focusOnShow ? -1 : undefined}>{heading}</h1>
      {body ? <div data-tk="error-page-body">{body}</div> : null}
      {answers ? <div data-tk="error-page-body">{typeof answers === "string" ? <p>{answers}</p> : answers}</div> : null}
      {alternative ? <p data-tk="error-page-body"><a data-tk="error-page-link" href={alternative.href}>{alternative.label}</a></p> : null}
      {contact ? <div data-tk="error-page-body">{contact}</div> : null}
      {search ? <div data-tk="error-page-search">{search}</div> : null}
      {action ? <div><Button href={action.href}>{action.label}</Button></div> : null}
    </div>
  );
}
