# Instruments pack

Playable 3D instruments for TokenKit, modelled at true proportions: a six-string guitar neck
and a piano keyboard. Plain custom elements (three.js only, no framework), so the same files
run in Storybook, in React through `Instruments.tsx`, and vendored into a game. They read a
gamepad or a 5-fret guitar controller through `binding`, but need neither: the controller
pictures themselves (`<tk-gamepad>`, `<tk-guitar>`) stay in the gamepad pack.

| Element | What it is |
| --- | --- |
| `<tk-guitar-neck>` | A playable 3D six-string neck (three.js, `tk-guitar-neck.mjs`, imported on its own). `frets` (5–22), `highlight="s6f5 s5f7"`, `pulse`, `calm`, `sound`, `theme`, `size`, `label`. Properties: `state = { pressed: ['s6f5'] }` or controller buttons through `binding`, `pluck(string, fret)`, `strum()`, `loadSound()`. Fires `tk-guitar-note`. |
| `<tk-piano-keys>` | A playable 3D piano keyboard (three.js, `tk-piano-keys.mjs`, imported on its own). `keys` (25, 37, 49, 61, 76, 88) or `range="F3-F5"`, `highlight="C4 E4 G4"`, `pulse`, `calm`, `sound`, `theme`, `size`, `label`. Properties: `state = { pressed: ['C4'] }` or gamepad buttons through `binding`, `sustain`, `press(note)`, `release(note)`, `play(notes, { duration })`, `down`, `loadSound()`. Fires `tk-piano-note` and `tk-piano-release`. |

Colours are `--tk-gamepad-*` custom properties over a theme default (boosty / dark / light),
shared with the gamepad pack so a game's controller and its instruments match.

## Guitar neck

`<tk-guitar-neck>` is modelled at true proportions: a 25.5" scale with every fret wire at
`s - s / 2^(n/12)` from the nut, a 12" radius board, real string gauges and a 3+3 headstock.
Positions are `s{string}f{fret}`, with strings numbered as players number them (1 = high e, 6 = low E)
and fret 0 = open; high e is drawn on top, as in tab. Every position is bound to its note
in standard tuning (`guitar-tone.mjs`: `noteAt`, `noteName`, `fretDistance`).

Play it by tapping or dragging across the strings, or focus it and use the arrows, then Space
(each move is announced: "String 6, fret 5, A 2"). A 5-fret controller plays it through
`binding`: the default is an A minor pentatonic box at the 5th fret (fret1..fret5 = A C D E G),
and `strum` plays what is held, low to high, one note per string.

With `sound` it plays real recordings, never synthesis: 17 notes of an Epiphone electric
(Karoryfer "Emily" guitar, played by D. Smolken, CC0; `guitar-samples/LICENSE`), a minor
third apart, so any note is a recording shifted by at most a semitone. About 0.6 MB, fetched
on the first note. Without `sound` the element fetches nothing.

## Piano keys

`<tk-piano-keys>` is modelled at true proportions: 23.5 mm white keys (an octave is 164.5 mm),
notched round 13.7 mm black keys that stand 12.7 mm proud and run 95 of the whites' 150 mm.
The black keys are spaced as a real keyboard spaces them, not centred on the gaps: C# and D#
split C..E in fifths, F# G# A# split F..B in sevenths. Keys dip about 10 mm on pivots far
back in the action, between cheek blocks, a red felt strip and a gloss fallboard
(`piano-tone.mjs`: `keyX`, `isBlack`, `parseNote`, `KEYBOARDS`).

Notes are named with sharps, middle C = C4 = MIDI 60 (flats are read too: `Db4`). Play it by
tapping, holding or dragging (a glissando; each finger is its own key), or focus it and use
Left/Right (a key), Up/Down (an octave), Home/End, then Space, which holds the key while held.
Each move is announced ("F sharp 4"). A gamepad plays it through `binding`: the default is a
C major pentatonic around middle C (west C4, south D4, east E4, north G4, LB A4, RB C5) with
RT as the sustain pedal. Keys sound on the way down and are damped on the way up, unless the
pedal is down.

With `sound` it plays real recordings, never synthesis: 30 notes of a Kawai upright
(FreePats "Upright Piano KW", recorded by Gonzalo and Roberto, CC0; `piano-samples/LICENSE`),
a minor third apart from A0 to C8, so any key is a recording shifted by at most a semitone.
About 1.3 MB in all; each note is fetched the first time it is needed, or all at once with
`loadSound()`. Without `sound` the element fetches nothing. Both instruments share one
sampler (`sampler.mjs`).

## Tests

`npm run test:instruments`: the guitar's tone map (tuning, fret distances, a recording
within a semitone of every note on 22 frets), and the piano's key map (52 white and 36 black
keys, where each one sits, keyboard sizes, a recording within a semitone of every key, the
binding).
