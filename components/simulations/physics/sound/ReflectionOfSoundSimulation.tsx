"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 1) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function ReflectionOfSoundSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angleDeg, setAngleDeg] = useState(35);
  const [showNormal, setShowNormal] = useState(true);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });

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
    const wallX = w * 0.72;
    const sourceX = w * 0.22;
    const sourceY = h / 2;
    const angleRad = (angleDeg * Math.PI) / 180;
    const margin = 40 * dpr;
    let hitY = sourceY + (wallX - sourceX) * Math.tan(angleRad);
    hitY = Math.max(margin, Math.min(h - margin, hitY));

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    // Wall
    ctx.fillStyle = "rgba(71, 85, 105, 0.6)";
    ctx.fillRect(wallX, 0, w - wallX + 2, h);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(wallX, 0, w - wallX, h);
    ctx.fillStyle = "rgba(248, 250, 252, 0.8)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Wall", wallX + 12, 24 * dpr);

    // Normal
    if (showNormal) {
      ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wallX, 0);
      ctx.lineTo(wallX, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText("Normal", wallX - 36, 20 * dpr);
    }

    const dx = wallX - sourceX;
    const dy = hitY - sourceY;
    const incLen = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / incLen;
    const uy = dy / incLen;

    // Incident ray
    ctx.strokeStyle = "rgba(34, 211, 238, 0.95)";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(wallX, hitY);
    ctx.stroke();
    ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("incident", (sourceX + wallX) / 2 - 18, (sourceY + hitY) / 2 - 8);

    // Reflected ray (angle of reflection = angle of incidence)
    const reflUx = ux;
    const reflUy = -uy;
    const reflLen = 120 * dpr;
    ctx.strokeStyle = "rgba(168, 85, 247, 0.95)";
    ctx.beginPath();
    ctx.moveTo(wallX, hitY);
    ctx.lineTo(wallX + reflUx * reflLen, hitY + reflUy * reflLen);
    ctx.stroke();
    ctx.fillStyle = "rgba(168, 85, 247, 0.95)";
    ctx.fillText("reflected", wallX + reflLen * 0.3, hitY + reflUy * reflLen * 0.5 - 8);

    // Source
    ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
    ctx.beginPath();
    ctx.arc(sourceX, sourceY, 12 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0f1a";
    ctx.fillText("Source", sourceX - 18, sourceY + 28 * dpr);

    const angleInc = Math.abs((Math.atan2(-uy, ux) * 180) / Math.PI);
    const angleRef = angleInc;
    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.fillText(`Angle of incidence = Angle of reflection = ${formatNum(angleRef)}°`, 20 * dpr, h - 12 * dpr);
  }, [angleDeg, showNormal]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Angle (to normal)" value={angleDeg} min={10} max={80} step={5} unit="°" onChange={setAngleDeg} color="cyan" />
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showNormal} onChange={(e) => setShowNormal(e.target.checked)} className="rounded border-neutral-500" />
          <span className="text-xs font-medium text-neutral-300">Show normal</span>
        </label>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Law of reflection</div>
        <p className="mt-1 text-xs">Angle of incidence = angle of reflection (measured from the normal).</p>
      </div>
    </>
  );

  return (
    <SoundShell title="Reflection of Sound" subtitle="Sound ray hitting wall; angle i = angle r." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
