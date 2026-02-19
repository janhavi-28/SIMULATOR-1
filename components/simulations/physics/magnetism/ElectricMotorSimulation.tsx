"use client";

import React, { useEffect, useRef, useState } from "react";
import { MagnetismShell, SliderControl } from "./MagnetismShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function ElectricMotorSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState(2);
  const [B, setB] = useState(0.5);
  const [turns, setTurns] = useState(1);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const angleRef = useRef(0);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle({ onReset: () => (angleRef.current = 0) });

  const torque = B * current * turns * 0.02 * Math.abs(Math.sin(angleRef.current));
  const omega = isAnimating ? 1.5 * torque + 0.5 : 0;
  if (isAnimating) angleRef.current += omega * 0.016;
  const angle = angleRef.current % (Math.PI * 2);

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
    const cx = w * 0.4;
    const cy = h * 0.5;
    const r = 55 * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0c1222";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(56,189,248,0.25)";
    ctx.fillRect(cx - 90 * dpr, cy - 70 * dpr, 180 * dpr, 140 * dpr);
    ctx.strokeStyle = "rgba(248,113,113,0.5)";
    ctx.strokeRect(cx - 90 * dpr, cy - 70 * dpr, 180 * dpr, 140 * dpr);
    ctx.fillStyle = "rgba(248,250,252,0.8)";
    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillText("N", cx - 95 * dpr, cy - 65 * dpr);
    ctx.fillText("S", cx + 85 * dpr, cy - 65 * dpr);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(251,191,36,0.95)";
    ctx.lineWidth = 4;
    ctx.strokeRect(-r * 1.2, -r * 0.5, r * 2.4, r);
    ctx.fillStyle = "rgba(56,189,248,0.3)";
    ctx.fillRect(-r * 1.2, -r * 0.5, r * 2.4, r);
    ctx.beginPath();
    ctx.arc(0, 0, 6 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(34,197,94,0.9)";
    ctx.beginPath();
    ctx.arc(cx - 4 * dpr, cy - 75 * dpr, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4 * dpr, cy - 75 * dpr, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Brushes", cx - 28, cy - 85 * dpr);

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.fillText(`Torque ∝ B·I·N   Speed (arb.) ∝ ${formatNum(omega, 2)}`, w * 0.52, h - 14 * dpr);
  }, [current, B, turns, angle, omega, torque]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Current I" value={current} min={0.5} max={5} step={0.5} unit="A" onChange={setCurrent} color="amber" />
      <SliderControl label="Field B" value={B} min={0.2} max={1.2} step={0.1} unit="T" onChange={setB} color="cyan" />
      <SliderControl label="Turns N" value={turns} min={1} max={5} step={1} unit="" onChange={setTurns} color="violet" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Motor</div>
        <p className="mt-1 text-xs">Torque from F = BIL; commutator keeps rotation in one direction. Power ∝ torque × speed.</p>
      </div>
    </>
  );

  return (
    <MagnetismShell
      title="Electric Motor"
      subtitle="DC motor: coil, commutator, torque and rotation."
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
