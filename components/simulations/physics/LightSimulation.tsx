"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ---------------- Types ----------------

type ParameterRecord = {
  timestamp: number;
  value: number;
  calculatedResults: {
    [key: string]: number;
  };
};

type SliderConfig = {
  label: string;
  unit: string;
  icon?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  dramaticRange?: [number, number];
};

// ---------------- Physics helpers (Snell's law for light) ----------------

// Snell: n1 * sin(theta1) = n2 * sin(theta2)
// Angles in radians for trig; UI uses degrees.

const degToRad = (deg: number) => (deg * Math.PI) / 180;
const radToDeg = (rad: number) => (rad * 180) / Math.PI;

type SnellResult = {
  theta2Deg: number;
  totalInternalReflection: boolean;
  reflectance: number;
  transmittance: number;
};

function computeSnell(n1: number, n2: number, theta1Deg: number): SnellResult {
  const theta1 = degToRad(theta1Deg);
  const s1 = Math.sin(theta1);
  const ratio = n1 / n2;
  const s2 = ratio * s1;

  if (Math.abs(s2) > 1) {
    return {
      theta2Deg: 0,
      totalInternalReflection: true,
      reflectance: 1,
      transmittance: 0,
    };
  }

  const theta2 = Math.asin(s2);
  const theta2Deg = radToDeg(theta2);

  // Very simplified reflectance model (angle-dependent Fresnel-ish)
  const R0 = Math.pow((n1 - n2) / (n1 + n2 || 1), 2);
  const reflectance = Math.min(
    1,
    Math.max(0, R0 + (1 - R0) * Math.pow(1 - Math.cos(theta1), 5))
  );

  return {
    theta2Deg,
    totalInternalReflection: false,
    reflectance,
    transmittance: 1 - reflectance,
  };
}

// ---------------- Visual helpers ----------------

function calculateVisualRadius(massLike: number, baseRadius = 10): number {
  return baseRadius * Math.cbrt(Math.max(0.1, massLike));
}

function formatNumber(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

// ---------------- Slider component ----------------

type SliderProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon?: string;
  dramaticRange?: [number, number];
  onChange: (v: number) => void;
};

