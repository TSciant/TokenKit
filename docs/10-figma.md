# The Figma side

The kit has a Figma file that matches it, and the match is checked rather than
claimed. This is how, and what each file in `figma/` is for.

## The idea

Every component in the Figma file has a **skin**: a 1x picture of its Figma
frame. Storybook lays that picture over the live component (the Onion switch in
the toolbar, and the Design and Tokens tabs under the story), and
`tools/onion-check.mjs` compares the two with a browser and writes down how far
apart they are. The skins are 1x on purpose: the claim is that a CSS pixel and a
design pixel coincide, and only a 1x picture can witness that.

## What is in `figma/`

| File | What it is | Who writes it |
| --- | --- | --- |
| `keys.json` | each component's Figma node, story id and source file | by hand, when a component is added |
| `onion.json` | which story shows which skin, and which args pick it (`pattern`, `states`, `target`, `still`, `pad`, `maxMean`) | by hand; the story generator reads it |
| `skins/<Component>/*.png` | the skins, one per variant, named by their variant values | exported from Figma |
| `sheets/` | the whole set exported once, from which the skins of the first components were cut | `tools/onion-skins.mjs` |
| `verdicts/*.json` | what was found, what was decided, what it taught | by hand, after a check |
| `checks.json` | the last onion-check result per component | `tools/onion-check.mjs` |
| `meta.json` | when each skin was pulled and each source last changed | `tools/figma-meta.mjs` |

## Adding or changing a component

1. Start it in code: `npm run new:component -- <Component>` writes the source,
   its stories (the next number, argTypes, a Playground and an Onion skin
   story), its stylesheet and the import and export lines. Write the doc
   comment and the story description it leaves as TODO: the comment's first two
   paragraphs are the component's entry in the Figma guidelines.
2. Draw it in Figma from the kit's variables (the file is a library: tokens in
   the `tk`, `tk-density`, `tk-type`, `tk-icon` and `tk-ink` collections), in its
   section, with a description that names the code.
3. Take its skin at 1x (`get_screenshot` on the node, contents only) and, with
   Storybook running, register and measure it in one go:
   `npm run figma:register -- <Component> --node <id> --skin <url or file> --doc "<what the skin shows>"`.
   It writes `keys.json`, `onion.json` and the skin's folder, runs the onion
   check, regenerates `meta.json` and the guidelines, and says whether the mean
   is under its ceiling (8, or `--max-mean` with the reason in `--doc`). A frame
   taller than 1024px cannot be taken whole: take its sections by node id and
   stitch them at 1x. For a pattern, `npm run gen:stories` writes its Onion skin
   story from the `onion.json` entry.
4. Look at the difference, not only the number (a drift is named, then aligned,
   accepted, paused or replaced) and record it in `verdicts/`.
5. `npm run check:fast` before committing (the pre-commit hook runs it too,
   after `npm run hooks`); the full `npm run check` runs every evening.

## Packs and densities

A component's onion skin is drawn in the default mode. The file's variable modes
carry the rest: `tk` has a mode per pack (colour and corner), and `tk-density`
has a mode per density (compact, comfortable) and per pack, because a brand sets
its own `--tk-density` (door-shop 0.85, mohave 1.3, bathing-bagels 1.05, wandas
0.95, muncheese 1.15). Control heights are `control/min` and `field/min` there:
the code's `max(target-min, 2.25rem * density)` cannot be written as one
variable, so it is written out per mode.

`figma/modes/<mode>.png` is the Figma "ModeSheet" frame for that mode (Primitives
page, Modes section), and `node tools/modes-check.mjs` compares each to the
"03 Foundations / 08 Modes / Mode sheet" story under the matching Pack and
Density. Results are in `figma/modes/checks.json`; the figma gate fails if a
sheet has no result or reads over 8. To add a pack: add its mode to `tk` and,
if it sets a density, to `tk-density` (space ramp, measure, `control/min`,
`field/min`), add a ModeSheet frame with both modes set, export it, add the row
to `MODES` in the check.

### Keeping the variables true

`node tools/figma-tokens.mjs` (Storybook running) reads what every token
resolves to under each pack, inverse context and density, and writes
`figma/tokens.json`. Applying it is a Figma step: a `use_figma` script that
holds the JSON, compares each variable per mode (colours within one level per
channel, lengths within 0.01) and sets what differs, returning the list of what
moved. Run it after any pack, density or token change. The first run found 759
values already right and one drift (`texture/paint` in the six brand packs);
strings and unitless numbers (easings, weights, gradient angles) are not read.

## What "stale" means

A component is **stale** when its source changed after its skins were pulled and
nothing has compared the two since. A check run after the change clears it,
because it says the two still agree; it is not a reminder to redraw anything.

## The gate

`npm run check` has a `figma` step (`tools/figma-gate.mjs`): the same components
are named in `keys.json`, `onion.json` and `meta.json`; every source file and skin
folder exists; every story id is a story that exists in the build; no two
components share a Figma node unless one borrows the other's skins (`skinsFrom`);
and the last check is under its ceiling (8, or `maxMean` in `onion.json` where a
higher number was accepted on purpose). Stale skins are a warning.

## The public copy

The public kit carries `figma/` and the tools above, so the claim can be checked
by anyone. It has a history of its own, so `figma-meta.mjs` leaves `meta.json`
alone there: its dates come from this repository's history.

## Code Connect

Figma's Code Connect needs an Organization or Enterprise plan, which this file is not on. The substitute is the pair of pointers: each component's documentation link
and description name the story and the source file, and `keys.json` maps the
other way (Storybook's toolbar link and the Design tab read it).
