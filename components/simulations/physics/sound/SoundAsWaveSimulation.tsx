"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const SPEED = 200;
function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function SoundAsWaveSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frequency, setFrequency] = useState(2);
  const [viewMode, setViewMode] = useState<"wave" | "particle">("wave");
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const t = isAnimating ? elapsedTime : 0;
  const wavelength = SPEED / frequency;
  const k = (2 * Math.PI) / wavelength;
  const omega = 2 * Math.PI * frequency;

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
    const marginX = 32 * dpr;
    const marginY = 36 * dpr;
    const graphW = w - 2 * marginX;
    const graphH = h - 2 * marginY;
    const cy = marginY + graphH / 2;
    const A = graphH * 0.35;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    if (viewMode === "wave") {
      ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = marginX + (i / 100) * graphW;
        const phase = k * (i / 100) * graphW - omega * t;
        const y = cy + A * Math.sin(phase);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      const N = 24;
      const spacing = graphW / (N + 1);
      for (let i = 0; i < N; i++) {
        const xNorm = (i + 1) / (N + 1);
        const xBase = marginX + xNorm * graphW;
        const phase = k * xNorm * graphW - omega * t;
        const x = xBase + A * Math.sin(phase);
        ctx.fillStyle = "rgba(34, 211, 238, 0.8)";
        ctx.beginPath();
        ctx.arc(x, cy, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`f = ${formatNum(frequency, 1)} Hz   λ = ${formatNum(wavelength, 0)} px`, marginX, h - 10 * dpr);
  }, [frequency, viewMode, isAnimating, t, k, omega]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Frequency" value={frequency} min={0.5} max={5} step={0.25} unit="Hz" onChange={setFrequency} color="cyan" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">View</label>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value as "wave" | "particle")}  aria-label="Toggle reflection insight"className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="wave">Wave (displacement)</option>
          <option value="particle">Particle motion</option>
        </select>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="font-mono text-cyan-200">v = fλ = {formatNum(SPEED, 0)} px/s</div>
        <div className="font-mono text-xs mt-1">T = 1/f = {formatNum(1 / frequency, 2)} s</div>
      </div>
    </>
  );

  return (
    <SoundShell title="Sound as a Wave" subtitle="Travelling wave: displacement vs position or particle view." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