function ParameterSliderControl({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  icon,
  dramaticRange,
  onChange,
}: SliderProps) {
  const percentage = ((value - min) / (max - min || 1)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="flex items-center justify-between text-sm font-medium text-neutral-200"
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon && <span aria-hidden>{icon}</span>}
          <span className="truncate">{label}</span>
        </span>
        <span className="tabular-nums text-cyan-300 font-semibold text-sm shrink-0 ml-1">
          {formatNumber(value, step < 1 ? 2 : 1)}{unit}
        </span>
      </label>
      <div className="relative h-8 flex items-center">
        <div className="absolute inset-0 flex items-center">
          <div className="h-2 w-full rounded-full bg-neutral-600" />
        </div>
        {dramaticRange && (
          <div
            className="absolute h-2 rounded-full bg-cyan-500/40 pointer-events-none z-[1] border border-cyan-400/50"
            style={{
              left: `${((dramaticRange[0] - min) / (max - min || 1)) * 100}%`,
              width: `${
                ((dramaticRange[1] - dramaticRange[0]) / (max - min || 1)) *
                100
              }%`,
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center z-[2]">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-2 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-cyan-400
            [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(15,23,42,0.9)]
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-cyan-400
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-[0_0_0_2px_rgba(15,23,42,0.9)]
          "
          aria-label={`${label}: ${value} ${unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
        />
      </div>
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ---------------- Main simulation ----------------

const DEFAULTS: Record<string, SliderConfig> = {
  angle: {
    label: "Incident angle",
    unit: "°",
    icon: "↗",
    min: 0,
    max: 89,
    step: 1,
    defaultValue: 40,
    dramaticRange: [35, 55],
  },
  n1: {
    label: "Medium 1 index n₁",
    unit: "",
    icon: "n₁",
    min: 1.0,
    max: 2.5,
    step: 0.01,
    defaultValue: 1.0,
  },
  n2: {
    label: "Medium 2 index n₂",
    unit: "",
    icon: "n₂",
    min: 1.0,
    max: 2.5,
    step: 0.01,
    defaultValue: 1.33,
    dramaticRange: [1.3, 1.5],
  },
  intensity: {
    label: "Source intensity",
    unit: "%",
    icon: "💡",
    min: 10,
    max: 100,
    step: 1,
    defaultValue: 70,
    dramaticRange: [60, 90],
  },
};

const PRESETS = [
  { id: "air-glass", label: "Air → Glass", n1: 1, n2: 1.5, angle: 40 },
  { id: "glass-air", label: "Glass → Air", n1: 1.5, n2: 1, angle: 30 },
  { id: "critical", label: "Critical Angle", n1: 1.5, n2: 1, angle: 41.8 },
  { id: "tir", label: "Total Internal Reflection", n1: 1.5, n2: 1, angle: 50 },
  { id: "equal", label: "Equal Indices", n1: 1.33, n2: 1.33, angle: 35 },
  { id: "strong", label: "Strong Refraction", n1: 1, n2: 1.6, angle: 50 },
] as const;

const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const TRANSITION_MS = 250;
const LERP_SPEED = 0.12;
const RAY_MOTION_MS = 1000; // 0.8–1.2s motion time for ray animation

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - Math.min(1, t), 3);
}

function getParticles(w: number, h: number, count: number) {
  const particles: { x: number; y: number; vx: number; vy: number; size: number; layer: number }[] = [];
  for (let i = 0; i < count; i++) {
    const seed = (i * 1.618) % 1;
    particles.push({
      x: (seed * 0.6 + 0.2) * w,
      y: ((1 - seed * 0.7) % 1) * h,
      vx: 0.06 + (i % 5) * 0.02,
      vy: 0.02 + (i % 3) * 0.02,
      size: 0.6 + (i % 4) * 0.35,
      layer: (i % 3) * 0.33,
    });
  }
  return particles;
}

export default function LightSimulation() {
  const [angle, setAngle] = useState(DEFAULTS.angle.defaultValue);
  const [n1, setN1] = useState(DEFAULTS.n1.defaultValue);
  const [n2, setN2] = useState(DEFAULTS.n2.defaultValue);
  const [intensity, setIntensity] = useState(DEFAULTS.intensity.defaultValue);

  const [historyAngle, setHistoryAngle] = useState<ParameterRecord[]>([]);
  const [historyN1, setHistoryN1] = useState<ParameterRecord[]>([]);
  const [historyN2, setHistoryN2] = useState<ParameterRecord[]>([]);
  const [historyIntensity, setHistoryIntensity] = useState<ParameterRecord[]>(
    []
  );

  const [simTime, setSimTime] = useState(0);
  const [fps, setFps] = useState(60);
  const [particleCount, setParticleCount] = useState(0);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [phase, setPhase] = useState(0);
  const [impactActive, setImpactActive] = useState(false);
  const [displayAngle, setDisplayAngle] = useState(DEFAULTS.angle.defaultValue);
  const [displayN1, setDisplayN1] = useState(DEFAULTS.n1.defaultValue);
  const [displayN2, setDisplayN2] = useState(DEFAULTS.n2.defaultValue);
  const [displayIntensity, setDisplayIntensity] = useState(DEFAULTS.intensity.defaultValue);
  const [displayTheta2, setDisplayTheta2] = useState(0);
  const [arcProgress, setArcProgress] = useState(1);
  const [isDraggingAngle, setIsDraggingAngle] = useState(false);
  const [showReflection, setShowReflection] = useState(true);
  const [showRefraction, setShowRefraction] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [slowMotion, setSlowMotion] = useState(false);
  const [showWavefronts, setShowWavefronts] = useState(false);
  const [hoveredRay, setHoveredRay] = useState<"incident" | "reflected" | "refracted" | null>(null);

  const wiggleEndRef = useRef(0);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const impactEndRef = useRef(0);
  const launchPulseEndRef = useRef(0);
  const prevParamsRef = useRef({ angle, n1, n2 });
  const phaseRef = useRef(0);
  const particlesRef = useRef<ReturnType<typeof getParticles> | null>(null);
  const lastAngleRef = useRef(angle);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerSize = useRef({ w: 0, h: 0 });

  const lastHistory = useRef(0);
  const rafId = useRef<number | null>(null);
  const lastFrameTime = useRef(0);
  const frameCounter = useRef(0);
  const fpsWindowStart = useRef(0);

  const simulationController = useRef<{
    state: "idle" | "launched" | "playing" | "paused" | "reset";
    rafId: number | null;
    time: number;
  }>({ state: "idle", rafId: null, time: 0 });

  const angleRef = useRef(angle);
  const n1Ref = useRef(n1);
  const n2Ref = useRef(n2);
  const intensityRef = useRef(intensity);
  angleRef.current = angle;
  n1Ref.current = n1;
  n2Ref.current = n2;
  intensityRef.current = intensity;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const snell = useMemo(
    () => computeSnell(n1, n2, angle),
    [n1, n2, angle]
  );

  const snellRef = useRef(snell);
  snellRef.current = snell;

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setImpactActive(true);
    impactEndRef.current = performance.now() + 200;
  }, [angle, n1, n2]);

  const runDemo = useCallback(() => {
    setDemoMode(true);
    setHasLaunched(true);
    setShowReflection(true);
    setShowRefraction(true);
    setN1(1);
    setN2(1.5);
    setAngle(35);
    simulationController.current.state = "playing";
    setPaused(false);
    setDemoStep(0);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    const steps = [
      () => setDemoStep(1),
      () => setDemoStep(2),
      () => setDemoStep(3),
      () => setDemoStep(4),
      () => setDemoStep(5),
      () => setDemoStep(6),
    ];
    steps.forEach((fn, i) => {
      demoTimeoutRef.current = setTimeout(fn, (i + 1) * 1500);
    });
    demoTimeoutRef.current = setTimeout(() => {
      setDemoMode(false);
      setDemoStep(0);
    }, 7 * 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
      const c = simulationController.current;
      c.state = "idle";
      if (c.rafId != null) {
        cancelAnimationFrame(c.rafId);
        c.rafId = null;
      }
    };
  }, []);

  const applyPreset = useCallback((preset: (typeof PRESETS)[number]) => {
    setN1(Math.min(2.5, Math.max(1, preset.n1)));
    setN2(Math.min(2.5, Math.max(1, preset.n2)));
    setAngle(Math.min(89, Math.max(0, preset.angle)));
  }, []);

  const handleAngleDrag = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPct = ((clientY - rect.top) / rect.height) * 100;
    const deg = radToDeg(Math.atan2(xPct - 50, 50 - yPct));
    const clamped = Math.min(89, Math.max(0, Math.round(deg)));
    setAngle(clamped);
  }, []);

  const onAngleHandlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDraggingAngle(true);
  }, []);

  const onAngleHandlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsDraggingAngle(false);
  }, []);

  useEffect(() => {
    if (!isDraggingAngle) return;
    const onMove = (e: PointerEvent) => handleAngleDrag(e.clientX, e.clientY);
    const onUp = () => setIsDraggingAngle(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDraggingAngle, handleAngleDrag]);

  const recordHistory = useCallback(() => {
    const now = Date.now();
    if (now - lastHistory.current < 100) return;
    lastHistory.current = now;
    const common = {
      theta1: angle,
      theta2: snell.theta2Deg,
      tir: snell.totalInternalReflection ? 1 : 0,
      reflectance: snell.reflectance,
      transmittance: snell.transmittance,
      n1,
      n2,
      intensity,
    };
    const mk = (value: number): ParameterRecord => ({
      timestamp: now,
      value,
      calculatedResults: common,
    });
    setHistoryAngle((prev) =>
      prev.length >= 50 ? [...prev.slice(1), mk(angle)] : [...prev, mk(angle)]
    );
    setHistoryN1((prev) =>
      prev.length >= 50 ? [...prev.slice(1), mk(n1)] : [...prev, mk(n1)]
    );
    setHistoryN2((prev) =>
      prev.length >= 50 ? [...prev.slice(1), mk(n2)] : [...prev, mk(n2)]
    );
    setHistoryIntensity((prev) =>
      prev.length >= 50
        ? [...prev.slice(1), mk(intensity)]
        : [...prev, mk(intensity)]
    );
  }, [angle, n1, n2, intensity, snell]);

  useEffect(() => {
    recordHistory();
  }, [angle, n1, n2, intensity, recordHistory]);

  const startLoop = useCallback(() => {
    const c = simulationController.current;
    if (c.state !== "playing") return;
    if (c.rafId != null) return;

    const loop = (ts: number) => {
      const controller = simulationController.current;
      if (controller.state !== "playing") {
        controller.rafId = null;
        return;
      }

      if (!fpsWindowStart.current) fpsWindowStart.current = ts;
      if (!lastFrameTime.current) lastFrameTime.current = ts;
      const dt = ts - lastFrameTime.current;
      lastFrameTime.current = ts;

      frameCounter.current++;
      if (ts - fpsWindowStart.current >= 500) {
        setFps(
          Math.round(
            (frameCounter.current * 1000) / (ts - fpsWindowStart.current)
          )
        );
        frameCounter.current = 0;
        fpsWindowStart.current = ts;
      }

      const slowMult = slowMotion ? 0.5 : 1;
      const phaseScale = (prefersReducedMotion ? 0.15 : 0.4) * slowMult;
      setPhase((p) => {
        const next = p + (dt / 1000) * phaseScale;
        phaseRef.current = next;
        return next;
      });

      if (ts >= impactEndRef.current) setImpactActive(false);

      setArcProgress((p) => {
        if (p >= 1) return 1;
        return Math.min(1, p + (dt / RAY_MOTION_MS));
      });

      const a = angleRef.current;
      const n1v = n1Ref.current;
      const n2v = n2Ref.current;
      const iv = intensityRef.current;
      const sn = snellRef.current;
      const targetTheta2 = sn.totalInternalReflection ? 90 : sn.theta2Deg;

      setDisplayAngle((prev) => (Math.abs(prev - a) < 0.3 ? a : lerp(prev, a, LERP_SPEED)));
      setDisplayN1((prev) => (Math.abs(prev - n1v) < 0.005 ? n1v : lerp(prev, n1v, LERP_SPEED)));
      setDisplayN2((prev) => (Math.abs(prev - n2v) < 0.005 ? n2v : lerp(prev, n2v, LERP_SPEED)));
      setDisplayIntensity((prev) => (Math.abs(prev - iv) < 0.5 ? iv : lerp(prev, iv, LERP_SPEED)));
      setDisplayTheta2((prev) => (Math.abs(prev - targetTheta2) < 0.3 ? targetTheta2 : lerp(prev, targetTheta2, LERP_SPEED)));

      const timeScale = prefersReducedMotion ? 0.3 : 0.6;
      setSimTime((t) => t + (dt / 1000) * timeScale);

      controller.rafId = requestAnimationFrame(loop);
    };

    c.rafId = requestAnimationFrame(loop);
  }, [prefersReducedMotion, slowMotion]);

  const reset = useCallback(() => {
    const c = simulationController.current;
    c.state = "reset";
    if (c.rafId != null) {
      cancelAnimationFrame(c.rafId);
      c.rafId = null;
    }
    setAngle(DEFAULTS.angle.defaultValue);
    setN1(DEFAULTS.n1.defaultValue);
    setN2(DEFAULTS.n2.defaultValue);
    setIntensity(DEFAULTS.intensity.defaultValue);
    setSimTime(0);
    setPaused(true);
    setHasLaunched(false);
    setDemoMode(false);
    setDemoStep(0);
    c.state = "idle";
  }, []);

  const launch = useCallback(() => {
    const c = simulationController.current;
    if (c.state === "playing") return;
    setSimTime(0);
    setPaused(false);
    setHasLaunched(true);
    c.state = c.state === "idle" ? "launched" : "playing";
    if (c.state === "launched") c.state = "playing";
    setImpactActive(true);
    impactEndRef.current = performance.now() + 200;
    launchPulseEndRef.current = performance.now() + 120;
    startLoop();
  }, [startLoop]);

  const togglePause = useCallback(() => {
    const c = simulationController.current;
    if (c.state === "playing") {
      c.state = "paused";
      if (c.rafId != null) {
        cancelAnimationFrame(c.rafId);
        c.rafId = null;
      }
      setPaused(true);
    } else {
      c.state = "playing";
      setPaused(false);
      if (!hasLaunched) setHasLaunched(true);
      startLoop();
    }
  }, [startLoop, hasLaunched]);

  useEffect(() => {
    if (angle !== lastAngleRef.current) {
      lastAngleRef.current = angle;
      setArcProgress(0);
    }
  }, [angle]);

  useEffect(() => {
    setArcProgress(0);
  }, [n1, n2]);

  useEffect(() => {
    if (simulationController.current.state !== "playing") {
      setDisplayAngle(angle);
      setDisplayN1(n1);
      setDisplayN2(n2);
      setDisplayIntensity(intensity);
      setDisplayTheta2(snell.totalInternalReflection ? 90 : snell.theta2Deg);
    }
  }, [angle, n1, n2, intensity, snell.theta2Deg, snell.totalInternalReflection]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const handle = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      containerSize.current = { w: rect.width, h: rect.height };
    };
    handle();
    const ro = new ResizeObserver(handle);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Canvas render: 4-layer cinematic optical lab (physics unchanged)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerSize.current.w === 0 || containerSize.current.h === 0)
      return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = w / Math.max(1, containerSize.current.w);
    const t = simTime;
    const scale = 1.3;
    const RAY_OFFSET_PX = 10 * dpr;
    const midY = h * 0.35;
    const cx = w / 2;
    const beamLen = h * 0.55 * scale;
    const srcX = w * 0.12;
    const srcY = midY - h * 0.18;
    const theta1 = degToRad(angle);
    const dirX = Math.sin(theta1);
    const dirY = Math.cos(theta1);
    const scaleToInterface = (midY - srcY) / (dirY * beamLen || 1);
    const ix = srcX + dirX * beamLen * scaleToInterface;
    const iy = midY;
    const normalUp = -1;
    const thetaFromNormal = theta1;
    const intensityNorm = intensity / 100;
    const sourceRadius = calculateVisualRadius(intensityNorm * 4, 9 * dpr);

    if (!particlesRef.current) particlesRef.current = getParticles(w, h, prefersReducedMotion ? 20 : 32);

    ctx.clearRect(0, 0, w, h);

    const now = typeof performance !== "undefined" ? performance.now() : 0;
    const wiggleActive = wiggleEndRef.current > 0 && now < wiggleEndRef.current;
    const wiggle = wiggleActive ? (Math.sin(now * 0.08) * 1.5 * dpr) : 0;

    // —— Layer 1: Base + radial glow behind source ——
    const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
    baseGrad.addColorStop(0, "#071421");
    baseGrad.addColorStop(0.5, "#040b14");
    baseGrad.addColorStop(1, "#02060b");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    const sourceGlowRad = Math.max(w, h) * 0.4;
    const radAtSource = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, sourceGlowRad);
    radAtSource.addColorStop(0, "rgba(0,255,255,0.15)");
    radAtSource.addColorStop(0.25, "rgba(0,255,255,0.06)");
    radAtSource.addColorStop(0.4, "transparent");
    radAtSource.addColorStop(1, "transparent");
    ctx.fillStyle = radAtSource;
    ctx.fillRect(0, 0, w, h);

    // —— Layer 2: Visual reference grid (opacity 0.12) ——
    const gridStep = 48 * dpr;
    const gridAlpha = 0.12;
    ctx.strokeStyle = `rgba(148,163,184,${gridAlpha})`;
    ctx.lineWidth = 0.5 * dpr;
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

    // —— Layer 3: Slow drifting particles (opacity 0.1–0.2) ——
    const particles = particlesRef.current;
    particles.forEach((p, i) => {
      const px = (p.x + p.vx * phase * 22 + Math.sin(phase * 0.5 + i * 0.7) * 14) % (w + 40) - 20;
      const py = (p.y + p.vy * phase * 16 + Math.cos(phase * 0.35 + i * 0.9) * 10) % (h + 40) - 20;
      const parallax = 1 + p.layer * 0.25;
      const size = p.size * dpr * parallax;
      const alpha = 0.1 + 0.1 * (0.5 + 0.5 * Math.sin(phase * 0.6 + i));
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // —— Layer 4: Medium separation (upper blue, lower green tint) + density particles ——
    const topDensity = 0.3 + (n1 - 1) * 0.35;
    const botDensity = 0.3 + (n2 - 1) * 0.35;
    const topGrad = ctx.createLinearGradient(0, 0, 0, midY);
    topGrad.addColorStop(0, `rgba(56,189,248,${0.12 + topDensity * 0.04})`);
    topGrad.addColorStop(0.6, "rgba(56,189,248,0.05)");
    topGrad.addColorStop(1, "rgba(34,211,238,0.04)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, midY);

    const particleCount1 = Math.floor(6 + n1 * 10);
    const particleCount2 = Math.floor(6 + n2 * 10);
    for (let i = 0; i < particleCount1; i++) {
      const px = (w * (0.15 + 0.7 * (i / Math.max(1, particleCount1 - 1)))) + 12 * Math.sin(phase + i * 0.6);
      const py = (midY * (0.2 + 0.6 * (i % 3) / 3)) + 5 * Math.cos(phase * 1.2 + i);
      if (py > 8 && py < midY - 8) {
        const alpha = 0.05 + 0.04 * Math.sin(phase + i) * (1 + topDensity * 0.5);
        ctx.fillStyle = `rgba(148,163,184,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let i = 0; i < particleCount2; i++) {
      const px = (w * (0.15 + 0.7 * (i / Math.max(1, particleCount2 - 1)))) + 12 * Math.sin(phase * 1.1 + i * 0.7);
      const py = midY + (h - midY) * (0.15 + 0.6 * (i % 3) / 3) + 5 * Math.cos(phase + i);
      if (py > midY + 8 && py < h - 8) {
        const alpha = 0.05 + 0.04 * Math.sin(phase + i * 1.1) * (1 + botDensity * 0.5);
        ctx.fillStyle = `rgba(148,163,184,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const botGrad = ctx.createLinearGradient(0, midY, 0, h);
    botGrad.addColorStop(0, "rgba(34,197,94,0.06)");
    botGrad.addColorStop(0.5, "rgba(20,184,166,0.10)");
    botGrad.addColorStop(1, "rgba(34,197,94,0.08)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, midY, w, h - midY);

    const boundaryShimmer = 0.5 + 0.4 * Math.sin(phase * 2.8);
    const boundaryPulse = impactActive ? 0.7 + 0.3 * Math.sin(now * 0.015) : 1;
    const bleedGrad = ctx.createLinearGradient(0, midY - 36, 0, midY + 36);
    bleedGrad.addColorStop(0, "rgba(34,211,238,0)");
    bleedGrad.addColorStop(0.35, `rgba(34,211,238,${0.12 * boundaryShimmer})`);
    bleedGrad.addColorStop(0.5, `rgba(0,255,255,${0.28 * boundaryShimmer})`);
    bleedGrad.addColorStop(0.65, `rgba(34,211,238,${0.12 * boundaryShimmer})`);
    bleedGrad.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = bleedGrad;
    ctx.fillRect(0, midY - 36, w, 72);

    ctx.strokeStyle = `rgba(34,211,238,${(0.8 + boundaryShimmer * 0.2) * boundaryPulse})`;
    ctx.lineWidth = 5 * dpr;
    ctx.shadowColor = "rgba(34,211,238,0.6)";
    ctx.shadowBlur = impactActive ? 28 * dpr : 20 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // —— Layer 5: Normal at point of incidence, angle arcs, source, 3 rays ——
    const arcR = 32 * dpr;
    const launchPulse = launchPulseEndRef.current > 0 && now < launchPulseEndRef.current;
    const brightness = 0.5 + 0.5 * (intensity / 100);

    const applyWiggle = (x0: number, y0: number, x1: number, y1: number) => {
      if (wiggle === 0) return { x0, y0, x1, y1 };
      const dx = x1 - x0, dy = y1 - y0;
      const L = Math.hypot(dx, dy) || 1;
      const ox = (-dy / L) * wiggle, oy = (dx / L) * wiggle;
      return { x0: x0 + ox, y0: y0 + oy, x1: x1 + ox, y1: y1 + oy };
    };
    const offsetLine = (x0: number, y0: number, x1: number, y1: number, offsetPx: number) => {
      const dx = x1 - x0, dy = y1 - y0;
      const L = Math.hypot(dx, dy) || 1;
      const perpX = -dy / L, perpY = dx / L;
      return {
        x0: x0 + perpX * offsetPx, y0: y0 + perpY * offsetPx,
        x1: x1 + perpX * offsetPx, y1: y1 + perpY * offsetPx,
      };
    };
    const drawBeamParticles = (x0: number, y0: number, x1: number, y1: number, n: number, r: number, g: number, b: number) => {
      const speed = 1 / n;
      const particleT = (t * 0.5 + phase * 0.3) % 1;
      for (let i = 0; i < 6; i++) {
        const pt = ((particleT + i / 6) % 1) * speed;
        const px = x0 + (x1 - x0) * pt;
        const py = y0 + (y1 - y0) * pt;
        ctx.fillStyle = `rgba(${r},${g},${b},${0.9 - pt * 0.4})`;
        ctx.shadowColor = `rgb(${r},${g},${b})`;
        ctx.shadowBlur = 5 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      const pulsePos = (phase * 0.35) % 1;
      const pulseX = x0 + (x1 - x0) * pulsePos;
      const pulseY = y0 + (y1 - y0) * pulsePos;
      const pg = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 18 * dpr);
      pg.addColorStop(0, `rgba(${r},${g},${b},0.4)`);
      pg.addColorStop(0.6, `rgba(${r},${g},${b},0.1)`);
      pg.addColorStop(1, "transparent");
      ctx.fillStyle = pg;
      ctx.fillRect(pulseX - 20, pulseY - 20, 40, 40);
    };
    const primaryRayThickness = 4 * dpr;
    const virtualRayThickness = 2 * dpr;
    const glowThickness = 12 * dpr;
    const drawBeam = (
      x0: number, y0: number, x1: number, y1: number,
      colorStart: string, colorEnd: string, glowColor: string,
      thickness: number = primaryRayThickness,
      dashed = false,
      lineOffset = 0,
      isHovered = false
    ) => {
      let a0 = x0, b0 = y0, a1 = x1, b1 = y1;
      if (lineOffset !== 0) {
        const o = offsetLine(x0, y0, x1, y1, lineOffset);
        a0 = o.x0; b0 = o.y0; a1 = o.x1; b1 = o.y1;
      }
      const wig = applyWiggle(a0, b0, a1, b1);
      a0 = wig.x0; b0 = wig.y0; a1 = wig.x1; b1 = wig.y1;
      const grad = ctx.createLinearGradient(a0, b0, a1, b1);
      grad.addColorStop(0, colorStart);
      grad.addColorStop(0.5, colorStart);
      grad.addColorStop(0.85, colorEnd);
      grad.addColorStop(1, "transparent");
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = glowThickness;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8 * dpr;
      if (dashed) ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(a0, b0);
      ctx.lineTo(a1, b1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = grad;
      ctx.lineWidth = thickness;
      if (dashed) ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(a0, b0);
      ctx.lineTo(a1, b1);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Normal — dashed white
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.setLineDash([8 * dpr, 5 * dpr]);
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix, iy - h * 0.42);
    ctx.stroke();
    ctx.setLineDash([]);

    const arcStartNorm = -Math.PI / 2;
    const easedProgress = easeOutCubic(arcProgress);
    ctx.strokeStyle = "rgba(250,204,21,0.9)";
    ctx.lineWidth = primaryRayThickness;
    ctx.beginPath();
    ctx.arc(ix, iy, arcR, arcStartNorm, arcStartNorm + theta1 * easedProgress);
    ctx.stroke();

    const flicker = 1 + 0.04 * Math.sin(t * 8.2) * Math.sin(t * 3.1);
    const pulse = launchPulse ? 1.25 : 0.95 + 0.08 * Math.sin(t * 2.2);
    const glowRadius = sourceRadius * (2.6 + 0.6 * pulse) * flicker;
    const bloomRadius = sourceRadius * 4.5;
    const bloom = ctx.createRadialGradient(srcX, srcY, sourceRadius * 1.2, srcX, srcY, bloomRadius);
    bloom.addColorStop(0, "rgba(255,255,255,0)");
    bloom.addColorStop(0.4, `rgba(255,250,200,${0.12 * brightness * flicker})`);
    bloom.addColorStop(0.7, "rgba(250,204,21,0.04)");
    bloom.addColorStop(1, "rgba(250,204,21,0)");
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(srcX, srcY, bloomRadius, 0, Math.PI * 2);
    ctx.fill();
    const glow = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, glowRadius);
    glow.addColorStop(0, `rgba(255,255,255,${(0.4 + 0.35 * pulse) * brightness * flicker})`);
    glow.addColorStop(0.3, `rgba(250,204,21,${0.5 * brightness * flicker})`);
    glow.addColorStop(0.65, "rgba(250,204,21,0.2)");
    glow.addColorStop(1, "rgba(250,204,21,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(srcX, srcY, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(253,224,71,${0.98 * flicker})`;
    ctx.beginPath();
    ctx.arc(srcX, srcY, sourceRadius * flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(250,204,21,0.9)";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Incident ray — warm yellow, crisp + glow
    const incBright = Math.min(1, brightness * 1.15);
    drawBeam(
      srcX, srcY, ix, iy,
      `rgba(255,236,120,${0.98 * incBright})`,
      `rgba(255,236,120,0.4)`,
      "rgba(255,220,100,0.5)",
      hoveredRay === "incident" ? primaryRayThickness * 1.2 : primaryRayThickness,
      false,
      0,
      hoveredRay === "incident"
    );
    drawBeamParticles(srcX, srcY, ix, iy, n1, 255, 236, 120);

    const reflAngle = thetaFromNormal;
    const reflLenMax = Math.max(8 * dpr, (midY - 24 * dpr) / Math.max(0.25, Math.cos(reflAngle)));
    const reflLen = snell.totalInternalReflection
      ? Math.min(beamLen, reflLenMax)
      : Math.min(beamLen * Math.max(0.5, snell.reflectance), reflLenMax);
    const rx = ix + Math.sin(reflAngle) * reflLen;
    const ry = iy + normalUp * Math.cos(reflAngle) * reflLen;
    const reflBright = snell.totalInternalReflection ? 1 : 0.45 + 0.55 * snell.reflectance;
    const drawReflected = showReflection && (!demoMode || demoStep >= 3);
    if (drawReflected) {
      const reflBrightAdj = Math.min(1, reflBright * 1.15);
      drawBeam(
        ix, iy, rx, ry,
        snell.totalInternalReflection ? "rgba(255,255,255,0.98)" : `rgba(255,255,255,${0.95 * reflBrightAdj})`,
        "rgba(255,255,255,0.3)",
        "rgba(255,255,255,0.4)",
        hoveredRay === "reflected" ? virtualRayThickness * 1.2 : virtualRayThickness,
        true,
        -RAY_OFFSET_PX,
        hoveredRay === "reflected"
      );
      drawBeamParticles(ix, iy, rx, ry, n1, 255, 255, 255);
      ctx.strokeStyle = highContrast ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)";
      ctx.lineWidth = virtualRayThickness;
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.beginPath();
      ctx.arc(ix, iy, arcR, arcStartNorm - theta1, arcStartNorm);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (snell.totalInternalReflection) {
      if (showReflection && showLabels) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = `${10 * dpr}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("TIR", ix, iy - 36 * dpr);
      }
    } else if (showRefraction && (!demoMode || demoStep >= 4)) {
      const theta2 = degToRad(displayTheta2);
      const dx2 = Math.sin(theta2);
      const dy2 = -Math.cos(theta2);
      const refrLenMax = Math.max(8 * dpr, (h - midY - 24 * dpr) / Math.max(0.25, Math.cos(theta2)));
      const refrLen = Math.min(beamLen * Math.max(0.4, snell.transmittance), refrLenMax);
      const tx2 = ix + dx2 * refrLen;
      const ty2 = iy + dy2 * refrLen;
      const refractedBright = Math.min(1, brightness * 1);
      drawBeam(
        ix, iy, tx2, ty2,
        `rgba(34,211,238,${0.98 * refractedBright})`,
        `rgba(34,211,238,0.5)`,
        "rgba(34,211,238,0.45)",
        hoveredRay === "refracted" ? virtualRayThickness * 1.2 : virtualRayThickness,
        true,
        RAY_OFFSET_PX,
        hoveredRay === "refracted"
      );
      drawBeamParticles(ix, iy, tx2, ty2, n2, 34, 211, 238);
      ctx.strokeStyle = highContrast ? "rgba(34,211,238,0.95)" : "rgba(34,211,238,0.85)";
      ctx.lineWidth = virtualRayThickness;
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.beginPath();
      ctx.arc(ix, iy, arcR, arcStartNorm, arcStartNorm + theta2 * easedProgress);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Minimal angle labels (only when showLabels)
    if (showLabels) {
      ctx.font = `${9 * dpr}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText(`θ₁ = ${Math.round(displayAngle)}°`, ix + arcR + 8 * dpr, iy - arcR * 0.4);
      if (drawReflected) ctx.fillText(`θᵣ = ${Math.round(displayAngle)}°`, ix - arcR - 52 * dpr, iy - arcR * 0.4);
      if (!snell.totalInternalReflection && showRefraction) ctx.fillText(`θ₂ = ${displayTheta2.toFixed(1)}°`, ix + arcR + 8 * dpr, iy + arcR * 0.7);
    }

    if (showWavefronts) {
      const wfSpacing = 28 * dpr;
      const wfAlpha = 0.3 + 0.08 * Math.sin(phase * 1.5);
      ctx.strokeStyle = `rgba(148,163,184,${wfAlpha})`;
      ctx.lineWidth = 1.2 * dpr;
      const perpX = -dirY;
      const perpY = dirX;
      const hitDist = Math.hypot(ix - srcX, iy - srcY);
      for (let k = 0; k <= 6; k++) {
        const along1 = k * wfSpacing;
        const sx = srcX + dirX * along1 + perpX * 70 * dpr;
        const sy = srcY + dirY * along1 + perpY * 70 * dpr;
        const ex = srcX + dirX * along1 - perpX * 70 * dpr;
        const ey = srcY + dirY * along1 - perpY * 70 * dpr;
        if (along1 <= hitDist + 5) {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        } else if (!snell.totalInternalReflection) {
          const theta2 = degToRad(displayTheta2);
          const dx2 = Math.sin(theta2);
          const dy2 = -Math.cos(theta2);
          const perp2X = -dy2;
          const perp2Y = dx2;
          const excess = along1 - hitDist;
          const cx2 = ix + dx2 * excess * 0.8;
          const cy2 = iy + dy2 * excess * 0.8;
          ctx.beginPath();
          ctx.moveTo(cx2 + perp2X * 60 * dpr, cy2 + perp2Y * 60 * dpr);
          ctx.lineTo(cx2 - perp2X * 60 * dpr, cy2 - perp2Y * 60 * dpr);
          ctx.stroke();
        }
      }
    }

    // —— Ray-boundary intersection highlight (when angle changes) ——
    if (impactActive) {
      const highlightRadius = 16 * dpr;
      const pulse = 0.6 + 0.4 * Math.sin(now * 0.02);
      const intGrad = ctx.createRadialGradient(ix, iy, 0, ix, iy, highlightRadius);
      intGrad.addColorStop(0, `rgba(34,211,238,${0.5 * pulse})`);
      intGrad.addColorStop(0.5, `rgba(34,211,238,${0.2 * pulse})`);
      intGrad.addColorStop(1, "transparent");
      ctx.fillStyle = intGrad;
      ctx.beginPath();
      ctx.arc(ix, iy, highlightRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(34,211,238,${0.8 * pulse})`;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(ix, iy, highlightRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Vignette to focus attention
    const vigGrad = ctx.createRadialGradient(cx, midY, Math.min(w, h) * 0.15, cx, midY, Math.max(w, h) * 0.75);
    vigGrad.addColorStop(0, "transparent");
    vigGrad.addColorStop(0.5, "transparent");
    vigGrad.addColorStop(0.85, "rgba(0,0,0,0.2)");
    vigGrad.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);
  }, [angle, n1, n2, intensity, snell, simTime, phase, arcProgress, prefersReducedMotion, showReflection, showRefraction, showLabels, highContrast, displayTheta2, demoMode, demoStep, showWavefronts, impactActive, hoveredRay]);

  const anglePeak =
    historyAngle.length > 0
      ? historyAngle.reduce((m, r) => (r.value > m ? r.value : m), -Infinity)
      : angle;
  const angleAvg =
    historyAngle.length > 0
      ? historyAngle.reduce((s, r) => s + r.value, 0) / historyAngle.length
      : angle;

  return (
    <div
      className="light-reflection-refraction-premium light-lab-workspace flex flex-col w-full mx-auto px-2"
      style={{ fontVariantNumeric: "tabular-nums", maxWidth: 1600 }}
    >
      <header className="shrink-0 py-3 px-1">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Reflection &amp; Refraction
        </h1>
        <p className="text-xs opacity-70 text-neutral-400 mt-0.5">
          θᵢ = θᵣ · n₁ sin θ₁ = n₂ sin θ₂
        </p>
      </header>

      <div className="light-lab-main-grid flex-1 min-h-0">
        <div className="light-lab-canvas-zone min-w-0 flex flex-col">
          <div
            className="sim-wrapper light-lab-canvas-container relative flex flex-col flex-1 min-w-0"
            style={{
              background: "radial-gradient(circle at 45% 30%, #1e3a5f 0%, #020617 70%)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              borderRadius: 12,
            }}
          >
            <div className="sim-frame relative flex-1 min-h-0 flex flex-col">
            <div ref={containerRef} className="light-lab-canvas-inner relative w-full flex-1 min-h-0" style={{ transition: `opacity ${TRANSITION_MS}ms ${EASE}` }}>
              {demoMode && [1, 2, 3, 4, 5, 6].includes(demoStep) && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-10 px-5 py-3 rounded-xl bg-slate-900/95 border border-cyan-500/30 text-cyan-100 text-sm font-medium shadow-lg" style={{ maxWidth: "90%" }}>
                  {demoStep === 1 && "Incident ray approaches the boundary."}
                  {demoStep === 2 && "The boundary separates two media."}
                  {demoStep === 3 && "Reflected ray: angle of reflection equals angle of incidence."}
                  {demoStep === 4 && "Refracted ray bends as speed changes between media."}
                  {demoStep === 5 && "Notice the angle relationships: θi = θr (reflection), Snell's law (refraction)."}
                  {demoStep === 6 && "n₁ sin θ₁ = n₂ sin θ₂ — Snell's law governs refraction."}
                </div>
              )}
              <canvas ref={canvasRef} className="block w-full h-full pointer-events-none object-contain" style={{ width: "100%", height: "100%", display: "block" }} aria-hidden />
              {impactActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10" aria-hidden>
                  <div className="absolute w-20 h-20 rounded-full border-2 border-cyan-400/50 bg-cyan-400/15 animate-[lightImpactRipple_200ms_ease-out_forwards]" style={{ left: "50%", top: "50%", marginLeft: "-2.5rem", marginTop: "-2.5rem" }} />
                </div>
              )}
              <div
                role="slider"
                aria-label="Drag to change incident angle"
                aria-valuemin={0}
                aria-valuemax={89}
                aria-valuenow={angle}
                tabIndex={0}
                className="absolute w-10 h-10 rounded-full border-2 border-amber-400/80 bg-amber-400/30 cursor-grab active:cursor-grabbing hover:bg-amber-400/50 -translate-x-1/2 -translate-y-1/2 transition-opacity"
                style={{
                  left: `calc(50% + 22% * ${Math.sin(degToRad(angle))})`,
                  top: `calc(50% - 22% * ${Math.cos(degToRad(angle))})`,
                }}
                onPointerDown={onAngleHandlePointerDown}
                onPointerUp={onAngleHandlePointerUp}
                onPointerLeave={onAngleHandlePointerUp}
              />
              <div className="absolute inset-0 pointer-events-auto" aria-hidden onMouseLeave={() => setHoveredRay(null)}>
                <button type="button" className="absolute w-[100px] h-10 left-[8%] top-[22%]" onMouseEnter={() => setHoveredRay("incident")} />
                <button type="button" className="absolute w-[100px] h-10 right-[18%] top-[24%]" onMouseEnter={() => setHoveredRay("reflected")} />
                <button type="button" className="absolute w-[100px] h-10 right-[18%] bottom-[24%]" onMouseEnter={() => setHoveredRay("refracted")} />
              </div>
            </div>
            </div>
          </div>
        </div>

        <aside className="control-panel light-lab-instrument-panel light-lab-panel-zone rounded-xl flex flex-col p-4 min-h-[400px]">
          {/* SECTION 1 — Simulation Controls */}
          <section className="light-lab-panel-section rounded-lg border border-white/10 bg-white/5 overflow-hidden mb-3">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Simulation</span>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              <button type="button" onClick={launch} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${hasLaunched ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-200" : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"}`} aria-label="Launch">Launch</button>
              <button type="button" onClick={togglePause} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${!paused ? "bg-cyan-500 text-slate-950" : "bg-cyan-500/70 text-slate-100 hover:bg-cyan-500"}`} aria-label={paused ? "Play" : "Pause"}>{paused ? "Play" : "Pause"}</button>
              <button type="button" onClick={reset} className="rounded-lg border border-neutral-600 bg-neutral-800/80 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700" aria-label="Reset">Reset</button>
              <button type="button" onClick={runDemo} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${demoMode ? "border-violet-500/60 bg-violet-500/20 text-violet-200" : "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"}`} aria-label="Demo">Demo</button>
            </div>
          </section>

          {/* SECTION 2 — Phenomena */}
          <section className="light-lab-panel-section rounded-lg border border-white/10 bg-white/5 overflow-hidden mb-3">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Phenomena</span>
            </div>
            <div className="p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showReflection} onChange={(e) => setShowReflection(e.target.checked)} className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50 w-4 h-4" />
                <span className="text-xs text-neutral-300">Reflection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showRefraction} onChange={(e) => setShowRefraction(e.target.checked)} className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50 w-4 h-4" />
                <span className="text-xs text-neutral-300">Refraction</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50 w-4 h-4" />
                <span className="text-xs text-neutral-300">Labels</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showWavefronts} onChange={(e) => setShowWavefronts(e.target.checked)} className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50 w-4 h-4" />
                <span className="text-xs text-neutral-300">Wavefronts</span>
              </label>
            </div>
          </section>

          {/* SECTION 3 — Angle Control */}
          <section className="light-lab-panel-section rounded-lg border border-white/10 bg-white/5 overflow-hidden mb-3">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Angle</span>
            </div>
            <div className="p-3 space-y-1">
              <datalist id="light-angle-ticks">{[0, 22, 45, 67, 89].map((v) => <option key={v} value={v} />)}</datalist>
              <div className="relative pt-6 pb-1">
                <span className="light-lab-slider-bubble absolute text-xs font-mono text-cyan-300/95 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((displayAngle - DEFAULTS.angle.min) / (DEFAULTS.angle.max - DEFAULTS.angle.min)) * 100}%`, top: 0 }}>{Math.round(displayAngle)}°</span>
                <input type="range" list="light-angle-ticks" min={DEFAULTS.angle.min} max={DEFAULTS.angle.max} step={DEFAULTS.angle.step} value={angle} onChange={(e) => setAngle(Math.min(89, Math.max(0, Number(e.target.value))))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" aria-label="Incident angle" />
              </div>
            </div>
          </section>

          {/* SECTION 4 — Medium Properties */}
          <section className="light-lab-panel-section rounded-lg border border-white/10 bg-white/5 overflow-hidden mb-3">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Medium</span>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">n₁</label>
                <div className="relative pt-5 pb-0">
                  <span className="absolute text-[10px] font-mono text-cyan-300/90 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((displayN1 - DEFAULTS.n1.min) / (DEFAULTS.n1.max - DEFAULTS.n1.min)) * 100}%`, top: 0 }}>{displayN1.toFixed(2)}</span>
                  <input type="range" list="light-n-ticks" min={DEFAULTS.n1.min} max={DEFAULTS.n1.max} step={DEFAULTS.n1.step} value={n1} onChange={(e) => setN1(Math.min(2.5, Math.max(1, Number(e.target.value))))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-neutral-600 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" aria-label="n1" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">n₂</label>
                <div className="relative pt-5 pb-0">
                  <span className="absolute text-[10px] font-mono text-teal-300/90 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((displayN2 - DEFAULTS.n2.min) / (DEFAULTS.n2.max - DEFAULTS.n2.min)) * 100}%`, top: 0 }}>{displayN2.toFixed(2)}</span>
                  <input type="range" list="light-n-ticks" min={DEFAULTS.n2.min} max={DEFAULTS.n2.max} step={DEFAULTS.n2.step} value={n2} onChange={(e) => setN2(Math.min(2.5, Math.max(1, Number(e.target.value))))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-neutral-600 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400" aria-label="n2" />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5 — Source */}
          <section className="light-lab-panel-section rounded-lg border border-white/10 bg-white/5 overflow-hidden mb-3">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Source</span>
            </div>
            <div className="p-3">
              <label className="block text-xs text-neutral-400 mb-0.5">Intensity</label>
              <div className="relative pt-5 pb-0">
                <span className="absolute text-[10px] font-mono text-amber-300/90 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((displayIntensity - DEFAULTS.intensity.min) / (DEFAULTS.intensity.max - DEFAULTS.intensity.min)) * 100}%`, top: 0 }}>{Math.round(displayIntensity)}%</span>
                <input type="range" min={DEFAULTS.intensity.min} max={DEFAULTS.intensity.max} step={DEFAULTS.intensity.step} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-neutral-600 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400" aria-label="Intensity" />
              </div>
            </div>
          </section>

          {/* Live Results — compact */}
          <section className="light-lab-panel-section rounded-lg border border-white/10 bg-white/5 overflow-hidden mt-auto">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Results</span>
            </div>
            <div className="p-3 space-y-1 text-xs text-neutral-300">
              <p>θ₁ = θᵣ = <span className="font-mono text-amber-300/95">{Math.round(displayAngle)}°</span></p>
              <p>θ₂ = <span className="font-mono text-cyan-300/95">{snell.totalInternalReflection ? "TIR" : formatNumber(displayTheta2, 1) + "°"}</span></p>
            </div>
          </section>
        </aside>
      </div>

      <datalist id="light-n-ticks">{[1, 1.25, 1.5, 1.75, 2, 2.25, 2.5].map((v) => <option key={v} value={v} />)}</datalist>
    </div>
  );
}

