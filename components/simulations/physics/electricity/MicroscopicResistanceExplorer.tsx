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
  iron: 9.7e-8,
};

export default function MicroscopicResistanceExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [length, setLength] = useState(1);
  const [area, setArea] = useState(1);
  const [material, setMaterial] = useState<keyof typeof RHO>("copper");
  const [voltage, setVoltage] = useState(12);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });

  const { elapsedTime, hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();
  const simTime = elapsedTime;

  const rho = RHO[material] ?? RHO.copper;
  const R = useMemo(() => (area > 0 ? (rho * length) / area : 0), [rho, length, area]);
  const current = useMemo(() => (R > 0 ? voltage / R : 0), [voltage, R]);
  const driftSpeed = useMemo(() => Math.min(1, current * 0.15), [current]);

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
    const margin = 30 * dpr;
    const stripW = w - 2 * margin;
    const stripH = Math.max(24, 16 * area) * dpr;
    const cy = h / 2;
    const left = margin;
    const right = w - margin;

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

    const latticeCols = 12;
    const latticeRows = Math.max(3, Math.floor(4 * area));
    const cellW = stripW / latticeCols;
    const cellH = stripH / latticeRows;
    const ionR = 3 * dpr;

    for (let row = 0; row < latticeRows; row++) {
      for (let col = 0; col < latticeCols; col++) {
        const x = left + (col + 0.5) * cellW;
        const y = cy - stripH / 2 + (row + 0.5) * cellH;
        ctx.fillStyle = "rgba(251,191,36,0.5)";
        ctx.strokeStyle = "rgba(251,191,36,0.4)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.arc(x, y, ionR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    const nElectrons = 8;
    const speed = 0.12 * driftSpeed * (current + 0.5);
    const t = isAnimating ? simTime * 50 : 0;
    for (let i = 0; i < nElectrons; i++) {
      const phase = (i / nElectrons) * stripW;
      let x = left + ((phase + t * speed) % (stripW + 40)) - 20;
      if (x < left) x = right - (left - x);
      const row = (i % latticeRows);
      const y = cy - stripH / 2 + (row + 0.5) * cellH;
      ctx.fillStyle = "rgba(125,211,252,0.95)";
      ctx.shadowColor = "rgba(56,189,248,0.8)";
      ctx.shadowBlur = 6 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(left, cy - stripH / 2, stripW, stripH);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("Lattice (ions) — electrons drift & collide", left, cy - stripH / 2 - 8 * dpr);
    ctx.fillText(`R = ρL/A → ${formatNum(R * 1e9, 2)} nΩ (scaled)`, left, cy + stripH / 2 + 14 * dpr);
  }, [length, area, material, voltage, R, current, driftSpeed, simTime, isAnimating]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Length L" value={length} min={0.5} max={2} step={0.25} unit="rel." onChange={setLength} color="orange" title="Conductor length" />
      <SliderControl label="Area A" value={area} min={0.25} max={2} step={0.25} unit="rel." onChange={setArea} color="orange" title="Cross-sectional area" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Material (ρ)</label>
        <select value={material} onChange={(e) => setMaterial(e.target.value as keyof typeof RHO)} className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          {Object.keys(RHO).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <SliderControl label="Voltage V" value={voltage} min={1} max={24} step={1} unit="V" onChange={setVoltage} color="blue" />
      <div className="rounded-lg border border-orange-500/25 bg-orange-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-orange-300 uppercase tracking-wider">R = ρ L / A</div>
        <div className="font-mono text-orange-200">R = {formatNum(rho * 1e8, 2)}×10⁻⁸ · {length} / {area}</div>
        <div className="text-xs">R ∝ L, R ∝ 1/A. More collisions → higher R.</div>
      </div>
      <p className="text-[11px] text-neutral-500">Longer/thinner or higher ρ → more collisions → higher R.</p>
    </>
  );

  return (
    <ElectricityShell
      title="Microscopic Resistance Explorer"
      subtitle="Lattice view: electrons drift and collide; R = ρL/A."
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
