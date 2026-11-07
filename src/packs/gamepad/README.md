# Gamepad pack

A token-driven, maker-neutral game controller for TokenKit: a modern dual-stick pad, a
button-prompt chip and a 5-fret guitar glyph. Plain custom elements (no framework, no
fetch), so the same files run in Storybook, in React through `Gamepad.tsx`, and vendored
into a game.

| Element | What it is |
| --- | --- |
| `<tk-gamepad>` | The pad. `theme` boosty / dark / light, `glyphs` letters / shapes / numbers, `highlight="up south"`, `pulse`, `calm`, `size` (×340px or any CSS length), `source="live"` (+ `index`) or `source="replay"`, `label`, `status`. Properties: `state`, `replay`, `currentTime`, `duration`, `highlight(names,{pulse})`, `syncTo(video,{offset})`, `playReplay({rate,loop})`. |
| `<tk-button-prompt>` | "▲ D-pad up: Fetch". `btn`, `action`, `label`, `glyphs`, `theme`, `lit`, `pulse`. |
| `<tk-guitar>` | 5-fret guitar glyph for jam / duo modes. `theme`, `size`, `highlight`, property `state = { pressed: ['fret1'] }`. |

Buttons use the Gamepad API **standard mapping's positional names** (south, east, west,
north, lb, rb, lt, rt, view, menu, ls, rs, up, down, left, right, home), so one picture
fits Xbox, PlayStation, 8BitDo and generic USB / Bluetooth pads. A pad whose `mapping` is
not `"standard"` is shown as a raw button list, never guessed at. Connect / disconnect
emit `tk-gamepad-connect` / `tk-gamepad-disconnect`; pads are read by index.

Design rules: no maker logos, colours or symbol trade dress (the shapes set is circle /
diamond / square / triangle, never a cross-in-a-circle set); every colour is a
`--tk-gamepad-*` custom property over a theme default; motion is a 250 ms fade and an
optional 1.6 s breathe, both off under `prefers-reduced-motion` and `calm`.

## Replay source

`createReplay(frames, { map, hold })` plays recorded inputs through the same view-state as
a live pad. `CAR_BALL_DEFAULT` maps throttle to RT / LT, steer to the left stick X,
jump / double jump / dodge to A (south), boost to B (east) and powerslide to X (west).
Car-ball replays **do not record pitch, yaw or air roll**, so the left stick's Y
axis, the right stick and air roll can't be shown from a replay.

`demo/replay-goal.html` is a standalone local page: an air-dribble goal
with its inputs overlaid, synced at the wall pop (replay 1.18 s = clip 0.375 s). The clip
belongs in `demo/media/goal.mp4` and is git-ignored: it is never committed or deployed.
Storybook serves that folder at `/local-media` in dev only.

## Figma

File QZCC8HtLON5aYIAmYc56Li, page **Packs · Gamepad**: Gamepad (Theme × Glyphs × State),
ButtonPrompt (Theme × State), Guitar (Theme × State), themed with the `tk-gamepad`
variable collection (modes boosty / dark / light). Code Connect templates live in
`figma/connect/gamepad/*.figma.ts`.

## Tests

`npm run test:gamepad`: a mocked `navigator.getGamepads` (standard mapping, families,
raw fallback, junk input, several pads, connect / disconnect), the art's contract and the
replay source.

The Code Connect templates are configured for teams on a Figma Organization or Enterprise plan, which Code Connect needs; on other plans the components' documentation links point from Figma to the code instead.
