"use client";

import React from "react";

const SIMULATOR_ID = "simulator";
const PULSE_DURATION_MS = 2200;
const PULSE_BOX_SHADOW =
  "0 0 0 2px rgba(34, 211, 238, 0.4), 0 0 24px -4px rgba(34, 211, 238, 0.2)";

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
    id: "fridge-ac",
    icon: "🧊",
    title: "Refrigerators & air conditioners",
    description:
      "Cooling systems use evaporation and condensation cycles with latent heat to move energy from inside to outside.",
    keyInsight: "Latent heat of vaporisation lets refrigerants absorb large amounts of energy at nearly constant temperature.",
    cta: "Relate this to the latent heat simulator",
  },
  {
    id: "ships",
    icon: "🚢",
    title: "Floating ships",
    description:
      "Huge ships made of dense metal float because their average density (with air-filled hulls) is less than water.",
    keyInsight: "Floating depends on overall density and buoyant force, not just on mass.",
    cta: "Explore this in the density simulator",
  },
  {
    id: "hot-air-balloon",
    icon: "🎈",
    title: "Hot air balloons",
    description:
      "Heating the air inside the balloon lowers its density compared to surrounding cool air, producing an upward buoyant force.",
    keyInsight: "Less dense hot air displaces denser cool air, creating upthrust.",
    cta: "Connect with density & states of matter",
  },
  {
    id: "sweating",
    icon: "💦",
    title: "Sweating as cooling",
    description:
      "Sweat absorbs latent heat from your skin as it evaporates, lowering skin temperature and cooling the body.",
    keyInsight: "Evaporation removes high-energy particles and carries away energy as latent heat.",
    cta: "Observe surface escape in the evaporation simulator",
  },
  {
    id: "lpg",
    icon: "🛢️",
    title: "LPG cylinders",
    description:
      "Liquefied petroleum gas (LPG) is stored as a liquid under pressure; when released, it vaporises and cools the surroundings.",
    keyInsight: "High latent heat and pressure control allow large amounts of gas in small volume.",
    cta: "Relate to change of state and latent heat",
  },
] as const;

export default function MatterDensityStatesRealWorldApps() {
  return (
    <section
      className="w-full mb-8"
      aria-labelledby="matter-realworld-heading"
    >
      <h2
        id="matter-realworld-heading"
        className="text-xl font-semibold text-white mb-3 flex items-center gap-2"
      >
        <span aria-hidden>🏠</span>
        <span>Real-world applications</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

