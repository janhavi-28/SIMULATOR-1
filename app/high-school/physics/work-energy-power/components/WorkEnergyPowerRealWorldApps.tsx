"use client";

import React from "react";

const SIMULATOR_ID = "simulator";
const PULSE_DURATION_MS = 2200;
const PULSE_BOX_SHADOW = "0 0 0 2px rgba(34, 211, 238, 0.4), 0 0 24px -4px rgba(34, 211, 238, 0.2)";

function scrollToSimulatorAndPulse() {
  const el = document.getElementById(SIMULATOR_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const prev = (el as HTMLElement).style.boxShadow;
  (el as HTMLElement).style.boxShadow = PULSE_BOX_SHADOW;
  setTimeout(() => {
    (el as HTMLElement).style.boxShadow = prev;
  }, PULSE_DURATION_MS);
}

const APPS = [
  {
    id: "lifting-cranes",
    icon: "🏗️",
    title: "Lifting objects & cranes",
    description: "Cranes do work by applying an upward force over a vertical distance. The work done equals the force times the displacement in the direction of the force.",
    keyInsight: "Work = Force × displacement (W = F·s). Lifting the same mass higher requires more work.",
    cta: "Observe this in the simulator",
  },
  {
    id: "roller-coasters",
    icon: "🎢",
    title: "Roller coasters",
    description: "As the car climbs, kinetic energy converts to potential energy; as it drops, PE converts back to KE. Friction converts some mechanical energy to thermal.",
    keyInsight: "KE ↔ PE conversion; total mechanical energy is conserved when friction is small.",
    cta: "Try the Energy Conservation Lab",
  },
  {
    id: "hydroelectric",
    icon: "⚡",
    title: "Hydroelectric dams",
    description: "Water at height has gravitational PE; as it falls it gains KE, which turns turbines to generate electricity. Energy is conserved and transformed.",
    keyInsight: "Conservation of energy: PE (water high) → KE (flow) → electrical energy.",
    cta: "Explore KE and PE in the simulator",
  },
  {
    id: "appliances",
    icon: "🔌",
    title: "Electric appliances",
    description: "Power ratings (e.g. 100 W) tell you how much work (energy per second) the appliance uses. Same work in less time means higher power.",
    keyInsight: "Power = work done per second (P = W/t). Compare fast vs slow lift in the Power simulator.",
    cta: "Observe power in the simulator",
  },
] as const;

export default function WorkEnergyPowerRealWorldApps() {
  return (
    <section className="w-full mb-8" aria-labelledby="work-energy-realworld-heading">
      <h2 id="work-energy-realworld-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
        <span aria-hidden>🏠</span>
        <span>Real-world applications</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {APPS.map((app) => (
          <div
            key={app.id}
            className="group rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 flex flex-col gap-3 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-[0_0_20px_-4px_rgba(34,211,238,0.12)] hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <span
                className="text-2xl leading-none shrink-0 transition-[filter] duration-200 group-hover:brightness-110"
                aria-hidden
              >
                {app.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-sm">{app.title}</h3>
                <p className="text-xs text-neutral-400 leading-snug line-clamp-2 mt-1">
                  {app.description}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-cyan-300/70 leading-snug">
              <span className="font-medium text-cyan-300/80">Key insight:</span> {app.keyInsight}
            </p>
            <div className="mt-auto pt-0.5">
              <button
                type="button"
                onClick={scrollToSimulatorAndPulse}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-600 bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:text-cyan-200/90 hover:border-cyan-500/30 transition-colors duration-200"
              >
                <span aria-hidden>ℹ️</span>
                <span>{app.cta}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
