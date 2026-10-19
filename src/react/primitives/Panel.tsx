import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * confirmation: the task is done (the top of a confirmation page).
   * interruption: the journey pauses for something the reader must see
   * before going on; the only content on its page.
   */
  variant?: "confirmation" | "interruption";
  /**
   * The heading. A confirmation says what is done ("Application complete");
   * an interruption says it is one ("Before you continue", "Check your
   * salary"), because nothing announces it when the page loads.
   */
  title: string;
  /** 1 on a page of its own (both kinds usually are); 2 inside one. */
  headingLevel?: 1 | 2;
  /** A confirmation's reference, set large so it can be read out or copied. */
  reference?: string;
  referenceLabel?: string;
  /** An interruption's two ways out: one Button to go on and one link to go back, nothing else. */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * Panel — a page's one prominent message: done, or wait.
 *
 * A confirmation panel tells the reader a task is finished, with its
 * reference large enough to note down; what happens next goes under it, on
 * the page. An interruption panel stops a journey before a likely mistake,
 * something serious that cannot be undone, or something important that was
 * missed: the inverse surface, a heading that says it is an interruption, a
 * little content, one way on and one way back. Use it sparingly; seen often,
 * it stops being seen. Neither is announced as it loads: the heading carries
 * it, which is why the heading has to say what is going on.
 */
export function Panel({ variant = "confirmation", title, headingLevel = 1, reference, referenceLabel = "Your reference number", actions, children, ...rest }: PanelProps) {
  const id = useId();
  const H = headingLevel === 1 ? "h1" : "h2";
  const inverse = variant === "interruption";
  return (
    <section {...rest} data-tk="panel" data-variant={variant} data-on={inverse ? "inverse" : undefined} aria-labelledby={`${id}-title`}>
      <H data-tk="panel-title" id={`${id}-title`}>
        {variant === "confirmation" ? <Icon name="success" size="lg" /> : null}
        <span>{title}</span>
      </H>
      {reference ? (
        <p data-tk="panel-reference-line">
          {referenceLabel}
          <br />
          <strong data-tk="panel-reference">{reference}</strong>
        </p>
      ) : null}
      {children ? <div data-tk="panel-body">{children}</div> : null}
      {actions ? <div data-tk="panel-actions">{actions}</div> : null}
    </section>
  );
}
