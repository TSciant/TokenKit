import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Responsive demo frames.
 *
 * Each width is a real <iframe> rather than a div with a max-width, and that
 * is not ceremony — it fixes two things at once.
 *
 * Accessibility: the previous version rendered the same page three times into
 * one document, which meant three <main> landmarks, three <nav>s and three
 * identical search forms. axe was right to fail it, and a screen-reader user
 * would have met the same page three times in a row. An iframe is its own
 * document, so each copy has exactly one of everything.
 *
 * Honesty: a div with `max-inline-size: 360px` is 360px wide inside a 1440px
 * viewport. Anything that asks the viewport a question — a media query, vw
 * units, visualViewport — answers "1440" in all three frames, so the phone
 * frame is a lie about phone layout. An iframe has its own viewport, so what
 * you see is what that width actually produces. The kit resolves layout from
 * container queries and intrinsic sizing, so most of it was already correct;
 * this makes the frame correct too, including for anything that isn't the kit.
 */

const LABELS: Record<number, string> = {
  360: "Phone · 360",
  768: "Tablet · 768",
  1280: "Desktop · 1280",
};

/** Mirror the kit's stylesheets and the toolbar context into the iframe. */
function useFrameDocument(iframe: HTMLIFrameElement | null, host: Element | null) {
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    const wire = () => {
      const d = iframe.contentDocument;
      if (!d?.body) return;

      // Same styles. Cloning the nodes is enough for a built Storybook; in dev
      // Vite injects <style> tags that would need watching, so re-run on load.
      d.head.replaceChildren(
        ...[...document.querySelectorAll('style, link[rel="stylesheet"]')].map((n) =>
          n.cloneNode(true),
        ),
      );

      // Same context. data-brand and data-density live on the decorator's
      // wrapper outside this component, and a custom property cannot cross a
      // document boundary, so the values are carried over explicitly.
      const ctx = host?.closest<HTMLElement>("[data-brand]");
      if (ctx) {
        d.documentElement.setAttribute("data-brand", ctx.dataset.brand ?? "");
        const density = ctx.dataset.density;
        if (density) d.documentElement.setAttribute("data-density", density);
      }
      d.documentElement.style.fontSize = document.documentElement.style.fontSize;
      d.body.style.margin = "0";

      setBody(d.body);
    };

    wire();
    iframe.addEventListener("load", wire);
    return () => iframe.removeEventListener("load", wire);
  }, [iframe, host]);

  return body;
}

function Frame({ width, children }: { width: number; children: ReactNode }) {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const body = useFrameDocument(iframe, host.current);
  const [height, setHeight] = useState(600);

  /* The iframe has no intrinsic height, so it is measured from its own
     content. Without this every frame is a scroll box, which is a different
     lie about the layout. */
  useEffect(() => {
    if (!body) return;
    const measure = () => setHeight(Math.ceil(body.scrollHeight) || 600);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    return () => ro.disconnect();
  }, [body]);

  return (
    <section ref={host} data-shell="stack" data-gap="3">
      <p className="tk-doc-sub" style={{ margin: 0 }}>
        {LABELS[width] ?? `${width}px`}
      </p>
      <div
        style={{
          inlineSize: "100%",
          maxInlineSize: `${width}px`,
          marginInline: "auto",
          border: "1px solid var(--tk-line-strong)",
          borderRadius: "var(--tk-radius-nested)",
          overflow: "hidden",
          background: "var(--tk-surface-default)",
          boxShadow: "0 12px 40px color-mix(in srgb, var(--tk-text-primary) 8%, transparent)",
        }}
      >
        <iframe
          ref={setIframe}
          title={`${LABELS[width] ?? width} preview`}
          style={{
            display: "block",
            inlineSize: "100%",
            blockSize: `${height}px`,
            border: 0,
          }}
        />
        {body ? createPortal(children, body) : null}
      </div>
    </section>
  );
}

export function ResponsiveFrames({
  children,
  widths = [360, 768, 1280],
}: {
  children: ReactNode;
  widths?: number[];
}) {
  return (
    <div data-shell="stack" data-gap="7" style={{ padding: "var(--tk-space-5)" }}>
      {widths.map((w) => (
        <Frame key={w} width={w}>
          {children}
        </Frame>
      ))}
    </div>
  );
}

export function SingleFrame({
  width = 1280,
  children,
}: {
  width?: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        maxInlineSize: `${width}px`,
        marginInline: "auto",
        minBlockSize: "100vh",
        background: "var(--tk-surface-default)",
      }}
    >
      {children}
    </div>
  );
}
