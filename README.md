# <img src=".storybook/static/wordmark.svg" alt="token kit" height="44">

A token-driven CSS design system at **wireframe fidelity**. Primitives, seven
layout shells, and headless gates that check the system rather than a palette.

It is client-neutral on purpose. The kit is a starting point, not a delivery:
fork it, add that client's primitives and components beside the kit's own, and
ship the fork. The client gets the kit plus their work and nothing built for
anyone else. Adding is the only move; the kit's own files stay as they are, so
the next fork starts from the same place.

**Tokens are atoms. Primitives read only tokens and the box. Brand is a pack.
One DOM, no Monty. Accessibility is gated in context. Jackets subscribe. The
browser is the truth** -- where intention and production become an experience,
not an artifact in a domain tool.

That constitution is [Browser truth](docs/00-browser-truth.md). Architecture,
contract, and gates enforce it; Storybook's **Ethos** section renders it.

**Delivering against a statement of work?** [DELIVERABLES.md](DELIVERABLES.md)
maps each line item to the command that proves it, and `npm run check:delivery`
runs the lot.

No framework required. React wrappers are included and optional -- they map
props to attributes and add nothing else.

## What it is

```
src/css/
  00-layers.css      cascade layer order
  01-reset.css       normalize, nothing more
  02-property.css    @property registrations — types, fallbacks, interpolation
  03-scale.css       space, type, radius, motion, target size
  04-elements.css    bare HTML defaults, zero specificity
  packs/             colour and anything else a brand owns
  shells/            seven layout containers
  components/        one file per component
src/react/
  primitives/        optional prop-to-attribute wrappers, with stories
  patterns/          composed patterns — chrome, marketing, catalog, templates
  shells/            the seven shells as React
  motion/            the fx system, optional
src/tokens/          the token stories — ramp, contract, scales, measure, contrast
src/foundations/     layers, context, composition, scrim, concentric corners
src/samples/         page compositions and the clickable prototype
src/lib/contrast.mjs WCAG maths, one copy, shared by browser, Storybook and CI
.storybook/          config; pack / density / root size are toolbar globals
next/                the page compositions as a Next.js app, for Lighthouse
tools/               gate, lint, bundle, serve, capture, audit, onionskin
```

## WordPress

The kit does **not** ship Gutenberg code. WordPress’s standard unit is the **block**
(plus **block patterns**) — not “story blocks.” A short handoff for implementers:

→ [docs/07-wordpress-blocks.md](docs/07-wordpress-blocks.md)

## Install and run

```bash
npm install
npx playwright install chromium   # for the gate and the audit tools
npm run storybook
```

Storybook is the demo. Tokens are the first four sections, because that is what
the kit is: the ramp, the contract, the scales, and a live contrast guard —
every value read from computed styles, in whatever context the toolbar is set
to.

### Ports

Both servers derive their port from the project folder's name, hashed into
20000-29999, rather than taking a default. Two checkouts on a machine never
collide and nothing lands on a port another project wants. For a folder called
`tokenkit`:

| Command | Port |
| --- | --- |
| `npm run storybook` | 27979 |
| `npm run serve` | 27978 |

Before binding, both refuse anything on the reserved list in `tools/port.mjs` —
astro on 5918, Storybook's own 6006, ComfyUI on 8188, ollama on 11434 and the
rest — then probe upward until something is free.

```bash
npm run storybook -- --why       # print the port, start nothing
npm run storybook -- --port N    # pin it
npm run serve -- --why
```

`serve` is not the demo. It exists for the contrast fixture and anything built
into `dist/`; its root lists what is actually on disk, so a documented path
cannot go stale.

## Use

```js
import "tokenkit/css";
```

```html
<body data-brand="wireframe">
  <div data-shell="stack" data-gap="5">
    <div data-tk="card">
      <h3 data-tk="card-title">Title</h3>
      <p data-tk="card-body">Body copy.</p>
    </div>
    <button data-tk="button" data-variant="outline">Action</button>
  </div>
</body>
```

Or with the React wrappers:

```tsx
import { Stack, Card, CardTitle, CardBody, Button } from "tokenkit/react";

<Stack gap={5}>
  <Card>
    <CardTitle>Title</CardTitle>
    <CardBody>Body copy.</CardBody>
  </Card>
  <Button variant="outline">Action</Button>
</Stack>
```

