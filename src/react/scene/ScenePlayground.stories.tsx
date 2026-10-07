import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EXAMPLES } from "../../scene/examples.mjs";
import { PACKS } from "../../scene/scene.mjs";
import { Alert } from "../primitives/Alert";
import { Field } from "../primitives/Field";
import { Scene, cleanScene } from "./Scene";
import { SceneLayers } from "./SceneLayers";

const PACK_NAMES = PACKS as Record<string, string>;
const EXAMPLE_LIST = EXAMPLES as { title: string }[];

/**
 * Paste a scene, see what the kit makes of it: the notes say what was left
 * out and why, the layers show the structure, and the stage draws it with
 * the real components. Point at a layer or a part to light the other.
 */
function ScenePlayground() {
  const [json, setJson] = useState(() => JSON.stringify(EXAMPLES[0], null, 2));
  const [pack, setPack] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const result = useMemo(() => {
    try {
      return cleanScene(json);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [json]);

  return (
    <div data-shell="sidebar" data-gap="5">
      {/* Shrinks below the textarea's natural width, so a phone does not scroll sideways. */}
      <div data-shell="stack" data-gap="4" style={{ minInlineSize: 0 }}>
        <Field
          label="Start from"
          control="select"
          options={EXAMPLE_LIST.map((e) => ({ value: e.title, label: e.title }))}
          onChange={(e) => {
            const pick = EXAMPLE_LIST.find((x) => x.title === (e.target as HTMLSelectElement).value);
            if (pick) setJson(JSON.stringify(pick, null, 2));
          }}
        />
        <Field
          label="Pack"
          control="select"
          hint="Leave as the scene's to use the pack it names"
          options={[{ value: "", label: "The scene's" }, ...Object.entries(PACK_NAMES).map(([value, label]) => ({ value, label }))]}
          onChange={(e) => setPack((e.target as HTMLSelectElement).value)}
        />
        <Field
          label="Scene JSON"
          control="textarea"
          value={json}
          spellCheck={false}
          onChange={(e) => setJson((e.target as HTMLTextAreaElement).value)}
          style={{ fontFamily: "var(--tk-font-mono)", fontSize: "var(--tk-size-xs)", minBlockSize: "20rem", minInlineSize: 0 }}
        />
        {"error" in result ? (
          <Alert status="danger" title="Not drawn">
            {result.error}
          </Alert>
        ) : result.notes.length ? (
          <Alert status="warning" title={`Left out ${result.notes.length === 1 ? "one thing" : `${result.notes.length} things`}`}>
            <ul>
              {result.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Alert>
        ) : (
          <Alert status="success" title="Clean">
            Every part and option is one the kit has.
          </Alert>
        )}
        {"error" in result ? null : <SceneLayers scene={result.scene} active={active} onActive={setActive} />}
      </div>
      {"error" in result ? <div /> : <Scene scene={result.scene} brand={pack || undefined} active={active} onActive={setActive} />}
    </div>
  );
}

const meta = {
  title: "07 Playground/02 Scene",
  component: ScenePlayground,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Paste a scene's JSON, or start from an example and edit it. The notes say what the kit left out and why (a part it doesn't have, an option a component doesn't take, a value outside its set); a clean scene has none. Layers and stage light each other.",
      },
    },
  },
} satisfies Meta<typeof ScenePlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
