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

interface TrackedParameter {
  current: number;
  history: ParameterRecord[];
  peak: ParameterRecord | null;
  average: number;
}

interface ParameterSliderConfig {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  icon?: string;
  dramaticRange?: [number, number];
}

// ---------------------------------------------------------------------------
// Physics – Banking of Roads
// ---------------------------------------------------------------------------

const G = 9.81;

/** Ideal banking angle: tan(θ) = v²/(rg) → θ = arctan(v²/(rg)) */
const idealBankingAngle = (v: number, r: number): number => {
  if (r <= 0 || v < 0) return 0;
  return (Math.atan((v * v) / (r * G)) * 180) / Math.PI;
};

/** Design/safe speed for given banking: v = √(r·g·tan(θ)) */
const designSpeed = (thetaDeg: number, r: number): number => {
  if (r <= 0) return 0;
  const thetaRad = (thetaDeg * Math.PI) / 180;
  return Math.sqrt(r * G * Math.tan(thetaRad));
};

/** Centripetal acceleration a_c = v²/r */
const centripetalAcceleration = (v: number, r: number): number =>
  r > 0 ? (v * v) / r : 0;

/** Check if current speed matches design (within tolerance) */
const isIdealSpeed = (v: number, thetaDeg: number, r: number): boolean => {
  const vDesign = designSpeed(thetaDeg, r);
  return Math.abs(v - vDesign) < 0.5;
};

// ---------------------------------------------------------------------------
// Constants – Standard Web Color Palette
// ---------------------------------------------------------------------------

const COLORS = {
  bgLight: "#F5F5F5",
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
  grid: "rgba(229, 231, 235, 0.5)",
} as const;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;
const RECORD_THROTTLE_MS = 100;
const SCALE_MIN = 0.1;
const SCALE_MAX = 10;