## Scenes

A scene is a component described as data: `{ title, brand, root }`, each part
a `kind` (card, field, button, the shells…) with its words and its options.
The kinds and the options each takes are generated from the components' own
prop types (`tools/gen-scene-vocabulary.mjs`), so a scene can only say what the
kit can draw. Whatever comes in, from a model's function call, pasted JSON or
a file, is sanitized first, and what the kit doesn't have is named in the notes.

```tsx
import { Scene, SceneLayers, cleanScene } from "tokenkit/react";
import { sceneSchema } from "tokenkit/scene";   // a JSON Schema for any function-calling API

<Scene scene={json} />   // drawn with the real Card, Field, Button…
```

`node tools/scene-figma.mjs <scene> --width 480` prints the script that builds
the same scene in Figma from the kit's components and variables, and the onion
check lays one over the other.

## Onion skin

The Figma file and the code are meant to be the same object, and a claim like
that is only worth something if you can check it. Storybook's toolbar has an
**Onion** switch: it lays the Figma design, exported at 1x, over the live
component. Overlay has opacity and blend controls, Difference is black where the
two agree, and Split puts a seam through it. Controls drive it, so changing
`variant` or `size` swaps the skin to the matching Figma variant.

```bash
npm run figma:manifest        # every component's props, mapped to Figma property types
node tools/onion-skins.mjs Button   # figma/sheets/Button.{png,json} -> figma/skins/Button/*.png
```

`figma/skins/` are the skins, `figma/verdicts/` is what was found comparing them
(what was aligned, what was accepted and why), and `figma/keys.json` maps each
component to its Figma node. The switch is off by default, the skins are only
served to Storybook, and nothing in `src/` imports any of it. Text antialiasing
is the one difference you will always see: Chromium draws coloured subpixel
fringes and Figma draws greyscale.

## Type

The kit sets in **Manrope**, self-hosted, four subset weights at about 14KB
each. It is the *kit's* face, not a brand's — a brand pack remaps
`--tk-font-sans` like any other slot. The browser default stack is not a
neutral choice, it is an absent one, and a wireframe set in it gets reviewed
as an unstyled document instead of as a structure.

Manrope is Mikhail Sharanda's, under the SIL Open Font License 1.1: the licence
sits beside the font files (`src/css/fonts/files/OFL.txt`), `NOTICE.md` lists
it with the kit's other third-party material, and `src/css/fonts/manrope.css`
records the full provenance, what the face is good at, and the one thing it is
not (capital I and lowercase l are the same bare stem; l stands 2% taller).

Choosing the face moved a measured token, which is the point of having
measured it: `ch` is the advance of `0`, so `--tk-measure: 56ch` went from 66.7
to 69.3 characters per line. It is `53ch` now, back at 66.7 and stable at 100,
125, 150 and 200% root size. The fallback carries `size-adjust: 103.53%` and
matching ascent/descent overrides derived from the two fonts' metrics, so the
swap costs no layout shift.

Leading and tracking step with the size instead of sitting at one value for the
whole ramp. One tracking value from caption to display is the loudest tell that
a scale was listed rather than drawn.

## Scrim

Text over an unknown photograph is usually either moved off the image or given
a gradient and an assurance. There is a third option: the image is unknown but
**bounded** — no pixel is lighter than white — so a wash of known colour and
known alpha has a computable worst case, and the worst case is all a success
criterion needs.

```
ratio    max channel   alpha    measured
3:1      148.9         0.42     3.03:1    1.4.3 large text
4.5:1    118.6         0.54     4.61:1    1.4.3 normal text
7:1       89.0         0.66     7.23:1    1.4.6 AAA
```

The alphas are solved, not chosen, and `npm run gate` composites each one over
pure white in every pack, surface and density rather than trusting the table.
The article feed puts its card titles back over the media because of this.

The gate earned its keep here immediately: the first version borrowed
`[data-on="inverse"]` for the text, which means *the opposite of this pack* —
light ink in a light pack and dark ink in a dark one — while the wash is the
pack's darkest value in both. Under `wireframe-dark` that was near-black on
near-black at 2.28:1, and it looked fine in the light pack the whole time. A
scrim paints its own ground, so it cannot borrow a context; it owns one.

## Textures

