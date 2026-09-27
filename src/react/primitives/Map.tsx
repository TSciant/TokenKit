"use client";
/* Client component. This file uses React state, effects or DOM APIs, so it
   runs in the browser rather than on the server. The directive is inert under
   Vite/Storybook and load-bearing under the Next.js App Router, where a module
   without it is a server component and may not use hooks at all. */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import * as maplibregl from "maplibre-gl";
import { Icon } from "./Icon";

/* maplibre's stylesheet belongs HERE, not in the host's layout, and that is a
   performance decision rather than a tidiness one. It is 84 KB, and this
   module is the target of the lazy import in MapLazy.tsx — so imported here
   it lands in the map's own chunk and arrives with the map. Hoisted to the
   Next root layout, as it was briefly, it became a third render-blocking
   stylesheet on every route, including the four that never show a map.
 
   (The rule that global CSS may only be imported from a layout is a Pages
   Router rule. The App Router takes a CSS import from any component, and
   scopes its loading to that component's chunk, which is the whole point.) */
import "maplibre-gl/dist/maplibre-gl.css";

/* The worker, though, stays a host concern. `?url` is a Vite suffix that Next
   does not understand, and where a file is served from is the application's
   decision, not a component's: see TK_MAP_WORKER_URL below. Storybook maps it
   in via staticDirs, the Next app copies it into public/. */

export type MapScheme = "light" | "dark" | "auto";

export type MapProps = {
  /** Basemap. `auto` follows pack on `[data-brand]` (wireframe vs wireframe-dark). */
  scheme?: MapScheme;
  /** [lng, lat]. Defaults to the prime meridian at Greenwich. */
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  navigation?: boolean;
  scale?: boolean;
  geolocate?: boolean;
  fullscreen?: boolean;
  mapStyle?: string;
  label?: string;
  marker?: boolean;
  className?: string;
  style?: CSSProperties;
  ratio?: string;
};

const STYLE_URL = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
} as const;

/* The prime meridian at Greenwich: longitude zero, and dense enough ground to
   show a basemap doing its job. A default has to be somewhere, and somewhere
   arbitrary-but-legible beats a city left over from whoever needed a map
   last — that one survives three engagements and nobody can say why it is
   there. An engagement sets `center` and never thinks about this line. */
const DEFAULT_CENTER: [number, number] = [0.0, 51.4779];

/* maplibre finds its own worker from import.meta.url, but only when that
   resolves to an http(s) URL — inside a bundled chunk it does not, so the
   worker has to be pointed at a real served file. This is the path; a host
   that serves it elsewhere sets window.__tkMapWorkerUrl before first render. */
const TK_MAP_WORKER_URL = "/maplibre-gl-worker.mjs";

let workerReady = false;
function ensureWorker() {
  if (workerReady) return;
  const setUrl =
    (maplibregl as { setWorkerUrl?: (u: string) => void }).setWorkerUrl ??
    (maplibregl as { default?: { setWorkerUrl?: (u: string) => void } }).default
      ?.setWorkerUrl;
  if (typeof setUrl === "function") {
    const override = (globalThis as { __tkMapWorkerUrl?: string })
      .__tkMapWorkerUrl;
    setUrl(override ?? TK_MAP_WORKER_URL);
  }
  workerReady = true;
}

/**
 * Resolve light/dark from the kit pack — never from OS prefers-color-scheme.
 * OS dark + light pack was painting Dark Matter on a light page (and the reverse
 * felt like "not inverting"). Pack is the source of truth.
 */
function resolveScheme(
  host: HTMLElement,
  scheme: MapScheme,
): "light" | "dark" {
  if (scheme === "light" || scheme === "dark") return scheme;
  const brand = host.closest("[data-brand]")?.getAttribute("data-brand");
  if (brand === "wireframe-dark") return "dark";
  if (brand === "wireframe") return "light";
  // Prototype / pages without a brand: invert against surface ink if we can.
  const on = host.closest("[data-on]")?.getAttribute("data-on");
  if (on === "inverse") return "dark";
  return "light";
}

