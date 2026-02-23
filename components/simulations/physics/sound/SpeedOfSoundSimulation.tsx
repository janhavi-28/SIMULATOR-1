"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

// Approximate speeds in m/s
function speedInAir(tempC: number) {
  return 331 + 0.6 * tempC;
}
const SPEED_WATER = 1500;
const SPEED_STEEL = 5960;

type Medium = "air" | "water" | "steel";

export default function SpeedOfSoundSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [medium, setMedium] = useState<Medium>("air");
  const [tempC, setTempC] = useState(20);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const t = isAnimating ? elapsedTime : 0;

  const v = medium === "air" ? speedInAir(tempC) : medium === "water" ? SPEED_WATER : SPEED_STEEL;
  const distance = 100; // m
  const travelTime = distance / v;

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
    const margin = 32 * dpr;
    const barH = 24 * dpr;
    const barY = h / 2 - barH / 2;
    const barW = w - 2 * margin;
    const progress = Math.min(1, t / (travelTime || 0.001));

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(55, 65, 81, 0.6)";
    ctx.fillRect(margin, barY, barW, barH);
    ctx.fillStyle = "rgba(34, 211, 238, 0.85)";
    ctx.fillRect(margin, barY, barW * progress, barH);
    ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
    ctx.strokeRect(margin, barY, barW, barH);

    ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
    const dotX = margin + barW * progress;
    ctx.beginPath();
    ctx.arc(dotX, barY + barH / 2, 10 * dpr, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(248, 250, 252, 0.95)";
    ctx.font = `${12 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Source", margin - 8, barY + barH / 2 + 4);
    ctx.fillText("Target", margin + barW + 8, barY + barH / 2 + 4);
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`Distance = ${distance} m   v = ${formatNum(v)} m/s   Time = ${formatNum(travelTime * 1000, 1)} ms`, margin, h - 14 * dpr);
  }, [medium, tempC, v, travelTime, isAnimating, t]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Medium</label>
        <select value={medium} onChange={(e) => setMedium(e.target.value as Medium)}aria-label="Toggle reflection insight" className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="air">Air</option>
          <option value="water">Water</option>
          <option value="steel">Steel</option>
        </select>
      </div>
      {medium === "air" && (
        <SliderControl label="Temperature" value={tempC} min={-10} max={40} step={1} unit="°C" onChange={setTempC} color="orange" />
      )}
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Speed & time</div>
        <div className="font-mono">v = {formatNum(v)} m/s</div>
        <div className="font-mono text-xs mt-1">Time for {distance} m = {formatNum(travelTime * 1000, 2)} ms</div>
      </div>
    </>
  );

  return (
    <SoundShell title="Speed of Sound" subtitle="Medium selector and temperature (air). Wave travel time." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
