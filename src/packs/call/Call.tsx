/* The call pack in React: a hook over the client, a tile per person and the call's controls. Words and layout stay the
   host's: the meeting room says "Start a call"; another page can say anything. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../../react/primitives/Button";
import { createCall, type Call, type CallSend, type CallState } from "./call-client.mjs";

/* One call for the component's life: watches who's in it once mounted (a read, nothing more) and leaves on unmount
   or when the page closes. Pass a new key to start over. */
export function useCall(send: CallSend, { watch = true }: { watch?: boolean } = {}): [CallState, Call] {
  const ref = useRef<Call | null>(null);
  ref.current ??= createCall({ send });
  const [state, setState] = useState<CallState>(ref.current.state);
  useEffect(() => {
    const call = (ref.current ??= createCall({ send }));
    const off = call.on(setState);
    if (watch) call.watch();
    const bye = () => call.destroy();
    addEventListener("pagehide", bye);
    return () => { off(); removeEventListener("pagehide", bye); call.destroy(); ref.current = null; };
  }, []);
  return [state, ref.current];
}

export type CallTileProps = { stream?: MediaStream | null; name: string; muted?: boolean; mirrored?: boolean; off?: boolean; waiting?: string; offText?: string; style?: CSSProperties };
/* A person's picture with their name on it. Your own tile is muted (no echo) and mirrored, as a mirror is. */
export function CallTile({ stream, name, muted = false, mirrored = false, off = false, waiting = "Connecting…", offText = "Camera off", style }: CallTileProps) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current && stream && ref.current.srcObject !== stream) ref.current.srcObject = stream; }, [stream, off]);
  return (
    <figure data-tk="call-tile" style={style}>
      {stream && !off ? <video ref={ref} autoPlay playsInline muted={muted} data-mirrored={mirrored || undefined} /> : <div data-tk="call-tile-off" aria-hidden="true">{stream ? offText : waiting}</div>}
      <figcaption>{name}</figcaption>
    </figure>
  );
}

export type CallTilesProps = { state: CallState; you?: string };
/* Everyone in the call, you first. */
export function CallTiles({ state, you = "You" }: CallTilesProps) {
  return (
    <div data-tk="call-tiles">
      <CallTile stream={state.local} name={you} muted mirrored off={!state.cam} />
      {state.people.filter((p) => !p.me).map((p) => <CallTile key={p.sessionId} stream={state.streams[p.sessionId]} name={`@${p.username}`} />)}
    </div>
  );
}

export type CallBarProps = { state: CallState; call: Pick<Call, "toggle" | "leave">; leaveText?: string };
/* Mute, camera and leave: big enough to hit first time. */
export function CallBar({ state, call, leaveText = "Leave the call" }: CallBarProps) {
  return (
    <div data-tk="call-bar">
      <Button onClick={() => call.toggle("audio")} variant="outline" aria-pressed={!state.mic}>{state.mic ? "Mute" : "Unmute"}</Button>
      <Button onClick={() => call.toggle("video")} variant="outline" aria-pressed={!state.cam}>{state.cam ? "Camera off" : "Camera on"}</Button>
      <Button onClick={() => call.leave()} tone="danger">{leaveText}</Button>
    </div>
  );
}
