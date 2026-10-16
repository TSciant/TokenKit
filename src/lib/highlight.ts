/**
 * highlight — a snippet split into the kinds a reader recognises.
 *
 * Code (src/react/primitives/Code.tsx) colours each kind from the pack's
 * tk-code set, so a snippet reads as code rather than as a block of text. It
 * is a scanner, not a parser: enough to tell a keyword from a string from a
 * selector in the few lines a snippet holds, for the languages a design
 * system's snippets are written in. A real grammar library would know more
 * and bring its own colours; this knows enough and brings none.
 *
 * Three families: markup (html, xml, svg), css (css, scss, sass, less) and
 * script (js, jsx, ts, tsx, json, actionscript). A language it does not know,
 * or "text", comes back whole and plain. Without a language it infers one
 * from the snippet: markup if it opens with a tag, css if it has a rule and a
 * declaration and no script words, otherwise script.
 *
 * The pieces always join back into exactly the code given: highlighting can
 * never change a character, only say what kind each is.
 */

export type CodeKind = "keyword" | "tag" | "property" | "string" | "number" | "comment" | "punctuation";
export type CodePiece = { text: string; kind?: CodeKind };
type Family = "markup" | "css" | "script" | "plain";

const FAMILY: Record<string, Family> = {
  html: "markup", xml: "markup", svg: "markup", markup: "markup",
  css: "css", scss: "css", sass: "css", less: "css",
  js: "script", javascript: "script", mjs: "script", jsx: "script", ts: "script", tsx: "script", typescript: "script", json: "script", actionscript: "script", as: "script",
  text: "plain", plain: "plain", txt: "plain",
};

