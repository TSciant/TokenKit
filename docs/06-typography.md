# Typography

The contrast gate made colour checkable. The type gate does the same for
typography, and the thing that makes it possible is
[Pretext](https://github.com/chenglou/pretext) — a text measurement and
line-breaking engine by Cheng Lou.

The point is not that Pretext lays out the text you ship. The browser does
that, with the real font metrics, off the main thread, better. The point is
that Pretext can answer *what will this string do at this width* without
rendering anything — so a measure token stops being an assertion and becomes a
measurement.

## What it found

`--tk-measure` was `68ch`. Measured, it renders at **80 characters per line**,
well past the comfortable band.

The reason is that `ch` is the advance width of the digit zero, which in almost
every typeface is wider than the average character. A measure set in `ch`
therefore always reads longer than its number suggests, and by a margin nothing
in the source discloses. `56ch` measures at 66 — the middle of the band, and
Bringhurst's ideal.

The same thing happened to a container query. The card's title stepped up at
`30rem`, chosen by eye. Measured, a representative title at the stepped-up size
does not fit on one line until `41.9rem`, so the old breakpoint bought presence
at the price of a wrap. It is now `42rem`, and the comment in `card.css` says
where that number came from.

Both of these were invisible to review and obvious to measurement.

## The band

45–75 characters per line, 66 ideal. This is a typographic convention with long
practice behind it rather than a result from a controlled study — treat it as a
well-supported norm, not a fact. The gate uses it because a defensible norm
enforced consistently beats an undefended number chosen per component.

Headings are exempt. A heading is scanned, not read, and the band does not
describe it.

## Running it

```bash
npm run type-gate                  # assert, exit 1 on failure
npm run type-gate -- --report      # also writes audits/type.json
npm run type-gate -- --zoom 200    # one root size
```

It checks:

| Check | What it asserts |
| --- | --- |
| Measure | `--tk-measure` and `--tk-measure-narrow` land inside the band |
| Zoom | The same holds at 100 / 125 / 150 / 200% root font size |
| Breakpoints | Reports where line counts actually change, for comparison with the declared container queries |
| Orphans | Reports a last line of one word — **never fails on it** |

Orphans are reported and not failed on deliberately. An orphan is a property of
the string, not of a token, and `text-wrap: balance` mitigates headings at
render in a way Pretext's raw line breaking does not model. A gate that fails
on something the author cannot fix is a gate people learn to ignore — the same
reason the contrast gate marks disabled text and decorative rules as exempt
rather than failing them.

## Where Pretext lives

A devDependency, and nothing else.

- **Storybook** imports it directly — `Tokens/Measure` runs the same
  measurements live, so a measure you are editing reports before you commit.
- **The gate** loads `tests/vendor/pretext.js`, a committed IIFE bundle built
  by `npm run build-pretext`. Pretext measures with a canvas, so it only runs
  in a browser; the gate drives headless Chromium against
  `tests/type-fixture.html`. The bundle is committed so the gate needs no build
  step in front of it.

It never appears in `src/css/`, never in a component, never in the bundle the
kit ships. Adding 46KB of layout engine to a page so it can lay out paragraphs
the browser already lays out would cost Lighthouse points for nothing.

## Adding a probe

The fixture carries one element per typographic role, styled by the kit, so
measurements come from the tokens rather than from values restated in the test:

```html
<p class="probe" data-role="body">…</p>
<h3 class="probe" data-tk="card-title" data-role="card-title">…</h3>
```

`window.measureSample(role, text, widthPx)` lays a string out in that role's
resolved font and returns line count, characters per line, and the last line.
`window.findBreakpoint(role, text, targetLines)` binary-searches the width at
which the string fits in a given number of lines — that is where a container
query belongs.

Add a role to the fixture, add it to the loop in `tools/type-gate.mjs`, run
`npm run check`.

## What this does not cover

Everything about type that is a judgement rather than a measurement: whether
the scale's ratio is right, whether the display face pairs with the body face,
whether the rhythm reads well. Pretext measures; it does not have taste.
