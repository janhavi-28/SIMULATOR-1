"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ElectricityShell, SliderControl } from "./ElectricityShell";
import { useSimulationLifecycle } from "./useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function PowerHeatVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voltage, setVoltage] = useState(12);
  const [current, setCurrent] = useState(2);
  const [resistance, setResistance] = useState(6);
  const [mode, setMode] = useState<"V,I" | "I,R" | "V,R">("V,I");
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });

  const { hasLaunched, isPaused, launch, pause, reset } = useSimulationLifecycle();

  const V = voltage;
  const I = mode === "V,I" ? current : mode === "I,R" ? current : voltage / (resistance || 1);
  const R = mode === "V,R" ? resistance : mode === "I,R" ? resistance : voltage / (current || 1);
  const P_VI = V * I;
  const P_I2R = I * I * R;
  const P_V2R = (V * V) / (R || 1);
  const P = P_VI;

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
    const cy = h / 2;
    const barW = Math.min(120, w * 0.35);
    const barH = 24 * dpr;
    const maxP = 100;
    const intensity = Math.min(1, P / maxP);

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

    const grad = ctx.createLinearGradient(cx - barW / 2, 0, cx + barW / 2, 0);
    grad.addColorStop(0, "rgba(30,58,138,0.6)");
    grad.addColorStop(0.3, "rgba(239,68,68,0.4)");
    grad.addColorStop(0.7, "rgba(239,68,68,0.9)");
    grad.addColorStop(1, "rgba(254,202,202,0.95)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - barW / 2, cy - barH / 2, barW * intensity, barH);
    ctx.strokeStyle = "rgba(239,68,68,0.6)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(cx - barW / 2, cy - barH / 2, barW, barH);
    ctx.fillStyle = "rgba(248,250,252,0.95)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`P = ${formatNum(P, 1)} W`, cx, cy - barH / 2 - 8 * dpr);
    ctx.fillText("Heating ∝ P", cx, cy + barH / 2 + 14 * dpr);
  }, [P]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Use</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as "V,I" | "I,R" | "V,R")} className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="V,I">V & I</option>
          <option value="I,R">I & R</option>
          <option value="V,R">V & R</option>
        </select>
      </div>
      {mode === "V,I" && (
        <>
          <SliderControl label="Voltage V" value={voltage} min={1} max={24} step={0.5} unit="V" onChange={setVoltage} color="blue" />
          <SliderControl label="Current I" value={current} min={0.5} max={10} step={0.25} unit="A" onChange={setCurrent} color="cyan" />
        </>
      )}
      {mode === "I,R" && (
        <>
          <SliderControl label="Current I" value={current} min={0.5} max={10} step={0.25} unit="A" onChange={setCurrent} color="cyan" />
          <SliderControl label="Resistance R" value={resistance} min={1} max={30} step={0.5} unit="Ω" onChange={setResistance} color="orange" />
        </>
      )}
      {mode === "V,R" && (
        <>
          <SliderControl label="Voltage V" value={voltage} min={1} max={24} step={0.5} unit="V" onChange={setVoltage} color="blue" />
          <SliderControl label="Resistance R" value={resistance} min={1} max={30} step={0.5} unit="Ω" onChange={setResistance} color="orange" />
        </>
      )}
      <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-rose-300 uppercase tracking-wider">P = VI = I²R = V²/R</div>
        <div className="font-mono text-rose-200">P = VI = {formatNum(P_VI, 2)} W</div>
        <div className="font-mono text-rose-200">P = I²R = {formatNum(P_I2R, 2)} W</div>
        <div className="font-mono text-rose-200">P = V²/R = {formatNum(P_V2R, 2)} W</div>
      </div>
      <p className="text-[11px] text-neutral-500">Color intensity ∝ power (heating effect).</p>
    </>
  );

  return (
    <ElectricityShell
      title="Power & Heat Visualizer"
      subtitle="P = VI = I²R = V²/R; heating ∝ P."
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
