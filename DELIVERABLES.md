# Deliverables

A template. This is the boilerplate branch, so there is no engagement to report
against — fill the Status table in on the client branch and leave this one
generic.

The shape matters more than the contents. Every row names a line item, what
satisfies it, and **the command that prints the number**. A checklist whose
evidence column says "done" is a checklist nobody can check.

Run the lot:

```sh
npm install
npm run check:delivery
```

`check:delivery` is `check` (lint · vocabulary · generated-file freshness ·
boundary · neutral · contrast · type · build, then a11y · radius · attributes ·
properties · controls in one browser pass) followed by the Next.js build and
the Lighthouse gate. `check` runs every step and prints a summary; it exits
non-zero if any step failed.

---

## Status

Replace the right-hand column with real commands and real numbers as each item
lands. The line items below are the ones most engagements ask for; delete what
yours does not.

| # | Line item | State | Evidence |
|---|---|---|---|
| 1 | Storybook configuration | | `npm run storybook` |
| 2 | Token-based design system, architected, documented, implemented | | `npm run lint:css` |
| 3 | N parameterized React components + underlying atomic elements | | `npm run controls` |
| 4 | N representative full page compositions | | `npm run lighthouse` |
| 5 | Unbranded grayscale wireframe, responsive and interactive | | `npm run lint:css` — no colour literal outside `src/css/packs/` |
| 6 | WCAG 2.2 Level AA | | `npm run a11y` |
| 7 | Lighthouse 95+ in all categories, through direct Next.js | | `npm run lighthouse` |
| 8 | Industry best practice and code quality | | `npx tsc --noEmit` and the gates below |
| 9 | Bid for applying branding | | |
| 10 | Delivery date, progress updates | | |

Two of these are usually **joint** decisions rather than deliverables, and both
are worth pinning in writing before building against them:

- **Which page compositions.** The Lighthouse work is per-composition, so a
  late substitution costs real time.
- **Which components.** Get the list confirmed; it is what closes the item.

---

## What ships in the boilerplate

| Group | Count | Where |
|---|---|---|
| Primitives and atomics | 22 | `05 Primitives` |
| Composed patterns | 25 | `06 Patterns` |
| Page compositions | 11 | `08 Prototype` (plus two responsive views and the clickable prototype) |
| Client's own | 0 | `09 Client` — the point |
| **Everything the controls gate checks** | **59** | every exported component with props |

Reproduce the counts:

```sh
npm run build-storybook
node -e "const i=require('./storybook-static/index.json');
  const s={};for(const e of Object.values(i.entries)){if(e.type!=='story')continue;
  (s[e.title.split('/')[0]] ??= new Set()).add(e.title);}
  for(const k of Object.keys(s).sort()) console.log(k.padEnd(18), s[k].size);"
```

### Parameterized means the whole prop surface, not some of it

Every component takes its content and its shape as props, and every one of
those props is drivable from the Controls panel. This is the part that decides
whether a wireframe generates revision requests or answers them: a reviewer who
wants three columns instead of four changes it themselves and looks at the
result.

```sh
npm run controls              # 59 components · 321/321 props · 0 gaps
npm run controls -- --verbose # per component, which panel drives it
```

The gate reads the kit's own declared prop types out of the TypeScript source,
asks the *running* Storybook preview what each story exposes, and fails on the
difference. Both halves matter:

- A story can declare `argTypes` and still show an empty panel, because the
  args never reached the preview. Reading the source cannot see that.
- More often, a panel looks populated while the component has props that are
  not in it. A count of controls says nothing about coverage; only the
  difference does. The first honest run of this gate reported **257 of 331** —
  74 props that existed on components and could not be reached from any panel.

Inherited DOM attributes (`className`, `style`, `onClick` and the rest of
`HTMLAttributes`) are not counted. They are an escape hatch every wrapper
forwards, not a designed API, and 250 of them in the panel would bury the dozen
that are the component.

The 25 patterns' stories are generated from the components' own prop types,
default values and JSDoc:

```sh
npm run gen:stories             # rewrite them
npm run gen:stories -- --check  # fail if any is stale
```

So a prop cannot exist without a control, and a control cannot claim a default
the component does not have. The prose on each docs page is the comment above
the function — one home, and the one the next person to read that component
will find.

What is *not* a prop, anywhere: colour, padding, font size. Those come from the
token contract and from the context a component is placed in. A prop that lets
a caller paint outside the pack is how a design system stops being one.

---

## Lighthouse

Production `next build`, served by `next start`, mobile emulation, Lighthouse's
own default Slow 4G throttle. Not the dev server, which ships unminified
modules and a hot-reload client; not Storybook, which is an iframe inside an
application. Neither would reproduce a number a delivered page could.

Report performance as **the range across consecutive runs**, because that is the
honest form: Lighthouse simulates the network rather than waiting on one, and a
single number implies a precision it does not have.

