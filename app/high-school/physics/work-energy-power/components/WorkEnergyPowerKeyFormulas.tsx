"use client";

import React, { useState } from "react";

const FORMULAS = [
  {
    id: "wfs",
    formula: "W = F·s",
    icon: "🧱",
    short: "Work done when a force causes displacement.",
    meaning: {
      W: "Work, in joules (J)",
      F: "Force, in newtons (N)",
      s: "Displacement in direction of force (m)",
    },
    usedInSim: "Force and displacement sliders → Work display",
  },
  {
    id: "ke",
    formula: "KE = ½mv²",
    icon: "🏃",
    short: "Kinetic energy: energy of motion.",
    meaning: {
      KE: "Kinetic energy (J)",
      m: "Mass (kg)",
      v: "Speed (m/s)",
    },
    usedInSim: "Mass and speed → KE bars",
  },
  {
    id: "pe",
    formula: "PE = mgh",
    icon: "🪜",
    short: "Gravitational potential energy.",
    meaning: {
      PE: "Potential energy (J)",
      m: "Mass (kg)",
      g: "Gravitational field strength (N/kg)",
      h: "Height (m)",
    },
    usedInSim: "Height and mass → PE",
  },
  {
    id: "pwt",
    formula: "P = W/t",
    icon: "🔌",
    short: "Power: rate of doing work.",
    meaning: {
      P: "Power (W)",
      W: "Work done (J)",
      t: "Time (s)",
    },
    usedInSim: "Same work, different time → Power comparison",
  },
] as const;

export default function WorkEnergyPowerKeyFormulas() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <section className="w-full mb-8" aria-labelledby="key-formulas-heading">
      <h2 id="key-formulas-heading" className="text-xl font-semibold text-white mb-3">
        Key formulas
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FORMULAS.map((f) => {
          const isExpanded = expandedId === f.id;
          const isHover = hoverId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : f.id)}
              onMouseEnter={() => setHoverId(f.id)}
              onMouseLeave={() => setHoverId(null)}
              className={`rounded-xl border p-4 flex flex-col gap-2 text-left transition-all duration-200 ${
                isHover ? "border-cyan-400/50 shadow-[0_0_20px_-4px_rgba(34,211,238,0.2)]" : "border-cyan-500/30"
              } ${isExpanded ? "bg-cyan-500/15 ring-1 ring-cyan-500/30" : "bg-cyan-500/5"}`}
            >
              <span className="text-lg opacity-80" aria-hidden>{f.icon}</span>
              <div className="text-xl font-bold font-mono text-cyan-200 tracking-tight text-center">
                {f.formula}
              </div>
              <p className="text-xs text-neutral-400 line-clamp-2">{f.short}</p>
              <span className="text-[10px] font-medium text-cyan-300/80 uppercase tracking-wider">
                {isExpanded ? "Hide meaning" : "Show meaning"}
              </span>
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-cyan-500/20 space-y-1.5">
                  {Object.entries(f.meaning).map(([sym, desc]) => (
                    <div key={sym} className="text-xs text-neutral-300">
                      <strong className="text-cyan-200 font-mono">{sym}</strong> — {desc}
                    </div>
                  ))}
                  <p className="text-[11px] text-cyan-300/90 italic pt-1">{f.usedInSim}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
