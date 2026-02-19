"use client";

import React, { useState } from "react";

const FORMULAS = [
  {
    id: "density",
    formula: "ρ = m / V",
    icon: "⚖️",
    short: "Density: mass per unit volume. Explains floating and sinking.",
    meaning: {
      "ρ": "Density, in kg/m³",
      m: "Mass, in kg",
      V: "Volume, in m³",
    },
    usedInSim: "Used in the density & buoyancy simulator.",
  },
  {
    id: "latent",
    formula: "Q = mL",
    icon: "🔥",
    short: "Latent heat: energy for change of state at constant temperature.",
    meaning: {
      Q: "Heat energy, in J (or kJ)",
      m: "Mass of substance, in kg",
      L: "Specific latent heat, in J/kg",
    },
    usedInSim: "Shown live in the latent heat simulator.",
  },
  {
    id: "heat",
    formula: "Q = mcΔT",
    icon: "🌡️",
    short: "Heat energy to change temperature without changing state.",
    meaning: {
      Q: "Heat energy, in J",
      m: "Mass, in kg",
      c: "Specific heat capacity, in J/(kg·K)",
      "ΔT": "Temperature change, in K or °C",
    },
    usedInSim: "Relates to the heating-curve (change of state) simulator.",
  },
] as const;

export default function MatterDensityStatesKeyFormulas() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <section className="w-full mb-8" aria-labelledby="matter-key-formulas-heading">
      <h2 id="matter-key-formulas-heading" className="text-xl font-semibold text-white mb-3">
        Key formulas
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <span
                className="text-lg opacity-80 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]"
                aria-hidden
              >
                {f.icon}
              </span>
              <div className="text-2xl font-bold font-mono text-cyan-200 tracking-tight text-center">
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

