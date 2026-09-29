import type { Meta, StoryObj } from "@storybook/react";
import { AmbientField } from "./AmbientField";
import "../../css/bonus/ambient.css";

const meta: Meta<typeof AmbientField> = {
  title: "Bonus Packs/Ambient",
  component: AmbientField,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AmbientField>;

/**
 * Ambient pack provides SVG motifs (grid/orbit/pulse/mesh) with optional
 * canvas particle effects. Respects prefers-reduced-motion.
 */
export const Grid: Story = {
  args: {
    motif: "grid",
    density: "normal",
  },
  render: (args) => (
    <AmbientField {...args}>
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>Grid Motif</h1>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "1.25rem",
            color: "var(--tk-text-secondary)",
          }}
        >
          SVG grid background pattern
        </p>
      </div>
    </AmbientField>
  ),
};

export const Orbit: Story = {
  args: {
    motif: "orbit",
  },
  render: (args) => (
    <AmbientField {...args}>
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>Orbit Motif</h1>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "1.25rem",
            color: "var(--tk-text-secondary)",
          }}
        >
          Concentric circles radiating from center
        </p>
      </div>
    </AmbientField>
  ),
};

export const Pulse: Story = {
  args: {
    motif: "pulse",
  },
  render: (args) => (
    <AmbientField {...args}>
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>Pulse Motif</h1>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "1.25rem",
            color: "var(--tk-text-secondary)",
          }}
        >
          Animated radial pulse (respects reduced-motion)
        </p>
      </div>
    </AmbientField>
  ),
};

export const Mesh: Story = {
  args: {
    motif: "mesh",
    density: "normal",
  },
  render: (args) => (
    <AmbientField {...args}>
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>Mesh Motif</h1>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "1.25rem",
            color: "var(--tk-text-secondary)",
          }}
        >
          Diagonal mesh pattern
        </p>
      </div>
    </AmbientField>
  ),
};

export const WithCanvasParticles: Story = {
  args: {
    motif: "grid",
    enableCanvas: true,
    particleCount: 40,
    density: "sparse",
  },
  render: (args) => (
    <AmbientField {...args}>
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", margin: 0 }}>
          Canvas Particle Effects
        </h1>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "1.25rem",
            color: "var(--tk-text-secondary)",
          }}
        >
          Kuramoto-style coordinated particles (respects reduced-motion)
        </p>
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: "var(--tk-surface-raised)",
            borderRadius: "var(--tk-radius-lg)",
            display: "inline-block",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            Canvas PE is hidden when prefers-reduced-motion is enabled
          </p>
        </div>
      </div>
    </AmbientField>
  ),
};

export const DensityVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
      <AmbientField motif="grid" density="sparse">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h3>Sparse</h3>
        </div>
      </AmbientField>
      <AmbientField motif="grid" density="normal">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h3>Normal</h3>
        </div>
      </AmbientField>
      <AmbientField motif="grid" density="dense">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h3>Dense</h3>
        </div>
      </AmbientField>
    </div>
  ),
};

export const ColorThemes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "2rem", padding: "2rem" }}>
      <AmbientField motif="mesh" theme="cool">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Cool Theme</h2>
          <p style={{ color: "var(--tk-text-secondary)" }}>
            Blues and info colors
          </p>
        </div>
      </AmbientField>
      <AmbientField motif="orbit" theme="warm">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Warm Theme</h2>
          <p style={{ color: "var(--tk-text-secondary)" }}>
            Oranges and warning colors
          </p>
        </div>
      </AmbientField>
      <AmbientField motif="grid" theme="brand">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Brand Theme</h2>
          <p style={{ color: "var(--tk-text-secondary)" }}>
            Action and gradient colors
          </p>
        </div>
      </AmbientField>
    </div>
  ),
};

export const FullPageHero: Story = {
  args: {
    motif: "orbit",
    enableCanvas: true,
    particleCount: 60,
    canvasOpacity: 0.4,
  },
  render: (args) => (
    <AmbientField {...args}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "600px", textAlign: "center" }}>
          <h1 style={{ fontSize: "4rem", margin: 0 }}>Ambient Field</h1>
          <p
            style={{
              marginTop: "1.5rem",
              fontSize: "1.5rem",
              color: "var(--tk-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Create atmospheric backgrounds with SVG motifs and optional canvas
            particle effects
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              style={{
                padding: "1rem 2rem",
                backgroundColor: "var(--tk-action-fill)",
                color: "var(--tk-action-text)",
                border: "none",
                borderRadius: "var(--tk-radius-md)",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Get Started
            </button>
            <button
              style={{
                padding: "1rem 2rem",
                backgroundColor: "transparent",
                color: "var(--tk-text-primary)",
                border: "2px solid var(--tk-line-strong)",
                borderRadius: "var(--tk-radius-md)",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </AmbientField>
  ),
};
