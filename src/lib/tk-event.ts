/**
 * tk:event: the kit's one analytics seam (docs/11-tokens-and-contracts.md, phase 8).
 *
 * A component never calls an analytics vendor. When something worth counting
 * happens (a dialog opened, how it was dismissed, which tab was chosen) it
 * dispatches one DOM event, `tk:event`, that bubbles out of shadow roots:
 *
 *   { component: "Modal", event: "dismiss", props: { how: "escape" } }
 *
 * What each component may send is declared in its contract (`events`), and
 * what it must never send in `privacy`: never typed text, never an option's
 * label or value, never a name. Props are counts, positions, booleans and the
 * words of a declared list. tools/event-gate.mjs holds every story to that.
 *
 * Nothing listens by default, so the kit sends nothing anywhere. A page that
 * wants the counts adds its own listener, behind its own consent.
 */
export type TkEventProps = Record<string, string | number | boolean>;
export type TkEventDetail = { component: string; event: string; props: TkEventProps };

export function tkEvent(target: EventTarget | null | undefined, component: string, event: string, props: TkEventProps = {}): void {
  if (!target) return;
  target.dispatchEvent(new CustomEvent<TkEventDetail>("tk:event", { bubbles: true, composed: true, detail: { component, event, props } }));
}
