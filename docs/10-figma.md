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

1. Draw it in Figma from the kit's variables (the file is a library: tokens in
   the `tk`, `tk-density`, `tk-type`, `tk-icon` and `tk-ink` collections), with
   its documentation link and a description that names the code.
2. Export its variants at 1x into `figma/skins/<Component>/`. A frame taller than
   1024px cannot be exported whole (Figma caps an export at 1024 on its longest
   side): export its sections by node id and stitch them at 1x.
3. Add it to `keys.json` and `onion.json`. For a pattern, `npm run gen:stories`
   writes its "Onion skin (Figma)" story from the `onion.json` entry; a primitive's
   story is written by hand beside it.
4. With Storybook running, `node tools/onion-check.mjs <Component>`. Read the
   number, then look at the difference (a drift is named, then aligned, accepted,
   paused or replaced) and record it in `verdicts/`.
5. `npm run figma:meta`, then `npm run check`.

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
