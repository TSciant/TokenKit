import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

/* The whole kit, as one stylesheet. src/css/index.css is 36 imports deep and
   the first of them — 00-layers.css — is the @layer ordering statement, which
   must be seen before any layer is populated. Next inlines @import in source
   order, so that holds; nothing else should be imported before this. */
import "../../src/css/index.css";

export const metadata: Metadata = {
  title: {
    default: "Wireframe prototype",
    template: "%s · Wireframe prototype",
  },
  description:
    "Unbranded, grayscale wireframe prototype built on the tokenkit design system.",
};

export const viewport: Viewport = {
  /* No maximum-scale and no user-scalable=no: WCAG 1.4.4 wants text to reach
     200% and pinch-zoom is how most people get there. */
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-brand="wireframe">
      <body>{children}</body>
    </html>
  );
}
