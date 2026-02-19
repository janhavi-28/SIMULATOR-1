"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "used-up",
    headline: "Current gets “used up” in a resistor",
    explanation: "Current is not used up; the same current enters and leaves. Energy is converted to heat (P = I²R).",
    whyWrong: "Charge is conserved; only energy is transformed.",
    formula: "I same everywhere in series",
    hint: "In the simulator, notice current stays the same throughout the loop.",
  },
  {
    id: "more-r-more-heat",
    headline: "Higher R always means more heating",
    explanation: "P = I²R — so if R goes up and I drops a lot (e.g. in series), power can decrease.",
    whyWrong: "Heating depends on both I and R, not R alone.",
    formula: "P = I²R",
    hint: "Try increasing R in the sim and watch P.",
  },
  {
    id: "voltage-at-point",
    headline: "Voltage is “at” a point",
    explanation: "Voltage is measured between two points (potential difference). Current is flow through a point.",
    whyWrong: "Potential difference requires two points; current is defined at a cross-section.",
    formula: "V = potential difference",
    hint: "In the sim, V is across the battery (and resistor).",
  },
] as const;

export default function ElectricityMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="w-full mb-10 border-t border-neutral-800/80 pt-6" aria-labelledby="misconceptions-heading">
      <h2 id="misconceptions-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
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
          <strong className="text-cyan-200">Tip:</strong> Use the sim: set V and R, then check that I = V/R and P = VI match the displayed values.
        </p>
      </div>
    </section>
  );
}
