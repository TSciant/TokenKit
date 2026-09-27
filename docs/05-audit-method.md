# Audit method

How to rebuild an existing site's patterns without guessing at them.

## 1. Capture

```bash
mkdir -p audits/<slug>
printf '%s\n' \
  'https://example.com/' \
  'https://example.com/about' \
  'https://example.com/services' > audits/<slug>/urls.txt

npm run capture -- --slug <slug> --urls audits/<slug>/urls.txt
```

Pick pages that differ in kind rather than in content: a landing page, an index
or listing page, a detail page, a form page, a long-form article. Five to eight
is usually enough to separate what recurs from what does not.

Produces `audits/<slug>/captures/*.png` at 360, 768, 1280 and 1600, and
`audits/<slug>/inventory.json`.

## 2. Read the inventory

```bash
npm run audit -- --slug <slug>
```

Writes `audits/<slug>/audit.md`. Two things in it matter.

**The counts.** Type sizes in use, colours in use, spacing values, and how many
of those spacing values sit off a 4px grid. A site with 23 type sizes does not
have a type scale — it has 23 decisions nobody made deliberately. The gap
between those counts and the kit's scales is the size of the normalisation job,
stated as a number rather than an impression.

**The recurring structures.** DOM shapes ranked by how many pages they appear
on. This is the part that makes a component audit checkable: a structure on six
pages is a component, a structure on one page is a page. Without the count you
are ranking by which screenshot you looked at most recently.

The generated component list is a draft. Naming the components, merging the
ones that are the same thing with drifted markup, and deciding what to leave
out are all judgement calls that belong to a person.

## 3. Rebuild

Build against the audit, not against the screenshots. The goal is the site's
information structure expressed in the kit's scales — not a copy of its
appearance. Where the audit shows 23 type sizes, the rebuild uses the nine in
`--tk-size-*` and the hierarchy usually improves, because the original range
was mostly accidental.

Sequence by frequency: the structures on the most pages first. They are the
ones the page compositions will need.

## 4. Compare

```bash
npm run onionskin -- --slug <slug> --rebuild http://localhost:3000 \
  --map /=<referencePageSlug> --map /about=<referencePageSlug>
```

Opens `audits/<slug>/onionskin/index.html`: reference underneath, rebuild over
the top, with blend, difference and side-by-side modes and an opacity scrub.

The rebuild is *supposed* to look different — it is grayscale, it is unbranded,
and it uses a real scale. What onionskin is for is structural drift:

- A section that moved in the reading order
- A rhythm that changed — content that was dense and is now loose, or the reverse
- A hierarchy that inverted, where something secondary now reads as primary
- Something in the reference that has no counterpart in the rebuild

Write what you see in the notes field under each plate. Notes are stored per
page per breakpoint and print with the page. The reason to write on the plate
rather than in a separate document is that separate documents stop being read
after the second iteration.

Use one of four verbs on each observation, so the next pass has an instruction
rather than a feeling:

- **Align** — the rebuild should match; change the rebuild
- **Accept** — the difference is intended; record why and move on
- **Replace** — the original pattern is wrong; the rebuild improves it deliberately
- **Ask** — the difference is a content or scope question, not a design one

## 5. Repeat per page composition

Once per composition, not once per component. Component-level drift shows up in
Storybook, where you can see the variants side by side; onionskin is for the
page level, where the argument is about structure.
