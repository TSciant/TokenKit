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

function walk(rules: CSSRuleList, visit: (r: CSSStyleRule) => void) {
  for (const r of Array.from(rules)) {
    if (r instanceof CSSStyleRule) visit(r);
    else if ("cssRules" in r) walk((r as CSSGroupingRule).cssRules, visit);
  }
}

export function scan(host: HTMLElement): Token[] {
  const seen = new Map<string, number>();
  const note = (text: string) => {
    for (const m of text.matchAll(/var\(\s*(--tk-[\w-]+)/g)) seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    walk(rules, (r) => {
      /* Pseudo-elements cannot be matched from the light DOM; ask about their originating element. */
      const sel = r.selectorText.replace(/::?(before|after|marker|placeholder|selection|-webkit-[\w-]+)/g, "");
      let hit = false;
      try { hit = host.matches(sel) || !!host.querySelector(sel); } catch { /* selector the browser rejects */ }
      if (hit) note(r.cssText);
    });
  }
  host.querySelectorAll<HTMLElement>("[style]").forEach((e) => note(e.getAttribute("style") ?? ""));
  const root = host.querySelector<HTMLElement>("[data-tk]") ?? host;
  const cs = getComputedStyle(root);
  return [...seen].map(([name, rules]) => ({ name, rules, value: cs.getPropertyValue(name).trim() })).sort((a, b) => a.name.localeCompare(b.name));
}

export const withTokens: Decorator = (Story, context) => {
  const { pack, density, root } = context.globals;
  useEffect(() => {
    const channel = addons.getChannel();
    const send = () => {
      const host = document.querySelector<HTMLElement>(".sb-host");
      if (!host) return;
      channel.emit("tokenkit/tokens", { storyId: context.id, pack, density, root, tokens: scan(host) });
    };
    /* Wait a frame so a story's own effects have painted; answer the tab when it opens. */
    const t = setTimeout(send, 150);
    channel.on("tokenkit/tokens-request", send);
    return () => { clearTimeout(t); channel.off("tokenkit/tokens-request", send); };
  }, [context.id, pack, density, root, context.args]);
  return <Story />;
};
