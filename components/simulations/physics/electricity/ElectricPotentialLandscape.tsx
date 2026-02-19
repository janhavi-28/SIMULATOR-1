"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ElectricityShell, SliderControl } from "./ElectricityShell";
import { useSimulationLifecycle } from "./useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function ElectricPotentialLandscape() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vHigh, setVHigh] = useState(12);
  const [vLow, setVLow] = useState(0);
  const [testCharge, setTestCharge] = useState(1);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });

  const { elapsedTime, hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();
  const simTime = elapsedTime;

  const vDiff = vHigh - vLow;
  const deltaU = useMemo(() => testCharge * vDiff, [testCharge, vDiff]);

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
    const margin = 40 * dpr;
    const plotW = w - 2 * margin;
    const plotH = h - 2 * margin;
    const vMin = Math.min(vLow, vHigh);
    const vMax = Math.max(vLow, vHigh);
    const vRange = vMax - vMin || 1;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    const gridStep = 24 * dpr;
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const toY = (v: number) => margin + plotH * (1 - (v - vMin) / vRange);
    const toX = (t: number) => margin + t * plotW;

    for (let i = 0; i <= 8; i++) {
      const v = vMin + (vRange * i) / 8;
      const y = toY(v);
      ctx.strokeStyle = "rgba(59,130,246,0.25)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(w - margin, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(148,163,184,0.8)";
      ctx.font = `${9 * dpr}px system-ui,sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(formatNum(v) + " V", margin - 6 * dpr, y + 4);
    }

    ctx.strokeStyle = "rgba(59,130,246,0.9)";
    ctx.lineWidth = 2.5 * dpr;
    ctx.shadowColor = "rgba(59,130,246,0.5)";
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(vHigh));
    ctx.lineTo(toX(1), toY(vLow));
    ctx.stroke();
    ctx.shadowBlur = 0;

    const ballT = 0.3 + 0.4 * (isAnimating ? 0.5 + 0.5 * Math.sin(simTime * 0.8) : 0);
    const ballV = vHigh + (vLow - vHigh) * ballT;
    const ballX = toX(ballT);
    const ballY = toY(ballV);
    const grad = ctx.createRadialGradient(ballX - 8, ballY - 8, 0, ballX, ballY, 18 * dpr);
    grad.addColorStop(0, "#93c5fd");
    grad.addColorStop(0.6, "#3b82f6");
    grad.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(59,130,246,0.7)";
    ctx.shadowBlur = 10 * dpr;
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("High V", toX(0) + 4 * dpr, toY(vHigh) - 4 * dpr);
    ctx.fillText("Low V", toX(1) - 28 * dpr, toY(vLow) + 14 * dpr);
    ctx.fillText("Test charge: ΔU = q·ΔV", margin, h - 8 * dpr);
  }, [vHigh, vLow, testCharge, simTime, isAnimating]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Voltage at high point" value={vHigh} min={0} max={24} step={1} unit="V" onChange={setVHigh} color="blue" />
      <SliderControl label="Voltage at low point" value={vLow} min={0} max={24} step={1} unit="V" onChange={setVLow} color="blue" />
      <SliderControl label="Test charge q" value={testCharge} min={0.5} max={5} step={0.5} unit="C" onChange={setTestCharge} color="violet" />
      <div className="rounded-lg border border-blue-500/25 bg-blue-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-blue-300 uppercase tracking-wider">Energy</div>
        <div className="font-mono">ΔU = q × ΔV = {testCharge} × {vDiff} = {formatNum(deltaU, 1)} J</div>
        <div className="text-xs text-neutral-400">Equipotential lines shown (equal V).</div>
      </div>
      <p className="text-[11px] text-neutral-500">Test charge rolls high → low potential; energy converts as q·ΔV.</p>
    </>
  );

  return (
    <ElectricityShell
      title="Electric Potential Landscape"
      subtitle="Height = potential. Equipotential lines; test charge moves high → low."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </ElectricityShell>
  );
}
