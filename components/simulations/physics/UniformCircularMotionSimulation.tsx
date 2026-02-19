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

type ScaleLevel = "nuclear" | "atomic" | "planetary";

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

type SamplePoint = { t: number; x: number; y: number };

// ---------------------------------------------------------------------------
// Physics (UCM formulae – unchanged)
// ---------------------------------------------------------------------------

const TWO_PI = Math.PI * 2;

const angularVelocity = (v: number, r: number) => (r === 0 ? 0 : v / r);
const centripetalAcceleration = (v: number, r: number) =>
  r === 0 ? 0 : (v * v) / r;
const centripetalForce = (m: number, v: number, r: number) =>
  r === 0 ? 0 : (m * v * v) / r;
const timePeriod = (v: number, r: number) =>
  v === 0 ? Infinity : (TWO_PI * r) / v;

/** Visual radius ∝ ∛mass for spherical object */
const calculateVisualRadius = (mass: number): number => {
  const baseRadius = 10;
  return baseRadius * Math.cbrt(Math.max(mass, 0.01));
};

const interpolateParameter = (
  current: number,
  target: number,
  speed: number = 0.15
): number => current + (target - current) * speed;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;
const PIXELS_PER_METER = 30;
const TRAIL_MAX_SECONDS = 1;
const RECORD_THROTTLE_MS = 100;
const SCALE_MIN = 0.1;
const SCALE_MAX = 10;

// ---------------------------------------------------------------------------
// Parameter slider component
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
          onInput={(e) =>
            onChange(Number((e.target as HTMLInputElement).value))
          }
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
// Main component
// ---------------------------------------------------------------------------

