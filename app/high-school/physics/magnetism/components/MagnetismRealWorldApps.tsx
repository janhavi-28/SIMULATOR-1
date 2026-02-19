"use client";

import React from "react";

const SIMULATOR_ID = "simulator";
const PULSE_DURATION_MS = 2200;
const PULSE_BOX_SHADOW =
  "0 0 0 2px rgba(59,130,246,0.5), 0 0 24px -4px rgba(59,130,246,0.35)";

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
    id: "mri",
    icon: "🧠",
    title: "MRI machines",
    description:
      "Magnetic Resonance Imaging uses strong, highly uniform magnetic fields and changing radio-frequency fields to image the body.",
    keyInsight: "Precise magnetic fields and induction in nuclei are central to MRI.",
    cta: "Relate this to field uniformity and induction",
  },
  {
    id: "electric-train",
    icon: "🚆",
    title: "Electric trains",
    description:
      "Powerful electric motors drive trains; during braking, the same motors can act as generators (regenerative braking).",
    keyInsight: "Motor and generator are inverse processes based on the same principles.",
    cta: "Compare motor and generator simulators",
  },
  {
    id: "transformer",
    icon: "🔁",
    title: "Transformers",
    description:
      "Transformers use changing magnetic flux in iron cores to step up or step down AC voltages efficiently.",
    keyInsight: "Electromagnetic induction in coupled coils; EMF ∝ N·dΦ/dt.",
    cta: "Connect with the induction simulator",
  },
  {
    id: "loudspeaker",
    icon: "📢",
    title: "Loudspeakers",
    description:
      "A current in a voice coil in a magnetic field produces a force on the coil, moving the speaker cone and creating sound.",
    keyInsight: "Force on current-carrying conductor (F = BIL) produces mechanical vibration.",
    cta: "Relate to the motor and left-hand rule simulators",
  },
  {
    id: "induction-cooktop",
    icon: "🍳",
    title: "Induction cooktops",
    description:
      "Rapidly changing magnetic fields induce eddy currents in metal cookware, heating it directly.",
    keyInsight: "Changing magnetic flux induces currents that dissipate energy as heat.",
    cta: "Connect with electromagnetic induction",
  },
  {
    id: "wind-turbine",
    icon: "🌬️",
    title: "Wind turbines",
    description:
      "Turbines spin generator rotors in magnetic fields to produce electricity from wind energy.",
    keyInsight: "Mechanical rotation → changing flux → AC generation.",
    cta: "Explore the generator simulator",
  },
] as const;

export default function MagnetismRealWorldApps() {
  return (
    <section className="w-full mb-8" aria-labelledby="magnetism-realworld-heading">
      <h2
        id="magnetism-realworld-heading"
        className="text-xl font-semibold text-white mb-3 flex items-center gap-2"
      >
        <span aria-hidden>🏠</span>
        <span>Real-world applications</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {APPS.map((app) => (
          <div
            key={app.id}
            className="group rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 flex flex-col gap-3 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-[0_0_22px_-4px_rgba(56,189,248,0.4)] hover:-translate-y-0.5"
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-600 bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:text-cyan-200/90 hover:border-cyan-500/40 transition-colors duration-200"
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

