"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "lines-real",
    headline: "Magnetic field lines are real physical lines",
    explanation:
      "Magnetic field lines are not physical wires or strings; they are imaginary curves we draw to represent the direction and strength of the field. The field exists everywhere in space, even where we do not draw lines, and lines are closer where the field is stronger.",
    whyWrong:
      "Thinking of field lines as objects can lead to confusion. They are a visual tool; only the underlying field and its effects on magnets and currents are physical.",
    formula: "Field strength ∝ density of field lines",
    hint: "In the field-line simulators, change magnet strength and see how line density changes.",
  },
  {
    id: "current-direction",
    headline: "Current \"actually\" flows from negative to positive so conventional direction is wrong",
    explanation:
      "In circuits, electrons drift from negative to positive, but we define conventional current direction from positive to negative. All right-hand/left-hand rules and formulas are based on conventional current; it is just a consistent sign convention.",
    whyWrong:
      "Mixing electron flow with conventional current can flip directions incorrectly. Use conventional current for rules and diagrams.",
    formula: "Use I (conventional current) for F = B I L and right/left-hand rules.",
    hint: "In the conductor and motor simulators, arrows show conventional current direction.",
  },
  {
    id: "field-uniform",
    headline: "Magnetic field is the same everywhere around a magnet",
    explanation:
      "For a bar magnet, the field is strongest near the poles and weakens rapidly with distance. Field lines spread out as you move away. Only between special pole shapes can we approximate a small region as uniform.",
    whyWrong:
      "Assuming uniform field everywhere gives wrong forces and torques. Real fields vary in magnitude and direction.",
    formula: "Approx. near a straight conductor: B ∝ I / r",
    hint: "Move the probe in the bar magnet and current simulators to see how |B| changes with r.",
  },
  {
    id: "generator-from-nothing",
    headline: "A generator creates electricity from nothing",
    explanation:
      "An electric generator converts mechanical energy (from moving water, wind, steam turbines, etc.) into electrical energy. The induced emf and current always come from changing magnetic flux due to mechanical work.",
    whyWrong:
      "Energy is conserved: generators transform energy from one form to another, they do not create energy.",
    formula: "Electrical power out ≈ mechanical power in (minus losses)",
    hint: "In the generator simulator, increasing rotation speed (more mechanical power) increases induced emf and electrical output.",
  },
] as const;

export default function MagnetismMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section
      className="w-full mb-10 border-t border-neutral-800/80 pt-6"
      aria-labelledby="magnetism-misconceptions-heading"
    >
      <h2
        id="magnetism-misconceptions-heading"
        className="text-xl font-semibold text-white mb-3 flex items-center gap-2"
      >
        <span aria-hidden>⚠️</span>
        <span>Common misconceptions &amp; tips</span>
      </h2>
      <ul className="space-y-3">
        {ITEMS.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <li key={item.id}>
              <div
                className={`rounded-xl border border-neutral-700 bg-neutral-800/60 overflow-hidden transition-[border-color,box-shadow] duration-200 ${
                  isExpanded ? "border-neutral-600" : "hover:border-neutral-600"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full flex items-center gap-2 p-3 text-left transition-colors duration-200 hover:bg-neutral-800/40"
                >
                  <span
                    className={`shrink-0 text-base transition-opacity duration-200 ${
                      isExpanded ? "opacity-50" : "opacity-100"
                    }`}
                    aria-hidden
                  >
                    ❌
                  </span>
                  <span className="font-medium text-neutral-200 text-sm flex-1">
                    {item.headline}
                  </span>
                  <span className="text-xs text-neutral-500 shrink-0">
                    {isExpanded ? "Hide" : "Show correct"}
                  </span>
                </button>
                <div
                  className="transition-all duration-[250ms] ease-out"
                  style={{
                    maxHeight: isExpanded ? 320 : 0,
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div
                    className="mx-3 mb-3 rounded-lg border border-cyan-500/30 p-3 text-sm"
                    style={{
                      background: "linear-gradient(180deg, #0F172A 0%, #020617 100%)",
                      boxShadow: "inset 0 0 24px -8px rgba(59,130,246,0.25)",
                    }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-cyan-300 shrink-0 font-medium" aria-hidden>
                        ✅
                      </span>
                      <p className="text-neutral-200 text-xs leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                    {item.whyWrong && (
                      <p className="text-[11px] text-neutral-400 pl-5 mb-2">
                        📘 {item.whyWrong}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-cyan-300/95 pl-5 mb-2">
                      🔢 {item.formula}
                    </p>
                    <p className="text-[11px] text-cyan-200/80 italic pl-5">
                      🧪 {item.hint}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

