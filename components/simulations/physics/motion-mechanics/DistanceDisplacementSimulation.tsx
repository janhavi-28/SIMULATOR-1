"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell } from "./SimulatorShell";

const PATH_PRESETS = [
  { name: "Straight", path: [{ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }] },
  { name: "L-shape", path: [{ x: 0.2, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.2 }] },
  { name: "Curved", path: [{ x: 0.2, y: 0.7 }, { x: 0.4, y: 0.3 }, { x: 0.6, y: 0.6 }, { x: 0.8, y: 0.2 }] },
  { name: "Triangle", path: [{ x: 0.3, y: 0.7 }, { x: 0.7, y: 0.7 }, { x: 0.5, y: 0.2 }, { x: 0.3, y: 0.7 }] },
];

function pathLength(points: { x: number; y: number }[]) {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return d;
}

function displacement(points: { x: number; y: number }[]) {
  if (points.length < 2) return { dx: 0, dy: 0 };
  return {
    dx: points[points.length - 1].x - points[0].x,
    dy: points[points.length - 1].y - points[0].y,
  };
}

export default function DistanceDisplacementSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [showPath, setShowPath] = useState(true);
  const [showDisplacement, setShowDisplacement] = useState(true);
  const [pathIndex, setPathIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const lastTsRef = useRef<number | null>(null);

  const path = PATH_PRESETS[pathIndex].path;
  const distance = pathLength(path);
  const { dx, dy } = displacement(path);
  const dispMag = Math.hypot(dx, dy);

  useEffect(() => {
    if (!hasLaunched || paused) return;
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      setProgress((p) => Math.min(1, p + dt * 0.25));
    };
    lastTsRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused]);

  const launch = () => {
    setProgress(0);
    setPaused(false);
    setHasLaunched(true);
  };
  const reset = () => {
    setProgress(0);
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
    const pad = 32 * dpr;
    const plotW = w - 2 * pad;
    const plotH = h - 2 * pad;
    const toPx = (nx: number, ny: number) => ({
      x: pad + nx * plotW,
      y: pad + (1 - ny) * plotH,
    });

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (showPath) {
      ctx.strokeStyle = "rgba(34,211,238,0.5)";
      ctx.lineWidth = 3 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const first = toPx(path[0].x, path[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < path.length; i++) {
        const p = toPx(path[i].x, path[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    let cum = 0;
    let currNx = path[0].x;
    let currNy = path[0].y;
    for (let i = 1; i < path.length; i++) {
      const segLen = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
      if (cum + segLen >= progress * distance) {
        const tSeg = segLen > 0 ? (progress * distance - cum) / segLen : 0;
        currNx = path[i - 1].x + (path[i].x - path[i - 1].x) * tSeg;
        currNy = path[i - 1].y + (path[i].y - path[i - 1].y) * tSeg;
        break;
      }
      cum += segLen;
      if (i === path.length - 1) {
        currNx = path[i].x;
        currNy = path[i].y;
      }
    }
    const currPx = toPx(currNx, currNy);
    ctx.fillStyle = "#22d3ee";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12 * dpr;
    ctx.beginPath();
    ctx.arc(currPx.x, currPx.y, 10 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const startPx = toPx(path[0].x, path[0].y);
    const endPx = toPx(path[path.length - 1].x, path[path.length - 1].y);
    ctx.fillStyle = "rgba(74,222,128,0.9)";
    ctx.beginPath();
    ctx.arc(startPx.x, startPx.y, 8 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(251,146,60,0.9)";
    ctx.beginPath();
    ctx.arc(endPx.x, endPx.y, 8 * dpr, 0, Math.PI * 2);
    ctx.fill();

    if (showDisplacement && path.length >= 2) {
      ctx.strokeStyle = "rgba(251,191,36,0.9)";
      ctx.lineWidth = 4 * dpr;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(startPx.x, startPx.y);
      ctx.lineTo(endPx.x, endPx.y);
      ctx.stroke();
      const angle = Math.atan2(endPx.y - startPx.y, endPx.x - startPx.x);
      const arr = 14 * dpr;
      ctx.fillStyle = "rgba(251,191,36,0.9)";
      ctx.beginPath();
      ctx.moveTo(endPx.x, endPx.y);
      ctx.lineTo(endPx.x - arr * Math.cos(angle - 0.4), endPx.y - arr * Math.sin(angle - 0.4));
      ctx.lineTo(endPx.x - arr * Math.cos(angle + 0.4), endPx.y - arr * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(251,191,36,0.95)";
      ctx.font = `${10 * dpr}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("displacement (vector)", (startPx.x + endPx.x) / 2, (startPx.y + endPx.y) / 2 - 14);
    }

    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.textAlign = "left";
    ctx.fillText(`Distance (path) = ${(distance * 100).toFixed(1)}`, pad, h - 8);
    ctx.fillText(`|Displacement| = ${(dispMag * 100).toFixed(1)}`, pad, h - 8 + 16);
  }, [path, pathIndex, progress, showPath, showDisplacement, distance, dx, dy, dispMag]);

  return (
    <SimulatorShell
      title="Distance and Displacement"
      subtitle="Path length (scalar) vs straight-line change (vector)."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300 block">Path</label>
            <div className="flex flex-wrap gap-2">
              {PATH_PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setPathIndex(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                    pathIndex === i ? "border-cyan-400 bg-cyan-500/20 text-white" : "border-neutral-600 bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300 block">Show</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showPath} onChange={(e) => setShowPath(e.target.checked)} className="rounded bg-neutral-700 border-neutral-600 text-cyan-500" />
                <span className="text-sm text-neutral-300">Path (distance)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showDisplacement} onChange={(e) => setShowDisplacement(e.target.checked)} className="rounded bg-neutral-700 border-neutral-600 text-cyan-500" />
                <span className="text-sm text-neutral-300">Displacement</span>
              </label>
            </div>
          </div>
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm space-y-1">
            <div>Distance (scalar) = <span className="font-mono text-cyan-300">{(distance * 100).toFixed(1)}</span></div>
            <div>|Displacement| (vector mag) = <span className="font-mono text-cyan-300">{(dispMag * 100).toFixed(1)}</span></div>
          </div>
          <p className="text-[11px] text-neutral-500">Green = start, orange = end. Yellow arrow = displacement only.</p>
        </>
      }
    >
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }} />
      </div>
    </SimulatorShell>
  );
}
