"use client";

import React, { useEffect, useRef, useState } from "react";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, t);
}

export default function BuoyancySimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [objDensity, setObjDensity] = useState(800);
  const [fluidDensity, setFluidDensity] = useState(1000);
  const [phase, setPhase] = useState(0);
  const boxYRef = useRef(0.5);
  const lastTsRef = useRef<number | null>(null);

  const volume = 0.001;
  const weight = objDensity * volume * 9.81;
  const buoyancy = fluidDensity * volume * 9.81;
  const netForce = buoyancy - weight;
  const submergeRatio = Math.min(1, Math.max(0, objDensity / fluidDensity));
  const floats = objDensity < fluidDensity;
  const equilibriumFrac = floats ? 1 - submergeRatio * 0.7 : 0.85;

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? Math.min(0.05, (ts - lastTsRef.current) / 1000) : 0.02;
      lastTsRef.current = ts;
      boxYRef.current = lerp(boxYRef.current, equilibriumFrac, dt * 6);
      setPhase((p) => p + 0.02);
    };
    raf = requestAnimationFrame((ts) => { lastTsRef.current = ts; requestAnimationFrame(tick); });
    return () => cancelAnimationFrame(raf);
  }, [equilibriumFrac]);

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const dpr = canvas.width / (canvas.getBoundingClientRect().width || 1);

    ctx.clearRect(0, 0, w, h);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const surfaceY = h * 0.28;
    const tankH = h * 0.65;
    const grad = ctx.createLinearGradient(0, surfaceY, 0, h);
    grad.addColorStop(0, "rgba(56,189,248,0.28)");
    grad.addColorStop(0.5, "rgba(34,211,238,0.45)");
    grad.addColorStop(1, "rgba(6,182,212,0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, surfaceY, w, tankH);
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(0, surfaceY, w, tankH);

    const boxSize = 52 * dpr;
    const boxY = surfaceY + tankH * (1 - boxYRef.current) * 0.55 + Math.sin(phase) * 2;
    const boxLeft = cx - boxSize / 2;
    const boxTop = boxY - boxSize / 2;
    const boxBottom = boxTop + boxSize;
    const submergedTop = Math.max(boxTop, surfaceY);
    const submergedH = Math.max(0, boxBottom - submergedTop);

    // Displaced fluid volume: highlight the region that the object "pushes aside"
    if (submergedH > 2) {
      ctx.fillStyle = "rgba(34,211,238,0.35)";
      ctx.strokeStyle = "rgba(34,211,238,0.7)";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2 * dpr;
      ctx.fillRect(boxLeft, submergedTop, boxSize, submergedH);
      ctx.strokeRect(boxLeft, submergedTop, boxSize, submergedH);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(226,232,240,0.85)";
      ctx.font = `${9 * dpr}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("displaced", cx, (submergedTop + boxBottom) / 2 - 6);
      ctx.fillText("volume", cx, (submergedTop + boxBottom) / 2 + 6);
    }

    // Force arrows scale with magnitude so W vs Fb visually compete
    const maxF = Math.max(weight, buoyancy, 1);
    const wLen = (weight / maxF) * 38 * dpr;
    const fbLen = (buoyancy / maxF) * 38 * dpr;
    const netLen = Math.abs(netForce) / maxF * 28 * dpr;
    const arrowW = 2.5 * dpr;

    const drawArrowDown = (x: number, y: number, len: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = arrowW;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + len);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 6, y + len - 10);
      ctx.lineTo(x, y + len);
      ctx.lineTo(x + 6, y + len - 10);
      ctx.fill();
    };
    const drawArrowUp = (x: number, y: number, len: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = arrowW;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - len);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 6, y - len + 10);
      ctx.lineTo(x, y - len);
      ctx.lineTo(x + 6, y - len + 10);
      ctx.fill();
    };

    drawArrowDown(cx - 36, boxTop, wLen, "#dc2626");
    drawArrowUp(cx + 36, boxTop + boxSize / 2, fbLen, "#22c55e");
    if (Math.abs(netForce) > 0.01) {
      if (netForce > 0) drawArrowUp(cx + 80, boxTop + boxSize / 2, netLen, "#f59e0b");
      else drawArrowDown(cx - 80, boxTop + boxSize / 2, netLen, "#f59e0b");
    }

    ctx.fillStyle = floats ? "#86efac" : "#fca5a5";
    ctx.shadowColor = floats ? "#22c55e" : "#dc2626";
    ctx.shadowBlur = 8 * dpr;
    ctx.fillRect(boxLeft, boxTop, boxSize, boxSize);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(226,232,240,0.8)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(boxLeft, boxTop, boxSize, boxSize);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("W", cx - 36, boxTop - 6);
    ctx.fillText("Fb", cx + 36, boxTop + boxSize / 2 - fbLen - 8);
    if (Math.abs(netForce) > 0.01) ctx.fillText("net", cx + (netForce > 0 ? 80 : -80), boxTop + boxSize / 2 + (netForce > 0 ? -netLen - 6 : netLen + 14));
  }, [objDensity, fluidDensity, submergeRatio, netForce, weight, buoyancy, floats, phase]);

  const slider = (label: string, value: number, min: number, max: number, set: (v: number) => void) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-300">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        title="Compare object vs fluid density — who wins?"
        className="w-full h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300"
      />
      <span className="text-sm text-cyan-300 font-mono">{value} kg/m³</span>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-neutral-900 overflow-hidden rounded-xl ring-1 ring-cyan-500/15 shadow-[0_0_24px_-4px_rgba(34,211,238,0.08)]">
      <section className="flex flex-1 min-h-0 flex-col md:flex-row bg-neutral-900/95 rounded-xl overflow-hidden">
        <div className="w-full md:w-[65%] min-w-0 md:border-r border-neutral-600/80 flex flex-col p-3 overflow-hidden">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-2 shrink-0">
            <span aria-hidden>🚢</span>
            <span>Buoyancy · Archimedes&apos; Principle</span>
          </h2>
          <div ref={containerRef} className="relative flex-1 min-h-0 w-full rounded-xl border border-neutral-700 bg-[#0f172a] overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        <aside className="w-full md:w-[35%] md:min-w-[220px] flex flex-col gap-4 px-4 py-4 bg-neutral-900/80 overflow-auto min-h-0 border-t md:border-t-0 md:border-l border-neutral-600/80">
          <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h2>
          {slider("Object density (kg/m³)", objDensity, 400, 1200, setObjDensity)}
          {slider("Fluid density (kg/m³)", fluidDensity, 800, 1200, setFluidDensity)}
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm space-y-1">
            <div>Weight: {(weight * 1000).toFixed(2)} N</div>
            <div>Upthrust: {(buoyancy * 1000).toFixed(2)} N</div>
            <div className="text-cyan-300 font-semibold">{floats ? "Floats ↑" : "Sinks ↓"}</div>
          </div>
          <p className="text-[11px] text-neutral-500">Fb = weight of displaced fluid. ρ_obj &lt; ρ_fluid → float.</p>
        </aside>
      </section>
    </div>
  );
}
