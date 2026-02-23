"use client";

import React, { useEffect, useRef, useState } from "react";
import { WorkEnergyShell, SliderControl } from "./WorkEnergyShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const G_EARTH = 9.8;
const G_MOON = 1.6;

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function HeightAndPESimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mass, setMass] = useState(2);
  const [height, setHeight] = useState(4);
  const [planet, setPlanet] = useState<"earth" | "moon">("earth");
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();

  const g = planet === "earth" ? G_EARTH : G_MOON;
  const pe = mass * g * height;
  const peMoon = mass * G_MOON * height;
  const peEarth = mass * G_EARTH * height;

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
    const scale = (h - 2 * margin) / 10;
    const groundY = h - margin;
    const ballY = groundY - height * scale;
    const ballX = w / 2;
    const ballR = 18 * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i <= 10; i++) {
      const y = groundY - i * scale;
      ctx.strokeStyle = "rgba(148,163,184,0.2)";
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(w - margin, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(148,163,184,0.7)";
      ctx.font = `${9 * dpr}px system-ui,sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(`${i} m`, margin - 6, y + 4);
    }
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(margin, groundY);
    ctx.lineTo(w - margin, groundY);
    ctx.stroke();
    ctx.fillStyle = "rgba(251,191,36,0.9)";
    ctx.shadowColor = "rgba(251,191,36,0.5)";
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.stroke();
    ctx.fillStyle = "rgba(248,250,252,0.95)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`PE = mgh = ${formatNum(pe, 1)} J`, w / 2, margin - 10);
  }, [mass, height, planet, pe]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Mass" value={mass} min={0.5} max={10} step={0.5} unit="kg" onChange={setMass} color="cyan" />
      <SliderControl label="Height" value={height} min={0.5} max={10} step={0.5} unit="m" onChange={setHeight} color="amber" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Planet</label>
        <select value={planet} onChange={(e) => setPlanet(e.target.value as "earth" | "moon")}  aria-label="Toggle reflection insight"className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="earth">Earth</option>
          <option value="moon">Moon</option>
        </select>
      </div>
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-amber-300 uppercase tracking-wider">PE = mgh</div>
        <div>Earth: PE = {formatNum(peEarth, 1)} J</div>
        <div>Moon: PE = {formatNum(peMoon, 1)} J</div>
      </div>
    </>
  );

  return (
    <WorkEnergyShell title="Height & PE" subtitle="Lift object. PE = mgh; compare Earth vs Moon." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </WorkEnergyShell>
  );
}
