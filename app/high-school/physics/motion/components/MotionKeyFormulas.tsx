"use client";

import React, { useState } from "react";

const FORMULAS = [
  {
    id: "vuat",
    formula: "v = u + at",
    icon: "📐",
    short: "Final velocity: initial velocity plus acceleration times time.",
    meaning: {
      v: "Final velocity, in m/s",
      u: "Initial velocity, in m/s",
      a: "Acceleration, in m/s²",
      t: "Time, in s",
    },
    usedInSim: "Initial velocity and acceleration sliders → speed–time graph",
  },
  {
    id: "sut",
    formula: "s = ut + ½at²",
    icon: "📏",
    short: "Displacement: initial velocity times time plus half acceleration times time squared.",
    meaning: {
      s: "Displacement, in m",
      u: "Initial velocity, in m/s",
      t: "Time, in s",
      a: "Acceleration, in m/s²",
    },
    usedInSim: "Distance and displacement from the graph",
  },
  {
    id: "fma",
    formula: "F = ma",
    icon: "⚡",
    short: "Newton's second law: force equals mass times acceleration.",
    meaning: {
      F: "Force, in newtons (N)",
      m: "Mass, in kg",
      a: "Acceleration, in m/s²",
    },
    usedInSim: "Acceleration in the sim relates to net force conceptually.",
  },
] as const;

export default function MotionKeyFormulas() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <section className="w-full mb-8" aria-labelledby="motion-key-formulas-heading">
      <h2 id="motion-key-formulas-heading" className="text-xl font-semibold text-white mb-3">
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
              <span className="text-lg opacity-80 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]" aria-hidden>
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
