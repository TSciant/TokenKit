# Composition

## Seven shells

A shell answers one question: how children sit relative to each other. It never
styles children, and never sets colour or type.

| Shell | Behaviour |
| --- | --- |
| `stack` | Column, gapped |
| `row` | Row, wraps, top-aligned |
| `inline` | Row, wraps, centre-aligned — chips, links, button groups |
| `grid` | Auto-fit columns, collapses on available width |
| `split` | Two children, space-between, wraps |
| `sidebar` | One rail at a fixed basis, one fluid body |
| `center` | Measure-bounded column, auto margins |

Coordinates, all optional:

```
data-gap="0..9"           step on the space scale, default 4
data-cols="1..4"          grid target columns
data-fixed                grid holds the column count instead of collapsing
data-side="end"           sidebar rail on the trailing edge
data-width="narrow|wide"  center measure
data-align, data-justify  flex alignment
data-container            become a query container
```

## The rule

Any shell may contain any shell. A component is a shell holding primitives. A
page is a shell holding components. There is no third mechanism.

```html
<main data-shell="center" data-width="wide" data-gap="7">
  <section data-shell="split">
    <div data-shell="stack" data-gap="3">…</div>
    <button data-tk="button">Act</button>
  </section>

  <section data-shell="grid" data-cols="3" data-gap="5">
    <article data-tk="card">…</article>
    <article data-tk="card">…</article>
    <article data-tk="card">…</article>
  </section>
</main>
```

Most components in a library built this way are an assembly: a shell, one or
two primitives, and a few props. The expensive ones are the components carrying
keyboard interaction, and those are expensive for reasons that have nothing to
do with layout.

## Containers, not breakpoints

`card` and `media` declare themselves query containers, so their contents
respond to the component's own width:

```css
@container card (min-width: 30rem) {
  :where([data-tk="card"]) > :where([data-tk="card-title"]) {
    font-size: var(--tk-size-xl);
  }
}
```

The same card in a sidebar and in a full-width grid cell behaves correctly with
no breakpoint and no knowledge of the viewport.

Shells become containers only when asked (`data-container`), because
`container-type` applies containment and containment is not always wanted.

## Adding a component

`npm run new:component -- <Name>` writes steps 1 to 4 in this shape.

1. New file in `src/css/components/`, imported from `index.css`.
2. Everything inside `@layer components`, selectors wrapped in `:where()`.
3. Read `--tk-*` only. Local scratch is `--_name`.
4. Variants are attributes: `data-variant`, `data-size`, `data-emphasis`.
5. Interactive? Respect `--tk-target-min` and use `--tk-line-strong` for the
   boundary.
6. Add the pairs to `tests/fixture.html` with `data-check`.
7. `npm run check`.

The React wrapper, if you want one, maps props to attributes and does nothing
else. If a wrapper is computing class names, the CSS is wrong.

## Prop names

One name for one idea, so a prop learned on one component means the same on
the next.

- **A heading's level is `headingLevel`** on every component that renders a
  heading of its own (Accordion, Agenda, CaseStudy, CookieConsent, Faq,
  Pricing, ProfileHeader, QuestionList, ResourceDownload, SectionHeading,
  Callout, CareCard, EmptyState, Panel, SignIn). Heading itself takes `level`:
  it is the heading. The older `level` still works on the nine that had it,
  deprecated.
- **A status is `tone`**: `info`, `success`, `warning`, `danger` on Alert,
  Toast and Chip, and `neutral` or `danger` for a Button's consequence. Alert's
  `status` still works, deprecated. Other scales name what they measure:
  CareCard's `urgency`, DestructiveConfirm's `severity`. `variant` is for shape
  or layout, never for meaning.
- **A value is `value`, `defaultValue` and `onChange(value)`** (Combobox,
  DateInput, ChoiceGroup, the fields). Two older shapes stay for now: Tabs
  (`selected`, `defaultSelected`, `onSelect(id)`) and ChoiceCard
  (`onChange(value, checked)`, one card at a time).
- **Being open is `open` with a handler.** Modal and Drawer close with
  `onClose`; Search reports `onOpenChange(open)`. A new component that opens
  takes `open`, `defaultOpen` and `onOpenChange(open)`.
- **A frame's order:** a single control is label, control, hint, error; a
  group in a fieldset (ChoiceGroup, DateInput) is legend, hint, error, then
  its options. Every error says "Error:" to a screen reader first, and every
  required mark is the same (`field-parts.tsx`).

A deprecated name works until the next minor release, which removes it; a
patch never does.
