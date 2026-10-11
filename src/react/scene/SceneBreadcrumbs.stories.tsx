import type { Meta, StoryObj } from "@storybook/react-vite";
import { SceneBreadcrumbs } from "./SceneBreadcrumbs";

/* The trail a scene draws: the kit's Breadcrumbs, given the pages above by name. */
const meta: Meta<typeof SceneBreadcrumbs> = {
  title: "04 Primitives/62 Scene breadcrumbs",
  component: SceneBreadcrumbs,
  parameters: {
    docs: {
      description: {
        component:
          "The trail a scene's `breadcrumbs` part draws: the kit's Breadcrumbs, with the pages above this one given by name. A scene has no links, so each crumb gets its own address on the page; the trail is drawn as it would be with real ones, folding to the parent in a narrow box.",
      },
    },
  },
  args: {
    crumbs: ["Home", "Services", "Community programmes"],
    current: "Care coordination",
    label: "Breadcrumb",
    collapse: true,
  },
  argTypes: {
    crumbs: { control: "object" },
    current: { control: "text" },
    label: { control: "text" },
    collapse: { control: "boolean" },
  },
};
export default meta;

export const Playground: StoryObj<typeof SceneBreadcrumbs> = {};
