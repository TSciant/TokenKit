# token-kit: library guidelines

token-kit 0.3.15. A token-driven design system: components draw only from
variables, so a brand, a density or dark mode is a change of variable mode,
never a change to a component. Generated from the kit's own documentation,
stories and component sources; the code is the original and Storybook shows
every component live.

## The rules that matter most

1. **Variables only.** Every fill, stroke, radius, gap, padding and text style
   comes from a variable in `tk`, `tk-density` or `tk-type`. A raw hex,
   a raw number or a local style is the one thing a pack, a density or dark
   mode cannot reach, so it is always wrong, even when it matches today.
2. **Grayscale first.** The `wireframe` and `wireframe-dark` modes are the
   working state. Structure and hierarchy have to read in gray before any
   brand is applied; colour reinforces meaning and never carries it alone.
3. **Change modes, not components.** Brand: the `tk` collection's mode
   (`wireframe`, `wireframe-dark`, `tk`, `door-shop`, `mohave`, `bathing-bagels`, `wandas`, `muncheese`). Density: `tk-density`
   (`default`, `compact`, `comfortable`). Never
   detach an instance to restyle it.
4. **Use the component, then its properties.** Reach for a variant or property
   before an override, and an override before a detach. A need no property
   covers is a gap in the kit worth reporting, not a one-off.
5. **Concentric radii.** A nested surface's radius is its parent's minus the
   gap between them, never larger; no more than three levels deep.
6. **Layout is shells.** Arrange with the seven layout shells (stack, row,
   inline, grid, split, sidebar, center) and their gap scale, not with
   absolute positioning or hand-set spacing.
7. **Words carry meaning.** A status says its state in words, an icon-only
   control has a name, and Do/Don't is marked by text and shape before colour.
8. **Nothing moves on its own.** No entrance animations or scroll reveals;
   motion answers an action, from the kit's motion slots only.
9. **Accessible by default.** Text contrast 4.5:1 (3:1 for large text and
   control boundaries), targets at least 24 px square,
   a visible focus ring, and layouts that reflow to 320 px wide.

## Tokens

Every slot a pack must fill, what reads it, and the constraint on its value.
Slot names are fixed across packs. `npm run lint:css` reports unfilled slots.

#### Surface

| Slot | Used for |
| --- | --- |
| `--tk-surface-base` | Page background |
| `--tk-surface-default` | Default content background |
| `--tk-surface-raised` | Cards, dialogs, anything above the page |
| `--tk-surface-sunken` | Wells, tracks, disabled fills |
| `--tk-surface-inverse` | Inverted sections |

#### Text

| Slot | Constraint |
| --- | --- |
| `--tk-text-primary` | ≥ 4.5:1 on every surface it can land on |
| `--tk-text-secondary` | ≥ 4.5:1 |
| `--tk-text-tertiary` | ≥ 4.5:1 — do not treat as decorative |
| `--tk-text-inverse` | ≥ 4.5:1 on `--tk-surface-inverse` |
| `--tk-text-disabled` | Exempt from 1.4.3, but keep it legible |

#### Line

| Slot | Constraint |
| --- | --- |
| `--tk-line-subtle` | Decorative only |
| `--tk-line-default` | Decorative only |
| `--tk-line-strong` | ≥ 3:1 — the boundary of anything a user operates (1.4.11) |

The split exists because 1.4.11 applies to UI component boundaries and not to
decorative rules. Inputs, outline buttons and interactive cards use
`--tk-line-strong`. Dividers and card edges use the others.

#### Action

| Slot | Constraint |
| --- | --- |
| `--tk-action-fill` | Primary control fill |
| `--tk-action-fill-hover` | |
| `--tk-action-fill-active` | |
| `--tk-action-text` | ≥ 4.5:1 against `--tk-action-fill` |
| `--tk-action-quiet-fill` | Usually `transparent` |
| `--tk-action-quiet-fill-hover` | |
| `--tk-action-quiet-text` | ≥ 4.5:1 against the surface behind it |

#### Focus

| Slot | Constraint |
| --- | --- |
| `--tk-focus-color` | ≥ 3:1 against every surface it can land on |
| `--tk-focus-width` | ≥ 2px |
| `--tk-focus-offset` | |

#### Status

Four families — info, success, warning, danger — each with `-line`, `-surface`
and `-text`. A grayscale pack has no hue to spend, so status is carried by the
boundary and the label. That is not a limitation of grayscale: 1.4.1 forbids
colour as the only carrier of meaning in any pack.

#### Scales

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

#### Private conventions

Inside a component file, `--_name` is component-local scratch: a value the
component computes from contract tokens for its own use.

```css
:where([data-tk="button"]) {
  --_pad-x: calc(var(--tk-space-4) * var(--tk-density));
  padding-inline: var(--_pad-x);
}
```

`--_*` is never read outside the file that sets it, and never by a pack.

## Composition

#### Seven shells

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

#### The rule

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

#### Containers, not breakpoints

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

#### Adding a component

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

## Accessibility

Target: WCAG 2.2 Level AA.

Automated tooling covers a minority of AA criteria — commonly cited figures put
it around a third, and that is a rough industry estimate rather than a measured
property of this kit. Plan for manual work on the rest.

#### What the kit gives you by construction

- `:focus-visible` outline on everything, never removed, only replaced
- `prefers-reduced-motion` honoured globally
- Root font size never overridden, so browser text settings work
- `--tk-target-min` at 24px, applied by every interactive primitive
- `--tk-line-strong` at ≥ 3:1 on control boundaries
- Status carried by boundary and label, not by colour alone
- Native controls kept native — checkbox, radio, select, `<dialog>`, `<details>`
- Logical properties throughout, so RTL works without a second stylesheet

#### What the gate checks

`npm run gate` mounts the fixture in every surface, density and brand context
and reads computed styles. It checks:

- Text on its effective background, at the correct threshold (4.5:1, or 3:1
  where the text genuinely qualifies as large — ≥ 24px, or ≥ 18.66px bold)
- Control boundaries against their background (3:1)
- Focus ring against the surface behind it (3:1)
- Meaningful fills against their track (3:1)
- Translucent colours composited against what is actually behind them

`npm run gate -- --zoom 200` re-runs with the root font size doubled.

#### What the gate does not check

Everything below needs a person.

| Criterion | Why it is manual |
| --- | --- |
| 1.3.1 Info and relationships | Whether markup matches visual structure |
| 2.1.1 Keyboard | Whether every control is reachable and operable |
| 2.4.3 Focus order | Whether the order makes sense |
| 2.4.11 Focus not obscured | Whether sticky chrome covers the focused element |
| 2.5.7 Dragging movements | Whether a single-pointer alternative exists |
| 3.2.6 Consistent help | Whether help appears in the same relative order |
| 3.3.7 Redundant entry | Whether the same information is asked for twice |
| 4.1.2 Name, role, value | Whether custom controls expose the right semantics |

#### WCAG 2.2 additions

These are the criteria that 2.1-era work most often misses.

**2.4.11 Focus Not Obscured (Minimum), AA.** A sticky header must not cover the
focused element. Use `scroll-margin-block-start` equal to the header height on
focusable content.

