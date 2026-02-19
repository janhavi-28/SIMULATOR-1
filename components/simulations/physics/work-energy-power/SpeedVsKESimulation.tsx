"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { WorkEnergyShell, SliderControl } from "./WorkEnergyShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function SpeedVsKESimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [velocity, setVelocity] = useState(3);
  const [mass1, setMass1] = useState(1);
  const [mass2, setMass2] = useState(2);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset } = useSimulationLifecycle();

  const ke1 = 0.5 * mass1 * velocity * velocity;
  const ke2 = 0.5 * mass2 * velocity * velocity;
  const keDoubleSpeed = 0.5 * mass1 * (2 * velocity) * (2 * velocity);
  const ratio = keDoubleSpeed / (ke1 || 1);

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
    const maxKE = Math.max(ke1, ke2, keDoubleSpeed, 1);
    const barW = (w - 2 * margin) / 4;
    const barH = 24 * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(148,163,184,0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = margin + (h - 2 * margin) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(w - margin, y);
      ctx.stroke();
    }

    const drawBar = (x: number, value: number, label: string, color: string) => {
      const norm = value / maxKE;
      const height = Math.max(4, barH * norm);
      ctx.fillStyle = color;
      ctx.fillRect(x, h - margin - height, barW - 8, height);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(x, h - margin - height, barW - 8, height);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `${9 * dpr}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, x + (barW - 8) / 2, h - margin + 14);
      ctx.fillText(formatNum(value, 1) + " J", x + (barW - 8) / 2, h - margin - height - 4);
    };

    drawBar(margin, ke1, `m=${mass1} kg`, "rgba(34,211,238,0.8)");
    drawBar(margin + barW, ke2, `m=${mass2} kg`, "rgba(34,211,238,0.5)");
    drawBar(margin + barW * 2, keDoubleSpeed, "2× speed", "rgba(34,211,238,0.95)");
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("Doubling speed → 4× KE", margin, margin - 8);
  }, [velocity, mass1, mass2, ke1, ke2, keDoubleSpeed]);

  const maxKE = Math.max(ke1, ke2, keDoubleSpeed, 1);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Speed v" value={velocity} min={0.5} max={8} step={0.5} unit="m/s" onChange={setVelocity} color="cyan" />
      <SliderControl label="Mass 1" value={mass1} min={0.5} max={5} step={0.5} unit="kg" onChange={setMass1} color="cyan" />
      <SliderControl label="Mass 2" value={mass2} min={0.5} max={5} step={0.5} unit="kg" onChange={setMass2} color="violet" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">KE = ½mv²</div>
        <div>Object 1: KE = {formatNum(ke1, 1)} J</div>
        <div>Object 2: KE = {formatNum(ke2, 1)} J</div>
        <div className="text-xs">2× speed → 4× KE</div>
      </div>
    </>
  );

  return (
    <WorkEnergyShell title="Speed vs KE" subtitle="Different masses & speeds. Doubling speed → 4× KE." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </WorkEnergyShell>
  );
}
