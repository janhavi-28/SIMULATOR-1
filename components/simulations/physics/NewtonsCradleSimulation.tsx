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
  accentColor?: string;
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
  bgLight: "#020617",
  bgDark: "#0D1117",
  gradientStart: "#020617",
  gradientEnd: "#0D1117",
  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#1E293B",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  track: "#1E293B",
  hover: "#1E293B",
  grid: "rgba(255, 255, 255, 0.05)",
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

function SliderRow({
  label, value, min, max, step, unit, icon, accentColor = "#3B82F6", onChange,
}: ParameterSliderProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">{icon} {label}</span>
        <span className="text-sm text-neutral-400 tabular-nums">
          {step < 0.1 ? value.toFixed(2) : Math.round(value)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="physics-range w-full"
        style={{ accentColor }}
        aria-label={label}
      />
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
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Top Row: Simulation Canvas (2 columns) */}
          <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 mb-6">
              <div className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                ⚪ Newton&apos;s Cradle
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePause}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${isPaused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isPaused ? "▶ Play" : "⏸ Pause"}
                </button>
                <button
                  type="button"
                  onClick={resetToDefault}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-2xl border border-neutral-700 bg-[#0D1117] aspect-video">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing block"
                aria-label="Newton's Cradle simulation canvas - drag the left ball(s) to pull back"
              />
              <div className="absolute top-3 right-3 z-10 bg-neutral-950/90 border border-neutral-700 rounded-lg px-3 py-1.5 font-mono text-xs shadow-md">
                <div className="text-neutral-400">FPS: <span className="text-cyan-400">{liveStats.fps}</span></div>
                <div className="text-neutral-400">Total Energy: <span className="text-amber-400">{(totalKE + totalPE).toFixed(2)} J</span></div>
                <div className="text-neutral-400">Period (T): <span className="text-emerald-400">{period.toFixed(2)} s</span></div>
              </div>
            </div>
          </div>

          {/* Controls Panel (1 column) */}
          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
            <div>
              <h3 className="mb-4 text-xs font-bold tracking-widest text-neutral-500">⚙ PARAMETERS</h3>
              <div className="flex flex-col gap-3">
                <SliderRow label="Ball Count" value={ballCount} min={3} max={7} step={1} unit="balls"
                  defaultValue={5} icon="⚪" dramaticRange={[4, 6]} accentColor="#3B82F6" onChange={setBallCount} />
                <SliderRow label="Balls to release" value={ballsToRelease} min={1} max={Math.max(1, Math.floor(ballCount / 2))} step={1} unit=""
                  defaultValue={1} icon="🎱" accentColor="#8B5CF6" onChange={(v) => setBallsToRelease(Math.round(v))} />
                <SliderRow label="Ball Mass" value={massPerBall} min={0.5} max={3} step={0.1} unit="kg"
                  defaultValue={1} icon="⚖️" dramaticRange={[0.5, 1.5]} accentColor="#06B6D4" onChange={setMassPerBall} />
                <SliderRow label="Restitution" value={restitution} min={0.8} max={1} step={0.01} unit=""
                  defaultValue={0.98} icon="🔄" dramaticRange={[0.95, 1]} accentColor="#10B981" onChange={setRestitution} />
                <SliderRow label="Initial Displacement" value={initialDisplacement} min={15} max={75} step={5} unit="°"
                  defaultValue={45} icon="📐" dramaticRange={[35, 55]} accentColor="#F59E0B" onChange={setInitialDisplacement} />
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 font-mono text-sm space-y-2">
              <div className="text-neutral-500 font-sans font-bold tracking-wider text-xs mb-1">LIVE METRICS</div>
              <div className="flex justify-between"><span className="text-neutral-400">Kinetic Energy</span><span className="text-cyan-400">{totalKE.toFixed(2)} J</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Potential Energy</span><span className="text-emerald-400">{totalPE.toFixed(2)} J</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Collisions Count</span><span className="text-amber-400">{collisionCount}</span></div>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="font-bold text-blue-400 mb-2 font-sans">💡 Try This</div>
              <div className="space-y-3 font-sans text-xs">
                <div><span className="text-blue-300 font-bold">Classic:</span> <span className="text-blue-200/80">5 balls, 1 release, 45° displacement</span></div>
                <div><span className="text-blue-300 font-bold">2-in 2-out:</span> <span className="text-blue-200/80">Release 2 balls to see symmetric transfer</span></div>
                <div><span className="text-blue-300 font-bold">Energy loss:</span> <span className="text-blue-200/80">Set Restitution &lt; 1 to see swing decay</span></div>
              </div>
            </div>
          </aside>
          </div>
        </div>

          {/* Bottom Row: Info Panel */}
          <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl flex flex-col md:flex-row gap-6">

            <div className="flex-1 space-y-4">
              <h3 className="text-sm font-bold text-cyan-400 tracking-widest uppercase">Physics Principle: Conservation Laws</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                Newton&apos;s Cradle is a classic demonstration of two fundamental laws of physics occurring in an <strong>elastic collision</strong>.
              </p>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-200 mb-1">1. The Conservation Laws</h4>
                  <ul className="space-y-2 text-sm text-neutral-400 font-sans">
                    <li>
                      <strong className="text-emerald-400">Conservation of Momentum (Σp = constant):</strong> In an isolated system, the total momentum before collision equals the total momentum after.
                      <div className="mt-1 rounded border border-neutral-700 bg-black/40 px-3 py-1.5 font-mono text-[11px] text-emerald-300">
                        m₁v₁ + m₂v₂ = m₁v₁&apos; + m₂v₂&apos;
                      </div>
                    </li>
                    <li>
                      <strong className="text-amber-400">Conservation of Kinetic Energy (ΣKE = constant):</strong> In a perfectly elastic collision, the total energy of motion is preserved.
                      <div className="mt-1 rounded border border-neutral-700 bg-black/40 px-3 py-1.5 font-mono text-[11px] text-amber-300">
                        ½m₁v₁² + ½m₂v₂² = ½m₁v₁&apos;² + ½m₂v₂&apos;²
                      </div>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-200 mb-1">2. How It Works (The Shockwave)</h4>
                  <p className="text-sm text-neutral-400 font-sans leading-relaxed">
                    When the swinging ball strikes the stationary pack, it comes to a near-instant stop. However, its momentum and energy are not lost. They are transferred as a <strong>shockwave</strong> (compression wave) through the intermediate balls.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 tracking-widest uppercase">Applications & Real-World Context</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-200 mb-1">Real-World Applications</h4>
                  <p className="text-sm text-neutral-400 font-sans mb-2">
                    While Newton&apos;s Cradle is a toy, the physics governs massive industrial and astronomical events:
                  </p>
                  <ul className="space-y-2 text-sm text-neutral-400 font-sans list-disc pl-5 marker:text-emerald-500">
                    <li>
                      <strong className="text-neutral-300">Pile Drivers:</strong> Construction machines use massive weights to strike piles. The momentum transfer drives the pile into the ground, just like the swinging ball transfers energy.
                    </li>
                    <li>
                      <strong className="text-neutral-300">Rocket Slingshots:</strong> Spacecraft use &apos;gravity assists&apos; to steal momentum from planets to speed up—a cosmic version of elastic collision!
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-900/30 bg-amber-900/10 p-4">
                  <h4 className="text-sm font-semibold text-amber-500 mb-1">Why do they eventually stop?</h4>
                  <p className="text-sm text-amber-200/70 font-sans mb-2">In reality, they stop due to:</p>
                  <ul className="space-y-1 text-sm text-amber-200/70 font-sans list-disc pl-5">
                    <li><strong>Air Resistance:</strong> Drag slows the balls down.</li>
                    <li><strong>Sound Energy:</strong> The &apos;click&apos; sound is energy escaping.</li>
                    <li><strong>Heat:</strong> Tiny vibrations turn kinetic energy into heat.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>
    </main>
  );
}
