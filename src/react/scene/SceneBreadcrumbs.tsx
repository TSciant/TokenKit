import { Breadcrumbs } from "../primitives/Breadcrumbs";

export interface SceneBreadcrumbsProps {
  /** The pages above this one, from the top of the site down, by name. */
  crumbs?: string[];
  /** This page's name, as the last crumb. Leave it out when the heading under the trail says it. */
  current?: string;
  /** The landmark's name. */
  label?: string;
  /** On a narrow box, show only the way up. */
  collapse?: boolean;
}

/**
 * A breadcrumb trail, as a scene draws it: the kit's Breadcrumbs, with the
 * pages above this one given by name. A scene has no links, so each crumb is
 * given its own address on this page; the trail is drawn exactly as it would
 * be with real ones.
 */
export function SceneBreadcrumbs({ crumbs = ["Home"], current, label, collapse }: SceneBreadcrumbsProps) {
  const items = crumbs.map((c) => ({ label: c, href: `#${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` }));
  return <Breadcrumbs items={items} current={current} label={label} collapse={collapse} />;
}
