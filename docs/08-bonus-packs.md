# Bonus Packs

TokenKit's **bonus pack channel** — four opt-in effect modules that extend the core without polluting it. These packs ship Quantum Design's wild energy as dignity, keeping the core kit gate-honest while enabling advanced effects.

## Architecture

**Brand packs** (`data-brand`, `src/css/packs/*`) are **appearance-only** and stay separate. They control color, typography, and brand identity.

**Bonus packs** (`src/css/bonus/*`) are **effects and behaviors** that layer on top of any brand. They're completely optional — core remains fully usable without loading any bonus pack.

## The Four Packs

### 1. Marquee

**GradientText, shimmer effects, and pattern field enhancements.**

Pure CSS effects using `@property` animations and text clipping.

```css
@import "tokenkit/css";
@import "tokenkit/css/bonus/marquee.css";
```

```html
<!-- Gradient text -->
<h1 data-marquee="gradient-text">Beautiful Gradient</h1>

<!-- Animated gradient -->
<h1 data-marquee="gradient-text-animated">Sweeping Colors</h1>

<!-- Shimmer effect -->
<div data-marquee="shimmer">
  <p>Light sweeps across</p>
</div>

<!-- Pattern field with density control -->
<div data-marquee-pattern="dense">
  <p>Dense pattern background</p>
</div>

<!-- Text mask modes -->
<h2 data-marquee-mask="soft">Soft edge fade</h2>
<h2 data-marquee-mask="vignette">Radial vignette</h2>
```

**Features:**
- `@property` CSS for smooth interpolation
- Gradient text clipping (webkit + standard)
- Shimmer animation with keyframes
- Pattern density variants (sparse/normal/dense)
- Coherent type mask modes (soft/vignette)
- Respects `prefers-reduced-motion`

**CSS-only, no React component needed.**

---

### 2. Onion

**Meant|Got scrub plate UI for design-code alignment.**

Shows intended vs actual values with Align / Accept / Pause / Replace verbs. This is craft-chamber onion for component work, **NOT** the Figma↔live onionskin tooling (`npm run onionskin` / Storybook Onion switch stay separate).

```css
@import "tokenkit/css";
@import "tokenkit/css/bonus/onion.css";
```

```tsx
import { OnionScrub } from "tokenkit/react/bonus";

<OnionScrub
  values={[
    { label: "padding", meant: "16px", got: "12px" },
    { label: "fontSize", meant: "18px", got: "18px" },
    { label: "lineHeight", meant: 1.5, got: 1.6, unit: "" },
  ]}
  onAlign={(label) => console.log("Align", label)}
  onAccept={(label) => console.log("Accept", label)}
  onPause={() => console.log("Paused")}
  onReplace={(label) => console.log("Replace", label)}
/>
```

**Verbs:**
- **Align** — Copy "meant" value to code (design → code)
- **Accept** — Update "meant" to match "got" (code → design)
- **Pause** — Temporarily disable sync checking
- **Replace** — Force overwrite "got" with "meant"

**Features:**
- Meant|Got comparison plates
- Delta indicators when values differ
- State indicators (aligned/misaligned/paused)
- Scrub slider for value adjustment
- Monospace value display
- React component with hooks

---

### 3. Ambient

**AmbientField-style SVG motifs with optional canvas particle effects.**

Provides grid/orbit/pulse/mesh backgrounds plus Kuramoto/PosterGhosts-style coordinated particles.

```css
@import "tokenkit/css";
@import "tokenkit/css/bonus/ambient.css";
```

```tsx
import { AmbientField } from "tokenkit/react/bonus";

// SVG motifs only
<AmbientField motif="grid" density="sparse">
  <h1>Content over ambient</h1>
</AmbientField>

// With canvas particle effects
<AmbientField 
  motif="orbit" 
  enableCanvas 
  particleCount={50}
  canvasOpacity={0.6}
  theme="brand"
>
  <h1>Particles + motif</h1>
</AmbientField>
```

**Motifs:**
- `grid` — Orthogonal grid lines
- `orbit` — Concentric circles
- `pulse` — Animated radial pulse
- `mesh` — Diagonal mesh pattern

**Canvas PE:**
- Kuramoto-style phase coupling
- Particle connections within range
- Coordinated motion
- Behind `prefers-reduced-motion` → static (canvas hidden entirely)
- **Opt-in** — must explicitly enable

**Features:**
- SVG-based backgrounds (CSS-only)
- Density variants (sparse/normal/dense)
- Color themes (cool/warm/brand)
- Optional canvas particle system
- Respects reduced-motion (hides canvas)
- React component with hooks

---

### 4. Seed

**ColorSeed-style hue-graph lab for generating candidate brand packs.**

A development tool that emits candidate pack values for nudge/contrast re-gate. **Never hot-rewrites shipped `--tk-*` tokens in production.**

```css
@import "tokenkit/css";
@import "tokenkit/css/bonus/seed.css";
```

