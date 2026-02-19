"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

type Medium = "solid" | "liquid" | "gas";

export default function NatureOfSoundSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [medium, setMedium] = useState<Medium>("gas");
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const t = isAnimating ? elapsedTime : 0;

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
    const margin = 24 * dpr;
    const cx = w / 2;
    const cy = h / 2;
    const omega = 2 * Math.PI * 3;
    const sourceAmp = 18 * dpr;
    const N = medium === "solid" ? 12 : medium === "liquid" ? 8 : 6;
    const spacing = (Math.min(w, h) * 0.35) / (N + 1);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    // Vibrating source (left)
    const sx = margin + 40 * dpr;
    const sy = cy;
    const sourceDisp = isAnimating ? sourceAmp * Math.sin(omega * t) : 0;
    ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
    ctx.beginPath();
    ctx.arc(sx + sourceDisp, sy, 14 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#0a0f1a";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("source", sx - 12, sy + 28 * dpr);

    // Medium particles (to the right of source)
    for (let i = 0; i < N; i++) {
      const dist = (i + 1) * spacing;
      const delay = dist / (80 * dpr);
      const amp = sourceAmp * Math.exp(-dist * 0.008) * (medium === "solid" ? 1.2 : medium === "liquid" ? 0.9 : 0.7);
      const disp = isAnimating ? amp * Math.sin(omega * t - delay * 4) : 0;
      const px = sx + 30 * dpr + dist + disp;
      const py = cy;
      const r = medium === "solid" ? 6 : medium === "liquid" ? 5 : 4;
      ctx.fillStyle = "rgba(34, 211, 238, 0.85)";
      ctx.beginPath();
      ctx.arc(px, py, r * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`Medium: ${medium} — particles vibrate in phase lag`, margin, h - 12 * dpr);
  }, [medium, isAnimating, t]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Medium</label>
        <select value={medium} onChange={(e) => setMedium(e.target.value as Medium)} className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="gas">Gas (e.g. air)</option>
          <option value="liquid">Liquid (e.g. water)</option>
          <option value="solid">Solid (e.g. steel)</option>
        </select>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Key idea</div>
        <p className="mt-1 text-xs">Sound needs a medium. The source vibrates; particles pass the disturbance along. No sound in vacuum.</p>
      </div>
    </>
  );

  return (
    <SoundShell title="Nature of Sound" subtitle="Vibrating source and medium particles. Switch medium." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
