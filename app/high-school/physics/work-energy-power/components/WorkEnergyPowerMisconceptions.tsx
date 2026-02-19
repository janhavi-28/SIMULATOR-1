"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "work-distance",
    headline: "Work is done only when an object moves a long distance",
    explanation:
      "Work depends on both force and displacement in the direction of the force: W = F·s (or F s cos θ). A small force over a long distance can do the same work as a large force over a short distance. No work is done when the force is perpendicular to the displacement.",
    whyWrong: "Distance alone does not define work; the force component along the displacement matters.",
    formula: "W = F·s or W = F s cos θ",
    hint: "In the simulator, change force and displacement to see how work updates.",
  },
  {
    id: "energy-used-up",
    headline: "Energy gets used up when work is done",
    explanation:
      "Energy is conserved: it is transferred or transformed, not destroyed. When work is done, energy moves from one form or object to another (e.g. kinetic to potential, or mechanical to thermal due to friction). The total energy of an isolated system stays constant.",
    whyWrong: "Energy changes form; it does not disappear. Thermal energy is still energy.",
    formula: "Conservation of energy: ΔKE + ΔPE + ΔE_other = 0",
    hint: "Toggle friction in the Conservation Lab and watch total energy.",
  },
  {
    id: "heavier-more-ke",
    headline: "Heavier objects always have more kinetic energy",
    explanation:
      "KE = ½mv² depends on both mass and speed. At the same speed, a heavier object does have more KE. But at different speeds, a lighter object can have more KE if it is much faster. Doubling speed quadruples KE; doubling mass only doubles KE.",
    whyWrong: "KE depends on mass and on the square of speed—so speed has a larger effect.",
    formula: "KE = ½mv²",
    hint: "Compare different masses and speeds in the Speed vs KE simulator.",
  },
  {
    id: "pe-height-only",
    headline: "Potential energy depends only on height, not mass",
    explanation:
      "Gravitational potential energy is PE = mgh: it depends on mass m, gravitational field strength g, and height h. Doubling the mass doubles the PE for the same height. Doubling the height also doubles the PE for the same mass.",
    whyWrong: "PE is proportional to both mass and height.",
    formula: "PE = mgh",
    hint: "Lift different masses to the same height in the Height & PE simulator.",
  },
] as const;

export default function WorkEnergyPowerMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="w-full mb-10 border-t border-neutral-800/80 pt-6" aria-labelledby="work-energy-misconceptions-heading">
      <h2 id="work-energy-misconceptions-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
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
                      background: "linear-gradient(180deg, #0F2E33 0%, #0B2226 100%)",
                      boxShadow: "inset 0 0 24px -8px rgba(34, 211, 238, 0.08)",
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
      <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs sm:text-sm text-neutral-100 flex items-start gap-2">
        <span aria-hidden>💡</span>
        <p className="m-0">
          <strong className="text-cyan-200">Tip:</strong> Use the simulators above to explore work (W = F·s), KE and PE, conservation of energy, and power (P = W/t).
        </p>
      </div>
    </section>
  );
}
