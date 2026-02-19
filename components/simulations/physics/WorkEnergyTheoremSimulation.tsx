"use client";

import React, { useState } from "react";

/**
 * Static educational diagram page for the Work-Energy Theorem.
 * Styled to match Chapter 1 expanded card: dark theme, glowing border, same layout.
 */
const DIAGRAM_SRC = "/images/work-energy-theorem.png";

export default function WorkEnergyTheoremSimulation() {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main card: Chapter 1 style – rounded-3xl, dark bg, glowing border */}
        <section className="rounded-3xl border border-neutral-800 bg-neutral-950/80 shadow-lg shadow-sky-900/20 transition-colors duration-300 ease-in-out hover:border-sky-500/50">
          {/* Title bar – inquiry question like "1. What is Physics?" */}
          <div className="flex w-full items-center justify-between gap-3 px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold text-white sm:text-xl">
                1. How does Net Work change an object&apos;s Kinetic Energy?
              </h1>
              <p className="mt-0.5 text-sm text-neutral-400">
                The Work-Energy Theorem
              </p>
            </div>
          </div>

          {/* Content area – border-t like Chapter 1 accordion body */}
          <div className="border-t border-neutral-800 px-6 pb-6 pt-4">
            {/* Diagram in a dark card */}
            <div className="mb-6">
              {imgError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-900/60 py-16 px-6 text-center">
                  <span className="text-5xl mb-3 text-neutral-500" aria-hidden>📐</span>
                  <p className="font-medium text-neutral-300">Work-Energy Theorem diagram</p>
                  <p className="text-sm text-neutral-500 mt-1">Image could not be loaded.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-sky-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
                  <img
                    src={DIAGRAM_SRC}
                    alt="The Work-Energy Theorem: before and after—block sliding to a stop on a rough surface, with initial and final kinetic energy and work done by friction."
                    className="w-full max-w-3xl h-auto mx-auto rounded-xl object-contain"
                    onError={() => setImgError(true)}
                  />
                </div>
              )}
            </div>

            {/* Theory – dark theme text */}
            <div className="space-y-6 text-neutral-200">
              <h2 className="text-base font-semibold text-white">
                Understanding the Work-Energy Theorem
              </h2>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-2">
                  The Principle
                </h3>
                <p className="mb-2 text-sm leading-relaxed text-neutral-300">
                  The Work-Energy Theorem states that the net work done on an object equals its change in kinetic energy.
                </p>
                <p className="font-mono text-sm bg-neutral-900/80 text-sky-200 px-4 py-3 rounded-lg border border-neutral-700">
                  W<sub>net</sub> = ΔKE = KE<sub>f</sub> − KE<sub>i</sub>
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-2">
                  Breakdown of the Diagram
                </h3>
                <ul className="space-y-2 list-none pl-0 text-sm text-neutral-300">
                  <li>
                    <strong className="text-white">Initial State:</strong> The block starts with velocity v<sub>i</sub>, giving it Initial Kinetic Energy (KE<sub>i</sub> = ½mv²). This is shown by the full energy bar on the left.
                  </li>
                  <li>
                    <strong className="text-white">The Work Done:</strong> As the block slides, Friction (f<sub>k</sub>) acts opposite to the motion. It does negative work (W = −f<sub>k</sub> · d), effectively draining energy from the system.
                  </li>
                  <li>
                    <strong className="text-white">Final State:</strong> When the block stops, its velocity is zero, meaning KE<sub>f</sub> = 0.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-2">
                  Conclusion
                </h3>
                <p className="text-sm leading-relaxed text-neutral-300">
                  The energy didn&apos;t disappear. The graphic shows that the Kinetic Energy lost is exactly equal to the Work done by friction (converted into heat and sound).
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
