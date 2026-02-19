"use client";

import React, { useState } from "react";

const STEPS = [
  {
    id: 1,
    icon: "🔋",
    title: "Voltage as “push”",
    body: "Voltage is the push that drives charge. Higher V → more push.",
    cue: "V slider ↑ → current ↑",
  },
  {
    id: 2,
    icon: "🧱",
    title: "Resistance as “opposition”",
    body: "Resistance opposes flow. Higher R → less current for the same V.",
    cue: "R slider ↑ → current ↓",
  },
  {
    id: 3,
    icon: "⚡",
    title: "Current as “response”",
    body: "Current is the result: I = V/R. Same current through the whole loop.",
    cue: "Live value I = V/R",
  },
] as const;

export default function ElectricityConceptExplainer() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section className="w-full mb-8" aria-labelledby="concept-heading">
      <h2 id="concept-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
        <span aria-hidden>🔄</span>
        <span>How V, I and R interact</span>
      </h2>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 overflow-hidden">
        <div className="flex flex-col sm:flex-row min-h-0">
          <div className="sm:w-1/3 border-b sm:border-b-0 sm:border-r border-neutral-700 p-2 flex flex-col">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStep(s.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-all ${
                  activeStep === s.id
                    ? "bg-cyan-500/20 border border-cyan-500/40 text-white"
                    : "border border-transparent text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-200"
                }`}
              >
                <span className="text-sm font-semibold tabular-nums text-cyan-300/90">{s.id}</span>
                <span className="text-lg" aria-hidden>{s.icon}</span>
                <span className="text-sm font-medium truncate">{s.title}</span>
              </button>
            ))}
          </div>
          <div className="sm:w-2/3 p-4 flex flex-col justify-center">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={activeStep === s.id ? "block" : "hidden"}
              >
                <p className="text-sm text-neutral-300 leading-relaxed mb-2">{s.body}</p>
                <p className="text-xs font-medium text-cyan-300/90 border-l-2 border-cyan-500/50 pl-2">
                  {s.cue}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
