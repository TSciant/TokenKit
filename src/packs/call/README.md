# Call pack

A small-group video call for TokenKit: a tile per person with their name on it, and controls
big enough to hit the first time (mute, camera, leave). It was built for the meeting room on
the account page and lifted here so any page can have one.

Plain WebRTC through a selective forwarding unit (SFU), with no vendor SDK. Each person
shares their camera and mic once and pulls everyone else's, so a call of five uploads one
stream, not four. Every step goes through a **broker you run**, so the SFU's secret never
reaches a browser. Nothing is recorded, and nothing starts until someone presses join.

| Part | What it is |
| --- | --- |
| `createCall({ send, iceServers?, media?, every? })` | The client (`call-client.mjs`, no framework). `on(fn)` gets `{ status, people, streams, local, mic, cam, error }`; `watch()` shows who's in the call without joining; `join()` asks for the camera and mic; `toggle("audio" \| "video")`; `leave()`; `destroy()`. `status` is `idle`, `joining`, `in` or `off`. |
| `useCall(send)` | The client in React: one call for the component's life. It watches once mounted, then leaves on unmount and when the page closes. |
| `<CallTiles state />` | Everyone in the call, you first: muted and mirrored, the way a mirror is. |
| `<CallTile stream name />` | One person. `muted`, `mirrored`, `off` (camera off), and the words shown while connecting or with the camera off. |
| `<CallBar state call />` | Mute, camera, leave. `leaveText` sets the leave button's words. |
| `wantTracks(people, pulled)`, `trackName(kind)` | The pure parts, tested on their own. |

Styles are `src/css/components/call.css` (`data-tk="call-tiles"`, `call-tile`, `call-tile-off`,
`call-bar`), on kit tokens only. The name tag's radius is the tile's radius less its inset
(concentric).

## The broker

`send(path, body)` resolves to `{ ok, status, data }`, and the client adds `sessionId` to every
body. Five paths:

| Path | Body | Answer |
| --- | --- | --- |
| `state` | (heartbeat) | `{ people: [{ sessionId, tracks, username, me }] }`. A 503 means calls are off. |
| `join` | | `{ sessionId }`: a new SFU session for this person. |
| `tracks` | `{ sessionDescription?, tracks }` | To share: `location: "local"` tracks with the browser's offer, answered with `{ sessionDescription }`. To pull: `location: "remote"` tracks, answered with an offer and `requiresImmediateRenegotiation`. |
| `renegotiate` | `{ sessionDescription }` | The browser's answer after a pull. |
| `leave` | `keepalive` when the page is closing | Out of the call. |

What a broker must check, and what the reference one checks:
- the person may be in this call;
- a `sessionId` is their own;
- a pulled track is one that someone in the same call is sharing;
- someone who stops checking in drops out.

The reference broker is the meeting room's (`tools/api/meet.mjs`, over
[Cloudflare Realtime](https://developers.cloudflare.com/realtime/sfu/)), with its tests in
`tools/auth/studio-smoke.mjs`. Any SFU with session and track calls of the same shape will do.

## Defaults

Video is asked for at 640×360, 24 fps; echo cancellation and noise suppression are on for audio.
STUN is Cloudflare's (`stun:stun.cloudflare.com:3478`). Pass your own `iceServers` to add TURN for
networks that block UDP. The heartbeat runs every 4 seconds.

`npm run test:call` tests the pure parts and the "off" state. The browser end needs a real SFU,
so it's checked in the meeting room.