```tsx
import { ColorSeedLab } from "tokenkit/react/bonus";

<ColorSeedLab
  initialHue={250}
  initialLightness={65}
  initialChroma={0.2}
  onGenerate={(pack) => console.log("Generated:", pack)}
  onExport={(css) => {
    // css is the candidate pack as a string
    downloadFile(css, "candidate-pack.css");
  }}
/>
```

**Features:**
- Interactive hue wheel (drag pin to explore)
- Lightness / Chroma sliders
- OKLab color space (perceptual uniformity)
- Live ramp preview
- Token preview with swatches
- Export candidate CSS
- Copy to clipboard
- Warning banner (dev tool, not production)

**Workflow:**
1. Explore colors with hue wheel + sliders
2. Generate ramp to see full system
3. Export CSS to candidate file
4. Run through `tools/nudge-color.mjs` for contrast
5. Re-gate with `npm run gate` before shipping

**Safety:** This is a **development tool**. It produces candidate values that must go through TokenKit's contrast gates before shipping. It does not (and cannot) hot-rewrite production tokens.

---

## Core Contract

Bonus packs honor the same rules as core:

- **Core remains usable** without loading any bonus pack
- **Wireframe/neutral/boundary/contrast honesty** stays intact
- **Reuse TokenKit primitives** (textures, gradients, MotionFx, Tach/Gauge)
- **Honor cascade layers**, `--tk-*` contract, `:where()`, `prefers-reduced-motion`
- **Extend attr/vocab allowlists** only for bonus-pack attrs, scoped so core gates don't require bonus CSS
- **No doctrine chrome** in core ("Fuck Copenhagen", Schrödinger, Ford/Particle, QCast/TV, magnets, filmstrip — all parked outside)

## Ethos

**TokenKit** = portable gated engine.

**Quantum Design** invents.

**Bonus packs** harden wild energy as opt-in modules.

The core stays neutral. The bonus channel ships dignity, not bloat.

## Import Strategies

### Import all four at once

```css
@import "tokenkit/css";
@import "tokenkit/css/bonus/index.css";
```

### Import selectively

```css
@import "tokenkit/css";
@import "tokenkit/css/bonus/marquee.css";
@import "tokenkit/css/bonus/ambient.css";
```

### React components

```tsx
// All at once
import { OnionScrub, AmbientField, ColorSeedLab } from "tokenkit/react/bonus";

// Or individually
import { OnionScrub } from "tokenkit/react/bonus/OnionScrub";
import { AmbientField } from "tokenkit/react/bonus/AmbientField";
import { ColorSeedLab } from "tokenkit/react/bonus/ColorSeedLab";
```

## Storybook

Each pack has a full Storybook section under **Bonus Packs**:

- `Bonus Packs / Marquee` — GradientText, shimmer, pattern fields, mask modes
- `Bonus Packs / Onion` — Meant|Got scrub, verb controls, alignment states
- `Bonus Packs / Ambient` — SVG motifs, canvas PE, density/theme variants
- `Bonus Packs / Seed` — Color lab, hue wheel, ramp generation, export

Run `npm run storybook` and navigate to **Bonus Packs** in the sidebar.

## When to Use

- **Marquee** — Marketing pages, hero sections, high-polish UI that needs shimmer/gradient flair
- **Onion** — Design-code handoff, component alignment, Figma-to-code workflows
- **Ambient** — Landing pages, atmospheric backgrounds, branded experiences
- **Seed** — Exploring new brand colors, prototyping pack candidates, color system design

## When NOT to Use

- Don't import bonus packs if you don't need them
- Don't use Seed in production (it's a dev tool)
- Don't rely on Onion for automated testing (it's a craft tool)
- Don't use canvas PE on content-heavy pages (perf cost)

## Reduced Motion

All packs respect `prefers-reduced-motion`:

- **Marquee** — Shimmer/gradient animations stop
- **Ambient** — Pulse stops, canvas PE is hidden entirely
- **Onion** — No motion (UI only)
- **Seed** — No motion (UI only)

## Accessibility

- Marquee gradient text maintains contrast via underlying token values
- Onion scrub has ARIA states (`aria-pressed` on verbs)
- Ambient canvas is `pointer-events: none` and decorative
- Seed contrast badges show pass/fail states

## Gates

Bonus packs are **outside** the core gate runs by default. If you extend attr/vocab allowlists for bonus attrs, scope them:

```js
// tools/attribute-gate.mjs or tools/vocabulary-gate.mjs
const BONUS_ATTRS = [
  "data-marquee",
  "data-marquee-pattern",
  "data-marquee-mask",
  "data-onion",
  "data-onion-verb",
  "data-ambient",
  "data-seed",
];

// Only validate if bonus CSS is loaded
if (bonusPacksLoaded) {
  validateAttrs(BONUS_ATTRS);
}
```

This keeps core gates clean and fast when bonus packs aren't in use.
