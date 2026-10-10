import { Fragment, useId, useMemo, type HTMLAttributes, type ReactNode } from "react";
import { sanitize } from "../../scene/scene.mjs";
import { Alert } from "../primitives/Alert";
import { Button } from "../primitives/Button";
import { ButtonGroup } from "../primitives/ButtonGroup";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "../primitives/Card";
import { Chip } from "../primitives/Chip";
import { DataTable } from "../primitives/DataTable";
import { ChoiceCardGroup } from "../primitives/ChoiceCard";
import { Eyebrow } from "../primitives/Eyebrow";
import { Field } from "../primitives/Field";
import { Heading } from "../primitives/Heading";
import { Icon, type IconName } from "../primitives/Icon";
import { icons } from "../primitives/icon-set";
import { Pager } from "../primitives/Pager";
import { Plate } from "../primitives/Plate";
import { Quote } from "../primitives/Quote";
import { VideoPlayer } from "../primitives/VideoPlayer";
import { Shell, type ShellKind } from "../shells/Shell";
import { SceneMap } from "./SceneMap";

/** A part of a clean scene: a kind, its words, its options, its parts. */
export type SceneNode = { kind: string; text?: string; children?: SceneNode[] } & Record<string, unknown>;
/** A scene after `sanitize`: every kind and option in it is one the kit has. */
export type SceneData = { title: string; brand: string; root: SceneNode };

const ICONS = new Set(Object.keys(icons));
const SHELLS = new Set(["stack", "row", "inline", "grid", "split", "sidebar", "center"]);

/** Sanitize anything into a scene with the kit's icon names. Throws when nothing is left. */
export function cleanScene(input: unknown): { scene: SceneData; notes: string[] } {
  return sanitize(input, { icons: ICONS }) as { scene: SceneData; notes: string[] };
}

const humanize = (name: string) => name.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
/* One of six plate compositions, picked by where the plate sits, so two plates
   in one scene differ and the same scene draws the same way every time. */
const seedOf = (path: string) => ([...path].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 6) + 1;

export interface SceneProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** A scene, or its JSON, from anywhere: it is sanitized before anything is drawn. */
  scene: unknown;
  /** Dress it in another pack than the scene names. */
  brand?: string;
  /** The part to light, by its place in the scene ("0.1.2"). */
  active?: string | null;
  /** Pointing at a part says which, so a layers panel can light its layer. */
  onActive?: (path: string | null) => void;
}

/**
 * Scene — a component described as data, drawn with the kit's own
 * components. Every kind is the real thing (a card is `Card`, a field is
 * `Field`), so a scene cannot draw anything the kit would not, and every
 * change to a component reaches every scene with nothing to update.
 *
 * Whatever comes in is sanitized first; what was left out is in `cleanScene`'s
 * notes. Nothing in a scene becomes markup: its words are set as text.
 */
