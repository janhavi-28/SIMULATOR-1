"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

export default function MotionSubtopicSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [x0, setX0] = useState(0.2);
  const [y0, setY0] = useState(0.5);
  const [vx, setVx] = useState(0.15);
  const [vy, setVy] = useState(-0.08);
  const trailRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const lastTsRef = useRef<number | null>(null);

  const x = x0 + vx * simTime;
  const y = y0 + vy * simTime;

  useEffect(() => {
    if (!hasLaunched || paused) return;
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      setSimTime((t) => t + dt);
    };
    lastTsRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused]);

  useEffect(() => {
    if (simTime < 0.02) trailRef.current = [];
    trailRef.current = [...trailRef.current.slice(-80), { x, y, t: simTime }];
  }, [x, y, simTime]);

  const launch = () => {
    setSimTime(0);
    setPaused(false);
    setHasLaunched(true);
    trailRef.current = [];
  };
  const reset = () => {
    setSimTime(0);
    setPaused(true);
    setHasLaunched(false);
    trailRef.current = [];
  };

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const dpr = canvas.width / (containerRef.current?.getBoundingClientRect().width || 1);

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const pad = 24 * dpr;
    const plotLeft = pad;
    const plotRight = w - pad;
    const plotTop = pad;
    const plotBottom = h - pad;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const toPx = (nx: number, ny: number) => ({
      x: plotLeft + (nx + 0.5) * plotW,
      y: plotTop + (1 - ny) * plotH,
    });

    ctx.strokeStyle = "rgba(56,189,248,0.15)";
    ctx.lineWidth = 1 * dpr;
    for (let i = 0; i <= 4; i++) {
      const gx = plotLeft + (i / 4) * plotW;
      ctx.beginPath();
      ctx.moveTo(gx, plotTop);
      ctx.lineTo(gx, plotBottom);
      ctx.stroke();
      const gy = plotTop + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(plotLeft, gy);
      ctx.lineTo(plotRight, gy);
      ctx.stroke();
    }

    const trail = trailRef.current;
    for (let i = 0; i < trail.length; i++) {
      const { x: tx, y: ty } = toPx(trail[i].x, trail[i].y);
      const alpha = 0.15 + (i / trail.length) * 0.5;
      ctx.fillStyle = `rgba(34,211,238,${alpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 3 * dpr + (i / trail.length) * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const { x: objX, y: objY } = toPx(x, y);
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 14 * dpr;
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(objX, objY, 12 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    const startPx = toPx(x0, y0);
    ctx.strokeStyle = "rgba(74,222,128,0.6)";
    ctx.lineWidth = 2 * dpr;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(startPx.x, startPx.y);
    ctx.lineTo(objX, objY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(74,222,128,0.9)";
    ctx.beginPath();
    ctx.arc(startPx.x, startPx.y, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.textAlign = "left";
    ctx.fillText(`t = ${simTime.toFixed(2)} s`, plotLeft, plotTop - 8);
    ctx.fillText(`x = ${(x * 100).toFixed(0)}  y = ${(y * 100).toFixed(0)}`, plotLeft, plotBottom + 18);
  }, [x0, y0, x, y, simTime, hasLaunched]);

  return (
    <SimulatorShell
      title="Motion"
      subtitle="Position changes with time. Launch and watch the trail."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <div className="space-y-1 text-[10px] text-neutral-500 uppercase tracking-wide">Initial position</div>
          <SliderControl label="x₀" value={x0} min={0} max={1} step={0.05} unit="" onChange={setX0} color="cyan" />
          <SliderControl label="y₀" value={y0} min={0} max={1} step={0.05} unit="" onChange={setY0} color="cyan" />
          <div className="space-y-1 text-[10px] text-neutral-500 uppercase tracking-wide mt-2">Velocity</div>
          <SliderControl label="vₓ" value={vx} min={-0.3} max={0.3} step={0.01} unit="" onChange={setVx} color="amber" />
          <SliderControl label="vᵧ" value={vy} min={-0.2} max={0.2} step={0.01} unit="" onChange={setVy} color="amber" />
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm mt-2">
            <div className="text-neutral-300">Time <span className="font-mono text-cyan-300">{simTime.toFixed(2)} s</span></div>
            <div className="text-neutral-300 mt-0.5">Position updates continuously when playing.</div>
          </div>
          <p className="text-[11px] text-neutral-500">Green dot = start. Cyan = current. Line = displacement so far.</p>
        </>
      }
    >
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }} />
      </div>
    </SimulatorShell>
  );
}
