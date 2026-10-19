"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useId, type FormEventHandler, type HTMLAttributes, type ReactNode } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Field } from "./Field";

export interface SignInProps extends Omit<HTMLAttributes<HTMLElement>, "onSubmit"> {
  heading?: string;
  /** The heading's level: 1 on a page of its own, 2 inside one. */
  headingLevel?: 1 | 2;
  /** One short line under the heading, if anything needs saying. Less is more: people sign in faster with less around the form. */
  intro?: ReactNode;
  /** Something to know before signing in, above the form: "You were signed out after 30 minutes without activity." An info Alert. */
  notice?: ReactNode;
  /**
   * The last attempt failed. Says so above the form, takes focus so it is
   * heard, marks both fields, and empties the password. Never says which of
   * the two was wrong: that tells someone guessing which half they have.
   */
  error?: string;
  /** What the first field asks for. An email address by default: easier to remember than a username. */
  usernameLabel?: string;
  usernameType?: "email" | "text";
  passwordLabel?: string;
  /** A "remember" checkbox, with words that say what is remembered. Leave out on a shared or public computer's service. */
  remember?: string | false;
  forgotHref?: string;
  forgotLabel?: string;
  submitLabel?: string;
  /** Other ways in, under the form after a divider: single sign-on or a passkey, as Buttons. */
  alternatives?: ReactNode;
  alternativesLabel?: string;
  /** A line under it all for people without an account: "New here? Create an account". */
  footer?: ReactNode;
  /** The form's action, for a server that takes the post. */
  action?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

/**
 * SignIn — a form that signs someone in.
 *
 * An email address and a password, a Sign in button, and a way back in for
 * someone who has forgotten. The fields say what they are to a password
 * manager (autocomplete username and current-password), the password can be
 * shown to catch a typo, and paste is never blocked. A failed attempt is
 * said once, above the form, without naming the field at fault, and the
 * password is cleared. Put it only in front of what is private: everything
 * public should be readable without signing in.
 */
export function SignIn({
  heading = "Sign in",
  headingLevel = 1,
  intro,
  notice,
  error,
  usernameLabel = "Email address",
  usernameType = "email",
  passwordLabel = "Password",
  remember = "Remember my email address on this device",
  forgotHref = "#forgot",
  forgotLabel = "Forgot your password?",
  submitLabel = "Sign in",
  alternatives,
  alternativesLabel = "Or",
  footer,
  action,
  onSubmit,
  ...rest
}: SignInProps) {
  const id = useId();
  const headingId = `${id}-heading`;
  const errorId = `${id}-error`;
  const H = headingLevel === 1 ? "h1" : "h2";

  /* The error takes focus when it arrives, so a screen reader hears it and
     the next Tab is the first field. */
  useEffect(() => {
    if (error) document.getElementById(errorId)?.focus();
  }, [error, errorId]);

  return (
    <section {...rest} data-tk="sign-in" aria-labelledby={headingId}>
      <H id={headingId} data-tk="sign-in-heading">
        {heading}
      </H>
      {intro ? <p data-tk="sign-in-intro">{intro}</p> : null}
      {notice}
      {error ? (
        <Alert id={errorId} tone="danger" title="You could not be signed in" tabIndex={-1}>
          <p>{error}</p>
        </Alert>
      ) : null}
      <form data-tk="sign-in-form" action={action} method="post" onSubmit={onSubmit}>
        <Field
          label={usernameLabel}
          type={usernameType}
          name="username"
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={error ? true : undefined}
        />
        {/* Keyed on the error, so a failed attempt remounts it empty. */}
        <Field
          key={error ?? ""}
          label={passwordLabel}
          type="password"
          name="password"
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
        />
        {remember ? (
          <label data-tk="choice" htmlFor={`${id}-remember`}>
            <input id={`${id}-remember`} type="checkbox" name="remember" />
            <span data-tk="choice-text">
              <span data-tk="choice-label">{remember}</span>
            </span>
          </label>
        ) : null}
        <div data-tk="sign-in-actions">
          <Button type="submit">{submitLabel}</Button>
          <a data-tk="sign-in-forgot" href={forgotHref}>
            {forgotLabel}
          </a>
        </div>
      </form>
      {alternatives ? (
        <div data-tk="sign-in-alternatives">
          <p data-tk="sign-in-divider">{alternativesLabel}</p>
          {alternatives}
        </div>
      ) : null}
      {footer ? <p data-tk="sign-in-footer">{footer}</p> : null}
    </section>
  );
}
