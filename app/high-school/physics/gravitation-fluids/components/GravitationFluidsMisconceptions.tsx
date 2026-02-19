"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "heavier-falls",
    headline: "Heavier objects fall faster",
    explanation: "In the absence of air resistance, all objects fall with the same acceleration g. Weight is greater for heavier objects, but so is mass (F = ma ⇒ a = F/m = mg/m = g).",
    whyWrong: "Greater force is offset by greater mass; acceleration is the same.",
    formula: "a = g for all (in vacuum)",
    hint: "In the gravity simulator, acceleration does not depend on the mass of the falling body.",
  },
  {
    id: "mass-weight-same",
    headline: "Mass and weight are the same",
    explanation: "Mass is the amount of matter (kg), a scalar. Weight is the force due to gravity (N), W = mg. On the Moon, your mass is unchanged but your weight is less because g is smaller.",
    whyWrong: "Mass is intrinsic; weight depends on the gravitational field.",
    formula: "W = mg",
    hint: "Weigh yourself on Earth vs (conceptually) on the Moon.",
  },
  {
    id: "pressure-volume",
    headline: "Pressure depends only on volume of fluid",
    explanation: "Pressure in a fluid at rest depends on depth and density (P = hρg), not on the total volume of the container. A tall thin column and a wide shallow pool can have different pressures at the bottom for the same volume.",
    whyWrong: "Pressure at a point depends on depth h and ρ, not total volume.",
    formula: "P = hρg",
    hint: "Pressure at the bottom of a dam is due to depth, not how much water is behind it.",
  },
  {
    id: "float-light",
    headline: "Objects float because they are light",
    explanation: "Objects float when the buoyant force (upthrust) equals their weight. A ship floats because it displaces a large volume of water; the weight of that displaced water equals the ship's weight. Density (mass per volume) matters: if average density of object is less than fluid, it floats.",
    whyWrong: "Floating depends on weight vs upthrust (Archimedes), not just being \"light\".",
    formula: "Upthrust = weight of displaced fluid",
    hint: "A heavy ship floats; a small heavy stone sinks.",
  },
] as const;

export default function GravitationFluidsMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="w-full mb-10 border-t border-neutral-800/80 pt-6" aria-labelledby="gravitation-misconceptions-heading">
      <h2 id="gravitation-misconceptions-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
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
          <strong className="text-cyan-200">Tip:</strong> Use the gravity simulator to see how force and motion depend on mass and distance; compare with the formulas above.
        </p>
      </div>
    </section>
  );
}
