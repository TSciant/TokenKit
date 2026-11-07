/* Types for the gamepad pack's plain-JS modules (they run untranspiled in the game). */
export type ButtonName = 'south' | 'east' | 'west' | 'north' | 'lb' | 'rb' | 'lt' | 'rt' | 'view' | 'menu' | 'ls' | 'rs' | 'up' | 'down' | 'left' | 'right' | 'home';
export type GamepadTheme = 'boosty' | 'dark' | 'light';
export type GlyphSet = 'letters' | 'shapes' | 'numbers';
/* A hand-fed state: the buttons held, analog triggers 0..1, sticks -1..1. */
export type GamepadState = { pressed?: string[]; lt?: number; rt?: number; lx?: number; ly?: number; rx?: number; ry?: number };
export type ReplayFrame = { t: number; [field: string]: unknown };
export type ReplayMap = { name?: string; frame(f: ReplayFrame): GamepadState; labels?: Record<string, string>; notRecorded?: string[] };
export type Replay = { frames: ReplayFrame[]; start: number; duration: number; at(t: number): GamepadState & { pressed: string[]; frame: ReplayFrame | null; t: number }; events: { t: number; button: string; frame: ReplayFrame }[]; map: ReplayMap };
export interface TkGamepadElement extends HTMLElement {
  state: GamepadState;
  replay: Replay | { frames: ReplayFrame[]; map?: ReplayMap; hold?: number } | null;
  currentTime: number;
  readonly duration: number;
  highlight(names: string | string[], opts?: { pulse?: boolean }): void;
  syncTo(media: HTMLMediaElement, opts?: { offset?: number }): () => void;
  playReplay(opts?: { rate?: number; loop?: boolean }): () => void;
}
export const THEMES: GamepadTheme[];
export const GLYPH_SETS: GlyphSet[];
export const STANDARD_BUTTONS: ButtonName[];
export const BUTTON_WORDS: Record<string, string>;
export const CAR_BALL_DEFAULT: ReplayMap;
export function createReplay(frames: ReplayFrame[] | { frames: ReplayFrame[] }, opts?: { map?: ReplayMap | ((f: ReplayFrame) => GamepadState); hold?: number; timeKey?: string }): Replay;
export function defineGamepadElements(reg?: CustomElementRegistry): boolean;
export function readPad(gp: unknown, opts?: { deadzone?: number }): any;
export function syncReplayToMedia(replay: Pick<Replay, "at">, media: HTMLMediaElement, target: { state: unknown }, opts?: { offset?: number }): () => void;
export function toView(s: unknown): any;
export function createGamepadHub(opts?: Record<string, unknown>): unknown;
