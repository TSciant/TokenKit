/**
 * Shared vocabulary for the pattern layer.
 *
 * `Cols` lived in the marketing file and was imported from there by the other
 * three, which made a content file the owner of a layout type. It belongs
 * here, where nothing imports anything.
 */

/** Column counts the grid shells actually accept. */
export type Cols = 1 | 2 | 3 | 4;
