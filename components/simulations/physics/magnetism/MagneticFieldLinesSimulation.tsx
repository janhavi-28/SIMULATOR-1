"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MagnetismShell, SliderControl } from "./MagnetismShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

type Mode = "single" | "two-attract" | "two-repel";
type ViewMode = "field-lines" | "filings";

const FORMATION_DURATION = 1.2;
const STRENGTH_PULSE_DURATION = 0.35;
const TWO_MAGNET_SETTLE_DURATION = 0.4;
const FILINGS_ALIGN_DURATION = 0.8;
const AMBIENT_AMPLITUDE = 0.025;
const RIPPLE_DURATION = 0.5;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
}

/** Precompute one field line: same physics as before, returns points and total length */
function computeFieldLine(
  cx: number,
  cy: number,
  cx2: number,
  mode: Mode,
  strength1: number,
  strength2: number,
  angle: number,
  w: number,
  h: number,
  dpr: number,
  steps: number
): { points: { x: number; y: number }[]; length: number } {
  const points: { x: number; y: number }[] = [];
  let px = cx + 35 * dpr * Math.cos(angle);
  let py = cy + 35 * dpr * Math.sin(angle);
  let vx = Math.cos(angle);
  let vy = Math.sin(angle);
  let length = 0;

  for (let s = 0; s < steps; s++) {
    points.push({ x: px, y: py });
    const dx1 = px - cx;
    const dy1 = py - cy;
    const r1 = Math.hypot(dx1, dy1) + 20;
    let ax = (dx1 / (r1 * r1)) * strength1;
    let ay = (dy1 / (r1 * r1)) * strength1;
    if (mode !== "single") {
      const dx2 = px - cx2;
      const dy2 = py - cy;
      const r2 = Math.hypot(dx2, dy2) + 20;
      const sign = mode === "two-repel" ? -1 : 1;
      ax += sign * (dx2 / (r2 * r2)) * strength2;
      ay += sign * (dy2 / (r2 * r2)) * strength2;
    }
    const mag = Math.hypot(ax, ay) || 1;
    vx = 0.92 * vx + 0.08 * (ax / mag);
    vy = 0.92 * vy + 0.08 * (ay / mag);
    const m = Math.hypot(vx, vy) || 1;
    vx /= m;
    vy /= m;
    const prevPx = px;
    const prevPy = py;
    px += vx * 8;
    py += vy * 8;
    if (px < 0 || px > w || py < 0 || py > h) break;
    length += Math.hypot(px - prevPx, py - prevPy);
  }
  return { points, length };
}

