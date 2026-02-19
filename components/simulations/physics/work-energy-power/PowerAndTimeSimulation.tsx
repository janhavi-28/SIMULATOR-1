"use client";

import React, { useEffect, useRef, useState } from "react";
import { WorkEnergyShell, SliderControl } from "./WorkEnergyShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const G = 9.8;

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function PowerAndTimeSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mass, setMass] = useState(2);
  const [height, setHeight] = useState(3);
  const [fastTime, setFastTime] = useState(1);
  const [slowTime, setSlowTime] = useState(4);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });
  const { elapsedTime, hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();

  const work = mass * G * height;
  const powerFast = fastTime > 0 ? work / fastTime : 0;
  const powerSlow = slowTime > 0 ? work / slowTime : 0;

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
    const margin = 44 * dpr;
    const maxP = Math.max(powerFast, powerSlow, 1);
    const barW = (w - 2 * margin - 24) / 2;
    const barH = 50 * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(148,163,184,0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = h - margin - (barH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(w - margin, y);
      ctx.stroke();
    }

    const drawBar = (x: number, value: number, label: string) => {
      const norm = value / maxP;
      const height = barH * norm;
      ctx.fillStyle = "rgba(192,132,252,0.8)";
      ctx.fillRect(x, h - margin - height, barW, height);
      ctx.strokeStyle = "rgba(192,132,252,0.5)";
      ctx.strokeRect(x, h - margin - height, barW, height);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `${10 * dpr}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, x + barW / 2, h - margin + 16);
      ctx.fillText(`P = ${formatNum(value, 1)} W`, x + barW / 2, h - margin - height - 6);
    };

    drawBar(margin, powerFast, `Fast (t = ${fastTime} s)`);
    drawBar(margin + barW + 24, powerSlow, `Slow (t = ${slowTime} s)`);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(`Same work W = mgh = ${formatNum(work, 1)} J`, margin, margin - 8);
  }, [mass, height, fastTime, slowTime, work, powerFast, powerSlow]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Mass" value={mass} min={0.5} max={10} step={0.5} unit="kg" onChange={setMass} color="cyan" />
      <SliderControl label="Height" value={height} min={1} max={5} step={0.5} unit="m" onChange={setHeight} color="amber" />
      <SliderControl label="Fast lift time" value={fastTime} min={0.5} max={3} step={0.25} unit="s" onChange={setFastTime} color="magenta" />
      <SliderControl label="Slow lift time" value={slowTime} min={2} max={8} step={0.5} unit="s" onChange={setSlowTime} color="magenta" />
      <div className="rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-fuchsia-300 uppercase tracking-wider">P = W / t</div>
        <div>Work same: W = {formatNum(work, 1)} J</div>
        <div>Fast: P = {formatNum(powerFast, 1)} W</div>
        <div>Slow: P = {formatNum(powerSlow, 1)} W</div>
      </div>
    </>
  );

  return (
    <WorkEnergyShell title="Power & Time" subtitle="Same work, different time → different power." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </WorkEnergyShell>
  );
}
