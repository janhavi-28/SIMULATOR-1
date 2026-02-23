"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MagnetismShell, SliderControl } from "./MagnetismShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

const WIRE_X_RATIO = 0.35;
const FIELD_TRANSITION_MS = 300;
const DIRECTION_FLIP_MS = 250;
const RIPPLE_DURATION_MS = 400;
const PROBE_R_MIN = 25;
const PROBE_R_MAX = 120;
const PROBE_DRAG_HIT = 28;

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
}

export default function FieldDueToCurrentSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState(2);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [probeR, setProbeR] = useState(60);
  const [showRightHandRule, setShowRightHandRule] = useState(false);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const animationNowRef = useRef(0);
  const lastCurrentRef = useRef(current);
  const currentTransitionStartRef = useRef(0);
  const lastDirectionRef = useRef(direction);
  const prevDirectionRef = useRef(direction);
  const directionFlipStartRef = useRef(0);
  const rippleStartRef = useRef(0);
  const isDraggingRef = useRef(false);

  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle();

  const t = isAnimating ? elapsedTime : 0;
  const B = (2e-7 * current) / (probeR / 100 + 0.01);

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

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = dimsRef.current.dpr;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const pt = getCanvasPoint(e.clientX, e.clientY);
      if (!pt) return;
      const { w, h, dpr } = dimsRef.current;
      const wx = w * WIRE_X_RATIO;
      const cy = h / 2;
      const probeX = wx + probeR * dpr;
      const probeY = cy;
      const dist = Math.hypot(pt.x - probeX, pt.y - probeY);
      if (dist <= PROBE_DRAG_HIT * dpr) {
        isDraggingRef.current = true;
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      }
    },
    [getCanvasPoint, probeR]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      const pt = getCanvasPoint(e.clientX, e.clientY);
      if (!pt) return;
      const { w, dpr } = dimsRef.current;
      const wx = w * WIRE_X_RATIO;
      const rawR = (pt.x - wx) / dpr;
      const r = Math.round(Math.max(PROBE_R_MIN, Math.min(PROBE_R_MAX, rawR)) / 5) * 5;
      setProbeR(r);
    },
    [getCanvasPoint]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    if (current !== lastCurrentRef.current) {
      lastCurrentRef.current = current;
      currentTransitionStartRef.current = performance.now();
      rippleStartRef.current = performance.now();
    }
    if (direction !== lastDirectionRef.current) {
      prevDirectionRef.current = lastDirectionRef.current;
      lastDirectionRef.current = direction;
      directionFlipStartRef.current = performance.now();
    }
  }, [current, direction]);

  useEffect(() => {
    if (!hasLaunched) return;
    animationNowRef.current = performance.now() / 1000;
  }, [hasLaunched]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h, dpr } = dimsRef.current;
    const wx = w * WIRE_X_RATIO;
    const cy = h / 2;
    const sign = direction === "up" ? 1 : -1;
    const now = hasLaunched ? performance.now() / 1000 : 0;
    animationNowRef.current = now;

    const transitionProgress = easeOutCubic(
      Math.min(1, (performance.now() - currentTransitionStartRef.current) / FIELD_TRANSITION_MS)
    );
    const displayCurrent = lastCurrentRef.current + (current - lastCurrentRef.current) * transitionProgress;
    const directionFlipProgress = easeOutCubic(
      Math.min(1, (performance.now() - directionFlipStartRef.current) / DIRECTION_FLIP_MS)
    );
    const rippleProgress = Math.min(1, (performance.now() - rippleStartRef.current) / RIPPLE_DURATION_MS);

    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createRadialGradient(wx, cy, 0, wx, cy, w * 0.7);
    bgGrad.addColorStop(0, "rgba(12, 28, 60, 1)");
    bgGrad.addColorStop(0.7, "rgba(5, 15, 35, 1)");
    bgGrad.addColorStop(1, "rgba(0, 8, 20, 1)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    if (rippleProgress < 1) {
      const rippleR = (w * 0.15 + w * 0.25 * rippleProgress) * dpr;
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.15 * (1 - rippleProgress)})`;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(wx, cy, rippleR, 0, Math.PI * 2);
      ctx.stroke();
    }

    const circles = 8;
    const circleBaseRadius = 28;
    const circleSpacing = 22;
    const scale = 0.95 + 0.08 * Math.sin(transitionProgress * Math.PI);

    for (let i = 0; i < circles; i++) {
      const r = (circleBaseRadius + i * circleSpacing) * dpr * scale;
      const innerWidth = 2.5;
      const outerWidth = 1;
      const lineWidth = innerWidth - (i / circles) * (innerWidth - outerWidth);
      const alphaInner = 0.7;
      const alphaOuter = 0.25;
      const alpha = (alphaInner - (i / circles) * (alphaInner - alphaOuter)) * (0.85 + 0.15 * transitionProgress);
      ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
      ctx.lineWidth = lineWidth * dpr;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.12) {
        const x = wx + r * Math.cos(a);
        const y = cy + r * Math.sin(a) * sign;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      const tickAngleStep = Math.PI / 2;
      const prevSign = prevDirectionRef.current === "up" ? 1 : -1;
      const currSign = direction === "up" ? 1 : -1;
      const tickDir = (1 - directionFlipProgress) * prevSign + directionFlipProgress * currSign;
      for (let ti = 0; ti < 4; ti++) {
        const angle = ti * tickAngleStep + 0.02;
        const ax = wx + r * Math.cos(angle);
        const ay = cy + r * Math.sin(angle) * sign;
        const tx = -Math.sin(angle) * tickDir;
        const ty = Math.cos(angle) * sign * tickDir;
        const tickLen = (6 + 4 * (1 - i / circles)) * dpr;
        const tickAlpha = 0.5 + 0.4 * (1 - i / circles);
        ctx.strokeStyle = `rgba(34, 211, 238, ${tickAlpha})`;
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(ax - tx * tickLen, ay - ty * tickLen);
        ctx.lineTo(ax + tx * tickLen, ay + ty * tickLen);
        ctx.stroke();
      }
    }

    const centerGlow = ctx.createRadialGradient(wx, cy, 0, wx, cy, 45 * dpr);
    centerGlow.addColorStop(0, "rgba(34, 211, 238, 0.12)");
    centerGlow.addColorStop(0.6, "rgba(34, 211, 238, 0.04)");
    centerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(wx, cy, 45 * dpr, 0, Math.PI * 2);
    ctx.fill();

    const wireWidth = 3.5 * dpr;
    ctx.shadowColor = "rgba(239, 68, 68, 0.7)";
    ctx.shadowBlur = 14 * dpr;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.98)";
    ctx.lineWidth = wireWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(wx, 0);
    ctx.lineTo(wx, h);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const pulseSpeed = 0.4 * displayCurrent;
    const pulsePhase = (t * pulseSpeed * 2) % 1;
    const pulseY = pulsePhase * h;
    const pulseR = 5 * dpr;
    const pulseGrad = ctx.createRadialGradient(wx, pulseY, 0, wx, pulseY, pulseR * 3);
    pulseGrad.addColorStop(0, "rgba(255, 100, 100, 0.95)");
    pulseGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.5)");
    pulseGrad.addColorStop(1, "transparent");
    ctx.fillStyle = pulseGrad;
    ctx.beginPath();
    ctx.arc(wx, pulseY, pulseR * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 120, 120, 0.98)";
    ctx.beginPath();
    ctx.arc(wx, pulseY, pulseR, 0, Math.PI * 2);
    ctx.fill();

    const pr = probeR * dpr;
    const probeX = wx + pr;
    const probeY = cy;
    const Bprobe = (2e-7 * current) / (probeR / 100 + 0.01);
    const arrowLen = 18 * dpr * Math.min(1.5, 0.3 + (Bprobe * 2e6) / 5);
    const ax2 = probeX;
    const ay2 = probeY + sign * arrowLen;

    ctx.shadowColor = "rgba(34, 197, 94, 0.6)";
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = "rgba(34, 197, 94, 0.95)";
    ctx.beginPath();
    ctx.arc(probeX, probeY, 14 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(200, 255, 200, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(34, 197, 94, 0.95)";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(probeX, probeY);
    ctx.lineTo(ax2, ay2);
    ctx.stroke();
    const arr = 6 * dpr;
    ctx.beginPath();
    ctx.moveTo(ax2, ay2);
    ctx.lineTo(ax2 - arr * 0.6, ay2 - sign * arr * 0.6);
    ctx.lineTo(ax2 + arr * 0.6, ay2 + sign * arr * 0.6);
    ctx.closePath();
    ctx.fillStyle = "rgba(34, 197, 94, 0.95)";
    ctx.fill();

    ctx.fillStyle = "rgba(248, 250, 252, 0.95)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`B ≈ ${formatNum(Bprobe * 1e6, 2)}`, probeX, probeY + 32 * dpr);
    ctx.textAlign = "left";

    if (showRightHandRule) {
      const palmX = wx + 24 * dpr;
      const palmY = cy;
      const thumbLen = 32 * dpr;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = 2.5 * dpr;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.ellipse(palmX, palmY, 22 * dpr, 18 * dpr, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(palmX - 8 * dpr, palmY);
      ctx.lineTo(wx, palmY + sign * thumbLen);
      ctx.stroke();
      for (let fi = 0; fi < 3; fi++) {
        const baseAngle = -0.4 + fi * 0.25;
        ctx.beginPath();
        ctx.moveTo(palmX + 18 * dpr * Math.cos(baseAngle), palmY + 14 * dpr * Math.sin(baseAngle));
        ctx.quadraticCurveTo(
          palmX + 35 * dpr + fi * 8, palmY - sign * (20 + fi * 12) * dpr,
          palmX + 50 * dpr, palmY - sign * (35 + fi * 10) * dpr
        );
        ctx.stroke();
      }
    }

    const badgeX = 14 * dpr;
    const badgeY = 14 * dpr;
    const badgeW = 140 * dpr;
    const badgeH = 44 * dpr;
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = "rgba(34, 211, 238, 0.35)";
    ctx.lineWidth = 1;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8 * dpr);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
    ctx.font = `bold ${13 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("B ∝ I / r", badgeX + 10 * dpr, badgeY + 18 * dpr);
    ctx.fillStyle = "rgba(200, 220, 240, 0.85)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Stronger current → denser circles", badgeX + 10 * dpr, badgeY + 34 * dpr);
    ctx.textAlign = "left";
  }, [
    current,
    direction,
    probeR,
    showRightHandRule,
    hasLaunched,
    isAnimating,
    elapsedTime,
    t,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!hasLaunched) return;
    let rafId: number;
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      draw();
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [hasLaunched, draw]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl
        label="Current I"
        value={current}
        min={0.5}
        max={5}
        step={0.5}
        unit="A"
        onChange={setCurrent}
        color="amber"
      />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Direction</label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as "up" | "down")}
          aria-label="Toggle reflection insight"
          className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200"
        >
          <option value="up">Up (thumb ↑)</option>
          <option value="down">Down (thumb ↓)</option>
        </select>
      </div>
      <SliderControl
        label="Distance from wire r"
        value={probeR}
        min={PROBE_R_MIN}
        max={PROBE_R_MAX}
        step={5}
        unit="px"
        onChange={setProbeR}
        color="cyan"
      />
      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={showRightHandRule}
            onChange={(e) => setShowRightHandRule(e.target.checked)}
            className="rounded border-neutral-600 bg-neutral-800 text-cyan-500"
          />
          <span className="text-xs font-medium text-neutral-300">Show Right-Hand Rule</span>
        </label>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">B ∝ I / r</div>
        <p className="mt-1 text-xs">
          Right-hand thumb rule: thumb = current, fingers = field direction (circles).
        </p>
      </div>
    </>
  );

  return (
    <MagnetismShell
      title="Magnetic Field due to Current"
      subtitle="Straight wire: circular field lines; B ∝ I/r."
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
          className="max-w-full max-h-full w-full h-full rounded-lg cursor-grab active:cursor-grabbing"
          style={{ width: "100%", height: "100%" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </MagnetismShell>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
