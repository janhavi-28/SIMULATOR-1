"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParameterRecord {
  timestamp: number;
  value: number;
  calculatedResults: { [key: string]: number };
}

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  icon?: string;
  dramaticRange?: [number, number];
  onChange: (value: number) => void;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  omega: number;
  mass: number;
  radius: number;
}

// ---------------------------------------------------------------------------
// Constants – Standard Web Color Palette (Tailwind)
// ---------------------------------------------------------------------------

const COLORS = {
  bgLight: "#F5F5F5",
  bgDark: "#1E1E1E",
  gradientStart: "#E8EEF2",
  gradientEnd: "#FFFFFF",
  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  track: "#E5E7EB",
  hover: "#DBEAFE",
  grid: "rgba(229, 231, 235, 0.5)",
} as const;

const G = 9.81;
const BASE_RADIUS = 12;
const STRING_LENGTH = 180;
const PIVOT_Y = 80;

// Visual radius: radius ∝ ∛mass (volume relationship)
function calculateVisualRadius(mass: number): number {
  return BASE_RADIUS * Math.cbrt(mass);
}

// Pendulum physics: T = 2π√(L/g)
function calculatePeriod(L: number, g: number): number {
  return 2 * Math.PI * Math.sqrt(L / g);
}

// Kinetic energy: KE = ½mv²
function kineticEnergy(m: number, v: number): number {
  return 0.5 * m * v * v;
}

// Potential energy: PE = mgh
function potentialEnergy(m: number, h: number, g: number): number {
  return m * g * h;
}

// ---------------------------------------------------------------------------
// Parameter Slider Component
// ---------------------------------------------------------------------------

