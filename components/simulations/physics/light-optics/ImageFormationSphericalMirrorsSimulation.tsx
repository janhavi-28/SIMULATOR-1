"use client";

import React from "react";

/**
 * Spherical Mirror Simulator — redesigned with the Interactive Spherical Mirror Simulator HTML.
 * Embeds the exact standalone HTML (Orbitron + Space Mono, cyan/teal theme, canvas + controls).
 */
export default function ImageFormationSphericalMirrorsSimulation() {
  return (
    <div className="simulator-wrapper h-full min-h-[80vh] w-full rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900/80">
      <iframe
        src="/spherical-mirror-simulator.html?v=3"
        title="Interactive Spherical Mirror Simulator"
        className="w-full h-full min-h-[80vh] border-0 block"
        allow="fullscreen"
      />
    </div>
  );
}
