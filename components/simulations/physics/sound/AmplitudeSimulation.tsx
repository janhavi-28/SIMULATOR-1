"use client";

import React, { useEffect, useRef, useState } from "react";
import { SoundShell, SliderControl } from "./SoundShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const SPEED = 160;
const FREQ = 2;

export default function AmplitudeSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [amplitude, setAmplitude] = useState(0.5);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const t = isAnimating ? elapsedTime : 0;
  const wavelength = SPEED / FREQ;
  const k = (2 * Math.PI) / wavelength;
  const omega = 2 * Math.PI * FREQ;

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
    const marginX = 32 * dpr;
    const marginY = 36 * dpr;
    const graphW = w - 2 * marginX;
    const graphH = h - 2 * marginY;
    const cy = marginY + graphH / 2;
    const A = amplitude * graphH * 0.4;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const x = marginX + (i / 100) * graphW;
      const phase = k * (i / 100) * graphW - omega * t;
      const y = cy + A * Math.sin(phase);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Loudness bar (stylized)
    const barW = 80 * dpr;
    const barH = 12 * dpr;
    const barX = marginX + graphW - barW - 8;
    const barY = marginY - 8;
    ctx.fillStyle = "rgba(55, 65, 81, 0.8)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = amplitude > 0.5 ? "rgba(251, 191, 36, 0.9)" : "rgba(34, 211, 238, 0.8)";
    ctx.fillRect(barX, barY, barW * amplitude, barH);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillText("loudness", barX, barY + barH + 12 * dpr);

    ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`Amplitude = ${amplitude.toFixed(2)} (∝ energy)`, marginX, h - 10 * dpr);
  }, [amplitude, isAnimating, t, k, omega]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Amplitude" value={amplitude} min={0.1} max={1} step={0.05} unit="—" onChange={setAmplitude} color="violet" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Key insight</div>
        <p className="mt-1 text-xs">Larger amplitude → louder sound and more energy. The bar shows relative loudness.</p>
      </div>
    </>
  );

  return (
    <SoundShell title="Amplitude" subtitle="Adjust amplitude; see displacement and loudness indicator." onLaunch={launch} onPause={pause} onReset={reset} paused={isPaused} hasLaunched={hasLaunched} sidebar={sidebar}>
      <div ref={containerRef} className="w-full h-full min-h-[280px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </SoundShell>
  );
}