```sh
npm run next:build && npm run lighthouse
npm run lighthouse -- --url /contact          # one route
npm run lighthouse -- --json report.json      # keep the raw audits
```

Three notes a reviewer should have rather than discover:

- **`robots.txt` allows indexing, on purpose.** A prototype should stay out of
  search, but "Page is blocked from indexing" is a hard SEO failure and capped
  every route at 63. Keep it out of search with an `X-Robots-Tag: noindex`
  response header at the host — that is a deployment setting, not something
  baked into the artifact, and it leaves the score measurable.
- **Motion loads when a panel opens, not on page load.** The kit uses an
  animation library in exactly one place — the mega menu's dropdown, which
  animates out as well as in and so cannot be done in CSS alone. Imported
  normally it was 43 KB gzipped in the shared chunk, on every route, most of
  which have no animated panel at all. It now loads on first open, prefetched
  on hover and focus of the trigger. First load went 165 KB to 122 KB and the
  worst route gained four points.
- **The contact map loads on press.** It begins 98px above the fold, where
  deferring does not help: Time to Interactive is defined as the end of the
  main thread's busyness, so maplibre's ~230ms of parsing stays inside Total
  Blocking Time wherever it is queued. The placeholder holds the same box at
  the same ratio, so nothing shifts. This is a visible behaviour choice, not a
  silent optimisation.

---

## The gates

Each answers one question by measuring rather than asserting. All but
Lighthouse are part of `npm run check`; the five story gates share one browser
pass as `npm run gates`.

| Command | What it measures |
|---|---|
| `npm run lint:css` | No colour literal outside the packs; every token declared; every pack fills the contract |
| `npm run vocab` | Every component's prop union offers exactly the values its CSS answers |
| `npm run boundary` | Nothing in the kit imports from `src/client/` |
| `npm run neutral` | No client's vocabulary survives in the kit |
| `npm run gate` | Every required text and non-text pair, composited, in every pack, at every density and root size |
| `npm run type-gate` | Line length, measure and the step-up breakpoints against real rendered text |
| `npm run a11y` | axe-core over every story at two viewports, WCAG 2.2 AA + best practice |
| `npm run radius` | Concentric corners: inner radius = outer radius − the gap |
| `npm run attrs` | Every `data-*` value in the DOM is one a selector answers to |
| `npm run properties` | Every `@property` the CSS declares is one the browser registered |
| `npm run controls` | Every declared prop of every component is drivable, asked of the running preview |
| `npm run gen:stories -- --check` | Every generated story matches its component's prop types (packs and icons have the same `--check`) |
| `npm run lighthouse` | The contract number, through direct Next.js |

The a11y gate runs at 1440px **and** 412px. It used to run at 1440px only and
reported 167 of 167 passing while Lighthouse failed `target-size` — WCAG 2.2
AA, 2.5.8 — on the same build. Both were right: the failing targets were footer
links in a list that is uncrowded at desktop width. A criterion that is a
function of the viewport cannot be answered at one viewport.

Two of them are new with the boilerplate, and they guard the thing that
makes it a boilerplate:

- **boundary** — client code may import the kit; the kit may not import client
  code. One import the wrong way and the delivery can no longer be a subset.
- **neutral** — a client's words do not leak upward. They do not arrive as a
  logo; they arrive as a placeholder someone typed while testing a card, a
  fixture, a code comment, an example in a tool's usage text. There were
  thirty-one in one file and not one of them looked like a mistake in review.
  The wordlist is `tools/neutral-terms.json` for a sector's words and the
  gitignored `tools/neutral-terms.local.json` for names, so the list is not
  itself the one file that names every client. Extend both per engagement and
  keep the old entries, because the way most of these arrive is a copy-paste
  from the last one.

---

## Known limits

State these rather than leave them to be found.

- **The CARTO basemap is a third-party dependency.** The map components fetch
  their style from `basemaps.cartocdn.com`. Behind a network that blocks it,
  the map draws its frame and logs a fetch error. MapLibre is a wireframe
  stand-in chosen because it needs no key and no vendor account; a client can
  swap it for Mapbox, Google or anything else without touching the layout.
- **The kit ships no photography.** `Plate` draws its own composition from a
  seed. Stock goes in `src/client/stock/`, is named in `STOCK_BY_SEED` in
  `src/react/primitives/Plate.tsx`, and is greyscaled and resized into
  `next/public/` at build time. Licensing it is the engagement's problem, which
  is why it lives on the engagement's side of the boundary.
- **`next/public/` is generated.** `tools/sync-next-public.mjs` builds it.
  Nothing in it should be edited.
- **Both packs are grayscale by design.** Applying a brand is separate work;
  `src/css/packs/_template.css` is the handoff artifact that lists the slots a
  brand pack must fill.
