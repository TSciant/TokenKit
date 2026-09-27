import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";

const meta = {
  title: "04 Primitives/08 Alert",
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          "Status is carried by the boundary and the label, never by colour alone — 1.4.1 forbids that in any pack, so a grayscale pack having no hue to spend costs nothing. A brand pack fills the same status slots with hue and this component does not change. Use for: Inline status after an action, form errors, or system notices on the page. Don't use for: Marketing banners, permanent page intros, or modal confirmations (use Modal).",
      },
    },
  },
  argTypes: {
    status: { control: "inline-radio", options: ["info", "success", "warning", "danger"] },
    live: { control: "boolean" },
  },
  args: { title: "Info", children: "Something worth reading." },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllStatuses: Story = {
  name: "All statuses",
  render: () => (
    <div data-shell="stack" data-gap="3">
      <Alert title="Info">Neutral message.</Alert>
      <Alert status="success" title="Success">Completed.</Alert>
      <Alert status="warning" title="Warning">Worth checking.</Alert>
      <Alert status="danger" title="Danger">This one carries role="alert".</Alert>
    </div>
  ),
};
