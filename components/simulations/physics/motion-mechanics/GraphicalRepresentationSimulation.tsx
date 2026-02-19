"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

const u = 5;
const a = 2;
const x0 = 0;
const tMax = 8;
const v = (t: number) => u + a * t;
const x = (t: number) => x0 + u * t + 0.5 * a * t * t;

export default function GraphicalRepresentationSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasLaunched || paused) return;
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      setSimTime((t) => Math.min(tMax, t + dt));
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
    const leftPad = 44 * dpr;
    const rightPad = 12 * dpr;
    const topPad = 12 * dpr;
    const plotW = w - leftPad - rightPad;
    const third = (h - topPad - 20 * dpr) / 3;
    const plotH = third - 18 * dpr;

    const toPxT = (t: number) => leftPad + (t / tMax) * plotW;
    const vMin = Math.min(v(0), v(tMax)) - 2;
    const vMax = Math.max(v(0), v(tMax)) + 2;
    const vRange = vMax - vMin;
    const xMin = Math.min(x(0), x(tMax)) - 5;
    const xMax = Math.max(x(0), x(tMax)) + 5;
    const xRange = Math.max(xMax - xMin, 10);

    const toPyV = (vVal: number, y0: number) => y0 + plotH - ((vVal - vMin) / vRange) * plotH;
    const toPyX = (xVal: number, y0: number) => y0 + plotH - ((xVal - xMin) / xRange) * plotH;

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const drawGrid = (y0: number) => {
      ctx.strokeStyle = "rgba(148,163,184,0.15)";
      ctx.lineWidth = 1 * dpr;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(leftPad + (i / 4) * plotW, y0);
        ctx.lineTo(leftPad + (i / 4) * plotW, y0 + plotH);
        ctx.stroke();
      }
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(leftPad, y0 + (i / 4) * plotH);
        ctx.lineTo(leftPad + plotW, y0 + (i / 4) * plotH);
        ctx.stroke();
      }
    };

    const y1 = topPad;
    const y2 = topPad + third;
    const y3 = topPad + 2 * third;

    drawGrid(y1);
    ctx.strokeStyle = "rgba(248,250,252,0.8)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.strokeRect(leftPad, y1, plotW, plotH);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * tMax;
      const px = toPxT(t);
      const py = toPyV(v(t), y1);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const tc = Math.min(simTime, tMax);
    const pxc = toPxT(tc);
    const pyc = toPyV(v(tc), y1);
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(pxc, pyc, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText("v–t (slope = a)", leftPad, y1 - 4);

    drawGrid(y2);
    ctx.strokeStyle = "rgba(248,250,252,0.8)";
    ctx.strokeRect(leftPad, y2, plotW, plotH);
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * tMax;
      const px = toPxT(t);
      const py = toPyX(x(t), y2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const pyc2 = toPyX(x(tc), y2);
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(pxc, pyc2, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.fillText("x–t (slope = v)", leftPad, y2 - 4);

    drawGrid(y3);
    ctx.strokeStyle = "rgba(248,250,252,0.8)";
    ctx.strokeRect(leftPad, y3, plotW, plotH);
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(leftPad, y3 + plotH / 2);
    ctx.lineTo(leftPad + plotW, y3 + plotH / 2);
    ctx.stroke();
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(pxc, y3 + plotH / 2, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.fillText("a–t (constant a)", leftPad, y3 - 4);

    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText(`t = ${tc.toFixed(2)} s`, pxc, h - 8);
  }, [simTime]);

  return (
    <SimulatorShell
      title="Graphical Representation of Motion"
      subtitle="Position–time, velocity–time, acceleration–time. Cursor syncs with motion."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <p className="text-xs text-neutral-400">Using u = 5 m/s, a = 2 m/s², x₀ = 0. Graphs update as time runs.</p>
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm space-y-1">
            <div>Slope of x–t = velocity</div>
            <div>Slope of v–t = acceleration</div>
            <div>Area under v–t = displacement</div>
          </div>
          <p className="text-[11px] text-neutral-500">Same time marker on all three graphs. Play to see curves build.</p>
        </>
      }
    >
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }} />
      </div>
    </SimulatorShell>
  );
}
