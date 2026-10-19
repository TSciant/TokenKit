#!/usr/bin/env node
/**
 * Client gate — every kit module that needs the client says so.
 *
 * Under the Next.js App Router a module without "use client" is a server
 * component, and a server component that calls useState, useEffect, useRef,
 * useContext or useSyncExternalStore does not render: it throws. Storybook
 * and Vite ignore the directive, so nothing else here ever notices, and seven
 * primitives (Tabs, Toast, Tooltip, MenuButton among them) shipped without it
 * because the Next demo wraps every page in a client boundary of its own.
 *
 * useId, useMemo and useCallback are allowed on the server, so they do not
 * count. The directive has to be the first statement; a comment may come
 * before it.
 *
 *   node tools/client-gate.mjs
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLIENT_ONLY = /\b(useState|useEffect|useLayoutEffect|useInsertionEffect|useRef|useReducer|useContext|createContext|useSyncExternalStore|useTransition|useDeferredValue|useImperativeHandle|useOptimistic|useActionState)\b/;

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "src/react"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.tsx?$/.test(f) && !/\.(stories|test)\./.test(f));

const missing = [];
for (const f of files) {
  let src;
  try { src = readFileSync(resolve(ROOT, f), "utf8"); } catch { continue; } // deleted, not yet staged
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const hook = code.match(CLIENT_ONLY);
  if (!hook) continue;
  const first = code.trimStart().split("\n")[0].trim();
  if (!/^["']use client["'];?$/.test(first)) missing.push(`${f}  (uses ${hook[1]})`);
}

console.log(`\ntokenkit client gate — ${files.length} kit modules\n`);
if (missing.length) {
  for (const m of missing) console.log(`FAIL  ${m} — needs "use client" as its first statement`);
  console.log(`\n${missing.length} module(s). Client gate FAILED.`);
  process.exit(1);
}
console.log("Every module that needs the client says so. Client gate passed.");
