"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import type { ReactNode } from "react";
/* The brand's words. `useContent()` returns an empty object when no content
   pack is in force — which is the wireframe packs and the delivered
   prototype — and every spread below then resolves to the pattern's own ipsum
   default. That is why there is not a single conditional in this file: the
   fallback is the absence of a value, not a branch. */
import { useBrandContent, useContent } from "./content";
import { MotionFx } from "../react/motion/MotionFx";
import { ModalTrigger } from "../react/primitives/Modal";
import { Faq } from "../react/primitives/Faq";
/* MapLazy, not Map: one page of eleven uses maplibre and all eleven are
   exported from this module, so a static import ships ~800 KB of it to every
   route. See src/react/primitives/MapLazy.tsx. */
import { Map } from "../react/primitives/MapLazy";
import { Button } from "../react/primitives/Button";
import { Icon } from "../react/primitives/Icon";
import { Plate } from "../react/primitives/Plate";
import {
  SiteFooter,
  Masthead,
  PageHero,
} from "../react/patterns/chrome";
import {
  SegmentList,
  FeatureGrid,
  EventPromo,
  HeroCarousel,
  ArticleFeed,
  ProofStrip,
} from "../react/patterns/marketing";
import {
  EventList,
  FilterBar,
  MediaCards,
  CtaBlocks,
  TileGrid,
  HubCards,
  PeopleDirectory,
} from "../react/patterns/catalog";
import {
  /* The pattern is the article's chrome; the sample page below wraps it in
     the site shell and is the thing the prototype routes to. Same idea, two
     layers, so the import is aliased rather than one of them renamed. */
  ArticlePage as ArticleChromePattern,
  SegmentPage as SegmentPagePattern,
  LeadForm,
} from "../react/patterns/templates";
/* Placeholder prose with a subject — the kit's own argument — so a reviewer
   who stops to read the wireframe learns why it is built this way. Every call
   is seeded, so the same slot returns the same words on every run and two
   screenshots stay comparable. See src/lib/token-ipsum.ts. */
import {
  ipsumBody,
  ipsumDeck,
  ipsumEyebrow,
  ipsumLabel,
  ipsumList,
  ipsumLabels,
  ipsumTitle,
  ipsumTitles,
} from "../lib/token-ipsum";

/**
 * Sample pages - full-page dogfood compositions of the pattern library.
 */

/* Two-sentence answers drawn from one distinct pool, so no sentence repeats
   inside an accordion. */
function ipsumAnswers(count: number, seed: string): string[] {
  const pool = ipsumList(count * 2, seed);
  return Array.from(
    { length: count },
    (_, i) => `${pool[i * 2]} ${pool[i * 2 + 1]}`,
  );
}

export type SamplePageProps = {
  title?: string;
  children?: ReactNode;
  /** Swap chrome for the clickable prototype. */
  header?: ReactNode;
  /** In-page CTAs can jump routes when the prototype is mounted. */
  onNavigate?: (route: string) => void;
};

