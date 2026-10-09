import type { Preview, Decorator } from "@storybook/react-vite";
/* First: the sample-text voice has to be set before any module below builds
   its placeholders (src/samples builds some as it loads). */
import "./ipsum-voice";
import { useEffect } from "react";

import { ContentProvider } from "../src/samples/content";
import { onionGlobalType, withOnion } from "./onion";
import { withTokens } from "./tokens";

import "../src/css/index.css";
import "../src/css/specimens.css";
import "../src/tokens/doc.css";
import "./storybook.css";

/**
 * The toolbar controls are the kit's three context axes, nothing else:
 *
 *   pack     which token pack is in force — light or dark, both grayscale
 *   density  the --tk-density multiplier every component reads
 *   root     the root font size, which is what WCAG 1.4.4 is tested against
 *
 * None of them is a prop. Every one is set on an ancestor and resolved by the
 * cascade, so what you are looking at in any story is the component resolving
 * its context, not a variant being selected.
 */
export const globalTypes = {
  onion: onionGlobalType,
  pack: {
    description: "Token pack",
    toolbar: {
      title: "Pack",
      icon: "paintbrush",
      items: [
        { value: "wireframe", title: "wireframe — light" },
        { value: "wireframe-dark", title: "wireframe — dark" },
        /* Specimens. They are in the toolbar because the claim the kit makes
           is only checkable by putting a brand on a page nobody built for it
           — every pattern in 05 and every composition in 07 should survive
           the switch, and any that does not has a hardcoded value in it. */
        { value: "tk", title: "TK — house" },
        { value: "door-shop", title: "Door Shop — retail" },
        { value: "mohave", title: "Mohave — commerce" },
        { value: "bathing-bagels", title: "Bathing Bagels — bakery" },
        { value: "wandas", title: "Wanda's — burger" },
        { value: "muncheese", title: "Muncheese — travel stop" },
      ],
      dynamicTitle: true,
    },
  },
  density: {
    description: "Density multiplier",
    toolbar: {
      title: "Density",
      icon: "expand",
      items: [
        { value: "default", title: "1.0 — default" },
        { value: "compact", title: "0.75 — compact" },
        { value: "comfortable", title: "1.25 — comfortable" },
      ],
      dynamicTitle: true,
    },
  },
  root: {
    description: "Root font size (WCAG 1.4.4)",
    toolbar: {
      title: "Root",
      icon: "ruler",
      items: [
        { value: "16", title: "16px — 100%" },
        { value: "20", title: "20px — 125%" },
        { value: "24", title: "24px — 150%" },
        { value: "32", title: "32px — 200%" },
      ],
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = {
  onion: "off",
  onionOpacity: 60,
  onionBlend: "normal",
  onionSeam: 50,
  pack: "wireframe",
  density: "default",
  root: "16",
};

const withContext: Decorator = (Story, context) => {
  const { pack, density, root } = context.globals;

  // The root font size is the user's browser setting in the real world, so it
  // belongs on the document element, not on a wrapper.
  useEffect(() => {
    const doc = document.documentElement;
    const previous = doc.style.fontSize;
    doc.style.fontSize = `${root}px`;
    return () => {
      doc.style.fontSize = previous;
    };
  }, [root]);

  /* One variable, two mechanisms.
 
     `data-brand` is the CSS coordinate: the cascade resolves it per element
     and every token in the subtree comes from the matching pack. That is the
     right mechanism for colour and the wrong one for words — React cannot ask
     "which brand am I inside" without reading a computed style, and a
     component that decides what to render from a computed style renders
     something different on the second frame.
 
     So the same value also goes in as context. A brand is now its tokens AND
     its copy, switched together by one toolbar control, which is the claim
     the kit has been making with the copy held constant. The wireframe packs
     have no content pack, and that is correct rather than missing: the
     delivered prototype is unbranded and its words are the ipsum. */
  return (
    <ContentProvider brand={pack}>
      <div
        className="sb-host"
        data-brand={pack}
        data-density={density === "default" ? undefined : density}
      >
        <Story />
      </div>
    </ContentProvider>
  );
};

const preview: Preview = {
  decorators: [withContext, withOnion, withTokens],

  parameters: {
    layout: "fullscreen",

    // The pack paints the surface, so Storybook's own backgrounds would fight
    // it. Turned off rather than left to confuse.
    backgrounds: { disable: true },

    a11y: {
      test: "error",

      /* The one exclusion in the kit, and it is a tool limitation rather than
         a concession.

         axe computes a text node's backdrop by walking up for an opaque
         background. It does not composite pseudo-elements, so it cannot see a
         scrim: it reports white text against the plate underneath and calls it
         1.27:1. The wash it is ignoring is the entire point of the component.

         This is excluded here rather than waved through because the scrim is
         checked harder than anything axe does — tools/contrast-gate.mjs
         composites each derived alpha over pure white, the lightest backdrop
         an unknown photograph can produce, in every pack, surface and density:
         3.03:1, 4.61:1 and 7.23:1 against floors of 3, 4.5 and 7. See
         src/css/components/scrim.css for the derivation and Foundations/Scrim
         for it rendered.

         Scoped to the content of a scrim and nothing else. */
      context: { exclude: [['[data-tk="scrim-content"]']] },
    },

    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
      expanded: true,
    },

        options: {
      /* The sidebar's reading order.

         Sections only. Every story inside a section carries a two-digit
         prefix, which sorts correctly on its own, so listing them here would
         be a second copy of the same ordering that has to be kept in step by
         hand — and the copy that rots is always the one nobody runs. The two
         unnumbered sections get an explicit list because they have nothing to
         sort by.

         04 is Primitives and 05 is Patterns: the parts, then the things built
         out of the parts. Calling both of them "components" is what the
         sidebar used to do, and it meant the word told a reader nothing. 09 is
         the client's own section — empty in this repo, which is the point.

         There is no Shells section any more. A shell is a composition rule
         rather than a component, so it sits in 03 Foundations under
         Composition with the rest of the layout argument, and the sections
         below it moved up one rather than leaving a hole at 04.

         07 Playground is where you drive the system rather than read about
         it: the tokens are editable on the canvas and the parts are there to
         be assembled. It sits before Prototype because playing with the
         parts comes before looking at finished pages. */
      storySort: (a, b) => {
        // Extract the ordered section list for top-level sorting
        const order = [
          "00 Start",
          "01 Ethos",
          "02 Tokens",
          "03 Foundations",
          "04 Primitives",
          "05 Patterns",
          "06 Motion",
          "07 Playground",
          "08 Prototype",
          "09 Client",
        ];

        // Split paths into segments
        const aParts = a.title.split("/");
        const bParts = b.title.split("/");
        const aSection = aParts[0];
        const bSection = bParts[0];

        // If sections differ, use the explicit order
        if (aSection !== bSection) {
          const aIndex = order.indexOf(aSection);
          const bIndex = order.indexOf(bSection);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
        }

        // Within the same section, compare each path segment with numeric awareness
        const maxLen = Math.max(aParts.length, bParts.length);
        for (let i = 0; i < maxLen; i++) {
          const aPart = aParts[i] || "";
          const bPart = bParts[i] || "";
          
          if (aPart === bPart) continue;
          
          // Extract leading numbers from this segment
          const aMatch = aPart.match(/^(\d+)/);
          const bMatch = bPart.match(/^(\d+)/);
          
          if (aMatch && bMatch) {
            const diff = parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
            if (diff !== 0) return diff;
          }
          
          // Fallback to natural string comparison
          return aPart.localeCompare(bPart, "en", { numeric: true });
        }
        
        return 0;
      },
    },

    docs: { toc: true },
  },
};

export default preview;
