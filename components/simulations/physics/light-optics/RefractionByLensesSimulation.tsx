"use client";

import React from "react";

/**
 * Embeds the standalone Lens Refraction Simulator (user's HTML) via iframe.
 * The simulator is served from /refraction-by-lenses-simulator.html (public folder).
 */
export default function RefractionByLensesSimulation() {
  return (
    <div className="w-full h-full min-h-0 flex-1 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900/80 flex flex-col">
      <iframe
        src="/refraction-by-lenses-simulator.html?v=9"
        title="Lens Refraction Simulator"
        className="flex-1 w-full min-h-0 border-0 rounded-xl"
        allow="fullscreen"
      />
    </div>
  );
}
