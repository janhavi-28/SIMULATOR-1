"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ElectricityShell, SliderControl } from "./ElectricityShell";
import { useSimulationLifecycle } from "./useSimulationLifecycle";

const K_VACUUM = 8.99e9; // N·m²/C²
const K_AIR = 8.99e9;
const SCALE_UC = 1e-6; // μC → C

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e3 || (Math.abs(n) < 1e-3 && n !== 0)) return n.toExponential(d);
  return n.toFixed(d);
}

export default function ChargeInteractionPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [q1, setQ1] = useState(2);   // μC
  const [q2, setQ2] = useState(-2);  // μC
  const [medium, setMedium] = useState<"air" | "vacuum">("air");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; px: number[] } | null>(null);

  const initialPositions: [number, number][] = [[0.35, 0.5], [0.65, 0.5]];
  const [positions, setPositions] = useState<[number, number][]>(initialPositions);

  const { hasLaunched, isPaused, launch, pause, reset } = useSimulationLifecycle({
    onReset: () => setPositions(initialPositions),
  });

  const k = medium === "air" ? K_AIR : K_VACUUM;
  const q1C = q1 * SCALE_UC;
  const q2C = q2 * SCALE_UC;

  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });
  const toPx = useCallback((nx: number, ny: number) => {
    const { w, h } = dimsRef.current;
    const margin = Math.min(w, h) * 0.12;
    const cx = w / 2;
    const cy = h / 2;
    const size = Math.min(w, h) - 2 * margin;
    return [
      cx - size / 2 + nx * size,
      cy - size / 2 + (1 - ny) * size,
    ] as [number, number];
  }, []);
  const toNorm = useCallback((px: number, py: number) => {
    const { w, h } = dimsRef.current;
    const margin = Math.min(w, h) * 0.12;
    const cx = w / 2;
    const cy = h / 2;
    const size = Math.min(w, h) - 2 * margin;
    const nx = (px - (cx - size / 2)) / size;
    const ny = 1 - (py - (cy - size / 2)) / size;
    return [Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny))] as [number, number];
  }, []);

  const rNorm = useMemo(() => {
    const [a, b] = positions;
    return Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.2;
  }, [positions]);
  const rMeters = useMemo(() => rNorm * 0.5, [rNorm]); // arbitrary scale: 1 unit = 0.5 m
  const F_mag = useMemo(() => {
    if (rMeters <= 0) return 0;
    return (k * Math.abs(q1C * q2C)) / (rMeters * rMeters);
  }, [k, q1C, q2C, rMeters]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = canvas.width / rect.width;
      const px = (e.clientX - rect.left) * dpr;
      const py = (e.clientY - rect.top) * dpr;
      const [p0, p1] = positions;
      const [x0, y0] = toPx(p0[0], p0[1]);
      const [x1, y1] = toPx(p1[0], p1[1]);
      const hitRadius = 28 * dpr;
      if (Math.hypot(px - x0, py - y0) < hitRadius) {
        setDragIndex(0);
        dragStartRef.current = { x: px, y: py, px: [p0[0], p0[1], p1[0], p1[1]] };
      } else if (Math.hypot(px - x1, py - y1) < hitRadius) {
        setDragIndex(1);
        dragStartRef.current = { x: px, y: py, px: [p0[0], p0[1], p1[0], p1[1]] };
      }
    },
    [positions, toPx]
  );
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragIndex === null || !dragStartRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = canvas.width / rect.width;
      const px = (e.clientX - rect.left) * dpr;
      const py = (e.clientY - rect.top) * dpr;
      const [nx, ny] = toNorm(px, py);
      setPositions((prev) => {
        const next = [...prev] as [number, number][];
        next[dragIndex] = [nx, ny];
        return next;
      });
    },
    [dragIndex, toNorm]
  );
  const handlePointerUp = useCallback(() => {
    setDragIndex(null);
    dragStartRef.current = null;
  }, []);
  useEffect(() => {
    const onUp = () => handlePointerUp();
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [handlePointerUp]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = dimsRef.current;
    const margin = Math.min(w, h) * 0.12;
    const cx = w / 2;
    const cy = h / 2;
    const size = Math.min(w, h) - 2 * margin;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    const gridStep = 20 * dpr;
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const [pos1, pos2] = positions;
    const [x1, y1] = toPx(pos1[0], pos1[1]);
    const [x2, y2] = toPx(pos2[0], pos2[1]);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const rPx = Math.hypot(dx, dy) || 1;
    const ux = dx / rPx;
    const uy = dy / rPx;
    const arrowScale = Math.min(60, Math.max(15, Math.log10(1 + F_mag * 1e6) * 12)) * dpr;
    const F1x = (q1C * q2C > 0 ? 1 : -1) * ux * arrowScale;
    const F1y = (q1C * q2C > 0 ? 1 : -1) * uy * arrowScale;
    const F2x = -F1x;
    const F2y = -F1y;

    // Field lines (simplified: a few lines from + to -)
    const drawFieldLines = () => {
      ctx.strokeStyle = "rgba(34,211,238,0.35)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.shadowColor = "rgba(34,211,238,0.5)";
      ctx.shadowBlur = 4 * dpr;
      const nLines = 8;
      for (let i = 0; i < nLines; i++) {
        const angle = (i / nLines) * Math.PI * 2;
        const step = 4 * dpr;
        let sx = x1 + Math.cos(angle) * 18 * dpr;
        let sy = y1 + Math.sin(angle) * 18 * dpr;
        const goFrom1 = q1 > 0;
        if (!goFrom1) {
          sx = x2 + Math.cos(angle) * 18 * dpr;
          sy = y2 + Math.sin(angle) * 18 * dpr;
        }
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        for (let j = 0; j < 80; j++) {
          const rx = sx - (q1 > 0 ? x1 : x2);
          const ry = sy - (q1 > 0 ? y1 : y2);
          const r1 = Math.hypot(rx, ry) || 0.01;
          const rx2 = sx - (q1 > 0 ? x2 : x1);
          const ry2 = sy - (q1 > 0 ? y2 : y1);
          const r2 = Math.hypot(rx2, ry2) || 0.01;
          const E1x = (rx / r1) / (r1 * r1);
          const E1y = (ry / r1) / (r1 * r1);
          const E2x = (rx2 / r2) / (r2 * r2);
          const E2y = (ry2 / r2) / (r2 * r2);
          const sign1 = q1 > 0 ? 1 : -1;
          const sign2 = q2 > 0 ? 1 : -1;
          let Ex = sign1 * E1x + sign2 * E2x;
          let Ey = sign1 * E1y + sign2 * E2y;
          const E = Math.hypot(Ex, Ey) || 0.01;
          Ex /= E;
          Ey /= E;
          sx += Ex * step;
          sy += Ey * step;
          ctx.lineTo(sx, sy);
          if (Math.hypot(sx - (goFrom1 ? x2 : x1), sy - (goFrom1 ? y2 : y1)) < 25 * dpr) break;
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    };
    drawFieldLines();

    const drawArrow = (ox: number, oy: number, ax: number, ay: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5 * dpr;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + ax, oy + ay);
      ctx.stroke();
      const len = Math.hypot(ax, ay) || 1;
      const ux = ax / len;
      const uy = ay / len;
      const head = 10 * dpr;
      ctx.beginPath();
      ctx.moveTo(ox + ax, oy + ay);
      ctx.lineTo(ox + ax - ux * head + uy * 6, oy + ay - uy * head - ux * 6);
      ctx.lineTo(ox + ax - ux * head - uy * 6, oy + ay - uy * head + ux * 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawArrow(x1, y1, F1x, F1y, "rgba(251,191,36,0.95)");
    drawArrow(x2, y2, F2x, F2y, "rgba(251,191,36,0.95)");

    const drawCharge = (x: number, y: number, q: number) => {
      const r = 20 * dpr;
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      if (q > 0) {
        grad.addColorStop(0, "#fef3c7");
        grad.addColorStop(0.6, "#f59e0b");
        grad.addColorStop(1, "#b45309");
      } else {
        grad.addColorStop(0, "#bfdbfe");
        grad.addColorStop(0.6, "#3b82f6");
        grad.addColorStop(1, "#1d4ed8");
      }
      ctx.fillStyle = grad;
      ctx.shadowColor = q > 0 ? "rgba(245,158,11,0.6)" : "rgba(59,130,246,0.6)";
      ctx.shadowBlur = 12 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = `${14 * dpr}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(q > 0 ? "+" : "−", x, y);
    };
    drawCharge(x1, y1, q1);
    drawCharge(x2, y2, q2);

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(`F = k|q₁q₂|/r² = ${formatNum(F_mag, 3)} N`, margin, h - 12 * dpr);
  }, [positions, q1, q2, F_mag, toPx]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Charge q₁" value={q1} min={-5} max={5} step={0.5} unit="μC" onChange={setQ1} color="amber" title="Charge of first particle in microcoulombs" />
      <SliderControl label="Charge q₂" value={q2} min={-5} max={5} step={0.5} unit="μC" onChange={setQ2} color="violet" title="Charge of second particle in microcoulombs" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Medium</label>
        <select value={medium} onChange={(e) => setMedium(e.target.value as "air" | "vacuum")} className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="air">Air</option>
          <option value="vacuum">Vacuum</option>
        </select>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Live formula</div>
        <div className="font-mono text-cyan-200">F = k q₁q₂ / r²</div>
        <div className="text-xs text-neutral-400">k = {formatNum(k, 0)} N·m²/C²</div>
        <div className="text-xs">r ≈ {formatNum(rMeters, 3)} m → F = {formatNum(F_mag, 4)} N</div>
      </div>
      <p className="text-[11px] text-neutral-500">Drag charges to change distance. Like charges repel, unlike attract.</p>
    </>
  );

  return (
    <ElectricityShell
      title="Charge Interaction Playground"
      subtitle="Drag charges. Force vectors and field lines show Coulomb's law."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </ElectricityShell>
  );
}
