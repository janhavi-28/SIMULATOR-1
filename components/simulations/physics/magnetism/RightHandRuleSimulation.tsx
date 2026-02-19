"use client";

import React, { useEffect, useRef, useState } from "react";
import { MagnetismShell, SliderControl } from "./MagnetismShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function RightHandRuleSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState(1);
  const [B, setB] = useState(0.5);
  const [turns, setTurns] = useState(10);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle();

  const t = isAnimating ? elapsedTime : 0;
  const angle = t * speed * 2;
  const emf = B * turns * speed * Math.cos(angle);

  useEffect(() => {
    const c = containerRef.current;
    const canvas = canvasRef.current;
    if (!c || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    });
    ro.observe(c);
    const rect = c.getBoundingClientRect();
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
    const cx = w * 0.35;
    const cy = h * 0.5;
    const r = 55 * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0c1222";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(248,113,113,0.5)";
    ctx.fillStyle = "rgba(56,189,248,0.3)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.4, r * 0.6, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(251,191,36,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.4, r * 0.6, angle, 0, Math.PI * 2);
    ctx.stroke();

    const arrowLen = 25 * dpr;
    const ix = cx + Math.cos(angle) * r * 1.4;
    const iy = cy + Math.sin(angle) * r * 0.6;
    const indDir = emf >= 0 ? 1 : -1;
    ctx.strokeStyle = "rgba(34,197,94,0.95)";
    ctx.beginPath();
    ctx.moveTo(ix - indDir * arrowLen, iy);
    ctx.lineTo(ix + indDir * arrowLen, iy);
    ctx.stroke();
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Induced I", ix + indDir * arrowLen + 6, iy + 4);

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.fillText(`EMF (arb.) ≈ ${formatNum(emf, 2)}   N = ${turns}`, w * 0.55, h - 14 * dpr);
  }, [speed, B, turns, isAnimating, elapsedTime, angle, emf]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Rotation speed" value={speed} min={0.2} max={3} step={0.2} unit="×" onChange={setSpeed} color="cyan" />
      <SliderControl label="Field B" value={B} min={0.2} max={1.2} step={0.1} unit="T" onChange={setB} color="violet" />
      <SliderControl label="Coil turns N" value={turns} min={5} max={30} step={1} unit="" onChange={setTurns} color="amber" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Right-hand rule</div>
        <p className="mt-1 text-xs">Thumb = motion, Forefinger = B, Middle = induced current.</p>
      </div>
    </>
  );

  return (
    <MagnetismShell
      title="Fleming's Right-Hand Rule"
      subtitle="Rotating coil: induced EMF and current direction."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div ref={containerRef} className="w-full h-full min-h-0 flex-1 flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </MagnetismShell>
  );
}
