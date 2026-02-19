"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ElectricityShell, SliderControl } from "./ElectricityShell";
import { useSimulationLifecycle } from "./useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

const RHO: Record<string, number> = {
  copper: 1.68e-8,
  silver: 1.59e-8,
  aluminium: 2.82e-8,
  tungsten: 5.6e-8,
};

export default function ResistanceFactorsSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [material, setMaterial] = useState<keyof typeof RHO>("copper");
  const [length, setLength] = useState(1);
  const [crossSection, setCrossSection] = useState(1);
  const [voltage, setVoltage] = useState(12);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });

  const { hasLaunched, isPaused, launch, pause, reset } = useSimulationLifecycle();

  const rho = RHO[material] ?? RHO.copper;
  const R = useMemo(() => (crossSection > 0 ? (rho * length) / crossSection : 0), [rho, length, crossSection]);
  const current = useMemo(() => (R > 0 ? voltage / R : 0), [voltage, R]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = dimsRef.current;
    const cx = w / 2;
    const wireH = Math.max(14, 12 * crossSection) * dpr;
    const wireLen = Math.min(w * 0.35, 80 * length) * dpr;
    const left = cx - wireLen;
    const right = cx + wireLen;
    const top = h / 2 - wireH / 2;
    const bottom = h / 2 + wireH / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    const gridStep = 20 * dpr;
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(251,191,36,0.6)";
    ctx.fillStyle = "rgba(251,191,36,0.15)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(left, top, wireLen * 2, bottom - top);
    ctx.fillRect(left, top, wireLen * 2, bottom - top);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`Same V = ${voltage} V`, cx, top - 10 * dpr);
    ctx.fillText(`R = ρL/A = ${formatNum(R * 1e9, 2)} nΩ`, cx, bottom + 14 * dpr);
    ctx.fillText(`I = V/R = ${formatNum(current, 3)} A`, cx, bottom + 26 * dpr);
  }, [material, length, crossSection, voltage, R, current]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Material</label>
        <select value={material} onChange={(e) => setMaterial(e.target.value as keyof typeof RHO)} className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          {Object.keys(RHO).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <SliderControl label="Length L" value={length} min={0.5} max={2} step={0.25} unit="rel." onChange={setLength} color="orange" />
      <SliderControl label="Cross-section A" value={crossSection} min={0.25} max={2} step={0.25} unit="rel." onChange={setCrossSection} color="orange" />
      <SliderControl label="Voltage V" value={voltage} min={1} max={24} step={1} unit="V" onChange={setVoltage} color="blue" />
      <div className="rounded-lg border border-orange-500/25 bg-orange-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-orange-300 uppercase tracking-wider">Live: R = ρ L / A</div>
        <div className="font-mono">R = {formatNum(rho * 1e8, 2)}×10⁻⁸ · {length} / {crossSection}</div>
        <div className="text-xs">I = V/R = {formatNum(current, 3)} A</div>
      </div>
      <p className="text-[11px] text-neutral-500">Same V, different R: longer or thinner → higher R → lower I.</p>
    </>
  );

  return (
    <ElectricityShell
      title="Why Resistance Changes"
      subtitle="Same voltage; R = ρL/A. Compare length and cross-section."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </ElectricityShell>
  );
}
