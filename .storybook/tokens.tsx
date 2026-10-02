import type { Decorator } from "@storybook/react-vite";
import { useEffect } from "react";
import { addons } from "storybook/preview-api";

/**
 * Tokens in use — what the Tokens tab shows.
 *
 * After a story renders, walk the page's style rules, keep the ones whose selector
 * matches something inside the story, and collect every `var(--tk-…)` they read.
 * Each name is then resolved on the component's own root, so the value shown is
 * the one this component gets under the pack, density and root size in force.
 *
 * It reads the CSS the component actually ships rather than a list kept beside it,
 * so it cannot go stale. It is a viewing instrument like the onion skin: nothing
 * in src/ imports it, and it does nothing until the Tokens tab asks.
 */

type Token = { name: string; value: string; rules: number };

/* States a story is not in while it is being read: a rule for :hover still names the
   tokens the component uses, so the state is dropped from the selector and the rest
   is matched. Pseudo-elements cannot be matched from the light DOM at all; ask about
   the element they belong to. */
const STATES = /::?(?:before|after|marker|placeholder|selection|first-line|first-letter|-webkit-[\w-]+)|:(?:focus-visible|focus-within|focus|hover|active|visited|target)(?![\w-])/g;

function visit(rules: CSSRuleList, parent: string | null, on: (sel: string, r: CSSStyleRule) => void) {
  for (const r of Array.from(rules)) {
    if (r instanceof CSSStyleRule) {
      /* A nested rule's selector is relative to its parent (`&` or an implied descendant). */
      const own = r.selectorText.split(/,(?![^()]*\))/).map((x) => x.trim());
      const full = own.map((x) => (parent ? (x.includes("&") ? x.replace(/&/g, `:is(${parent})`) : `:is(${parent}) ${x}`) : x));
      on(full.join(", "), r);
      if (r.cssRules?.length) visit(r.cssRules, full.join(", "), on);
    } else if (r instanceof CSSMediaRule) {
      /* Only the conditions in force: a reduced-motion rule is not in use for most readers. */
      if (window.matchMedia(r.conditionText).matches) visit(r.cssRules, parent, on);
    } else if (r instanceof CSSSupportsRule) {
      if (CSS.supports(r.conditionText)) visit(r.cssRules, parent, on);
    } else if ("cssRules" in r) visit((r as CSSGroupingRule).cssRules, parent, on);
  }
}

/* What a rule reads: the var(--tk-…) in its own declarations. A token being defined
   (--tk-a: var(--tk-b)) is the token system talking to itself, not a use. */
function reads(r: CSSStyleRule, note: (text: string) => void) {
  /* style.cssText, not the longhands: a shorthand written with var() has no value to
     read back from its longhands. Nested rules are not in it. Definitions of the kit's
     own tokens are taken out; a component's private --_x: var(--tk-y) is a use. */
  note(r.style.cssText.replace(/(^|;)\s*--tk-[\w-]+\s*:[^;]*/g, "$1"));
}

export function scan(host: HTMLElement): Token[] {
  const seen = new Map<string, number>();
  const note = (text: string) => {
    for (const m of text.matchAll(/var\(\s*(--tk-[\w-]+)/g)) seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    visit(rules, null, (selector, r) => {
      /* Each alternative on its own, so one the browser rejects does not drop the rest. */
      for (const alt of selector.split(/,(?![^()]*\))/)) {
        const sel = alt.replace(STATES, "").trim();
        if (!sel) continue;
        let hit = false;
        try { hit = host.matches(sel) || !!host.querySelector(sel); } catch { /* selector the browser rejects */ }
        if (hit) { reads(r, note); return; }
      }
    });
  }
  host.querySelectorAll<HTMLElement>("[style]").forEach((e) => note(e.getAttribute("style") ?? ""));
  const root = host.querySelector<HTMLElement>("[data-tk]") ?? host;
  const cs = getComputedStyle(root);
  return [...seen].map(([name, rules]) => ({ name, rules, value: cs.getPropertyValue(name).trim() })).sort((a, b) => a.name.localeCompare(b.name));
}

/* Nothing is scanned until the Tokens tab has asked once; after that each story
   answers when it renders. */
let wanted = false;

export const withTokens: Decorator = (Story, context) => {
  const { pack, density, root } = context.globals;
  const args = JSON.stringify(context.args, (_, v) => (typeof v === "function" || (v && typeof v === "object" && "$$typeof" in v) ? undefined : v));
  useEffect(() => {
    const channel = addons.getChannel();
    let idle = 0;
    const send = () => {
      const host = document.querySelector<HTMLElement>(".sb-host");
      if (!host) return;
      channel.emit("tokenkit/tokens", { storyId: context.id, pack, density, root, tokens: scan(host) });
    };
    /* A frame after the story's own effects have painted, and off the critical path. */
    const later = () => { clearTimeout(idle); idle = window.setTimeout(send, 150); };
    const ask = () => { wanted = true; later(); };
    if (wanted) later();
    channel.on("tokenkit/tokens-request", ask);
    return () => { clearTimeout(idle); channel.off("tokenkit/tokens-request", ask); };
  }, [context.id, pack, density, root, args]);
  return <Story />;
};
