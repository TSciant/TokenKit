/* ---------------------------------------------------------------------------
   Token Ipsum, the kit's own voice: placeholder prose about the kit itself
   (tokens, containers, layers, concentric radii, density as a multiplier).

   The kit's Storybook and site read in this voice (.storybook/ipsum-voice.ts
   sets it), so their pages explain the thing they show, and the pattern
   stories keep matching the Figma components drawn from them. Everything
   else gets the neutral voice in token-ipsum.ts, the default, and nothing
   imports this file but the kit's Storybook: a client cut never carries it.
--------------------------------------------------------------------------- */

import type { IpsumVoice } from "./token-ipsum";

export const KIT_VOICE: IpsumVoice = {
  headlines: [
  "A token is a decision you only make once",
  "The browser already knows how wide the box is",
  "Container queries ask the parent, not the page",
  "Breakpoints describe a device nobody is holding",
  "One contract, two packs, no exceptions",
  "Density is a multiplier, not a redesign",
  "Inner radius equals outer radius minus the gap",
  "Layers decide who wins before specificity is consulted",
  "A component that knows a hex value cannot be rethemed",
  "Measure the page, do not describe it",
  "Every scale step is a published decision",
  "The cascade is an API, not an accident",
  "Composition beats configuration at every size",
  "Intrinsic sizing is the layout doing its own arithmetic",
  "A wireframe should answer revisions, not generate them",
  ],
  decks: [
  "A token names a decision so the decision stops being retyped. Change the name's value and everything that read it changes with it, which is the only kind of consistency that survives a deadline.",
  "Container queries let a component size itself from the space it was handed rather than from the width of the window. The same card works in a sidebar, a three-up grid and a full-bleed row without knowing which one it is in.",
  "Breakpoints encode a guess about hardware. Containers encode a fact about layout, and facts age better than guesses — a component built against its own box keeps working on a screen that did not exist when it was written.",
  "Cascade layers settle precedence before specificity is ever consulted, so a utility can override a component without a selector arms race and a brand pack can override both without touching either.",
  "Density is one multiplier applied to a private spacing ramp. A comfortable page and a compact page are the same markup, the same components and the same tokens, resolving differently.",
  "Two rounded boxes whose arcs do not share a centre look approximate no matter how careful the rest of the page is. Inner radius is outer radius less the gap, and the eye catches the difference long before anyone can name it.",
  "Everything here is drawn from a grayscale contract on purpose. Colour arrives as a pack, late, and the layout has already been proved without it.",
  ],
  sentences: [
  "A token is a named decision, and naming it is what stops it being made again.",
  "The value lives in one place; everything downstream reads it rather than repeats it.",
  "Container queries resolve against the element's own box, so a component can be honest about the space it was actually given.",
  "A media query asks how wide the window is, which is rarely the question the component needs answered.",
  "The same card in a sidebar and in a four-up grid is the same component, resolving twice.",
  "Cascade layers put the precedence argument in one line at the top of the file instead of in every selector.",
  "An unlayered rule beats every layered rule regardless of specificity, which is either a useful escape hatch or a silent bug depending on whether it was deliberate.",
  "Custom properties are substituted at computed-value time and inherited as values, so a derivation has to be restated wherever its input can change.",
  "Density multiplies a private spacing ramp rather than being applied at each call site, which is what lets a nested region actually nest.",
  "Pointer targets have a floor that density is not allowed to argue with.",
  "Intrinsic sizing lets the content do the arithmetic, and the content is the only party that knows how long it is.",
  "Type scales with the box it sits in, because a heading that is right at one width is wrong at another.",
  "Concentric corners are not a preference; there is exactly one inner radius that shares a centre with a given outer one.",
  "Contrast is a property of a pair in a context, so it is checked in context rather than asserted from a palette.",
  "A grayscale wireframe proves the structure before anyone can be distracted by the colour.",
  "The brand arrives as a pack of values, late, and nothing in the component layer has to be rewritten to receive it.",
  "Motion reads its pace from the same tokens as everything else, so the whole interface moves at one speed.",
  "Reduced motion is a preference the system honours rather than an option it offers.",
  "Every claim the system makes about itself is checked by something that runs, because a claim nobody measures is a claim that quietly stops being true.",
  "What renders in the browser is the artifact; everything before it was a description of the artifact.",
  ],
  labels: [
  "Tokens", "Contract", "Packs", "Scales", "Density", "Layers",
  "Shells", "Containers", "Measure", "Contrast", "Motion", "Corners",
  "Primitives", "Patterns", "Composition", "Surfaces", "Typography", "Texture",
  ],
  titles: [
  "Naming the decision once",
  "Asking the box, not the window",
  "Precedence before specificity",
  "One ramp, one multiplier",
  "Arcs that share a centre",
  "Proving it in context",
  "Colour arrives last",
  "The measure sets the column",
  "Shells within shells",
  "Everything is a published step",
  "Pace from the same tokens",
  "Structure before surface",
  ],
  eyebrows: [
  "Foundations", "Contract", "Method", "Reference", "Principle",
  "Pattern", "Doctrine", "Rationale", "Specimen", "Note",
  ],
  names: [
  "Avery Cascade", "Rowan Gutter", "Sasha Leading", "Micah Baseline",
  "Noor Tracking", "Quinn Kerning", "Sky Measure", "Ellis Ramp",
  "Reese Container", "Harper Token", "Frankie Layer", "Jules Viewport",
  ],
  roles: [
  "Systems lead", "Principal, layout", "Type and measure",
  "Contrast and colour", "Motion", "Accessibility",
  "Tokens and packs", "Composition", "Documentation",
  ],
  places: [
  "Remote", "Studio", "Atelier", "Workshop", "Annex", "Loft",
  ],
  statValues: ["100%", "3x", "24px", "1.25", "0ms", "4.5:1", "7", "12"],
  statLabels: [
    "Of decisions named once",
    "Contexts, one component",
    "Minimum pointer target",
    "Comfortable density",
    "Layout shift budget",
    "Normal-text contrast floor",
    "Layers in the cascade",
    "Steps in the space ramp",
  ],
};
