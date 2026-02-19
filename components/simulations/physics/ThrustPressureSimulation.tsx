"use client";

import React, { useEffect, useRef, useState } from "react";

function formatPressure(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1e6) return n.toExponential(1);
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n < 0.01) return n.toExponential(2);
  return n.toFixed(2);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, t);
}

export default function ThrustPressureSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [force, setForce] = useState(100);
  const [area, setArea] = useState(50);
  const [phase, setPhase] = useState(0);
  const deformRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);

  const pressure = area > 0 ? force / area : 0;
  const targetDeform = Math.min(18, (pressure / 50) * 12);

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? Math.min(0.05, (ts - lastTsRef.current) / 1000) : 0.02;
      lastTsRef.current = ts;
      deformRef.current = lerp(deformRef.current, targetDeform, dt * 10);
      setPhase((p) => p + 0.04);
    };
    raf = requestAnimationFrame((ts) => { lastTsRef.current = ts; requestAnimationFrame(tick); });
    return () => cancelAnimationFrame(raf);
  }, [targetDeform]);

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

    const boxW = Math.max(44, Math.min(120, Math.sqrt(area) * 14));
    const groundY = h * 0.76;
    const deform = deformRef.current + Math.sin(phase) * 1.5;

    // Color encode pressure: low = cool cyan, high = warm orange/red
    const intensity = Math.min(1, Math.log10(pressure + 0.1) / 2.8);
    const r = Math.floor(34 + intensity * 220);
    const g = Math.floor(211 - intensity * 120);
    const b = Math.floor(238 - intensity * 180);

    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= w; x += 6) {
      const d = Math.abs(x - cx);
      const depth = d < boxW ? deform * (1 - d / boxW) ** 2 : 0;
      ctx.lineTo(x, groundY + depth);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.strokeStyle = "rgba(71,85,105,0.5)";
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    // Box glow (stronger when pressure is high)
    const glowR = boxW * (1.2 + intensity * 0.4);
    const boxGrad = ctx.createRadialGradient(cx, groundY - 25 + deform, 0, cx, groundY - 25 + deform, glowR);
    boxGrad.addColorStop(0, `rgba(${r},${g},${b},0.75)`);
    boxGrad.addColorStop(0.4, `rgba(${r},${g},${b},0.35)`);
    boxGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = boxGrad;
    ctx.fillRect(cx - glowR, groundY - 60 + deform, glowR * 2, 60);

    ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
    ctx.fillRect(cx - boxW, groundY - 50 + deform, boxW * 2, 50);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(cx - boxW, groundY - 50 + deform, boxW * 2, 50);

    const arrowW = 6 + (force / 180) * 12;
    const pulse = 1 + Math.sin(phase) * 0.06;
    const arrowColor = intensity > 0.5 ? `rgb(${Math.min(255, r + 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})` : "#22d3ee";
    ctx.shadowColor = arrowColor;
    ctx.shadowBlur = 6 * dpr + intensity * 14;
    ctx.fillStyle = arrowColor;
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = arrowW * dpr;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, 78);
    ctx.lineTo(cx, groundY - 54 + deform);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, groundY - 54 + deform);
    ctx.lineTo(cx - 12, groundY - 38 + deform);
    ctx.lineTo(cx + 12, groundY - 38 + deform);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `${12 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(`F = ${force} N`, cx, 58);
    ctx.fillText(`A = ${area} m²`, cx, groundY + 32);
  }, [force, area, pressure, phase]);

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
            <span aria-hidden>💧</span>
            <span>Thrust & Pressure · P = F/A</span>
          </h2>
          <div ref={containerRef} className="relative flex-1 min-h-0 w-full rounded-xl border border-neutral-700 bg-[#0f172a] overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        <aside className="w-full md:w-[35%] md:min-w-[220px] flex flex-col gap-4 px-4 py-4 bg-neutral-900/80 overflow-auto min-h-0 border-t md:border-t-0 md:border-l border-neutral-600/80">
          <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h2>
          {slider("Force F (N)", force, 10, 500, setForce)}
          {slider("Area A (m²)", area, 5, 150, setArea)}
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm">
            <div>P = F/A =</div>
            <div className="text-cyan-300 font-mono font-semibold text-lg">{formatPressure(pressure)} Pa</div>
          </div>
          <p className="text-[11px] text-neutral-500">Same F, smaller A → higher P (color & sink).</p>
        </aside>
      </section>
    </div>
  );
}