export function Scene({ scene, brand, active, onActive, ...rest }: SceneProps) {
  const uid = useId();
  const result = useMemo(() => {
    try {
      return cleanScene(scene);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [scene]);

  if ("error" in result) {
    return (
      <div data-tk="scene" {...rest}>
        <Alert status="warning" title="This scene can’t be drawn">
          {result.error}
        </Alert>
      </div>
    );
  }

  const { scene: clean } = result;
  const mark = (path: string) => ({
    "data-scene-node": path,
    "data-scene-active": active === path ? "" : undefined,
  });

  function part(node: SceneNode, path: string): ReactNode {
    const n = node as Record<string, any>;
    const kids = () => (node.children ?? []).map((c, i) => <Fragment key={i}>{part(c, `${path}.${i}`)}</Fragment>);
    const m = mark(path);
    const k = node.kind;

    if (SHELLS.has(k)) {
      return (
        <Shell kind={k as ShellKind} gap={n.gap} cols={n.cols} fixed={n.fixed} ratio={n.ratio} side={n.side} width={n.width} align={n.align} justify={n.justify} {...m}>
          {kids()}
        </Shell>
      );
    }
    switch (k) {
      case "section":
        /* A section of a page from the wireframe library: its parts were
           expanded from the template before sanitize, so this only frames them. */
        return (
          <Shell as="section" kind="stack" gap={5} data-section={n.type} data-section-variant={n.variant} {...m}>
            {kids()}
          </Shell>
        );
      case "card":
        return <Card variant={n.variant} {...m}>{kids()}</Card>;
      case "card-header":
        return <CardHeader eyebrow={n.eyebrow} subtitle={n.subtitle} {...m}>{kids()}</CardHeader>;
      case "card-title":
        return <CardTitle {...m}>{node.text}</CardTitle>;
      case "card-body":
        return <CardBody {...m}>{node.text}</CardBody>;
      case "card-footer":
        return <CardFooter {...m}>{kids()}</CardFooter>;
      case "heading":
        return <Heading level={n.level ?? 2} text={n.look} {...m}>{node.text}</Heading>;
      case "text":
        return <p data-text={n.look} {...m}>{node.text}</p>;
      case "eyebrow":
        return <Eyebrow emphasis={n.emphasis} {...m}>{node.text}</Eyebrow>;
      case "media":
        return <Plate ratio={n.ratio} label={n.label} texture={n.texture} subject={n.subject} seed={seedOf(path)} {...m} />;
      case "divider":
        return <hr {...m} />;
      case "pagination":
        return (
          <Pager
            page={n.page ?? 1}
            total={n.total ?? n.page ?? 1}
            href={(p) => `#page-${p}`}
            numbers={n.numbers}
            prevLabel={n.prevLabel}
            nextLabel={n.nextLabel}
            label={n.label}
            {...m}
          />
        );
      case "table": {
        /* The first row holds the headings; the rest are the rows. */
        const [head, ...body] = (node.children ?? []).map((r) => (r.children ?? []).map((c) => c.text ?? ""));
        const columns = (head ?? []).map((label, i) => ({ key: `c${i}`, label }));
        const rows = body.map((cells) => Object.fromEntries(columns.map((c, i) => [c.key, cells[i] ?? ""])));
        return (
          <DataTable
            caption={node.text ?? "Table"}
            captionHidden={n.captionHidden}
            columns={columns}
            rows={rows}
            rowHeader={n.rowHeaders && columns.length ? "c0" : undefined}
            striped={n.striped}
            dense={n.dense}
            {...m}
          />
        );
      }
      case "video":
        return <VideoPlayer title={node.text ?? "Video"} posterLabel={n.posterLabel} ratio={n.ratio} duration={n.duration} captions={n.captions} {...m} />;
      case "quote":
        return <Quote text={node.text ?? ""} name={n.name ?? ""} role={n.role} organisation={n.organisation} variant={n.variant} {...m} />;
      case "map":
        /* The marks go on a wrapper: the Map takes no attributes of its own. */
        return (
          <div {...m}>
            <SceneMap label={n.label} longitude={n.longitude} latitude={n.latitude} zoom={n.zoom} marker={n.marker} ratio={n.ratio} />
          </div>
        );
      case "icon":
        return <Icon name={n.icon as IconName} size={n.size} label={n.label} {...m} />;
      case "button": {
        const glyph = n.icon ? <Icon name={n.icon as IconName} /> : undefined;
        const iconOnly = Boolean(glyph) && !node.text;
        return (
          <Button
            variant={n.variant}
            tone={n.tone}
            size={n.size}
            pressed={n.pressed}
            full={n.full}
            busy={n.busy}
            icon={glyph}
            iconPosition={n.iconPosition}
            aria-label={iconOnly ? humanize(n.icon) : undefined}
            {...m}
          >
            {node.text ?? (glyph ? undefined : "Button")}
          </Button>
        );
      }
      case "button-group":
        return (
          <ButtonGroup
            label={node.text ?? "Actions"}
            align={n.align}
            max={n.max}
            equal={n.equal}
            size={n.size}
            moreLabel={n.moreLabel}
            actions={(node.children ?? []).map((b) => ({
              label: b.text ?? (b.icon ? humanize(String(b.icon)) : "Button"),
              variant: b.variant as "solid" | "outline" | "quiet" | undefined,
              tone: b.tone as "neutral" | "danger" | undefined,
            }))}
            {...m}
          />
        );
      case "chip": {
        const chip = { emphasis: n.emphasis, interactive: n.interactive, pressed: n.pressed, leading: n.icon ? <Icon name={n.icon as IconName} size="sm" /> : undefined };
        return <Chip {...(chip as any)} {...m}>{node.text}</Chip>;
      }
      case "field":
        return (
          <Field
            label={n.label ?? "Label"}
            hint={n.hint}
            error={n.error}
            required={n.required}
            optional={n.optional}
            control={n.control}
            chars={n.chars}
            prefix={n.prefix}
            suffix={n.suffix}
            maxChars={n.maxChars}
            type={n.type}
            readOnly={n.readOnly}
            options={(n.options as string[] | undefined)?.map((o) => ({ value: o, label: o }))}
            {...m}
          />
        );
      case "alert":
        return <Alert status={n.status} title={n.title} {...m}>{node.text}</Alert>;
      case "choice-group":
        return (
          <ChoiceCardGroup
            legend={node.text ?? "Choose one"}
            name={`${uid}-${path}`}
            type={n.type}
            hideLegend={n.hideLegend}
            columns={n.columns}
            hint={n.hint}
            required={n.required}
            options={(node.children ?? []).map((c, i) => ({
              value: String(i),
              title: c.text ?? "Option",
              description: c.description as string | undefined,
              meta: c.meta as string | undefined,
              disabled: c.disabled as boolean | undefined,
            }))}
            {...m}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div
      data-tk="scene"
      data-brand={brand ?? clean.brand}
      role="group"
      aria-label={clean.title}
      onPointerOver={onActive ? (e) => onActive((e.target as Element).closest("[data-scene-node]")?.getAttribute("data-scene-node") ?? null) : undefined}
      onPointerLeave={onActive ? () => onActive(null) : undefined}
      {...rest}
    >
      {part(clean.root, "0")}
    </div>
  );
}