Three SVG masks — hatch, dots, rule — for the surface interest that stops a
grayscale wireframe reading as unfinished. Masks rather than background images,
because an SVG data URI cannot read `currentColor`: shipped as a background a
texture carries its own colour and needs one copy per pack, which is the exact
coupling the kit exists to remove. As a mask the shape is kit-owned and the ink
is `--tk-texture-ink`.

```html
<div data-texture-overlay="hatch">…</div>
```

All three are decorative, none carries information, and all drop out under
`prefers-contrast: more`.

## Composition

`Foundations/Composition` is the argument for shells, in three stories. Seven
shells at depth four are 7^4 arrangements with no combinatorial CSS, and the
reason is narrower than "it composes" — every system can nest. It is that a
shell's output is a function of its own attributes and its own available inline
size, and nothing else: not the viewport, not a parent's class, not a prop
threaded down a tree.

The third story is the proof rather than the claim. The same six tiles in a
three-column grid, in a half-width parent, on a wide screen: the intrinsic grid
folds to one column, and the identical `repeat(3, 1fr)` with a `max-width`
media query stays at three and crushes them, because it is answering a question
about the window rather than about itself. That is the structural argument for
container queries and intrinsic sizing, and it is why nesting stays closed here.

## The three rules

**1. Values live in one place.** Components read `--tk-*` and never contain a
colour, a spacing value, or a size. `tools/lint-tokens.mjs` fails the build if
one does.

**2. Props are coordinates, not branches.** A prop becomes an attribute and CSS
matches on the attribute. `data-shell="grid" data-gap="5" data-cols="3"` is a
point in a small space; the class-per-variant equivalent grows combinatorially.

**3. Context resolves, components don't decide.** A custom property is
substituted at computed-value time, per element. The same component inside
`[data-density="compact"]` on a sunken surface computes different values
without knowing either fact. Themes, densities and surfaces are ancestors, not
props threaded through a tree.

## Commands

| Command | What it does |
| --- | --- |
| `npm run storybook` | The demo — tokens, foundations, shells, components |
| `npm run build-storybook` | Static build into `storybook-static/` |
| `npm run lint:css` | No colour literals outside packs, no undeclared tokens, no unfilled pack slots |
| `npm run gate` | Contrast gate — every pair, in every context, from computed styles |
| `npm run gate -- --zoom 200` | Same, with the root font size doubled (WCAG 1.4.4) |
| `npm run gate:report` | Also writes `audits/contrast.json` |
| `npm run type-gate` | Type gate — characters per line, measured with Pretext |
| `npm run type-gate -- --zoom 200` | Same, at doubled root font size |
| `npm run gates` | The story gates below, in one browser pass over the built Storybook |
| `npm run a11y` | axe-core over every built story at two viewports, with an exit code |
| `npm run radius` | Concentric corners — inner radius = outer radius − the gap |
| `npm run controls` | Every component story exposes controls, asked of the running preview |
| `npm run attrs` | Every `data-*` value in the DOM is one a selector answers to |
| `npm run properties` | Every `@property` in 02-property.css actually registered |
| `npm run gen:stories` | Regenerate story controls from the components' prop types |
| `npm run gen:stories -- --check` | Fail if any generated story is stale |
| `npm run next:build` | Production Next.js build of the page compositions |
| `npm run next:dev` | The same app, on a dev server |
| `npm run lighthouse` | Lighthouse over the built routes, mobile, Slow 4G, threshold 95 |
| `npm run check` | Every gate, then a pass/fail summary. Keeps going after a failure so one run shows everything. Run it before merging — there is no CI config in the repo. |
| `npm run check:delivery` | `check`, then the Next build and Lighthouse. The full claim. |
| `npm run bundle` | `dist/tokenkit.css`, with its font files beside it in `dist/assets/` |
| `npm run resume` | The resume site: `dist/resume.html` and the Loops and Flows page — see docs/08-resume.md |
| `npm run capture -- --slug <s> --urls <file>` | Reference screenshots + measured inventory of an existing site |
| `npm run audit -- --slug <s>` | Turn the inventory into a component audit |
| `npm run onionskin -- --slug <s> --rebuild <url> --map /=<ref>` | Overlay rebuild on reference |

## The contrast gate

Most contrast checks test a list of colours. This one loads a fixture in
headless Chromium, mounts the same markup in every surface, density and brand
context, and reads `getComputedStyle` after the cascade has resolved. It
catches the failure a palette check structurally cannot: a token that is fine
at `:root` and fails two levels down.