function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  icon,
  dramaticRange,
  onChange,
}: ParameterSliderProps) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  const [low, high] = dramaticRange ?? [NaN, NaN];
  const isInDramaticRange =
    !Number.isNaN(low) && !Number.isNaN(high) && value >= low && value <= high;

  return (
    <div className="space-y-1 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base" aria-hidden>{icon}</span>}
          <label htmlFor={id} className="text-sm font-medium text-gray-900">
            {label}
          </label>
        </div>
        <span className="text-sm font-bold tabular-nums text-gray-900">
          {value % 1 === 0 ? value : value.toFixed(2)} {unit}
        </span>
      </div>
      <div
        className={`relative rounded-full ${isInDramaticRange ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
      >
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-3 w-full appearance-none rounded-full bg-gray-200 accent-blue-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-500"
          aria-label={`${label}: ${value} ${unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Newton's Cradle Simulation
// ---------------------------------------------------------------------------

const STRING_LENGTH_M = STRING_LENGTH / 100;
const SNAP_THRESH = 0.0005;

export default function NewtonsCradleSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [ballCount, setBallCount] = useState(5);
  const [ballsToRelease, setBallsToRelease] = useState(1);
  const [massPerBall, setMassPerBall] = useState(1);
  const [initialDisplacement, setInitialDisplacement] = useState(45);
  const [restitution, setRestitution] = useState(0.98);
  const [isPaused, setIsPaused] = useState(false);
  const [totalKE, setTotalKE] = useState(0);
  const [totalPE, setTotalPE] = useState(0);
  const [collisionCount, setCollisionCount] = useState(0);
  const [liveStats, setLiveStats] = useState({ fps: 60 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const anglesRef = useRef<number[]>([]);
  const avsRef = useRef<number[]>([]);
  const swingStateRef = useRef<"left" | "right">("left");
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const collisionCountRef = useRef(0);
  const canvasSizeRef = useRef({ w: 400, h: 300 });
  const frameCountRef = useRef(0);
  const dragRef = useRef(false);
  const layoutRef = useRef<{ pvtX: (i: number) => number; pY: number; Lpx: number; n: number; rel: number; ballR: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const maxRel = Math.max(1, Math.floor(ballCount / 2));
    setBallsToRelease((r) => Math.min(r, maxRel));
  }, [ballCount]);

  const period = useMemo(() => calculatePeriod(STRING_LENGTH_M, G), []);

  const resetToDefault = useCallback(() => {
    setBallCount(5);
    setBallsToRelease(1);
    setMassPerBall(1);
    setInitialDisplacement(45);
    setRestitution(0.98);
    setCollisionCount(0);
    collisionCountRef.current = 0;
    setResetKey((k) => k + 1);
  }, []);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(pausedRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getCanvasCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const rect = canvas.getBoundingClientRect();
      const ev = "touches" in e ? e.touches[0] || (e as TouchEvent).changedTouches[0] : e as MouseEvent;
      if (!ev) return null;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scaleX = (canvas.width / dpr) / rect.width;
      const scaleY = (canvas.height / dpr) / rect.height;
      return {
        x: (ev.clientX - rect.left) * scaleX,
        y: (ev.clientY - rect.top) * scaleY,
      };
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      const coords = getCanvasCoords(e);
      if (!coords) return;
      const layout = layoutRef.current;
      if (!layout) return;
      const { pvtX, pY, Lpx, n, rel, ballR } = layout;
      const angles = anglesRef.current;
      const px0 = pvtX(0);
      const ballX0 = px0 + Lpx * Math.sin(angles[0]);
      const ballY0 = pY + Lpx * Math.cos(angles[0]);
      const dx = coords.x - ballX0;
      const dy = coords.y - ballY0;
      if (dx * dx + dy * dy < ballR * ballR * 2.5) {
        e.preventDefault();
        dragRef.current = true;
      }
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      if ("preventDefault" in e) e.preventDefault();
      const coords = getCanvasCoords(e);
      if (!coords) return;
      const layout = layoutRef.current;
      if (!layout) return;
      const { pvtX, pY, Lpx, n, rel } = layout;
      const px0 = pvtX(0);
      const dx = coords.x - px0;
      const dy = coords.y - pY;
      let angle = Math.atan2(dx, dy);
      if (angle > 0) angle = Math.min(angle, Math.PI * 0.48);
      else angle = Math.max(angle, -Math.PI * 0.48);
      const angles = anglesRef.current;
      const avs = avsRef.current;
      for (let i = 0; i < rel; i++) {
        angles[i] = angle;
        avs[i] = 0;
      }
      swingStateRef.current = "left";
    };
    const onUp = () => {
      dragRef.current = false;
    };
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mouseleave", onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 400;
    let h = 300;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvasSizeRef.current = { w, h };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    cancelAnimationFrame(animRef.current);
    const a = new Array(ballCount).fill(0);
    const maxRelease = Math.floor(ballCount / 2);
    const rel = Math.min(ballsToRelease, Math.max(1, maxRelease));
    const angleRad = -(initialDisplacement * Math.PI) / 180;
    for (let i = 0; i < rel; i++) a[i] = angleRad;
    anglesRef.current = a;
    avsRef.current = new Array(ballCount).fill(0);
    swingStateRef.current = "left";
    lastTimeRef.current = 0;

    const n = ballCount;
    const L = STRING_LENGTH_M;
    const rest = restitution;
    const damp = rest >= 0.9999 ? 1.0 : 0.9995; // Slight air resistance when restitution < 1
    const loop = (timestamp: number) => {
      animRef.current = requestAnimationFrame(loop);
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.025);
      lastTimeRef.current = timestamp;

      const angles = anglesRef.current;
      const avs = avsRef.current;
      const cw = canvasSizeRef.current.w;
      const ch = canvasSizeRef.current.h;
      const Lpx = (STRING_LENGTH / 100) * Math.min(cw, ch) / 3.6;
      const scl = Math.min(cw, ch) / 360;
      const pY = Math.min(cw, ch) * 0.06;
      const r = calculateVisualRadius(massPerBall) * scl;
      // Pivot spacing = ball diameter so balls touch at rest; momentum transfers through full chain
      const ballDiam = 2 * r;
      const maxSpacing = (cw * 0.92) / (n - 1);
      const sp = Math.min(ballDiam, maxSpacing);
      const offX = (cw - sp * (n - 1)) / 2;
      const pvtX = (i: number) => offX + i * sp;
      layoutRef.current = { pvtX, pY, Lpx, n, rel, ballR: r };

      if (!prefersReducedMotion && !pausedRef.current && !dragRef.current) {
        // Rigid group: left pack (0..rel-1) shares angle/omega; right pack (n-rel..n-1) shares angle/omega
        const state = swingStateRef.current;

        if (state === "left") {
          const alpha = -(G / L) * Math.sin(angles[0]);
          avs[0] += alpha * dt;
          avs[0] *= damp;
          angles[0] += avs[0] * dt;
          for (let k = 1; k < rel; k++) {
            angles[k] = angles[0];
            avs[k] = avs[0];
          }
          for (let k = rel; k < n; k++) {
            angles[k] = 0;
            avs[k] = 0;
          }
        } else {
          for (let k = 0; k < n - rel; k++) {
            angles[k] = 0;
            avs[k] = 0;
          }
          const idx = n - rel;
          const alpha = -(G / L) * Math.sin(angles[idx]);
          avs[idx] += alpha * dt;
          avs[idx] *= damp;
          angles[idx] += avs[idx] * dt;
          for (let k = idx + 1; k < n; k++) {
            angles[k] = angles[idx];
            avs[k] = avs[idx];
          }
        }

        // Instant momentum transfer: single boundary check, no generic collision loop
        const minD = 2 * r;
        const leftLead = rel - 1;
        const rightLead = n - rel;
        const boundaryLeft = leftLead;
        const boundaryRight = rightLead - 1;

        if (state === "left") {
          const cxA = pvtX(leftLead) + Math.sin(angles[leftLead]) * Lpx;
          const cxB = pvtX(rel) + Math.sin(angles[rel]) * Lpx;
          if (cxB - cxA <= minD && avs[leftLead] > 0.0005) {
            const totalP = massPerBall * L * avs[0] * rel;
            const omegaOut = (totalP * rest) / (massPerBall * L * rel);
            for (let k = 0; k < rel; k++) {
              avs[k] = 0;
              angles[k] = 0;
            }
            for (let k = rel; k < rightLead; k++) {
              avs[k] = 0;
              angles[k] = 0;
            }
            for (let k = rightLead; k < n; k++) {
              avs[k] = omegaOut;
              angles[k] = 0;
            }
            swingStateRef.current = "right";
            collisionCountRef.current += 1;
            setCollisionCount(collisionCountRef.current);
          }
        } else {
          const cxA = pvtX(boundaryRight) + Math.sin(angles[boundaryRight]) * Lpx;
          const cxB = pvtX(rightLead) + Math.sin(angles[rightLead]) * Lpx;
          if (cxB - cxA <= minD && avs[rightLead] < -0.0005) {
            const totalP = massPerBall * L * Math.abs(avs[rightLead]) * rel;
            const omegaOut = -(totalP * rest) / (massPerBall * L * rel);
            for (let k = 0; k < rel; k++) {
              avs[k] = omegaOut;
              angles[k] = 0;
            }
            for (let k = rel; k < n; k++) {
              avs[k] = 0;
              angles[k] = 0;
            }
            swingStateRef.current = "left";
            collisionCountRef.current += 1;
            setCollisionCount(collisionCountRef.current);
          }
        }

        for (let i = 0; i < n; i++) {
          if (Math.abs(angles[i]) < SNAP_THRESH && Math.abs(avs[i]) < SNAP_THRESH) {
            angles[i] = 0;
            avs[i] = 0;
          }
        }

        let totalKe = 0;
        let totalPe = 0;
        const restY = pY + Lpx;
        for (let i = 0; i < n; i++) {
          const v = Math.abs(avs[i]) * L;
          const ballY = pY + Math.cos(angles[i]) * Lpx;
          totalKe += kineticEnergy(massPerBall, v);
          totalPe += potentialEnergy(massPerBall, Math.max(0, (restY - ballY) * (L / Lpx)), G);
        }
        setTotalKE(totalKe);
        setTotalPE(totalPe);
        frameCountRef.current += 1;
        if (frameCountRef.current % 30 === 0) setLiveStats({ fps: dt > 0 ? Math.round(1 / dt) : 60 });
      }

      setRenderTick((t) => t + 1);

      const totalSpan = sp * (n - 1);
      const barW = Math.max(120, totalSpan + 40);
      const cx = cw / 2;

      const bg = ctx.createLinearGradient(0, 0, cw, ch);
      bg.addColorStop(0, COLORS.gradientStart);
      bg.addColorStop(1, COLORS.gradientEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);

      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x <= cw; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }
      for (let y = 0; y <= ch; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      ctx.fillStyle = "#374151";
      ctx.fillRect(cx - barW / 2, pY - 8, barW, 12);
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - barW / 2, pY - 8, barW, 12);

      const ballR = calculateVisualRadius(massPerBall) * scl;
      const floorY = pY + Lpx + ballR + 20;

      for (let i = 0; i < n; i++) {
        const px = pvtX(i);
        const ballX = px + Lpx * Math.sin(angles[i]);
        const ballY = pY + Lpx * Math.cos(angles[i]);

        const shadowOffsetY = Math.sin(angles[i]) * ballR * 0.15;
        const shadowX = ballX;
        const shadowY = floorY + shadowOffsetY;
        const shadowBlur = 8 + Math.abs(Math.sin(angles[i])) * 4;
        const shadowAlpha = 0.2 - Math.abs(angles[i]) * 0.08;
        ctx.save();
        ctx.shadowColor = `rgba(0,0,0,${Math.max(0.05, shadowAlpha)})`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY, ballR * 0.9, ballR * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (let i = 0; i < n; i++) {
        const px = pvtX(i);
        const ballX = px + Lpx * Math.sin(angles[i]);
        const ballY = pY + Lpx * Math.cos(angles[i]);

        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px, pY);
        ctx.lineTo(ballX, ballY);
        ctx.stroke();
      }

      for (let i = 0; i < n; i++) {
        const px = pvtX(i);
        const ballX = px + Lpx * Math.sin(angles[i]);
        const ballY = pY + Lpx * Math.cos(angles[i]);

        const cxLight = ballX - ballR * 0.4;
        const cyLight = ballY - ballR * 0.4;
        const chromeGrad = ctx.createRadialGradient(
          cxLight, cyLight, 0,
          ballX, ballY, ballR * 1.2
        );
        chromeGrad.addColorStop(0, "#ffffff");
        chromeGrad.addColorStop(0.4, "#94a3b8");
        chromeGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = chromeGrad;
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
        ctx.fill();
        const highlightGrad = ctx.createRadialGradient(
          ballX - ballR * 0.2, ballY - ballR * 0.2, 0,
          ballX, ballY, ballR
        );
        highlightGrad.addColorStop(0, "rgba(255,255,255,0.5)");
        highlightGrad.addColorStop(0.4, "rgba(255,255,255,0.1)");
        highlightGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = highlightGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [ballCount, ballsToRelease, massPerBall, initialDisplacement, restitution, prefersReducedMotion, resetKey]);

  return (
    <div className="flex min-h-0 flex-col bg-[#F9FAFB] text-gray-900">
      {/* Top section: 70vh – Simulation (65%) + Controls (35%) */}
      <div
        className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row"
        style={{ minHeight: "70vh" }}
      >
        {/* Simulation box – 65% */}
        <div
          className="relative flex-[0_0_65%] min-h-[320px] rounded-xl border border-gray-200 shadow-inner"
          style={{
            background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
          }}
        >
          <p className="absolute left-4 top-3 z-10 text-xs font-medium text-gray-600">
            Newton&apos;s Cradle – conservation of momentum and energy
          </p>
          <div className="absolute inset-0 flex min-h-[280px] items-center justify-center p-2 pt-8">
            <canvas
              ref={canvasRef}
              className="max-h-full w-full cursor-grab rounded-lg object-contain active:cursor-grabbing"
              style={{ aspectRatio: "16/10" }}
              aria-label="Newton's Cradle simulation canvas - drag the left ball(s) to pull back"
            />
          </div>
          <button
            type="button"
            onClick={togglePause}
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              background: "white",
              border: "2px solid #555",
              borderRadius: 8,
              padding: "8px 24px",
              fontWeight: "bold",
              fontSize: 14,
              cursor: "pointer",
              zIndex: 10,
            }}
            aria-label={isPaused ? "Run simulation" : "Pause simulation"}
          >
            {isPaused ? "▶ Run" : "⏸ Pause"}
          </button>
        </div>

        {/* Parameter controls – 35% */}
        <div className="flex w-full flex-col justify-start gap-3 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:w-[35%] md:min-w-[280px]">
          <h3 className="shrink-0 text-sm font-bold text-gray-900">
            Parameter Controls
          </h3>

          <ParameterSlider
            label="Ball Count"
            value={ballCount}
            min={3}
            max={7}
            step={1}
            unit="balls"
            defaultValue={5}
            icon="⚪"
            dramaticRange={[4, 6]}
            onChange={setBallCount}
          />
          <ParameterSlider
            label="Balls to release"
            value={ballsToRelease}
            min={1}
            max={Math.max(1, Math.floor(ballCount / 2))}
            step={1}
            unit=""
            defaultValue={1}
            icon="🎱"
            onChange={(v) => setBallsToRelease(Math.round(v))}
          />
          <ParameterSlider
            label="Ball Mass"
            value={massPerBall}
            min={0.5}
            max={3}
            step={0.1}
            unit="kg"
            defaultValue={1}
            icon="⚖️"
            dramaticRange={[0.5, 1.5]}
            onChange={setMassPerBall}
          />
          <ParameterSlider
            label="Restitution"
            value={restitution}
            min={0.8}
            max={1}
            step={0.01}
            unit=""
            defaultValue={0.98}
            icon="🔄"
            dramaticRange={[0.95, 1]}
            onChange={setRestitution}
          />
          <ParameterSlider
            label="Initial Displacement"
            value={initialDisplacement}
            min={15}
            max={75}
            step={5}
            unit="°"
            defaultValue={45}
            icon="📐"
            dramaticRange={[35, 55]}
            onChange={setInitialDisplacement}
          />

          <button
            type="button"
            onClick={resetToDefault}
            onKeyDown={(e) => e.key === "Enter" && resetToDefault()}
            className="mt-auto flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-500 bg-blue-500 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Reset to default parameters"
          >
            <span aria-hidden>↺</span> Reset to Default
          </button>
        </div>
      </div>

      {/* Bottom section: 2-column educational content */}
      <div
        className="grid min-w-0 grid-cols-1 gap-4 overflow-x-hidden overflow-y-auto border-t border-gray-200 bg-white p-4 md:grid-cols-2 md:items-start"
        style={{ minHeight: "30vh" }}
      >
        {/* Left: Conservation Laws + Live Stats + Try This */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900">
              Physics Principle: Conservation of Momentum & Energy
            </h3>
            <p className="text-sm text-gray-700">
              Newton&apos;s Cradle is a classic demonstration of two fundamental laws of physics occurring in an <strong>elastic collision</strong>.
            </p>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">1. The Conservation Laws</h4>
              <ul className="mt-1 space-y-1.5 text-sm text-gray-700">
                <li>
                  <strong>Conservation of Momentum (Σp = constant):</strong> In an isolated system, the total momentum before collision equals the total momentum after.
                  <div className="mt-0.5 rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                    m₁v₁ + m₂v₂ = m₁v₁&apos; + m₂v₂&apos;
                  </div>
                </li>
                <li>
                  <strong>Conservation of Kinetic Energy (ΣKE = constant):</strong> In a perfectly elastic collision, the total energy of motion is preserved.
                  <div className="mt-0.5 rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                    ½m₁v₁² + ½m₂v₂² = ½m₁v₁&apos;² + ½m₂v₂&apos;²
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">2. How It Works (The Shockwave)</h4>
              <p className="mt-1 text-sm text-gray-700">
                When the swinging ball strikes the stationary pack, it comes to a near-instant stop. However, its momentum and energy are not lost. They are transferred as a <strong>shockwave</strong> (compression wave) through the intermediate balls.
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-gray-700">
                <li>The middle balls compress and expand slightly, passing the energy through to the final ball.</li>
                <li>Because the last ball has no neighbor to pass the energy to, it pops out with the same velocity as the incoming ball.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">3. Why N-in equals N-out?</h4>
              <p className="mt-1 text-sm text-gray-700">
                If you pull back <strong>two</strong> balls, <strong>two</strong> balls must swing out. Why doesn&apos;t just one ball swing out at double speed?
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-gray-700">
                <li>While that would conserve <em>momentum</em> (m₁v₁ + m₂v₂ = m·2v), it would violate the conservation of <em>energy</em> (kinetic energy would be doubled!).</li>
                <li>The only solution that satisfies <strong>both</strong> laws simultaneously is for the same mass to leave as entered.</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="min-w-0 space-y-2">
              <h3 className="text-sm font-bold text-blue-600">⚡ Live Stats</h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 font-mono text-[11px] text-gray-700">
                <div>KE: {totalKE.toFixed(2)} J</div>
                <div>PE: {totalPE.toFixed(2)} J</div>
                <div>Total: {(totalKE + totalPE).toFixed(2)} J</div>
                <div>Period T: {period.toFixed(2)} s</div>
                <div>Collisions: {collisionCount}</div>
              </div>
              <div className="text-[10px] text-gray-500">FPS: {liveStats.fps}</div>
            </div>
            <div className="min-w-0 max-w-full space-y-2">
              <h3 className="text-sm font-bold text-blue-600">💡 Try This</h3>
              <div className="max-w-full rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 break-words overflow-hidden">
                <p className="mb-1.5">
                  <strong>Classic:</strong> 5 balls, 1 release, 45° displacement
                </p>
                <p className="mb-1.5">
                  <strong>2-in 2-out:</strong> Release 2 balls to see symmetric transfer
                </p>
                <p className="mb-1.5">
                  <strong>Energy loss:</strong> Set Restitution &lt; 1 to see swing decay
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Applications & Real-World Context */}
        <div className="min-w-0 space-y-4">
          <h3 className="text-base font-bold text-gray-900">
            Applications & Real-World Context
          </h3>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Real-World Applications</h4>
            <p className="mt-1 text-sm text-gray-700">
              While Newton&apos;s Cradle is a toy, the physics governs massive industrial and astronomical events:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Pile Drivers:</strong> Construction machines use massive weights to strike piles. The momentum transfer drives the pile into the ground, just like the swinging ball transfers energy.
              </li>
              <li>
                <strong>Billiards/Pool:</strong> A perfect &apos;stop shot&apos; in pool (where the cue ball hits a target ball and stops dead) is exactly the same physics as the first ball in Newton&apos;s Cradle stopping upon impact.
              </li>
              <li>
                <strong>Rocket Slingshots:</strong> Spacecraft use &apos;gravity assists&apos; to steal momentum from planets to speed up—a cosmic version of elastic collision!
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Why do they eventually stop?</h4>
            <p className="mt-1 text-sm text-gray-700">
              In a perfect world, they would swing forever. In reality, they stop due to:
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-gray-700">
              <li><strong>Air Resistance:</strong> Drag slows the balls down.</li>
              <li><strong>Sound Energy:</strong> The &apos;click&apos; sound you hear is energy escaping the system!</li>
              <li><strong>Heat:</strong> Tiny vibrations inside the metal turn kinetic energy into heat.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <h4 className="text-sm font-semibold text-amber-900">Historical Fact</h4>
            <p className="mt-1 text-sm text-amber-900">
              Isaac Newton didn&apos;t actually invent this device! It was likely created by French physicist Edme Mariotte in the 17th century to demonstrate Newton&apos;s laws.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
