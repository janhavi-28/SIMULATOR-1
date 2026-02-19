"use client";

import React, { useEffect, useRef, useState } from "react";

const degToRad = (d: number) => (d * Math.PI) / 180;

export default function PlaneMirrorSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [incidentAngleDeg, setIncidentAngleDeg] = useState(35);
  const [paused, setPaused] = useState(true);
  const [simTime, setSimTime] = useState(0);

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
  }, [incidentAngleDeg, simTime]);

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

    // Dark background
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

    const midY = ch / 2;
    const mirrorY = midY;
    const objX = cw * 0.25;
    const objY = midY - h * 0.25;
    const mirrorLeft = cw * 0.1;
    const mirrorRight = cw * 0.9;

    // Mirror line (thick, reflective)
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(mirrorLeft, mirrorY);
    ctx.lineTo(mirrorRight, mirrorY);
    ctx.stroke();
    ctx.fillStyle = "rgba(34,211,238,0.15)";
    ctx.fillRect(mirrorLeft, mirrorY - 4 * dpr, mirrorRight - mirrorLeft, 8 * dpr);

    // Object (point source)
    const objR = 8 * dpr;
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(objX, objY, objR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Hit point on mirror: ray from object at incidentAngleDeg (from normal)
    const theta = degToRad(incidentAngleDeg);
    const dx = Math.sin(theta);
    const dy = Math.cos(theta);
    const t = (mirrorY - objY) / (dy || 0.001);
    let hitX = objX + dx * t;
    if (hitX < mirrorLeft || hitX > mirrorRight) hitX = objX < (mirrorLeft + mirrorRight) / 2 ? mirrorLeft : mirrorRight;
    const hitY = mirrorY;

    // Reflected ray: angle of reflection = angle of incidence
    const reflDx = Math.sin(theta);
    const reflDy = -Math.cos(theta);
    const reflLen = cw * 0.35;
    const endX = hitX + reflDx * reflLen;
    const endY = hitY + reflDy * reflLen;

    // Incident ray
    ctx.strokeStyle = "rgba(34,211,238,0.95)";
    ctx.lineWidth = 2.5 * dpr;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(objX, objY);
    ctx.lineTo(hitX, hitY);
    ctx.stroke();

    // Reflected ray
    ctx.strokeStyle = "#67e8f9";
    ctx.beginPath();
    ctx.moveTo(hitX, hitY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Normal at hit (dashed)
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.strokeStyle = "rgba(148,163,184,0.6)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(hitX, mirrorY - 50 * dpr);
    ctx.lineTo(hitX, mirrorY + 50 * dpr);
    ctx.stroke();
    ctx.setLineDash([]);

    // Virtual image (behind mirror, same perpendicular distance)
    const imageY = mirrorY + (mirrorY - objY);
    const imageX = objX;
    ctx.fillStyle = "rgba(254,240,138,0.5)";
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.strokeStyle = "rgba(254,240,138,0.8)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(imageX, imageY, objR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "left";
    ctx.fillText("Object", objX + objR + 4, objY);
    ctx.fillText("Virtual image", imageX + objR + 4, imageY);
    ctx.fillText(`i = r = ${incidentAngleDeg}°`, hitX + 6, hitY - 6);
  }

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-neutral-700">
        <span className="text-sm font-medium text-neutral-200">Plane mirror – reflection &amp; virtual image</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSimTime(0);
              setPaused(false);
            }}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
          >
            Launch
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900"
          >
            {paused ? "Play" : "Pause"}
          </button>
        </div>
      </div>
      <div className="p-2 flex flex-col sm:flex-row gap-3">
        <div ref={containerRef} className="flex-1 min-h-[240px] rounded-lg bg-[#0f172a] border border-neutral-700">
          <canvas ref={canvasRef} className="w-full h-full block" style={{ width: "100%", height: "100%" }} />
        </div>
        <div className="w-full sm:w-56 flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-300">
            Incident angle (from normal)
          </label>
          <input
            type="range"
            min={10}
            max={70}
            value={incidentAngleDeg}
            onChange={(e) => setIncidentAngleDeg(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
          />
          <span className="text-xs text-cyan-300 tabular-nums">{incidentAngleDeg}°</span>
          <p className="text-[11px] text-neutral-400 mt-1">
            Angle of incidence = angle of reflection. Virtual image is as far behind mirror as object is in front.
          </p>
        </div>
      </div>
    </div>
  );
}
