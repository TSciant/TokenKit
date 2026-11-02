# TV pack

A token-driven starter for a 10-foot interface: a screen read from a sofa three metres
away and driven by a remote, a D-pad, a gamepad or the arrow keys. A safe-area shell,
titled rows of tiles, an on-screen display and a side menu, with a remote contract and
spatial focus underneath. Plain custom elements (no framework, no fetch), so the same
files run in Storybook, in React through `Tv.tsx`, and on a box in a kiosk browser. It
is the pieces every TV screen needs, not a TV system.

| Element | What it is |
| --- | --- |
| `<tk-tv-shell>` | The safe-area frame, and the remote. `theme` boosty / dark / light (rows, tiles and the sidebar inside inherit it), `label`, `input` (`keys`, `pad`, `keys pad`, `none`; default `keys`), `capture`, `guides`, `screen` (a 16:9 frame with the rows scrolling inside), `calm`. Slots: default (rows), `menu` (the sidebar takes it by itself), `overlay` (an OSD). Events: `tk-tv-verb` (cancelable), `tk-tv-select`, `tk-tv-exit`. Properties: `nav`, `items()`, `currentItem()`, `press(verb, dir)`, `act(verb, dir)`. |
| `<tk-tv-row>` | A titled row of tiles that scrolls sideways to keep focus, and its ring, in view. `label`, `layout="grid"` (wrap instead of scroll), `level` (heading level 2–6), `theme`. |
| `<tk-tv-tile>` | A focusable tile. `label`, `sub`, `image` (16:9; without one the art is a gradient in the accent), `alt` (empty by default: the label names the tile), `accent` emerald / violet / amber / cyan / pink / none, `badge` ("New", "Live"), `href`, `disabled`, `current`, `focused` (draws the ring without focus: a picture of the state, or a kiosk window that has lost the system's focus), `theme`. Fires `tk-tv-select` with `{ label, href }`; `activate()` does the same as a click. |
| `<tk-tv-osd>` | An on-screen display line that fades. `kind` volume / now-playing / message, `value` (0–100), `muted`, `label`, `detail`, `paused`, `open`, `persist`, `timeout` (ms, 3000), `theme`, `calm`. `show({ ... })`, `hide()`, `summary`. |
| `<tk-tv-sidebar>` | The side menu: links or buttons as children, the open one marked `aria-current="page"`. `label`, `collapse` (a rail until focus comes in; put an icon first in each item), `theme`. |

## The remote contract

`tv-remote.mjs` turns every input into five verbs and emits them: on `remote.on(fn)` and
as a `tk-tv-verb` event (bubbling, composed, cancelable) with `{ verb, dir, source, code }`.

| Verb | Keys (`KeyboardEvent.code`) | Gamepad (standard mapping) |
| --- | --- | --- |
| `move` up / down / left / right | the arrow keys | the D-pad, the left stick past half way |
| `select` | Enter, Numpad Enter, Space | A (south) |
| `back` | Backspace, Escape, Browser Back | B (east) |
| `home` | Browser Home | Home |
| `menu` | Context Menu | Menu |

The input cores are the other packs' own, not copies: the gamepad pack's hub reads the
pads (`createRemote({ pad: sharedHub() })`), and the keyboard pack's `isEditableTarget`
decides what a text field is; a keyboard pack hub can be the key source too
(`createRemote({ keyboard: createKeyboardHub() })`). Keys pressed while focus is in an
input, textarea, select or contenteditable are ignored unless `capture` is set, and
shortcuts with Ctrl, Alt or Meta stay the browser's. A held arrow repeats (the browser's
key repeat, or for a pad 400 ms then every 150 ms); a held Enter or A does not. A pad
with a non-standard mapping is never guessed at. The OS often keeps a pad's Home button
for itself.

Privacy: keys are read by code; the typed character is never read for a key that has
one. Some TV browsers send their remote's Back, Home and Menu with no code: for those
only, `event.key` is compared with a fixed list of key names (`GoBack`, `XF86Back`,
`GoHome`...), never a character. Nothing is kept or sent anywhere.

The shell listens for keys on itself, so the remote works while focus is inside it and
leaves the rest of the page alone. A pad's verbs act only while focus is in the shell or
on nothing at all. A host that calls `preventDefault()` on `tk-tv-verb` keeps that verb
for itself; `press(verb, dir)` sends one from anywhere else (an on-screen D-pad, a phone).

## Spatial focus

