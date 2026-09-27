# Accessibility

Target: WCAG 2.2 Level AA.

Automated tooling covers a minority of AA criteria — commonly cited figures put
it around a third, and that is a rough industry estimate rather than a measured
property of this kit. Plan for manual work on the rest.

## What the kit gives you by construction

- `:focus-visible` outline on everything, never removed, only replaced
- `prefers-reduced-motion` honoured globally
- Root font size never overridden, so browser text settings work
- `--tk-target-min` at 24px, applied by every interactive primitive
- `--tk-line-strong` at ≥ 3:1 on control boundaries
- Status carried by boundary and label, not by colour alone
- Native controls kept native — checkbox, radio, select, `<dialog>`, `<details>`
- Logical properties throughout, so RTL works without a second stylesheet

## What the gate checks

`npm run gate` mounts the fixture in every surface, density and brand context
and reads computed styles. It checks:

- Text on its effective background, at the correct threshold (4.5:1, or 3:1
  where the text genuinely qualifies as large — ≥ 24px, or ≥ 18.66px bold)
- Control boundaries against their background (3:1)
- Focus ring against the surface behind it (3:1)
- Meaningful fills against their track (3:1)
- Translucent colours composited against what is actually behind them

`npm run gate -- --zoom 200` re-runs with the root font size doubled.

## What the gate does not check

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

## WCAG 2.2 additions

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

## Component checklist

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