**2.5.7 Dragging Movements, AA.** Any drag interaction needs a single-pointer
alternative. The simplest compliance strategy is to not build drag interactions.

**2.5.8 Target Size (Minimum), AA.** 24×24 CSS px, or adequate spacing.
`--tk-target-min` is the floor; `--tk-target-comfortable` (44px) is better for
primary actions and for anything on a touch surface.

**3.2.6 Consistent Help, A.** If a help mechanism appears on multiple pages, it
appears in the same relative order.

**3.3.7 Redundant Entry, A.** Do not ask for the same information twice in one
process unless it is essential.

**3.3.8 Accessible Authentication (Minimum), AA.** No cognitive function test
without an alternative. Usually not applicable to a prototype — confirm rather
than assume.

#### Component checklist

Before a component is done:

- [ ] Operable by keyboard alone, in a sensible order
- [ ] Focus indicator visible on every focusable part, ≥ 3:1, not clipped
- [ ] Accessible name on every control, from a label or `aria-label`
- [ ] State exposed programmatically, not only visually
- [ ] Target ≥ 24×24 for anything clickable
- [ ] Reflows at 320px with no horizontal scroll
- [ ] Usable at 200% browser text size
- [ ] Nothing communicated by colour alone
- [ ] Pairs added to `tests/fixture.html`, `npm run check` green

## Practice

### Using Layout

- **Do:** Ask for a column count and let the grid fit what the space allows. In a narrow box three columns become one, without a breakpoint and without anyone deciding which phone is narrow.
- **Don't:** Don't fix a count the space cannot hold. Three columns forced into a phone's width are three slivers, and whatever is in them breaks a word a line.
- **Do:** Give the main content the larger share. A 2:1 ratio says which column is the page, and the aside still stacks under it when the space runs out.
- **Don't:** Don't split content and its aside in halves. Equal columns say they matter equally, and the reading column loses half its line length to a list of links.
- **Do:** Lay a component out by the box it is put in. This group of buttons stacks in a narrow rail on any screen, because it asks how wide its container is, not how wide the screen is.
- **Don't:** Don't let a row decide its layout from the screen. On a wide screen it stays a row, even inside a narrow rail, and the last button is cut off.
- **Do:** Put things in the source in the order they are read, and let the layout follow. A screen reader, a keyboard and a stacked phone layout all take that order, so it has to be the right one.
- **Don't:** Don't reorder with CSS to get a look. Reversed visually, the summary comes first on screen and second for everyone moving by keyboard or listening.
- **Do:** Line things up on one edge. The eye finds the start of each item where it found the last one.
- **Don't:** Don't centre one line, start the next at the edge and push the button to the other side. Three alignments make the reader look for each line separately.
- **Do:** When something is wider than the screen on purpose, a table, let it scroll in its own box, focusable so a keyboard can scroll it. The page around it stays put.
- **Don't:** Don't let one wide thing widen the page. Then everything scrolls sideways, every line of text runs off the screen, and reading means scrolling in two directions (WCAG 1.4.10).

### Using Colour

- **Do:** Design in the wireframe pack first. If the order of things reads in grey, from size, weight and space, colour can only add to it; a brand pack then changes the mood, not the meaning.
- **Don't:** Don't let colour do the work of hierarchy. A title that is only a different colour from its text is the same size and weight as it, and in grey, in print or to someone who does not see that hue it is just another line.
- **Do:** Say it in words and show it in shape, then colour it. An error is a message at the field and a heavier border; the colour is the third way of saying it, for the readers it helps.
- **Don't:** Don't mark a problem with colour alone. A red border tells someone who cannot tell red from grey nothing at all, and tells everyone else something is wrong but not what.
- **Do:** Keep the status colours for status: success, warning, danger, information. Then a reader who has learned that red means stop can trust it everywhere.
- **Don't:** Don't borrow the danger red to make something stand out. Used for decoration it stops meaning danger, and the next real error has to shout over it.
- **Do:** Leave the underline on links in running text. It is the signal; a pack's link colour, when it has one, is a second channel on top of it.
- **Don't:** Don't make a link a colour and nothing else. Among words of nearly the same lightness it disappears for anyone who does not see the hue, and nothing says it can be pressed until a pointer finds it.
- **Do:** Put text over a photograph or a gradient on a scrim. Its wash is solved against the lightest picture there could be, so the words stay readable whatever is underneath, and the contrast gate checks it.
- **Don't:** Don't set text straight onto a picture because it read well on the one you tried. The next picture has a light patch where the words are, and the screenshot never shows that one.
- **Do:** When something needs to be quieter, use the slot made for it: an outline or quiet button, secondary text. Each one is a pair the contrast gate has measured in every pack.
- **Don't:** Don't fade, lighten or mix a colour to get another one. A button at 55% opacity is a colour no pack chose and no gate measured, and here its label has dropped below the contrast it needs.

### Using Space

- **Do:** Keep what belongs together close, and put more space between groups than inside them. The date sits under its title; the paragraph is a step further off; the action further still. The reader sees three things, not five.
- **Don't:** Don't space everything the same. Even gaps say every line is its own thing, so the date floats between the title and the paragraph and belongs to neither.
- **Do:** Separate groups with space. A larger gap already says where one group ends, and it does so without adding a mark the eye has to read past.
- **Don't:** Don't rule a line between every group to make up for gaps that are too small. Lines between everything turn the list into a table, and they compete with the content for attention.
- **Do:** Give the main thing room. Space around the one action on the panel says it is the one, before anyone reads the label.
- **Don't:** Don't pack the important thing in with everything else. Squeezed between the text and the edge, the action reads as one more line.
- **Do:** Space things with the gap of the shell that holds them. The gap sits only between items, so the card's padding stays even on every side, whatever is last.
- **Don't:** Don't give each item its own margin. The last one carries its margin out to the edge, so the card has more room at the bottom than the top, and moving an item moves the problem with it.
- **Do:** Inset the content from the screen's edge once, by the gutter. On a phone every pixel of width is lines the reader does not have to scroll.
- **Don't:** Don't pad a band and then pad the content inside it too. Each layer meant well; together they take a quarter of a phone's width, and the title breaks a line earlier for nothing.
- **Do:** When a view needs to be denser, set density on it. Every gap, padding and control in it steps down together, so the rhythm survives at the smaller size.
- **Don't:** Don't shave padding off one part to make room. That part no longer matches the ones beside it, and the next person shaves another.

### Using Type

