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

function ParameterSlider({
  config,
  onChange,
}: {
  config: ParameterSliderConfig;
  onChange: (v: number) => void;
}) {
  const { label, value, min, max, step, unit, icon, dramaticRange } = config;
  const pct = ((value - min) / (max - min)) * 100;
  const dramaticStart =
    dramaticRange != null ? ((dramaticRange[0] - min) / (max - min)) * 100 : 0;
  const dramaticEnd =
    dramaticRange != null ? ((dramaticRange[1] - min) / (max - min)) * 100 : 0;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
          {icon != null && <span>{icon}</span>}
          <span>{label}</span>
        </span>
        <span className="text-sm font-semibold text-blue-600">
          {value.toFixed(step < 1 ? 2 : 1)} {unit}
        </span>
      </div>
      <div className="relative w-full">
        {dramaticRange != null && (
          <div
            className="absolute h-2 rounded-full pointer-events-none bg-blue-200/60"
            style={{
              left: `${dramaticStart}%`,
              width: `${dramaticEnd - dramaticStart}%`,
              top: "50%",
              transform: "translateY(-50%)",
              boxShadow: "0 0 12px rgba(59,130,246,0.4)",
            }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="physics-range w-full"
          aria-label={`${label}: ${value.toFixed(2)} ${unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value.toFixed(2)} ${unit}`}
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #60A5FA ${pct}%, #E5E7EB ${pct}%, #E5E7EB 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-gray-500 mt-0.5">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
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
      if (frameIdRef.current == null) return;
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
    [speed, radius, recordParameters, autoScale]
  );

  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameIdRef.current != null)
        cancelAnimationFrame(frameIdRef.current);
    };
  }, [animate]);

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
    ? "✨ Perfect! Speed matches design—no friction needed. Watch the forces balance."
    : speed > vDesign
      ? `💡 Speed (${speed.toFixed(1)} m/s) > design (${vDesign.toFixed(1)} m/s)—car tends to slip outward. Try lowering speed.`
      : speed < vDesign
        ? `💡 Speed (${speed.toFixed(1)} m/s) < design (${vDesign.toFixed(1)} m/s)—car tends to slip inward. Try increasing speed.`
        : "💡 Adjust speed to match design speed for ideal banking—no friction required! 🎯";

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-[#E8EEF2] to-[#FFFFFF] text-gray-900">
      {/* Top section: 70vh — Sim (65%) + Controls (35%) */}
      <div
        className="flex flex-1 min-h-0 flex-col lg:flex-row px-4 py-4 gap-4"
        style={{ height: "70vh" }}
      >
        {/* Simulation box — 65% width */}
        <div className="lg:w-[65%] w-full min-h-0 flex flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <h2 className="text-base font-semibold text-[#3B82F6]">
              Banking of Roads
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  ideal ? "bg-green-500 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                {ideal ? "✓ Ideal" : "Off design"}
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative bg-gradient-to-br from-[#E8EEF2] via-[#F5F5F5] to-[#FFFFFF]">
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
                    stroke={COLORS.grid}
                    strokeWidth="0.5"
                  />
                </pattern>
                <linearGradient id="bor-road" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6B7280" />
                  <stop offset="50%" stopColor="#9CA3AF" />
                  <stop offset="100%" stopColor="#6B7280" />
                </linearGradient>
                <radialGradient id="bor-center-glow" r="70%">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
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
                  fill="rgba(249,250,251,0.95)"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
                <text x={10} y={18} fill="#111827" fontSize="11" fontWeight="700">
                  Legend
                </text>
                <line x1={10} y1={28} x2={28} y2={28} stroke="#EF4444" strokeWidth="3" />
                <text x={34} y={31} fill="#374151" fontSize="10">
                  mg — weight
                </text>
                <line x1={10} y1={42} x2={28} y2={42} stroke="#10B981" strokeWidth="3" />
                <text x={34} y={45} fill="#374151" fontSize="10">
                  N — normal
                </text>
                <line x1={10} y1={56} x2={28} y2={56} stroke="#3B82F6" strokeWidth="3" />
                <text x={34} y={59} fill="#374151" fontSize="10">
                  Fc — centripetal
                </text>
              </g>

              <text x={12} y={24} fill="#6B7280" fontSize="11">
                {fps} fps
              </text>
              <text x={12} y={38} fill="#6B7280" fontSize="10">
                Δt: {physicsTimeMs.toFixed(2)} ms
              </text>
            </svg>
          </div>
        </div>

        {/* Parameter controls — 35% width */}
        <div className="lg:w-[35%] w-full flex flex-col rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] shadow-lg p-4 overflow-auto">
          <h3 className="text-sm font-semibold text-[#3B82F6] mb-1">
            Parameters
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            All controls visible — no scrolling.
          </p>

          {sliders.map((s) => (
            <ParameterSlider
              key={s.label}
              config={s}
              onChange={(v) => {
                if (s.label === "Speed") setSpeed(v);
                if (s.label === "Radius") setRadius(v);
                if (s.label === "Banking Angle") setAngle(v);
              }}
            />
          ))}

          <div className="rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-2 text-xs text-sky-800 mb-3">
            {proTipText}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition mt-auto"
          >
            ↺ Reset to Default
          </button>
        </div>
      </div>

      {/* Bottom section: 30vh — Educational content */}
      <div
        className="flex-none border-t border-gray-200 bg-[#F9FAFB] px-4 py-4"
        style={{ minHeight: "30vh" }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left 40%: Concept & formula */}
          <div className="md:col-span-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-bold text-[#3B82F6] mb-2">
              ✨ The Concept
            </h4>
            <p className="text-xs text-gray-700 mb-3">
              On a banked road, the road surface is tilted at an angle θ. The
              horizontal component of the normal force (N sin θ) provides the
              centripetal force needed for circular motion, reducing reliance on
              friction.
            </p>
            <h5 className="text-xs font-bold text-[#3B82F6] mb-1">
              📐 Key Formula
            </h5>
            <pre className="text-[11px] font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-2 overflow-x-auto">
              {`tan θ = v² / (r·g)

Where: v = speed, r = radius, g = 9.81 m/s²
Design speed: v = √(r·g·tan θ)`}
            </pre>
          </div>

          {/* Middle 30%: Live physics */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-bold text-[#3B82F6] mb-2">
              🧮 Live Calculation
            </h4>
            <div className="text-[11px] font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
              <div>
                v = {speed.toFixed(1)} m/s, r = {radius.toFixed(0)} m, θ ={" "}
                {angle.toFixed(1)}°
              </div>
              <div>
                v_design = √(r·g·tan θ) = √({radius.toFixed(0)} × 9.81 × tan(
                {angle.toFixed(1)}°)) ={" "}
                <span className="text-blue-600 font-semibold">
                  {vDesign.toFixed(2)} m/s
                </span>
              </div>
              <div>
                θ_ideal = arctan(v²/(rg)) = arctan(
                {(speed * speed).toFixed(0)}/({radius.toFixed(0)}×9.81)) ={" "}
                <span className="text-blue-600 font-semibold">
                  {thetaIdeal.toFixed(1)}°
                </span>
              </div>
              <div>
                a_c = v²/r ={" "}
                <span className="text-blue-600 font-semibold">
                  {aC.toFixed(2)} m/s²
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              ⚡ FPS: {fps} · Speed avg: {simState.speed.average.toFixed(1)} m/s
            </div>
          </div>

          {/* Right 30%: Try This */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-bold text-[#3B82F6] mb-2">
              💡 Try This for Drama!
            </h4>
            <ul className="text-xs text-gray-700 space-y-2">
              <li>
                <strong>🎯 Ideal banking:</strong> θ = 15°, r = 80 m → v = 14.5
                m/s for perfect balance.
              </li>
              <li>
                <strong>⚡ Steep bank:</strong> θ = 30°, r = 50 m → v ≈ 16.9
                m/s—high-speed tight turn!
              </li>
              <li>
                <strong>🌟 Flat curve:</strong> θ = 5°, r = 100 m → v ≈ 9.3
                m/s—needs friction at higher speeds.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
