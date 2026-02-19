"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

export default function SpeedVelocitySimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [speed, setSpeed] = useState(0.12);
  const [angle, setAngle] = useState(0.5);
  const lastTsRef = useRef<number | null>(null);

  const vx = speed * Math.cos(angle * Math.PI * 2);
  const vy = speed * Math.sin(angle * Math.PI * 2);
  const x = 0.5 + vx * simTime;
  const y = 0.5 + vy * simTime;

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

  const launch = () => {
    setSimTime(0);
    setPaused(false);
    setHasLaunched(true);
  };
  const reset = () => {
    setSimTime(0);
    setPaused(true);
    setHasLaunched(false);
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
    const pad = 40 * dpr;
    const plotW = w - 2 * pad;
    const plotH = h - 2 * pad;
    const toPx = (nx: number, ny: number) => ({ x: pad + nx * plotW, y: pad + (1 - ny) * plotH });
    const cx = pad + 0.5 * plotW;
    const cy = pad + 0.5 * plotH;

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const objPx = toPx(Math.max(0.1, Math.min(0.9, x)), Math.max(0.1, Math.min(0.9, y)));
    const scale = Math.min(plotW, plotH) * 0.25;
    const arrowLen = speed * scale * 4;
    const velPx = { x: objPx.x + vx * scale * 2.5, y: objPx.y - vy * scale * 2.5 };

    ctx.strokeStyle = "rgba(148,163,184,0.25)";
    ctx.lineWidth = 1 * dpr;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(pad + (i / 4) * plotW, pad);
      ctx.lineTo(pad + (i / 4) * plotW, h - pad);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad, pad + (i / 4) * plotH);
      ctx.lineTo(w - pad, pad + (i / 4) * plotH);
      ctx.stroke();
    }

    ctx.fillStyle = "#22d3ee";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 14 * dpr;
    ctx.beginPath();
    ctx.arc(objPx.x, objPx.y, 14 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    const thick = 2 + (speed / 0.2) * 2;
    ctx.strokeStyle = "#a78bfa";
    ctx.fillStyle = "#a78bfa";
    ctx.lineWidth = thick * dpr;
    ctx.beginPath();
    ctx.moveTo(objPx.x, objPx.y);
    ctx.lineTo(velPx.x, velPx.y);
    ctx.stroke();
    const ang = Math.atan2(velPx.y - objPx.y, velPx.x - objPx.x);
    const arr = 12 * dpr;
    ctx.beginPath();
    ctx.moveTo(velPx.x, velPx.y);
    ctx.lineTo(velPx.x - arr * Math.cos(ang - 0.35), velPx.y - arr * Math.sin(ang - 0.35));
    ctx.lineTo(velPx.x - arr * Math.cos(ang + 0.35), velPx.y - arr * Math.sin(ang + 0.35));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.textAlign = "left";
    ctx.fillText(`Speed (magnitude) = ${speed.toFixed(2)}`, pad, h - 12);
    ctx.fillText(`Velocity: vₓ=${vx.toFixed(2)} vᵧ=${vy.toFixed(2)}`, pad, h - 12 + 16);
  }, [x, y, vx, vy, speed, angle]);

  return (
    <SimulatorShell
      title="Speed and Velocity"
      subtitle="Speed = magnitude only. Velocity = arrow (magnitude + direction)."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <SliderControl label="Speed (magnitude)" value={speed} min={0.02} max={0.25} step={0.01} unit="" onChange={setSpeed} color="violet" />
          <SliderControl label="Direction (angle)" value={angle} min={0} max={1} step={0.05} unit="" onChange={setAngle} color="amber" />
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm space-y-1">
            <div>Speed = <span className="font-mono text-cyan-300">{speed.toFixed(2)}</span> (no direction)</div>
            <div>Velocity = <span className="font-mono text-cyan-300">({vx.toFixed(2)}, {vy.toFixed(2)})</span></div>
          </div>
          <p className="text-[11px] text-neutral-500">Change direction: velocity arrow rotates, speed stays same.</p>
        </>
      }
    >
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }} />
      </div>
    </SimulatorShell>
  );
}
