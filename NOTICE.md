# Provenance

tokenkit is pre-existing intellectual property, developed independently and
maintained in its own repository. It is not work product of any client
engagement.

`master` is the kit and nothing else: no client's name, no client's content, no
client's brand. That is not tidiness, it is the claim this file makes, in a
form somebody can check. Two gates check it on every run — `npm run neutral`
(no client vocabulary in the kit) and `npm run boundary` (the kit does not
import client code).

## Two levels, and they are different

- A **client** is whoever the agreement is with. They may bring more than one
  piece of work.
- An **engagement** is one piece of work for that client, with its own scope,
  its own content and its own delivery.

One branch per engagement, named `client/<client>/<engagement>`, cut from
`master`. The engagement's own files live under `src/client/` on that branch
and nowhere else. Delivery is that branch; the kit travels with it under
licence.

## Why this file exists

Contractor and subcontractor agreements commonly assign work product to the
client, and some are drafted broadly enough to sweep in anything that touches
the engagement. Where this kit is used on an engagement, the intended
arrangement is:

- The kit remains the author's property.
- The client receives a licence to use it in the delivered work.
- Anything authored specifically for that engagement — a brand pack, a
  component built to their requirements, their compositions — is their work
  product.

Keep the boundary physical as well as contractual. A brand pack belongs on the
engagement's branch, not in `src/css/packs/` here. The template in
`src/css/packs/_template.css` is the handoff artifact; a filled-in pack is not.

## Before signing

Confirm the agreement has a background-IP or pre-existing-works clause, and
that the kit is listed on its schedule. This is a routine request. Asking
before signing costs nothing; asking afterwards is a renegotiation.

Work done **before** signing is unambiguously the author's — there is no
agreement yet for it to be assigned under. So the ordering is worth being
deliberate about: extract anything general into the kit on `master`, with its
own commits and its own dates, before the engagement's agreement exists. The
git history is the record, and it is easier to point at than to reconstruct.

If no carve-out is agreed, do not copy files. Rebuild from the technique
instead — the architecture is knowledge, and knowledge is not assignable. It is
the copied file that creates the entanglement, not the approach.

Note that "must be performed on the client's development environment" is a
separate clause from IP assignment and does not by itself assign anything — but
it does mean the kit has to get onto that environment somehow, which is the
licence question again, and worth settling in writing at the same time.

## Licence, and other people's work inside the kit

The kit's own code and docs are released under the MIT License (`LICENSE`).
The author keeps the copyright; the licence lets anyone use, copy, change and
ship the kit, provided the copyright and licence notice go with it. It covers
the code, not the name: it does not grant use of the TokenKit name or its
wordmark as someone else's brand.

Two pieces of other people's work ship inside the kit. Each keeps its own
licence, and the licence travels beside it:

| What | Where | Licence | Copyright |
| --- | --- | --- | --- |
| Manrope, the kit's typeface: four weights fixed from the variable font and subset to the kit's characters | `src/css/fonts/files/` | SIL Open Font License 1.1, `src/css/fonts/files/OFL.txt` (also inside each font file) | The Manrope Project Authors; designed by Mikhail Sharanda |
| Pretext, bundled into one script for the type gate | `tests/vendor/pretext.js` | MIT, `tests/vendor/pretext.LICENSE` (and a banner in the bundle) | Pretext contributors |

The OFL allows the subsetting because Manrope reserves no font name. The kit
used Hauora Sans until 2026-09-27; Hauora's licence reserves its name for
unmodified copies, so the kit's subsets of it could not carry that name, and
the kit moved to Manrope, the face Hauora was modified from.

Everything else the kit uses (React, Storybook, Playwright, react-icons and
the rest of `package.json`) is a dependency that npm installs under its own
licence. None of it is copied into the kit. One of them needs a word: the
Icon component draws Lucide's icons, which come with react-icons. They aren't
in the kit, but anything built from it (Storybook, an app) contains them, and
Lucide's licence (ISC, and MIT for the icons it inherited from Feather) asks
to go with every copy. It is kept beside the icon set,
`src/react/primitives/lucide.LICENSE`, for builds to carry. The textures, the favicon, and
the sample brands with their copy were made for the kit.

This is not legal advice.
