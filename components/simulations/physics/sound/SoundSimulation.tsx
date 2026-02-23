"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const SPEED = 180; // px/s wave speed for animation
const DEFAULT_FREQ = 2; // Hz
const DEFAULT_AMP = 0.4;

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

type Medium = "gas" | "liquid" | "solid";

export default function SoundSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frequency, setFrequency] = useState(DEFAULT_FREQ);
  const [amplitude, setAmplitude] = useState(DEFAULT_AMP);
  const [medium, setMedium] = useState<Medium>("gas");
  const [viewMode, setViewMode] = useState<"wave" | "particle">("wave");
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });

  const period = 1 / frequency;
  const wavelength = SPEED / frequency;
  const t = isAnimating ? elapsedTime : 0;

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

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    const k = (2 * Math.PI) / wavelength;
    const omega = 2 * Math.PI * frequency;
    const A = amplitude * graphH * 0.35;

    if (viewMode === "wave") {
      // Displacement vs position (snapshot): y = A sin(kx - omega*t)
      ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const xNorm = i / steps;
        const x = marginX + xNorm * graphW;
        const phase = k * (xNorm * graphW) - omega * t;
        const y = cy + A * Math.sin(phase);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Compressions (peaks) and rarefactions (troughs) shading
      ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
      ctx.beginPath();
      ctx.moveTo(marginX, cy);
      for (let i = 0; i <= steps; i++) {
        const xNorm = i / steps;
        const x = marginX + xNorm * graphW;
        const phase = k * (xNorm * graphW) - omega * t;
        const y = cy + A * Math.sin(phase);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(marginX + graphW, cy);
      ctx.closePath();
      ctx.fill();
      // Direction arrow
      ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
      ctx.font = `${11 * dpr}px system-ui,sans-serif`;
      ctx.fillText("→ propagation", marginX + graphW - 85 * dpr, cy + A + 18 * dpr);
    } else {
      // Particle view: dots along center line, displacement = A sin(kx - omega*t)
      const N = 28;
      const dotRadius = 3 * dpr;
      const spacing = graphW / (N + 1);
      for (let i = 0; i < N; i++) {
        const xNorm = (i + 1) / (N + 1);
        const xBase = marginX + xNorm * graphW;
        const phase = k * (xNorm * graphW) - omega * t;
        const disp = A * Math.sin(phase);
        const x = xBase + disp;
        const y = cy;
        const intensity = 0.5 + 0.5 * Math.cos(phase);
        ctx.fillStyle = `rgba(34, 211, 238, ${0.4 + 0.6 * intensity})`;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(34, 211, 238, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(marginX, cy);
      ctx.lineTo(marginX + graphW, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.font = `${10 * dpr}px system-ui,sans-serif`;
      ctx.fillText("particles oscillate ↔", marginX, cy + 20 * dpr);
    }

    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`f = ${formatNum(frequency, 1)} Hz   T = ${formatNum(period, 2)} s   λ = ${formatNum(wavelength, 0)} px`, marginX, h - 10 * dpr);
  }, [frequency, amplitude, medium, viewMode, isAnimating, t]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Frequency" value={frequency} min={0.5} max={5} step={0.25} unit="Hz" onChange={setFrequency} color="cyan" />
      <SliderControl label="Amplitude" value={amplitude} min={0.1} max={0.8} step={0.05} unit="—" onChange={setAmplitude} color="violet" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">View</label>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as "wave" | "particle")}
          aria-label="Toggle reflection insight"
          className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200"
        >
          <option value="wave">Wave (displacement)</option>
          <option value="particle">Particle motion</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Medium</label>
        <select
          value={medium}
          onChange={(e) => setMedium(e.target.value as Medium)}
          aria-label="Toggle reflection insight"
          className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200"
        >
          <option value="gas">Gas (e.g. air)</option>
          <option value="liquid">Liquid (e.g. water)</option>
          <option value="solid">Solid (e.g. steel)</option>
        </select>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Readouts</div>
        <div className="font-mono">f = {formatNum(frequency, 2)} Hz</div>
        <div className="font-mono">T = 1/f = {formatNum(period, 2)} s</div>
        <div className="font-mono">λ = v/f ≈ {formatNum(wavelength, 0)} px</div>
      </div>
    </>
  );

  return (
    <SoundShell
      title="Sound as a wave"
      subtitle="Longitudinal wave: compressions & rarefactions. Toggle wave or particle view."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
