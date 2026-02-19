"use client";

import React, { useEffect, useRef, useState } from "react";
import { WorkEnergyShell, SliderControl } from "./WorkEnergyShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const G = 9.8;

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function EnergyConservationLabSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mass, setMass] = useState(1);
  const [frictionOn, setFrictionOn] = useState(false);
  const [initialH, setInitialH] = useState(5);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });
  const { elapsedTime, hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();

  const duration = 5;
  const t = isAnimating ? Math.min(elapsedTime, duration) : 0;
  const progress = duration > 0 ? t / duration : 0;
  const h = initialH * (1 - progress);
  const v = (2 * G * initialH) ** 0.5 * (progress ** 0.5);
  const ke = 0.5 * mass * v * v;
  const pe = mass * G * h;
  const thermal = frictionOn ? Math.max(0, mass * G * initialH - ke - pe) : 0;
  const total = ke + pe + thermal;

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
    const { w, h: ch, dpr } = dimsRef.current;
    const margin = 36 * dpr;
    const scale = (ch - 2 * margin) / initialH;
    const groundY = ch - margin;
    const ballY = groundY - h * scale;
    const cx = w / 2;
    const trackR = Math.min(w - 2 * margin, (ch - 2 * margin) * 1.2) / 2;

    ctx.clearRect(0, 0, w, ch);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, ch);
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(cx, groundY - trackR, trackR, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(125,211,252,0.9)";
    ctx.shadowColor = "rgba(34,211,238,0.5)";
    ctx.shadowBlur = isAnimating ? 6 * dpr : 0;
    const angle = Math.PI + progress * Math.PI;
    const bx = cx + trackR * Math.cos(angle);
    const by = groundY - trackR + trackR * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(bx, by, 12 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`KE = ${formatNum(ke, 1)} J  PE = ${formatNum(pe, 1)} J`, margin, margin - 4);
    if (frictionOn) ctx.fillText(`Thermal = ${formatNum(thermal, 1)} J  Total = ${formatNum(total, 1)} J`, margin, margin + 12);
  }, [mass, initialH, frictionOn, h, ke, pe, thermal, total, progress, isAnimating]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Mass" value={mass} min={0.5} max={5} step={0.5} unit="kg" onChange={setMass} color="cyan" />
      <SliderControl label="Initial height" value={initialH} min={2} max={8} step={0.5} unit="m" onChange={setInitialH} color="amber" />
      <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
        <input type="checkbox" checked={frictionOn} onChange={(e) => setFrictionOn(e.target.checked)} className="rounded border-neutral-500 bg-neutral-800 text-cyan-500" />
        Friction on
      </label>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Energy</div>
        <div>KE = {formatNum(ke, 1)} J</div>
        <div>PE = {formatNum(pe, 1)} J</div>
        {frictionOn && <div>Thermal = {formatNum(thermal, 1)} J</div>}
        <div className="text-neutral-300">Total conserved</div>
      </div>
    </>
  );

  return (
    <WorkEnergyShell title="Energy Conservation Lab" subtitle="Roller-coaster track. Toggle friction; total energy conserved." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </WorkEnergyShell>
  );
}
