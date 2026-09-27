"use client";

import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import type { SamplePageProps } from "../../src/samples/pages";
import { hrefFor } from "./routes";

/**
 * The one adapter between the kit's page compositions and the App Router.
 *
 * The pages take `onNavigate(route)` — an id, not a URL — because in Storybook
 * the prototype routes itself. Here that same id becomes a real navigation.
 * Nothing else about the pages changes, which is the point: the compositions
 * are not forked for this app, they are mounted in it.
 *
 * This is a client component because router.push is, and because every page
 * composition is already client-tainted by the site header (mega menu state, a
 * document-level mousedown listener, Motion). The server still renders all of
 * it to HTML first — "use client" moves where the code *also* runs, not
 * whether it is server-rendered — so the first paint is complete markup.
 */
export function PageRoute({
  page: Page,
  title,
}: {
  page: ComponentType<SamplePageProps>;
  title?: string;
}) {
  const router = useRouter();
  return <Page title={title} onNavigate={(route) => router.push(hrefFor(route))} />;
}
