"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect where there is a layout, useEffect where there is not.
 *
 * The FX layer needs to run before the browser paints — that is the whole
 * point of it — but useLayoutEffect on the server is a contradiction, and
 * React logs a warning for every component that calls one during server
 * rendering. The warning is right: there is nothing to measure and nothing to
 * paint, so the effect does not run at all.
 *
 * Swapping to useEffect on the server is not a behaviour change (neither runs
 * there); it just stops React from complaining about a thing that cannot
 * happen. `typeof document` is the test, not a bundler flag, so it is correct
 * under Vite, Next and a plain Node render alike.
 */
export const useIsomorphicLayoutEffect =
  typeof document !== "undefined" ? useLayoutEffect : useEffect;