export function Map({
  scheme = "auto",
  center = DEFAULT_CENTER,
  zoom = 11,
  pitch = 0,
  bearing = 0,
  navigation = true,
  scale = true,
  geolocate = false,
  fullscreen = false,
  mapStyle,
  label = "Map",
  marker = false,
  className,
  style,
  ratio = "16 / 9",
}: MapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const regionId = useId();
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  /* Null while the basemap is still plausibly coming. A string once it is
     not, which is also the string the reader is shown. */
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    ensureWorker();
    const initial = resolveScheme(host, scheme);
    setResolved(initial);

    const MapCtor =
      (maplibregl as unknown as { Map: typeof maplibregl.Map }).Map ??
      (maplibregl as unknown as { default: { Map: typeof maplibregl.Map } }).default
        .Map;
    const NavigationControl =
      maplibregl.NavigationControl ??
      (maplibregl as unknown as { default: typeof maplibregl }).default
        .NavigationControl;
    const ScaleControl =
      maplibregl.ScaleControl ??
      (maplibregl as unknown as { default: typeof maplibregl }).default.ScaleControl;
    const GeolocateControl =
      maplibregl.GeolocateControl ??
      (maplibregl as unknown as { default: typeof maplibregl }).default
        .GeolocateControl;
    const FullscreenControl =
      maplibregl.FullscreenControl ??
      (maplibregl as unknown as { default: typeof maplibregl }).default
        .FullscreenControl;
    const Marker =
      maplibregl.Marker ??
      (maplibregl as unknown as { default: typeof maplibregl }).default.Marker;

    const map = new MapCtor({
      container: host,
      style: mapStyle ?? STYLE_URL[initial],
      center,
      zoom,
      pitch,
      bearing,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    /* --- work, or exit ----------------------------------------------------
       A basemap that never arrives does not fail loudly. maplibre builds its
       canvas, mounts its zoom buttons and its attribution, and paints
       nothing — so the reader gets an empty rounded box with somebody else's
       controls in the corner and no indication that anything went wrong. It
       looks like a map of the sea.

       There are two failures worth separating. A handful of missing tiles is
       survivable and the map is still a map; the style JSON never loading is
       fatal, because without it there is no basemap at all and every control
       on top of it is a lie. So the test is whether the style is loaded by
       the deadline, not whether any error was emitted.

       On a fatal failure the map is REMOVED rather than hidden. Leaving the
       instance alive keeps maplibre's controls and attribution in the DOM,
       which is most of what made the empty state look deliberate, and keeps
       a WebGL context and a tile worker alive for a thing nobody can see.

       Reproducible here: the cloud container's egress proxy denies
       basemaps.cartocdn.com outright, so this path is the one that runs in
       CI and the happy path is the one that needs a network.
       -------------------------------------------------------------------- */
    let settled = false;
    const giveUp = (why: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(deadline);
      markerRef.current?.remove();
      markerRef.current = null;
      try {
        map.remove();
      } catch {
        /* remove() throws if the context is already lost, which is one of the
           ways we got here. Nothing to do about it and nothing to report. */
      }
      mapRef.current = null;
      setFailure(why);
    };

    /* Eight seconds. Long enough that a slow connection on a phone is not
       told the map is broken, short enough that nobody sits looking at an
       empty box wondering. */
    const deadline = window.setTimeout(() => {
      if (!settled && !map.isStyleLoaded()) {
        giveUp("The basemap did not load.");
      }
    }, 8000);

    map.on("load", () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(deadline);
    });

    /* maplibre emits `error` for a single missing tile as readily as for a
       dead style URL, so the event alone is not a verdict — it only matters
       when the style is also absent. */
    map.on("error", () => {
      if (!settled && !map.isStyleLoaded()) {
        giveUp("The basemap could not be reached.");
      }
    });

    /* maplibre puts role="region" aria-label="Map" on its own <canvas>. Inside
       the wrapper above — which is already a region named by `label` — that is
       a second landmark with the same name: axe's landmark-unique, and a
       screen reader announcing "Map region" twice for one map. The canvas is
       an implementation detail of this region, so it gives up the landmark and
       keeps its tabindex, which is what actually carries the pan/zoom keys.
       The description on the wrapper says how to drive it. */
    const canvas = map.getCanvas();
    canvas.removeAttribute("role");
    canvas.removeAttribute("aria-label");

    if (navigation) {
      map.addControl(
        new NavigationControl({ visualizePitch: true }),
        "top-right",
      );
    }
    if (scale) {
      map.addControl(new ScaleControl({ maxWidth: 120 }), "bottom-left");
    }
    if (geolocate) {
      map.addControl(
        new GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        "top-right",
      );
    }
    if (fullscreen) {
      map.addControl(new FullscreenControl(), "top-right");
    }
    if (marker) {
      markerRef.current = new Marker({ color: "#111" })
        .setLngLat(center)
        .addTo(map);
    }

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(host);

    return () => {
      ro.disconnect();
      window.clearTimeout(deadline);
      settled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      /* giveUp may already have removed it. Removing twice throws. */
      if (mapRef.current) {
        try {
          map.remove();
        } catch {
          /* already gone */
        }
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const map = mapRef.current;
    if (!host || !map) return;
    const next = resolveScheme(host, scheme);
    setResolved(next);
    if (mapStyle) {
      map.setStyle(mapStyle);
      return;
    }
    map.setStyle(STYLE_URL[next]);
  }, [scheme, mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center, zoom, pitch, bearing });
    markerRef.current?.setLngLat(center);
  }, [center, zoom, pitch, bearing]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || scheme !== "auto" || mapStyle) return;
    const root =
      host.closest("[data-brand]") ??
      document.querySelector(".sb-host") ??
      document.documentElement;
    const mo = new MutationObserver(() => {
      const map = mapRef.current;
      if (!map) return;
      const next = resolveScheme(host, "auto");
      setResolved((prev) => {
        if (prev === next) return prev;
        map.setStyle(STYLE_URL[next]);
        return next;
      });
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-brand"] });
    return () => mo.disconnect();
  }, [scheme, mapStyle]);

  /* Exited. Same box, same ratio, so nothing on the page moves — the reason
     the failed state is a sibling of the live one rather than a different
     component.

     Not role="region" any more, and not labelled "Map": there is no map here,
     and a landmark named for a thing that is absent sends a screen-reader
     user to an empty stop. role="status" instead, because this appeared after
     load and is worth one polite announcement.

     Icon AND text, never icon alone and never colour alone. The glyph makes
     the state readable at a glance, the sentence says which state it is, and
     the muted ground only reinforces what both already said. */
  if (failure) {
    return (
      <div
        data-tk="map"
        data-failed=""
        data-scheme={resolved}
        className={className}
        style={{ ["--_ratio" as string]: ratio, ...style }}
        role="status"
      >
        <div data-tk="map-exit">
          <Icon name="alert" size="lg" />
          <p>
            <strong>{label} unavailable.</strong> {failure}
          </p>
          <p data-tk="map-exit-note">
            The surrounding text carries the same information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-tk="map"
      data-scheme={resolved}
      className={className}
      style={{
        ["--_ratio" as string]: ratio,
        ...style,
      }}
      role="region"
      aria-label={label}
      aria-describedby={regionId}
    >
      <p id={regionId} data-tk="visually-hidden">
        Interactive map. Use plus and minus to zoom, arrow keys to pan when the
        map is focused. Basemap follows the Storybook pack (light or dark).
      </p>
      <div data-tk="map-canvas" ref={hostRef} />
    </div>
  );
}
