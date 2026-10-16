import type { HTMLAttributes } from "react";
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
}

/**
 * Code — a short piece of source, labelled.
 *
 * Use for: a snippet that illustrates a point (a few lines, not a file). Don't
 * use for: code a reader is meant to copy whole (give them the file), or a
 * single token inside a sentence (that is inline code, the plain code element).
 *
 * A figure with the label as its caption, so the snippet and what it is stay
 * together for a screen reader. Long lines wrap rather than scroll: a box that
 * scrolls sideways needs its own focus stop to be reachable by keyboard, and a
 * snippet short enough to illustrate a point does not need one. No syntax
 * colours: at wireframe fidelity the words carry it, and `language` is there
 * for a pack or a highlighter to use later.
 */
export function Code({ code, label, language, ...rest }: CodeProps) {
  const lang = language || inferLanguage(code);
  return (
    <figure data-tk="code" {...rest}>
      {label ? <figcaption data-tk="code-label">{label}</figcaption> : null}
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
    </figure>
  );
}
