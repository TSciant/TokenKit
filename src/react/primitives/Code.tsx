"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useEffect, useState, type HTMLAttributes } from "react";
import { highlight, inferLanguage } from "../../lib/highlight";

export interface CodeProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** The code, as text. Line breaks and indentation are kept. */
  code: string;
  /** What it is, shown above it: "ActionScript 1, 2000", "The card's CSS". */
  label?: string;
  /**
   * The language: "css", "scss", "js", "jsx", "ts", "html", "actionscript"…
   * It decides how the code is highlighted, and is written as the code
   * element's class for anything else that reads it. Left out, it is
   * inferred from the code; "text" turns highlighting off.
   */
  language?: string;
  /** A Copy button in the corner, for a snippet a reader is meant to paste. */
  copy?: boolean;
  /** The button's words before and after copying, for a page in another language. */
  copyWords?: [copy: string, copied: string];
}

/**
 * Code — a short piece of source, labelled.
 *
 * Use for: a snippet that illustrates a point (a few lines, not a file). Don't
 * use for: a whole file (link to it), or a single token inside a sentence
 * (that is inline code, the plain code element). For a snippet a reader is
 * meant to paste, set `copy`: a button in the corner copies it and says
 * "Copied", aloud too, through a live region.
 *
 * A figure with the label as its caption, so the snippet and what it is stay
 * together for a screen reader. Long lines wrap rather than scroll: a box that
 * scrolls sideways needs its own focus stop to be reachable by keyboard, and a
 * snippet short enough to illustrate a point does not need one. No syntax
 * colours: at wireframe fidelity the words carry it, and `language` is there
 * for a pack or a highlighter to use later.
 */
export function Code({ code, label, language, copy, copyWords = ["Copy", "Copied"], ...rest }: CodeProps) {
  const lang = language || inferLanguage(code);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  const block = (
    <pre data-tk="code-block">
      <code className={`language-${lang}`}>
        {highlight(code, lang).map((p, i) =>
          p.kind ? (
            <span key={i} data-code={p.kind}>
              {p.text}
            </span>
          ) : (
            p.text
          ),
        )}
      </code>
    </pre>
  );
  return (
    <figure data-tk="code" {...rest}>
      {label ? <figcaption data-tk="code-label">{label}</figcaption> : null}
      {copy ? (
        <div data-tk="code-body">
          {block}
          <button
            data-tk="code-copy"
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(code).then(() => setCopied(true), () => {});
            }}
          >
            {copied ? copyWords[1] : copyWords[0]}
            <span data-tk="visually-hidden"> {label ?? "code"}</span>
          </button>
          <span data-tk="visually-hidden" aria-live="polite">
            {copied ? copyWords[1] : ""}
          </span>
        </div>
      ) : (
        block
      )}
    </figure>
  );
}
