"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import { useCallback, useState } from "react";
import {
  AboutPage,
  CaseStudiesPage,
  ContactPage,
  EventsPage,
  HomePage,
  InsightsPage,
  ServiceDetailPage,
  ServicesPage,
  TeamPage,
} from "./pages";
import { PrototypeHeader } from "./PrototypeHeader";
import { PhaseBanner } from "../react/primitives/PhaseBanner";
import { ROUTE_TITLE, STORY, type ProtoRoute } from "./nav";

export type PrototypeProps = {
  /** Which page it opens on. Everything else is reachable from the nav. */
  initialRoute?: ProtoRoute;
  /** Show the sticky route rail above the page. */
  showRail?: boolean;
};

/**
 * Clickable multi-page dogfood — one story spine, live header, modals in situ.
 *
 * `initialRoute` exists so a reviewer can be sent to a page rather than to the
 * prototype's front door — a link to the thing being discussed, not four
 * clicks away from it.
 */
export function Prototype({
  initialRoute = "home",
  showRail = true,
}: PrototypeProps = {}) {
  const [route, setRoute] = useState<ProtoRoute>(initialRoute);

  const onNavigate = useCallback((next: string) => {
    setRoute(next as ProtoRoute);
    try {
      window.scrollTo(0, 0);
    } catch {
      /* ignore */
    }
  }, []);

  const header = <PrototypeHeader current={route} onNavigate={onNavigate} />;

  const pageProps = { header, onNavigate };

  let page = <HomePage {...pageProps} />;
  switch (route) {
    case "about":
      page = <AboutPage {...pageProps} />;
      break;
    case "team":
      page = <TeamPage {...pageProps} />;
      break;
    case "services":
      page = <ServicesPage {...pageProps} />;
      break;
    case "service-detail":
      page = <ServiceDetailPage {...pageProps} />;
      break;
    case "case-studies":
      page = <CaseStudiesPage {...pageProps} />;
      break;
    case "insights":
      page = <InsightsPage {...pageProps} />;
      break;
    case "events":
      page = <EventsPage {...pageProps} />;
      break;
    case "contact":
      page = <ContactPage {...pageProps} />;
      break;
    default:
      page = <HomePage {...pageProps} />;
  }

  return (
    <div data-tk="prototype">
      {showRail ? (
        <PhaseBanner label="Prototype" title={ROUTE_TITLE[route]}>
          Spine: {STORY.engagement} for {STORY.client} — {STORY.outcome}.
        </PhaseBanner>
      ) : null}
      {page}
    </div>
  );
}
