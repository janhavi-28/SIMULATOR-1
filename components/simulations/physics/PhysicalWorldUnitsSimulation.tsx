 "use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

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

interface ParameterRecord {
  timestamp: number;
  value: number;
  calculatedResults: {
    [key: string]: number;
  };
}

interface ParameterHistory {
  current: number;
  history: ParameterRecord[];
  peak: ParameterRecord | null;
  average: number;
}

interface SimulationState {
  energy: ParameterHistory;
  impact: ParameterHistory;
  emissionRate: ParameterHistory;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  trail: { x: number; y: number }[];
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// ------------------------------------------------------------
// Physics helpers (Rutherford‑style scattering core)
// ------------------------------------------------------------

const COULOMB_K = 1.44; // MeV·fm

const calculateScatteringAngle = (
  energy: number,
  impactParameter: number,
  Z1: number = 2,
  Z2: number = 79
): number => {
  const theta = 2 * Math.atan((Z1 * Z2 * COULOMB_K) / (2 * energy * impactParameter));
  return (theta * 180) / Math.PI;
};

const calculateClosestApproach = (
  energy: number,
  impactParameter: number,
  thetaDeg: number,
  Z1: number = 2,
  Z2: number = 79
): number => {
  const theta = (thetaDeg * Math.PI) / 180;
  const a = (Z1 * Z2 * COULOMB_K) / (2 * energy);
  const d = a * (1 + 1 / Math.max(1e-3, Math.sin(theta / 2)));
  return d;
};

const calculateVisualRadius = (mass: number) => {
  const baseRadius = 10;
  return baseRadius * Math.cbrt(mass);
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// ------------------------------------------------------------
// Hooks
// ------------------------------------------------------------

const usePrefersReducedMotion = () => {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const handler = (event: MediaQueryListEvent) => setPrefers(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefers;
};

// ------------------------------------------------------------
// Slider component
// ------------------------------------------------------------

interface SliderProps extends ParameterSlider {
  onChange: (value: number) => void;
}

const SliderRow: React.FC<SliderProps> = ({
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
    <div className="space-y-1 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <label
            htmlFor={id}
            className="text-sm font-semibold text-gray-900"
          >
            {label}
          </label>
        </div>
        <div className="text-sm font-semibold text-gray-900 tabular-nums">
          {value.toFixed(step < 1 ? 2 : 1)}{" "}
          <span className="text-gray-500 text-xs">{unit}</span>
        </div>
      </div>

      <div className="relative">
        {/* Dramatic range highlight */}
        {!Number.isNaN(low) && !Number.isNaN(high) && (
          <div
            className="pointer-events-none absolute inset-y-0 rounded-full bg-gradient-to-r from-blue-100/70 via-cyan-100/70 to-emerald-100/70"
            style={{
              left: `${((low - min) / (max - min)) * 100}%`,
              right: `${(1 - (high - min) / (max - min)) * 100}%`,
            }}
          />
        )}

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200"
          aria-label={`${label}: ${value} ${unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
          style={{
            backgroundImage:
              "linear-gradient(to right, #3B82F6, #06B6D4)",
            backgroundSize: `${((value - min) / (max - min)) * 100}% 100%`,
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Custom thumb styling (WebKit) */}
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 18px;
            width: 18px;
            border-radius: 9999px;
            background: #3b82f6;
            box-shadow: 0 0 0 3px rgba(191, 219, 254, 0.8);
            border: 2px solid white;
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            height: 18px;
            width: 18px;
            border-radius: 9999px;
            background: #3b82f6;
            box-shadow: 0 0 0 3px rgba(191, 219, 254, 0.8);
            border: 2px solid white;
            cursor: pointer;
          }
        `}</style>
      </div>

      <div className="flex justify-between text-[11px] text-gray-500">
        <span>
          min: {min} {unit}
        </span>
        <span>
          max: {max} {unit}
        </span>
        {isInDramaticRange && (
          <span className="text-amber-600 font-medium">Sweet spot ✨</span>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// Main simulator component
// ------------------------------------------------------------

const PhysicalWorldUnitsSimulation: React.FC = () => {
  // Slider targets
  const [energy, setEnergy] = useState(7.5);
  const [impact, setImpact] = useState(0.8);
  const [emissionRate, setEmissionRate] = useState(40);
  const [nuclearMass, setNuclearMass] = useState(197); // ~Au-197

  // Smoothed values used by physics
  const [actualEnergy, setActualEnergy] = useState(energy);
  const [actualImpact, setActualImpact] = useState(impact);

  const prefersReducedMotion = usePrefersReducedMotion();

  // Parameter history
  const [history, setHistory] = useState<SimulationState>(() => ({
    energy: { current: energy, history: [], peak: null, average: energy },
    impact: { current: impact, history: [], peak: null, average: impact },
    emissionRate: {
      current: emissionRate,
      history: [],
      peak: null,
      average: emissionRate,
    },
  }));

  const [thetaDeg, setThetaDeg] = useState(() =>
    calculateScatteringAngle(energy, impact)
  );
  const [closestApproach, setClosestApproach] = useState(() =>
    calculateClosestApproach(energy, impact, thetaDeg)
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nextIdRef = useRef(1);
  const lastFrameRef = useRef<number>(0);
  const scaleRef = useRef(1);
  const boundsRef = useRef<Bounds | null>(null);
  const runningRef = useRef<boolean>(true);

  // FPS / performance stats
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef<number>(0);
  const [simTime, setSimTime] = useState(0);

  // ----------------------------------------
  // Smooth parameter interpolation
  // ----------------------------------------

  const interpolateParameter = useCallback(
    (current: number, target: number, speed: number = 0.15) =>
      current + (target - current) * speed,
    []
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setActualEnergy((prev) => interpolateParameter(prev, energy, 0.18));
      setActualImpact((prev) => interpolateParameter(prev, impact, 0.18));
    }, 16);
    return () => window.clearInterval(id);
  }, [energy, impact, interpolateParameter]);

  // ----------------------------------------
  // Parameter recording (throttled)
  // ----------------------------------------

  useEffect(() => {
    let last = 0;
    const id = window.setInterval(() => {
      const now = performance.now();
      if (now - last < 100) return;
      last = now;

      const theta = calculateScatteringAngle(energy, impact);
      const d = calculateClosestApproach(energy, impact, theta);
      const vRel = Math.sqrt(energy); // pseudo relative speed scale

      const makeRecord = (value: number): ParameterRecord => ({
        timestamp: Date.now(),
        value,
        calculatedResults: {
          angle: theta,
          closestApproach: d,
          velocityScale: vRel,
        },
      });

      setHistory((prev) => {
        const updateHistory = (
          prevHist: ParameterHistory,
          currentValue: number
        ): ParameterHistory => {
          const rec = makeRecord(currentValue);
          const history = [...prevHist.history, rec].slice(-200);
          const sum = history.reduce((acc, r) => acc + r.value, 0);
          const average = history.length ? sum / history.length : currentValue;
          const peak =
            prevHist.peak && prevHist.peak.value >= rec.value
              ? prevHist.peak
              : rec;
          return { current: currentValue, history, peak, average };
        };

        return {
          energy: updateHistory(prev.energy, energy),
          impact: updateHistory(prev.impact, impact),
          emissionRate: updateHistory(prev.emissionRate, emissionRate),
        };
      });

      setThetaDeg(theta);
      setClosestApproach(d);
    }, 120);

    return () => window.clearInterval(id);
  }, [energy, impact, emissionRate]);

  // ----------------------------------------
  // Canvas sizing
  // ----------------------------------------

  useEffect(() => {
    const holder = containerRef.current;
    const canvas = canvasRef.current;
    if (!holder || !canvas) return;

    const resize = () => {
      const rect = holder.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(holder);
    return () => ro.disconnect();
  }, []);

  // ----------------------------------------
  // Particle system
  // ----------------------------------------

  const spawnParticle = useCallback(() => {
    const worldWidth = 400;
    const ySpread = 80 + impact * 8;
    const id = nextIdRef.current++;
    const x0 = -worldWidth * 0.45;
    const y0 = (Math.random() * 2 - 1) * ySpread;
    const baseSpeed = 120;
    const speed = baseSpeed * Math.sqrt(clamp(actualEnergy, 1, 20) / 7.5);

    const particle: Particle = {
      id,
      x: x0,
      y: y0,
      vx: speed,
      vy: 0,
      life: 1,
      trail: [],
    };

    particlesRef.current.push(particle);
  }, [actualEnergy, impact]);

  const updatePhysics = useCallback(
    (dt: number) => {
      const particles = particlesRef.current;
      const centerX = 0;
      const centerY = 0;
      const soft = 6 + 0.3 * impact;

      const strength =
        (2 * 79 * COULOMB_K * 25) / Math.max(1, actualEnergy * impact);

      for (const p of particles) {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const r2 = dx * dx + dy * dy + soft * soft;
        const invR = 1 / Math.sqrt(r2);
        const invR3 = invR * invR * invR;
        const ax = (strength * dx * invR3) / 10;
        const ay = (strength * dy * invR3) / 10;

        p.vx += ax * dt;
        p.vy += ay * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (!prefersReducedMotion) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 30) p.trail.shift();
        }

        p.life -= dt * 0.2;
      }

      const maxX = 260;
      const maxY = 200;

      boundsRef.current = particles.reduce<Bounds | null>(
        (acc, p) => {
          if (p.life <= 0) return acc;
          if (!acc) {
            return {
              minX: p.x,
              maxX: p.x,
              minY: p.y,
              maxY: p.y,
            };
          }
          return {
            minX: Math.min(acc.minX, p.x),
            maxX: Math.max(acc.maxX, p.x),
            minY: Math.min(acc.minY, p.y),
            maxY: Math.max(acc.maxY, p.y),
          };
        },
        null
      );

      const filtered = particles.filter(
        (p) =>
          p.life > 0 &&
          Math.abs(p.x) < maxX * 1.3 &&
          Math.abs(p.y) < maxY * 1.3
      );
      particlesRef.current = filtered.slice(-500);
    },
    [actualEnergy, impact, prefersReducedMotion]
  );

  // ----------------------------------------
  // Auto-scaling
  // ----------------------------------------

  const autoScale = useCallback(() => {
    const bounds = boundsRef.current;
    const holder = containerRef.current;
    if (!bounds || !holder) return;
    const rect = holder.getBoundingClientRect();

    const width = bounds.maxX - bounds.minX || 1;
    const height = bounds.maxY - bounds.minY || 1;

    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    let scale = scaleRef.current;

    if (
      width > viewportWidth * 0.8 ||
      height > viewportHeight * 0.8
    ) {
      scale *= 0.95;
    }

    if (
      width < viewportWidth * 0.4 &&
      height < viewportHeight * 0.4
    ) {
      scale *= 1.05;
    }

    scale = Math.max(0.1, Math.min(10, scale));
    scaleRef.current = scale;
  }, []);

  // ----------------------------------------
  // Rendering
  // ----------------------------------------

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const holder = containerRef.current;
    if (!canvas || !holder) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = holder.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, rect.width);
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#E8EEF2");
    grad.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const plotPad = 20 * dpr;
    const left = plotPad * 2;
    const right = w - plotPad;
    const top = plotPad;
    const bottom = h - plotPad * 2;
    const plotW = right - left;
    const plotH = bottom - top;

    const scale = scaleRef.current;
    const worldWidth = 400 * scale;
    const worldHeight = 260 * scale;

    const toX = (x: number) =>
      left + ((x + worldWidth / 2) / worldWidth) * plotW;
    const toY = (y: number) =>
      top + (1 - (y + worldHeight / 2) / worldHeight) * plotH;

    // Subtle grid
    const gridColor = "rgba(148, 163, 184, 0.35)";
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1 * dpr;

    const gridStep = 40 * scale;
    for (let x = -worldWidth / 2; x <= worldWidth / 2; x += gridStep) {
      const px = toX(x);
      ctx.beginPath();
      ctx.moveTo(px, top);
      ctx.lineTo(px, bottom);
      ctx.stroke();
    }
    for (let y = -worldHeight / 2; y <= worldHeight / 2; y += gridStep) {
      const py = toY(y);
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(right, py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 1.5 * dpr;
    const originX = toX(0);
    const originY = toY(0);
    ctx.beginPath();
    ctx.moveTo(left, originY);
    ctx.lineTo(right, originY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(originX, top);
    ctx.lineTo(originX, bottom);
    ctx.stroke();

    // Nucleus / planet visual (mass-dependent radius)
    const visualRadius = calculateVisualRadius(nuclearMass / 197);
    const rPx = visualRadius * dpr * (1.2 / scale);
    const glowRadius = rPx * (1.4 + Math.log10(Math.max(1, nuclearMass)) / 5);

    const glow = ctx.createRadialGradient(
      originX,
      originY,
      0,
      originX,
      originY,
      glowRadius
    );
    glow.addColorStop(0, "rgba(59,130,246,0.45)");
    glow.addColorStop(0.4, "rgba(6,182,212,0.25)");
    glow.addColorStop(1, "rgba(129,140,248,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(originX, originY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Field lines ring
    ctx.strokeStyle = "rgba(59,130,246,0.6)";
    ctx.lineWidth = 1 * dpr;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(originX, originY, rPx + i * 10 * dpr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Nucleus core
    ctx.fillStyle = "#1D4ED8";
    ctx.beginPath();
    ctx.arc(originX, originY, rPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#93C5FD";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Beam emitter
    const emitterX = toX(-worldWidth / 2 + 40 * scale);
    const emitterY = originY;
    ctx.fillStyle = "#06B6D4";
    ctx.beginPath();
    ctx.arc(emitterX, emitterY, 10 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(6,182,212,0.2)";
    ctx.beginPath();
    ctx.arc(emitterX, emitterY, 24 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Particles
    const particles = particlesRef.current;
    if (!prefersReducedMotion) {
      ctx.lineWidth = 1.6 * dpr;
      for (const p of particles) {
        const px = toX(p.x);
        const py = toY(p.y);

        if (p.trail.length > 1) {
          const gradTrail = ctx.createLinearGradient(
            toX(p.trail[0].x),
            toY(p.trail[0].y),
            px,
            py
          );
          gradTrail.addColorStop(0, "rgba(59,130,246,0)");
          gradTrail.addColorStop(0.5, "rgba(6,182,212,0.6)");
          gradTrail.addColorStop(1, "rgba(139,92,246,0.2)");
          ctx.strokeStyle = gradTrail;
          ctx.beginPath();
          const first = p.trail[0];
          ctx.moveTo(toX(first.x), toY(first.y));
          for (const t of p.trail.slice(1)) {
            ctx.lineTo(toX(t.x), toY(t.y));
          }
          ctx.lineTo(px, py);
          ctx.stroke();
        }

        const speed = Math.hypot(p.vx, p.vy);
        const arrowLen = 12 * dpr + (speed / 100) * 8 * dpr;
        const ux = p.vx / (speed || 1);
        const uy = p.vy / (speed || 1);

        ctx.strokeStyle = "#22C55E";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + ux * arrowLen, py - uy * arrowLen);
        ctx.stroke();

        ctx.fillStyle = "#0EA5E9";
        ctx.beginPath();
        ctx.arc(px, py, 3.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Reduced motion: simple dots
      ctx.fillStyle = "#0EA5E9";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(toX(p.x), toY(p.y), 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Measurement annotations – scattering angle arc
    const angleRad = (thetaDeg * Math.PI) / 180;
    const arcRadius = rPx + 30 * dpr;
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(
      originX,
      originY,
      arcRadius,
      0,
      angleRad > 0 ? angleRad : -angleRad
    );
    ctx.stroke();
    ctx.fillStyle = "#F59E0B";
    ctx.font = `${11 * dpr}px ui-monospace, SFMono-Regular, Menlo, Monaco`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `θ ≈ ${thetaDeg.toFixed(1)}°`,
      originX + arcRadius + 6 * dpr,
      originY - 4 * dpr
    );

    // HUD: FPS and basic stats
    ctx.fillStyle = "#111827";
    ctx.globalAlpha = 0.9;
    const panelW = 170 * dpr;
    const panelH = 70 * dpr;
    const panelX = left + 10 * dpr;
    const panelY = top + 10 * dpr;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 10 * dpr);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    ctx.fillStyle = "#E5E7EB";
    ctx.font = `${11 * dpr}px ui-monospace, SFMono-Regular, Menlo, Monaco`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`FPS: ${fps.toFixed(0)}`, panelX + 10 * dpr, panelY + 8 * dpr);
    ctx.fillText(
      `Particles: ${particles.length}`,
      panelX + 10 * dpr,
      panelY + 24 * dpr
    );
    ctx.fillText(
      `t = ${simTime.toFixed(2)} s`,
      panelX + 10 * dpr,
      panelY + 40 * dpr
    );
  }, [fps, simTime, nuclearMass, prefersReducedMotion, thetaDeg]);

  // ----------------------------------------
  // Animation loop (60 FPS target)
  // ----------------------------------------

  useEffect(() => {
    runningRef.current = true;
    const targetFPS = 60;
    const frameDuration = 1000 / targetFPS;

    const step = (time: number) => {
      if (!runningRef.current) return;
      requestAnimationFrame(step);

      const last = lastFrameRef.current;
      if (!last) {
        lastFrameRef.current = time;
        return;
      }

      const delta = time - last;
      if (delta < frameDuration) return;

      const dt = delta / 1000;
      lastFrameRef.current = time;

      // Spawn particles based on emissionRate
      const rate = clamp(emissionRate, 5, 120);
      const expected = (rate / targetFPS) * (delta / frameDuration);
      const count = Math.max(1, Math.round(expected));
      for (let i = 0; i < count; i++) spawnParticle();

      updatePhysics(dt);
      autoScale();
      render();

      // FPS stats
      frameCountRef.current += 1;
      const lastUpdate = lastFpsUpdateRef.current || time;
      if (time - lastUpdate >= 500) {
        const fpsNow =
          (frameCountRef.current * 1000) / (time - lastUpdate || 1);
        setFps(fpsNow);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = time;
      }

      setSimTime((prev) => prev + dt);
    };

    requestAnimationFrame(step);
    return () => {
      runningRef.current = false;
    };
  }, [emissionRate, spawnParticle, updatePhysics, autoScale, render]);

  // ----------------------------------------
  // Reset
  // ----------------------------------------

  const handleReset = () => {
    setEnergy(7.5);
    setImpact(0.8);
    setEmissionRate(40);
    setNuclearMass(197);
    setActualEnergy(7.5);
    setActualImpact(0.8);
    particlesRef.current = [];
    scaleRef.current = 1;
    boundsRef.current = null;
    setSimTime(0);
  };

  // ----------------------------------------
  // Derived values for bottom panel
  // ----------------------------------------

  const equationDisplay = useMemo(() => {
    const Z1 = 2;
    const Z2 = 79;
    const num = Z1 * Z2 * COULOMB_K;
    const denom = 2 * energy * impact;
    const theta = thetaDeg;
    return { Z1, Z2, num, denom, theta };
  }, [energy, impact, thetaDeg]);

  // ----------------------------------------
  // Layout
  // ----------------------------------------

  return (
    <div className="bg-gradient-to-b from-[#F9FAFB] via-white to-[#EFF6FF] text-gray-900">
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-8 pb-4 lg:flex-row">
        {/* Left: Simulation box */}
        <div className="flex-1 rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-lg shadow-blue-100">
          <header className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Physical World &amp; Units – Scattering Explorer
              </h1>
              <p className="mt-1 text-xs text-gray-500 max-w-xl">
                Alpha particles from a{" "}
                <span className="font-semibold text-sky-600">
                  visible source
                </span>{" "}
                strike a{" "}
                <span className="font-semibold text-blue-600">
                  massive nucleus
                </span>
                . Adjust energy and impact parameter to see how{" "}
                <span className="font-semibold text-emerald-600">
                  units and scales
                </span>{" "}
                change the motion.
              </p>
            </div>
          </header>

          <div
            ref={containerRef}
            className="relative mt-2 flex min-h-[260px] flex-1 items-stretch justify-stretch overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-[#E5E7EB] via-white to-[#DBEAFE]"
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
            />

            {/* Scale indicator */}
            <div className="pointer-events-none absolute bottom-3 left-4 rounded-full bg-white/80 px-3 py-1 text-[11px] font-mono text-gray-700 shadow-sm border border-gray-200">
              Scale ≈{" "}
              <span className="text-sky-600">
                {scaleRef.current.toFixed(2)}×
              </span>{" "}
              | 1 unit ≈ 1 fm
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <aside className="flex w-full flex-col justify-between rounded-3xl border border-gray-200 bg-white/95 p-5 shadow-lg shadow-blue-100 lg:w-[32%]">
          <div className="space-y-3">
            <SliderRow
              label="Alpha energy"
              icon="⚡"
              value={energy}
              min={1}
              max={20}
              step={0.1}
              unit="MeV"
              defaultValue={7.5}
              dramaticRange={[1, 3]}
              onChange={setEnergy}
            />
            <SliderRow
              label="Impact parameter"
              icon="🎯"
              value={impact}
              min={0.1}
              max={5}
              step={0.05}
              unit="fm"
              defaultValue={0.8}
              dramaticRange={[0.5, 1.2]}
              onChange={setImpact}
            />
            <SliderRow
              label="Emission rate"
              icon="🌟"
              value={emissionRate}
              min={5}
              max={120}
              step={1}
              unit="α/s"
              defaultValue={40}
              dramaticRange={[60, 100]}
              onChange={setEmissionRate}
            />
            <SliderRow
              label="Nuclear mass (relative)"
              icon="🪐"
              value={nuclearMass}
              min={50}
              max={400}
              step={1}
              unit="u"
              defaultValue={197}
              dramaticRange={[150, 300]}
              onChange={setNuclearMass}
            />

            <div className="mt-2 rounded-2xl bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
              <div className="font-semibold mb-1">
                💡 Pro Tip for drama
              </div>
              <ul className="space-y-1">
                <li>
                  <span className="font-semibold">Head‑on:</span> Energy{" "}
                  <span className="font-semibold">1–2 MeV</span>, Impact{" "}
                  <span className="font-semibold">0.1 fm</span> → huge
                  deflection.
                </li>
                <li>
                  <span className="font-semibold">Glancing:</span> Energy{" "}
                  <span className="font-semibold">15 MeV</span>, Impact{" "}
                  <span className="font-semibold">5 fm</span> → barely bends.
                </li>
                <li>
                  <span className="font-semibold">Right angle:</span> Energy{" "}
                  <span className="font-semibold">7.5 MeV</span>, Impact{" "}
                  <span className="font-semibold">0.8 fm</span> → θ ≈ 90°.
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            ↺ Reset to Default
          </button>
        </aside>
      </section>

      {/* Bottom educational panel */}
      <section className="mx-auto flex max-w-7xl flex-col gap-4 px-6 pb-6 lg:flex-row">
        {/* Left: Concept & formula */}
        <div className="flex w-full flex-col rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-sm lg:w-2/5">
          <h2 className="text-sm font-bold text-blue-600 mb-1">
            ✨ The Concept
          </h2>
          <p className="text-xs leading-snug text-gray-700">
            When alpha particles approach a tiny, massive nucleus,{" "}
            <span className="font-semibold text-cyan-700">
              electrostatic repulsion
            </span>{" "}
            bends their paths.
            Higher energy and different impact parameters reveal how{" "}
            <span className="font-semibold text-emerald-700">
              physical quantities and units
            </span>{" "}
            control motion at nuclear scales.
          </p>

          <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="mb-1 text-xs font-semibold text-blue-600">
              📐 Scattering formula
            </div>
            <pre className="text-[11px] font-mono text-gray-800 leading-snug">
              θ = 2·arctan(Z₁Z₂k / 2Eb)
              {"\n"}
              E in MeV, b in fm, k = 1.44 MeV·fm
            </pre>
          </div>
        </div>

        {/* Middle: live equation & stats */}
        <div className="flex w-full flex-col rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-sm lg:w-1/3">
          <h2 className="text-sm font-bold text-blue-600 mb-1">
            📊 Live Physics
          </h2>
          <div className="rounded-2xl bg-gray-50 px-3 py-2 text-[11px] font-mono text-gray-800 space-y-1">
            <div>Current calculation:</div>
            <div>
              θ = 2·arctan(Z₁Z₂k / 2Eb)
            </div>
            <div>
              θ = 2·arctan(
              {equationDisplay.Z1}×{equationDisplay.Z2}×1.44 / 2×
              {energy.toFixed(2)}×{impact.toFixed(2)})
            </div>
            <div>
              θ ≈{" "}
              <span className="text-sky-600 font-semibold">
                {thetaDeg.toFixed(1)}°
              </span>
            </div>
            <div>
              dₘᵢₙ ≈{" "}
              <span className="text-emerald-600 font-semibold">
                {closestApproach.toFixed(2)} fm
              </span>
            </div>
          </div>

          <div className="mt-2 rounded-2xl bg-slate-900 px-3 py-2 text-[11px] text-slate-100 font-mono space-y-0.5">
            <div className="font-semibold flex items-center gap-1">
              ⚡ Live Stats
            </div>
            <div>
              Energy: {history.energy.current.toFixed(2)} MeV (avg{" "}
              {history.energy.average.toFixed(2)})
            </div>
            <div>
              Impact: {history.impact.current.toFixed(2)} fm (avg{" "}
              {history.impact.average.toFixed(2)})
            </div>
            <div>
              Emission: {history.emissionRate.current.toFixed(0)} α/s
            </div>
          </div>
        </div>

        {/* Right: interactive tips */}
        <div className="flex w-full flex-col rounded-3xl border border-blue-100 bg-blue-50/90 p-4 shadow-sm lg:w-1/3">
          <h2 className="text-sm font-bold text-blue-600 mb-1">
            💡 Try This for Drama!
          </h2>
          <div className="text-[11px] text-blue-900 space-y-2">
            <div>
              <div className="font-semibold">
                🎯 Maximum deflection
              </div>
              <div>
                Energy = <span className="font-semibold">1–2 MeV</span>, Impact{" "}
                <span className="font-semibold">0.1 fm</span> → many{" "}
                <span className="text-amber-600 font-semibold">
                  back‑scattered
                </span>{" "}
                particles.
              </div>
            </div>
            <div>
              <div className="font-semibold">
                ⚡ High‑speed pass
              </div>
              <div>
                Energy = <span className="font-semibold">15 MeV</span>, Impact{" "}
                <span className="font-semibold">5 fm</span> → beam races past
                with{" "}
                <span className="text-emerald-600 font-semibold">
                  tiny bends
                </span>
                .
              </div>
            </div>
            <div>
              <div className="font-semibold">
                🌟 Critical angle (≈90°)
              </div>
              <div>
                Energy = <span className="font-semibold">7.5 MeV</span>,
                Impact ={" "}
                <span className="font-semibold">
                  0.8 fm
                </span>{" "}
                → a beautifully{" "}
                <span className="text-sky-700 font-semibold">
                  right‑angled
                </span>{" "}
                scatter.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PhysicalWorldUnitsSimulation;

