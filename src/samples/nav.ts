import { ipsumLabel, ipsumStats, ipsumTitle } from "../lib/token-ipsum";

/** Clickable prototype routes — labels match GlobalHeader NAV where possible. */
export type ProtoRoute =
  | "home"
  | "about"
  | "team"
  | "services"
  | "service-detail"
  | "case-studies"
  | "insights"
  | "events"
  | "contact";

export const PROTO_NAV: { label: string; route: ProtoRoute }[] = [
  { label: "About", route: "about" },
  { label: "Team", route: "team" },
  { label: "Services", route: "services" },
  { label: "Case Studies", route: "case-studies" },
  { label: "Insights", route: "insights" },
  { label: "Events", route: "events" },
];

/* Same seed as SERVICE_DETAIL_TITLE in pages.tsx, drawn rather than imported
   so this module stays free of the page compositions. Change one, change both. */
export const ROUTE_TITLE: Record<ProtoRoute, string> = {
  home: "Home",
  about: "About",
  team: "Team",
  services: "Services",
  "service-detail": ipsumLabel("service-detail-title"),
  "case-studies": "Case studies",
  insights: "Insights",
  events: "Events",
  contact: "Contact",
};

const STORY_OUTCOME = ipsumStats(1, "story-outcome")[0];

/** Story spine running through the prototype. */
export const STORY = {
  engagement: ipsumTitle("story-engagement-z"),
  client: "a client-neutral wireframe estate",
  outcome: `${STORY_OUTCOME.label.toLowerCase()} at ${STORY_OUTCOME.value}`,
};
