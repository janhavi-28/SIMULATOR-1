"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const degToRad = (d: number) => (d * Math.PI) / 180;
const radToDeg = (r: number) => (r * 180) / Math.PI;

function snell(n1: number, n2: number, theta1Deg: number): number {
  const s2 = (n1 / n2) * Math.sin(degToRad(theta1Deg));
  if (Math.abs(s2) >= 1) return theta1Deg;
  return radToDeg(Math.asin(s2));
}

export default function GlassSlabSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [incidentAngleDeg, setIncidentAngleDeg] = useState(45);
  const [nGlass, setNGlass] = useState(1.5);
  const [paused, setPaused] = useState(true);
  const [simTime, setSimTime] = useState(0);

  const theta2Top = useMemo(() => snell(1, nGlass, incidentAngleDeg), [nGlass, incidentAngleDeg]);
  const theta2Bottom = incidentAngleDeg; // emergent angle = incident (parallel faces)

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
  }, [incidentAngleDeg, nGlass, theta2Top, simTime]);

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

    const cx = cw / 2;
    const cy = ch / 2;
    const slabW = cw * 0.5;
    const slabH = ch * 0.35;

    // Glass slab (semi-transparent)
    ctx.fillStyle = "rgba(34,211,238,0.12)";
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2 * dpr;
    ctx.fillRect(cx - slabW / 2, cy - slabH / 2, slabW, slabH);
    ctx.strokeRect(cx - slabW / 2, cy - slabH / 2, slabW, slabH);

    const topY = cy - slabH / 2;
    const bottomY = cy + slabH / 2;
    const rayStartX = cx - slabW * 0.6;
    const rayStartY = cy - slabH * 0.8;

    // Incident ray to top face
    const th1 = degToRad(incidentAngleDeg);
    const inDx = Math.sin(th1);
    const inDy = Math.cos(th1);
    const tTop = (topY - rayStartY) / (inDy || 0.001);
    const hitTopX = rayStartX + inDx * tTop;
    const hitTopY = topY;

    // Refracted ray inside (angle theta2Top from normal)
    const th2 = degToRad(theta2Top);
    const inDx2 = Math.sin(th2);
    const inDy2 = Math.cos(th2);
    const tBottom = (bottomY - hitTopY) / (inDy2 || 0.001);
    const hitBottomX = hitTopX + inDx2 * tBottom;
    const hitBottomY = bottomY;

    // Emergent ray (same angle as incident from normal)
    const outDx = Math.sin(th1);
    const outDy = Math.cos(th1);
    const outLen = cw * 0.25;
    const outEndX = hitBottomX + outDx * outLen;
    const outEndY = hitBottomY + outDy * outLen;

    // Incident ray
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(rayStartX, rayStartY);
    ctx.lineTo(hitTopX, hitTopY);
    ctx.stroke();

    // Ray inside slab
    ctx.strokeStyle = "#22d3ee";
    ctx.beginPath();
    ctx.moveTo(hitTopX, hitTopY);
    ctx.lineTo(hitBottomX, hitBottomY);
    ctx.stroke();

    // Emergent ray
    ctx.strokeStyle = "#67e8f9";
    ctx.beginPath();
    ctx.moveTo(hitBottomX, hitBottomY);
    ctx.lineTo(outEndX, outEndY);
    ctx.stroke();

    // Lateral shift (vertical line between incident extended and emergent)
    const shift = Math.abs(hitBottomX - (rayStartX + inDx * (hitBottomY - rayStartY) / (inDy || 0.001)));
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.strokeStyle = "rgba(254,240,138,0.7)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(hitBottomX, hitBottomY);
    ctx.lineTo(rayStartX + inDx * (hitBottomY - rayStartY) / (inDy || 0.001), hitBottomY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`n = ${nGlass.toFixed(2)}`, cx - slabW / 2 + 6, cy - 4);
    ctx.fillText(`Lateral shift`, (hitBottomX + rayStartX + inDx * (hitBottomY - rayStartY) / (inDy || 0.001)) / 2 - 20, hitBottomY + 14);
  }

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-neutral-700">
        <span className="text-sm font-medium text-neutral-200">Refraction through glass slab</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPaused(false)} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20">Launch</button>
          <button type="button" onClick={() => setPaused((p) => !p)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900">{paused ? "Play" : "Pause"}</button>
        </div>
      </div>
      <div className="p-2 flex flex-col sm:flex-row gap-3">
        <div ref={containerRef} className="flex-1 min-h-[240px] rounded-lg bg-[#0f172a] border border-neutral-700">
          <canvas ref={canvasRef} className="w-full h-full block" style={{ width: "100%", height: "100%" }} />
        </div>
        <div className="w-full sm:w-56 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-300">Incident angle</label>
            <input type="range" min={15} max={65} value={incidentAngleDeg} onChange={(e) => setIncidentAngleDeg(Number(e.target.value))}aria-label="Toggle reflection insight" className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" />
            <span className="text-xs text-cyan-300 tabular-nums">{incidentAngleDeg}°</span>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-300">Refractive index n</label>
            <input type="range" min={1.2} max={1.8} step={0.05} value={nGlass} onChange={(e) => setNGlass(Number(e.target.value))}aria-label="Toggle reflection insight" className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" />
            <span className="text-xs text-cyan-300 tabular-nums">{nGlass.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-neutral-400">Emergent ray is parallel to incident. Lateral shift shown in yellow.</p>
        </div>
      </div>
    </div>
  );
}
