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

interface ParameterSlider {
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

type ForceId = "strong" | "weak" | "electromagnetic" | "gravitational";

interface ForceStrength {
  id: ForceId;
  name: string;
  color: string;
  effectiveStrength: number;
  dominant: boolean;
}

// ---------------------------------------------------------------------------
// Standard Web Color Palette
// ---------------------------------------------------------------------------

const PALETTE = {
  bgLight: "#F5F5F5",
  bgWhite: "#FFFFFF",
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
  trackBg: "#E5E7EB",
  hover: "#DBEAFE",
} as const;

const FORCE_COLORS: Record<ForceId, string> = {
  strong: "#EA8A69",
  weak: "#E7C9A9",
  electromagnetic: "#3B82F6",
  gravitational: "#1F5C74",
};

// ---------------------------------------------------------------------------
// Constants – scale in log10(meters)
// ---------------------------------------------------------------------------

const SCALE_MIN = -15;
const SCALE_MAX = 12;
const SCALE_DEFAULT = -10;

// ---------------------------------------------------------------------------
// Physics – effective force strength at scale
// ---------------------------------------------------------------------------

const effectiveStrengthAtScale = (
  force: ForceId,
  scalePower: number
): number => {
  const r = Math.pow(10, scalePower);
  const rFm = r * 1e15;

  switch (force) {
    case "strong": {
      const peak = 10;
      const width = 2;
      const x = Math.log10(rFm + 0.01);
      const peakLog = Math.log10(peak);
      return 100 * Math.exp(-Math.pow((x - peakLog) / width, 2));
    }
    case "weak": {
      const peak = 1;
      const width = 1.5;
      const x = Math.log10(rFm + 0.01);
      const peakLog = Math.log10(peak);
      return 100 * Math.exp(-Math.pow((x - peakLog) / width, 2));
    }
    case "electromagnetic": {
      if (scalePower < -12) return 5;
      if (scalePower < -10) return 20 + (scalePower + 10) * 25;
      if (scalePower < 0) return 70 + scalePower * 2;
      return Math.min(100, 70 - scalePower * 3);
    }
    case "gravitational": {
      if (scalePower < -9) return 0.5;
      if (scalePower < 0) return 1 + (scalePower + 9) * 2;
      return Math.min(100, 20 + scalePower * 6);
    }
    default:
      return 0;
  }
};

const getDominantForce = (scalePower: number): ForceId => {
  const s = effectiveStrengthAtScale("strong", scalePower);
  const w = effectiveStrengthAtScale("weak", scalePower);
  const e = effectiveStrengthAtScale("electromagnetic", scalePower);
  const g = effectiveStrengthAtScale("gravitational", scalePower);
  const max = Math.max(s, w, e, g);
  if (max === s) return "strong";
  if (max === w) return "weak";
  if (max === e) return "electromagnetic";
  return "gravitational";
};

const getScaleLabel = (scalePower: number): string => {
  if (scalePower <= -14) return "Nuclear (nucleus)";
  if (scalePower <= -12) return "Sub-nuclear";
  if (scalePower <= -10) return "Atomic (electron cloud)";
  if (scalePower <= -6) return "Molecular / Nanoscale";
  if (scalePower <= -3) return "Microscopic";
  if (scalePower <= 0) return "Everyday (macroscopic)";
  if (scalePower <= 6) return "Planetary";
  return "Cosmic (galaxies)";
};

const getScaleLengthDisplay = (scalePower: number): string => {
  const m = Math.pow(10, scalePower);
  if (m >= 1e9) return `${(m / 1e9).toFixed(1)} Gm`;
  if (m >= 1e6) return `${(m / 1e6).toFixed(1)} Mm`;
  if (m >= 1e3) return `${(m / 1e3).toFixed(1)} km`;
  if (m >= 1) return `${m.toFixed(1)} m`;
  if (m >= 1e-2) return `${(m * 100).toFixed(1)} cm`;
  if (m >= 1e-6) return `${(m * 1e6).toFixed(2)} μm`;
  if (m >= 1e-9) return `${(m * 1e9).toFixed(1)} nm`;
  return `${(m * 1e15).toFixed(0)} fm`;
};

// Motion: acceleration factor by scale (kinematics)
const getAccelerationFactor = (scalePower: number): number => {
  if (scalePower <= -13) return 380;
  if (scalePower <= -7) return 110;
  return 28;
};

const interpolate = (current: number, target: number, speed: number): number =>
  current + (target - current) * speed;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

const usePrefersReducedMotion = () => {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefers;
};

// ---------------------------------------------------------------------------
// Slider Component
// ---------------------------------------------------------------------------

interface SliderRowProps extends ParameterSlider {
  onChange: (value: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  icon,
  dramaticRange,
  onChange,
}) => {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  const [low, high] = dramaticRange ?? [NaN, NaN];
  const isInDramaticRange =
    !Number.isNaN(low) && !Number.isNaN(high) && value >= low && value <= high;

  return (
    <div className="space-y-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base" aria-hidden="true">{icon}</span>}
          <label
            htmlFor={id}
            className="text-sm font-medium text-[#374151]"
          >
            {label}
          </label>
        </div>
        <span className="text-sm font-bold tabular-nums text-[#111827]">
          {value.toFixed(value % 1 === 0 ? 0 : 1)} {unit}
        </span>
      </div>
      <div
        className={`relative rounded-full ${isInDramaticRange ? "ring-2 ring-blue-500/50 ring-offset-1" : ""}`}
      >
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full appearance-none rounded-full bg-[#E5E7EB] accent-[#3B82F6]"
          style={{ accentColor: PALETTE.primary }}
          aria-label={`${label}: ${value} ${unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#6B7280]">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MotionInAStraightLineSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scalePower, setScalePower] = useState(SCALE_DEFAULT);
  const [smoothScalePower, setSmoothScalePower] = useState(SCALE_DEFAULT);
  const [scaleHistory, setScaleHistory] = useState<ParameterRecord[]>([]);
  const [lastRecordTime, setLastRecordTime] = useState(0);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; life: number }[]>([]);
  const frameCountRef = useRef(0);
  const [liveStats, setLiveStats] = useState({ fps: 60, particleCount: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();

  // Particle moving in a straight line (horizontal)
  const particleRef = useRef<{
    x: number;
    vx: number;
    initialized: boolean;
    startX: number;
    displacement: number;
  }>({ x: 0, vx: 0, initialized: false, startX: 0, displacement: 0 });

  useEffect(() => {
    const t = setInterval(() => {
      setLiveStats((s) => ({
        fps: s.fps,
        particleCount: particlesRef.current.length,
      }));
    }, 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (now - lastRecordTime < 100) return;
    setLastRecordTime(now);
    setScaleHistory((prev) => [
      ...prev.slice(-49),
      {
        timestamp: now,
        value: scalePower,
        calculatedResults: {
          scaleM: Math.pow(10, scalePower),
          dominant: getDominantForce(scalePower) === "strong" ? 1 : getDominantForce(scalePower) === "weak" ? 2 : getDominantForce(scalePower) === "electromagnetic" ? 3 : 4,
        },
      },
    ]);
  }, [scalePower, lastRecordTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothScalePower((prev) => interpolate(prev, scalePower, 0.12));
    }, 16);
    return () => clearInterval(interval);
  }, [scalePower]);

  const forceStrengths = useMemo((): ForceStrength[] => {
    const dom = getDominantForce(smoothScalePower);
    return (["strong", "weak", "electromagnetic", "gravitational"] as ForceId[]).map(
      (id) => ({
        id,
        name:
          id === "strong"
            ? "Strong nuclear"
            : id === "weak"
              ? "Weak nuclear"
              : id === "electromagnetic"
                ? "Electromagnetic"
                : "Gravitational",
        color: FORCE_COLORS[id],
        effectiveStrength: effectiveStrengthAtScale(id, smoothScalePower),
        dominant: dom === id,
      })
    );
  }, [smoothScalePower]);

  const scaleLabel = useMemo(
    () => getScaleLabel(smoothScalePower),
    [smoothScalePower]
  );
  const scaleLengthDisplay = useMemo(
    () => getScaleLengthDisplay(smoothScalePower),
    [smoothScalePower]
  );
  const dominantForce = useMemo(
    () => getDominantForce(smoothScalePower),
    [smoothScalePower]
  );

  const resetToDefault = useCallback(() => {
    setScalePower(SCALE_DEFAULT);
  }, []);

  // 60 FPS animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = container.clientWidth;
      h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particleRef.current.initialized = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const targetFPS = 60;
    const frameDuration = 1000 / targetFPS;
    let lastFrameTime = 0;

    const animate = (currentTime: number) => {
      animationRef.current = requestAnimationFrame(animate);
      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime < frameDuration) return;
      lastFrameTime = currentTime;
      lastFrameRef.current = currentTime;
      frameCountRef.current += 1;
      const fps = Math.round(1000 / deltaTime);
      if (frameCountRef.current % 30 === 0) {
        setLiveStats((s) => ({ ...s, fps }));
      }

      const cy = h / 2;
      const lineY = cy;
      const lineLeft = w * 0.08;
      const lineRight = w * 0.92;

      // Spawn trail particles along the straight path
      if (!prefersReducedMotion && Math.random() < 0.06) {
        const px = particleRef.current.x;
        if (px > lineLeft && px < lineRight) {
          particlesRef.current.push({
            x: px,
            y: lineY,
            vx: -0.3,
            life: 1,
          });
        }
      }

      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          life: p.life - 0.02,
        }))
        .filter((p) => p.life > 0 && p.x >= -20 && p.x <= w + 20);

      // Background
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#E8EEF2");
      gradient.addColorStop(1, "#FFFFFF");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = "rgba(229, 231, 235, 0.5)";
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x <= w; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Straight line path (motion in a straight line)
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(lineLeft, lineY);
      ctx.lineTo(lineRight, lineY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Origin marker (force source) – left side
      const originX = lineLeft;
      const pulse = 0.85 + 0.15 * Math.sin(currentTime * 0.002);
      const originRadius = 14;
      const glowRadius = originRadius * 2.5;

      const originGradient = ctx.createRadialGradient(
        originX,
        lineY,
        0,
        originX,
        lineY,
        glowRadius
      );
      originGradient.addColorStop(0, "rgba(59, 130, 246, 0.9)");
      originGradient.addColorStop(0.4, "rgba(59, 130, 246, 0.4)");
      originGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = originGradient;
      ctx.beginPath();
      ctx.arc(originX, lineY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PALETTE.primary;
      ctx.beginPath();
      ctx.arc(originX, lineY, originRadius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = PALETTE.textPrimary;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Force origin", originX, lineY - originRadius - 12);

      // Particle motion along straight line
      const domForce = getDominantForce(smoothScalePower);
      const domStrength = effectiveStrengthAtScale(domForce, smoothScalePower) / 100;
      const accelFactor = getAccelerationFactor(smoothScalePower);
      const dt = Math.min(deltaTime / 1000, 0.04);
      const arrowColor = FORCE_COLORS[domForce];

      let p = particleRef.current;
      if (!p.initialized) {
        p.x = lineLeft + 80;
        p.vx = 0;
        p.startX = p.x;
        p.displacement = 0;
        p.initialized = true;
      }

      const dx = p.x - originX;
      const distFromOrigin = Math.max(5, dx);

      if (!prefersReducedMotion && distFromOrigin < lineRight - lineLeft - 30) {
        const ax = accelFactor * domStrength * 0.5;
        p.vx += ax * dt;
        p.vx = Math.min(p.vx, 180);
        p.x += p.vx * dt;
      }

      if (p.x >= lineRight - 20) {
        p.x = lineLeft + 80;
        p.vx = 0;
        p.startX = p.x;
      }

      p.displacement = p.x - p.startX;

      // Velocity arrow (along the line)
      const arrowLength = Math.min(50, Math.abs(p.vx) * 0.4);
      if (arrowLength > 5 && p.vx > 0) {
        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, lineY);
        ctx.lineTo(p.x + arrowLength, lineY);
        ctx.stroke();
        const headLen = 10;
        ctx.fillStyle = arrowColor;
        ctx.beginPath();
        ctx.moveTo(p.x + arrowLength, lineY);
        ctx.lineTo(p.x + arrowLength - headLen, lineY - 5);
        ctx.lineTo(p.x + arrowLength - headLen, lineY + 5);
        ctx.closePath();
        ctx.fill();
      }

      // Particle (car-like representation – Motion in a Straight Line)
      const particleGlow = ctx.createRadialGradient(p.x, lineY, 0, p.x, lineY, 24);
      particleGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      particleGlow.addColorStop(0.35, arrowColor + "cc");
      particleGlow.addColorStop(1, arrowColor + "00");
      ctx.fillStyle = particleGlow;
      ctx.beginPath();
      ctx.arc(p.x, lineY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.arc(p.x, lineY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.textPrimary;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = PALETTE.textPrimary;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Object", p.x, lineY - 30);

      // Trail particles
      particlesRef.current.forEach((part) => {
        ctx.fillStyle = `rgba(6, 182, 212, ${part.life * 0.6})`;
        ctx.beginPath();
        ctx.arc(part.x, part.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Scale indicator
      ctx.fillStyle = PALETTE.textSecondary;
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Scale: ${scaleLengthDisplay}`, 12, h - 10);
      ctx.fillText(scaleLabel, 12, h - 26);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      ro.disconnect();
    };
  }, [smoothScalePower, scaleLengthDisplay, scaleLabel, prefersReducedMotion]);

  return (
    <div className="flex min-h-0 flex-col overflow-hidden bg-[#F9FAFB] text-[#111827]">
      {/* Top section: 70vh – Simulation (65%) + Controls (35%) */}
      <div
        className="flex flex-shrink-0 flex-col gap-4 overflow-hidden p-4 md:h-[70vh] md:flex-row md:flex-nowrap"
        style={{ minHeight: "70vh" }}
      >
        {/* Simulation box – 65% width, properly contained */}
        <div
          className="relative flex min-h-[280px] flex-1 flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#E5E7EB] shadow-inner md:min-w-0 md:basis-[65%]"
          style={{
            background: "linear-gradient(135deg, #E8EEF2, #FFFFFF)",
          }}
        >
          <p className="absolute left-4 top-3 z-10 shrink-0 text-xs font-medium text-[#374151]">
            Observe motion in a straight line: the object accelerates away from
            the force origin. Different scales → different dominant forces.
          </p>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-2 pt-8">
            <canvas
              ref={canvasRef}
              className="h-full max-h-full w-full max-w-full rounded-lg object-contain"
              style={{ aspectRatio: "16/10" }}
              aria-label="Motion in a straight line – scale and force dominance visualization"
            />
          </div>
        </div>

        {/* Parameter controls – 35%, scrollable if needed */}
        <div className="flex min-h-0 w-full flex-col justify-start gap-3 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:w-[35%] md:min-w-[260px] md:flex-shrink-0 md:basis-[35%]">
          <h3 className="text-sm font-bold shrink-0 text-[#111827]">
            Parameter Controls
          </h3>

          <SliderRow
            label="Scale (log₁₀ length in m)"
            value={scalePower}
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={1}
            unit=""
            defaultValue={SCALE_DEFAULT}
            icon="📏"
            dramaticRange={[-12, -9]}
            onChange={setScalePower}
          />

          {/* Force strength bars */}
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
            <div className="mb-2 text-xs font-semibold text-[#374151]">
              Relative force strength at this scale
            </div>
            {forceStrengths.map((f) => (
              <div key={f.id} className="mb-2 last:mb-0">
                <div className="flex justify-between text-[10px]">
                  <span className={f.dominant ? "font-bold text-[#111827]" : "text-[#6B7280]"}>
                    {f.name} {f.dominant ? "★" : ""}
                  </span>
                  <span className="tabular-nums text-[#6B7280]">
                    {f.effectiveStrength.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, f.effectiveStrength)}%`,
                      backgroundColor: f.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[#6B7280] shrink-0">
            💡 Pro Tip: Set scale to -15 (nuclear) for strong/weak dominance;
            -10 (atomic) for EM; +6 for gravity! ✨
          </p>

          <button
            type="button"
            onClick={resetToDefault}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl border-0 bg-[#3B82F6] py-2.5 text-sm font-medium text-white transition hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
            aria-label="Reset to default parameters"
          >
            <span aria-hidden>↺</span> Reset to Default
          </button>
        </div>
      </div>

      {/* Bottom section: 30vh – Educational content */}
      <div
        className="grid min-h-0 flex-shrink-0 grid-cols-1 gap-4 overflow-hidden border-t border-[#E5E7EB] bg-white p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)]"
        style={{ minHeight: "30vh" }}
      >
        {/* Left: Concept & Formula */}
        <div className="min-w-0 space-y-2 overflow-hidden">
          <h3 className="text-sm font-bold text-[#3B82F6]">✨ The Concept</h3>
          <p className="text-sm text-[#374151]">
            Motion in a straight line describes an object changing position along
            a single axis. At different scales—nuclear, atomic, planetary—the
            dominant force changes: strong/weak nuclear at tiny scales,
            electromagnetic at atomic scales, gravity at planetary scales.
          </p>
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-2">
            <h4 className="text-xs font-bold text-[#111827]">
              📐 Kinematics: Displacement & Velocity
            </h4>
            <p className="mt-1 font-mono text-[11px] text-[#1F2937]">
              s = ut + ½at² &nbsp;|&nbsp; v = u + at
            </p>
            <p className="mt-1 text-[10px] text-[#6B7280]">
              Where: s = displacement, u = initial velocity, v = final velocity,
              a = acceleration, t = time.
            </p>
          </div>
        </div>

        {/* Middle: Live physics data */}
        <div className="min-w-0 space-y-2 overflow-hidden">
          <h3 className="text-sm font-bold text-[#3B82F6]">⚡ Live Stats</h3>
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-2 font-mono text-[11px] text-[#374151]">
            <div>Scale: 10^{smoothScalePower.toFixed(0)} m</div>
            <div>Length: {scaleLengthDisplay}</div>
            <div>
              Dominant force:{" "}
              <span className="font-bold text-[#3B82F6]">{dominantForce}</span>
            </div>
            <div>Region: {scaleLabel}</div>
          </div>
          <div className="text-[10px] text-[#6B7280]">
            FPS: {liveStats.fps} · Particles: {liveStats.particleCount}
          </div>
        </div>

        {/* Right: Interactive tips */}
        <div className="min-w-0 space-y-2 overflow-hidden">
          <h3 className="text-sm font-bold text-[#3B82F6]">
            💡 Try This for Drama!
          </h3>
          <div
            className="max-w-full rounded-lg border border-[#E5E7EB] bg-[#F0F9FF] p-2 text-xs text-[#374151] break-words"
          >
            <p className="mb-1.5">
              <strong>🎯 Nuclear:</strong> Scale = -15 → Strong &amp; weak
              dominate; object snaps fast
            </p>
            <p className="mb-1.5">
              <strong>⚡ Atomic:</strong> Scale = -10 → EM dominates; smooth
              motion
            </p>
            <p className="mb-1.5">
              <strong>🌟 Planetary:</strong> Scale = +6 → Gravity dominates;
              slow, steady
            </p>
            <p>
              <strong>📐 Sweet spot:</strong> -12 to -9 for nuclear→atomic
              transition!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
