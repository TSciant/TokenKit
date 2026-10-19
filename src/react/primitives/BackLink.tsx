import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export interface BackLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "type"> {
  children?: ReactNode;
  /** A link (default), or a button when going back has to post the form. */
  as?: "a" | "button";
  /** For a button: the form's field it sends, and its value. */
  name?: string;
  value?: string;
  form?: string;
  type?: "submit" | "button";
}

/**
 * BackLink — one link back to the previous page of a journey, at the top.
 *
 * A chevron and "Back" (or "Go back to [page]" where Back would not be
 * clear). Put it at the top of the page before `<main>`, so the skip link
 * passes over it, and not inside a nav. A real address that works without
 * JavaScript, never `history.back()`; a button only when going back has to
 * send the form (`as="button"`, with the form's name and value). Back takes
 * them to the page as they left it. Not with breadcrumbs, not on content
 * pages, and not beside other links or buttons. On a dark band, inside the
 * inverse context.
 */
export function BackLink({ as = "a", children = "Back", name, value, form, type = "submit", ...rest }: BackLinkProps) {
  if (as === "button") {
    const { className, style, id, onClick } = rest;
    return <button className={className} style={style} id={id} onClick={onClick as ButtonHTMLAttributes<HTMLButtonElement>["onClick"]} type={type} name={name} value={value} form={form} data-tk="back-link">{children}</button>;
  }
  return <a {...rest} data-tk="back-link">{children}</a>;
}
