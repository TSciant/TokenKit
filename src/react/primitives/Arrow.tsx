/**
 * The arrow that trails a primary call to action.
 *
 * Inline SVG rather than an icon-font glyph or an Icon lookup: it is one path,
 * it inherits `currentColor`, and it costs nothing. `aria-hidden` because the
 * link text already says where it goes — an arrow that announces itself is an
 * arrow read aloud on every CTA on the page.
 */
export function Arrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "0 0 auto" }}
    >
      <path
        d="M2 8h11M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
