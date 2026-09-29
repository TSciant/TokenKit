import type { Meta, StoryObj } from "@storybook/react";
import "../../css/bonus/marquee.css";

const meta: Meta = {
  title: "Bonus Packs/Marquee",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

/**
 * Marquee pack provides shimmer effects, gradient text, and pattern field
 * enhancements. All effects are CSS-only and opt-in via data attributes.
 */
export const GradientText: StoryObj = {
  render: () => (
    <div style={{ padding: "2rem" }}>
      <h1 data-marquee="gradient-text" style={{ fontSize: "3rem", margin: 0 }}>
        Gradient Text
      </h1>
      <p style={{ marginTop: "1rem", color: "var(--tk-text-secondary)" }}>
        Background gradient clipped to text
      </p>
    </div>
  ),
};

export const GradientTextAnimated: StoryObj = {
  render: () => (
    <div style={{ padding: "2rem" }}>
      <h1
        data-marquee="gradient-text-animated"
        style={{ fontSize: "3rem", margin: 0 }}
      >
        Animated Gradient
      </h1>
      <p style={{ marginTop: "1rem", color: "var(--tk-text-secondary)" }}>
        Gradient sweeps across the text (respects reduced-motion)
      </p>
    </div>
  ),
};

export const Shimmer: StoryObj = {
  render: () => (
    <div style={{ padding: "2rem" }}>
      <div
        data-marquee="shimmer"
        style={{
          padding: "2rem",
          backgroundColor: "var(--tk-action-fill)",
          color: "var(--tk-action-text)",
          borderRadius: "var(--tk-radius-lg)",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Shimmer Effect</h2>
        <p style={{ marginTop: "0.5rem", opacity: 0.9 }}>
          Watch the light sweep across
        </p>
      </div>
    </div>
  ),
};

export const PatternField: StoryObj = {
  render: () => (
    <div style={{ padding: "2rem", display: "grid", gap: "1rem" }}>
      <div
        data-marquee-pattern="normal"
        style={{
          padding: "2rem",
          borderRadius: "var(--tk-radius-md)",
          minHeight: "150px",
        }}
      >
        <h3>Normal Density</h3>
      </div>
      <div
        data-marquee-pattern="dense"
        style={{
          padding: "2rem",
          borderRadius: "var(--tk-radius-md)",
          minHeight: "150px",
        }}
      >
        <h3>Dense Pattern</h3>
      </div>
      <div
        data-marquee-pattern="sparse"
        style={{
          padding: "2rem",
          borderRadius: "var(--tk-radius-md)",
          minHeight: "150px",
        }}
      >
        <h3>Sparse Pattern</h3>
      </div>
    </div>
  ),
};

export const TextMaskModes: StoryObj = {
  render: () => (
    <div style={{ padding: "2rem", display: "grid", gap: "2rem" }}>
      <div>
        <h3 data-marquee-mask="soft" style={{ fontSize: "2rem" }}>
          Soft Edge Mask
        </h3>
        <p style={{ color: "var(--tk-text-secondary)" }}>
          Fades at the edges
        </p>
      </div>
      <div>
        <h3 data-marquee-mask="vignette" style={{ fontSize: "2rem" }}>
          Vignette Mask
        </h3>
        <p style={{ color: "var(--tk-text-secondary)" }}>
          Radial fade from center
        </p>
      </div>
    </div>
  ),
};

export const Combined: StoryObj = {
  render: () => (
    <div data-marquee-pattern="sparse" style={{ padding: "3rem" }}>
      <div
        data-marquee="shimmer"
        style={{
          padding: "3rem",
          backgroundColor: "var(--tk-surface-raised)",
          borderRadius: "var(--tk-radius-xl)",
          textAlign: "center",
          border: "1px solid var(--tk-line-default)",
        }}
      >
        <h1
          data-marquee="gradient-text-animated"
          style={{ fontSize: "3rem", margin: 0 }}
        >
          Marquee Pack
        </h1>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "1.25rem",
            color: "var(--tk-text-secondary)",
          }}
        >
          Shimmer + Gradient + Pattern
        </p>
      </div>
    </div>
  ),
};
