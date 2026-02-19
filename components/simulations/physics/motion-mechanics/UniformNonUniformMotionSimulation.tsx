"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

export default function UniformNonUniformMotionSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [uniform, setUniform] = useState(true);
  const [simTime, setSimTime] = useState(0);
  const [v0, setV0] = useState(0.1);
  const [accel, setAccel] = useState(0.03);
  const lastTsRef = useRef<number | null>(null);
  const trailRef = useRef<{ x: number; t: number }[]>([]);

  const x = uniform ? v0 * simTime : v0 * simTime + 0.5 * accel * simTime * simTime;
  const v = uniform ? v0 : v0 + accel * simTime;

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
    trailRef.current = [...trailRef.current.slice(-60), { x, t: simTime }];
  }, [x, simTime]);

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
    const pad = 28 * dpr;
    const plotW = w - 2 * pad;
    const plotH = (h - 2 * pad) / 2;
    const trail = trailRef.current;
    const tMax = Math.max(4, simTime * 1.2);

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const toPx = (t: number, pos: number, isGraph: boolean) => {
      if (isGraph) return { x: pad + (t / tMax) * plotW, y: pad + plotH - (pos / (tMax * 0.2)) * plotH };
      return { x: pad + (pos / (tMax * 0.2)) * plotW, y: pad + plotH * 0.5 };
    };

    ctx.strokeStyle = "rgba(56,189,248,0.2)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    for (let i = 0; i < trail.length - 1; i++) {
      const a = toPx(trail[i].t, trail[i].x, false);
      const b = toPx(trail[i + 1].t, trail[i + 1].x, false);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    const objPx = toPx(simTime, x, false);
    ctx.fillStyle = "#22d3ee";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12 * dpr;
    ctx.beginPath();
    ctx.arc(objPx.x, objPx.y, 12 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(148,163,184,0.4)";
    ctx.strokeRect(pad, pad + plotH, plotW, plotH - 20 * dpr);
    ctx.fillStyle = "rgba(226,232,240,0.8)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText("Position–time (x–t)", pad, pad + plotH - 4);
    ctx.fillText("time →", pad + plotW - 30, pad + 2 * plotH - 8);

    ctx.beginPath();
    for (let i = 0; i < trail.length - 1; i++) {
      const a = toPx(trail[i].t, trail[i].x, true);
      const b = toPx(trail[i + 1].t, trail[i + 1].x, true);
      if (i === 0) ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2.5 * dpr;
    ctx.stroke();

    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.fillText(uniform ? "Uniform: equal spacing" : "Non-uniform: changing spacing", pad, h - 10);
  }, [uniform, simTime, x, v]);

  return (
    <SimulatorShell
      title="Uniform and Non-uniform Motion"
      subtitle="Toggle: constant speed vs changing speed. Position–time graph below."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300 block">Motion type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUniform(true)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition ${uniform ? "border-cyan-400 bg-cyan-500/20 text-white" : "border-neutral-600 bg-neutral-800/60 text-neutral-400"}`}
              >
                Uniform
              </button>
              <button
                type="button"
                onClick={() => setUniform(false)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition ${!uniform ? "border-cyan-400 bg-cyan-500/20 text-white" : "border-neutral-600 bg-neutral-800/60 text-neutral-400"}`}
              >
                Non-uniform
              </button>
            </div>
          </div>
          <SliderControl label="v₀" value={v0} min={0.03} max={0.2} step={0.01} unit="" onChange={setV0} />
          {!uniform && <SliderControl label="a" value={accel} min={0.01} max={0.06} step={0.005} unit="" onChange={setAccel} color="amber" />}
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm">
            <div>Position x = {uniform ? "v₀·t" : "v₀·t + ½a·t²"}</div>
            <div className="mt-0.5 text-cyan-300 font-mono">x = {x.toFixed(3)}  v = {v.toFixed(3)}</div>
          </div>
        </>
      }
    >
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }} />
      </div>
    </SimulatorShell>
  );
}