/** The language a snippet looks like, when it does not say. */
export function inferLanguage(code: string): "html" | "css" | "js" {
  /* "class" and "new" are words a tag's attributes and text use too, so they
     only count against css, not against markup */
  const scripty = /\b(const|let|var|function|return)\b|=>/.test(code);
  if (/^\s*<(!--|!doctype|[a-z][\w-]*[\s>/])/i.test(code) && !scripty) return "html";
  if (!scripty && !/\b(import|export|class|new)\b/.test(code) && /\{/.test(code) && /[\w-]+\s*:\s*[^;{}]+;/.test(code)) return "css";
  return "js";
}

/** The snippet in pieces, each with its kind (or none, for plain text). */
export function highlight(code: string, language?: string): CodePiece[] {
  const family = FAMILY[(language || inferLanguage(code)).toLowerCase()];
  if (!family) return [{ text: code }];
  const pieces = family === "markup" ? markup(code) : family === "css" ? css(code) : family === "script" ? script(code) : [{ text: code }];
  /* adjacent pieces of one kind become one span */
  const out: CodePiece[] = [];
  for (const p of pieces) {
    if (!p.text) continue;
    const last = out[out.length - 1];
    if (last && last.kind === p.kind) last.text += p.text;
    else out.push({ ...p });
  }
  return out;
}

/* --- a small sticky scanner -------------------------------------------------- */
const at = (re: RegExp, s: string, i: number) => {
  re.lastIndex = i;
  const m = re.exec(s);
  return m ? m[0] : null;
};
const STRING = /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y;
const SPACE = /\s+/y;

/* --- script: js, jsx, ts, json, actionscript --------------------------------- */
const KEYWORDS = new Set(
  ("break case catch class const continue debugger default delete do else enum export extends false finally for function " +
    "if implements import in instanceof interface let new null of package private protected public return static super " +
    "switch this throw true try typeof undefined var void while with yield async await as from type " +
    "on dynamic final override").split(" "),
);
const NUMBER = /(?:0x[\da-f]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?)\b/iy;
const IDENT = /[A-Za-z_$][\w$]*/y;
const SCRIPT_COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y;
const TEMPLATE = /`(?:\\[\s\S]|[^`\\])*`?/y;

function script(s: string): CodePiece[] {
  const out: CodePiece[] = [];
  /* modes: js; a JSX tag's attributes; a JSX element's children; js inside {} in JSX */
  type Mode = { m: "js" | "tag" | "children"; depth: number };
  const stack: Mode[] = [{ m: "js", depth: 0 }];
  let prev = ""; /* the last significant piece, to tell a JSX tag from a less-than */
  const push = (text: string, kind?: CodeKind) => {
    out.push({ text, kind });
    if (text.trim()) prev = text.trim();
  };
  let i = 0;
  while (i < s.length) {
    const mode = stack[stack.length - 1];
    let t: string | null;
    if (mode.m === "children") {
      if ((t = at(/<\/[A-Za-z][\w.]*/y, s, i))) {
        push("</", "punctuation"); push(t.slice(2), "tag"); i += t.length;
        const close = at(/\s*>/y, s, i); if (close) { push(close, "punctuation"); i += close.length; }
        stack.pop(); continue;
      }
      if ((t = at(/<[A-Za-z][\w.]*/y, s, i))) { push("<", "punctuation"); push(t.slice(1), "tag"); i += t.length; stack.push({ m: "tag", depth: 0 }); continue; }
      if (s[i] === "{") { push("{", "punctuation"); i++; stack.push({ m: "js", depth: 0 }); continue; }
      t = at(/[^<{]+/y, s, i)!; push(t); i += t.length; continue;
    }
    if (mode.m === "tag") {
      if ((t = at(SPACE, s, i))) { push(t); i += t.length; continue; }
      if ((t = at(/\/>/y, s, i))) { push(t, "punctuation"); i += 2; stack.pop(); continue; }
      if (s[i] === ">") { push(">", "punctuation"); i++; stack.pop(); stack.push({ m: "children", depth: 0 }); continue; }
      if (s[i] === "{") { push("{", "punctuation"); i++; stack.push({ m: "js", depth: 0 }); continue; }
      if ((t = at(STRING, s, i))) { push(t, "string"); i += t.length; continue; }
      if ((t = at(/[\w:-]+/y, s, i))) { push(t, "property"); i += t.length; continue; }
      push(s[i], "punctuation"); i++; continue;
    }
    /* js */
    if ((t = at(SPACE, s, i))) { push(t); i += t.length; continue; }
    if ((t = at(SCRIPT_COMMENT, s, i))) { push(t, "comment"); i += t.length; continue; }
    if ((t = at(TEMPLATE, s, i)) || (t = at(STRING, s, i))) {
      /* a quoted key in an object ("idle": ...) is a property, like an unquoted one */
      const keyed = /^\s*:(?!:)/.test(s.slice(i + t.length)) && /^[{,]$/.test(prev);
      push(t, keyed ? "property" : "string"); i += t.length; continue;
    }
    if ((t = at(/<[A-Za-z][\w.]*/y, s, i)) && (prev === "" || /^(return|[(={,?:>&|;]|=>)$/.test(prev) || prev.endsWith("("))) {
      push("<", "punctuation"); push(t.slice(1), "tag"); i += t.length; stack.push({ m: "tag", depth: 0 }); continue;
    }
    if ((t = at(NUMBER, s, i)) && !/[\w$]/.test(s[i - 1] ?? "")) { push(t, "number"); i += t.length; continue; }
    if ((t = at(IDENT, s, i))) {
      const after = s.slice(i + t.length);
      let kind: CodeKind | undefined;
      /* a member or an object's key is a property even when it is spelled like a keyword (type, from, default) */
      if (s[i - 1] === ".") kind = "property";
      else if (/^\s*:(?!:)/.test(after) && /^[{,]$/.test(prev)) kind = "property";
      else if (KEYWORDS.has(t)) kind = "keyword";
      push(t, kind); i += t.length; continue;
    }
    if (s[i] === "{") { mode.depth++; push("{", "punctuation"); i++; continue; }
    if (s[i] === "}") {
      push("}", "punctuation"); i++;
      if (mode.depth === 0 && stack.length > 1) stack.pop(); else mode.depth = Math.max(0, mode.depth - 1);
      continue;
    }
    if ((t = at(/=>|[!=]==?|[<>]=?|&&|\|\||\+\+|--|[-+*/%&|^~?:;,.()[\]=]/y, s, i))) { push(t, "punctuation"); i += t.length; continue; }
    push(s[i]); i++;
  }
  return out;
}

/* --- css: css, scss, sass, less ---------------------------------------------- */
function css(s: string): CodePiece[] {
  const out: CodePiece[] = [];
  const push = (text: string, kind?: CodeKind) => out.push({ text, kind });
  let i = 0;
  let selector = true; /* this statement is a selector or an at-rule prelude, not a declaration */
  let bracket = 0; /* inside an attribute selector's [ ] */
  let afterColon = false; /* in a declaration's value */
  let start = 0; /* where this statement began */
  /* At each statement's start: is a { or a ; (or }) next? */
  const statement = (from: number) => {
    const rest = s.slice(from).replace(/\/\*[\s\S]*?\*\//g, "");
    const m = /[{};]/.exec(rest);
    selector = !!m && m[0] === "{";
    afterColon = false;
    start = from;
  };
  statement(0);
  while (i < s.length) {
    let t: string | null;
    if ((t = at(SPACE, s, i))) { push(t); i += t.length; continue; }
    if ((t = at(/\/\*[\s\S]*?(?:\*\/|$)/y, s, i)) || (!/[:\w]/.test(s[i - 1] ?? "") && (t = at(/\/\/[^\n]*/y, s, i)))) { push(t, "comment"); i += t.length; continue; }
    if ((t = at(STRING, s, i))) { push(t, "string"); i += t.length; continue; }
    if (s[i] === "{" || s[i] === ";" || s[i] === "}") { push(s[i], "punctuation"); i++; statement(i); continue; }
    if ((t = at(/@[\w-]+/y, s, i))) { push(t, "keyword"); i += t.length; continue; }
    if ((t = at(/!important\b/y, s, i))) { push(t, "keyword"); i += t.length; continue; }
    if (selector) {
      if (s[i] === "[") { bracket++; push("[", "punctuation"); i++; continue; }
      if (s[i] === "]") { bracket = Math.max(0, bracket - 1); push("]", "punctuation"); i++; continue; }
      if (bracket && (t = at(/[\w-]+/y, s, i))) { push(t, "property"); i += t.length; continue; }
      if ((t = at(/::?[\w-]+/y, s, i))) { push(t, "keyword"); i += t.length; continue; }
      if ((t = at(/[.#]?-?[A-Za-z_][\w-]*|&|\*/y, s, i))) {
        /* in an at-rule's prelude, (inline-size > 30rem): a feature is a property, a length a number */
        const stmt = s.slice(start, i);
        const inPrelude = stmt.trimStart().startsWith("@") && /\([^)]*$/.test(stmt);
        push(t, inPrelude ? "property" : t === "&" ? "keyword" : "tag"); i += t.length; continue;
      }
      if ((t = at(/-?\d*\.?\d+(?:%|[a-z]+)?/iy, s, i))) { push(t, "number"); i += t.length; continue; }
      push(s[i], "punctuation"); i++; continue;
    }
    /* a declaration: property: value */
    if (!afterColon && (t = at(/(?:--|\$)?[\w-]+(?=\s*:)/y, s, i))) { push(t, "property"); i += t.length; continue; }
    if (s[i] === ":") { afterColon = true; push(":", "punctuation"); i++; continue; }
    if ((t = at(/#[\da-f]{3,8}\b/iy, s, i))) { push(t, "number"); i += t.length; continue; }
    if ((t = at(/-?\d*\.?\d+(?:%|[a-z]+)?/iy, s, i)) && !/[\w-]/.test(s[i - 1] ?? "")) { push(t, "number"); i += t.length; continue; }
    if ((t = at(/(?:--|\$)[\w-]+/y, s, i))) { push(t, "property"); i += t.length; continue; }
    if ((t = at(/[\w-]+(?=\()/y, s, i))) { push(t, "keyword"); i += t.length; continue; }
    if ((t = at(/[\w-]+/y, s, i))) { push(t); i += t.length; continue; }
    push(s[i], "punctuation"); i++;
  }
  return out;
}

/* --- markup: html, xml, svg ------------------------------------------------- */
function markup(s: string): CodePiece[] {
  const out: CodePiece[] = [];
  const push = (text: string, kind?: CodeKind) => out.push({ text, kind });
  let i = 0;
  while (i < s.length) {
    let t: string | null;
    if ((t = at(/<!--[\s\S]*?(?:-->|$)/y, s, i))) { push(t, "comment"); i += t.length; continue; }
    if ((t = at(/<!doctype[^>]*>?/iy, s, i))) { push(t, "keyword"); i += t.length; continue; }
    if ((t = at(/<\/?[A-Za-z][\w:-]*/y, s, i))) {
      const slash = t[1] === "/" ? 2 : 1;
      push(t.slice(0, slash), "punctuation"); push(t.slice(slash), "tag"); i += t.length;
      /* attributes, until the tag closes */
      while (i < s.length) {
        if ((t = at(SPACE, s, i))) { push(t); i += t.length; continue; }
        if ((t = at(/\/?>/y, s, i))) { push(t, "punctuation"); i += t.length; break; }
        if ((t = at(STRING, s, i))) { push(t, "string"); i += t.length; continue; }
        if (s[i] === "=") {
          push("=", "punctuation"); i++;
          if ((t = at(/[^\s"'=<>`]+/y, s, i))) { push(t, "string"); i += t.length; }
          continue;
        }
        if ((t = at(/[^\s"'>/=]+/y, s, i))) { push(t, "property"); i += t.length; continue; }
        push(s[i], "punctuation"); i++;
      }
      continue;
    }
    t = at(/[^<]+/y, s, i) ?? s[i];
    push(t); i += t.length;
  }
  return out;
}