```
tokenkit contrast gate — 190 pairs, root font-size 16px

      PAIR                      CONTEXT                        KIND        RATIO
ok    button/outline boundary   wireframe / default / default  nonText     3.95:1 (needs 3:1)
ok    button/outline boundary   wireframe / sunken / default   nonText     3.11:1 (needs 3:1)
```

That second row is the point. The same token, two contexts, and a margin that
went from comfortable to 0.11 above the floor. Nothing in the source says so.

Add a pair by adding `data-check` to an element in `tests/fixture.html`. The
fixture declares what to assert; the gate executes it.

## The type gate

The same idea applied to typography, using
[Pretext](https://github.com/chenglou/pretext) — a text measurement and
line-breaking engine. Not to lay out the text you ship; the browser does that
better. To answer *what will this string do at this width* without rendering,
so a measure token stops being an assertion.

It caught two things review had not:

- `--tk-measure` was `68ch` and rendered at **80 characters per line**. `ch` is
  the advance width of the digit zero, wider than the average character, so a
  measure in `ch` always reads longer than its number. `56ch` measures at 66.
- The card's container query was at `30rem`, chosen by eye. A representative
  title at the stepped-up size does not fit on one line until `41.9rem`, so the
  old value bought presence at the price of a wrap. It is `42rem` now.

```
tokenkit type gate — 27 checks, band 45-75 CPL

      ROOT   ROLE                  WIDTH    LINES  CPL
ok    16px   body                  570px    7      66.7
ok    32px   body                  1140px   7      66.7
```

Pretext is a devDependency. Storybook imports it for `Tokens/Measure`; the gate
loads a committed IIFE bundle because Pretext measures with a canvas and only
runs in a browser. It never enters `src/css/` and never ships.

## The patterns

Primitives are not a page. `src/react/patterns/` holds the composed patterns —
the things a page is actually made of — in four files by family:

| File | What is in it |
| --- | --- |
| `chrome.tsx` | Masthead, mega menu, header search, page hero, footer — what every page carries |
| `marketing.tsx` | Hero carousel, arrow CTA, proof strip, segment list, feature grid, article feed, event promo |
| `catalog.tsx` | Tile grid, hub cards, CTA blocks, filter bar, media cards, people directory, event list |
| `templates.tsx` | Lead form, apply form, segment page, sub-brand page, article page |

Every one is parameterised: content and shape arrive as props with defaults, so
a different client is a different set of arguments rather than a fork of the
source. `src/samples/` assembles them into the five page compositions and the
clickable prototype, and `next/` serves the same components as real routes.

They came out of the method in *Auditing an existing site* below — capture a
site, rank what repeats, rebuild the load-bearing parts. "1:1" there means
structural, not pixel: the same content slots, reading order and interaction,
rendered in grayscale on the kit's scales. A fork runs that method again
against its own client, and adds what it finds to these four files or beside
them.

Rebuilding is where accessibility gets decided, and the kit takes the departure
wherever the source pattern and the success criterion disagree:

- The mega menu opens on click and closes on Escape. Hover-only disclosure
  fails 2.1.1.
- The hero does not auto-advance; 2.2.2 would require a pause control. Its
  pager dots are real buttons with names, not decorative spans.
- The proof strip is three labelled statistics in a description list, not one
  pipe-delimited sentence a screen reader hears as a run-on line.
- Required fields are stated in text as well as marked — 1.4.1 forbids colour
  as the only carrier.
- Article cards keep their titles over the photograph. That is only defensible
  because the scrim bounds the worst case; text on bare photography cannot be
  contrast-checked and 1.4.3 still applies to it.

Stories are written out as literal objects rather than produced by a helper.
Storybook indexes statically — it reads exports without running the module — so
a `name` returned from a function call never reaches the sidebar and the index
falls back to the export identifier.

Every story in the kit is clean under axe at WCAG 2.0/2.1/2.2 A and AA plus
best practice, checked by `npm run a11y`.

There is one exclusion, `[data-tk="scrim-content"]`, and it is a tool
limitation rather than a concession: axe resolves a backdrop by walking up for
an opaque background and does not composite pseudo-elements, so it cannot see a
scrim's wash at all and reports the plate underneath at 1.27:1. That region is
checked by the contrast gate instead, against a harder bound than axe applies
anywhere.

## Adding a brand

Copy `src/css/packs/_template.css`, fill in the private ramp, map it to the
contract slots. Components do not change. Two packs can be live on one page at
once — put each brand's selector on a different subtree.

`packs/wireframe-dark.css` is the worked example: it is not a theme bolted onto
the kit, it is a second pack reading the same fourteen greys and mapping them
differently. If dark mode is a pack swap, so is a brand.

Two things a pack must do that are easy to miss, both caught by the gate rather
than by review:

- **Fill the inverse context.** `[data-on="inverse"]` needs the complete slot
  set. Remap only the text colour and quiet buttons render as invisible ink —
  which reads like a missing element, not a contrast bug.
- **Paint.** Custom properties inherit, but an already-computed inherited
  property does not re-resolve further down. A pack scoped to a subtree has to
  re-declare `color` and `background-color` or descendants keep the outer
  pack's ink on the inner pack's ground.

```css
@layer tokens {
  [data-brand="acme"] {
    --acme-navy-700: #1b2a4a;      /* pack-private: name it however the brand does */
    --tk-text-primary: var(--acme-navy-700);   /* contract: fixed slot */
  }
}
```

`npm run lint:css` reports any contract slot a pack leaves unfilled.

## Starting an engagement

`master` is the kit and only the kit. An engagement is a branch cut from it:

```bash
git switch -c client/acme/site-relaunch master
```

The client is whoever the agreement is with; the engagement is one piece of
work for them, and a client with two pieces of work gets two branches. That
branch fills `src/client/` and changes nothing above it. So `git merge master`
brings kit improvements forward without touching a line of the engagement's own
code, and the delivery is that branch and no other.

A brand is a pack. Everything else is additive the same way: new primitives,
new patterns, new pages, all under `src/client/`. Nothing in the kit is edited
to make room for them, which is what keeps one delivery from carrying the last
one.

When something built for an engagement turns out to be general, promote it: move
it up out of `src/client/`, commit it on `master`, merge `master` back into the
engagement branch. That direction is safe and it is how the kit grows. The other
direction — writing an engagement's requirement into a kit file — is the one
that entangles the two, and `npm run neutral` and `npm run boundary` exist to
catch it.

Read `NOTICE.md` before signing anything. It is short and it is the reason the
boundary is drawn where it is.

## Auditing an existing site

```bash
npm run capture -- --slug acme --urls audits/acme/urls.txt
npm run audit -- --slug acme
# build against the audit, then:
npm run onionskin -- --slug acme --rebuild http://localhost:3000 --map /=acme-com
```

`capture` records screenshots at four breakpoints and measures what the site is
made of — type sizes in use, colours in use, spacing values, and repeating DOM
structures ranked by how many pages they appear on. `audit` turns that into a
markdown draft with the component candidates already ranked by frequency.
A structure on six pages is a component; one on a single page is a page.

`onionskin` puts the rebuild over the reference with a blend/difference/side
switch and a notes field per plate. Notes are stored per breakpoint and print
with the page.

## Docs

- [Architecture](docs/01-architecture.md) — layers, resolution order, why attributes
- [Token contract](docs/02-token-contract.md) — every slot, what fills it, what reads it
- [Composition](docs/03-composition.md) — the seven shells and how components assemble
- [Accessibility](docs/04-accessibility.md) — WCAG 2.2 AA, what is automated and what is not
- [Audit method](docs/05-audit-method.md) — capture, inventory, rebuild, compare
- [Typography](docs/06-typography.md) — the type gate, Pretext, and what it caught

## Browser support

Uses `@layer`, `@property`, `@container`, `:where()`, `:has()`, `text-wrap`,
`field-sizing`, and logical properties. Current evergreen browsers. No
polyfills and no build step required — the CSS runs as authored.

For production, bundle the CSS rather than shipping the `@import` chain;
`00-layers.css` must remain first in the output.

## License

The kit's own code and docs are under the MIT License (`LICENSE`). Three
third-party pieces ship inside it under their own licences, each with its
licence beside it: the Manrope and Geist Mono typefaces (SIL Open Font License
1.1) and a bundled copy of Pretext used by the type gate (MIT). `NOTICE.md` lists them.
The packages in `package.json` are not included; npm installs them under
their own licences.
