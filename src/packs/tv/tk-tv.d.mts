/* Types for the TV pack's plain-JS modules (they run untranspiled in a game or on a box). */
export type TvTheme = 'boosty' | 'dark' | 'light';
export type TvAccent = 'emerald' | 'violet' | 'amber' | 'cyan' | 'pink' | 'none';
export type TvVerb = 'move' | 'select' | 'back' | 'home' | 'menu';
export type TvDirection = 'up' | 'down' | 'left' | 'right';
export type TvInput = 'keys' | 'pad';
export type TvOsdKind = 'volume' | 'now-playing' | 'message';
/* detail of the tk-tv-verb event (bubbling, composed, cancelable) and of remote.on() */
export type TvVerbDetail = { verb: TvVerb; dir: TvDirection | null; source: 'key' | 'keyboard' | 'pad' | 'api' | string; code: string | null; defaultPrevented?: boolean };
/* detail of the tk-tv-select event a tile fires when chosen (click, Enter, A, the remote's select) */
export type TvSelectDetail = { label: string; href: string | null };
export type TvRect = { x: number; y: number; w: number; h: number };
export type TvItem<K = unknown> = { key: K; rect: TvRect; row?: unknown; level?: string; el?: Element };

export interface TvRemote {
  on(fn: (d: TvVerbDetail) => void): () => void;
  press(verb: TvVerb, dir?: TvDirection | null, source?: string): TvVerbDetail | null;
  start(): void;
  stop(): void;
  readonly running: boolean;
}
export interface TvFocusNav<K = unknown> {
  move(dir: TvDirection): TvItem<K> | null;
  back(): TvItem<K> | false;
  enter(level: string): TvItem<K> | null;
  home(): TvItem<K> | null;
  remember(item: TvItem<K>): void;
  readonly depth: number;
  lastIn(row: unknown): K | null;
  reset(): void;
}
export interface TkTvShellElement extends HTMLElement {
  readonly nav: TvFocusNav<Element>;
  items(): TvItem<Element>[];
  currentItem(): TvItem<Element> | null;
  levelOf(el: Element): string;
  /* a verb from anywhere (an on-screen D-pad, a phone remote), handled as the remote's are */
  press(verb: TvVerb, dir?: TvDirection): TvVerbDetail | null;
  /* the default for one verb, without an event */
  act(verb: TvVerb, dir?: TvDirection): unknown;
}
export interface TkTvTileElement extends HTMLElement { activate(): void }
export interface TkTvOsdElement extends HTMLElement {
  show(o?: { kind?: TvOsdKind; value?: number; muted?: boolean; label?: string; detail?: string; paused?: boolean }): void;
  hide(): void;
  readonly summary: string;
}

export const THEMES: TvTheme[];
export const ACCENTS: Exclude<TvAccent, 'none'>[];
export const OSD_KINDS: TvOsdKind[];
export const SIZES: Record<string, string>;
export const FOCUSABLE: string;
export const VERBS: TvVerb[];
export const DIRECTIONS: TvDirection[];
export const VERB_WORDS: Record<TvVerb, string>;
export const KEY_VERBS: Record<string, [TvVerb, TvDirection?]>;
export const REMOTE_KEY_NAMES: Record<string, [TvVerb]>;
export const PAD_VERBS: Record<string, [TvVerb, TvDirection?]>;
export function verbForKey(code: string, key?: string): [TvVerb, TvDirection?] | null;
export function verbForButton(name: string): [TvVerb, TvDirection?] | null;
export function stickDirection(lx?: number, ly?: number, threshold?: number): TvDirection | null;
export function createPadReader(opts?: { delay?: number; rate?: number; threshold?: number }): { step(pads: unknown[], now: number): { verb: TvVerb; dir: TvDirection | null; code: string; pad: number; repeat: boolean }[]; reset(): void };
export function createRemote(opts?: { target?: EventTarget | null; keys?: boolean; keyboard?: unknown; pad?: unknown; capture?: boolean; repeat?: { delay?: number; rate?: number; threshold?: number }; now?: () => number; accept?: (d: TvVerbDetail) => boolean }): TvRemote;
export function createFocusNav<K = unknown>(opts: { items: () => TvItem<K>[]; current: () => TvItem<K> | null; focus: (item: TvItem<K>) => void }): TvFocusNav<K>;
export function pickNext<K = unknown>(from: TvItem<K>, items: TvItem<K>[], dir: TvDirection): TvItem<K> | null;
export function isAhead(a: TvRect, b: TvRect, dir: TvDirection): boolean;
export function rectOf(b: DOMRect | { left?: number; top?: number; width?: number; height?: number; x?: number; y?: number } | null): TvRect | null;
export function osdSummary(o?: { kind?: TvOsdKind; value?: number | string | null; muted?: boolean; label?: string; detail?: string; paused?: boolean }): string;
export function defineTvElements(reg?: CustomElementRegistry): boolean;
