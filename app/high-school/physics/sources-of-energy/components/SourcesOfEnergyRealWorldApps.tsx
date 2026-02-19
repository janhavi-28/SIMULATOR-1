"use client";

import React from "react";

const SIMULATOR_ID = "simulator";
const PULSE_DURATION_MS = 2200;
const PULSE_BOX_SHADOW =
  "0 0 0 2px rgba(16,185,129,0.5), 0 0 24px -4px rgba(16,185,129,0.35)";

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
    id: "rooftop-solar",
    icon: "🏠",
    title: "Rooftop solar systems",
    description:
      "Homes and schools use photovoltaic panels to generate part of their electricity directly from sunlight.",
    keyInsight: "Local generation reduces grid demand and emissions; orientation and shading matter.",
    cta: "Try the solar energy simulator",
  },
  {
    id: "wind-farms",
    icon: "🌬️",
    title: "Wind farms",
    description:
      "Clusters of large wind turbines convert kinetic energy of the wind into electrical power fed into the grid.",
    keyInsight: "Total output depends strongly on average wind speed and turbine size.",
    cta: "Explore power vs wind speed in the wind simulator",
  },
  {
    id: "hydro-dams",
    icon: "🏞️",
    title: "Hydroelectric dams",
    description:
      "Water stored at height flows through turbines to generate electricity with high efficiency and low emissions.",
    keyInsight: "Gravitational potential energy of water is converted to electrical energy.",
    cta: "Relate to the renewable comparison simulator",
  },
  {
    id: "thermal-station",
    icon: "🏭",
    title: "Thermal power stations",
    description:
      "Large plants burn coal, oil, or gas to drive steam turbines and generators, supplying base-load electricity.",
    keyInsight: "Overall efficiency and emissions depend on each stage of the energy chain.",
    cta: "Adjust efficiencies in the thermal plant simulator",
  },
  {
    id: "biogas-rural",
    icon: "🌾",
    title: "Biogas in rural homes",
    description:
      "Small biogas plants turn animal dung and kitchen waste into methane-rich gas for cooking and lighting.",
    keyInsight: "Biogas plants manage waste and provide clean fuel at the same time.",
    cta: "Use the biogas simulator to see gas and energy output",
  },
] as const;

export default function SourcesOfEnergyRealWorldApps() {
  return (
    <section className="w-full mb-8" aria-labelledby="sources-realworld-heading">
      <h2
        id="sources-realworld-heading"
        className="text-xl font-semibold text-white mb-3 flex items-center gap-2"
      >
        <span aria-hidden>🏠</span>
        <span>Real-world applications</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {APPS.map((app) => (
          <div
            key={app.id}
            className="group rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 flex flex-col gap-3 transition-all duration-200 hover:border-emerald-500/40 hover:shadow-[0_0_22px_-4px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
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
            <p className="text-[11px] text-emerald-300/80 leading-snug">
              <span className="font-medium text-emerald-300">Key insight:</span> {app.keyInsight}
            </p>
            <div className="mt-auto pt-0.5">
              <button
                type="button"
                onClick={scrollToSimulatorAndPulse}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-600 bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:text-emerald-200/90 hover:border-emerald-500/40 transition-colors duration-200"
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

