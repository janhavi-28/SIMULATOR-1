"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

export default function AccelerationSubtopicSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [vx0, setVx0] = useState(0.08);
  const [vy0, setVy0] = useState(0.05);
  const [ax, setAx] = useState(0.02);
  const [ay, setAy] = useState(-0.03);
  const lastTsRef = useRef<number | null>(null);

  const vx = vx0 + ax * simTime;
  const vy = vy0 + ay * simTime;
  const x = 0.5 + vx0 * simTime + 0.5 * ax * simTime * simTime;
  const y = 0.5 + vy0 * simTime + 0.5 * ay * simTime * simTime;

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
    canvas.width = Math.floor(rect.width * (window.devicePixelRatio || 1));
    canvas.height = Math.floor(rect.height * (window.devicePixelRatio || 1));
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
    const pad = 36 * dpr;
    const plotW = w - 2 * pad;
    const plotH = h - 2 * pad;
    const toPx = (nx: number, ny: number) => ({ x: pad + nx * plotW, y: pad + (1 - ny) * plotH });
    const scale = Math.min(plotW, plotH) * 0.2;

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const objPx = toPx(Math.max(0.05, Math.min(0.95, x)), Math.max(0.05, Math.min(0.95, y)));
    const velPx = { x: objPx.x + vx * scale * 3, y: objPx.y - vy * scale * 3 };
    const accPx = { x: objPx.x + ax * scale * 8, y: objPx.y - ay * scale * 8 };

    ctx.strokeStyle = "rgba(56,189,248,0.12)";
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

    ctx.strokeStyle = "#dc2626";
    ctx.fillStyle = "#dc2626";
    ctx.lineWidth = (2 + Math.min(1, Math.hypot(ax, ay) * 15)) * dpr;
    ctx.beginPath();
    ctx.moveTo(objPx.x, objPx.y);
    ctx.lineTo(accPx.x, accPx.y);
    ctx.stroke();
    const aAng = Math.atan2(accPx.y - objPx.y, accPx.x - objPx.x);
    const arr = 14 * dpr;
    ctx.beginPath();
    ctx.moveTo(accPx.x, accPx.y);
    ctx.lineTo(accPx.x - arr * Math.cos(aAng - 0.35), accPx.y - arr * Math.sin(aAng - 0.35));
    ctx.lineTo(accPx.x - arr * Math.cos(aAng + 0.35), accPx.y - arr * Math.sin(aAng + 0.35));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText("a", accPx.x + 10, accPx.y);

    ctx.strokeStyle = "#22d3ee";
    ctx.fillStyle = "#22d3ee";
    ctx.lineWidth = (1.5 + Math.min(1, Math.hypot(vx, vy) * 5)) * dpr;
    ctx.beginPath();
    ctx.moveTo(objPx.x, objPx.y);
    ctx.lineTo(velPx.x, velPx.y);
    ctx.stroke();
    const vAng = Math.atan2(velPx.y - objPx.y, velPx.x - objPx.x);
    ctx.beginPath();
    ctx.moveTo(velPx.x, velPx.y);
    ctx.lineTo(velPx.x - arr * Math.cos(vAng - 0.35), velPx.y - arr * Math.sin(vAng - 0.35));
    ctx.lineTo(velPx.x - arr * Math.cos(vAng + 0.35), velPx.y - arr * Math.sin(vAng + 0.35));
    ctx.closePath();
    ctx.fill();
    ctx.fillText("v", velPx.x + 10, velPx.y);

    ctx.fillStyle = "#22d3ee";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12 * dpr;
    ctx.beginPath();
    ctx.arc(objPx.x, objPx.y, 12 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.textAlign = "left";
    ctx.fillText(`t = ${simTime.toFixed(2)} s  v = (${vx.toFixed(2)}, ${vy.toFixed(2)})  a = (${ax.toFixed(2)}, ${ay.toFixed(2)})`, pad, h - 8);
  }, [x, y, vx, vy, ax, ay, simTime]);

  return (
    <SimulatorShell
      title="Acceleration"
      subtitle="Velocity changes over time. Red = acceleration, cyan = velocity."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Initial velocity</div>
          <SliderControl label="vₓ₀" value={vx0} min={-0.15} max={0.15} step={0.01} unit="" onChange={setVx0} color="cyan" />
          <SliderControl label="vᵧ₀" value={vy0} min={-0.12} max={0.12} step={0.01} unit="" onChange={setVy0} color="cyan" />
          <div className="text-[10px] text-neutral-500 uppercase tracking-wide mt-2">Acceleration</div>
          <SliderControl label="aₓ" value={ax} min={-0.05} max={0.05} step={0.005} unit="" onChange={setAx} color="rose" />
          <SliderControl label="aᵧ" value={ay} min={-0.05} max={0.05} step={0.005} unit="" onChange={setAy} color="rose" />
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm">
            <div>v = v₀ + a·t (updates live)</div>
            <div className="mt-0.5 text-cyan-300 font-mono">a = ({ax.toFixed(2)}, {ay.toFixed(2)})</div>
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
