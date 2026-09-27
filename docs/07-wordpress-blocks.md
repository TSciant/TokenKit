# WordPress blocks — short implementation guide

**Audience:** a WordPress team mapping tokenkit into Gutenberg.  
**Not Tony’s job:** the product is the grayscale Storybook kit. This doc is the handoff so someone else can implement blocks without reinventing the system.

## Terminology (use these words)

| Say | Mean | Don’t say |
| --- | --- | --- |
| **Block** | One Gutenberg unit (`registerBlockType`) — button, card, FAQ, map… | “Story block” (not a WordPress term; confuses Storybook stories with WP) |
| **Block pattern** | A saved layout of blocks (a sample page section, a hero + CTA row) | “Template” unless you mean a block theme template |
| **Synced pattern** | An editable instance that stays linked (formerly “reusable block”) | — |
| **theme.json** | Design tokens, palette, spacing, typography for the theme | Dumping tokens only into ad‑hoc CSS variables in PHP |
| **Inner blocks** | Nested blocks inside a parent (card → media + title + body) | Rebuilding shell layout as a one-off HTML blob |

WordPress’s standard surface is **blocks** (and **patterns**). Storybook **stories** stay in tokenkit; they are the contract the block author reads, not something you rename in WP.

## Source of truth

1. **Browser truth** — computed styles in a real document (`docs/00-browser-truth.md`).
2. **Storybook** — `04 Primitives` Docs (props, a11y, soft Use for / Don’t use for) and the shells in `03 Foundations → 03 Composition`.
3. **CSS kit** — `import "tokenkit/css"` (or the bundled `dist/tokenkit.css`) + one brand **pack**.
4. **This guide** — how those map into Gutenberg. It does not fork the kit.

If Storybook and a block disagree, fix the block (or file a kit issue). Do not invent a second design system in `style.scss`.

## Mapping cheatsheet

| tokenkit | WordPress |
| --- | --- |
| `--tk-*` tokens + pack | `theme.json` settings (color, spacing, typography) **and** enqueue the kit CSS so concentric radius, shells, and gates keep working |
| Shell (`data-shell`, `data-gap`, …) | Parent block with **InnerBlocks**; layout attributes mirror shell axes — do not add a Tailwind-style utility layer beside shells |
| Primitive (`data-tk="button"`, card, FAQ…) | One **block** per primitive (or a thin dynamic block that outputs the same attributes) |
| Soft Use for / Don’t use for | Block description / inspector help text (guidance, not hard validation) |
| Sample page / Prototype section | **Block pattern** (and optionally a pattern category `tokenkit`) |
| Pack flip (wireframe / dark) | Theme style variation or a `data-brand` on the root — same pack model as Storybook |
| Container queries / no viewport Monty | Keep CQ in CSS; do not introduce breakpoint-swapped markup for mobile |

### Attributes

Prefer the kit’s attribute vocabulary where it already exists (`data-tk`, `data-shell`, `data-gap`, `data-bleed`, …). Block attributes should serialize to those names (or a documented 1:1 map) so the same CSS applies with no rewrite.

### Media and corners

- Inset photo in a card → join the concentric chain (`--tk-radius-nested`).
- Flush photo → `data-bleed` / `bleed` (top+sides) or `bleed="full"` when there is no title band under the image. Plate-in-card flush is the intended pattern — no inset gap.

## Suggested build order

1. Enqueue kit CSS + one pack; prove a static page still looks like Storybook wireframe.
2. Map **theme.json** to the token contract (`docs/02-token-contract.md`) — fill slots, don’t rename them.
3. Register shells as layout / group-style parents (InnerBlocks) before painting chrome.
4. Register **04 Primitives** in role order (Button → … → Guidance); each block’s README points at `04.xx` Docs.
5. Publish **patterns** from Sample Pages sections (Home hero, Featured capabilities, FAQ stack) — patterns compose blocks; they don’t duplicate CSS.
6. Run kit gates where possible (`contrast`, `radius` after a Storybook build); keep WP a11y plugins as a second line, not a replacement for browser truth.

## Out of scope for the WordPress team

- Redesigning in Figma as a second spine.
- Viewport Monty (separate mobile DOMs).
- Replacing shells with a utility framework.
- Owning Storybook IA or primitive APIs — propose changes upstream in tokenkit.

## One sentence for stakeholders

**tokenkit is the system; WordPress blocks are the jacket** — same tokens, same shells, same Docs contract, registered as blocks and patterns so editors assemble what Storybook already proved.