export default function UniformCircularMotionSimulation() {
  const [radiusTarget, setRadiusTarget] = useState(5);
  const [speedTarget, setSpeedTarget] = useState(10);
  const [massTarget, setMassTarget] = useState(2);
  const [scaleLevel, setScaleLevel] = useState<ScaleLevel>("atomic");

  const [radius, setRadius] = useState(5);
  const [speed, setSpeed] = useState(10);
  const [mass, setMass] = useState(2);

  const [angle, setAngle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slowMotion, setSlowMotion] = useState(false);
  const [scale, setScale] = useState(1);
  const [fps, setFps] = useState(60);
  const [physicsTimeMs, setPhysicsTimeMs] = useState(0);

  const samplesRef = useRef<SamplePoint[]>([]);
  const lastTimeRef = useRef<number | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const fpsTimeRef = useRef(0);
  const lastRecordTimeRef = useRef(0);

  const [simState, setSimState] = useState<{
    radius: TrackedParameter;
    speed: TrackedParameter;
    mass: TrackedParameter;
  }>({
    radius: { current: 5, history: [], peak: null, average: 5 },
    speed: { current: 10, history: [], peak: null, average: 10 },
    mass: { current: 2, history: [], peak: null, average: 2 },
  });

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const omega = useMemo(() => angularVelocity(speed, radius), [speed, radius]);
  const aC = useMemo(
    () => centripetalAcceleration(speed, radius),
    [speed, radius]
  );
  const fC = useMemo(
    () => centripetalForce(mass, speed, radius),
    [mass, speed, radius]
  );
  const T = useMemo(() => timePeriod(speed, radius), [speed, radius]);
  const angleDeg = ((angle * 180) / Math.PI + 360) % 360;
  const particleVisualRadius = calculateVisualRadius(mass);

  const scaleBars = useMemo(() => {
    switch (scaleLevel) {
      case "nuclear":
        return { gravity: 0.1, electric: 0.7, nuclear: 1.0 };
      case "atomic":
        return { gravity: 0.05, electric: 1.0, nuclear: 0.3 };
      case "planetary":
        return { gravity: 1.0, electric: 0.1, nuclear: 0.0 };
      default:
        return { gravity: 0.3, electric: 0.3, nuclear: 0.3 };
    }
  }, [scaleLevel]);

  const recordParameters = useCallback(
    (timestamp: number) => {
      setSimState((prev) => {
        const record = (
          key: "radius" | "speed" | "mass",
          val: number,
          extra: { [k: string]: number }
        ): TrackedParameter => {
          const p = prev[key];
          const rec: ParameterRecord = { timestamp, value: val, calculatedResults: extra };
          const history = [...p.history, rec].slice(-500);
          const sum = history.reduce((a, r) => a + r.value, 0);
          const average = history.length ? sum / history.length : p.average;
          const peak =
            p.peak == null || val > p.peak.value ? rec : p.peak;
          return { current: val, history, peak, average };
        };
        return {
          radius: record("radius", radius, { omega, aC }),
          speed: record("speed", speed, { omega, aC }),
          mass: record("mass", mass, { fC }),
        };
      });
    },
    [radius, speed, mass, omega, aC, fC]
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
      const dt = (deltaMs / 1000) * (slowMotion ? 0.25 : 1);

      const t0 = performance.now();
      setRadius((r) => interpolateParameter(r, radiusTarget));
      setSpeed((s) => interpolateParameter(s, speedTarget));
      setMass((m) => interpolateParameter(m, massTarget));

      if (!paused) {
        const w = angularVelocity(speed, radius);
        setAngle((a) => {
          let next = a + w * dt;
          if (next > TWO_PI) next -= TWO_PI;
          return next;
        });
      }

      setPhysicsTimeMs(performance.now() - t0);

      frameCountRef.current += 1;
      fpsTimeRef.current += deltaMs;
      if (fpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        fpsTimeRef.current = 0;
      }

      const nowSec = time / 1000;
      const rPx = radius * PIXELS_PER_METER;
      const cx = 0;
      const cy = 0;
      const x = cx + rPx * Math.cos(angle);
      const y = cy + rPx * Math.sin(angle);
      samplesRef.current = [...samplesRef.current, { t: nowSec, x, y }].filter(
        (s) => nowSec - s.t <= TRAIL_MAX_SECONDS
      );

      if (time - lastRecordTimeRef.current >= RECORD_THROTTLE_MS) {
        lastRecordTimeRef.current = time;
        recordParameters(time);
      }

      const boundsSize = 2 * radius * PIXELS_PER_METER;
      autoScale(CANVAS_WIDTH, CANVAS_HEIGHT, boundsSize);

      frameIdRef.current = requestAnimationFrame(animate);
    },
    [
      paused,
      slowMotion,
      radiusTarget,
      speedTarget,
      massTarget,
      radius,
      speed,
      angle,
      recordParameters,
      autoScale,
    ]
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
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.code === "Enter") handleReset();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const handleReset = () => {
    setRadiusTarget(5);
    setSpeedTarget(10);
    setMassTarget(2);
    setScaleLevel("atomic");
    setAngle(0);
    setPaused(false);
    setSlowMotion(false);
    setScale(1);
    samplesRef.current = [];
    setSimState({
      radius: { current: 5, history: [], peak: null, average: 5 },
      speed: { current: 10, history: [], peak: null, average: 10 },
      mass: { current: 2, history: [], peak: null, average: 2 },
    });
  };

  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const radiusPx = radius * PIXELS_PER_METER * scale;
  const particleX = centerX + radiusPx * Math.cos(angle);
  const particleY = centerY + radiusPx * Math.sin(angle);
  const vDirX = -Math.sin(angle);
  const vDirY = Math.cos(angle);
  const aDirX = -Math.cos(angle);
  const aDirY = -Math.sin(angle);
  const vLen = 60 + (speed / 20) * 50;
  const aLen = 60 + (aC / 50) * 40;
  const vEndX = particleX + vDirX * vLen;
  const vEndY = particleY + vDirY * vLen;
  const aEndX = particleX + aDirX * aLen;
  const aEndY = particleY + aDirY * aLen;

  const trailPoints = prefersReducedMotion ? [] : samplesRef.current;
  const trailOpacity = prefersReducedMotion ? 0 : 0.6;

  const sliders: ParameterSliderConfig[] = [
    {
      label: "Radius",
      value: radiusTarget,
      min: 1,
      max: 10,
      step: 0.1,
      unit: "m",
      defaultValue: 5,
      icon: "🌀",
      dramaticRange: [3, 7],
    },
    {
      label: "Speed",
      value: speedTarget,
      min: 1,
      max: 20,
      step: 0.5,
      unit: "m/s",
      defaultValue: 10,
      icon: "⚡",
      dramaticRange: [12, 18],
    },
    {
      label: "Mass",
      value: massTarget,
      min: 0.5,
      max: 5,
      step: 0.1,
      unit: "kg",
      defaultValue: 2,
      icon: "🌐",
      dramaticRange: [2, 4],
    },
  ];

  const proTipText =
    radiusTarget <= 3 && speedTarget >= 16
      ? "💡 High speed + small radius → huge centripetal acceleration! Watch aₙ and F_c."
      : radiusTarget >= 8 && speedTarget <= 6
        ? "💡 Large radius + low speed → gentle orbit, easy to see velocity direction change."
        : "💡 Try radius ≈ 5 m, speed ≈ 12 m/s for a balanced exam-style setup. ✨";

  const scaleLabel =
    scaleLevel === "nuclear"
      ? "Nuclear scale"
      : scaleLevel === "atomic"
        ? "Atomic scale"
        : "Planetary scale";

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-[#7B2C5E] via-[#A64D7B] to-[#F9A8C4] text-gray-900">
      {/* Top section: 70vh — Sim (65%) + Controls (35%) */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row px-4 py-4 gap-4" style={{ height: "70vh" }}>
        {/* Simulation box — 65% width */}
        <div className="lg:w-[65%] w-full min-h-0 flex flex-col rounded-2xl border border-[#E5E9F0] bg-white shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <h2 className="text-base font-semibold text-blue-600">
              Uniform Circular Motion
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500 text-white hover:bg-blue-600"
              >
                {paused ? "▶ Play" : "⏸ Pause"}
              </button>
              <button
                type="button"
                onClick={() => setSlowMotion((s) => !s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                  slowMotion ? "bg-amber-100 border-amber-400 text-amber-800" : "border-gray-300 text-gray-600"
                }`}
              >
                Slow-mo
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative bg-gradient-to-br from-[#7B2C5E] via-[#A64D7B] to-[#F9A8C4]">
            <svg
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              className="w-full h-full block"
              role="img"
              aria-label="Uniform circular motion"
            >
              <defs>
                <pattern
                  id="ucm-grid"
                  x="0"
                  y="0"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#CBD5F5"
                    strokeOpacity="0.6"
                    strokeWidth="0.5"
                  />
                </pattern>
                <linearGradient id="ucm-trail" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity={trailOpacity} />
                  <stop offset="50%" stopColor="#7DD3FC" stopOpacity={trailOpacity * 0.8} />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="ucm-center-glow" r="70%">
                  <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="ucm-particle-glow" r="70%">
                  <stop offset="0%" stopColor="#f9fafb" stopOpacity="1" />
                  <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#ucm-grid)" />
              <ellipse cx={centerX} cy={centerY} rx={120} ry={120} fill="url(#ucm-center-glow)" />

              {/* Origin crosshair */}
              <line x1={centerX - 12} y1={centerY} x2={centerX + 12} y2={centerY} stroke="#6B7280" strokeWidth="1" strokeOpacity="0.7" />
              <line x1={centerX} y1={centerY - 12} x2={centerX} y2={centerY + 12} stroke="#6B7280" strokeWidth="1" strokeOpacity="0.7" />
              <circle cx={centerX} cy={centerY} r={5} fill="#1F2937" />

              {/* Circular track */}
              <circle
                cx={centerX}
                cy={centerY}
                r={Math.max(20, radiusPx)}
                fill="none"
                stroke="#93C5FD"
                strokeWidth={2}
                strokeDasharray="6 4"
              />

              {/* Trail */}
              {trailPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="url(#ucm-trail)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={trailPoints
                    .map((s) => {
                      const px = centerX + s.x * scale;
                      const py = centerY + s.y * scale;
                      return `${px},${py}`;
                    })
                    .join(" ")}
                />
              )}

              {/* Radius line — yellow */}
              <line
                x1={centerX}
                y1={centerY}
                x2={particleX}
                y2={particleY}
                stroke="#FBBF24"
                strokeWidth={2}
                strokeDasharray="4 3"
              />

              {/* Velocity — blue, tangential */}
              <line x1={particleX} y1={particleY} x2={vEndX} y2={vEndY} stroke="#60A5FA" strokeWidth={2.5} />
              <polygon
                points={`${vEndX},${vEndY} ${vEndX - 8 * vDirX - 5 * vDirY},${vEndY - 8 * vDirY + 5 * vDirX} ${vEndX - 8 * vDirX + 5 * vDirY},${vEndY - 8 * vDirY - 5 * vDirX}`}
                fill="#3B82F6"
              />

              {/* Acceleration — red, toward center */}
              <line x1={particleX} y1={particleY} x2={aEndX} y2={aEndY} stroke="#F97373" strokeWidth={2.5} />
              <polygon
                points={`${aEndX},${aEndY} ${aEndX - 8 * aDirX - 5 * aDirY},${aEndY - 8 * aDirY + 5 * aDirX} ${aEndX - 8 * aDirX + 5 * aDirY},${aEndY - 8 * aDirY - 5 * aDirX}`}
                fill="#EF4444"
              />

              {/* Angle arc */}
              <path
                d={`M ${centerX + 36} ${centerY} A 36 36 0 ${angle > Math.PI ? 1 : 0} 1 ${centerX + 36 * Math.cos(angle)} ${centerY + 36 * Math.sin(angle)}`}
                fill="none"
                stroke="#06B6D4"
                strokeWidth={1.5}
              />
              <text
                x={centerX + 48 * Math.cos(angle / 2)}
                y={centerY + 48 * Math.sin(angle / 2)}
                fill="#1F2937"
                fontSize="11"
                fontWeight="600"
              >
                θ = {angleDeg.toFixed(0)}°
              </text>

              {/* Particle — mass-dependent size, white core + glow */}
              <circle
                cx={particleX}
                cy={particleY}
                r={particleVisualRadius * 1.4}
                fill="url(#ucm-particle-glow)"
              />
              <circle cx={particleX} cy={particleY} r={particleVisualRadius * 0.5} fill="#ffffff" />

              {/* Legend */}
              <g transform={`translate(${CANVAS_WIDTH - 200}, 24)`}>
                <rect x={0} y={0} width={188} height={52} rx={8} fill="rgba(249,250,251,0.95)" stroke="#E5E7EB" strokeWidth="1" />
                <text x={10} y={18} fill="#111827" fontSize="11" fontWeight="700">Legend</text>
                <line x1={10} y1={30} x2={28} y2={30} stroke="#3B82F6" strokeWidth="3" />
                <text x={34} y={33} fill="#374151" fontSize="10">Velocity – tangential</text>
                <line x1={10} y1={44} x2={28} y2={44} stroke="#EF4444" strokeWidth="3" />
                <text x={34} y={47} fill="#374151" fontSize="10">Acceleration – toward center</text>
              </g>

              <text x={12} y={24} fill="#6B7280" fontSize="11">{fps} fps</text>
              <text x={12} y={38} fill="#6B7280" fontSize="10">Δt: {physicsTimeMs.toFixed(2)} ms</text>
            </svg>
          </div>
        </div>

        {/* Parameter controls — 35% width, vertical sliders */}
        <div className="lg:w-[35%] w-full flex flex-col rounded-2xl border border-[#E5E9F0] bg-[#F9FAFB] shadow-lg p-4 overflow-auto">
          <h3 className="text-sm font-semibold text-blue-600 mb-1">Parameters & Scale</h3>
          <p className="text-xs text-gray-500 mb-3">
            All controls visible — no scrolling.
          </p>

          {sliders.map((s) => (
            <ParameterSlider
              key={s.label}
              config={s}
              onChange={(v) => {
                if (s.label === "Radius") setRadiusTarget(v);
                if (s.label === "Speed") setSpeedTarget(v);
                if (s.label === "Mass") setMassTarget(v);
              }}
            />
          ))}

          {/* Scale slider: nuclear → atomic → planetary */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">📊 Scale</span>
              <span className="text-sm font-semibold text-cyan-600">{scaleLabel}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
              <span>Nuclear</span>
              <span>Atomic</span>
              <span>Planetary</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={scaleLevel === "nuclear" ? 0 : scaleLevel === "atomic" ? 1 : 2}
              onChange={(e) => {
                const v = Number(e.target.value);
                setScaleLevel(v === 0 ? "nuclear" : v === 1 ? "atomic" : "planetary");
              }}
              className="physics-range w-full"
              aria-label={`Scale: ${scaleLabel}`}
            />
          </div>

          {/* Force dominance bars */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-700 mb-1">Dominant forces at this scale</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-16">Gravity</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${scaleBars.gravity * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16">Electric</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${scaleBars.electric * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16">Nuclear</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${scaleBars.nuclear * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-2 text-xs text-sky-800 mb-3">
            {proTipText}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition"
          >
            ↺ Reset to Default
          </button>
        </div>
      </div>

      {/* Bottom section: 30vh — Educational content, full width, 3 columns */}
      <div className="flex-none border-t border-gray-200 bg-[#F9FAFB] px-4 py-4" style={{ minHeight: "30vh" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left 40%: Concept & formula */}
          <div className="md:col-span-1 rounded-xl border border-gray-200 bg-[#F3A4C4] p-4">
            <h4 className="text-sm font-bold text-blue-600 mb-2">✨ The Concept</h4>
            <p className="text-xs text-gray-700 mb-3">
              In uniform circular motion the object moves at constant speed, but velocity changes continuously because its direction changes. This results in centripetal acceleration always directed toward the center.
            </p>
            <h5 className="text-xs font-bold text-blue-600 mb-1">📐 Key formulae</h5>
            <pre className="text-[11px] font-mono text-gray-800 bg-white border border-gray-200 rounded-lg p-2 overflow-x-auto">
{`ω = v / r
a_c = v² / r
F_c = m v² / r`}
            </pre>
            <p className="text-[11px] text-gray-600 mt-1">
              v = speed, r = radius, ω = angular speed, a_c = centripetal acceleration, F_c = centripetal force.
            </p>
          </div>

          {/* Middle 30%: Live physics data */}
          <div className="rounded-xl border border-gray-200 bg-[#D08BB5] p-4">
            <h4 className="text-sm font-bold text-blue-600 mb-2">🧮 Live calculation</h4>
            <div className="text-[11px] font-mono text-gray-800 bg-white border border-gray-200 rounded-lg p-2 space-y-1">
              <div>v = {speed.toFixed(2)} m/s, r = {radius.toFixed(2)} m, m = {mass.toFixed(2)} kg</div>
              <div>ω = v / r = {speed.toFixed(2)} / {radius.toFixed(2)} = <span className="text-blue-600 font-semibold">{omega.toFixed(2)} rad/s</span></div>
              <div>
                aₙ = v² / r = ({speed.toFixed(2)})² / {radius.toFixed(2)} ={" "}
                <span className="text-blue-600 font-semibold">{aC.toFixed(2)} m/s²</span>
              </div>
              <div>
                Fₙ = m v² / r = {mass.toFixed(2)} × ({speed.toFixed(2)})² / {radius.toFixed(2)} ={" "}
                <span className="text-blue-600 font-semibold">{fC.toFixed(2)} N</span>
              </div>
              <div>
                T = 2πr / v = 2π × {radius.toFixed(2)} / {speed.toFixed(2)} ={" "}
                {T === Infinity || Number.isNaN(T) ? "∞" : <span className="text-blue-600 font-semibold">{T.toFixed(2)} s</span>}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <div>⚡ FPS: {fps}</div>
              <div>Radius avg: {simState.radius.average.toFixed(2)} m · Speed avg: {simState.speed.average.toFixed(2)} m/s</div>
            </div>
          </div>

          {/* Right 30%: Try This */}
          <div className="rounded-xl border border-gray-200 bg-[#FBCFE8] p-4">
            <h4 className="text-sm font-bold text-blue-600 mb-2">💡 Try This for Drama!</h4>
            <ul className="text-xs text-gray-700 space-y-2">
              <li>
                <strong>🎯 High a_c:</strong> Radius = 2–3 m, Speed = 18–20 m/s → centripetal acceleration shoots up.
              </li>
              <li>
                <strong>⚡ Gentle orbit:</strong> Radius = 9 m, Speed = 4 m/s → slow, clear velocity rotation.
              </li>
              <li>
                <strong>🌟 Exam classic:</strong> r = 5 m, v = 10 m/s → balanced numbers for T and ω.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
