"use client";

import React, { useState } from "react";

const ITEMS = [
  {
    id: "sound-vacuum",
    headline: "Sound travels in vacuum",
    explanation:
      "Sound is a mechanical wave and requires a medium (solid, liquid, or gas) to travel. In vacuum there are no particles to vibrate, so sound cannot propagate. That is why we cannot hear the Sun or explosions in space in sci‑fi the way we would in air.",
    whyWrong: "Mechanical waves need a material medium; only electromagnetic waves (e.g. light) can travel through vacuum.",
    formula: "Sound needs a medium; v = 0 in vacuum.",
    hint: "In the Nature of Sound sim, switch medium to see how sound propagates in solid, liquid, gas—but not in vacuum.",
  },
  {
    id: "louder-faster",
    headline: "Louder sound travels faster",
    explanation:
      "The speed of sound in a medium depends on the properties of the medium (and, in gases, on temperature), not on loudness or amplitude. A loud and a quiet sound of the same frequency travel at the same speed in the same conditions.",
    whyWrong: "Loudness is related to amplitude (energy), not to wave speed.",
    formula: "v depends on medium and T (for gases); v ≠ f(amplitude).",
    hint: "In Speed of Sound sim, change medium and temperature—not loudness—to change v.",
  },
  {
    id: "frequency-loudness",
    headline: "Frequency affects loudness",
    explanation:
      "Frequency determines pitch (high f = high pitch), not loudness. Loudness is related to amplitude and intensity (energy per unit area per second). You can have a loud low note or a quiet high note.",
    whyWrong: "Frequency → pitch; amplitude/intensity → loudness.",
    formula: "Pitch ∝ f; loudness ∝ amplitude² (intensity).",
    hint: "In the Amplitude sim, change amplitude to see loudness; in Frequency sim, change f for pitch.",
  },
  {
    id: "echo-reverb-same",
    headline: "Echo and reverberation are the same",
    explanation:
      "An echo is a distinct, delayed repetition of a sound when it reflects off a distant surface (delay ≥ ~0.1 s). Reverberation is the persistence of sound in a space due to many overlapping reflections—the sound \"lingers\" rather than producing a clear second copy. Both involve reflection, but echo is one clear repeat; reverberation is diffuse continuation.",
    whyWrong: "Echo = distinct delayed reflection; reverberation = many overlapping reflections.",
    formula: "Echo: delay t = 2d/v; reverb: many reflections in a room.",
    hint: "In Echo & Reverberation sim, increase distance to see echo delay; in a room, many walls cause reverb.",
  },
] as const;

export default function SoundMisconceptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="w-full mb-10 border-t border-neutral-800/80 pt-6" aria-labelledby="sound-misconceptions-heading">
      <h2 id="sound-misconceptions-heading" className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
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
          <strong className="text-cyan-200">Tip:</strong> Use the simulators to explore medium, frequency, amplitude, speed, and echo delay—and to correct these misconceptions.
        </p>
      </div>
    </section>
  );
}
