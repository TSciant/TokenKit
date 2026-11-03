# Keyboard pack

A token-driven, maker-neutral keyboard view for TokenKit, the gamepad pack's sibling: only
the keys a game uses, drawn where they sit on a keyboard, and a key-cap prompt chip.
Plain custom elements (no framework, no fetch), so the same files run in Storybook, in
React through `Keyboard.tsx`, and vendored into a game.

| Element | What it is |
| --- | --- |
| `<tk-keyboard>` | The keys. `keys` (clusters and codes, default `wasd arrows space shift`), `theme` boosty / dark / light, `highlight="KeyW Space"`, `pulse`, `calm`, `size` (× the natural width, 44px a key, or any CSS length), `source="live"` (+ `capture`) or `source="replay"`, `layout` auto / us, `label`, `status`. Properties: `state`, `labels`, `codes`, `held`, `replay`, `currentTime`, `duration`, `geometry`, `highlight(codes,{pulse})`, `syncTo(video,{offset})`, `playReplay({rate,loop})`. |
| `<tk-key-prompt>` | "[W] Move forward". `key` (a code; `code` works too, and is the React prop, since React keeps `key`), `action`, `label`, `theme`, `lit`, `pulse`, `layout`; property `labels`. |

Keys are named by **`KeyboardEvent.code`**, which is positional: `KeyW` is the key where a
US board prints W, whatever the layout prints there, so WASD stays under the left hand on
AZERTY, QWERTZ or Dvorak. Caps show the layout's own letter from
`navigator.keyboard.getLayoutMap()` where the browser offers it (Chromium, secure, top
level), else the US label; `layout="us"` pins US caps, and a host can pass its own letters
with the `labels` property.

Clusters: `wasd` (W A S D with Q and E beside them), `arrows` (the inverted T), `space`,
`shift`, `ctrl`, `alt`, `tab`, `esc`, `enter`, `numbers` (1–4), `numbers9` (1–9), `fkeys`
(F1–F4). Anything else in `keys` is a single code: `KeyF`, `KeyR`, `Digit5`, `F9`. The
main block's keys sit at their ANSI positions on one deck cropped to them; the arrows keep
their own group to the right, bottoms aligned. Codes outside the main block and the arrows
(the numpad, Home, Delete) aren't drawn.

Live input: keydown / keyup on `window`, by code. The typed character (`event.key`) is
never read, kept or sent anywhere. Keys pressed while focus is in an input, textarea,
select or contenteditable are ignored unless `capture` is set; a release always counts.
Every held key is let go on blur and when the page is hidden, and releasing Meta lets go
of the keys macOS never sends a keyup for, so nothing sticks. Auto-repeat and IME
composition change nothing. Each press and release fires `tk-keyboard-key` with
`{ code, down, held, reason }`. Listeners go on with the element and come off with it.

Design rules: no maker logos, legend fonts or colourways; every colour is a
`--tk-keyboard-*` custom property over a theme default; radii are concentric (the cap's
face, the deck and the highlight ring are the cap's radius less or plus the gap between
them). A held key is filled, outlined and sunk, never only recoloured, and under forced
colours it takes the system highlight. The element has an accessible name (the keys
drawn and any highlighted) and announces nothing on a key press: there is no live region.
Motion is a 250 ms fade and an optional 1.6 s breathe, both off under
`prefers-reduced-motion`, `calm` and the kit's motion pause.

## Replay source

`createKeyReplay(frames, { map, hold })` plays recorded key states through the same
view-state as live input. Frames are `{ t, keys: ['KeyW', 'ShiftLeft'] }`, each the keys
held from `t` until the next frame; a `map` turns a game's own frame shape
(`{ forward, jump }`) into codes, and `hold` keeps a short tap visible. `syncTo(video,
{ offset })` (or `syncKeysToMedia`) rides the keys on footage, drawing on seeks and only
asking for frames while the video plays.

`replays/sample-run.json` is a made-up six-second run (walk, sprint, jump, strafe, use)
for the stories and tests.

## Figma

The Packs · Keyboard page in the kit file: **Keyboard**
([561:1503](https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=561-1503), Theme ×
Keys (Default, WASD, Arrows) × State (Idle, Highlight, Pressed)) and **KeyPrompt**
([562:177](https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=562-177), Theme ×
State). Colours bind to the `tk-keyboard` variable collection (modes boosty / dark / light, the
`--tk-keyboard-*` defaults); legends are Manrope, the kit's face. Both are in `figma/keys.json`,
`onion.json` and `meta.json` with 1x skins, the `Onion skin` and `Prompt onion skin` stories
draw the default variants, and Code Connect templates are in `figma/connect/keyboard` (not
published).

## Tests

`npm run test:keyboard`: mocked KeyboardEvents (positional codes, held and released,
auto-repeat and IME ignored, blur and hidden-page clearing, the Meta release, fields
ignored unless `capture`, listeners on and off), the layout map, the art's contract and
the replay source.
