"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const SPEED = 200;
function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function FrequencySimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frequency, setFrequency] = useState(2);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const t = isAnimating ? elapsedTime : 0;
  const period = 1 / frequency;
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

    ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const xNorm = i / 120;
      const x = marginX + xNorm * graphW;
      const phase = k * xNorm * graphW - omega * t;
      const y = cy + A * Math.sin(phase);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`f = ${formatNum(frequency, 2)} Hz   T = ${formatNum(period, 2)} s   (higher f = higher pitch)`, marginX, h - 10 * dpr);
  }, [frequency, isAnimating, t, k, omega]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Frequency f" value={frequency} min={0.5} max={6} step={0.25} unit="Hz" onChange={setFrequency} color="cyan" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">f ↔ T</div>
        <div className="font-mono">f = {formatNum(frequency, 2)} Hz</div>
        <div className="font-mono">T = 1/f = {formatNum(period, 3)} s</div>
        <p className="text-xs mt-2">Frequency = pitch; period = time for one cycle.</p>
      </div>
    </>
  );

  return (
    <SoundShell title="Frequency" subtitle="Frequency slider with time period readout; f ↔ T inverse." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
