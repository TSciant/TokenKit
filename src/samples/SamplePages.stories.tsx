import type { Meta, StoryObj } from "@storybook/react-vite";
import { ResponsiveFrames, SingleFrame } from "./Frame";
import {
  AboutPage,
  ArticlePage,
  CaseStudiesPage,
  ClientSegmentSample,
  ContactPage,
  EventsPage,
  HomePage,
  InsightsPage,
  ServiceDetailPage,
  ServicesPage,
  TeamPage,
} from "./pages";
import { Prototype } from "./Prototype";

/* All eleven page compositions share one signature — SamplePageProps — so
   the panel documents it once, here, and every page story below drives it.
   `component` is HomePage because a meta takes one and they are the same
   shape; the props table it generates is the shape, not that one page. */
const meta = {
  title: "08 Prototype",
  component: HomePage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "09 — Full-page compositions and the Clickable prototype. Start at 00 Clickable prototype to feel nav, modals, and the story spine. Individual pages are for isolated review. Every page takes the same props: retype the title, or swap the chrome.",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description:
        "Page title. Drives the inner-page hero and the breadcrumb tail; the homepage has no hero title and ignores it.",
    },
    header: {
      control: false,
      description:
        "Slot — swap the site chrome. The clickable prototype passes its own routing header here.",
    },
    onNavigate: {
      control: false,
      description:
        "Called with a route id when an in-page CTA jumps pages. Wired by the prototype and by the Next.js app; inert in an isolated page.",
    },
    children: { control: false, description: "Slot — composed elements, not text." },
  },
  args: { title: undefined },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  name: "Home",
  render: (args) => (
    <SingleFrame>
      <HomePage {...args} />
    </SingleFrame>
  ),
};

export const Services: Story = {
  name: "Services index",
  render: (args) => (
    <SingleFrame>
      <ServicesPage {...args} />
    </SingleFrame>
  ),
};

export const About: Story = {
  name: "About",
  render: (args) => (
    <SingleFrame>
      <AboutPage {...args} />
    </SingleFrame>
  ),
};

export const CaseStudies: Story = {
  name: "Case studies",
  render: (args) => (
    <SingleFrame>
      <CaseStudiesPage {...args} />
    </SingleFrame>
  ),
};

export const Contact: Story = {
  name: "Contact",
  render: (args) => (
    <SingleFrame>
      <ContactPage {...args} />
    </SingleFrame>
  ),
};

export const Insights: Story = {
  name: "Insights hub",
  render: (args) => (
    <SingleFrame>
      <InsightsPage {...args} />
    </SingleFrame>
  ),
};

export const Article: Story = {
  name: "Article",
  render: (args) => (
    <SingleFrame width={960}>
      <ArticlePage {...args} />
    </SingleFrame>
  ),
};

export const ClientSegment: Story = {
  name: "Client segment - one audience",
  render: (args) => (
    <SingleFrame>
      <ClientSegmentSample {...args} />
    </SingleFrame>
  ),
};

export const Events: Story = {
  name: "Events",
  render: (args) => (
    <SingleFrame>
      <EventsPage {...args} />
    </SingleFrame>
  ),
};

export const Team: Story = {
  name: "Team",
  render: (args) => (
    <SingleFrame>
      <TeamPage {...args} />
    </SingleFrame>
  ),
};

export const ServiceDetail: Story = {
  name: "Service - detail",
  render: (args) => (
    <SingleFrame>
      <ServiceDetailPage {...args} />
    </SingleFrame>
  ),
};

export const HomeResponsive: Story = {
  name: "Home - responsive",
  render: (args) => (
    <ResponsiveFrames widths={[360, 768, 1280]}>
      <HomePage {...args} />
    </ResponsiveFrames>
  ),
};

export const ServicesResponsive: Story = {
  name: "Services - responsive",
  render: () => (
    <ResponsiveFrames widths={[360, 768, 1280]}>
      <ServicesPage />
    </ResponsiveFrames>
  ),
};

export const ClickablePrototype: StoryObj<typeof Prototype> = {
  argTypes: {
    initialRoute: {
      control: "select",
      options: [
        "home", "about", "team", "services", "service-detail",
        "case-studies", "insights", "events", "contact",
      ],
      description: "Which page it opens on.",
    },
    showRail: {
      control: "boolean",
      description: "The sticky route rail above the page.",
    },
  },
  args: { initialRoute: "home", showRail: true },
  name: "00 Clickable prototype",
  parameters: {
    docs: {
      description: {
        story:
          "Full click-through: header navigates between pages. One story spine runs through every route. Modals on Services, Team, Service detail, and Contact.",
      },
    },
  },
  render: (args) => (
    <SingleFrame width={1280}>
      <Prototype {...args} />
    </SingleFrame>
  ),
};
