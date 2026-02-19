"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "heavier-falls",
    headline: "Heavier objects fall faster",
    explanation: "In the absence of air resistance, all objects fall with the same acceleration g. Mass does not affect the rate of fall.",
    whyWrong: "F = ma implies a = F/m; greater weight is cancelled by greater mass.",
    formula: "a = g (same for all)",
    hint: "In the simulator, acceleration is set independently of mass.",
  },
  {
    id: "force-to-move",
    headline: "A force is needed to keep an object moving",
    explanation: "Newton's first law: an object stays at rest or uniform motion unless acted on by a net force. No force is needed to maintain constant velocity.",
    whyWrong: "Friction is what slows things down; in the absence of friction, motion continues.",
    formula: "F = 0 ⇒ constant v",
    hint: "Set acceleration to zero in the sim to see constant velocity.",
  },
  {
    id: "deceleration-negative",
    headline: "Deceleration means negative acceleration",
    explanation: "Deceleration is acceleration that opposes velocity (object slows down). In one dimension with positive velocity, deceleration has a negative sign.",
    whyWrong: "Deceleration is a matter of direction relative to velocity, not a separate quantity.",
    formula: "a opposite to v ⇒ speed decreases",
    hint: "In the sim, negative acceleration reduces speed.",
  },
] as const;

export default function MotionMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="w-full mb-10 border-t border-neutral-800/80 pt-6" aria-labelledby="motion-misconceptions-heading">
      <h2 id="motion-misconceptions-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
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
          <strong className="text-cyan-200">Tip:</strong> In the simulator, set u and a then launch; check that the speed–time graph matches v = u + at.
        </p>
      </div>
    </section>
  );
}
