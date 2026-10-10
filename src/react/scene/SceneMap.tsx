import { Map } from "../primitives/MapLazy";

/** The map a scene draws: a ratio the kit's media knows. */
export type SceneMapRatio = "16 / 9" | "4 / 3" | "1 / 1" | "3 / 4" | "21 / 9";

export interface SceneMapProps {
  /** What the map shows, for a screen reader: "Map of the Chicago office". */
  label?: string;
  /** Where the map is centred, east of Greenwich, in decimal degrees (west is negative). */
  longitude?: number;
  /** Where the map is centred, north of the equator, in decimal degrees (south is negative). */
  latitude?: number;
  /** How close the map is: about 4 for a country, 11 for a city, 15 for streets. */
  zoom?: number;
  /** A pin at the centre, for one place. */
  marker?: boolean;
  /** The map's shape. */
  ratio?: SceneMapRatio;
}

/**
 * A place on a map, as a scene draws it: the kit's Map on the pack's
 * basemap, loaded only when the scene has one. Longitude and latitude are
 * separate numbers because a scene's options are words, flags and numbers,
 * not pairs. Without a network the Map shows its own empty state, so a scene
 * never depends on tiles arriving.
 */
export function SceneMap({ label = "Map", longitude = 0, latitude = 51.4779, zoom = 12, marker = true, ratio = "16 / 9" }: SceneMapProps) {
  return <Map label={label} center={[longitude, latitude]} zoom={zoom} marker={marker} ratio={ratio} scheme="auto" navigation={false} scale={false} />;
}
