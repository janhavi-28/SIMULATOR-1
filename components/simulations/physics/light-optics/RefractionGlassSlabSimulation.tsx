"use client";

import React from "react";

/**
 * Embeds the standalone Refraction through Glass Slab Simulator (user's HTML) via iframe.
 * The simulator is served from /refraction-glass-slab-simulator.html (public folder).
 * Features: drag-to-adjust angle, Launch/Pause/Reset, Demo mode, dispersion, lateral shift, Snell's law readouts.
 */
export default function RefractionGlassSlabSimulation() {
  return (
    <div className="w-full h-full min-h-0 flex-1 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900/80 flex flex-col">
      <iframe
        src="/refraction-glass-slab-simulator.html?v=1"
        title="Refraction through Glass Slab"
        className="flex-1 w-full min-h-0 border-0 rounded-xl"
        allow="fullscreen"
      />
    </div>
  );
}
