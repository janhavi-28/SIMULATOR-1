"use client";

import React, { useEffect, useRef, useState } from "react";
import { WorkEnergyShell, SliderControl } from "./WorkEnergyShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function WorkByForceSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [force, setForce] = useState(20);
  const [displacement, setDisplacement] = useState(4);
  const [angleDeg, setAngleDeg] = useState(0);
  const [surface, setSurface] = useState<"smooth" | "rough">("smooth");
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();

  const angleRad = (angleDeg * Math.PI) / 180;
  const work = force * displacement * Math.cos(angleRad);
  const zeroWork = Math.abs(Math.cos(angleRad)) < 0.01;

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
    const boxW = 50 * dpr;
    const boxH = 36 * dpr;
    const cy = h / 2;
    const left = margin;
    const right = w - margin;
    const progress = isAnimating ? 0.3 + 0.4 * Math.min(1, 1) : 0.3;
    const boxX = left + (right - left - boxW) * progress;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = surface === "rough" ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash(surface === "rough" ? [4, 4] : []);
    ctx.beginPath();
    ctx.moveTo(left, cy + boxH / 2 + 4);
    ctx.lineTo(right, cy + boxH / 2 + 4);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(251,191,36,0.2)";
    ctx.strokeStyle = "rgba(251,191,36,0.6)";
    ctx.strokeRect(boxX, cy - boxH / 2, boxW, boxH);
    ctx.fillRect(boxX, cy - boxH / 2, boxW, boxH);

    const arrowLen = 40 * dpr;
    const ax = boxX + boxW;
    const ay = cy;
    const ux = Math.cos(angleRad);
    const uy = -Math.sin(angleRad);
    ctx.strokeStyle = "rgba(249,115,22,0.95)";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + ux * arrowLen, ay + uy * arrowLen);
    ctx.stroke();
    ctx.fillStyle = "rgba(249,115,22,0.95)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("F", ax + ux * arrowLen + 4, ay + uy * arrowLen);

    ctx.strokeStyle = "rgba(34,211,238,0.6)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(left, cy + boxH / 2 + 10);
    ctx.lineTo(boxX + boxW, cy + boxH / 2 + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("s (displacement)", (left + boxX + boxW) / 2 - 30, cy + boxH / 2 + 24);

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.fillText(`W = F·s·cos θ = ${formatNum(work, 1)} J`, margin, h - 12 * dpr);
    if (zeroWork) ctx.fillText("Force ⟂ displacement → zero work", margin, h - 2);
  }, [force, displacement, angleDeg, surface, isAnimating]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Force" value={force} min={1} max={50} step={1} unit="N" onChange={setForce} color="orange" />
      <SliderControl label="Displacement" value={displacement} min={0.5} max={10} step={0.5} unit="m" onChange={setDisplacement} color="blue" />
      <SliderControl label="Angle (F to s)" value={angleDeg} min={0} max={180} step={15} unit="°" onChange={setAngleDeg} color="violet" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Surface</label>
        <select value={surface} onChange={(e) => setSurface(e.target.value as "smooth" | "rough")} aria-label="Surface type selection" className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="smooth">Smooth</option>
          <option value="rough">Rough</option>
        </select>
      </div>
      <div className="rounded-lg border border-orange-500/25 bg-orange-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-orange-300 uppercase tracking-wider">Work</div>
        <div className="font-mono">W = F·s·cos θ = {formatNum(work, 2)} J</div>
        {zeroWork && <div className="text-xs text-amber-300">Force ⟂ displacement → zero work</div>}
      </div>
    </>
  );

  return (
    <WorkEnergyShell title="Work by Force" subtitle="Push/pull: force, displacement, angle. W = F·s·cos θ." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </WorkEnergyShell>
  );
}
