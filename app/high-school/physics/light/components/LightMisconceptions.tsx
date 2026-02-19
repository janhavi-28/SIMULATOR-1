"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "straight-line",
    headline: "Light always travels in straight lines",
    explanation: "Light travels in straight lines in a uniform medium; at an interface between two media it bends (refraction). In curved paths we use rays as approximations.",
    whyWrong: "Refraction and diffraction show that direction can change; rays are a model.",
    formula: "n₁ sin θ₁ = n₂ sin θ₂ (Snell's law)",
    hint: "In the simulator, change n₁ or n₂ to see the ray bend at the interface.",
  },
  {
    id: "image-behind-mirror",
    headline: "The image is \"behind\" the mirror",
    explanation: "The image is virtual: rays appear to come from behind the mirror but no light passes through that region. The image is located where the reflected rays (extended backward) meet.",
    whyWrong: "Virtual means the image position is where the brain interprets the rays coming from.",
    formula: "Plane mirror: |u| = |v|",
    hint: "In ray diagrams, extended reflected rays meet behind the mirror.",
  },
  {
    id: "magnification-size-only",
    headline: "Magnification is only about size",
    explanation: "Linear magnification m = hᵢ/h₀ gives size ratio; for mirrors and lenses, m = -v/u or m = v/u also tells you if the image is erect or inverted (sign of m).",
    whyWrong: "Magnification links size, orientation, and object/image distances.",
    formula: "m = hᵢ/h₀ = ±v/u",
    hint: "Use the lens formula and m to find image size and orientation.",
  },
] as const;

export default function LightMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="w-full mb-10 border-t border-neutral-800/80 pt-6" aria-labelledby="light-misconceptions-heading">
      <h2 id="light-misconceptions-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
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
          <strong className="text-cyan-200">Tip:</strong> In the simulator, vary the incident angle and n₁, n₂ to see Snell&apos;s law and total internal reflection.
        </p>
      </div>
    </section>
  );
}