export default function MagneticFieldLinesSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("single");
  const [lineCount, setLineCount] = useState(12);
  const [strength1, setStrength1] = useState(1);
  const [strength2, setStrength2] = useState(1);
  const [distance, setDistance] = useState(100);
  const [viewMode, setViewMode] = useState<ViewMode>("field-lines");
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle();

  const strengthPulseStartRef = useRef<number>(0);
  const twoMagnetSettleStartRef = useRef<number>(0);
  const filingsStartRef = useRef<number>(0);
  const lastModeRef = useRef<Mode>(mode);
  const lastStrength1Ref = useRef(strength1);
  const lastStrength2Ref = useRef(strength2);
  const lastViewModeRef = useRef<ViewMode>(viewMode);
  const lastDistanceRef = useRef(distance);
  const rippleStartRef = useRef<number>(0);
  const ambientTimeRef = useRef(0);
  const animationNowRef = useRef(0);

  useEffect(() => {
    const c = containerRef.current;
    const canvas = canvasRef.current;
    if (!c || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    });
    ro.observe(c);
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h, dpr } = dimsRef.current;
    const cx = w * 0.3;
    const cy = h * 0.5;
    const sep = (distance / 200) * w * 0.35;
    const cx2 = cx + (mode !== "single" ? sep : 0);
    if (hasLaunched) animationNowRef.current = performance.now() / 1000;
    const now = animationNowRef.current;

    const formationProgress = hasLaunched
      ? easeOutCubic(Math.min(1, elapsedTime / FORMATION_DURATION))
      : 0;

    if (strength1 !== lastStrength1Ref.current || strength2 !== lastStrength2Ref.current) {
      lastStrength1Ref.current = strength1;
      lastStrength2Ref.current = strength2;
      strengthPulseStartRef.current = now;
    }
    const strengthPulseProgress = easeOutCubic(
      Math.min(1, (now - strengthPulseStartRef.current) / STRENGTH_PULSE_DURATION)
    );
    const pulseScale = 1 + 0.15 * (1 - strengthPulseProgress);

    if (mode !== lastModeRef.current) {
      lastModeRef.current = mode;
      if (mode !== "single") {
        twoMagnetSettleStartRef.current = now;
        rippleStartRef.current = now;
      }
    }
    if (mode !== "single" && distance !== lastDistanceRef.current) {
      lastDistanceRef.current = distance;
      rippleStartRef.current = now;
    }
    const rippleAge = now - rippleStartRef.current;
    const rippleProgress = Math.min(1, rippleAge / RIPPLE_DURATION);
    const twoMagnetSettleProgress =
      mode !== "single"
        ? easeOutCubic(
            Math.min(1, (now - twoMagnetSettleStartRef.current) / TWO_MAGNET_SETTLE_DURATION)
          )
        : 1;

    if (viewMode !== lastViewModeRef.current) {
      lastViewModeRef.current = viewMode;
      if (viewMode === "filings") filingsStartRef.current = now;
    }
    const filingsProgress =
      viewMode === "filings"
        ? Math.min(1, (now - filingsStartRef.current) / FILINGS_ALIGN_DURATION)
        : 0;
    const filingsEase = easeOutCubic(filingsProgress);

    ambientTimeRef.current += 0.016;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0c1222";
    ctx.fillRect(0, 0, w, h);

    const glowIntensity = formationProgress * (0.7 + 0.3 * (1 - strengthPulseProgress));
    const drawMagnetGlow = (mx: number, my: number) => {
      const r = 45 * dpr * pulseScale;
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, r);
      g.addColorStop(0, `rgba(0, 200, 255, ${0.35 * glowIntensity})`);
      g.addColorStop(0.5, `rgba(0, 200, 255, ${0.15 * glowIntensity})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawMagnet = (mx: number, my: number, flip: number) => {
      const mw = 52 * dpr;
      const mh = 20 * dpr;
      ctx.fillStyle = flip > 0 ? "rgba(239,68,68,0.95)" : "rgba(59,130,246,0.95)";
      ctx.fillRect(mx - mw / 2, my - mh / 2, mw / 2, mh);
      ctx.fillStyle = flip > 0 ? "rgba(59,130,246,0.95)" : "rgba(239,68,68,0.95)";
      ctx.fillRect(mx, my - mh / 2, mw / 2, mh);
    };

    if (formationProgress > 0.08) {
      drawMagnetGlow(cx, cy);
      if (mode !== "single") drawMagnetGlow(cx2, cy);
    }
    if (mode !== "single" && rippleProgress < 1) {
      const midX = (cx + cx2) / 2;
      const midY = cy;
      const radius = (w * 0.15 + (w * 0.25) * rippleProgress) * dpr;
      const alpha = 0.12 * (1 - rippleProgress);
      ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(midX, midY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawMagnet(cx, cy, 1);
    if (mode !== "single") drawMagnet(cx2, cy, mode === "two-repel" ? -1 : 1);

    const steps = 80;
    const paths: { points: { x: number; y: number }[]; length: number }[] = [];
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2 - Math.PI * 0.5;
      paths.push(
        computeFieldLine(cx, cy, cx2, mode, strength1, strength2, angle, w, h, dpr, steps)
      );
    }

    if (viewMode === "field-lines") {
      const lineProgressBase = formationProgress * twoMagnetSettleProgress;
      const baseThickness = 1.5 * (0.85 + 0.15 * (1 - strengthPulseProgress));

      for (let i = 0; i < lineCount; i++) {
        const { points, length } = paths[i];
        const lineDelay = i / Math.max(1, lineCount);
        const lineProgress = Math.max(0, Math.min(1, (lineProgressBase * 1.15 - lineDelay * 0.2)));
        const drawLength = length * lineProgress;

        const alpha = Math.min(0.95, 0.3 + (0.65 * (1 - i / lineCount)));
        ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
        ctx.lineWidth = baseThickness;
        ctx.setLineDash([length + 1]);
        ctx.lineDashOffset = length - drawLength;

        ctx.beginPath();
        if (points.length < 2) continue;
        ctx.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) {
          const p = points[j];
          const prev = points[j - 1];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const segLen = Math.hypot(dx, dy) || 1;
          const dist = Math.hypot(p.x - cx, p.y - cy);
          const farFactor = Math.min(1, dist / (w * 0.4));
          const wobble =
            AMBIENT_AMPLITUDE *
            farFactor *
            Math.sin(ambientTimeRef.current * 0.8 + i * 0.5) *
            segLen;
          const nx = -dy / segLen;
          const ny = dx / segLen;
          ctx.lineTo(p.x + nx * wobble, p.y + ny * wobble);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      const numFilings = 120;
      const filingRadius = 3 * dpr;
      const pathSamplePoints: { x: number; y: number; pathIndex: number }[] = [];
      paths.forEach((path, pathIndex) => {
        for (let k = 0; k < Math.ceil((path.points.length / 3)); k++) {
          const idx = Math.min(k * 3, path.points.length - 1);
          pathSamplePoints.push({
            x: path.points[idx].x,
            y: path.points[idx].y,
            pathIndex,
          });
        }
      });
      const targetCount = Math.min(numFilings, pathSamplePoints.length);
      const seed = 12345;
      const seededRandom = (n: number) => {
        const x = Math.sin(seed * 9999 + n * 0.1) * 10000;
        return x - Math.floor(x);
      };
      for (let f = 0; f < targetCount; f++) {
        const target = pathSamplePoints[f % pathSamplePoints.length];
        const startX = w * (0.1 + seededRandom(f) * 0.8);
        const startY = h * (0.1 + seededRandom(f + 100) * 0.8);
        const x = startX + (target.x - startX) * filingsEase;
        const y = startY + (target.y - startY) * filingsEase;
        const poleDist = Math.min(
          Math.hypot(x - cx, y - cy),
          mode !== "single" ? Math.hypot(x - cx2, y - cy) : 1e9
        );
        const cluster = 0.4 + 0.6 * (1 - Math.min(1, poleDist / (w * 0.35)));
        const size = filingRadius * (0.6 + 0.4 * cluster);
        ctx.fillStyle = `rgba(34,211,238,${0.5 + 0.4 * cluster})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(
      `Field lines: ${lineCount}   Mode: ${mode}   View: ${viewMode}`,
      16 * dpr,
      h - 10 * dpr
    );
  }, [
    mode,
    lineCount,
    strength1,
    strength2,
    distance,
    viewMode,
    hasLaunched,
    isAnimating,
    elapsedTime,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!hasLaunched) return;
    let rafId: number;
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      animationNowRef.current = performance.now() / 1000;
      draw();
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [hasLaunched, draw]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
        Parameters
      </h3>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          aria-label="Toggle reflection insight"
          className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200"
        >
          <option value="single">Single magnet</option>
          <option value="two-attract">Two magnets (attract)</option>
          <option value="two-repel">Two magnets (repel)</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">View</label>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          aria-label="Toggle reflection insight"
          className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200"
        >
          <option value="field-lines">Field lines</option>
          <option value="filings">Iron filings</option>
        </select>
      </div>
      <SliderControl
        label="Field lines"
        value={lineCount}
        min={6}
        max={24}
        step={2}
        unit=""
        onChange={setLineCount}
        color="cyan"
      />
      <SliderControl
        label="Strength 1"
        value={strength1}
        min={0.5}
        max={2}
        step={0.1}
        unit="×"
        onChange={setStrength1}
        color="violet"
      />
      {mode !== "single" && (
        <>
          <SliderControl
            label="Strength 2"
            value={strength2}
            min={0.5}
            max={2}
            step={0.1}
            unit="×"
            onChange={setStrength2}
            color="blue"
          />
          <SliderControl
            label="Distance"
            value={distance}
            min={60}
            max={180}
            step={10}
            unit="px"
            onChange={setDistance}
            color="amber"
          />
        </>
      )}
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Concepts</div>
        <p className="mt-1 text-xs">
          Field density ∝ strength. Neutral points appear between like poles.
        </p>
      </div>
    </>
  );

  return (
    <MagnetismShell
      title="Magnetic Field Lines"
      subtitle="Field lines N → S; two-magnet interaction."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div ref={containerRef} className="w-full h-full min-h-0 flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full w-full h-full rounded-lg"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </MagnetismShell>
  );
}
