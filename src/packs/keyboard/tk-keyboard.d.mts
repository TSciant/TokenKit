/* Types for the keyboard pack's plain-JS modules (they run untranspiled in a game). */
export type KeyboardTheme = 'boosty' | 'dark' | 'light';
/* Named clusters for the `keys` attribute; anything else is a KeyboardEvent.code. */
export type KeyCluster = 'wasd' | 'arrows' | 'space' | 'shift' | 'ctrl' | 'alt' | 'tab' | 'esc' | 'enter' | 'numbers' | 'numbers9' | 'fkeys';
/* A positional key name (KeyboardEvent.code): 'KeyW', 'Space', 'ShiftLeft', 'ArrowUp'... */
export type KeyCode = string;
/* A hand-fed state: the codes held. */
export type KeyState = { pressed?: KeyCode[] };
export type KeyReplayFrame = { t: number; keys?: KeyCode[]; [field: string]: unknown };
export type KeyReplayMap = { name?: string; frame(f: KeyReplayFrame): KeyState };
export type KeyReplay = { frames: KeyReplayFrame[]; start: number; duration: number; at(t: number): { pressed: KeyCode[]; frame: KeyReplayFrame | null; t: number }; events: { t: number; code: KeyCode; frame: KeyReplayFrame }[]; map: KeyReplayMap | ((f: KeyReplayFrame) => KeyState) };
/* detail of the tk-keyboard-key event: fired on press and release, never on auto-repeat. */
export type KeyboardKeyDetail = { code: KeyCode; down: boolean; held: KeyCode[]; reason: 'release' | 'blur' | 'hidden' | 'meta' | 'clear' | null };
export interface TkKeyboardElement extends HTMLElement {
  state: KeyState;
  readonly codes: KeyCode[];
  readonly held: KeyCode[];
  /* a host's own letters, code -> character (a game's key settings); null = the browser's layout map */
  labels: Map<string, string> | Record<string, string> | null;
  replay: KeyReplay | { frames: KeyReplayFrame[]; map?: KeyReplayMap; hold?: number } | null;
  currentTime: number;
  readonly duration: number;
  readonly geometry: { viewBox: number[]; caps: { code: KeyCode; x: number; y: number; w: number; h: number }[] };
  highlight(codes: string | string[], opts?: { pulse?: boolean }): void;
  syncTo(media: HTMLMediaElement, opts?: { offset?: number; onFrame?: (s: unknown, t: number) => void }): () => void;
  playReplay(opts?: { rate?: number; loop?: boolean }): () => void;
}
export type KeyboardHub = {
  supported: boolean;
  capture: boolean;
  held(): KeyCode[];
  isHeld(code: KeyCode): boolean;
  clear(reason?: string): void;
  subscribe(fn: (held: KeyCode[]) => void): () => void;
  on(fn: (type: 'down' | 'up', detail: { code: KeyCode; held: KeyCode[]; repeat?: boolean; reason?: string }) => void): () => void;
  start(): void;
  stop(): void;
};
export const THEMES: KeyboardTheme[];
export const CLUSTERS: Record<KeyCluster, KeyCode[]>;
export const DEFAULT_KEYS: string;
export const KNOWN_CODES: KeyCode[];
export const MAIN: Record<string, [number, number, number]>;
export const ARROWS: Record<string, [number, number, number]>;
export const UNIT: number;
export const KEY_STATES: KeyReplayMap;
export function parseKeys(v?: string | string[]): KeyCode[];
export function toView(s: unknown): { pressed: KeyCode[] };
export function usLabel(code: KeyCode): string;
export function capLabel(code: KeyCode, labels?: Map<string, string> | Record<string, string> | null): string;
export function keyWord(code: KeyCode, labels?: Map<string, string> | Record<string, string> | null): string;
export function printable(code: KeyCode): boolean;
export function describeKeys(v?: string, labels?: Map<string, string> | null): string;
export function isEditableTarget(e: Event | { target?: unknown; composedPath?: () => unknown[] }): boolean;
export function createKeyboardHub(opts?: { win?: unknown; doc?: unknown; capture?: boolean }): KeyboardHub;
export function layoutLabels(nav?: unknown): Promise<Map<string, string> | null>;
export function keyboardSVG(opts?: { codes?: KeyCode[]; uid?: string; title?: string; labels?: Map<string, string> | Record<string, string> | null }): string;
export function keyboardLayout(codes: KeyCode[]): { viewBox: number[]; caps: { code: KeyCode; x: number; y: number; w: number; h: number }[] };
export function capMark(code: KeyCode, labels?: Map<string, string> | null): string;
export function createKeyReplay(frames: KeyReplayFrame[] | { frames: KeyReplayFrame[] }, opts?: { map?: KeyReplayMap | ((f: KeyReplayFrame) => KeyState); hold?: number; timeKey?: string }): KeyReplay;
export function syncKeysToMedia(replay: Pick<KeyReplay, 'at'>, media: HTMLMediaElement, target: { state: unknown }, opts?: { offset?: number; onFrame?: (s: unknown, t: number) => void }): () => void;
export function defineKeyboardElements(reg?: CustomElementRegistry): boolean;
