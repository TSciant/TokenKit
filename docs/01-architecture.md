> Ethos: [Browser truth](./00-browser-truth.md) -- the wireframe-level constitution this architecture enforces.

# Architecture

## Resolution order

A rule's layer decides who wins, not its selector. The order is declared once,
in `00-layers.css`, and must be the first CSS the browser sees:

```css
@layer reset, tokens, elements, shells, components, compositions, utilities;
```

Later layers beat earlier ones regardless of specificity. A composition can
adjust a component, and a component can adjust a shell, without anyone
escalating selectors or reaching for `!important`.

Inside the layers, most selectors are wrapped in `:where()`, which contributes
zero specificity. The effect is that overriding anything in the kit takes a
plain selector — you never have to out-specify it.

## Where values come from

Four floors, and only one of them is ours:

1. **The user.** `rem` resolves against the browser's font-size setting. We do
   not set `font-size` on `html`, because WCAG 1.4.4 is tested against exactly
   that setting. This floor is outside our control and that is correct.
2. **The UA stylesheet.** Normalised by `01-reset.css`, not eliminated.
3. **`@property` initial values** (`02-property.css`). Ground truth that
   survives a pack failing to load, plus a type that rejects a bad value at
   parse time instead of poisoning the declaration.
4. **`:root` and the packs.** The scales and the contract.

A custom property referenced in a component has no value in the abstract. It is
substituted at computed-value time, per element, against that element's
inherited cascade. The same declaration produces different computed values on
different elements. This is why context is the mechanism and not a metaphor.

## Two namespaces

```
--tk-*        The contract. Fixed slot names. Every component reads these and
              only these. Registered in 02-property.css.

--<brand>-*   Pack-private. Whatever the brand book actually calls things.
              Only the pack file reads them. Name them however you like.
```

A pack maps private values into contract slots. That indirection is the whole
reason applying a brand is a file swap rather than a component edit.

Two packs can be live in one document. Each scopes to its own `[data-brand]`,
and because properties resolve per element by inheritance, two subtrees resolve
independently with no conflict.

## Attributes, not classes

Props become attributes; CSS matches attributes.

```html
<div data-shell="grid" data-gap="5" data-cols="3">
```

Each attribute is one coordinate on one axis. Adding a gap step means adding a
rule; the markup does not change shape. The class-per-variant equivalent —
`grid grid--gap-5 grid--cols-3` — grows as the product of the axes, and every
new axis multiplies the existing set.

Defaults are styled as absences rather than as a modifier:

```css
:where([data-shell]) { --_gap: var(--tk-space-4); }   /* no data-gap present */
:where([data-gap="5"]) { --_gap: var(--tk-space-5); }
```

There is no `data-gap="default"`.

## Where this stops

Appearance can be resolved from context. Meaning cannot.

An accessible name is not an absence. `aria-expanded` cannot be unset and still
mean something. Focus order cannot be inferred from a missing attribute. Label
association is structural markup, not styling.

So: context resolves what a thing looks like; markup declares what a thing is.
Components carrying real interaction — dialogs, tabs, comboboxes, disclosure —
are where the second half dominates, and they are hand-written accordingly.
`src/react/primitives/Field.tsx` is the boundary in miniature: the styling is
attribute-driven, the `aria-describedby` wiring is not.

## Density

One knob, `--tk-density`, a unitless number. Components multiply their own
padding by it:

```css
--_pad: calc(var(--tk-space-5) * var(--tk-density));
```

Any ancestor can set it. Nothing is threaded through a component tree, and no
component knows what density it is in.
