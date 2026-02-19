"use client";

import React from "react";
import ConvexLensSimulator from "./lens-magnification";

/**
 * Convex Lens Magnification Simulator — scientifically accurate ray diagram.
 * Uses OpticsMath (1/f = 1/v + 1/u, m = v/u), principal rays, sign convention toggle,
 * and structured StatusCard with u, v, f, m and image type (Real/Virtual, Inverted/Erect, size).
 */
export default function MagnificationSimulation() {
  return (
    <div className="w-full h-full min-h-[520px] rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900/80 flex flex-col">
      <ConvexLensSimulator />
    </div>
  );
}
