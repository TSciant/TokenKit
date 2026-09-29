import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "../motion/usePrefersReducedMotion";

export interface AmbientFieldProps {
  /** SVG motif type (grid, orbit, pulse, mesh) */
  motif?: "grid" | "orbit" | "pulse" | "mesh";
  /** Enable canvas particle effects (respects reduced-motion) */
  enableCanvas?: boolean;
  /** Density of pattern/particles */
  density?: "sparse" | "normal" | "dense";
  /** Color theme for effects */
  theme?: "cool" | "warm" | "brand";
  /** Number of particles for canvas mode */
  particleCount?: number;
  /** Opacity of canvas layer */
  canvasOpacity?: number;
  children?: ReactNode;
}

/**
 * AmbientField — SVG motifs with optional canvas particle effects.
 * 
 * Provides AmbientField-style backgrounds (grid/orbit/pulse/mesh) with
 * optional Kuramoto/PosterGhosts-style canvas PE. Canvas respects
 * prefers-reduced-motion and is opt-in.
 * 
 * @example
 * ```tsx
 * <AmbientField motif="grid" density="sparse">
 *   <h1>Content over ambient field</h1>
 * </AmbientField>
 * 
 * <AmbientField motif="orbit" enableCanvas particleCount={50}>
 *   <p>With particle effects</p>
 * </AmbientField>
 * ```
 */
export function AmbientField({
  motif = "grid",
  enableCanvas = false,
  density = "normal",
  theme,
  particleCount = 30,
  canvasOpacity = 0.6,
  children,
}: AmbientFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enableCanvas || !canvasRef.current || prefersReducedMotion || !mounted) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    // Simple particle system
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      phase: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      // Kuramoto-style phase coupling (simplified)
      particles.forEach((p, i) => {
        p.phase += 0.02;
        
        // Simple coupling with neighbors
        particles.forEach((other, j) => {
          if (i !== j) {
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              const coupling = 0.001 / (dist + 1);
              p.phase += Math.sin(other.phase - p.phase) * coupling;
            }
          }
        });

        // Update position with phase-modulated velocity
        const phaseInfluence = Math.sin(p.phase) * 0.2;
        p.x += p.vx + phaseInfluence;
        p.y += p.vy + Math.cos(p.phase) * 0.1;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(p.phase) * 0.2})`;
        ctx.fill();

        // Draw connections
        particles.forEach((other) => {
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", updateSize);
    };
  }, [enableCanvas, prefersReducedMotion, particleCount, mounted]);

  const ambientAttrs = {
    "data-ambient": motif,
    "data-ambient-density": density !== "normal" ? density : undefined,
    "data-ambient-theme": theme,
    "data-ambient-pe-enabled": enableCanvas && !prefersReducedMotion ? "" : undefined,
  };

  return (
    <div {...ambientAttrs}>
      {enableCanvas && !prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          data-ambient-canvas
          style={{ opacity: canvasOpacity }}
        />
      )}
      {children}
    </div>
  );
}