- **Do:** Pick the heading level for where the section sits in the page, and its look with a text style. Here both sections are h4s under the title's h3, because that is where they sit; the second is a small aside, so Heading's text makes it look like one, and a screen reader's list of headings keeps its shape.
- **Don't:** Don't choose a level for its size. An h5 because it should be small files Thanks under What changed, as if it were part of it; someone moving through the page by headings gets the wrong outline, and a level skipped for size is the same mistake one step further.
- **Do:** Let running text sit at the measure, about 45 to 75 characters a line (the kit's is 66). The eye finds the start of the next line without hunting for it.
- **Don't:** Don't make long lines readable by making the type smaller. Small type in a wide column is more characters per line, not fewer, and every return trip is longer.
- **Do:** Set running text flush left with a ragged right edge. Every line starts in the same place, and the spaces between words stay the size the face was drawn for.
- **Don't:** Don't centre or justify a paragraph. Centred lines each start somewhere new; justified ones stretch the spaces into gaps that run down the column. Centre a short title or a single line, if anything.
- **Do:** Use the eyebrow style for a word or two over a title. Short capitals, opened up a little, read as a label.
- **Don't:** Don't set a sentence in capitals. Words lose the shapes of their ascenders and descenders, every one becomes a rectangle, and the reader has to spell their way through.
- **Do:** Use italics for the title of a work, a term being defined, a word in another language. They mark a few words out from the sentence around them.
- **Don't:** Don't set a whole passage in italics to make it stand apart. Italic is slower to read at length, and once everything is marked nothing is.
- **Do:** Make one thing heavier: the fact the reader came for. Weight is the loudest thing type can do without changing size, so it works once per paragraph.
- **Don't:** Don't bold everything that matters. A paragraph of bold phrases has no emphasis left, only a texture, and the reader skims the bold and misses the sentence.

## Components

### Button

Button. Props land as attributes; CSS resolves look.

Progressive enhancement: - With `href` / `as="a"` it is a real link (works without JS). - `busy` is an enhancement on top of a still-valid disabled control. - `icon` + `iconPosition` bind one glyph; `leading` / `trailing` remain the open composition slots. Icon-only = icon with no label children.

*Use for:* a button; tone danger for destructive actions; with an icon and no text it is icon-only.

*Properties:* `variant`: `quiet` · `solid` · `outline`; `tone`: `neutral` · `danger`; `size`: `sm` · `md` · `lg`; `pressed`: flag; `full`: flag; `busy`: flag; `icon`: icon; `iconPosition`: `leading` · `trailing`.

- **Do:** Give each area (a form, a dialog, a card, a hero) at most one solid button: the thing most people came to do. The alternatives are outline or quiet. Not every area needs a solid button at all.
- **Don't:** Don't make two actions solid because both matter. Two equal weights is no emphasis: the reader has to read both to find the one they want, which is the job emphasis was supposed to do for them.
- **Do:** Start with a verb and name the result: Save changes, Send message, Add another address. A label someone can read on its own, without the form around it, is a label a screen-reader user can find in a list of buttons.
- **Don't:** Don't use Submit, OK, Continue on its own or Click here. They describe the act of pressing, which the reader already knows, and not what pressing does, which is the only thing they need.
- **Do:** When a dialog asks a question, label the buttons with its answer: Delete this project? is answered by Delete project and Keep project. The reader can act without re-reading the question.
- **Don't:** Don't answer with Yes and No. Taken alone they mean nothing, and a reader who skimmed the question has a coin to toss.
- **Do:** One to three words, written in sentence case. Casing is the pack's styling: an uppercase CTA (ArrowCta) is still written Save and continue, and the CSS does the rest, so the words stay right if the style changes.
- **Don't:** Don't write a sentence on a button, and don't Title Case it. Long labels wrap or truncate in narrow places, and capitals at every word slow reading without adding emphasis.
- **Do:** If it changes something here (saves, sends, opens a panel), it is a button. If it takes the reader somewhere, it is a link: give Button an href and it renders a real link, which shows its address, can be opened in a new tab and can be copied.
- **Don't:** Don't navigate from a button's click handler. It looks the same and behaves worse: no address on hover, no new tab, no copy link, and a screen reader announces a button where there is a destination.
- **Do:** Prefer leaving the button on and explaining what is missing when it is pressed. When the action really cannot happen yet, disable it with a reason: it stays reachable by keyboard and says why on focus and hover.
- **Don't:** Don't disable a button and leave the reader to work out why. A grey button with no explanation is a dead end, and before this kit kept disabled buttons focusable, a keyboard user could not even find it.
- **Do:** Use quiet danger for a destructive action that repeats (Remove beside each row) and save solid danger for the one confirmation that cannot be undone. The weight should match how final it is.
- **Don't:** Don't put a solid danger button on every row. A page of loud red buttons trains people to stop seeing them, which is the opposite of what danger is for.

Figma: node `37:332`.

### Chip

Chip. Baseline is a non-interactive label. Progressive layers: interactive → real button; pressed → aria-pressed; leading → icon/mark.

*Use for:* a small label: a tag, a status; interactive and pressed make it a filter.

*Properties:* `emphasis`: `default` · `strong` · `quiet`; `tone`: `info` · `success` · `warning` · `neutral` · `danger`; `interactive`: flag; `pressed`: flag; `icon`: icon.

Figma: node `37:393`.

### Eyebrow

Small uppercase label above a headline; optional leading icon as child.

*Use for:* a small uppercase label above a heading.

*Properties:* `emphasis`: `quiet`.

Figma: node `37:404`.

### Card

*Use for:* a surface; holds a card-header or card-title, card-body, card-footer and any other parts.

*Properties:* `variant`: `default` · `flat` · `bare`.

- **Do:** A card summarises one thing and leads to it: a title, a sentence or two, and the way in. The destination is a page; the card is the door.
- **Don't:** Don't put the whole article in the card. A card that needs paragraphs or its own headings is a page squeezed into a box, and a grid of them is a wall to read.
- **Do:** Make the title the link (CardTitle href). It is stretched over the card, so the whole card is the target, and the link is named by the title: a screen-reader user scanning a list of links hears where each one goes.
- **Don't:** Don't add a Read more link. Every card then has a link with the same name, so the list of links is Read more, Read more, Read more, and the title, which says where it goes, is not a link at all.
- **Do:** If the card is a link, anything else in it is a small, separate action (Save, a More menu), and it sits above the stretched link so it still works. If the card has several real actions, it is not a link: put the actions in the footer as buttons.
- **Don't:** Don't wrap a card in a link and then put buttons inside it. A control inside a link is invalid, the browser has to guess which one was meant, and the link's name becomes every word on the card. (Not shown live, because the markup itself is the mistake.)
- **Do:** Cards in a row share a shape: the same parts in the same order, so the eye compares content, not layout. A set should survive being reordered (or filtered) without any card looking out of place.
- **Don't:** Don't mix shapes in one row: a picture on one card, a button on the next, three lines of text on a third. Every difference has to be read before the content can be, and the row stops reading as a set.
- **Do:** CardTitle is a heading (h3 by default; set as to fit the page), so cards appear in a screen reader's list of headings under the section they belong to. Write it in sentence case, as you would say it.
- **Don't:** Don't fake a title with bold text, and don't Title Case it. The bold text looks the same and is missing from the headings list; capitals on every word slow reading and add nothing.

Figma: node `38:88`.

### Alert

*Use for:* a message with a status.

*Properties:* `status`: `info` · `success` · `warning` · `danger`; `title`: text.

- **Do:** Do it, say it's done, and offer Undo beside the message. One press puts it back.
- **Don't:** Don't ask first for something that can be put back. A question before every removal teaches people to say yes without reading it.

Figma: node `38:101`.

### Guidance

- **Do:** Set body text to the measure token. Somewhere near 66 characters is where the eye finds the next line without hunting for it.
- **Don't:** Don't let text run the full width of a wide container. Past roughly 90 characters the return sweep starts landing on the wrong line and readers lose their place.
- **Do:** Solid border, a check, and the word. Three channels, none of them colour.
- **Don't:** Dashed border, a cross, and the word. Still unmistakable with every hue in the panel identical.

Figma: node `38:121`.

### Field

Field. Baseline: labelled input. Progressive layers: hint → describedby; error → invalid + error text; required → announced; control=select|textarea → same wiring, native control (works without JS).

*Use for:* a labelled input, textarea or select; chars sizes it to the answer; options are a select's choices.

*Properties:* `label`: text; `hint`: text; `error`: text; `required`: flag; `optional`: flag; `control`: `input` · `select` · `textarea`; `chars`: `2` · `3` · `4` · `5` · `10` · `20` · `30`; `prefix`: text; `suffix`: text; `maxChars`: integer; `options`: list; `type`: `text` · `email` · `password` · `number` · `search` · `tel` · `url` · `date`; `readOnly`: flag.

- **Do:** Every field has a visible label above it, short and in sentence case, with no colon. It is still there after someone has typed, which is when they check what they typed against what was asked.
- **Don't:** Don't use the placeholder as the label. It vanishes on the first keystroke, leaving a filled box with no question; not every screen reader reads it; and its pale text usually fails contrast. This example has a hidden name so the page passes its checks, which a sighted reader never sees.
- **Do:** Use chars when the answer has a known length. A four-character box says a year is wanted before anyone reads the label twice.
- **Don't:** Don't stretch a short answer across the page. A full-width box for a year reads as a request for more than a year, and the eye has to travel to find where to type.
- **Do:** When most fields are required, mark the few that are optional, in words. The reader learns one exception instead of decoding a mark on every line.
- **Don't:** Don't put an asterisk on every field. When everything is marked, the mark carries no information, and an asterisk on its own means nothing until someone finds the key.
- **Do:** Put the error next to the field and write it as an instruction: what is wrong and what a right answer looks like. The reader can fix it without reading anything else.
- **Don't:** Don't say Invalid input. It tells the reader they failed and not why, so they guess, resubmit, and fail again.
- **Do:** If the reader needs to see a value they cannot change, make it read-only and say why. It stays readable at full contrast, reachable by keyboard, and is sent with the form.
- **Don't:** Don't disable a field to show a value. Disabled text is faint by design, a keyboard cannot reach it, a screen reader may skip it, and the value is not submitted.
- **Do:** Set type, autoComplete and inputMode. The browser fills what it already knows, a phone shows the right keyboard, and people who find typing hard type less. Leave paste alone, and leave the field empty unless there is a reason to pre-fill it.
- **Don't:** Don't leave a phone number as plain text with no hints, and never block paste on a field (a confirm-your-email box most of all). It looks the same and works worse: no autofill, a letter keyboard on a phone, and a password manager that cannot help.

Figma: node `38:200`.

### Meter

Meter. The value is exposed three ways: as text, as ARIA state, and as width. Width alone communicates nothing to a screen reader and nothing to anyone who cannot compare two bars.

Figma: node `38:231`.

### Modal

Modal on native dialog. showModal() for top-layer + focus trap; Escape and backdrop close; focus returns to the opener. Enter/exit motion is CSS on --tk-motion-enter / exit (see modal.css).

- **Do:** Tell people a thing worked, or didn't, where it happened, with an Alert in the page. They read it and carry on; nothing stands between them and the next thing they meant to do.
- **Don't:** Don't put a success, an error or a notice in a modal. It takes over the screen to say something that needed no answer, and its only button is the one that makes it go away.
- **Do:** Open a modal because someone pressed something that asked for it. They know where it came from and what it is for, and focus goes back to that button when it closes.
- **Don't:** Don't open one on its own: on load, on a timer, on the way out. It interrupts something the reader chose to do with something they didn't. The exceptions are the few that cannot wait, like a session about to end.
- **Do:** Title the modal with the words of the button that opened it, and label the action with what it does. A reader who sees only the buttons still knows what they are agreeing to. Cancel first, the action last.
- **Don't:** Don't ask Are you sure? and answer with Yes and No. The reader has to go back to the question to find out what Yes does, and the one who skims presses it.
- **Do:** Keep a modal to one short task: a name, a choice, a confirmation. If it needs more than that, it needs a page.
- **Don't:** Don't put steps, tabs or accordions in a modal. A wizard in a box has no back button and no address, and closing it by mistake loses every step at once. Use pages.
- **Do:** When the answer is wrong, keep the modal open and put the message at the field. What was typed is still there to fix.
- **Don't:** Don't close the modal and report the problem in the page. The reader has to open it again, find their place and type it all over.
- **Do:** Close, Escape and Cancel all leave without changing anything behind the modal. Knowing they can back out is what lets people open it in the first place.
- **Don't:** Don't take the way out away (dismissible={false}) to make someone answer a question they could skip. Keep it for the decision that has to be made, like a session about to end, and give it two actions that both close it.

Figma: node `38:283`.

### Figure

Figma: node `39:118`.

### Media

*Use for:* where a picture goes, drawn in the pack; label says what it stands in for.

*Properties:* `ratio`: `16 / 9` · `4 / 3` · `1 / 1` · `3 / 4` · `4 / 5` · `21 / 9`; `label`: text; `texture`: `hatch` · `dots` · `rule` · `grid` · `noise` · `weave` · `chevron` · `grain` · `paper` · `stone` · `mist` · `grit` · `halftone` · `brand` · `signature` · `none`; `subject`: `person`.

Figma: node `39:173`.

### Icon

Size is an attribute and the box is a token.

This used to be `const SIZE_PX = { sm: 16, md: 20, lg: 24 }` and `width={px} height={px}` — three numbers in TypeScript that a pack could not reach, a root font size could not move, and a reader at 200% zoom did not benefit from. The attribute gate found the tail of it: `data-size` was on the element and no selector in the kit answered it, so the attribute looked like the API and was decoration.

*Use for:* an icon on its own; give it a label only when it is the only thing saying what it means.

*Properties:* `icon`: icon; `size`: `sm` · `md` · `lg`; `label`: text.

- **Do:** Leave an icon decorative when text beside it already says the same thing. Pass no label and it is aria-hidden, so a screen reader reads the button once instead of twice.
- **Don't:** Don't ship an icon-only control with no label. Visually it is a glyph; to a screen reader it is a button with no name, and the guess it invites is rarely the right one.

Figma: node `39:189`.

### RailNav

Category navigation for a side rail: a header, and a panel of links with groups that open natively. It fills its container, so the rail's width is the page's decision. The current page is `aria-current="page"`, which is also what bolds it, so the styling cannot drift from what a screen reader hears.

Figma: node `31:43`.

### SiteHeader

Site chrome: brand, primary nav, optional mega sheet. Graceful small-box degradation via sheet — not a second mobile DOM.

Figma: node `54:245`.

### Masthead

01 — wordmark, nav, CTA, search.

Wide: inline nav (optional mega). Narrow: same facts in a sheet behind Menu. Graceful degradation, not a restructured mobile chrome.

Figma: node `69:393`.

### ProofStrip

07 — the proof strip.

Three claims run together as one pipe-delimited line read as a single run-on sentence to a screen reader. Three labelled figures say the same thing and can be navigated.

Figma: node `60:558`.

### PageHero

14 — breadcrumb over a tinted title band.

Figma: node `70:204`.

### SiteFooter

13 — the inverted closing band.

Figma: node `74:204`.

### ArrowCta

06 — the repeated conversion pattern. Uppercase label, trailing arrow.

Figma: node `76:255`.

### ContactCta

03 — the persistent conversion affordance in the header's trailing edge.

Figma: node `37:332`.

### HeroCarousel

05 — hero slider.

Does not auto-advance. 2.2.2 requires a pause control for anything that moves by itself, and a wireframe has nothing to prove by moving. The dots are real buttons with names rather than decorative spans.

Figma: node `135:760`.

### TileGrid

15 — dense catalogue grid, a short label over a plate.

Figma: node `82:577`.

### HubCards

16 — the alternate taxonomy: title, summary, read-more.

Figma: node `86:260`.

### CtaBlocks

17 — paired mid-funnel banners.

Figma: node `87:282`.

### MediaCards

19 — media promos with a type badge and a duration.

Figma: node `98:384`.

### FilterBar

18 — content-type filters.

A toggle-button group rather than styled links, so the active state is programmatic (aria-pressed) instead of a colour a screen reader cannot see.

Figma: node `99:319`.

### PeopleDirectory

20 — filter bar over a four-up person grid.

Figma: node `104:459`.

### EventList

24 — event rows: date, title, location, action.

Figma: node `106:421`.

### LeadForm

12 — the lead capture form.

Figma: node `114:519`.

### ApplyForm

25 — single-column form with a file input and a consent checkbox.

Figma: node `115:582`.

### SegmentPage

21 — the audience landing pattern.

Figma: node `118:533`.

### SubBrandPage

22 — portfolio and acquisition brand page.

Figma: node `119:549`.

### ArticlePage

23 — the long-form content template.

Figma: node `120:679`.

### FeatureGrid

09 — the capability grid.

A plain list of equal claims, each with a stand-in plate. The column count is a prop rather than a breakpoint: the grid is placed in a container and asked how many it should be, which is a question the page can answer and the viewport cannot.

Figma: node `129:584`.

### EventPromo

11 — split media and copy with one action.

Figma: node `131:589`.

### ArticleFeed

10 — the insights feed.

The title sits over the photograph, which is only defensible because the scrim bounds the worst case: text on bare photography cannot be contrast-checked and 1.4.3 still applies to it.

Figma: node `132:606`.

### HeaderSearch

04 — a disclosure that eases open instead of swapping the DOM.

Figma: node `137:740`.

### SectionNav

Local navigation: the pages beside this one, in a row under a hairline. Use for: the siblings in the section you are in (a product's overview, specs and support; a brand's pages). Don't use for: the site's primary navigation (use the masthead), the steps of a form (use a progress indicator), or switching views on one page (those are tabs, which are buttons). It fills its container and scrolls sideways instead of wrapping. The current page is `aria-current="page"`, which is also what marks it.

Figma: node `148:230`.

### OnThisPage

The contents of a long page, as a list of its headings. Use for: an article, a guide or a policy long enough to need a way back up, in a side rail. Don't use for: moving between pages (use a section nav or the rail nav) or for a page short enough to read without it. The heading you are at is `aria-current="location"`; marking it as the reader scrolls is the page's job, and this component only draws what it is told.

Figma: node `148:250`.

### MenuButton

A button that opens a short list of links or actions. Use for: a handful of related destinations or actions behind one control (More, Share, Account), where a mega menu would be a whole panel for six links. Don't use for: the site's primary navigation, a long or grouped list (use a mega menu or a rail nav), or choosing a value (that is a select). It is the disclosure pattern, not role="menu": the trigger has aria-expanded, the items are ordinary links and buttons, and Tab moves through them as everywhere else. Escape and a click outside close it; the arrow keys move between items.

Figma: node `148:299`.

### MegaMenu

Figma: node `151:753`.

### Faq

Strong disclosure stack for FAQ or additional information. Numbered triggers, plus/minus mark, measure-bound answers.

Figma: node `170:1051`.

### SearchResults

Search results surface: query field + typed icon chips + filtered list. Filter is plain case-insensitive includes — no fuzzy library.

Figma: node `172:308`.

### LogoLadder

Figma: node `173:513`.

### Plate

Figma: node `176:488`.

### Gradient

- **Do:** Put the text on a scrim and let the gradient be a ground. The scrim composites a wash whose alpha was solved against the lightest backdrop a photograph can produce, so it does not care what is underneath it — including a gradient whose ends it has never seen.
- **Don't:** Don't set text straight onto a gradient because it looked right in the screenshot. The ratio changes across the element, and the half that fails is the half nobody captured.

Figma: node `178:495`.

### Search

Header search that does not swap the DOM — input always mounted, collapses to zero inline size when closed (`inert` when collapsed).

Figma: node `137:740`.

### SkipLink

Skip to main content — hidden until focused. Page chrome outside the concentric chain.

Figma: node `181:476`.

### Arrow

The arrow that trails a primary call to action.

Inline SVG rather than an icon-font glyph or an Icon lookup: it is one path, it inherits `currentColor`, and it costs nothing. `aria-hidden` because the link text already says where it goes — an arrow that announces itself is an arrow read aloud on every CTA on the page.

Figma: node `180:1042`.

### Map

*Use for:* a place on a map, drawn by the kit's Map on the pack's basemap; label says what it shows, marker pins the centre.

*Properties:* `label`: text; `longitude`: number; `latitude`: number; `zoom`: number; `marker`: flag; `ratio`: `16 / 9` · `4 / 3` · `1 / 1` · `3 / 4` · `21 / 9`.

Figma: node `183:476`.

### SegmentList

08 — segment routing, as a real list.

Figma: node `185:476`.

### Tachometer

Token-driven tachometer — OutsideIn / QD lineage (P-12). Reads --tk-* CSS vars; canvas is decorative; role=meter + live text carry a11y.

Figma: node `186:485`.

### Shell

Figma: node `190:523`.

### Hero

26 — the static hero: the top of a page that is not a carousel.

Eyebrow, title, lede, actions and a visual, every one optional but the title, so the minimal hero is this component with less in it. `layout` is the one coordinate: stacked puts the visual under the copy, split puts it beside. The copy comes first in the DOM either way, so reading order is title, lede, actions, visual on both sides of the wrap. The visual is the page's largest paint, so the plate loads eagerly at high priority and holds its ratio so nothing shifts. Nothing animates in.

Figma: node `213:747`.

### InlineForm

Inline form — one field and its submit button on one line.

The shape behind newsletter sign-ups, "get the guide" boxes and the input-capture hero. It is a real <form>: Enter submits, it works without JavaScript when given an `action`, and the browser's own validation runs on `type` and `required`. The label is always there (visible unless hidden on purpose), the hint and error are tied to the field with aria-describedby, and the row wraps to a stack when the box is too narrow for both, field first, so the reading order never changes.

Figma: node `215:1393`.

### ButtonGroup

Button group — two or three related actions, and the rule for the rest.

The decisions are Carbon's, which the ds-corpus Button brief found to be the only system that writes them down: groups of two or three; past that a menu, not a fourth button; one weight of emphasis each (one solid, the others outline or quiet); every button the same width when they are a set. Order is reading order, in the DOM and on screen, at every width: the group wraps to a full-width stack in a narrow box without reversing anything, so focus order and reading order never disagree (WCAG 1.3.2, 2.4.3). That means a group aligned to the end is written "Cancel, Save", and stacks with Cancel on top. Destructive actions should not be the ones that overflow: a menu item cannot carry a tone. The More trigger takes the group's size, so it sits level with the buttons beside it.

Figma: node `217:142`.

### ButtonReason

- **Do:** Give each area (a form, a dialog, a card, a hero) at most one solid button: the thing most people came to do. The alternatives are outline or quiet. Not every area needs a solid button at all.
- **Don't:** Don't make two actions solid because both matter. Two equal weights is no emphasis: the reader has to read both to find the one they want, which is the job emphasis was supposed to do for them.
- **Do:** Start with a verb and name the result: Save changes, Send message, Add another address. A label someone can read on its own, without the form around it, is a label a screen-reader user can find in a list of buttons.
- **Don't:** Don't use Submit, OK, Continue on its own or Click here. They describe the act of pressing, which the reader already knows, and not what pressing does, which is the only thing they need.
- **Do:** When a dialog asks a question, label the buttons with its answer: Delete this project? is answered by Delete project and Keep project. The reader can act without re-reading the question.
- **Don't:** Don't answer with Yes and No. Taken alone they mean nothing, and a reader who skimmed the question has a coin to toss.
- **Do:** One to three words, written in sentence case. Casing is the pack's styling: an uppercase CTA (ArrowCta) is still written Save and continue, and the CSS does the rest, so the words stay right if the style changes.
- **Don't:** Don't write a sentence on a button, and don't Title Case it. Long labels wrap or truncate in narrow places, and capitals at every word slow reading without adding emphasis.
- **Do:** If it changes something here (saves, sends, opens a panel), it is a button. If it takes the reader somewhere, it is a link: give Button an href and it renders a real link, which shows its address, can be opened in a new tab and can be copied.
- **Don't:** Don't navigate from a button's click handler. It looks the same and behaves worse: no address on hover, no new tab, no copy link, and a screen reader announces a button where there is a destination.
- **Do:** Prefer leaving the button on and explaining what is missing when it is pressed. When the action really cannot happen yet, disable it with a reason: it stays reachable by keyboard and says why on focus and hover.
- **Don't:** Don't disable a button and leave the reader to work out why. A grey button with no explanation is a dead end, and before this kit kept disabled buttons focusable, a keyboard user could not even find it.
- **Do:** Use quiet danger for a destructive action that repeats (Remove beside each row) and save solid danger for the one confirmation that cannot be undone. The weight should match how final it is.
- **Don't:** Don't put a solid danger button on every row. A page of loud red buttons trains people to stop seeing them, which is the opposite of what danger is for.

Figma: node `220:142`.

### CardHeader

The top of a card: an eyebrow above the title, a subtitle under it, and one small action at the end (a MenuButton, a toggle). Lightning and PatternFly both put status and an action here; a card without them does not need a header and can use CardTitle on its own.

The action sits above a stretched title link, so a clickable card can still have its own menu, and a card with an action stops clipping its overflow so the menu can open past the card's edge.

- **Do:** A card summarises one thing and leads to it: a title, a sentence or two, and the way in. The destination is a page; the card is the door.
- **Don't:** Don't put the whole article in the card. A card that needs paragraphs or its own headings is a page squeezed into a box, and a grid of them is a wall to read.
- **Do:** Make the title the link (CardTitle href). It is stretched over the card, so the whole card is the target, and the link is named by the title: a screen-reader user scanning a list of links hears where each one goes.
- **Don't:** Don't add a Read more link. Every card then has a link with the same name, so the list of links is Read more, Read more, Read more, and the title, which says where it goes, is not a link at all.
- **Do:** If the card is a link, anything else in it is a small, separate action (Save, a More menu), and it sits above the stretched link so it still works. If the card has several real actions, it is not a link: put the actions in the footer as buttons.
- **Don't:** Don't wrap a card in a link and then put buttons inside it. A control inside a link is invalid, the browser has to guess which one was meant, and the link's name becomes every word on the card. (Not shown live, because the markup itself is the mistake.)
- **Do:** Cards in a row share a shape: the same parts in the same order, so the eye compares content, not layout. A set should survive being reordered (or filtered) without any card looking out of place.
- **Don't:** Don't mix shapes in one row: a picture on one card, a button on the next, three lines of text on a third. Every difference has to be read before the content can be, and the row stops reading as a set.
- **Do:** CardTitle is a heading (h3 by default; set as to fit the page), so cards appear in a screen reader's list of headings under the section they belong to. Write it in sentence case, as you would say it.
- **Don't:** Don't fake a title with bold text, and don't Title Case it. The bold text looks the same and is missing from the headings list; capitals on every word slow reading and add nothing.

Figma: node `222:150`.

### ChoiceCard

Choice card — a radio or checkbox drawn as a card.

For choosing between a few options that each need a sentence (plans, delivery speeds, a setup path). PatternFly calls these selectable cards and tiles; this one is built on the native input rather than imitating one, so the group, the arrow keys between radios, Space to toggle, required, form submission and the screen-reader announcement ("radio button, 2 of 3, checked") are all the browser's. The whole card is the label, so the whole card is the target. The native control stays visible: the dot or tick says "selected" without relying on the border's colour.

Figma: node `224:1407`.

### FieldAffix

- **Do:** Every field has a visible label above it, short and in sentence case, with no colon. It is still there after someone has typed, which is when they check what they typed against what was asked.
- **Don't:** Don't use the placeholder as the label. It vanishes on the first keystroke, leaving a filled box with no question; not every screen reader reads it; and its pale text usually fails contrast. This example has a hidden name so the page passes its checks, which a sighted reader never sees.
- **Do:** Use chars when the answer has a known length. A four-character box says a year is wanted before anyone reads the label twice.
- **Don't:** Don't stretch a short answer across the page. A full-width box for a year reads as a request for more than a year, and the eye has to travel to find where to type.
- **Do:** When most fields are required, mark the few that are optional, in words. The reader learns one exception instead of decoding a mark on every line.
- **Don't:** Don't put an asterisk on every field. When everything is marked, the mark carries no information, and an asterisk on its own means nothing until someone finds the key.
- **Do:** Put the error next to the field and write it as an instruction: what is wrong and what a right answer looks like. The reader can fix it without reading anything else.
- **Don't:** Don't say Invalid input. It tells the reader they failed and not why, so they guess, resubmit, and fail again.
- **Do:** If the reader needs to see a value they cannot change, make it read-only and say why. It stays readable at full contrast, reachable by keyboard, and is sent with the form.
- **Don't:** Don't disable a field to show a value. Disabled text is faint by design, a keyboard cannot reach it, a screen reader may skip it, and the value is not submitted.
- **Do:** Set type, autoComplete and inputMode. The browser fills what it already knows, a phone shows the right keyboard, and people who find typing hard type less. Leave paste alone, and leave the field empty unless there is a reason to pre-fill it.
- **Don't:** Don't leave a phone number as plain text with no hints, and never block paste on a field (a confirm-your-email box most of all). It looks the same and works worse: no autofill, a letter keyboard on a phone, and a password manager that cannot help.

Figma: node `228:1393`.

### FieldPassword

- **Do:** Every field has a visible label above it, short and in sentence case, with no colon. It is still there after someone has typed, which is when they check what they typed against what was asked.
- **Don't:** Don't use the placeholder as the label. It vanishes on the first keystroke, leaving a filled box with no question; not every screen reader reads it; and its pale text usually fails contrast. This example has a hidden name so the page passes its checks, which a sighted reader never sees.
- **Do:** Use chars when the answer has a known length. A four-character box says a year is wanted before anyone reads the label twice.
- **Don't:** Don't stretch a short answer across the page. A full-width box for a year reads as a request for more than a year, and the eye has to travel to find where to type.
- **Do:** When most fields are required, mark the few that are optional, in words. The reader learns one exception instead of decoding a mark on every line.
- **Don't:** Don't put an asterisk on every field. When everything is marked, the mark carries no information, and an asterisk on its own means nothing until someone finds the key.
- **Do:** Put the error next to the field and write it as an instruction: what is wrong and what a right answer looks like. The reader can fix it without reading anything else.
- **Don't:** Don't say Invalid input. It tells the reader they failed and not why, so they guess, resubmit, and fail again.
- **Do:** If the reader needs to see a value they cannot change, make it read-only and say why. It stays readable at full contrast, reachable by keyboard, and is sent with the form.
- **Don't:** Don't disable a field to show a value. Disabled text is faint by design, a keyboard cannot reach it, a screen reader may skip it, and the value is not submitted.
- **Do:** Set type, autoComplete and inputMode. The browser fills what it already knows, a phone shows the right keyboard, and people who find typing hard type less. Leave paste alone, and leave the field empty unless there is a reason to pre-fill it.
- **Don't:** Don't leave a phone number as plain text with no hints, and never block paste on a field (a confirm-your-email box most of all). It looks the same and works worse: no autofill, a letter keyboard on a phone, and a password manager that cannot help.

Figma: node `229:1393`.

### FieldCount

- **Do:** Every field has a visible label above it, short and in sentence case, with no colon. It is still there after someone has typed, which is when they check what they typed against what was asked.
- **Don't:** Don't use the placeholder as the label. It vanishes on the first keystroke, leaving a filled box with no question; not every screen reader reads it; and its pale text usually fails contrast. This example has a hidden name so the page passes its checks, which a sighted reader never sees.
- **Do:** Use chars when the answer has a known length. A four-character box says a year is wanted before anyone reads the label twice.
- **Don't:** Don't stretch a short answer across the page. A full-width box for a year reads as a request for more than a year, and the eye has to travel to find where to type.
- **Do:** When most fields are required, mark the few that are optional, in words. The reader learns one exception instead of decoding a mark on every line.
- **Don't:** Don't put an asterisk on every field. When everything is marked, the mark carries no information, and an asterisk on its own means nothing until someone finds the key.
- **Do:** Put the error next to the field and write it as an instruction: what is wrong and what a right answer looks like. The reader can fix it without reading anything else.
- **Don't:** Don't say Invalid input. It tells the reader they failed and not why, so they guess, resubmit, and fail again.
- **Do:** If the reader needs to see a value they cannot change, make it read-only and say why. It stays readable at full contrast, reachable by keyboard, and is sent with the form.
- **Don't:** Don't disable a field to show a value. Disabled text is faint by design, a keyboard cannot reach it, a screen reader may skip it, and the value is not submitted.
- **Do:** Set type, autoComplete and inputMode. The browser fills what it already knows, a phone shows the right keyboard, and people who find typing hard type less. Leave paste alone, and leave the field empty unless there is a reason to pre-fill it.
- **Don't:** Don't leave a phone number as plain text with no hints, and never block paste on a field (a confirm-your-email box most of all). It looks the same and works worse: no autofill, a letter keyboard on a phone, and a password manager that cannot help.

Figma: node `230:1396`.

### ModalDescription

- **Do:** Tell people a thing worked, or didn't, where it happened, with an Alert in the page. They read it and carry on; nothing stands between them and the next thing they meant to do.
- **Don't:** Don't put a success, an error or a notice in a modal. It takes over the screen to say something that needed no answer, and its only button is the one that makes it go away.
- **Do:** Open a modal because someone pressed something that asked for it. They know where it came from and what it is for, and focus goes back to that button when it closes.
- **Don't:** Don't open one on its own: on load, on a timer, on the way out. It interrupts something the reader chose to do with something they didn't. The exceptions are the few that cannot wait, like a session about to end.
- **Do:** Title the modal with the words of the button that opened it, and label the action with what it does. A reader who sees only the buttons still knows what they are agreeing to. Cancel first, the action last.
- **Don't:** Don't ask Are you sure? and answer with Yes and No. The reader has to go back to the question to find out what Yes does, and the one who skims presses it.
- **Do:** Keep a modal to one short task: a name, a choice, a confirmation. If it needs more than that, it needs a page.
- **Don't:** Don't put steps, tabs or accordions in a modal. A wizard in a box has no back button and no address, and closing it by mistake loses every step at once. Use pages.
- **Do:** When the answer is wrong, keep the modal open and put the message at the field. What was typed is still there to fix.
- **Don't:** Don't close the modal and report the problem in the page. The reader has to open it again, find their place and type it all over.
- **Do:** Close, Escape and Cancel all leave without changing anything behind the modal. Knowing they can back out is what lets people open it in the first place.
- **Don't:** Don't take the way out away (dismissible={false}) to make someone answer a question they could skip. Keep it for the decision that has to be made, like a session about to end, and give it two actions that both close it.

Figma: node `240:2219`.

### FieldWidths

- **Do:** Every field has a visible label above it, short and in sentence case, with no colon. It is still there after someone has typed, which is when they check what they typed against what was asked.
- **Don't:** Don't use the placeholder as the label. It vanishes on the first keystroke, leaving a filled box with no question; not every screen reader reads it; and its pale text usually fails contrast. This example has a hidden name so the page passes its checks, which a sighted reader never sees.
- **Do:** Use chars when the answer has a known length. A four-character box says a year is wanted before anyone reads the label twice.
- **Don't:** Don't stretch a short answer across the page. A full-width box for a year reads as a request for more than a year, and the eye has to travel to find where to type.
- **Do:** When most fields are required, mark the few that are optional, in words. The reader learns one exception instead of decoding a mark on every line.
- **Don't:** Don't put an asterisk on every field. When everything is marked, the mark carries no information, and an asterisk on its own means nothing until someone finds the key.
- **Do:** Put the error next to the field and write it as an instruction: what is wrong and what a right answer looks like. The reader can fix it without reading anything else.
- **Don't:** Don't say Invalid input. It tells the reader they failed and not why, so they guess, resubmit, and fail again.
- **Do:** If the reader needs to see a value they cannot change, make it read-only and say why. It stays readable at full contrast, reachable by keyboard, and is sent with the form.
- **Don't:** Don't disable a field to show a value. Disabled text is faint by design, a keyboard cannot reach it, a screen reader may skip it, and the value is not submitted.
- **Do:** Set type, autoComplete and inputMode. The browser fills what it already knows, a phone shows the right keyboard, and people who find typing hard type less. Leave paste alone, and leave the field empty unless there is a reason to pre-fill it.
- **Don't:** Don't leave a phone number as plain text with no hints, and never block paste on a field (a confirm-your-email box most of all). It looks the same and works worse: no autofill, a letter keyboard on a phone, and a password manager that cannot help.

Figma: node `241:144`.

### FieldReadOnly

- **Do:** Every field has a visible label above it, short and in sentence case, with no colon. It is still there after someone has typed, which is when they check what they typed against what was asked.
- **Don't:** Don't use the placeholder as the label. It vanishes on the first keystroke, leaving a filled box with no question; not every screen reader reads it; and its pale text usually fails contrast. This example has a hidden name so the page passes its checks, which a sighted reader never sees.
- **Do:** Use chars when the answer has a known length. A four-character box says a year is wanted before anyone reads the label twice.
- **Don't:** Don't stretch a short answer across the page. A full-width box for a year reads as a request for more than a year, and the eye has to travel to find where to type.
- **Do:** When most fields are required, mark the few that are optional, in words. The reader learns one exception instead of decoding a mark on every line.
- **Don't:** Don't put an asterisk on every field. When everything is marked, the mark carries no information, and an asterisk on its own means nothing until someone finds the key.
- **Do:** Put the error next to the field and write it as an instruction: what is wrong and what a right answer looks like. The reader can fix it without reading anything else.
- **Don't:** Don't say Invalid input. It tells the reader they failed and not why, so they guess, resubmit, and fail again.
- **Do:** If the reader needs to see a value they cannot change, make it read-only and say why. It stays readable at full contrast, reachable by keyboard, and is sent with the form.
- **Don't:** Don't disable a field to show a value. Disabled text is faint by design, a keyboard cannot reach it, a screen reader may skip it, and the value is not submitted.
- **Do:** Set type, autoComplete and inputMode. The browser fills what it already knows, a phone shows the right keyboard, and people who find typing hard type less. Leave paste alone, and leave the field empty unless there is a reason to pre-fill it.
- **Don't:** Don't leave a phone number as plain text with no hints, and never block paste on a field (a confirm-your-email box most of all). It looks the same and works worse: no autofill, a letter keyboard on a phone, and a password manager that cannot help.

Figma: node `242:2291`.

### TextStyles

Figma: node `254:157`.

### ShellRatio

Figma: node `262:145`.

### ScenePricing

Figma: node `283:156`.

### SceneSettings

Figma: node `287:236`.

### ChatPanel

ChatPanel — a conversation with an assistant, with the assistant left to the product: a transcript, a composer and a reply that streams in.

While a reply streams, Send becomes Stop; what had arrived stays, marked as stopped. A screen reader hears two things, not every word: "Answering…" when the question is sent, and the reply once it is finished. The transcript follows the newest text only while the reader is at its end; scrolled up, it stays where they are. A reply that fails says so in its place, with Retry. Starter questions are buttons, not a placeholder.

- **Do:** Offer up to three questions as buttons while the conversation is empty. They show what the assistant is for, and pressing one asks it.
- **Don't:** Don't put the suggestion in the placeholder. It vanishes on the first keystroke, it can't be pressed, and it sits where the reader's own question goes.
- **Do:** Say once, in the note above the conversation, what the assistant answers from and that it can be wrong. It stays in view, and every reply stays an answer.
- **Don't:** Don't open every reply with a disclaimer. Read once, it's useful; read on every answer, it's the part the reader learns to skip, and the answer starts a line later.
- **Do:** While a reply arrives, Send becomes Stop. Stopping keeps what had arrived and marks it, so the reader can ask something better without waiting out an answer they don't want.
- **Don't:** Don't leave the reader waiting with nothing to press. A disabled Send while a long answer streams means the only way out is to close the panel.
- **Do:** Say what went wrong where the reply would have been, with Retry beside it. The question stays, and asking again is one press.
- **Don't:** Don't drop the reply and leave a code by the composer. The question looks unanswered, the message says nothing a reader can act on, and trying again means typing it out again.
- **Do:** Give the assistant a name that says it's an assistant (Kit guide, Docs assistant). Readers weigh an answer differently when they know a model wrote it.
- **Don't:** Don't give it a person's name. A reader who thinks a colleague answered will trust it like one, and find out otherwise at the worst moment.
- **Do:** Label every turn with who said it, in text. It reads the same to everyone, in any pack and in forced colours, and a screen reader says it.
- **Don't:** Don't tell the turns apart by shade alone. Forced colours flatten the shade, a screen reader hears two paragraphs, and the reader has to work out who is talking.

Figma: node `289:1464`.

### Drawer

Drawer — a panel from the edge of the screen, on the native dialog.

Modal's anatomy and rules on a different surface: title, a body that scrolls between a fixed header and footer, actions, Close last in the markup; focus moves in when it opens and back to the opener when it closes. Modal by default (the page is blocked); `modal={false}` leaves the page usable beside it. A side drawer is a bottom sheet on a phone.

Figma: node `292:1547`.

### Pager

Pager — the way through a long list, one page at a time.

Worded links back and on ("← Newer conversations"), absent at the ends rather than disabled (there is nothing to press, so there is no button), and where you are between them. Every page is a link with its own address, so it works without JavaScript, can be shared and comes back with Back. Not for steps through a form: those are a form's own Continue and Back.

Figma: node `311:1608`.

### AlertAction

- **Do:** Do it, say it's done, and offer Undo beside the message. One press puts it back.
- **Don't:** Don't ask first for something that can be put back. A question before every removal teaches people to say yes without reading it.

Figma: node `311:1654`.

### Avatar

Avatar — someone's photo, or their initials.

Never a generic silhouette: forty identical grey heads say "unknown person" forty times, where initials tell the rows apart at a glance and read plainly as "no photo yet". Initials sit on the pack's inverse surface, one colour for everyone, because a colour picked from a name would mean nothing. A circle is a person; a square is an organisation, a team or a bot.

Figma: node `311:1565`.

### ChipTone

Figma: node `311:1607`.
