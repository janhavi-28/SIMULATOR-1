"use client";

import React, { useEffect, useRef, useState } from "react";
import { WorkEnergyShell, SliderControl } from "./WorkEnergyShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const G = 9.8;

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function EnergyTransformationSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mass, setMass] = useState(1);
  const [height, setHeight] = useState(5);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });
  const { elapsedTime, hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();

  const duration = 4;
  const t = isAnimating ? Math.min(elapsedTime, duration) : 0;
  const progress = duration > 0 ? t / duration : 0;
  const h = height * (1 - progress);
  const v = (height * 2 * G) ** 0.5 * (progress ** 0.5);
  const ke = 0.5 * mass * v * v;
  const pe = mass * G * h;
  const total = ke + pe;

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
    const margin = 40 * dpr;
    const scale = (ch - 2 * margin) / height;
    const groundY = ch - margin;
    const ballY = groundY - h * scale;
    const ballX = w / 2;
    const ballR = 14 * dpr;

    ctx.clearRect(0, 0, w, ch);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, ch);
    ctx.strokeStyle = "rgba(148,163,184,0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= height; i++) {
      const y = groundY - i * scale;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(w - margin, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.beginPath();
    ctx.moveTo(margin, groundY);
    ctx.lineTo(w - margin, groundY);
    ctx.stroke();
    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Ground", w - margin - 40, groundY + 14);

    ctx.fillStyle = "rgba(125,211,252,0.9)";
    ctx.shadowColor = "rgba(34,211,238,0.5)";
    ctx.shadowBlur = isAnimating ? 8 * dpr : 0;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.stroke();

    const maxE = mass * G * height + 1;
    const barW = 10 * dpr;
    const barH = 80 * dpr;
    const bx = margin;
    ctx.fillStyle = "rgba(34,211,238,0.2)";
    ctx.fillRect(bx, margin, barW, barH);
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    ctx.fillRect(bx, margin + barH * (1 - ke / maxE), barW, barH * (ke / maxE));
    ctx.strokeRect(bx, margin, barW, barH);
    ctx.fillStyle = "rgba(251,191,36,0.2)";
    ctx.fillRect(bx + barW + 6, margin, barW, barH);
    ctx.fillStyle = "rgba(251,191,36,0.9)";
    ctx.fillRect(bx + barW + 6, margin + barH * (1 - pe / maxE), barW, barH * (pe / maxE));
    ctx.strokeRect(bx + barW + 6, margin, barW, barH);
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillText("KE", bx, margin - 2);
    ctx.fillText("PE", bx + barW + 6, margin - 2);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.fillText(`Total E = ${formatNum(total, 1)} J (constant)`, margin, ch - 8 * dpr);
  }, [mass, height, h, ke, pe, total, isAnimating]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Mass" value={mass} min={0.5} max={5} step={0.5} unit="kg" onChange={setMass} color="cyan" />
      <SliderControl label="Height" value={height} min={1} max={10} step={0.5} unit="m" onChange={setHeight} color="amber" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Live</div>
        <div className="text-cyan-200">KE = ½mv² = <span className="font-mono text-cyan-300">{formatNum(ke, 1)}</span> J</div>
        <div className="text-amber-200">PE = mgh = <span className="font-mono text-amber-300">{formatNum(pe, 1)}</span> J</div>
        <div className="text-neutral-300">Total = <span className="font-mono">{formatNum(total, 1)}</span> J</div>
      </div>
    </>
  );

  return (
    <WorkEnergyShell title="Energy Transformation" subtitle="Height ↔ speed. KE + PE = constant." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </WorkEnergyShell>
  );
}
