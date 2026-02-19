"use client";

import React, { useEffect, useRef, useState } from "react";

export default function PressureInFluidsSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(2);
  const [density, setDensity] = useState(1000);
  const [phase, setPhase] = useState(0);
  const g = 9.81;
  const pressure = depth * density * g * 0.001;

  useEffect(() => {
    const id = requestAnimationFrame(function tick() {
      setPhase((p) => p + 0.03);
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, []);

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

    const maxDepth = 5;
    const tankW = w * 0.38;
    const tankLeft = cx - tankW / 2;
    const tankRight = cx + tankW / 2;
    const surfaceY = h * 0.18;
    const bottomY = h * 0.88;
    const tankH = bottomY - surfaceY;

    const depthNorm = depth / maxDepth;
    const fillH = tankH * depthNorm;
    const fluidTop = bottomY - fillH;

    // Pressure gradient: deeper = stronger color (darker, more saturated)
    const grad = ctx.createLinearGradient(0, fluidTop, 0, bottomY);
    grad.addColorStop(0, "rgba(56,189,248,0.35)");
    grad.addColorStop(0.3, "rgba(34,211,238,0.5)");
    grad.addColorStop(0.7, "rgba(6,182,212,0.65)");
    grad.addColorStop(1, "rgba(2,132,199,0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(tankLeft, fluidTop, tankW, fillH);

    // Surface ripple
    const ripple = Math.sin(phase) * 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(tankLeft, fluidTop + ripple);
    for (let x = tankLeft; x <= tankRight; x += 8) {
      const wave = Math.sin((x - tankLeft) * 0.05 + phase * 2) * 2 * dpr;
      ctx.lineTo(x, fluidTop + wave + ripple);
    }
    ctx.lineTo(tankRight, fluidTop);
    ctx.lineTo(tankLeft, fluidTop);
    ctx.closePath();
    ctx.fillStyle = "rgba(34,211,238,0.25)";
    ctx.fill();
    ctx.strokeStyle = "rgba(56,189,248,0.6)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.strokeStyle = "rgba(148,163,184,0.6)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(tankLeft, surfaceY, tankW, tankH);

    // Pressure at depth: P(h) = h * density * g (same formula, depth from surface)
    const P_at_depth = (hFromSurface: number) => hFromSurface * (density / 1000) * g;
    const maxP = P_at_depth(depth);

    // Depth layers with pressure arrows (thicker/longer = higher P) (inward from walls – pressure pushes in)
    for (let i = 1; i <= 4; i++) {
      const frac = i / 5;
      const layerY = fluidTop + fillH * frac;
      if (layerY > bottomY) continue;
      const hFromSurface = depth * (1 - frac);
      const P = P_at_depth(hFromSurface) * 0.001;
      const intensity = P / (maxP * 0.001 + 1);
      const arrowLen = Math.min(28, 8 + intensity * 22) * dpr;
      const thick = 1.5 + intensity * 2;
      ctx.strokeStyle = `rgba(34,211,238,${0.4 + intensity * 0.5})`;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = thick * dpr;
      ctx.beginPath();
      ctx.moveTo(tankLeft + 12, layerY);
      ctx.lineTo(tankLeft + 12 + arrowLen, layerY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tankLeft + 12 + arrowLen, layerY);
      ctx.lineTo(tankLeft + 12 + arrowLen - 8, layerY - 5);
      ctx.lineTo(tankLeft + 12 + arrowLen - 8, layerY + 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tankRight - 12, layerY);
      ctx.lineTo(tankRight - 12 - arrowLen, layerY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tankRight - 12 - arrowLen, layerY);
      ctx.lineTo(tankRight - 12 - arrowLen + 8, layerY - 5);
      ctx.lineTo(tankRight - 12 - arrowLen + 8, layerY + 5);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.textAlign = "left";
    ctx.fillText(`h = ${depth} m`, tankRight + 14, fluidTop + fillH / 2 - 8);
    ctx.fillText(`P = hρg = ${pressure.toFixed(0)} Pa`, tankRight + 14, fluidTop + fillH / 2 + 12);
    ctx.font = `${9 * dpr}px system-ui`;
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.fillText("deeper → higher P", tankRight + 14, fluidTop + fillH / 2 + 28);
  }, [depth, density, pressure, phase]);

  const slider = (label: string, value: number, min: number, max: number, set: (v: number) => void) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-300">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300"
      />
      <span className="text-sm text-cyan-300 font-mono">{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-neutral-900 overflow-hidden rounded-xl ring-1 ring-cyan-500/15 shadow-[0_0_24px_-4px_rgba(34,211,238,0.08)]">
      <section className="flex flex-1 min-h-0 flex-col md:flex-row bg-neutral-900/95 rounded-xl overflow-hidden">
        <div className="w-full md:w-[65%] min-w-0 md:border-r border-neutral-600/80 flex flex-col p-3 overflow-hidden">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-2 shrink-0">
            <span aria-hidden>📐</span>
            <span>Pressure in Fluids · P = hρg</span>
          </h2>
          <div ref={containerRef} className="relative flex-1 min-h-0 w-full rounded-xl border border-neutral-700 bg-[#0f172a] overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        <aside className="w-full md:w-[35%] md:min-w-[220px] flex flex-col gap-4 px-4 py-4 bg-neutral-900/80 overflow-auto min-h-0 border-t md:border-t-0 md:border-l border-neutral-600/80">
          <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h2>
          {slider("Depth h (m)", depth, 0.5, 5, setDepth)}
          {slider("Density ρ (kg/m³)", density, 800, 1200, setDensity)}
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm">
            <div>P = hρg =</div>
            <div className="text-cyan-300 font-mono font-semibold text-lg">{pressure.toFixed(0)} Pa</div>
          </div>
          <p className="text-[11px] text-neutral-500">Deeper → stronger color & arrows. Water ≈ 1000 kg/m³.</p>
        </aside>
      </section>
    </div>
  );
}
