"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const V = 343; // m/s
function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function EchoAndReverberationSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [distance, setDistance] = useState(50);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const t = isAnimating ? elapsedTime : 0;

  const delay = (2 * distance) / V; // there and back
  const isEcho = delay >= 0.1;
  const progress = Math.min(1, t / (delay || 0.001));

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
    const margin = 32 * dpr;
    const barW = w - 2 * margin;
    const barH = 20 * dpr;
    const barY = h / 2 - barH - 20 * dpr;
    const maxD = 150;
    const normD = distance / maxD;
    const wallX = margin + normD * barW;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    // Distance bar (source to wall)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.strokeRect(margin, barY, barW, barH);
    ctx.fillStyle = "rgba(55, 65, 81, 0.5)";
    ctx.fillRect(margin, barY, barW, barH);
    ctx.fillStyle = "rgba(34, 211, 238, 0.6)";
    ctx.fillRect(margin, barY, (wallX - margin), barH);

    ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
    ctx.beginPath();
    ctx.arc(margin + 8, barY + barH / 2, 10 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("You", margin, barY + barH / 2 + 20 * dpr);

    ctx.fillStyle = "rgba(71, 85, 105, 0.9)";
    ctx.fillRect(wallX - 4, barY - 4, 12, barH + 8);
    ctx.fillText("Wall", wallX - 8, barY - 12);

    // Stopwatch / delay counter
    const swY = h / 2 + 20 * dpr;
    ctx.fillStyle = "rgba(34, 211, 238, 0.15)";
    ctx.fillRect(margin, swY - 16 * dpr, 180 * dpr, 44 * dpr);
    ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
    ctx.strokeRect(margin, swY - 16 * dpr, 180 * dpr, 44 * dpr);
    ctx.fillStyle = "rgba(248, 250, 252, 0.95)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Echo delay: t = 2d/v", margin + 8, swY - 2 * dpr);
    ctx.font = `${14 * dpr}px monospace`;
    ctx.fillText(`${formatNum(delay * 1000, 1)} ms`, margin + 8, swY + 18 * dpr);

    ctx.fillStyle = isEcho ? "rgba(34, 211, 238, 0.9)" : "rgba(251, 191, 36, 0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(isEcho ? "Distinct echo (delay ≥ 0.1 s)" : "Reverberation (delay < 0.1 s)", margin, h - 24 * dpr);
    ctx.fillText(`d = ${distance} m   v = ${V} m/s   t = 2d/v = ${formatNum(delay, 3)} s`, margin, h - 10 * dpr);
  }, [distance, delay, isEcho, progress, t]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Distance to wall d" value={distance} min={5} max={150} step={5} unit="m" onChange={setDistance} color="cyan" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Delay</div>
        <div className="font-mono">t = 2d/v = {formatNum(delay * 1000, 1)} ms</div>
        <p className="text-xs mt-2">Echo: distinct if t ≥ 0.1 s. Reverberation: many reflections, t &lt; 0.1 s.</p>
      </div>
    </>
  );

  return (
    <SoundShell title="Echo and Reverberation" subtitle="Distance to wall; time delay; echo vs reverberation." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
