"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// ─── Constants & types ─────────────────────────────────────────────────────
const DEFAULT_ANGLE = 25;
const DEFAULT_MASS = 5;
const DEFAULT_MU = 0.3;
const DEFAULT_G = 9.81;
const RAMP_LENGTH = 10; // m — large incline for clarity
const RAMP_OFFSET_X = 2;
const BASE_MASS = 1;
const BASE_BLOCK_LENGTH = 1.5; // m at 1 kg — large, central focus block

type MotionState = "rest" | "sliding";

interface Params {
  angleDeg: number;
  mass: number;
  mu: number;
  g: number;
}

interface SliderSpec {
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

// ─── Physics (F = ma, component resolution) ──────────────────────────────────
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function getPhysics(params: Params) {
  const θ = toRad(params.angleDeg);
  const { mass, mu, g } = params;
  // At 0°: horizontal, block stays. At 90°: vertical, block falls along plane.
  const cosθ = Math.cos(θ);
  const sinθ = Math.sin(θ);
  const N = mass * g * cosθ;
  const W_parallel = mass * g * sinθ;
  const f_max = mu * N;
  // Slide when downhill component exceeds max static friction (or at 90° N=0 so it falls)
  const sliding = cosθ <= 0 || W_parallel > f_max;
  const a = sliding
    ? g * (sinθ - mu * cosθ)
    : 0;
  const f_friction = sliding ? mu * N : Math.min(W_parallel, f_max);
  const motionState: MotionState = sliding ? "sliding" : "rest";
  return {
    θ,
    N,
    W_parallel,
    f_max,
    f_friction,
    a,
    motionState,
    W_total: mass * g,
  };
}

// Visual size: radius ∝ ∛mass for “block length” along ramp
function blockLengthAlongRamp(mass: number) {
  return BASE_BLOCK_LENGTH * Math.cbrt(mass / BASE_MASS);
}

// ─── Interpolation for smooth slider → simulation ───────────────────────────
function interpolate(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

// ─── Format number for display ──────────────────────────────────────────────
function fmt(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

// ─── Parameter Slider (horizontal, with live value & units) ──────────────────
function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  defaultValue,
  icon,
  onChange,
  onReset,
}: SliderSpec & {
  onChange: (v: number) => void;
  onReset?: () => void;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-medium text-[#111827]"
      >
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#6B7280] tabular-nums">{fmt(min)}</span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full bg-[#E5E7EB] accent-[#3B82F6] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow"
          aria-label={`${label}: ${value} ${unit}`}
          //aria-valuemin={min}
          //aria-valuemax={max}
         // aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
        />
        <span className="text-xs text-[#6B7280] tabular-nums">{fmt(max)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold tabular-nums text-[#3B82F6]">
          {value < 1 ? fmt(value, 2) : fmt(value, 1)} {unit}
        </span>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#6B7280] hover:text-[#3B82F6]"
          >
            Reset to {defaultValue}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Rotated Force Analysis Diagram (axes aligned: surface horizontal) ────────
function RotatedForceDiagram({
  N,
  W_parallel,
  W_perp,
  f,
  W_total,
  angleDeg,
}: {
  N: number;
  W_parallel: number;
  W_perp: number;
  f: number;
  W_total: number;
  angleDeg: number;
}) {
  const w = 220;
  const h = 160;
  const cx = w / 2;
  const cy = h / 2 - 10;
  const boxW = 44;
  const boxH = 28;
  const ref = Math.max(N, W_parallel, f, W_total, 1);
  const scale = (F: number) => Math.min(38, Math.max(12, (F / ref) * 32));

  const Nlen = scale(N);
  const WperpLen = scale(W_perp);
  const flen = scale(f);
  const Wplen = scale(W_parallel);
  const Wlen = scale(W_total);
  const angleRad = (angleDeg * Math.PI) / 180;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full max-w-[280px] h-auto rounded-lg border border-[#E5E7EB] bg-[#FAFAFA]"
      aria-label="Force component analysis in rotated view: surface horizontal"
    >
      {/* Horizontal surface (incline in rotated view) */}
      <line x1={20} y1={cy + boxH / 2} x2={w - 20} y2={cy + boxH / 2} stroke="#475569" strokeWidth={3} strokeLinecap="round" />
      {/* Block */}
      <rect x={cx - boxW / 2} y={cy - boxH / 2} width={boxW} height={boxH} rx={4} fill="#F59E0B" stroke="#D97706" strokeWidth={1.5} />
      {/* N — straight up */}
      <line x1={cx} y1={cy} x2={cx} y2={cy - Nlen} stroke="#2563EB" strokeWidth={2.5} strokeLinecap="round" />
      <polygon points={`${cx},${cy - Nlen - 8} ${cx - 5},${cy - Nlen + 4} ${cx + 5},${cy - Nlen + 4}`} fill="#2563EB" />
      <text x={cx + 10} y={cy - Nlen / 2} fontSize={11} fontWeight="bold" fill="#1E293B">N</text>
      {/* W⊥ — straight down (opposing N) */}
      <line x1={cx - 22} y1={cy} x2={cx - 22} y2={cy + WperpLen} stroke="#64748B" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
      <polygon points={`${cx - 22},${cy + WperpLen + 8} ${cx - 22 - 5},${cy + WperpLen - 4} ${cx - 22 + 5},${cy + WperpLen - 4}`} fill="#64748B" />
      <text x={cx - 22 - 18} y={cy + WperpLen / 2} fontSize={10} fontWeight="bold" fill="#475569">W⊥</text>
      {/* f — left (opposing motion) */}
      <line x1={cx} y1={cy + 12} x2={cx - flen} y2={cy + 12} stroke="#059669" strokeWidth={2.5} strokeLinecap="round" />
      <polygon points={`${cx - flen - 8},${cy + 12} ${cx - flen + 4},${cy + 12 - 5} ${cx - flen + 4},${cy + 12 + 5}`} fill="#059669" />
      <text x={cx - flen / 2} y={cy + 12 + 16} fontSize={11} fontWeight="bold" fill="#1E293B">f</text>
      {/* W∥ — right (down the slope in rotated view) */}
      <line x1={cx} y1={cy - 12} x2={cx + Wplen} y2={cy - 12} stroke="#0891B2" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
      <polygon points={`${cx + Wplen + 8},${cy - 12} ${cx + Wplen - 4},${cy - 12 - 5} ${cx + Wplen - 4},${cy - 12 + 5}`} fill="#0891B2" />
      <text x={cx + Wplen / 2 - 6} y={cy - 12 - 10} fontSize={10} fontWeight="bold" fill="#0E7490">W∥</text>
      {/* Optional: W at angle (diagonal) showing where components come from */}
      <line
        x1={cx + 18}
        y1={cy - 8}
        x2={cx + 18 + Wlen * Math.sin(angleRad)}
        y2={cy - 8 + Wlen * Math.cos(angleRad)}
        stroke="#DC2626"
        strokeWidth={1.8}
        strokeDasharray="3 2"
        strokeLinecap="round"
        opacity={0.9}
      />
      <text x={cx + 18 + (Wlen * Math.sin(angleRad)) / 2 + 8} y={cy - 8 + (Wlen * Math.cos(angleRad)) / 2} fontSize={9} fontWeight="bold" fill="#B91C1C">W</text>
    </svg>
  );
}

// ─── Main simulation component ───────────────────────────────────────────────
export default function InclinedPlaneFrictionSimulation() {
  const [playing, setPlaying] = useState(true);
  const [angleDeg, setAngleDeg] = useState(DEFAULT_ANGLE);
  const [mass, setMass] = useState(DEFAULT_MASS);
  const [mu, setMu] = useState(DEFAULT_MU);
  const [g, setG] = useState(DEFAULT_G);

  // Smoothed params for animation
  const [smoothAngle, setSmoothAngle] = useState(DEFAULT_ANGLE);
  const [smoothMass, setSmoothMass] = useState(DEFAULT_MASS);
  const [smoothMu, setSmoothMu] = useState(DEFAULT_MU);
  const [smoothG, setSmoothG] = useState(DEFAULT_G);

  // Physics state along ramp: s (m), v (m/s)
  const sRef = useRef(0);
  const vRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const dustRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const wasSlidingRef = useRef(false);
  // Fall-off: when block slides off the end of the ramp it falls under gravity
  const fellOffRef = useRef(false);
  const fallXRef = useRef(0);
  const fallYRef = useRef(0);
  const fallVxRef = useRef(0);
  const fallVyRef = useRef(0);
  const fallTimeRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const params: Params = {
    angleDeg: smoothAngle,
    mass: smoothMass,
    mu: smoothMu,
    g: smoothG,
  };
  const physics = getPhysics(params);
  const motionState = physics.motionState;

  const paramsRef = useRef(params);
  const physicsRef = useRef(physics);
  paramsRef.current = params;
  physicsRef.current = physics;

  // Reset block position when params change enough (e.g. angle) or on explicit reset
  const resetBlock = useCallback(() => {
    sRef.current = 0;
    vRef.current = 0;
    trailRef.current = [];
    fellOffRef.current = false;
  }, []);

  // Smooth parameter interpolation (~60fps)
  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothAngle((p) => interpolate(p, angleDeg, 0.12));
      setSmoothMass((p) => interpolate(p, mass, 0.12));
      setSmoothMu((p) => interpolate(p, mu, 0.12));
      setSmoothG((p) => interpolate(p, g, 0.12));
    }, 16);
    return () => clearInterval(interval);
  }, [angleDeg, mass, mu, g]);

  // Reset block when angle/mu/g change significantly so ramp shape changes
  useEffect(() => {
    resetBlock();
  }, [angleDeg, mu, g, resetBlock]);

  const resetToDefault = useCallback(() => {
    setAngleDeg(DEFAULT_ANGLE);
    setMass(DEFAULT_MASS);
    setMu(DEFAULT_MU);
    setG(DEFAULT_G);
    resetBlock();
  }, [resetBlock]);

  // ─── Canvas layout & world → pixel ─────────────────────────────────────────
  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(window.devicePixelRatio ?? 1, 2));
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ─── Animation loop: physics step + draw ───────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const animSpeed = prefersReducedMotion ? 0.4 : 1;

    let rafId: number;

    const animate = (currentTime: number) => {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const pr = paramsRef.current;
      const ph = physicsRef.current;
      const θ = ph.θ;
      const halfLen = blockLengthAlongRamp(pr.mass) / 2;
      const maxS = RAMP_LENGTH - halfLen;
      if (maxS < 0) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      // Physics step: sliding along ramp, or fall-off when reaching the end
      if (fellOffRef.current) {
        fallTimeRef.current += dt;
        fallVyRef.current += pr.g * dt * animSpeed;
        fallXRef.current += fallVxRef.current * dt;
        fallYRef.current += fallVyRef.current * dt;
        // Reset back to ramp after 4s or when far off so user can try again
        if (fallTimeRef.current > 4 || fallYRef.current > RAMP_LENGTH * 3) {
          fellOffRef.current = false;
          sRef.current = 0;
          vRef.current = 0;
          fallTimeRef.current = 0;
        }
      } else if (ph.motionState === "sliding" && dt > 0 && dt < 0.2) {
        const a = ph.a * animSpeed;
        vRef.current += a * dt;
        sRef.current += vRef.current * dt;
        if (sRef.current >= maxS && vRef.current > 0.05) {
          // Block reaches end of ramp with speed → fall off
          fellOffRef.current = true;
          fallTimeRef.current = 0;
          fallXRef.current = RAMP_OFFSET_X + maxS * Math.cos(θ);
          fallYRef.current = maxS * Math.sin(θ);
          fallVxRef.current = vRef.current * Math.cos(θ);
          fallVyRef.current = vRef.current * Math.sin(θ);
          sRef.current = maxS;
          vRef.current = 0;
        } else if (sRef.current >= maxS) {
          sRef.current = maxS;
          vRef.current = 0;
        }
        if (sRef.current < 0) {
          sRef.current = 0;
          vRef.current = 0;
        }
      }

      const s = Math.max(0, Math.min(maxS, sRef.current));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        rafId = requestAnimationFrame(animate);
        return;
        }

      const w = canvas.width;
      const h = canvas.height;
      const dpr = w / rect.width;

      // World bounds: ramp shifted right by RAMP_OFFSET_X
      const L = RAMP_LENGTH;
      const rampStartX = RAMP_OFFSET_X;
      const rampEndX = RAMP_OFFSET_X + L * Math.cos(θ);
      const rampEndY = L * Math.sin(θ);
      const fellOff = fellOffRef.current;
      const blockCx = fellOff ? fallXRef.current : rampStartX + s * Math.cos(θ);
      const blockCy = fellOff ? fallYRef.current : s * Math.sin(θ);
      const margin = 0.8;
      const boundsMinX = rampStartX - margin;
      const boundsMaxX = Math.max(rampEndX, blockCx + halfLen) + margin;
      const boundsMinY = -margin;
      const boundsMaxY = Math.max(rampEndY, blockCy + halfLen) + margin;
      const boundsW = boundsMaxX - boundsMinX;
      const boundsH = boundsMaxY - boundsMinY;

      // Use ~90% of view so plane and block dominate and are clearly readable
      const scale = Math.min(
        (w * 0.9) / boundsW,
        (h * 0.9) / boundsH,
        14
      );
      const scaleClamped = Math.max(0.3, Math.min(14, scale));
      const ox = w / 2 - ((boundsMinX + boundsMaxX) / 2) * scaleClamped;
      const oy = h / 2 - ((boundsMinY + boundsMaxY) / 2) * scaleClamped;

      const toPx = (x: number, y: number) => ({
        x: ox + x * scaleClamped,
        y: oy + y * scaleClamped,
      });

      // Soft light gray background #F9FAFB (clearly visible, not white)
      ctx.fillStyle = "#F9FAFB";
      ctx.fillRect(0, 0, w, h);
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#F3F4F6");
      bgGrad.addColorStop(1, "#F9FAFB");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Grid: light gray #E5E7EB
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 1.2;
      const gridStep = 0.5;
      for (let x = boundsMinX; x <= boundsMaxX; x += gridStep) {
        const p = toPx(x, 0);
        ctx.beginPath();
        ctx.moveTo(p.x, 0);
        ctx.lineTo(p.x, h);
        ctx.stroke();
      }
      for (let y = boundsMinY; y <= boundsMaxY; y += gridStep) {
        const p = toPx(0, y);
        ctx.beginPath();
        ctx.moveTo(0, p.y);
        ctx.lineTo(w, p.y);
        ctx.stroke();
      }

      // Incline surface: thick, distinct grey plane
      const p0 = toPx(rampStartX, 0);
      const p1 = toPx(rampEndX, rampEndY);
      const rampThick = Math.max(28, 36 * dpr);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = Math.max(6, 10 * dpr);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.lineCap = "butt";

      // Ramp fill — clear, readable surface
      ctx.fillStyle = "rgba(71, 85, 105, 0.92)";
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p1.x, h + 20);
      ctx.lineTo(p0.x, h + 20);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Trail when sliding: blue → cyan fade
      if (!prefersReducedMotion && trailRef.current.length > 1 && ph.motionState === "sliding") {
        const trail = trailRef.current;
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "rgba(59, 130, 246, 0.7)");
        grad.addColorStop(0.5, "rgba(6, 182, 212, 0.5)");
        grad.addColorStop(1, "rgba(6, 182, 212, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 4 * dpr;
        ctx.beginPath();
        const first = toPx(trail[0].x, trail[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < trail.length; i++) {
          const pt = toPx(trail[i].x, trail[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Dust particles when motion begins (small particles near block)
      if (!prefersReducedMotion && ph.motionState === "sliding") {
        if (!wasSlidingRef.current) {
          for (let i = 0; i < 8; i++) {
            const angle = Math.PI * 0.5 + θ + (Math.random() - 0.5) * 0.6;
            dustRef.current.push({
              x: blockCx,
              y: blockCy,
              vx: Math.cos(angle) * 0.15,
              vy: Math.sin(angle) * 0.15,
              life: 1,
            });
          }
        }
        wasSlidingRef.current = true;
      } else {
        wasSlidingRef.current = false;
      }
      const dust = dustRef.current;
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.x += p.vx * 0.05;
        p.y += p.vy * 0.05;
        p.life -= 0.03;
        if (p.life <= 0) {
          dust.splice(i, 1);
          continue;
        }
        const dp = toPx(p.x, p.y);
        ctx.fillStyle = `rgba(148, 163, 184, ${p.life})`;
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, 2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!fellOff && ph.motionState === "sliding") {
        trailRef.current.push({ x: blockCx, y: blockCy });
        if (trailRef.current.length > 40) trailRef.current.shift();
      } else if (!fellOff) {
        trailRef.current = [];
      }

      // Block: inclined with ramp — large and central
      const bl = blockLengthAlongRamp(pr.mass);
      const bw = bl * 0.85;
      const cx = blockCx;
      const cy = blockCy;
      const cos = Math.cos(θ);
      const sin = Math.sin(θ);
      const corners = [
        [-bl / 2, -bw / 2],
        [bl / 2, -bw / 2],
        [bl / 2, bw / 2],
        [-bl / 2, bw / 2],
      ].map(([dx, dy]) => ({
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      }));
      const pts = corners.map((c) => toPx(c.x, c.y));
      ctx.fillStyle = "#F59E0B";
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach((p, i) => i && ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Glow for “force source” / active element
      ctx.shadowColor = "rgba(245, 158, 11, 0.4)";
      ctx.shadowBlur = 8 * dpr;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Force arrows (on ramp only; when fallen off block is in free fall)
      const arrowScale = (0.32 * scaleClamped) / (pr.mass * pr.g || 1);
      const scaleForce = (F: number) =>
        Math.min(100 * dpr, Math.max(28 * dpr, F * arrowScale));
      const glowAmount = 4 + Math.min(12, Math.abs(ph.a) * 2) * dpr;

      const drawArrow = (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        color: string,
        opts: { withGlow?: boolean; dashed?: boolean; label?: string } = {}
      ) => {
        const { withGlow = true, dashed = false, label } = opts;
        const fx = ox + fromX * scaleClamped;
        const fy = oy + fromY * scaleClamped;
        const tx = ox + toX * scaleClamped;
        const ty = oy + toY * scaleClamped;
        const dx = tx - fx;
        const dy = ty - fy;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const head = 18 * dpr;
        const wing = 10 * dpr;
        if (dashed) ctx.setLineDash([6 * dpr, 5 * dpr]);
        if (withGlow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = glowAmount;
        }
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = dashed ? 3 * dpr : 4.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        if (!dashed) {
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx - ux * head - uy * wing, ty - uy * head + ux * wing);
          ctx.lineTo(tx - ux * head + uy * wing, ty - uy * head - ux * wing);
          ctx.closePath();
          ctx.fill();
        }
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        if (label) {
          const lx = tx + ux * 22 * dpr;
          const ly = ty + uy * 22 * dpr;
          ctx.font = `bold ${Math.round(15 * dpr)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#0F172A";
          ctx.strokeStyle = "#FFF";
          ctx.lineWidth = 2 * dpr;
          ctx.strokeText(label, lx, ly);
          ctx.fillText(label, lx, ly);
        }
      };

      if (!fellOff) {
        const WyClamp = scaleForce(ph.W_total);
        drawArrow(cx, cy, cx, cy + WyClamp / scaleClamped, "#DC2626", { label: "W" });

      // Normal (perpendicular to ramp, outward = up-left in world: -sin(θ), -cos(θ) for “out” from surface)
      const Nx = -ph.N * Math.sin(θ);
      const Ny = -ph.N * Math.cos(θ);
      const Nlen = scaleForce(ph.N);
      const Nnorm = Math.hypot(Nx, Ny) || 1;
      drawArrow(
        cx,
        cy,
        cx + (Nx / Nnorm) * (Nlen / scaleClamped),
        cy + (Ny / Nnorm) * (Nlen / scaleClamped),
        "#2563EB",
        { label: "N" }
      );

      // Friction (parallel to incline, opposing motion / tendency of motion)
      const fDirX = -Math.cos(θ);
      const fDirY = -Math.sin(θ);
      const flen = scaleForce(ph.f_friction);
      drawArrow(
        cx,
        cy,
        cx + fDirX * (flen / scaleClamped),
        cy + fDirY * (flen / scaleClamped),
        "#059669",
        { label: "f" }
      );
      // Left view shows only W, N, f — no components or net force (see right panel for analysis)
      }

      // Angle arc at pivot
      const arcR = 0.55 * scaleClamped;
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(toPx(rampStartX, 0).x, toPx(rampStartX, 0).y, arcR, -θ, 0);
      ctx.stroke();
      // Angle label θ = ___° – fixed position top-left of canvas so always visible
      ctx.fillStyle = "#111827";
      ctx.font = `bold ${14 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`θ = ${fmt(pr.angleDeg, 0)}°`, 14 * dpr, 14 * dpr);
      // Live equation on canvas (top-right): a = g(sinθ − μ cosθ) and result
      ctx.textAlign = "right";
      ctx.fillStyle = "#374151";
      ctx.font = `${11 * dpr}px system-ui, sans-serif`;
      ctx.fillText("a = g (sinθ − μ cosθ)", w - 14 * dpr, 12 * dpr);
      ctx.fillText(
        `a = ${fmt(pr.g, 1)} (sin${fmt(pr.angleDeg, 0)}° − ${fmt(pr.mu, 2)} cos${fmt(pr.angleDeg, 0)}°)`,
        w - 14 * dpr,
        26 * dpr
      );
      ctx.font = `bold ${12 * dpr}px system-ui`;
      ctx.fillStyle = "#3B82F6";
      ctx.fillText(
        `a = ${ph.motionState === "sliding" ? fmt(ph.a, 2) : "0"} m/s²`,
        w - 14 * dpr,
        42 * dpr
      );
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      rafId = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Slider specs
  const sliders: SliderSpec[] = [
    {
      label: "Incline angle",
      value: angleDeg,
      min: 0,
      max: 90,
      step: 1,
      unit: "°",
      defaultValue: DEFAULT_ANGLE,
      icon: "📐",
      dramaticRange: [20, 45],
    },
    {
      label: "Mass",
      value: mass,
      min: 1,
      max: 20,
      step: 0.5,
      unit: "kg",
      defaultValue: DEFAULT_MASS,
      icon: "📦",
      dramaticRange: [3, 10],
    },
    {
      label: "Coefficient of friction μ",
      value: mu,
      min: 0,
      max: 1.2,
      step: 0.05,
      unit: "",
      defaultValue: DEFAULT_MU,
      icon: "🔄",
      dramaticRange: [0.2, 0.5],
    },
    {
      label: "Gravity",
      value: g,
      min: 1.6,
      max: 25,
      step: 0.5,
      unit: "m/s²",
      defaultValue: DEFAULT_G,
      icon: "🌍",
      dramaticRange: [9, 11],
    },
  ];

  const tip =
    motionState === "rest"
      ? "🎯 Increase angle to trigger motion."
      : "⚡ Increase μ or reduce angle to stop motion.";

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] text-[#111827]">
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: simulation canvas */}
            <div className="col-span-1 lg:col-span-2">
              <div
                className="relative min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F3F4F6]"
                style={{ minHeight: "430px" }}
              >
                <div ref={containerRef} className="absolute inset-0">
                  <canvas
                    ref={canvasRef}
                    className="h-full w-full"
                    style={{ display: "block" }}
                  />
                </div>
                <div className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2.5 py-1.5 text-xs text-[#374151] shadow border border-[#E5E7EB]">
                  Realistic view - three forces only: <strong>W</strong>, <strong>N</strong>, <strong>f</strong>
                </div>
              </div>
            </div>

            {/* Right: parameters */}
            <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide">
                  Parameters
                </h3>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>
              </div>

              <div className="space-y-2">
                {sliders.map((spec) => (
                  <ParameterSlider
                    key={spec.label}
                    {...spec}
                    onChange={(v) => {
                      if (spec.label.includes("angle")) setAngleDeg(v);
                      else if (spec.label.includes("Mass")) setMass(v);
                      else if (spec.label.includes("μ")) setMu(v);
                      else setG(v);
                    }}
                    onReset={() => {
                      if (spec.label.includes("angle")) setAngleDeg(spec.defaultValue);
                      else if (spec.label.includes("Mass")) setMass(spec.defaultValue);
                      else if (spec.label.includes("μ")) setMu(spec.defaultValue);
                      else setG(spec.defaultValue);
                    }}
                  />
                ))}
              </div>

              <div className="rounded-lg bg-blue-50 p-2 text-xs text-[#111827]">
                {tip}
              </div>
              <button
                type="button"
                onClick={resetToDefault}
                aria-label="Reset all parameters to default values"
                className="w-full rounded-lg bg-[#3B82F6] px-4 py-2.5 font-semibold text-white shadow transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                ↺ Reset
              </button>
            </aside>
          </div>
        </div>

        {/* Below: component analysis + vector legend */}
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-1.5 text-xs font-bold text-[#374151] uppercase tracking-wide">
                Force Component Analysis (Rotated View)
              </h4>
              <p className="mb-2 text-[11px] text-[#6B7280] leading-tight">
                Incline rotated so the surface is horizontal. Forces are resolved along and perpendicular to the plane.
              </p>
              <div className="min-h-[220px] rounded-lg bg-slate-50 p-2">
                <RotatedForceDiagram
                  N={physics.N}
                  W_parallel={physics.W_parallel}
                  W_perp={physics.N}
                  f={physics.f_friction}
                  W_total={physics.W_total}
                  angleDeg={smoothAngle}
                />
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-bold text-[#374151] uppercase tracking-wide">
                Force Vector Legend
              </h4>
              <p className="mb-1.5 text-[11px] text-[#6B7280]">Top panel: realistic view. This panel: component analysis.</p>
              <ul className="space-y-1.5 text-xs text-[#374151]">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-4 flex-shrink-0 rounded-sm bg-[#DC2626]" aria-hidden />
                  <span><strong>(W)</strong> Weight - gravity pulling straight down.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-4 flex-shrink-0 rounded-sm bg-[#2563EB]" aria-hidden />
                  <span><strong>(N)</strong> Normal force - perpendicular to surface, away from plane.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-4 flex-shrink-0 rounded-sm bg-[#059669]" aria-hidden />
                  <span><strong>(f)</strong> Friction - parallel to surface, opposing motion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-4 flex-shrink-0 border border-[#0891B2] border-dashed bg-transparent rounded-sm" style={{ borderWidth: 2 }} aria-hidden />
                  <span><strong>(W∥)</strong> Weight component <em>down</em> the slope (rotated view: right).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-4 flex-shrink-0 border border-[#64748B] border-dashed bg-transparent rounded-sm" style={{ borderWidth: 2 }} aria-hidden />
                  <span><strong>(W⊥)</strong> Weight component <em>into</em> the slope (rotated view: down).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width: Physics Principle — comprehensive explanation */}
      <section
        className="w-full border-t border-[#E5E7EB] bg-white px-5 py-5"
        style={{ minHeight: "26vh" }}
        aria-labelledby="physics-principle-heading"
      >
        <h2 id="physics-principle-heading" className="mb-3 text-lg font-bold text-[#111827]">
          Physics Principle: Forces on an Inclined Plane
        </h2>

        <p className="mb-4 max-w-4xl text-sm leading-relaxed text-[#374151]">
          An inclined plane is a simple machine that tilts a surface at an angle θ to the horizontal. Analyzing motion on this plane requires breaking down the forces acting upon the object, particularly gravity.
        </p>

        <div className="max-w-4xl space-y-4 text-sm text-[#374151]">
          <div>
            <h3 className="mb-1.5 font-bold text-[#111827]">1. The Forces at Play</h3>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong className="text-[#111827]">Weight (W):</strong> The force of gravity pulling the block straight down (W = mg).</li>
              <li><strong className="text-[#111827]">Normal Force (N):</strong> The contact force exerted by the surface, always perpendicular to the incline.</li>
              <li><strong className="text-[#111827]">Friction (f):</strong> A resistive force opposing motion, acting parallel to the surface.</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1.5 font-bold text-[#111827]">2. Resolving Gravity</h3>
            <p className="mb-1">Gravity is resolved into two components aligned with the incline:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong className="text-[#111827]">Perpendicular component (W<sub>⊥</sub>):</strong> Pushes the block into the surface (W<sub>⊥</sub> = mg cos θ). This is balanced by the Normal Force (N).</li>
              <li><strong className="text-[#111827]">Parallel component (W<sub>∥</sub>):</strong> Pulls the block down the slope (W<sub>∥</sub> = mg sin θ). This is the driving force of motion.</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1.5 font-bold text-[#111827]">3. The Role of Friction</h3>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong className="text-[#111827]">Static friction (f<sub>s</sub>):</strong> Acts when the block is stationary, matching the pull up to a maximum limit (f<sub>s,max</sub> = μ<sub>s</sub>N).</li>
              <li><strong className="text-[#111827]">Kinetic friction (f<sub>k</sub>):</strong> Acts when the block is sliding, usually constant (f<sub>k</sub> = μ<sub>k</sub>N).</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1.5 font-bold text-[#111827]">4. Newton&apos;s Second Law (F = ma)</h3>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong className="text-[#111827]">Perpendicular:</strong> Forces balance (N − W<sub>⊥</sub> = 0).</li>
              <li><strong className="text-[#111827]">Parallel:</strong> The net force is the difference between the pull and friction (F<sub>net</sub> = W<sub>∥</sub> − f).</li>
              <li><strong className="text-[#111827]">Acceleration:</strong> The block accelerates if F<sub>net</sub> &gt; 0, where a = F<sub>net</sub> / m.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
