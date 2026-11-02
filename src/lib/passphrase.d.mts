export function randomBelow(n: number, rand?: Pick<Crypto, "getRandomValues">): number;
export function passphrase(opts: { words: readonly string[]; count?: number; digits?: number; separator?: string; unique?: boolean; rand?: Pick<Crypto, "getRandomValues"> }): { phrase: string; words: string[]; number: string; bits: number };
