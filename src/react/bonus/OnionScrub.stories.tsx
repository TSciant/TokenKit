import type { Meta, StoryObj } from "@storybook/react";
import { OnionScrub, type OnionValue } from "./OnionScrub";
import "../../css/bonus/onion.css";

const meta: Meta<typeof OnionScrub> = {
  title: "Bonus Packs/Onion",
  component: OnionScrub,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof OnionScrub>;

const exampleValues: OnionValue[] = [
  { label: "padding", meant: "16px", got: "12px" },
  { label: "fontSize", meant: "18px", got: "18px" },
  { label: "lineHeight", meant: 1.5, got: 1.6, unit: "" },
];

/**
 * Onion pack provides Meant|Got scrub UI for design-code alignment.
 * Shows intended vs actual values with verb controls.
 */
export const Basic: Story = {
  args: {
    values: exampleValues,
    onAlign: (label) => console.log("Align:", label),
    onAccept: (label) => console.log("Accept:", label),
    onPause: () => console.log("Pause toggled"),
    onReplace: (label) => console.log("Replace:", label),
  },
};

export const Aligned: Story = {
  args: {
    values: [
      { label: "padding", meant: "16px", got: "16px" },
      { label: "fontSize", meant: "18px", got: "18px" },
      { label: "lineHeight", meant: 1.5, got: 1.5, unit: "" },
    ],
  },
};

export const SingleMismatch: Story = {
  args: {
    values: [
      { label: "padding", meant: "16px", got: "16px" },
      { label: "color", meant: "#FF0000", got: "#FF1A1A" },
      { label: "fontSize", meant: "18px", got: "18px" },
    ],
  },
};

export const MultipleMismatches: Story = {
  args: {
    values: [
      { label: "padding", meant: "24px", got: "16px" },
      { label: "margin", meant: "32px", got: "24px" },
      { label: "borderRadius", meant: "8px", got: "4px" },
      { label: "fontSize", meant: "20px", got: "18px" },
    ],
  },
};

export const WithUnits: Story = {
  args: {
    values: [
      { label: "spacing", meant: 2, got: 1.5, unit: "rem" },
      { label: "opacity", meant: 1, got: 0.9, unit: "" },
      { label: "rotation", meant: 45, got: 40, unit: "deg" },
    ],
  },
};

export const DesignSystemAlignment: Story = {
  render: () => (
    <div style={{ maxWidth: "600px" }}>
      <h2 style={{ marginBottom: "1rem" }}>Button Component Alignment</h2>
      <OnionScrub
        values={[
          { label: "padding-x", meant: "var(--tk-space-md)", got: "16px" },
          { label: "padding-y", meant: "var(--tk-space-sm)", got: "8px" },
          { label: "font-size", meant: "var(--tk-size-base)", got: "16px" },
          { label: "border-radius", meant: "var(--tk-radius-md)", got: "8px" },
          {
            label: "background",
            meant: "var(--tk-action-fill)",
            got: "#7C3AED",
          },
        ]}
        onAlign={(label) =>
          alert(`Align ${label}: copy "meant" value to code`)
        }
        onAccept={(label) =>
          alert(`Accept ${label}: update "meant" to match "got"`)
        }
      />
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "var(--tk-surface-sunken)",
          borderRadius: "var(--tk-radius-md)",
        }}
      >
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
          Verb Actions:
        </h3>
        <ul
          style={{
            fontSize: "0.875rem",
            color: "var(--tk-text-secondary)",
            lineHeight: 1.6,
          }}
        >
          <li>
            <strong>Align:</strong> Copy "meant" value to code (design → code)
          </li>
          <li>
            <strong>Accept:</strong> Update "meant" to match "got" (code → design)
          </li>
          <li>
            <strong>Pause:</strong> Temporarily disable sync checking
          </li>
          <li>
            <strong>Replace:</strong> Force overwrite "got" with "meant"
          </li>
        </ul>
      </div>
    </div>
  ),
};
