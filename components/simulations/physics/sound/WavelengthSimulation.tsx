"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const V = 340; // m/s for display
function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function WavelengthSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frequency, setFrequency] = useState(500);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const t = isAnimating ? elapsedTime : 0;
  const wavelength = V / frequency; // metres
  const scale = 800; // px per metre (so λ fits on screen)
  const k = (2 * Math.PI) / wavelength;
  const omega = 2 * Math.PI * frequency;
  const lambdaPx = Math.min((wavelength * scale) / 2, 400);

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
    const marginX = 40 * dpr;
    const marginY = 44 * dpr;
    const graphW = w - 2 * marginX;
    const graphH = h - 2 * marginY;
    const cy = marginY + graphH / 2;
    const A = graphH * 0.35;
    const lambdaPxScaled = lambdaPx * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    const kPx = (2 * Math.PI) / lambdaPxScaled;
    ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const x = marginX + (i / 100) * graphW;
      const phase = kPx * (i / 100) * graphW - omega * t;
      const y = cy + A * Math.sin(phase);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Mark one wavelength (distance between compressions)
    const peakX = marginX + (1 / 4) * graphW;
    const nextPeakX = marginX + (1 / 4) * graphW + Math.min(lambdaPxScaled, graphW * 0.6);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(peakX, cy + A + 15 * dpr);
    ctx.lineTo(nextPeakX, cy + A + 15 * dpr);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("λ", (peakX + nextPeakX) / 2 - 6, cy + A + 28 * dpr);

    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`v = fλ  →  λ = v/f = ${formatNum(wavelength, 4)} m`, marginX, h - 10 * dpr);
  }, [frequency, isAnimating, t, lambdaPx, omega]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Frequency f" value={frequency} min={200} max={2000} step={50} unit="Hz" onChange={setFrequency} color="cyan" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">v = fλ</div>
        <div className="font-mono">v = {V} m/s</div>
        <div className="font-mono">f = {frequency} Hz</div>
        <div className="font-mono">λ = v/f = {formatNum(wavelength, 4)} m</div>
        <p className="text-xs mt-2">Change f → λ auto-adjusts. Higher f → smaller λ.</p>
      </div>
    </>
  );

  return (
    <SoundShell title="Wavelength" subtitle="Distance between compressions; λ, f, v relationship." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
