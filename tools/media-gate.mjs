#!/usr/bin/env node
/**
 * Media gate — no video in git.
 *
 * A video is a build output: record it, send it, publish it; don't commit it.
 * Every re-cut committed adds its whole size to the history forever.
 * .gitignore keeps new ones out of `git add`; this gate fails if one is
 * tracked anyway (`git add -f`, or a rename past the ignore).
 *
 * A project may exempt folders of source media (recordings of other apps it
 * ships as they are, with no script to make them again) by listing them, one
 * per line, in tools/media-exempt.txt. Input, not output. Nothing else is
 * exempt.
 *
 *   node tools/media-gate.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const VIDEO = /\.(webm|mp4|m4v|mov|mkv|avi|ogv)$/i;
const LIST = "tools/media-exempt.txt";
const EXEMPT = existsSync(LIST)
  ? readFileSync(LIST, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
  : [];

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const videos = tracked.filter((f) => VIDEO.test(f) && !EXEMPT.some((d) => f.startsWith(d)));

if (videos.length) {
  console.error(`media gate: ${videos.length} video file(s) tracked. Videos are build outputs; keep them out of git.\n`);
  for (const f of videos) console.error(`  ${f}    git rm --cached "${f}"`);
  process.exit(1);
}
console.log(`media gate: no video tracked${EXEMPT.length ? ` (${EXEMPT.length} source-media folder(s) exempt)` : ""}.`);
