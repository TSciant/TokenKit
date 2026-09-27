# Token contract

Every slot a pack must fill, what reads it, and the constraint on its value.
Slot names are fixed across packs. `npm run lint:css` reports unfilled slots.

## Surface

| Slot | Used for |
| --- | --- |
| `--tk-surface-base` | Page background |
| `--tk-surface-default` | Default content background |
| `--tk-surface-raised` | Cards, dialogs, anything above the page |
| `--tk-surface-sunken` | Wells, tracks, disabled fills |
| `--tk-surface-inverse` | Inverted sections |

## Text

| Slot | Constraint |
| --- | --- |
| `--tk-text-primary` | ≥ 4.5:1 on every surface it can land on |
| `--tk-text-secondary` | ≥ 4.5:1 |
| `--tk-text-tertiary` | ≥ 4.5:1 — do not treat as decorative |
| `--tk-text-inverse` | ≥ 4.5:1 on `--tk-surface-inverse` |
| `--tk-text-disabled` | Exempt from 1.4.3, but keep it legible |

## Line

| Slot | Constraint |
| --- | --- |
| `--tk-line-subtle` | Decorative only |
| `--tk-line-default` | Decorative only |
| `--tk-line-strong` | ≥ 3:1 — the boundary of anything a user operates (1.4.11) |

The split exists because 1.4.11 applies to UI component boundaries and not to
decorative rules. Inputs, outline buttons and interactive cards use
`--tk-line-strong`. Dividers and card edges use the others.

## Action

| Slot | Constraint |
| --- | --- |
| `--tk-action-fill` | Primary control fill |
| `--tk-action-fill-hover` | |
| `--tk-action-fill-active` | |
| `--tk-action-text` | ≥ 4.5:1 against `--tk-action-fill` |
| `--tk-action-quiet-fill` | Usually `transparent` |
| `--tk-action-quiet-fill-hover` | |
| `--tk-action-quiet-text` | ≥ 4.5:1 against the surface behind it |

## Focus

| Slot | Constraint |
| --- | --- |
| `--tk-focus-color` | ≥ 3:1 against every surface it can land on |
| `--tk-focus-width` | ≥ 2px |
| `--tk-focus-offset` | |

## Status

Four families — info, success, warning, danger — each with `-line`, `-surface`
and `-text`. A grayscale pack has no hue to spend, so status is carried by the
boundary and the label. That is not a limitation of grayscale: 1.4.1 forbids
colour as the only carrier of meaning in any pack.

## Scales

Brand-independent, in `03-scale.css`. A pack may override them but most should
not — a brand usually changes appearance, not proportion.

- `--tk-space-0` … `--tk-space-9` — 0, 4, 8, 12, 16, 24, 32, 48, 64, 96px
- `--tk-size-xs` … `--tk-size-4xl` — 12 … 48px, all rem
- `--tk-leading-*`, `--tk-tracking-*`, `--tk-weight-*`
- `--tk-radius-none|sm|md|lg|full`
- `--tk-duration-*`, `--tk-ease-*`
- `--tk-measure` (56ch, measured at ~66 CPL), `--tk-measure-narrow` (46ch, ~54 CPL) — set by `npm run type-gate`, see [Typography](06-typography.md)
- `--tk-target-min` (24px, WCAG 2.5.8), `--tk-target-comfortable` (44px)
- `--tk-density` — unitless multiplier, default 1

## Private conventions

Inside a component file, `--_name` is component-local scratch: a value the
component computes from contract tokens for its own use.

```css
:where([data-tk="button"]) {
  --_pad-x: calc(var(--tk-space-4) * var(--tk-density));
  padding-inline: var(--_pad-x);
}
```

`--_*` is never read outside the file that sets it, and never by a pack.
