/* The call pack's client (Tony, 2026-11-02: "We should appropriate pieces to token kit as needed for video chat").
   A small-group video call over a selective forwarding unit (SFU), first written for the account page's meeting rooms
   and lifted here so any page can have one. No framework and no vendor SDK: plain WebRTC, and every step goes through a
   broker you pass in, so the SFU's secret stays on your server.

   The broker answers five calls (tools/api/meet.mjs is the reference one, over Cloudflare Realtime):
     state       → { people: [{ sessionId, tracks, username, me }] }   who's in the call; also the heartbeat
     join        → { sessionId }                                       a new SFU session for this person
     tracks      { sessionDescription?, tracks }                       share your own tracks (location "local", with
                 → { sessionDescription, tracks, requiresImmediateRenegotiation }   the browser's offer) or pull
                                                                       other people's (location "remote")
     renegotiate { sessionDescription }                                the browser's answer after a pull
     leave                                                             out of the call
   `send(path, body)` makes each one and resolves to { ok, status, data }; the client adds `sessionId` to every body.

     const call = createCall({ send });
     call.on((s) => render(s));   // { status, people, streams, local, mic, cam, error }
     await call.join();           // asks for the camera and mic
     call.toggle("audio");  call.leave();
   A 503 from state means calls aren't switched on: status "off". Nothing is recorded, and nothing starts before join. */

export const STUN = [{ urls: "stun:stun.cloudflare.com:3478" }];

/* The remote tracks still to pull: everyone else's, minus what's pulled already ("session/track" keys). */
export function wantTracks(people, pulled) {
  return people.filter((p) => !p.me).flatMap((p) => (p.tracks ?? []).filter((t) => !pulled.has(`${p.sessionId}/${t}`)).map((trackName) => ({ location: "remote", sessionId: p.sessionId, trackName })));
}
/* A name for each of your own tracks: its kind and a short random mark, e.g. "video-k3x9q2". */
export const trackName = (kind, mark = Math.random().toString(36).slice(2, 8)) => `${kind}-${mark}`;

export function createCall({ send, iceServers = STUN, media = { audio: { echoCancellation: true, noiseSuppression: true }, video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } } }, every = 4000 } = {}) {
  const fns = new Set();
  let s = { status: "idle", people: [], streams: {}, local: null, mic: true, cam: true, error: "" };
  let pc = null, sessionId = null, pulled = new Set(), owner = new Map(), queue = Promise.resolve(), timer = null;
  const set = (patch) => { s = { ...s, ...patch }; fns.forEach((fn) => fn(s)); };
  const ask = (path, body = {}) => send(path, { ...body, sessionId });
  const why = (r, fallback) => (r?.data?.message ? String(r.data.message) : fallback);
  /* One negotiation at a time on the connection. */
  const serial = (fn) => { const p = queue.then(fn, fn); queue = p.catch(() => {}); return p; };

  async function look() {
    const r = await ask("state");
    if (r.status === 503) { stopTimer(); return set({ status: "off" }); }
    if (!r.ok) return;
    const people = r.data.people ?? [];
    const here = new Set(people.map((p) => p.sessionId));
    set({ people, streams: Object.fromEntries(Object.entries(s.streams).filter(([sid]) => here.has(sid))) });
    if (!pc || !sessionId) return;
    const want = wantTracks(people, pulled);
    if (!want.length) return;
    want.forEach((t) => pulled.add(`${t.sessionId}/${t.trackName}`));
    await serial(async () => {
      const pr = await ask("tracks", { tracks: want });
      if (!pr.ok) { want.forEach((t) => pulled.delete(`${t.sessionId}/${t.trackName}`)); return; }
      for (const t of pr.data.tracks ?? []) if (t.mid) owner.set(String(t.mid), t.sessionId);
      if (pr.data.requiresImmediateRenegotiation && pr.data.sessionDescription) {
        await pc.setRemoteDescription(pr.data.sessionDescription);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await ask("renegotiate", { sessionDescription: { type: "answer", sdp: answer.sdp } });
      }
    });
  }

  async function join() {
    if (s.status === "in" || s.status === "joining") return;
    set({ status: "joining", error: "" });
    let local;
    try { local = await navigator.mediaDevices.getUserMedia(media); }
    catch { return set({ status: "idle", error: "The browser didn't let us use the camera and microphone. Allow them (the camera icon by the address) and join again." }); }
    pc = new RTCPeerConnection({ iceServers, bundlePolicy: "max-bundle" });
    pulled = new Set(); owner = new Map();
    pc.ontrack = (e) => {
      const sid = owner.get(String(e.transceiver.mid)); if (!sid) return;
      const ms = s.streams[sid] ?? new MediaStream();
      ms.getTracks().filter((t) => t.kind === e.track.kind).forEach((t) => ms.removeTrack(t));
      ms.addTrack(e.track);
      set({ streams: { ...s.streams, [sid]: ms } });
    };
    const sent = local.getTracks().map((track) => ({ track, tr: pc.addTransceiver(track, { direction: "sendonly" }) }));
    set({ local });
    try {
      const j = await ask("join");
      if (!j.ok) throw new Error(why(j, "The call didn't start."));
      sessionId = j.data.sessionId;
      await serial(async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const mark = Math.random().toString(36).slice(2, 8);
        const r = await ask("tracks", { sessionDescription: { type: "offer", sdp: offer.sdp }, tracks: sent.map(({ track, tr }) => ({ location: "local", mid: tr.mid, trackName: trackName(track.kind, mark) })) });
        if (!r.ok) throw new Error(why(r, "Your camera didn't reach the call."));
        await pc.setRemoteDescription(r.data.sessionDescription);
      });
      set({ status: "in", mic: true, cam: true });
      startTimer(); look();
    } catch (err) { leave(); set({ error: err instanceof Error ? err.message : "The call didn't start." }); }
  }

  /* `beacon` sends the leave with keepalive, for a page that's closing. */
  function leave({ beacon = false } = {}) {
    s.local?.getTracks().forEach((t) => t.stop());
    pc?.close();
    if (sessionId) { const p = send("leave", { sessionId, keepalive: beacon }); p?.catch?.(() => {}); }
    pc = null; sessionId = null; pulled = new Set(); owner = new Map(); queue = Promise.resolve();
    set({ status: s.status === "off" ? "off" : "idle", streams: {}, local: null });
  }
  function toggle(kind) {
    const key = kind === "audio" ? "mic" : "cam", on = !s[key];
    s.local?.getTracks().filter((t) => t.kind === kind).forEach((t) => { t.enabled = on; });
    set({ [key]: on });
  }
  function startTimer() { stopTimer(); timer = setInterval(() => { if (document.visibilityState === "visible" || sessionId) look(); }, every); }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }

  return {
    on(fn) { fns.add(fn); fn(s); return () => fns.delete(fn); },
    get state() { return s; },
    /* Watch who's in the call without joining (the button can say who's there). */
    watch() { look(); startTimer(); },
    join, leave, toggle, look,
    destroy() { stopTimer(); if (sessionId) leave({ beacon: true }); fns.clear(); },
  };
}
