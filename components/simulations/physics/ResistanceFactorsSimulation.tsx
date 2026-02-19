"use client";

import React, { useMemo, useState } from "react";

// R = ρ L / A. ρ in Ω·m, L in m, A in m². Use scale: L 0.1–10 m, A 0.1–5 mm² = 1e-7 to 5e-6 m², ρ 1e-8 to 1e-5.
export default function ResistanceFactorsSimulation() {
  const [resistivity, setResistivity] = useState(1.7e-8); // copper ~1.7e-8
  const [length, setLength] = useState(2);
  const [area, setArea] = useState(0.5); // mm²

  const areaM2 = useMemo(() => area * 1e-6, [area]);
  const R = useMemo(() => (areaM2 > 0 ? (resistivity * length) / areaM2 : 0), [resistivity, length, areaM2]);

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden">
      <div className="px-3 py-2 border-b border-neutral-700">
        <span className="text-sm font-medium text-neutral-200">Factors affecting resistance: R = ρ L / A</span>
      </div>
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 rounded-lg border border-neutral-700 bg-[#0f172a] p-4 flex items-center justify-center min-h-[160px]">
          <div className="text-center">
            <div className="font-mono text-2xl text-cyan-300">R = ρ L / A</div>
            <div className="mt-2 text-lg text-neutral-300">
              R = <span className="text-cyan-300 font-mono">{(R / 1).toFixed(2)}</span> Ω
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              ρ = {resistivity.toExponential(1)} Ω·m · L = {length} m · A = {area} mm²
            </div>
          </div>
        </div>
        <div className="w-full sm:w-56 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-300">Resistivity ρ (×10⁻⁸ Ω·m)</label>
            <input
              type="range"
              min={0.5}
              max={100}
              step={0.5}
              value={resistivity * 1e8}
              onChange={(e) => setResistivity(Number(e.target.value) * 1e-8)}
              className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
            />
            <span className="text-xs text-cyan-300 tabular-nums">{(resistivity * 1e8).toFixed(1)} ×10⁻⁸</span>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-300">Length L (m)</label>
            <input
              type="range"
              min={0.2}
              max={10}
              step={0.1}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
            />
            <span className="text-xs text-cyan-300 tabular-nums">{length} m</span>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-300">Cross-section A (mm²)</label>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
            />
            <span className="text-xs text-cyan-300 tabular-nums">{area.toFixed(1)} mm²</span>
          </div>
          <p className="text-[11px] text-neutral-400">R ∝ ρ, R ∝ L, R ∝ 1/A. Copper ρ ≈ 1.7×10⁻⁸ Ω·m.</p>
        </div>
      </div>
    </div>
  );
}
