import type { Replay, TkGamepadElement } from './tk-gamepad.mjs';
export const GOAL_CLIP_OFFSET: number;
export const REPLAY_OVERLAY_CSS: string;
export function stickMeaning(pos?: { x: number; y: number; z: number } | null): string;
export function mountReplayOverlay(host: HTMLElement, data: unknown, opts?: { hold?: number; theme?: string; size?: string; glyphs?: string; title?: string; chips?: 'full' | 'compact' }): { replay: Replay; pad: TkGamepadElement; show(t: number): void; sync(video: HTMLVideoElement, offset?: number): () => void };
