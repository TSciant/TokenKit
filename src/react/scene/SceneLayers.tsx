import { useState, type HTMLAttributes } from "react";
import { KINDS, summary } from "../../scene/scene.mjs";
import type { SceneData, SceneNode } from "./Scene";

export interface SceneLayersProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** A clean scene (from `cleanScene`). */
  scene: SceneData;
  /** The part lit on the stage, by its place in the scene; its layer lights too. */
  active?: string | null;
  /** Pointing at a layer, focusing it or pinning it says which part to light. */
  onActive?: (path: string | null) => void;
  /** The list's accessible name. */
  label?: string;
}

/**
 * SceneLayers — a scene's structure, part by part, beside its stage.
 *
 * A nested list, because a scene is a tree and a nested list is how a tree
 * reads to everyone: indentation for the eye, list depth for a screen reader.
 * Each layer is a toggle. Pointing at it or focusing it lights its part;
 * pressing it pins the light there until it is pressed again, so a keyboard
 * user can light a part and look. Pointing at a part on the stage lights its
 * layer, through `active`.
 */
export function SceneLayers({ scene, active, onActive, label = "Layers", ...rest }: SceneLayersProps) {
  const [pinned, setPinned] = useState<string | null>(null);
  const light = (path: string | null) => onActive?.(path ?? pinned);

  function layer(node: SceneNode, path: string) {
    const spec = (KINDS as Record<string, { name: string }>)[node.kind];
    const line = summary(node);
    return (
      <li key={path}>
        <button
          type="button"
          data-tk="scene-layer"
          data-active={active === path ? "" : undefined}
          aria-pressed={pinned === path}
          onPointerEnter={() => light(path)}
          onPointerLeave={() => light(null)}
          onFocus={() => light(path)}
          onBlur={() => light(null)}
          onClick={() => {
            const next = pinned === path ? null : path;
            setPinned(next);
            onActive?.(next ?? path);
          }}
        >
          <span data-tk="scene-layer-name">{spec?.name ?? node.kind}</span>
          {line ? <span data-tk="scene-layer-summary">{line}</span> : null}
        </button>
        {node.children?.length ? <ul>{node.children.map((c, i) => layer(c, `${path}.${i}`))}</ul> : null}
      </li>
    );
  }

  return (
    <div data-tk="scene-layers" role="group" aria-label={label} {...rest}>
      <ul>{layer(scene.root, "0")}</ul>
    </div>
  );
}
