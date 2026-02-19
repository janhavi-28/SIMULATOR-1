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
    id: "sonar",
    icon: "🚢",
    title: "SONAR and submarines",
    description: "Ships and submarines send sound pulses and measure the time for echoes to return from objects or the sea floor.",
    keyInsight: "Distance = (speed of sound × time delay) / 2; reflection of sound and echo delay.",
    cta: "Observe this in the simulator",
  },
  {
    id: "ultrasound",
    icon: "🏥",
    title: "Medical ultrasound",
    description: "High-frequency sound (above human hearing) reflects off tissues; the echoes are used to build images of organs and fetuses.",
    keyInsight: "Reflection at boundaries and v = fλ; different tissues reflect differently.",
    cta: "Try Reflection of Sound sim",
  },
  {
    id: "concert-hall",
    icon: "🎭",
    title: "Concert hall acoustics",
    description: "Designers control reflection, echo, and reverberation so that sound is clear but not too dry or too muddy.",
    keyInsight: "Echo vs reverberation; materials and shapes affect reflection and absorption.",
    cta: "Explore Echo & Reverberation",
  },
  {
    id: "noise-pollution",
    icon: "🔇",
    title: "Noise pollution control",
    description: "Barriers and absorbers reduce reflected sound; understanding frequency and intensity helps design quieter spaces.",
    keyInsight: "Absorption and reflection; loudness (amplitude) and frequency matter for perception.",
    cta: "See Amplitude and Reflection sims",
  },
  {
    id: "echolocation",
    icon: "🦇",
    title: "Bats and echolocation",
    description: "Bats emit ultrasonic pulses and use the returning echoes to locate prey and avoid obstacles in the dark.",
    keyInsight: "Reflection of sound and echo delay; v = fλ for the emitted wavelength.",
    cta: "Observe this in the simulator",
  },
] as const;

export default function SoundRealWorldApps() {
  return (
    <section className="w-full mb-8" aria-labelledby="sound-realworld-heading">
      <h2 id="sound-realworld-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
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
