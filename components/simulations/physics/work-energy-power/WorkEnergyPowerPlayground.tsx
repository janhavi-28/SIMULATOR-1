"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { WorkEnergyShell, SliderControl } from "./WorkEnergyShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const G_EARTH = 9.8;
const G_MOON = 1.6;

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function WorkEnergyPowerPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mass, setMass] = useState(2);
  const [force, setForce] = useState(20);
  const [distance, setDistance] = useState(5);
  const [angleDeg, setAngleDeg] = useState(30);
  const [gravityMode, setGravityMode] = useState<"earth" | "moon">("earth");
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });

  const g = gravityMode === "earth" ? G_EARTH : G_MOON;
  const { elapsedTime, hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();

  const duration = 6;
  const t = isAnimating ? Math.min(elapsedTime, duration) : 0;
  const progress = duration > 0 ? t / duration : 0;
  const s = distance * progress;
  const v = distance / duration;
  const h = distance * Math.sin((angleDeg * Math.PI) / 180);
  const heightAt = h * (1 - progress);
  const workDone = force * s;
  const ke = 0.5 * mass * v * v;
  const pe = mass * g * heightAt;
  const totalEnergy = ke + pe;
  const power = t > 0 ? workDone / t : 0;

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
    const margin = 36 * dpr;
    const slopeW = w - 2 * margin;
    const slopeH = Math.min(180, slopeW * 0.5) * dpr;
    const angleRad = (angleDeg * Math.PI) / 180;
    const inclineLen = slopeH / Math.sin(angleRad) || slopeH;
    const x0 = margin;
    const y0 = h - margin - slopeH;
    const x1 = x0 + inclineLen * Math.cos(angleRad);
    const y1 = h - margin;
    const blockSize = 24 * dpr;
    const blockX = x0 + (x1 - x0) * progress + Math.cos(angleRad) * blockSize;
    const blockY = y0 + (y1 - y0) * progress - Math.sin(angleRad) * blockSize;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    const gridStep = 20 * dpr;
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

    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(251,191,36,0.9)";
    ctx.strokeStyle = "rgba(251,191,36,0.6)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.rect(blockX - blockSize / 2, blockY - blockSize / 2, blockSize, blockSize);
    ctx.fill();
    ctx.stroke();

    const maxE = Math.max(totalEnergy, ke + mass * g * h, 1);
    const barW = 8 * dpr;
    const barH = 60 * dpr;
    const keNorm = ke / maxE;
    const peNorm = pe / maxE;
    const bx = w - margin - barW * 3 - 8 * dpr;
    const by = margin;
    ctx.fillStyle = "rgba(34,211,238,0.25)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    ctx.fillRect(bx, by + barH * (1 - keNorm), barW, barH * keNorm);
    ctx.strokeStyle = "rgba(34,211,238,0.5)";
    ctx.strokeRect(bx, by, barW, barH);
    ctx.fillStyle = "rgba(251,191,36,0.25)";
    ctx.fillRect(bx + barW + 4, by, barW, barH);
    ctx.fillStyle = "rgba(251,191,36,0.9)";
    ctx.fillRect(bx + barW + 4, by + barH * (1 - peNorm), barW, barH * peNorm);
    ctx.strokeStyle = "rgba(251,191,36,0.5)";
    ctx.strokeRect(bx + barW + 4, by, barW, barH);
    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("KE", bx, by - 2);
    ctx.fillText("PE", bx + barW + 4, by - 2);

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(`W = F·s = ${formatNum(workDone, 1)} J`, margin, h - 8 * dpr);
  }, [angleDeg, progress, ke, pe, totalEnergy, workDone, mass, g, h]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Mass" value={mass} min={0.5} max={10} step={0.5} unit="kg" onChange={setMass} color="cyan" />
      <SliderControl label="Applied force" value={force} min={1} max={50} step={1} unit="N" onChange={setForce} color="orange" />
      <SliderControl label="Distance" value={distance} min={1} max={10} step={0.5} unit="m" onChange={setDistance} color="blue" />
      <SliderControl label="Incline angle" value={angleDeg} min={0} max={60} step={5} unit="°" onChange={setAngleDeg} color="violet" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Gravity</label>
        <select value={gravityMode} onChange={(e) => setGravityMode(e.target.value as "earth" | "moon")} className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="earth">Earth</option>
          <option value="moon">Moon</option>
        </select>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1.5">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Live values</div>
        <div className="text-cyan-200">W = F·s = <span className="font-mono text-cyan-300">{formatNum(workDone, 1)}</span> J</div>
        <div className="text-cyan-200">KE = ½mv² = <span className="font-mono text-cyan-300">{formatNum(ke, 1)}</span> J</div>
        <div className="text-amber-200">PE = mgh = <span className="font-mono text-amber-300">{formatNum(pe, 1)}</span> J</div>
        <div className="text-fuchsia-200">P = W/t = <span className="font-mono text-fuchsia-300">{formatNum(power, 1)}</span> W</div>
        <div className="text-neutral-300 text-xs">Total E = <span className="font-mono">{formatNum(totalEnergy, 1)}</span> J</div>
      </div>
      <p className="text-[11px] text-neutral-500">Time advances only when simulation is running. Energy bars update live.</p>
    </>
  );

  return (
    <WorkEnergyShell
      title="Work–Energy–Power Playground"
      subtitle="Block on incline: work, KE ↔ PE, power. Launch to run."
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
    </WorkEnergyShell>
  );
}
