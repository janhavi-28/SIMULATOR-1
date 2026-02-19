"use client";

import React, { useEffect, useRef, useState } from "react";
import { MagnetismShell, SliderControl } from "./MagnetismShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function LeftHandRuleSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [B, setB] = useState(0.5);
  const [I, setI] = useState(2);
  const [L, setL] = useState(0.1);
  const [flipField, setFlipField] = useState(false);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle();

  const F = B * I * L;
  const dir = flipField ? -1 : 1;

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
    const cx = w * 0.5;
    const cy = h * 0.5;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0c1222";
    ctx.fillRect(0, 0, w, h);

    const arrow = (x: number, y: number, dx: number, dy: number, color: string, label: string) => {
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const L = 50 * dpr;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ux * L, y + uy * L);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `${11 * dpr}px system-ui,sans-serif`;
      ctx.fillText(label, x + ux * L + 6, y + uy * L + 4);
    };

    ctx.strokeStyle = "rgba(248,113,113,0.6)";
    ctx.fillStyle = "rgba(56,189,248,0.6)";
    ctx.fillRect(cx - 100 * dpr, cy - 50 * dpr, 200 * dpr, 100 * dpr);
    ctx.strokeRect(cx - 100 * dpr, cy - 50 * dpr, 200 * dpr, 100 * dpr);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Conductor (current into/out of screen)", cx - 70 * dpr, cy + 65 * dpr);

    arrow(cx, cy - 55 * dpr, 0, dir * 1, "rgba(56,189,248,0.95)", "B");
    arrow(cx, cy + 55 * dpr, 0, dir * -1, "rgba(56,189,248,0.95)", "");
    arrow(cx + 110 * dpr, cy, -1, 0, "rgba(34,197,94,0.95)", "F");
    arrow(cx - 110 * dpr, cy, 1, 0, "rgba(34,197,94,0.95)", "");

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`F = BIL = ${formatNum(F, 3)} N`, cx - 50 * dpr, h - 14 * dpr);
  }, [B, I, L, flipField]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Magnetic field B" value={B} min={0.1} max={1.5} step={0.1} unit="T" onChange={setB} color="cyan" />
      <SliderControl label="Current I" value={I} min={0.5} max={5} step={0.5} unit="A" onChange={setI} color="amber" />
      <SliderControl label="Length L" value={L} min={0.05} max={0.2} step={0.01} unit="m" onChange={setL} color="violet" />
      <div className="flex items-center gap-2 text-xs text-neutral-300">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={flipField} onChange={(e) => setFlipField(e.target.checked)} className="rounded border-neutral-500" />
          Reverse field (B)
        </label>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">F = BIL</div>
        <p className="mt-1 text-xs">Left hand: Forefinger = B, Middle = I, Thumb = F.</p>
      </div>
    </>
  );

  return (
    <MagnetismShell
      title="Fleming's Left-Hand Rule"
      subtitle="Force on current in magnetic field; F = BIL."
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
