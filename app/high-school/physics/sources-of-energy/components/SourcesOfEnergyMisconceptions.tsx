"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "renewables-infinite",
    headline: "Renewable sources provide infinite energy without limits",
    explanation:
      "Renewable sources like sun, wind, and rivers are replenished by nature, but their usable power is still limited by location, time of day, weather, and technology. Overusing biomass or building too many dams can also have environmental impacts.",
    whyWrong:
      "Renewable does not mean unlimited at any one place or time; there are physical, environmental, and technological limits.",
    formula: "P_out ≈ η × (available resource power)",
    hint: "In the renewable simulator, see how output saturates and depends on intensity and efficiency.",
  },
  {
    id: "boiling-only-evap",
    headline: "Evaporation (and cooling) only happen at the boiling point",
    explanation:
      "Evaporation occurs at all temperatures below boiling: some high-energy molecules at the surface escape, causing cooling of the remaining liquid. Boiling is a rapid bulk process at the boiling point, but everyday drying and sweating rely on evaporation below boiling.",
    whyWrong:
      "Everyday examples like drying clothes and sweating show evaporation below 100 °C; power use and cooling depend on rate, not on reaching boiling.",
    formula: "Cooling power ≈ ṁ · L (latent heat transfer rate)",
    hint: "In the evaporation or solar simulators, note how energy removal still happens below boiling.",
  },
  {
    id: "efficiency-100",
    headline: "Power plants and devices can be 100% efficient",
    explanation:
      "In real systems, some energy is always lost as waste heat, sound, friction, or other forms. Even very good power plants and motors have efficiencies less than 100%. Claiming 100% efficiency would violate energy conservation.",
    whyWrong:
      "No real process is perfectly reversible; there are unavoidable losses. Efficiencies above 100% are physically impossible.",
    formula: "η = (useful output power / input power) × 100%  < 100%",
    hint: "Adjust stage efficiencies in the thermal power plant simulator and see how overall η stays below 100%.",
  },
  {
    id: "solar-no-output-cloudy",
    headline: "Solar panels produce no electricity on cloudy days",
    explanation:
      "Clouds reduce the intensity of sunlight but do not block it completely. Solar panels still produce power under diffuse light, just at a lower level than in full sun.",
    whyWrong:
      "Assuming zero output under clouds ignores diffuse radiation; design and storage must account for variable, not absent, output.",
    formula: "P ≈ η A I  (I reduced but not zero on cloudy days)",
    hint: "In the solar simulator, reduce intensity to see that power decreases but does not drop to zero.",
  },
] as const;

export default function SourcesOfEnergyMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section
      className="w-full mb-10 border-t border-neutral-800/80 pt-6"
      aria-labelledby="sources-misconceptions-heading"
    >
      <h2
        id="sources-misconceptions-heading"
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
                    className="mx-3 mb-3 rounded-lg border border-emerald-500/30 p-3 text-sm"
                    style={{
                      background: "linear-gradient(180deg, #064E3B 0%, #022C22 100%)",
                      boxShadow: "inset 0 0 24px -8px rgba(16,185,129,0.25)",
                    }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-emerald-300 shrink-0 font-medium" aria-hidden>
                        ✅
                      </span>
                      <p className="text-neutral-200 text-xs leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                    {item.whyWrong && (
                      <p className="text-[11px] text-neutral-300 pl-5 mb-2">
                        📘 {item.whyWrong}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-emerald-200 pl-5 mb-2">
                      🔢 {item.formula}
                    </p>
                    <p className="text-[11px] text-emerald-200/80 italic pl-5">
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

