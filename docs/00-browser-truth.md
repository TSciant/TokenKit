# Browser truth

The wireframe-level constitution of tokenkit.

This is not a brand manifesto and not a slide deck. It is the boilerplate
every pack, primitive, gate, and sample page is supposed to obey. Design
files, framework jackets, and model passes are drafts. Wireframe fidelity
means: grayscale, structural, measured in a real document — and these rules
are how that stays honest when paint, platforms, and agents all show up hungry.

**In one breath:** Tokens are atoms. Primitives read only tokens and the box.
Brand is a pack. One DOM, no Monty. Accessibility is gated in context.
Jackets subscribe. The browser is the truth — where intention and production
become an experience, not an artifact in a domain tool.

---

## The browser is the truth

Design files, frameworks, and model passes are drafts. What the user sees in
a real document — computed styles, real width, real type — is the measurement.
Everything else is a jacket until it shows up there.

We do not collapse early for a privileged observer. Figma, a screenshot, or a
one-shot answer does not own the spine. The runtime opens the box.

That is why Storybook globals (pack, density, root size) change an ancestor
and the cascade re-resolves — and why `type-gate`, `contrast-gate`, and
`radius-gate` read computed styles instead of trusting source text.

Intention and production go out of line in the drafts. In the browser they
become an experience — not an artifact in a domain tool.

## Box model(s)

Layout truth lives in the box: margin, border, padding, content — held until
something real measures them. Premature classes and viewport guesses freeze a
story before the box has a size.

Prefer the geometry of **this** container over a map of the window. Shells
and primitives are functions of their own attributes and their own available
size (`data-shell`, `data-gap`, container queries, concentric `--tk-radius-nested`).
The page chrome may still listen to the environment (motion preference,
pointer, print). Nested UI must not pretend the window is its parent.

Name the reset like you mean it: the browser opens the box. After it is open,
measure type and layout inside — don’t re-decide the product at every
breakpoint.

## DOM(s)

One content spine. One DOM.

Paint may reflow, densify, or re-wrap. It does not run three-screen Monty —
mobile, tablet, and desktop as different decks of facts hidden and swapped
with viewport trickery. Structured content should read the same without a
shell game.

**Sample Pages responsive frames are not Monty.** The same page, same markup,
shown at 360 / 768 / 1280 as narrower boxes. That is measuring the box. Monty
is shipping three content trees and picking one by viewport.

That is what “observable” means here: a human, a gate, or an agent can inspect
one document and know what the product is. Style stays at home on the host.
Semantic content is the embeddable chunk you send to an observer. Predictable
structure, stable names (`data-tk`, `data-shell`), no twin trees per screen size.

## Tokens

Tokens are the atoms — not the components.

A fixed contract (`--tk-*` slots, registered in `02-property.css`) is what
every primitive reads. Packs fill the contract; they do not rename it. Values
live in one place. Components never smuggle a raw color, space, or size. If
it isn’t in the contract, it isn’t in the system. `npm run lint:css` reports
unfilled slots.

Resolve tokens where the cascade resolves them. An export for native, Figma,
email, or agents must be **computed** values in real contexts (brand, density,
inverse) — not a copy-paste of `var()` strings those runtimes cannot think
with. See Tokens/Export and Tokens/Contract in Storybook.

Texture follows the same split: kit-owned masks in `05-textures.css`,
pack-owned `--tk-texture-ink`. Decoration that carries meaning fails the ethos;
decoration that vanishes under `prefers-contrast: more` is correct.

## Primitives

Primitives are molecules: assemblies that only speak tokens and their own
container.

Props are coordinates, not branch forests — attributes the CSS can match
(`data-shell`, `data-gap`, `data-variant`, `data-pressed`). Context resolves
on ancestors (`data-brand`, `data-density`, `data-on`); components do not
thread a theme through seventeen layers of API.

Don’t stamp a variant until a real state needs a branch — open, error,
disabled, busy, pressed — not decoration. Progressive enhancement playgrounds
add layers on a native baseline; they do not invent parallel class piles.

Armor the holes: absent tokens and silent nests matter as much as loud
survivors. Prefer negative-space selectors (`:where` defaults as absence)
over additive class piles.

## Brands

Brand is a property, not a checkpoint.

Same markup. Pack swap (`data-brand="wireframe"`). Private ramps may use the
brand’s own names (`--wf-*`); the contract slots stay fixed so a brand change
is not a component rewrite. Wireframe fidelity is the default pack — grayscale,
structural, enough presence (texture, motion) to sell structure without
impersonating a painted brand.

Jackets (Figma, SwiftUI, Compose, React) subscribe to the contract. They do
not prescribe it. Free the file: own the spine; keep the canvas optional.

## Accessibility

Accessibility is not a palette pass or a coat of contrast at `:root`.

Check the system the way it actually ships: same markup, every surface,
density, and brand context, after the cascade — including the failure that
only appears two levels down. Type measure is measured (`npm run type-gate`),
not asserted. Hit targets and focus are tokens with floors
(`--tk-target-min`, `--tk-line-strong`), not vibes.

Grayscale is allowed to carry meaning with boundary and label; color alone
never is. Prefer native controls when they are the honest control. Gates with
exit codes beat screenshots as proof.

Accessible by construction means the contract and the primitives make the easy
path the right path — not that marketing claimed AA once.

## Paint, agents, and observers

Paint keeps content observable by refusing content forks. Agents get a
super-predictable embeddable chunk: semantics out, style at home. That is the
truthful half of tooling for observers — not schema theater for citation
cosplay, but a contract a tool can execute without reinventing the design
system every turn.

Same spine for craft, for jackets, for gates, for agents. Intention and
production go out of line in the drafts; in the browser they become an
experience — not an artifact in a domain tool.

## Enforcement (teeth)

| Principle | Where it bites |
| --- | --- |
| Browser is truth | Storybook toolbar contexts; gates read computed styles |
| Box over window | Shells, container queries, concentric radius |
| One DOM | Audit rebuilds + Sample Pages share modules; no per-breakpoint content forks |
| Tokens as atoms | `lint:css`, `@property`, pack contract |
| Primitives as coordinates | `data-*` attributes; React maps props → attributes only |
| Brand as pack | `packs/wireframe.css`, `packs/wireframe-dark.css` |
| A11y in context | `contrast-gate`, `a11y-gate`, `type-gate`, `radius-gate` |

If a change needs a hex in a component, a second DOM for mobile, or a
screenshot as the only proof, it is out of ethos — rewrite it at wireframe
fidelity against the contract.
