"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "heavier-always-sink",
    headline: "Heavier objects always sink",
    explanation:
      "Floating or sinking depends on density, not just weight. A large, heavy ship floats because its overall density (including the air in it) is less than that of water. A small solid metal ball sinks because its density is greater than water’s.",
    whyWrong: "Mass alone does not decide floating; average density and displaced fluid (upthrust) matter.",
    formula: "ρ = m / V and upthrust = weight of displaced fluid",
    hint: "In the density simulator, change mass and volume together and compare with fluid density.",
  },
  {
    id: "gas-no-mass",
    headline: "Gas has no mass",
    explanation:
      "Gases are made of particles with mass. A balloon filled with air is heavier than when it is empty. Gas may be low density, but its particles still have mass and can exert pressure and weight.",
    whyWrong: "Low density is not the same as zero mass; gas particles have mass and contribute to weight.",
    formula: "ρ_gas = m_gas / V (small but not zero)",
    hint: "Think about the mass of a gas cylinder when full vs empty.",
  },
  {
    id: "temp-rises-boiling",
    headline: "Temperature rises during boiling",
    explanation:
      "At the boiling point, the temperature of a pure liquid remains nearly constant while it boils. Energy supplied goes into breaking intermolecular bonds (latent heat of vaporisation), not into raising the temperature.",
    whyWrong: "During boiling, added energy changes the state, not the temperature.",
    formula: "Q = mL_v at (nearly) constant T",
    hint: "On the heating-curve simulator, the flat region at boiling shows constant temperature.",
  },
  {
    id: "evap-only-boiling",
    headline: "Evaporation happens only at boiling point",
    explanation:
      "Evaporation occurs at all temperatures. At the surface, some high-energy molecules escape into the air even when the bulk liquid is below its boiling point. Boiling is a rapid bulk process; evaporation is slower and surface-based.",
    whyWrong: "Evaporation is a surface phenomenon that can occur at any temperature.",
    formula: "Rate of evaporation ↑ with temperature, surface area, and wind; ↓ with humidity",
    hint: "In the evaporation simulator, evaporation occurs even below the boiling temperature.",
  },
] as const;

export default function MatterDensityStatesMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section
      className="w-full mb-10 border-t border-neutral-800/80 pt-6"
      aria-labelledby="matter-misconceptions-heading"
    >
      <h2
        id="matter-misconceptions-heading"
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
          <strong className="text-cyan-200">Tip:</strong> Use the simulators above to test your
          intuition about density, phase changes, latent heat, and evaporation.
        </p>
      </div>
    </section>
  );
}

