"use client";

import React, { useState } from "react";

const FORMULAS = [
  {
    id: "field-current",
    formula: "B ∝ I / r",
    icon: "🧲",
    short: "Magnetic field near a long straight conductor is proportional to current and inversely proportional to distance.",
    meaning: {
      B: "Magnetic field strength, in tesla (T)",
      I: "Current in the conductor, in ampere (A)",
      r: "Perpendicular distance from the wire, in m",
    },
    usedInSim: "Used in the current-carrying conductor simulator.",
  },
  {
    id: "force-motor",
    formula: "F = B I L",
    icon: "✋",
    short: "Force on a straight conductor of length L carrying current I in a field B (perpendicular).",
    meaning: {
      F: "Force on the conductor, in newton (N)",
      B: "Magnetic field strength, in T",
      I: "Current, in A",
      L: "Effective length of conductor in the field, in m",
    },
    usedInSim: "Shown live in the left-hand rule and motor simulators.",
  },
  {
    id: "emf-induction",
    formula: "ε ∝ dΦ/dt",
    icon: "⚡",
    short: "Induced emf is proportional to the rate of change of magnetic flux.",
    meaning: {
      "ε": "Induced emf, in volt (V)",
      "Φ": "Magnetic flux (B · A · cosθ), in weber (Wb)",
      "dΦ/dt": "Rate of change of flux linkage",
    },
    usedInSim: "Used in the electromagnetic induction and generator simulators.",
  },
] as const;

export default function MagnetismKeyFormulas() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <section className="w-full mb-8" aria-labelledby="magnetism-key-formulas-heading">
      <h2 id="magnetism-key-formulas-heading" className="text-xl font-semibold text-white mb-3">
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
                isHover
                  ? "border-cyan-400/50 shadow-[0_0_20px_-4px_rgba(59,130,246,0.5)]"
                  : "border-cyan-500/30"
              } ${isExpanded ? "bg-cyan-500/15 ring-1 ring-cyan-500/30" : "bg-cyan-500/5"}`}
            >
              <span
                className="text-lg opacity-80 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]"
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