`tv-focus.mjs` moves focus by geometry over plain items (`{ key, rect, row, level }`),
so the rules are tested without a browser:

- Left and right stay in the line: the nearest item ahead that shares height with the
  current one. The end of a line stops (no wrap). With nothing ahead in this level, the
  move crosses into another: left from a row's first tile reaches the sidebar item most
  level with it.
- Up and down go to the nearest line ahead, then the item in it closest across. They
  cross levels only into something sharing width (a bar above the rows), never a
  sidebar item off to the side.
- Each row remembers its last focus, and so does each level: down into a row lands where
  you left it, and right from the sidebar returns to the tile you came from.
- Back returns to the level focus came from. With nowhere to go back to, the shell fires
  `tk-tv-exit` and the host decides. `menu` enters the sidebar (or leaves it), `home`
  goes to the first tile and forgets the way back. Nothing traps focus: Tab and a pointer
  work as ever, and the shell remembers where they leave focus.

Levels: the sidebar is `menu`, everything else `main`; any element can name its own with
`data-tv-level`. Spatial focus lands on tiles, links, buttons, `[data-tv-focus]` and
anything with a non-negative `tabindex` inside the shell.

## Tokens

Every value is a `--tk-tv-*` custom property over a theme default, and they inherit, so
a theme on the shell reaches everything inside it.

- Colour: `bg`, `surface`, `surface-hi`, `ink`, `ink-dim`, `rule`, `ring`, `ring-inner`,
  `accent`, `osd-bg`, `osd-ink`, `guide`; tile accents `accent-emerald` … `accent-pink`,
  or `tile-accent` for one tile.
- Safe area: `safe-x` and `safe-y` are title-safe, 5% in from each edge of a 16:9 frame;
  `overscan` adds an inset for a panel that crops its edges. `guides` draws action-safe
  (93%), title-safe (90%) and the shell's padding.
- Type, readable at 3 m: `text-caption`, `text-body`, `text-title`, `text-display`: 22,
  28, 36 and 56px in a 1920-wide frame. Sizes are in container units, so the screen reads
  the same at any size, with floors that keep a narrow frame legible.
- Focus: `ring-width` (6px), `ring-offset` (3px, in `ring-inner`, so the ring shows on
  any tile or backdrop), `focus-scale` (1.06), `focus-lift` (6px).
- Tiles and rows: `tile-w`, `tile-gap`, `row-gap`, `radius`, `radius-lg`, `pad`,
  `sidebar-w`, `target-h`, `duration` (250 ms).

Design rules: no third-party names or logos as content (tiles are Films, Music, Games,
Family, Ask); the focused tile has a thick two-tone ring, lifts, grows and underlines its
title, so focus is never colour alone, and under forced colours the ring is the system
highlight. A badge is a word, the muted volume is a slashed speaker and the word Muted,
and the current menu item is a bar and a heavier weight. Radii are concentric (a sidebar
item is the panel's radius less its padding; a tile's art bleeds to its corners). Motion
(the lift, the OSD fade, the sidebar opening, smooth scrolling) is off under
`prefers-reduced-motion`, `calm` and the kit's motion pause; `calm` on the shell calms
everything in it. The OSD's line is hidden from screen readers and a polite status says
the same thing in words when it changes.

## Where it came from, and what is next

From the Bobo TV prototype (Sep 2026), a 10-foot home on a small box under the TV, and
the QCast stories: the safe-area padding, the tile grid with accent bars, the thick
focus ring, the slim icon rail that opens on focus, overscan guides, and the volume and
now-playing lines. Apps there launched as separate kiosks, so there is no player here
either. Left out: the box's server and scripts, the app names and personal tiles, and
the Swipey mascot. A companion like it could sit in the overlay slot later.

Next: the phone remote. Bobo's `pad.html` drove the screen from a phone (a touchpad and
D-pad, a type deck, a volume level with mute); rebuilt on this pack it would send the
same five verbs, through `press()` or a `tk-tv-verb`, rather than a set of its own.

## Figma

Not drawn yet: there is no Packs · TV page, so the pack isn't in `figma/keys.json`,
`onion.json` or `meta.json`, has no skins, and its stories carry no `onion` parameter.

## Tests

`npm run test:tv`: the verb mapping (keys, the gamepad pack's pads through its hub, the
keyboard pack's hub, TV remote key names), fields and shortcuts ignored, held moves
repeating, the event contract, spatial focus in a grid and across rows with memory, the
sidebar beside the rows, Back, menu and home, and the OSD's words.
