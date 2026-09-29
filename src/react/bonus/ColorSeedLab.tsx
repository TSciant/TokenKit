import { useState, useCallback, type ReactNode } from "react";

export interface ColorValue {
  l: number; // Lightness 0-100
  c: number; // Chroma 0-0.4
  h: number; // Hue 0-360
}

export interface ColorSeedLabProps {
  /** Initial hue angle (0-360) */
  initialHue?: number;
  /** Initial lightness (0-100) */
  initialLightness?: number;
  /** Initial chroma (0-0.4) */
  initialChroma?: number;
  /** Callback when pack is generated */
  onGenerate?: (pack: Record<string, string>) => void;
  /** Callback when pack is exported */
  onExport?: (css: string) => void;
  children?: ReactNode;
}

/**
 * ColorSeedLab — Hue-graph lab for exploring color systems and generating
 * candidate brand packs.
 * 
 * SAFETY: This is a development tool that emits candidate VALUES for
 * nudge/contrast re-gate. It never hot-rewrites shipped --tk-* values in
 * production without going through the proper gates.
 * 
 * @example
 * ```tsx
 * <ColorSeedLab
 *   initialHue={250}
 *   onGenerate={(pack) => console.log("Generated pack:", pack)}
 *   onExport={(css) => downloadFile(css, "candidate-pack.css")}
 * />
 * ```
 */
