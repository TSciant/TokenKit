/**
 * The five page compositions, and the route ids the pages already speak.
 *
 * src/samples/pages.tsx takes an `onNavigate(route: string)` because in
 * Storybook the prototype is a single story doing its own routing. Here the
 * routes are real URLs, so the same ids map to paths and onNavigate becomes
 * router.push. Same components, same calls, no fork of the page source.
 *
 * Five routes, chosen to cover every hard case rather than the five
 * prettiest: a stateful hero carousel, a modal, an accordion, a filtering
 * form, and a map — so the Lighthouse numbers are measured against the worst
 * of it and not the easiest of it. An engagement will want its own five; add
 * or replace them here and in the directories beside this file.
 */

export const ROUTES = {
  home: "/",
  services: "/services",
  "case-studies": "/case-studies",
  team: "/team",
  contact: "/contact",
} as const;

export type RouteId = keyof typeof ROUTES;

export function hrefFor(route: string): string {
  return (ROUTES as Record<string, string>)[route] ?? "/";
}
