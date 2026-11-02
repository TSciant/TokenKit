import { test } from "node:test";
import assert from "node:assert/strict";
import { wantTracks, trackName, createCall } from "../call-client.mjs";

const people = [
  { sessionId: "me1", tracks: ["audio-a", "video-a"], username: "me", me: true },
  { sessionId: "s2", tracks: ["audio-b", "video-b"], username: "dad", me: false },
  { sessionId: "s3", tracks: [], username: "late", me: false },
];

test("pulls everyone else's tracks, never your own", () => {
  assert.deepEqual(wantTracks(people, new Set()), [
    { location: "remote", sessionId: "s2", trackName: "audio-b" },
    { location: "remote", sessionId: "s2", trackName: "video-b" },
  ]);
});
test("skips tracks already pulled", () => {
  assert.deepEqual(wantTracks(people, new Set(["s2/audio-b"])).map((t) => t.trackName), ["video-b"]);
});
test("track names: kind and a mark, safe for the broker", () => {
  assert.equal(trackName("video", "k3x9q2"), "video-k3x9q2");
  assert.match(trackName("audio"), /^audio-[a-z0-9]{1,6}$/);
});
test("a 503 from the broker means calls are off, and nothing is asked of the camera", async () => {
  const asked = [];
  const call = createCall({ send: async (path) => { asked.push(path); return { ok: false, status: 503, data: { message: "off" } }; } });
  await call.look();
  assert.equal(call.state.status, "off");
  assert.deepEqual(asked, ["state"]);
  call.destroy();
});