export function ColorSeedLab({
  initialHue = 250,
  initialLightness = 65,
  initialChroma = 0.2,
  onGenerate,
  onExport,
  children,
}: ColorSeedLabProps) {
  const [hue, setHue] = useState(initialHue);
  const [lightness, setLightness] = useState(initialLightness);
  const [chroma, setChroma] = useState(initialChroma);
  const [generatedPack, setGeneratedPack] = useState<Record<string, string> | null>(null);

  // Generate a color ramp from base values
  const generateRamp = useCallback(() => {
    const ramp: Record<string, string> = {};
    
    // Generate lightness ramp
    const lightnessSteps = [
      { key: "0", l: 100 },
      { key: "50", l: 98 },
      { key: "100", l: 95 },
      { key: "150", l: 92 },
      { key: "200", l: 88 },
      { key: "300", l: 80 },
      { key: "400", l: 65 },
      { key: "500", l: 50 },
      { key: "600", l: 40 },
      { key: "700", l: 30 },
      { key: "800", l: 20 },
      { key: "900", l: 12 },
      { key: "950", l: 8 },
      { key: "1000", l: 0 },
    ];

    // Neutrals (no chroma)
    lightnessSteps.forEach(({ key, l }) => {
      ramp[`neutral-${key}`] = `oklch(${l}% 0 ${hue})`;
    });

    // Brand colors with chroma
    const brandSteps = [
      { key: "primary", l: lightness, c: chroma },
      { key: "primary-light", l: Math.min(lightness + 10, 95), c: chroma * 0.8 },
      { key: "primary-dark", l: Math.max(lightness - 10, 10), c: chroma * 1.1 },
      { key: "primary-darker", l: Math.max(lightness - 20, 5), c: chroma * 1.2 },
    ];

    brandSteps.forEach(({ key, l, c }) => {
      ramp[key] = `oklch(${l.toFixed(1)}% ${c.toFixed(3)} ${hue})`;
    });

    // Accent color (complementary)
    const accentHue = (hue + 180) % 360;
    ramp["accent"] = `oklch(${lightness.toFixed(1)}% ${(chroma * 0.8).toFixed(3)} ${accentHue})`;
    ramp["accent-light"] = `oklch(${Math.min(lightness + 10, 95).toFixed(1)}% ${(chroma * 0.6).toFixed(3)} ${accentHue})`;

    return ramp;
  }, [hue, lightness, chroma]);

  const handleGenerate = useCallback(() => {
    const pack = generateRamp();
    setGeneratedPack(pack);
    onGenerate?.(pack);
  }, [generateRamp, onGenerate]);

  const handleExport = useCallback(() => {
    if (!generatedPack) return;

    const css = `/* Generated candidate pack - run through nudge-color.mjs before shipping */
@layer tokens {
  [data-brand="candidate"] {
${Object.entries(generatedPack)
  .map(([key, value]) => `    --candidate-${key}: ${value};`)
  .join("\n")}
  }
}`;

    onExport?.(css);
    
    // Also copy to clipboard
    navigator.clipboard.writeText(css).catch(console.error);
  }, [generatedPack, onExport]);

  // Generate color stops for the hue wheel
  const hueWheelStops = Array.from({ length: 12 }, (_, i) => {
    const h = (i * 30) % 360;
    return `oklch(${lightness}% ${chroma} ${h})`;
  }).join(", ");

  const currentColor = `oklch(${lightness}% ${chroma} ${hue})`;

  return (
    <div data-seed="lab">
      <div data-seed-warning>
        <strong>Development Tool:</strong> This lab emits candidate values for
        nudge/contrast re-gate. Never hot-rewrite shipped <code>--tk-*</code>{" "}
        tokens in production without proper validation.
      </div>

      <div data-seed-graph>
        <div
          data-seed-pin
          style={{
            left: `${50 + 45 * Math.cos((hue * Math.PI) / 180)}%`,
            top: `${50 + 45 * Math.sin((hue * Math.PI) / 180)}%`,
            backgroundColor: currentColor,
          }}
          onMouseDown={(e) => {
            const graph = e.currentTarget.parentElement;
            if (!graph) return;

            const handleMove = (moveEvent: MouseEvent) => {
              const rect = graph.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const x = moveEvent.clientX - rect.left - centerX;
              const y = moveEvent.clientY - rect.top - centerY;
              const angle = (Math.atan2(y, x) * 180) / Math.PI;
              setHue((angle + 360) % 360);
            };

            const handleUp = () => {
              document.removeEventListener("mousemove", handleMove);
              document.removeEventListener("mouseup", handleUp);
            };

            document.addEventListener("mousemove", handleMove);
            document.addEventListener("mouseup", handleUp);
          }}
        />
      </div>

      <div data-seed-controls>
        <div data-seed-control>
          <label data-seed-label htmlFor="seed-hue">
            Hue
          </label>
          <input
            id="seed-hue"
            data-seed-slider
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
          />
          <span data-seed-value>{hue}°</span>
        </div>

        <div data-seed-control>
          <label data-seed-label htmlFor="seed-lightness">
            Lightness
          </label>
          <input
            id="seed-lightness"
            data-seed-slider
            type="range"
            min="0"
            max="100"
            value={lightness}
            onChange={(e) => setLightness(Number(e.target.value))}
          />
          <span data-seed-value>{lightness}%</span>
        </div>

        <div data-seed-control>
          <label data-seed-label htmlFor="seed-chroma">
            Chroma
          </label>
          <input
            id="seed-chroma"
            data-seed-slider
            type="range"
            min="0"
            max="0.4"
            step="0.01"
            value={chroma}
            onChange={(e) => setChroma(Number(e.target.value))}
          />
          <span data-seed-value>{chroma.toFixed(2)}</span>
        </div>
      </div>

      {generatedPack && (
        <div data-seed-preview>
          <h3>Candidate Pack Preview</h3>
          <div data-seed-ramp>
            {Object.entries(generatedPack).map(([key, value]) => (
              <div key={key}>
                <div
                  data-seed-swatch
                  style={{ backgroundColor: value }}
                  title={`${key}: ${value}`}
                />
                <div data-seed-swatch-label>{key}</div>
              </div>
            ))}
          </div>

          <div data-seed-preview-tokens>
            {Object.entries(generatedPack).map(([key, value]) => (
              <div key={key} data-seed-token-line>
                <span data-seed-token-name>--candidate-{key}</span>
                <span
                  data-seed-token-preview
                  style={{ backgroundColor: value }}
                />
                <span data-seed-token-value>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div data-seed-actions>
        <button data-seed-action="secondary" onClick={handleGenerate}>
          Generate Ramp
        </button>
        <button
          data-seed-action
          onClick={handleExport}
          disabled={!generatedPack}
        >
          Export CSS
        </button>
      </div>

      {children}
    </div>
  );
}
