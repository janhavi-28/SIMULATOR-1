"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// Sign: object left of mirror u < 0. Concave f < 0, convex f > 0. 1/v + 1/u = 1/f => v = uf/(u-f).
function mirrorV(u: number, f: number): number {
  if (u === 0 || f === 0) return 0;
  return (u * f) / (u - f);
}

export default function SphericalMirrorSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mirrorType, setMirrorType] = useState<"concave" | "convex">("concave");
  const [objectDist, setObjectDist] = useState(40);
  const [focalLength, setFocalLength] = useState(25);
  const [paused, setPaused] = useState(true);
  const [simTime, setSimTime] = useState(0);

  const f = mirrorType === "concave" ? -Math.abs(focalLength) : Math.abs(focalLength);
  const u = -Math.abs(objectDist);
  const v = useMemo(() => mirrorV(u, f), [u, f]);
  const m = useMemo(() => (typeof v === "number" && isFinite(v) ? -v / u : 0), [v, u]);

  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    let id: number;
    const tick = (t: number) => {
      id = requestAnimationFrame(tick);
      setSimTime((t - start) / 1000);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      draw(canvas, rect.width, rect.height, dpr);
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    draw(canvas, rect.width, rect.height, dpr);
    return () => ro.disconnect();
  }, [mirrorType, objectDist, focalLength, v, m, simTime]);

  function draw(
    canvas: HTMLCanvasElement,
    w: number,
    h: number,
    dpr: number
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "rgba(148,163,184,0.2)";
    ctx.lineWidth = 1 * dpr;
    const grid = 24 * dpr;
    for (let x = 0; x <= cw; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y <= ch; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    const scale = Math.min(cw, ch) / 120;
    const poleX = cw * 0.55;
    const cy = ch / 2;
    const axisY = cy;

    const fAbs = Math.abs(focalLength);
    const uAbs = Math.abs(objectDist);
    const Cx = poleX + (mirrorType === "concave" ? -1 : 1) * 2 * fAbs * scale;
    const Fx = poleX + (mirrorType === "concave" ? -1 : 1) * fAbs * scale;
    const objX = poleX - uAbs * scale;
    const imgX = Number.isFinite(v) ? poleX + v * scale : poleX + 100 * scale;

    // Mirror arc (circle through pole, centre at C)
    const radius = Math.abs(Cx - poleX);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    if (mirrorType === "concave") {
      ctx.arc(Cx, axisY, radius, -0.5 * Math.PI, 0.5 * Math.PI);
    } else {
      ctx.arc(Cx, axisY, radius, 0.5 * Math.PI, 1.5 * Math.PI);
    }
    ctx.stroke();

    // Principal axis
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 1 * dpr;
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(cw, axisY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Object (arrow tip above axis)
    const objH = 12 * dpr;
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(objX, axisY - objH, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#22d3ee";
    ctx.stroke();

    // Ray 1: parallel to axis -> through F
    const hit1Y = axisY - objH;
    const hit1X = poleX + (mirrorType === "concave" ? -1 : 1) * Math.sqrt(Math.max(0, radius * radius - (hit1Y - axisY) ** 2));
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(objX, hit1Y);
    ctx.lineTo(hit1X, hit1Y);
    ctx.stroke();
    ctx.beginPath();
    if (mirrorType === "concave") {
      ctx.moveTo(hit1X, hit1Y);
      ctx.lineTo(Fx + (Fx - hit1X) * 0.8, axisY + (axisY - hit1Y) * 0.3);
    } else {
      ctx.moveTo(hit1X, hit1Y);
      const backX = 2 * Fx - hit1X;
      ctx.lineTo(backX, hit1Y + (axisY - hit1Y) * 0.5);
    }
    ctx.stroke();

    // Ray 2: through C
    const dx = (Cx - objX);
    const dy = (axisY - (axisY - objH) - 0);
    const len = Math.hypot(dx, dy) || 1;
    const hit2t = (poleX - objX) / (dx / len);
    const hit2X = objX + (dx / len) * Math.min(hit2t, len * 1.5);
    const hit2Y = axisY - objH + (axisY - (axisY - objH) - (axisY - objH)) * ((hit2X - objX) / (Cx - objX || 1));
    const hit2YCorr = axisY - (axisY - (axisY - objH)) * ((hit2X - objX) / (Cx - objX || 1));
    ctx.beginPath();
    ctx.moveTo(objX, axisY - objH);
    ctx.lineTo(Cx, axisY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Cx, axisY);
    ctx.lineTo(2 * Cx - hit2X, 2 * axisY - (axisY - objH));
    ctx.stroke();

    // Image
    const imgH = objH * m;
    if (Number.isFinite(v) && Math.abs(v) < 300) {
      ctx.fillStyle = Math.sign(v) > 0 ? "#86efac" : "rgba(254,240,138,0.6)";
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(134,239,172,0.9)";
      ctx.beginPath();
      ctx.arc(imgX, axisY - imgH, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`u = ${objectDist}`, objX - 20, axisY + 14);
    ctx.fillText(`v = ${v.toFixed(0)}`, imgX - 10, axisY + 14);
    ctx.fillText(`m = ${m.toFixed(2)}`, poleX - 15, 16);
  }

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-neutral-700">
        <span className="text-sm font-medium text-neutral-200">Spherical mirror – image formation</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPaused(false)} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20">Launch</button>
          <button type="button" onClick={() => setPaused((p) => !p)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900">{paused ? "Play" : "Pause"}</button>
        </div>
      </div>
      <div className="p-2 flex flex-col sm:flex-row gap-3">
        <div ref={containerRef} className="flex-1 min-h-[260px] rounded-lg bg-[#0f172a] border border-neutral-700">
          <canvas ref={canvasRef} className="w-full h-full block" style={{ width: "100%", height: "100%" }} />
        </div>
        <div className="w-full sm:w-56 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-300">Mirror</label>
            <select value={mirrorType} onChange={(e) => setMirrorType(e.target.value as "concave" | "convex")} className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 text-neutral-200 text-sm px-2 py-1.5">
              <option value="concave">Concave</option>
              <option value="convex">Convex</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-300">|u| object distance</label>
            <input type="range" min={15} max={80} value={objectDist} onChange={(e) => setObjectDist(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" />
            <span className="text-xs text-cyan-300 tabular-nums">{objectDist}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-300">|f| focal length</label>
            <input type="range" min={15} max={40} value={focalLength} onChange={(e) => setFocalLength(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" />
            <span className="text-xs text-cyan-300 tabular-nums">{focalLength}</span>
          </div>
          <p className="text-[11px] text-neutral-400">1/v + 1/u = 1/f. Magnification m = −v/u.</p>
        </div>
      </div>
    </div>
  );
}
