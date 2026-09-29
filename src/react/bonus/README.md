# TokenKit Bonus Packs

Four opt-in React components that extend TokenKit with effects and behaviors.

See [docs/08-bonus-packs.md](../../../docs/08-bonus-packs.md) for full documentation.

## Components

### OnionScrub

Meant|Got comparison plate for design-code alignment.

```tsx
import { OnionScrub } from "tokenkit/react/bonus";

<OnionScrub
  values={[
    { label: "padding", meant: "16px", got: "12px" },
    { label: "fontSize", meant: "18px", got: "18px" },
  ]}
  onAlign={(label) => console.log("Align", label)}
/>
```

### AmbientField

SVG motifs with optional canvas particle effects.

```tsx
import { AmbientField } from "tokenkit/react/bonus";

<AmbientField motif="grid" density="sparse">
  <h1>Content</h1>
</AmbientField>
```

### ColorSeedLab

Hue-graph lab for generating candidate brand packs.

```tsx
import { ColorSeedLab } from "tokenkit/react/bonus";

<ColorSeedLab
  initialHue={250}
  onGenerate={(pack) => console.log(pack)}
  onExport={(css) => downloadFile(css)}
/>
```

### Marquee (CSS-only)

No React component — use CSS data attributes directly.

```css
@import "tokenkit/css/bonus/marquee.css";
```

```html
<h1 data-marquee="gradient-text">Gradient Text</h1>
<div data-marquee="shimmer">Shimmer Effect</div>
```

## Import

```tsx
// All at once
import { OnionScrub, AmbientField, ColorSeedLab } from "tokenkit/react/bonus";

// Individual
import { OnionScrub } from "tokenkit/react/bonus/OnionScrub";
```

## CSS

Don't forget to import the CSS:

```css
@import "tokenkit/css";
@import "tokenkit/css/bonus/index.css";
```

Or selectively:

```css
@import "tokenkit/css/bonus/onion.css";
@import "tokenkit/css/bonus/ambient.css";
@import "tokenkit/css/bonus/seed.css";
@import "tokenkit/css/bonus/marquee.css";
```
