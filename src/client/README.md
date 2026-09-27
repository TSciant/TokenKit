# src/client — the boundary

Everything above this directory is the kit. Everything inside it belongs to one
engagement.

The split is not housekeeping. Under a typical subcontractor agreement, work
authored for a client is that client's work product, and the kit is the
author's pre-existing property licensed into the delivery (see `NOTICE.md` at
the repository root). Those are two different owners, and the cheapest way to
keep them straight is a directory you can point at.

## One engagement per branch

`master` is the kit, and it is empty here on purpose. An engagement is a branch
cut from `master`, named `client/<client>/<engagement>` — the client is whoever
the agreement is with, the engagement is one piece of work for them, and a
client with two pieces of work gets two branches. That branch fills this
directory and changes nothing above it, so merging `master` forward brings kit
improvements in without touching a line of the engagement's own code, and the
delivery is that branch and no other.

## What goes where

| | Kit | Client |
|---|---|---|
| Token contract | `src/css/core/` | — |
| Grayscale packs | `src/css/packs/` | — |
| A filled-in brand pack | — | `src/client/css/` |
| Primitives | `src/react/primitives/` | `src/client/components/` |
| Composed patterns | `src/react/patterns/` | `src/client/components/` |
| Page compositions | `src/samples/` (demo) | `src/client/pages/` |

The rule for deciding: **would you build this again for the next client?** If
yes it is a primitive or a pattern and it belongs to the kit. If it only makes
sense because of one client's content model, their taxonomy, their regulator or
their org chart, it belongs here.

A component that starts here and turns out to be general can be promoted
upward later. That direction is safe. The other direction — a component that
was written in the kit against one client's requirements — is the one that
quietly entangles the two, because by the time you notice, the kit has a prop
named after somebody's product line.

## Additive, not subtractive

The kit ships everything. An engagement adds to it and delivers a subset — you
should never have to hand over a component the client will not use, and you
should never have to fork the kit to avoid doing so.

So: **add files here, do not edit files above.** When a kit component is nearly
right, the four things to reach for, in order:

1. **A token.** Most "we need it different" is a value, and a value is a pack.
2. **A prop.** If the difference is structural and general, add the prop to the
   kit component — that is a kit improvement and every future client gets it.
3. **Composition.** Wrap the kit component in one of yours here. A wrapper that
   supplies this client's defaults is a five-line file and it costs the kit
   nothing.
4. **A new component here.** Last, and only when the first three are wrong.

What is never on the list is editing a kit file to suit one client. That is the
change that cannot be delivered without delivering everything.

## Brand

`src/css/packs/_template.css` is the handoff artifact: the list of slots a
brand pack must fill. A *filled-in* pack is the client's, so it goes in
`src/client/css/` — or, better, in the client's own repository. Both packs that
ship with the kit are grayscale on purpose.

## Storybook

Stories under this directory belong to the `09 Client` section, which is the
last one in the sidebar and is empty on `master`. Title them
`09 Client/NN Name`.

## Delivering

Today, the boundary is a convention you keep by hand, and the check is that
nothing under `src/client/` is imported from above it:

```sh
grep -rn "from \".*client/" src --include=*.tsx --include=*.ts | grep -v "^src/client/"
```

That should print nothing. A hit means the kit has taken a dependency on one
client's code, and the delivery can no longer be a subset.

A tool that walks the import graph from a set of entry points and prunes
everything unreachable is the obvious next step. It is deliberately not built
yet: the right seams are the ones a real engagement reveals, and guessing at
them produces a tool that is confidently wrong about which files are needed.
