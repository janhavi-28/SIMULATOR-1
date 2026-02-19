"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const SPEED = 180;
function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function LongitudinalWavesSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frequency, setFrequency] = useState(2);
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
    const marginX = 28 * dpr;
    const marginY = 40 * dpr;
    const graphW = w - 2 * marginX;
    const graphH = h - 2 * marginY;
    const cy = marginY + graphH / 2;
    const A = graphH * 0.3;
    const N = 35;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < N; i++) {
      const xNorm = (i + 0.5) / N;
      const xBase = marginX + xNorm * graphW;
      const phase = k * xNorm * graphW - omega * t;
      const disp = A * Math.sin(phase);
      const x = xBase + disp;
      const compression = 0.5 + 0.5 * Math.cos(phase);
      ctx.fillStyle = compression > 0.7 ? "rgba(251, 191, 36, 0.95)" : compression > 0.3 ? "rgba(34, 211, 238, 0.85)" : "rgba(148, 163, 184, 0.6)";
      ctx.beginPath();
      ctx.arc(x, cy, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Direction arrow
    ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.fillText("→ propagation", marginX + graphW - 75 * dpr, cy + A + 22 * dpr);

    ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Compression (dense) = orange; Rarefaction (sparse) = grey", marginX, h - 10 * dpr);
  }, [frequency, isAnimating, t, k, omega]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Frequency" value={frequency} min={0.5} max={4} step={0.25} unit="Hz" onChange={setFrequency} color="cyan" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Longitudinal wave</div>
        <p className="mt-1 text-xs">Compressions (high pressure) and rarefactions (low pressure) move in the direction of propagation. λ = {formatNum(wavelength, 0)} px</p>
      </div>
    </>
  );

  return (
    <SoundShell title="Longitudinal Waves" subtitle="Compression–rarefaction animation with direction." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