// ---------------------------------------------------------------------------
// Parameter Slider Component
// ---------------------------------------------------------------------------

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  color = "#38bdf8",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-200">{label}</span>
        <span className="text-sm text-neutral-400 tabular-nums">
          {value.toFixed(step < 1 ? 2 : 1)}
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
        style={{ accentColor: color }}
        aria-label={label}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BankingOfRoadsSimulation() {
  const [speed, setSpeed] = useState(25);
  const [radius, setRadius] = useState(80);
  const [angle, setAngle] = useState(15);
  const [playing, setPlaying] = useState(true);

  const [carPosition, setCarPosition] = useState(0);
  const [scale, setScale] = useState(1);
  const [fps, setFps] = useState(60);
  const [physicsTimeMs, setPhysicsTimeMs] = useState(0);

  const lastTimeRef = useRef<number | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const fpsTimeRef = useRef(0);
  const lastRecordTimeRef = useRef(0);

  const [simState, setSimState] = useState<{
    speed: TrackedParameter;
    radius: TrackedParameter;
    angle: TrackedParameter;
  }>({
    speed: { current: 25, history: [], peak: null, average: 25 },
    radius: { current: 80, history: [], peak: null, average: 80 },
    angle: { current: 15, history: [], peak: null, average: 15 },
  });

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const thetaRad = (angle * Math.PI) / 180;
  const vDesign = designSpeed(angle, radius);
  const thetaIdeal = idealBankingAngle(speed, radius);
  const aC = centripetalAcceleration(speed, radius);
  const ideal = isIdealSpeed(speed, angle, radius);

  const recordParameters = useCallback(
    (timestamp: number) => {
      setSimState((prev) => {
        const record = (
          key: "speed" | "radius" | "angle",
          val: number,
          extra: { [k: string]: number }
        ): TrackedParameter => {
          const p = prev[key];
          const rec: ParameterRecord = {
            timestamp,
            value: val,
            calculatedResults: extra,
          };
          const history = [...p.history, rec].slice(-500);
          const sum = history.reduce((a, r) => a + r.value, 0);
          const average = history.length ? sum / history.length : p.average;
          const peak = p.peak == null || val > p.peak.value ? rec : p.peak;
          return { current: val, history, peak, average };
        };
        return {
          speed: record("speed", speed, { vDesign: vDesign, aC }),
          radius: record("radius", radius, { vDesign, aC }),
          angle: record("angle", angle, { thetaIdeal, vDesign }),
        };
      });
    },
    [speed, radius, angle, vDesign, aC, thetaIdeal]
  );

  const autoScale = useCallback(
    (viewportW: number, viewportH: number, boundsSize: number) => {
      const w = boundsSize * scale;
      const h = boundsSize * scale;
      let newScale = scale;
      if (w > viewportW * 0.8 || h > viewportH * 0.8) newScale *= 0.95;
      else if (w < viewportW * 0.4 && h < viewportH * 0.4) newScale *= 1.05;
      newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, newScale));
      if (newScale !== scale) setScale(newScale);
    },
    [scale]
  );

  const animate = useCallback(
    (time: number) => {
      if (frameIdRef.current == null || !playing) return;
      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
        frameIdRef.current = requestAnimationFrame(animate);
        return;
      }
      const deltaMs = time - lastTimeRef.current;
      if (deltaMs < FRAME_DURATION) {
        frameIdRef.current = requestAnimationFrame(animate);
        return;
      }

      lastTimeRef.current = time;
      const dt = deltaMs / 1000;

      const t0 = performance.now();

      setCarPosition((p) => {
        if (radius <= 0) return p;
        const omega = speed / radius;
        return (p + omega * dt) % (2 * Math.PI);
      });

      setPhysicsTimeMs(performance.now() - t0);

      frameCountRef.current += 1;
      fpsTimeRef.current += deltaMs;
      if (fpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        fpsTimeRef.current = 0;
      }

      if (time - lastRecordTimeRef.current >= RECORD_THROTTLE_MS) {
        lastRecordTimeRef.current = time;
        recordParameters(time);
      }

      const boundsSize = radius * 4;
      autoScale(CANVAS_WIDTH, CANVAS_HEIGHT, boundsSize);

      frameIdRef.current = requestAnimationFrame(animate);
    },
    [speed, radius, recordParameters, autoScale, playing]
  );

  useEffect(() => {
    if (!playing) return;
    frameIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameIdRef.current != null)
        cancelAnimationFrame(frameIdRef.current);
    };
  }, [animate, playing]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Enter") handleReset();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const handleReset = () => {
    setSpeed(25);
    setRadius(80);
    setAngle(15);
    setPlaying(true);
    setCarPosition(0);
    setScale(1);
    setSimState({
      speed: { current: 25, history: [], peak: null, average: 25 },
      radius: { current: 80, history: [], peak: null, average: 80 },
      angle: { current: 15, history: [], peak: null, average: 15 },
    });
  };

  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  // Map radius (20–200 m) linearly to track pixels (65–200) so visual matches slider
  const trackRadiusX =
    (65 + ((radius - 20) / 180) * 135) * scale;
  const trackRadiusY = trackRadiusX * 0.4;
  const carAngle = carPosition;
  const centerlineX = cx + trackRadiusX * Math.cos(carAngle - Math.PI / 2);
  const centerlineY = cy + trackRadiusY * Math.sin(carAngle - Math.PI / 2);
  const toCenterX = cx - centerlineX;
  const toCenterY = cy - centerlineY;
  const toCenterLen = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY) || 1;
  const fcArrowLen = 40;
  // Wheel contact is ~20px from car center (wheel center at 14 + radius 6). Road inner edge is ~9px from centerline.
  // Position car so wheel contact lies on road: car + 20*inward = centerline + 9*inward => car = centerline - 11*inward
  const wheelContactOffset = 20;
  const roadInnerOffset = 9;
  const carOffset = roadInnerOffset - wheelContactOffset;
  const carX = centerlineX + (carOffset * toCenterX) / toCenterLen;
  const carY = centerlineY + (carOffset * toCenterY) / toCenterLen;
  // Car rotation: +y (wheels) must point toward center so tires stay on road; add banking tilt
  const carRotationDeg =
    (Math.atan2(toCenterY, toCenterX) * 180) / Math.PI - 90 - angle;

  const sliders: ParameterSliderConfig[] = [
    {
      label: "Speed",
      value: speed,
      min: 5,
      max: 50,
      step: 1,
      unit: "m/s",
      defaultValue: 25,
      icon: "⚡",
      dramaticRange: [20, 35],
    },
    {
      label: "Radius",
      value: radius,
      min: 20,
      max: 200,
      step: 5,
      unit: "m",
      defaultValue: 80,
      icon: "🌀",
      dramaticRange: [50, 120],
    },
    {
      label: "Banking Angle",
      value: angle,
      min: 0,
      max: 45,
      step: 1,
      unit: "°",
      defaultValue: 15,
      icon: "📐",
      dramaticRange: [10, 25],
    },
  ];

  const proTipText = ideal
    ? "✨ Perfect! Speed matches design—no friction needed."
    : speed > vDesign
      ? `💡 Speed > design—car tends to slip outward.`
      : speed < vDesign
        ? `💡 Speed < design—car tends to slip inward.`
        : "💡 Adjust speed to match design speed!";

  return (
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Top Row: Simulation Canvas (2 columns) */}
          <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-400">
                Banking of roads simulation.
                <span
                  className={`ml-3 px-2.5 py-1 text-xs font-medium rounded-full ${ideal ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                    }`}
                >
                  {ideal ? "✓ Ideal" : "Off design"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${!playing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#030712] aspect-video">
              <svg
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                className="w-full h-full block"
                role="img"
                aria-label="Banking of roads - car on banked curve"
              >
                <defs>
                  <pattern
                    id="bor-grid"
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(100, 116, 139, 0.12)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                  <linearGradient id="bor-road" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                  <radialGradient id="bor-center-glow" r="70%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="bor-car-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
                  </linearGradient>
                  <filter id="bor-glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#bor-grid)" />
                <ellipse cx={cx} cy={cy} rx={200} ry={200} fill="url(#bor-center-glow)" />

                {/* Origin */}
                <line
                  x1={cx - 8}
                  y1={cy}
                  x2={cx + 8}
                  y2={cy}
                  stroke="#6B7280"
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />
                <line
                  x1={cx}
                  y1={cy - 8}
                  x2={cx}
                  y2={cy + 8}
                  stroke="#6B7280"
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />

                {/* Curved banked track — elliptical path (top-down view) */}
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={trackRadiusX}
                  ry={trackRadiusY}
                  fill="none"
                  stroke="url(#bor-road)"
                  strokeWidth="18"
                  strokeDasharray="none"
                />

                {/* Inner track edge */}
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={trackRadiusX - 10}
                  ry={trackRadiusY - 4}
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />

                {/* Road surface lines — dashed center */}
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={trackRadiusX - 4}
                  ry={trackRadiusY - 1.6}
                  fill="none"
                  stroke="#FCD34D"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                />

                {/* Car — wheels aligned to road surface, tires touching at all rotation angles */}
                <g
                  transform={`translate(${carX}, ${carY}) rotate(${carRotationDeg})`}
                  filter="url(#bor-glow)"
                >
                  <rect
                    x={-28}
                    y={-14}
                    width={56}
                    height={28}
                    rx={4}
                    fill="url(#bor-car-glow)"
                    stroke="#1E40AF"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={-20}
                    y={-10}
                    width={16}
                    height={12}
                    fill="#60A5FA"
                    opacity="0.8"
                  />
                  <rect
                    x={4}
                    y={-10}
                    width={16}
                    height={12}
                    fill="#60A5FA"
                    opacity="0.8"
                  />
                  {/* Wheels — drawn to overlap road surface, r=6 for clear contact */}
                  <circle cx={-16} cy={14} r={6} fill="#1F2937" stroke="#374151" strokeWidth="1" />
                  <circle cx={16} cy={14} r={6} fill="#1F2937" stroke="#374151" strokeWidth="1" />
                </g>

                {/* Force diagram at car position */}
                <g transform={`translate(${carX}, ${carY})`}>
                  {/* mg — downward, scaled */}
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={50}
                    stroke="#EF4444"
                    strokeWidth="2"
                    markerEnd="url(#arrow-red)"
                  />
                  <text x={12} y={28} fill="#EF4444" fontSize="11" fontWeight="600">
                    mg
                  </text>

                  {/* N — normal, perpendicular to road (tilted by θ) */}
                  <line
                    x1={0}
                    y1={0}
                    x2={45 * Math.sin(thetaRad)}
                    y2={-45 * Math.cos(thetaRad)}
                    stroke="#10B981"
                    strokeWidth="2"
                    markerEnd="url(#arrow-green)"
                  />
                  <text
                    x={50 * Math.sin(thetaRad)}
                    y={-50 * Math.cos(thetaRad)}
                    fill="#10B981"
                    fontSize="11"
                    fontWeight="600"
                  >
                    N
                  </text>

                  {/* Fc arrow — centripetal (toward center) */}
                  <line
                    x1={0}
                    y1={0}
                    x2={(fcArrowLen * toCenterX) / toCenterLen}
                    y2={(fcArrowLen * toCenterY) / toCenterLen}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    markerEnd="url(#arrow-blue)"
                  />
                  <text
                    x={(fcArrowLen + 12) * toCenterX / toCenterLen}
                    y={(fcArrowLen + 12) * toCenterY / toCenterLen}
                    fill="#3B82F6"
                    fontSize="10"
                    fontWeight="600"
                  >
                    Fc
                  </text>
                </g>

                {/* Arrow markers */}
                <defs>
                  <marker
                    id="arrow-red"
                    markerWidth="8"
                    markerHeight="8"
                    refX="4"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#EF4444" />
                  </marker>
                  <marker
                    id="arrow-green"
                    markerWidth="8"
                    markerHeight="8"
                    refX="4"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#10B981" />
                  </marker>
                  <marker
                    id="arrow-blue"
                    markerWidth="8"
                    markerHeight="8"
                    refX="4"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#3B82F6" />
                  </marker>
                </defs>

                {/* Radius indicator — from center to track edge (top of ellipse) */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={cy - trackRadiusY}
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text
                  x={cx + 10}
                  y={cy - trackRadiusY / 2 + 4}
                  fill="#06B6D4"
                  fontSize="11"
                  fontWeight="600"
                >
                  r = {radius} m
                </text>

                {/* Banking angle arc — near road */}
                <g transform={`translate(${cx + trackRadiusX + 50}, ${cy - 60})`}>
                  <path
                    d={`M 0 40 L 0 0 L ${40 * Math.tan(thetaRad)} 40 Z`}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <text x={20} y={50} fill="#6B7280" fontSize="10">
                    θ = {angle.toFixed(1)}°
                  </text>
                </g>

                {/* Legend */}
                <g transform={`translate(${CANVAS_WIDTH - 200}, 24)`}>
                  <rect
                    x={0}
                    y={0}
                    width={188}
                    height={72}
                    rx={8}
                    fill="rgba(15, 23, 42, 0.8)"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text x={10} y={18} fill="#E2E8F0" fontSize="11" fontWeight="700">
                    Legend
                  </text>
                  <line x1={10} y1={28} x2={28} y2={28} stroke="#EF4444" strokeWidth="3" />
                  <text x={34} y={31} fill="#CBD5E1" fontSize="10">
                    mg — weight
                  </text>
                  <line x1={10} y1={42} x2={28} y2={42} stroke="#10B981" strokeWidth="3" />
                  <text x={34} y={45} fill="#CBD5E1" fontSize="10">
                    N — normal
                  </text>
                  <line x1={10} y1={56} x2={28} y2={56} stroke="#3B82F6" strokeWidth="3" />
                  <text x={34} y={59} fill="#CBD5E1" fontSize="10">
                    Fc — centripetal
                  </text>
                </g>

                <text x={12} y={24} fill="#64748B" fontSize="11">
                  {fps} fps
                </text>
                <text x={12} y={38} fill="#64748B" fontSize="10">
                  Δt: {physicsTimeMs.toFixed(2)} ms
                </text>
              </svg>
            </div>
          </div>

          {/* Controls Panel (1 column) */}
          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Parameters</h3>
              <div className="flex flex-col gap-3">
                <SliderRow
                  label="Speed"
                  value={speed}
                  min={5}
                  max={50}
                  step={1}
                  unit="m/s"
                  color="#ef4444"
                  onChange={(v) => setSpeed(v)}
                />
                <SliderRow
                  label="Radius"
                  value={radius}
                  min={20}
                  max={200}
                  step={5}
                  unit="m"
                  color="#38bdf8"
                  onChange={(v) => setRadius(v)}
                />
                <SliderRow
                  label="Banking Angle"
                  value={angle}
                  min={0}
                  max={45}
                  step={1}
                  unit="°"
                  color="#a855f7"
                  onChange={(v) => setAngle(v)}
                />
              </div>
            </div>

            <div className={`rounded-xl border border-neutral-800 p-4 text-sm ${ideal ? "bg-emerald-500/10 text-emerald-300" : "bg-cyan-500/10 text-cyan-300"
              }`}>
              {proTipText}
            </div>
          </aside>
          </div>
        </div>

          {/* Bottom Row: Info Panel (Full width, 3 cols) */}
          <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: Concept & formula */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-cyan-400 mb-2">
                  ✨ The Concept
                </h4>
                <p className="text-sm mb-3">
                  On a banked road, the road surface is tilted at an angle θ. The
                  horizontal component of the normal force (N sin θ) provides the
                  centripetal force needed for circular motion, reducing reliance on
                  friction.
                </p>
                <h5 className="text-xs font-bold text-cyan-400 mb-1">
                  📐 Key Formula
                </h5>
                <pre className="text-xs font-mono text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-lg p-2 overflow-x-auto">
                  {`tan θ = v² / (r·g)

Where: v = speed, r = radius, g = 9.81 m/s²
Design speed: v = √(r·g·tan θ)`}
                </pre>
              </div>

              {/* Middle: Live physics */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-cyan-400 mb-2">
                  🧮 Live Calculation
                </h4>
                <div className="text-sm font-mono text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
                  <div>
                    v = {speed.toFixed(1)} m/s, r = {radius.toFixed(0)} m, θ ={" "}
                    {angle.toFixed(1)}°
                  </div>
                  <div>
                    v_design = √(r·g·tan θ) = √({radius.toFixed(0)} × 9.81 × tan(
                    {angle.toFixed(1)}°)) ={" "}
                    <span className="text-cyan-400 font-semibold">
                      {vDesign.toFixed(2)} m/s
                    </span>
                  </div>
                  <div>
                    θ_ideal = arctan(v²/(rg)) = arctan(
                    {(speed * speed).toFixed(0)}/({radius.toFixed(0)}×9.81)) ={" "}
                    <span className="text-cyan-400 font-semibold">
                      {thetaIdeal.toFixed(1)}°
                    </span>
                  </div>
                  <div>
                    a_c = v²/r ={" "}
                    <span className="text-cyan-400 font-semibold">
                      {aC.toFixed(2)} m/s²
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Try This */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-cyan-400 mb-2">
                  💡 Try This for Drama!
                </h4>
                <ul className="text-sm space-y-3">
                  <li>
                    <strong className="text-neutral-200">🎯 Ideal banking:</strong> θ = 15°, r = 80 m → v = 14.5
                    m/s for perfect balance.
                  </li>
                  <li>
                    <strong className="text-neutral-200">⚡ Steep bank:</strong> θ = 30°, r = 50 m → v ≈ 16.9
                    m/s—high-speed tight turn!
                  </li>
                  <li>
                    <strong className="text-neutral-200">🌟 Flat curve:</strong> θ = 5°, r = 100 m → v ≈ 9.3
                    m/s—needs friction at higher speeds.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
