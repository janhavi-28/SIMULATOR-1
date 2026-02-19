"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// Thin lens: 1/v - 1/u = 1/f. u negative (object left), f positive convex, negative concave. v = uf/(u+f).
function lensV(u: number, f: number): number {
  if (u === 0) return 0;
  return (u * f) / (u + f);
}

export default function LensSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lensType, setLensType] = useState<"convex" | "concave">("convex");
  const [objectDist, setObjectDist] = useState(50);
  const [focalLength, setFocalLength] = useState(30);
  const [paused, setPaused] = useState(true);
  const [simTime, setSimTime] = useState(0);

  const f = lensType === "convex" ? Math.abs(focalLength) : -Math.abs(focalLength);
  const u = -Math.abs(objectDist);
  const v = useMemo(() => lensV(u, f), [u, f]);
  const m = useMemo(() => (typeof v === "number" && isFinite(v) ? v / u : 0), [v, u]);

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
  }, [lensType, objectDist, focalLength, v, m, simTime]);

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

    const scale = Math.min(cw, ch) / 100;
    const O = cw * 0.5;
    const cy = ch / 2;
    const fAbs = Math.abs(focalLength);
    const uAbs = Math.abs(objectDist);
    const F1 = O - fAbs * scale;
    const F2 = O + fAbs * scale;
    const objX = O - uAbs * scale;
    const imgX = Number.isFinite(v) ? O + v * scale : O + 80 * scale;
    const objH = 14 * dpr;

    // Lens (double convex or concave)
    const lensHalfW = 4 * dpr;
    const lensH = ch * 0.4;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    if (lensType === "convex") {
      ctx.moveTo(O - lensHalfW, cy - lensH / 2);
      ctx.lineTo(O + lensHalfW, cy - lensH / 2);
      ctx.lineTo(O + lensHalfW, cy + lensH / 2);
      ctx.lineTo(O - lensHalfW, cy + lensH / 2);
      ctx.closePath();
    } else {
      ctx.moveTo(O - lensHalfW, cy + lensH / 2);
      ctx.lineTo(O + lensHalfW, cy + lensH / 2);
      ctx.lineTo(O + lensHalfW, cy - lensH / 2);
      ctx.lineTo(O - lensHalfW, cy - lensH / 2);
      ctx.closePath();
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(34,211,238,0.08)";
    ctx.fill();

    // Principal axis
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 1 * dpr;
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(cw, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Object
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(objX, cy - objH, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#22d3ee";
    ctx.stroke();

    // Ray 1: parallel to axis -> through F2 (or backward through F1 for concave)
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(objX, cy - objH);
    ctx.lineTo(O, cy - objH);
    if (lensType === "convex") {
      ctx.lineTo(F2 + (F2 - O) * 0.6, cy - objH - (objH * (F2 - O) * 0.6 / (fAbs * scale)));
    } else {
      ctx.lineTo(O - (O - F1) * 0.8, cy - objH * 0.5);
    }
    ctx.stroke();

    // Ray 2: through O (undeviated)
    ctx.beginPath();
    ctx.moveTo(objX, cy - objH);
    const slope = (cy - objH - cy) / (O - objX);
    const endX2 = imgX + 30 * scale;
    const endY2 = cy + slope * (endX2 - O);
    ctx.lineTo(O, cy - objH);
    ctx.lineTo(endX2, endY2);
    ctx.stroke();

    // Ray 3: through F1 -> parallel (convex) or backward (concave)
    ctx.beginPath();
    ctx.moveTo(F1, cy);
    ctx.lineTo(objX, cy - objH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(O, cy - objH);
    if (lensType === "convex") {
      ctx.lineTo(cw, cy - objH);
    } else {
      ctx.lineTo(O + 40 * scale, cy - objH * 0.4);
    }
    ctx.stroke();

    // Image
    const imgH = objH * m;
    if (Number.isFinite(v) && Math.abs(v) < 400) {
      ctx.fillStyle = v > 0 ? "#86efac" : "rgba(254,240,138,0.6)";
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(134,239,172,0.9)";
      ctx.beginPath();
      ctx.arc(imgX, cy - imgH, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`u = ${objectDist}`, objX - 18, cy + 14);
    ctx.fillText(`v = ${v.toFixed(0)}`, imgX - 10, cy + 14);
    ctx.fillText(`m = ${m.toFixed(2)}`, O - 15, 16);
  }

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-neutral-700">
        <span className="text-sm font-medium text-neutral-200">Thin lens – refraction &amp; image formation</span>
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
            <label className="text-xs font-medium text-neutral-300">Lens</label>
            <select value={lensType} onChange={(e) => setLensType(e.target.value as "convex" | "concave")} className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 text-neutral-200 text-sm px-2 py-1.5">
              <option value="convex">Convex (converging)</option>
              <option value="concave">Concave (diverging)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-300">|u| object distance</label>
            <input type="range" min={25} max={90} value={objectDist} onChange={(e) => setObjectDist(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" />
            <span className="text-xs text-cyan-300 tabular-nums">{objectDist}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-300">|f| focal length</label>
            <input type="range" min={20} max={45} value={focalLength} onChange={(e) => setFocalLength(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" />
            <span className="text-xs text-cyan-300 tabular-nums">{focalLength}</span>
          </div>
          <p className="text-[11px] text-neutral-400">1/v − 1/u = 1/f. Magnification m = v/u.</p>
        </div>
      </div>
    </div>
  );
}