function PageShell({
  header,
  children,
}: {
  header?: ReactNode;
  children: ReactNode;
}) {
  /* The masthead was the last thing on these pages still saying "Token Kit"
     under a brand that is plainly not Token Kit — and the kit's own six
     sections under a brand that does not have them. A wordmark and a nav are
     the first two things a reader uses to decide whose site they are on, so
     leaving them on the house brand undercut every other thing that had
     changed.
 
     Still fully optional: a brand with no `nav` gets the pattern's own
     defaults, which is the wireframe. */
  const brand = useBrandContent();
  return (
    <div
      data-tk="sample-page"
      style={{
        minBlockSize: "100%",
        background: "var(--tk-surface-default)",
        color: "var(--tk-text-primary)",
      }}
    >
      {header ?? (
        <Masthead
          withMegaMenu
          brand={brand?.label}
          navItems={brand?.nav?.map((n) => n.label)}
          megaTrigger={brand?.nav?.[0]?.label}
        />
      )}
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

/**
 * Homepage — hero through conference, then footer.
 *
 * The composition is fixed: six patterns, this order, every brand. What moves
 * is the bag of props each one is handed, and a brand that has written none
 * gets `{}` and therefore the ipsum. This is the Zen Garden trade with the
 * axis rotated — the markup does not change, the tokens and the words do.
 */
export function HomePage({ header }: SamplePageProps = {}) {
  const c = useContent().home ?? {};
  return (
    <PageShell header={header}>
      <HeroCarousel {...c.hero} />
      <MotionFx fx={true}>
        <div data-texture-overlay="noise">
          <ProofStrip {...c.proof} />
        </div>
      </MotionFx>
      <MotionFx fx={true}>
        <SegmentList {...c.segments} />
      </MotionFx>
      <MotionFx fx={true}>
        <div data-texture-overlay="dots">
          <FeatureGrid {...c.features} />
        </div>
      </MotionFx>
      <MotionFx fx={true}>
        <ArticleFeed {...c.articles} />
      </MotionFx>
      <MotionFx fx={true}>
        <EventPromo {...c.event} />
      </MotionFx>
    </PageShell>
  );
}

/* A seed carries a numeric or word suffix wherever the unsuffixed draw came
   back with a string already spoken for elsewhere on the same page. The words
   are still deterministic; the suffix only moves which ones are drawn. */
export const SERVICES_DECK = ipsumDeck("services-hero-deck");
export const SERVICES_INTRO = ipsumBody(1, "services-intro-alt");
export const SERVICES_MODAL_BODY = ipsumBody(1, "services-modal-body");
export const SERVICES_FEATURE_EYEBROW = ipsumEyebrow("services-feature-eyebrow");
export const SERVICES_FEATURE_TITLE = ipsumTitle("services-feature-title");
export const SERVICES_FEATURE_BODY = ipsumBody(1, "services-feature-body");
export const SERVICES_TILE_HEADING = ipsumLabel("services-tile-heading");
export const SERVICES_FAQ_Q = ipsumTitles(3, "services-faq-questions");
export const SERVICES_FAQ_A = ipsumAnswers(3, "services-faq-answers-33");

/** Services catalogue - composed, not a bare tile dump. */
export function ServicesPage({ title, header, onNavigate }: SamplePageProps) {
  /* `??` and not `||`, because a brand is allowed to write an empty string and
     mean it. Every line below is the same shape: the brand's word, or the
     ipsum the kit shipped with. */
  const c = useContent().services ?? {};
  const pageTitle = title ?? c.title ?? "Services";
  return (
    <PageShell header={header}>
      <PageHero
        title={pageTitle}
        crumbs={["Home", pageTitle]}
        deck={c.deck ?? SERVICES_DECK}
      />
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="proof"
          data-shell="center"
          data-width="wide"
          data-gap="4"
        >
          <p
            data-tk="card-body"
            style={{
              margin: 0,
              maxInlineSize: "var(--tk-measure)",
              fontSize: "var(--tk-size-md)",
            }}
          >
            {c.intro ?? SERVICES_INTRO}
          </p>
          <div style={{ alignSelf: "start" }}>
          <ModalTrigger
            label="Talk to us"
            title="Tell us what you are working on"
            triggerSize="lg"
            footer={function (close) {
              return (
                <>
                  <Button variant="quiet" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    onClick={close}
                    trailing={<Icon name="arrowRight" size="sm" />}
                  >
                    Submit
                  </Button>
                </>
              );
            }}
          >
            <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
              {c.modalBody ?? SERVICES_MODAL_BODY}
            </p>
          </ModalTrigger>
          </div>
        </section>
      </MotionFx>
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="feature"
          data-shell="center"
          data-width="wide"
          data-gap="4"
        >
          <div
            data-tk="card"
            data-shell="stack"
            data-gap="3"
            style={{ padding: "var(--tk-space-5)", maxInlineSize: "var(--tk-measure)" }}
          >
            <span data-tk="eyebrow">{c.feature?.eyebrow ?? SERVICES_FEATURE_EYEBROW}</span>
            <h2 style={{ margin: 0 }}>{c.feature?.title ?? SERVICES_FEATURE_TITLE}</h2>
            <p data-tk="card-body" style={{ margin: 0 }}>
              {c.feature?.body ?? SERVICES_FEATURE_BODY}
            </p>
            <div>
              <button
                type="button"
                data-tk="button"
                data-variant="outline"
                onClick={() => onNavigate?.("service-detail")}
              >
                Open the service page
              </button>
            </div>
          </div>
        </section>
      </MotionFx>
      <MotionFx fx={true}>
        <div data-texture-overlay="dots">
          <HubCards />
        </div>
      </MotionFx>
      <MotionFx fx={true}>
        <TileGrid heading={c.tileHeading ?? SERVICES_TILE_HEADING} compact />
      </MotionFx>
      <MotionFx fx={true}>
        <CtaBlocks />
      </MotionFx>
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="proof"
          data-shell="center"
          data-width="wide"
          data-gap="5"
        >
          <Faq
            singleExpand
            items={
              c.faq?.length
                ? c.faq.map((f, i) => ({
                    question: f.q,
                    answer: f.a,
                    defaultOpen: i === 0,
                  }))
                : [
              {
                question: SERVICES_FAQ_Q[0],
                answer: SERVICES_FAQ_A[0],
                defaultOpen: true,
              },
              {
                question: SERVICES_FAQ_Q[1],
                answer: SERVICES_FAQ_A[1],
              },
              {
                question: SERVICES_FAQ_Q[2],
                answer: SERVICES_FAQ_A[2],
              },
            ]}
          />
        </section>
      </MotionFx>
    </PageShell>
  );
}

/** Insights hub with filters + media promos. */
export function InsightsPage({ title = "Insights", header }: SamplePageProps) {
  return (
    <PageShell header={header}>
      <PageHero
        title={title}
        crumbs={["Home", "Insights"]}
        deck="Content hub - filters, feed cards, and media modules."
      />
      <div
        data-shell="center"
        data-width="wide"
        data-gap="6"
        style={{ paddingBlock: "var(--tk-space-7)" }}
      >
        <FilterBar />
        <div
          data-texture-overlay="grid"
          style={{ paddingBlock: "var(--tk-space-4)" }}
        >
          <MediaCards />
        </div>
      </div>
    </PageShell>
  );
}

/** Long-form article template as a full page. */
export function ArticlePage({ header }: SamplePageProps = {}) {
  return (
    <PageShell header={header}>
      <ArticleChromePattern />
    </PageShell>
  );
}

/** Client segment landing - one audience. */
export function ClientSegmentSample({ header }: SamplePageProps = {}) {
  return (
    <PageShell header={header}>
      <SegmentPagePattern />
    </PageShell>
  );
}

/** Events listing page. */
export function EventsPage({ title = "Events", header }: SamplePageProps) {
  return (
    <PageShell header={header}>
      <PageHero
        title={title}
        crumbs={["Home", "Events"]}
        deck="Upcoming sessions and the event promo pattern."
      />
      <div
        data-shell="center"
        data-width="wide"
        style={{ paddingBlock: "var(--tk-space-7)" }}
      >
        <EventList />
      </div>
      <EventPromo />
    </PageShell>
  );
}

export const ABOUT_DECK = ipsumDeck("about-hero-deck");
export const ABOUT_PROMO_TITLE = ipsumTitle("about-promo-title-second");
export const ABOUT_PROMO_BODY = ipsumBody(1, "about-promo-body");
export const ABOUT_MODAL_BODY = ipsumBody(1, "about-modal-body");
export const ABOUT_FAQ_Q = ipsumTitles(3, "about-faq-questions-5");
export const ABOUT_FAQ_A = ipsumAnswers(3, "about-faq-answers-31");

/** About - proof strip, audiences, and a how-we-work accordion. */
export function AboutPage({ title, header }: SamplePageProps) {
  const c = useContent().about ?? {};
  return (
    <PageShell header={header}>
      <PageHero
        title={title ?? c.title ?? "About Token Kit"}
        crumbs={["Home", "About"]}
        deck={c.deck ?? ABOUT_DECK}
      />
      <MotionFx fx={true}>
        <div data-texture-overlay="noise">
          <ProofStrip {...c.proof} />
        </div>
      </MotionFx>
      <MotionFx fx={true}>
        <SegmentList {...c.segments} />
      </MotionFx>
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="promo"
          data-shell="split"
          data-gap="7"
          data-align="center"
          style={{ paddingInline: "var(--tk-space-6)" }}
        >
          <Plate fx={true} stock ratio="16 / 10" seed={4} placement="quiet" />
          <div
            data-shell="stack"
            data-gap="4"
            style={{ maxInlineSize: "var(--tk-measure-narrow)" }}
          >
            <h2 style={{ margin: 0 }}>{c.promo?.title ?? ABOUT_PROMO_TITLE}</h2>
            <p data-tk="card-body" style={{ margin: 0 }}>
              {c.promo?.body ?? ABOUT_PROMO_BODY}
            </p>
            <ModalTrigger
              label="Meet the team"
              title="Staff directory"
              triggerVariant="outline"
              size="lg"
              footer={function (close) {
                return <Button onClick={close}>Close</Button>;
              }}
            >
              <p style={{ margin: 0 }}>{c.promo?.modalBody ?? ABOUT_MODAL_BODY}</p>
            </ModalTrigger>
          </div>
        </section>
      </MotionFx>
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="proof"
          data-shell="center"
          data-width="wide"
          data-gap="5"
        >
          <Faq
            tone="info"
            title="How we work"
            items={[
              {
                question: ABOUT_FAQ_Q[0],
                answer: ABOUT_FAQ_A[0],
                defaultOpen: true,
              },
              {
                question: ABOUT_FAQ_Q[1],
                answer: ABOUT_FAQ_A[1],
              },
              {
                question: ABOUT_FAQ_Q[2],
                answer: ABOUT_FAQ_A[2],
              },
            ]}
          />
        </section>
      </MotionFx>
    </PageShell>
  );
}
/* `title` is the card's React key, so these come from ipsumTitles rather than
   four separate draws — that function never repeats within one call. */
export const CASE_TITLES = ipsumTitles(4, "case-studies-titles-alt");
export const CASE_BODIES = ipsumList(4, "case-studies-bodies");
export const CASE_META = ipsumLabels(4, "case-studies-meta-5");
export const CASE_DECK = ipsumDeck("case-studies-hero-deck");
export const CASE_MODAL_BODY = ipsumBody(1, "case-studies-modal-body");

const CASE_STUDIES = [
  {
    title: CASE_TITLES[0],
    body: CASE_BODIES[0],
    meta: CASE_META[0],
    seed: 1,
  },
  {
    title: CASE_TITLES[1],
    body: CASE_BODIES[1],
    meta: CASE_META[1],
    seed: 2,
  },
  {
    title: CASE_TITLES[2],
    body: CASE_BODIES[2],
    meta: CASE_META[2],
    seed: 3,
  },
  {
    title: CASE_TITLES[3],
    body: CASE_BODIES[3],
    meta: CASE_META[3],
    seed: 5,
  },
];

/** Case studies index. */
export function CaseStudiesPage({ title = "Case studies", header }: SamplePageProps) {
  return (
    <PageShell header={header}>
      <PageHero
        title={title}
        crumbs={["Home", "Case Studies"]}
        deck={CASE_DECK}
      />
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="feed"
          data-shell="center"
          data-width="wide"
          data-gap="6"
        >
          {/* The cards are h3s, which would skip a level under the hero's h1.
              The feed does have a name — it just does not need to be drawn,
              because the hero deck already says it. So the level exists for
              the outline and is hidden from the page. */}
          <h2 data-tk="visually-hidden">Selected work</h2>
          <div data-shell="grid" data-cols="2" data-gap="5">
            {CASE_STUDIES.map(function (c, i) {
              return (
                <a
                  key={c.title}
                  href="#main"
                  data-tk="card"
                  data-interactive
                  style={{ textDecoration: "none" }}
                >
                  <Plate
                    fx={true}
                    stock
                    ratio="16 / 9"
                    seed={c.seed}
                    placement={false}
                    /* The first card sits above the fold at phone width, which
                       makes its photograph the Largest Contentful Paint. Left
                       to the default it was lazy-loaded and fetched at normal
                       priority — 3.4s, against a 1.2s first paint. The rest of
                       the grid stays lazy, which is the point. */
                    priority={i === 0}
                  />
                  <div
                    data-shell="stack"
                    data-gap="2"
                    style={{
                      paddingInline: "var(--tk-space-4)",
                      paddingBlockEnd: "var(--tk-space-4)",
                    }}
                  >
                    <span data-tk="eyebrow">{c.meta}</span>
                    <h3 data-tk="card-title" style={{ margin: 0 }}>
                      {c.title}
                    </h3>
                    <p data-tk="card-body" style={{ margin: 0 }}>
                      {c.body}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
          <ModalTrigger
            label="Discuss a similar project"
            title="Project inquiry"
            triggerSize="lg"
            footer={function (close) {
              return (
                <>
                  <Button variant="quiet" onClick={close}>
                    Cancel
                  </Button>
                  <Button onClick={close}>Send</Button>
                </>
              );
            }}
          >
            <p style={{ margin: 0 }}>{CASE_MODAL_BODY}</p>
          </ModalTrigger>
        </section>
      </MotionFx>
    </PageShell>
  );
}

export const CONTACT_DECK = ipsumDeck("contact-hero-deck");

/** Contact / talk-to-us. */
export function ContactPage({ title = "Contact", header }: SamplePageProps) {
  return (
    <PageShell header={header}>
      <PageHero
        title={title}
        crumbs={["Home", "Contact"]}
        deck={CONTACT_DECK}
      />
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="proof"
          data-shell="center"
          data-width="wide"
          data-gap="4"
          style={{ textAlign: "center" }}
        >
          <p
            data-tk="card-body"
            style={{
              marginInline: "auto",
              maxInlineSize: "var(--tk-measure)",
            }}
          >
            Prefer a guided handoff? Open the modal - or use the full form
            below.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ModalTrigger
              label="Request a call"
              title="Request a call"
              triggerSize="lg"
              size="md"
              footer={function (close) {
                return (
                  <>
                    <Button variant="quiet" onClick={close}>
                      Cancel
                    </Button>
                    <Button onClick={close}>Request call</Button>
                  </>
                );
              }}
            >
              <p style={{ margin: 0 }}>
                Name a topic and a window this week. We confirm by email.
              </p>
            </ModalTrigger>
          </div>
        </section>
      </MotionFx>
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="feature"
          data-shell="center"
          data-width="wide"
          data-gap="4"
        >
          <header data-shell="stack" data-gap="2" style={{ maxInlineSize: "var(--tk-measure)" }}>
            <h2 style={{ margin: 0 }}>Find us</h2>
            <p data-tk="card-body" style={{ margin: 0 }}>
              One office, one pin — map tiles load when MapLibre is healthy, and the placeholder holds the same box until then.
            </p>
          </header>
          <Map
            scheme="auto"
            marker
            fullscreen
            navigation
            scale
            label="Office location map"
            ratio="21 / 9"
            /* This map starts inside the first screen, so there is no quiet
               moment to hide 800 KB of maplibre in — it cost 350ms of blocking
               time between first paint and the page answering a tap. The
               placeholder holds the same box; the reader who wants the map is
               one press away. See MapLazy.tsx. */
            activate="interaction"
            activateLabel="Load the interactive map"
          />
        </section>
      </MotionFx>
      <LeadForm />
    </PageShell>
  );
}

export const TEAM_DECK = ipsumDeck("team-hero-deck");
export const TEAM_INTRO = ipsumBody(1, "team-intro");
export const TEAM_MODAL_BODY = ipsumBody(1, "team-modal-body");
export const TEAM_FAQ_Q = ipsumTitles(2, "team-faq-questions");
export const TEAM_FAQ_ANSWER = ipsumAnswers(1, "team-faq-answer-alt")[0];

/** Team — the people behind the spine. */
export function TeamPage({ title = "Team", header, onNavigate }: SamplePageProps) {
  return (
    <PageShell header={header}>
      <PageHero
        title={title}
        crumbs={["Home", "Team"]}
        deck={TEAM_DECK}
      />
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="proof"
          data-shell="center"
          data-width="wide"
          data-gap="4"
        >
          <p
            data-tk="card-body"
            style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}
          >
            {TEAM_INTRO}
          </p>
          <ModalTrigger
            label="Request an introduction"
            title="Request an introduction"
            triggerSize="lg"
            footer={function (close) {
              return (
                <>
                  <Button variant="quiet" onClick={close}>
                    Not now
                  </Button>
                  <Button
                    onClick={close}
                    trailing={<Icon name="arrowRight" size="sm" />}
                  >
                    Send request
                  </Button>
                </>
              );
            }}
          >
            <p style={{ margin: 0, maxInlineSize: "var(--tk-measure)" }}>
              {TEAM_MODAL_BODY}
            </p>
          </ModalTrigger>
        </section>
      </MotionFx>
      <MotionFx fx={true}>
        <div data-texture-overlay="dots">
          <PeopleDirectory />
        </div>
      </MotionFx>
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="promo"
          data-shell="center"
          data-width="wide"
          data-gap="3"
        >
          <Faq
            tone="info"
            title="Working with this team"
            items={[
              {
                question: TEAM_FAQ_Q[0],
                answer: TEAM_FAQ_ANSWER,
                defaultOpen: true,
              },
              {
                /* Wayfinding, not filler: this answer names two affordances on
                   the page, so it stays plain English. */
                question: TEAM_FAQ_Q[1],
                answer:
                  "Use Request an introduction, or jump to Contact and name the project in the subject line.",
              },
            ]}
          />
          <div>
            <button
              type="button"
              data-tk="button"
              data-variant="outline"
              onClick={() => onNavigate?.("contact")}
            >
              Go to Contact
            </button>
          </div>
        </section>
      </MotionFx>
    </PageShell>
  );
}

/* nav.ts draws this from the same seed rather than importing it, so the route
   title and the page title stay the same word without nav.ts having to pull in
   the whole page module. Change one seed and you must change the other. */
export const SERVICE_DETAIL_TITLE = ipsumLabel("service-detail-title");
export const SERVICE_DETAIL_DECK = ipsumDeck("service-detail-hero-deck");
export const SERVICE_DETAIL_INTRO = ipsumBody(2, "service-detail-intro");
export const SERVICE_DETAIL_MODAL_BODY = ipsumBody(
  2,
  "service-detail-modal-body-alt",
);
export const SERVICE_DETAIL_PROMO_TITLE = ipsumTitle(
  "service-detail-promo-title-alt",
);
export const SERVICE_DETAIL_PROMO_BODY = ipsumBody(
  1,
  "service-detail-promo-body-alt",
);
export const SERVICE_DETAIL_FAQ_Q = ipsumTitles(
  2,
  "service-detail-faq-questions-b",
);
export const SERVICE_DETAIL_FAQ_A = ipsumAnswers(
  2,
  "service-detail-faq-answers-b",
);

/** Service detail — one service off the Services index. */
export function ServiceDetailPage({
  title = SERVICE_DETAIL_TITLE,
  header,
  onNavigate,
}: SamplePageProps) {
  return (
    <PageShell header={header}>
      <PageHero
        title={title}
        crumbs={["Home", "Services", SERVICE_DETAIL_TITLE]}
        deck={SERVICE_DETAIL_DECK}
      />
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="proof"
          data-shell="center"
          data-width="wide"
          data-gap="5"
        >
          <p
            data-tk="card-body"
            style={{
              margin: 0,
              maxInlineSize: "var(--tk-measure)",
              fontSize: "var(--tk-size-md)",
            }}
          >
            {SERVICE_DETAIL_INTRO}
          </p>
          <div data-shell="inline" data-gap="3" style={{ flexWrap: "wrap" }}>
            <ModalTrigger
              label="Request support"
              title={`Support request — ${SERVICE_DETAIL_TITLE}`}
              triggerSize="lg"
              footer={function (close) {
                return (
                  <>
                    <Button variant="quiet" onClick={close}>
                      Cancel
                    </Button>
                    <Button onClick={close}>Submit brief</Button>
                  </>
                );
              }}
            >
              <p style={{ margin: 0 }}>{SERVICE_DETAIL_MODAL_BODY}</p>
            </ModalTrigger>
            <button
              type="button"
              data-tk="button"
              data-variant="outline"
              data-size="lg"
              onClick={() => onNavigate?.("case-studies")}
            >
              See related case studies
            </button>
            <button
              type="button"
              data-tk="button"
              data-variant="quiet"
              data-size="lg"
              onClick={() => onNavigate?.("team")}
            >
              Meet the team
            </button>
          </div>
        </section>
      </MotionFx>
      <MotionFx fx={true}>
        <CtaBlocks />
      </MotionFx>
      <MotionFx fx={true}>
        <section
          data-tk="section"
          data-section="feature"
          data-shell="split"
          data-gap="7"
          data-align="center"
          style={{ paddingInline: "var(--tk-space-6)" }}
        >
          <Plate fx={true} stock ratio="16 / 10" seed={6} placement="quiet" />
          <div
            data-shell="stack"
            data-gap="4"
            style={{ maxInlineSize: "var(--tk-measure-narrow)" }}
          >
            <h2 style={{ margin: 0 }}>{SERVICE_DETAIL_PROMO_TITLE}</h2>
            <p data-tk="card-body" style={{ margin: 0 }}>
              {SERVICE_DETAIL_PROMO_BODY}
            </p>
            <Faq
              title={false}
              eyebrow="In practice"
              singleExpand
              items={[
                {
                  question: SERVICE_DETAIL_FAQ_Q[0],
                  answer: SERVICE_DETAIL_FAQ_A[0],
                  defaultOpen: true,
                },
                {
                  question: SERVICE_DETAIL_FAQ_Q[1],
                  answer: SERVICE_DETAIL_FAQ_A[1],
                },
              ]}
            />
          </div>
        </section>
      </MotionFx>
    </PageShell>
  );
}
