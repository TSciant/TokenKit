import type { Meta, StoryObj } from "@storybook/react";
import { ColorSeedLab } from "./ColorSeedLab";
import "../../css/bonus/seed.css";

const meta: Meta<typeof ColorSeedLab> = {
  title: "Bonus Packs/Seed",
  component: ColorSeedLab,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ColorSeedLab>;

/**
 * Seed pack provides a ColorSeed-style hue-graph lab for exploring color
 * systems and generating candidate brand packs.
 * 
 * SAFETY: Emits candidate values for nudge/contrast re-gate, never hot-rewrites
 * shipped --tk-* tokens.
 */
export const Default: Story = {
  args: {
    initialHue: 250,
    initialLightness: 65,
    initialChroma: 0.2,
    onGenerate: (pack) => {
      console.log("Generated pack:", pack);
    },
    onExport: (css) => {
      console.log("Exported CSS:", css);
    },
  },
};

export const VioletTheme: Story = {
  args: {
    initialHue: 260,
    initialLightness: 58,
    initialChroma: 0.25,
  },
};

export const OrangeTheme: Story = {
  args: {
    initialHue: 40,
    initialLightness: 68,
    initialChroma: 0.22,
  },
};

export const TealTheme: Story = {
  args: {
    initialHue: 180,
    initialLightness: 55,
    initialChroma: 0.18,
  },
};

export const HighChroma: Story = {
  args: {
    initialHue: 330,
    initialLightness: 60,
    initialChroma: 0.35,
  },
};

export const Interactive: Story = {
  render: () => (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          backgroundColor: "var(--tk-surface-sunken)",
          borderRadius: "var(--tk-radius-lg)",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: "0.5rem" }}>
          Color Seed Lab
        </h2>
        <p
          style={{
            margin: 0,
            color: "var(--tk-text-secondary)",
            lineHeight: 1.6,
          }}
        >
          Explore color systems interactively. Adjust hue, lightness, and
          chroma to generate candidate brand packs. The lab emits OKLab values
          that maintain perceptual uniformity across the ramp.
        </p>
      </div>

      <ColorSeedLab
        initialHue={250}
        initialLightness={65}
        initialChroma={0.2}
        onGenerate={(pack) => {
          console.group("Generated Pack");
          Object.entries(pack).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
          });
          console.groupEnd();
        }}
        onExport={(css) => {
          console.log("Exported CSS to clipboard:");
          console.log(css);
          alert("CSS copied to clipboard! Check console for full output.");
        }}
      />

      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "var(--tk-status-info-surface)",
          borderLeft: "4px solid var(--tk-status-info-line)",
          borderRadius: "var(--tk-radius-md)",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
          Workflow
        </h3>
        <ol
          style={{
            marginBottom: 0,
            paddingLeft: "1.5rem",
            lineHeight: 1.8,
          }}
        >
          <li>
            Drag the pin on the hue wheel or use sliders to explore colors
          </li>
          <li>Click "Generate Ramp" to see the full color system</li>
          <li>Click "Export CSS" to copy candidate pack to clipboard</li>
          <li>
            Run through <code>tools/nudge-color.mjs</code> for contrast
            validation
          </li>
          <li>
            Re-gate with <code>npm run gate</code> before shipping
          </li>
        </ol>
      </div>
    </div>
  ),
};
