"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  color: string;
  trail: { x: number; y: number }[];
  radius: number;
}

interface SimState {
  bodies: Body[];
  time: number;
  comTrail: { x: number; y: number }[];
  collisions: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 800;
const CANVAS_H = 480;
const TRAIL_LEN = 80;
const COM_TRAIL_LEN = 120;

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"];
const GLOW_COLORS = ["#60A5FA", "#FCA5A5", "#6EE7B7", "#FCD34D"];

const defaultParams = {
  mass1: 3,
  mass2: 1,
  mass3: 2,
  mass4: 1.5,
  numBodies: 2,
  gravity: 0,
  elasticity: 0.9,
  speed: 1,
};

// ─── Physics helpers ─────────────────────────────────────────────────────────
const bodyRadius = (mass: number) => Math.max(8, 10 * Math.cbrt(mass));

function initBodies(params: typeof defaultParams): Body[] {
  const masses = [params.mass1, params.mass2, params.mass3, params.mass4];
  const n = params.numBodies;
  const bodies: Body[] = [];

  const positions = [
    { x: 180, y: 200, vx: 2.5, vy: 1.2 },
    { x: 620, y: 280, vx: -2.0, vy: -0.8 },
    { x: 300, y: 350, vx: 1.5, vy: -2.0 },
    { x: 500, y: 120, vx: -1.0, vy: 1.8 },
  ];

  for (let i = 0; i < n; i++) {
    bodies.push({
      id: i,
      x: positions[i].x,
      y: positions[i].y,
      vx: positions[i].vx * params.speed,
      vy: positions[i].vy * params.speed,
      mass: masses[i],
      color: COLORS[i],
      trail: [],
      radius: bodyRadius(masses[i]),
    });
  }
  return bodies;
}

function computeCOM(bodies: Body[]) {
  const totalMass = bodies.reduce((s, b) => s + b.mass, 0);
  const cx = bodies.reduce((s, b) => s + b.mass * b.x, 0) / totalMass;
  const cy = bodies.reduce((s, b) => s + b.mass * b.y, 0) / totalMass;
  return { cx, cy, totalMass };
}

// ─── Canvas Renderer ──────────────────────────────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  showGrid: boolean,
  showTrails: boolean,
  showVectors: boolean
) {
  const { bodies, comTrail } = state;
  const W = CANVAS_W;
  const H = CANVAS_H;

  // Background
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  if (showGrid) {
    ctx.strokeStyle = "rgba(148,163,184,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // COM trail
  if (showTrails && comTrail.length > 2) {
    for (let i = 1; i < comTrail.length; i++) {
      const alpha = (i / comTrail.length) * 0.9;
      ctx.strokeStyle = `rgba(234,179,8,${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(comTrail[i - 1].x, comTrail[i - 1].y);
      ctx.lineTo(comTrail[i].x, comTrail[i].y);
      ctx.stroke();
    }
  }

  // Body trails
  if (showTrails) {
    bodies.forEach((b, bi) => {
      const gc = GLOW_COLORS[bi];
      for (let i = 1; i < b.trail.length; i++) {
        const alpha = (i / b.trail.length) * 0.5;
        ctx.strokeStyle = `rgba(${hexToRgb(gc)},${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.trail[i - 1].x, b.trail[i - 1].y);
        ctx.lineTo(b.trail[i].x, b.trail[i].y);
        ctx.stroke();
      }
    });
  }

  // COM lines from each body
  const { cx, cy } = computeCOM(bodies);
  bodies.forEach((b) => {
    ctx.strokeStyle = "rgba(234,179,8,0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Velocity vectors
  if (showVectors) {
    bodies.forEach((b, bi) => {
      const scale = 12;
      const ex = b.x + b.vx * scale;
      const ey = b.y + b.vy * scale;
      ctx.strokeStyle = GLOW_COLORS[bi];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(ey - b.y, ex - b.x);
      ctx.fillStyle = GLOW_COLORS[bi];
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 8 * Math.cos(angle - 0.4), ey - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(ex - 8 * Math.cos(angle + 0.4), ey - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    });
  }

  // Bodies
  bodies.forEach((b, bi) => {
    const r = b.radius;
    // Glow
    const grd = ctx.createRadialGradient(b.x, b.y, r * 0.3, b.x, b.y, r * 2.5);
    grd.addColorStop(0, GLOW_COLORS[bi] + "99");
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bg = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, 0, b.x, b.y, r);
    bg.addColorStop(0, "#FFFFFF");
    bg.addColorStop(0.3, GLOW_COLORS[bi]);
    bg.addColorStop(1, b.color);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Mass label
    ctx.fillStyle = "#0F172A";
    ctx.font = `bold ${Math.max(9, r * 0.7)}px 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`m${bi + 1}`, b.x, b.y);
  });

  // COM marker
  const comR = 12;
  // COM glow
  const cGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, comR * 3);
  cGrd.addColorStop(0, "rgba(234,179,8,0.8)");
  cGrd.addColorStop(1, "transparent");
  ctx.fillStyle = cGrd;
  ctx.beginPath();
  ctx.arc(cx, cy, comR * 3, 0, Math.PI * 2);
  ctx.fill();

  // COM star/cross
  ctx.strokeStyle = "#FDE047";
  ctx.lineWidth = 3;
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sy) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + sx * comR, cy + sy * comR);
      ctx.stroke();
    })
  );
  ctx.beginPath();
  ctx.arc(cx, cy, comR * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = "#FDE047";
  ctx.fill();

  // COM label
  ctx.fillStyle = "#FDE047";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText("COM", cx + 16, cy - 8);
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

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
        <span className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">{label}</span>
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function COMSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimState>({ bodies: [], time: 0, comTrail: [], collisions: 0 });
  const animRef = useRef<number>(0);
  const runningRef = useRef(true);

  const [params, setParams] = useState(defaultParams);
  const [paramsLive, setParamsLive] = useState(defaultParams);
  const [showGrid, setShowGrid] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [liveStats, setLiveStats] = useState({
    comX: 0, comY: 0, totalMass: 0, comVx: 0, comVy: 0, collisions: 0, fps: 60
  });
  const [isRunning, setIsRunning] = useState(true);
  const lastFpsRef = useRef({ time: 0, frames: 0, fps: 60 });

  // Init / reset
  const reset = useCallback((p = paramsLive) => {
    stateRef.current = {
      bodies: initBodies(p),
      time: 0,
      comTrail: [],
      collisions: 0,
    };
  }, [paramsLive]);

  // Param sliders
  const updateParam = (key: keyof typeof defaultParams, val: number) => {
    const next = { ...paramsLive, [key]: val };
    setParamsLive(next);
    setParams(next);
    // Update radii and speeds if mass/speed changed
    stateRef.current.bodies = stateRef.current.bodies.map((b, i) => {
      const masses = [next.mass1, next.mass2, next.mass3, next.mass4];
      return { ...b, mass: masses[i] ?? b.mass, radius: bodyRadius(masses[i] ?? b.mass) };
    });
  };

  // Physics step
  const stepPhysics = useCallback((dt: number) => {
    const s = stateRef.current;
    const bodies = s.bodies;
    const G = paramsLive.gravity;
    const e = paramsLive.elasticity;
    const spd = paramsLive.speed;

    // Record previous COM for velocity estimation
    const prevCOM = computeCOM(bodies);

    // Gravity between bodies
    if (G > 0) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const dx = bodies[j].x - bodies[i].x;
          const dy = bodies[j].y - bodies[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const force = (G * bodies[i].mass * bodies[j].mass) / (dist * dist);
          const fx = (force * dx) / dist;
          const fy = (force * dy) / dist;
          bodies[i].vx += (fx / bodies[i].mass) * dt * spd;
          bodies[i].vy += (fy / bodies[i].mass) * dt * spd;
          bodies[j].vx -= (fx / bodies[j].mass) * dt * spd;
          bodies[j].vy -= (fy / bodies[j].mass) * dt * spd;
        }
      }
    }

    // Move bodies
    bodies.forEach((b) => {
      b.x += b.vx * dt * spd * 60;
      b.y += b.vy * dt * spd * 60;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > TRAIL_LEN) b.trail.shift();
    });

    // Wall collisions
    bodies.forEach((b) => {
      if (b.x - b.radius < 0) { b.x = b.radius; b.vx = Math.abs(b.vx) * e; }
      if (b.x + b.radius > CANVAS_W) { b.x = CANVAS_W - b.radius; b.vx = -Math.abs(b.vx) * e; }
      if (b.y - b.radius < 0) { b.y = b.radius; b.vy = Math.abs(b.vy) * e; }
      if (b.y + b.radius > CANVAS_H) { b.y = CANVAS_H - b.radius; b.vy = -Math.abs(b.vy) * e; }
    });

    // Body-body collisions
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const bi = bodies[i], bj = bodies[j];
        const dx = bj.x - bi.x;
        const dy = bj.y - bi.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = bi.radius + bj.radius;
        if (dist < minDist && dist > 0.01) {
          // Separate
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          bi.x -= nx * overlap; bi.y -= ny * overlap;
          bj.x += nx * overlap; bj.y += ny * overlap;

          // Elastic collision
          const relVx = bi.vx - bj.vx, relVy = bi.vy - bj.vy;
          const dot = relVx * nx + relVy * ny;
          if (dot > 0) {
            const impulse = (2 * dot) / (bi.mass + bj.mass) * e;
            bi.vx -= impulse * bj.mass * nx;
            bi.vy -= impulse * bj.mass * ny;
            bj.vx += impulse * bi.mass * nx;
            bj.vy += impulse * bi.mass * ny;
            s.collisions++;
          }
        }
      }
    }

    // COM trail
    const com = computeCOM(bodies);
    s.comTrail.push({ x: com.cx, y: com.cy });
    if (s.comTrail.length > COM_TRAIL_LEN) s.comTrail.shift();

    // COM velocity
    const comVx = (com.cx - prevCOM.cx) / (dt || 0.016) / 60;
    const comVy = (com.cy - prevCOM.cy) / (dt || 0.016) / 60;

    s.time += dt;
    return { ...com, comVx, comVy };
  }, [paramsLive]);

  // Animation loop
  useEffect(() => {
    reset(paramsLive);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let lastTime = 0;
    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop);
      const dt = Math.min((t - lastTime) / 1000, 0.05);
      lastTime = t;

      // FPS
      const fps = lastFpsRef.current;
      fps.frames++;
      if (t - fps.time > 500) {
        fps.fps = Math.round((fps.frames * 1000) / (t - fps.time));
        fps.frames = 0;
        fps.time = t;
      }

      if (runningRef.current) {
        const com = stepPhysics(dt);
        setLiveStats({
          comX: +com.cx.toFixed(1),
          comY: +com.cy.toFixed(1),
          totalMass: +com.totalMass.toFixed(2),
          comVx: +com.comVx.toFixed(2),
          comVy: +com.comVy.toFixed(2),
          collisions: stateRef.current.collisions,
          fps: fps.fps,
        });
      }

      drawScene(ctx, stateRef.current, showGrid, showTrails, showVectors);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [paramsLive.numBodies, showGrid, showTrails, showVectors]);

  // Toggle running
  const toggleRun = () => {
    runningRef.current = !runningRef.current;
    setIsRunning(runningRef.current);
  };

  const handleReset = () => {
    const p = defaultParams;
    setParams(p);
    setParamsLive(p);
    setTimeout(() => reset(p), 10);
  };

  // Sliders config
  const sliders = [
    { key: "mass1", label: "Mass 1 (m₁)", min: 0.5, max: 10, step: 0.1, unit: "kg", icon: "🔵" },
    { key: "mass2", label: "Mass 2 (m₂)", min: 0.5, max: 10, step: 0.1, unit: "kg", icon: "🔴" },
    { key: "mass3", label: "Mass 3 (m₃)", min: 0.5, max: 10, step: 0.1, unit: "kg", icon: "🟢", show: paramsLive.numBodies >= 3 },
    { key: "mass4", label: "Mass 4 (m₄)", min: 0.5, max: 10, step: 0.1, unit: "kg", icon: "🟡", show: paramsLive.numBodies >= 4 },
    { key: "numBodies", label: "# of Bodies", min: 2, max: 4, step: 1, unit: "", icon: "🔢" },
    { key: "gravity", label: "Gravity (G)", min: 0, max: 5, step: 0.1, unit: "×", icon: "🌍" },
    { key: "elasticity", label: "Elasticity", min: 0.1, max: 1, step: 0.05, unit: "", icon: "⚡" },
    { key: "speed", label: "Speed ×", min: 0.2, max: 3, step: 0.1, unit: "×", icon: "🚀" },
  ] as const;

  const masses = [paramsLive.mass1, paramsLive.mass2, paramsLive.mass3, paramsLive.mass4];
  const n = paramsLive.numBodies;
  const totalM = masses.slice(0, n).reduce((a, b) => a + b, 0);
  const xCOM_formula = masses.slice(0, n).map((m, i) => `${m}×x${i + 1}`).join(" + ");

  return (
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Top Row: Simulation Canvas (2 columns) */}
          <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-neutral-400 flex items-center gap-4">
                <span>Center of Mass Simulation</span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300">
                  ⚡ {liveStats.fps} FPS
                </span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300">
                  💥 {liveStats.collisions} collisions
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 mr-2">
                  <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="accent-cyan-500" /> Grid
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 mr-2">
                  <input type="checkbox" checked={showTrails} onChange={e => setShowTrails(e.target.checked)} className="accent-cyan-500" /> Trails
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 mr-4">
                  <input type="checkbox" checked={showVectors} onChange={e => setShowVectors(e.target.checked)} className="accent-cyan-500" /> Vectors
                </label>

                <button
                  type="button"
                  onClick={toggleRun}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {isRunning ? "⏸ Pause" : "▶ Play"}
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

            <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0A0F1E] aspect-video">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="w-full h-full block"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>

          {/* Controls Panel (1 column) */}
          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Parameters</h3>
              <div className="flex flex-col gap-3">
                {sliders.map((s, idx) => {
                  if ("show" in s && s.show === false) return null;
                  const val = paramsLive[s.key as keyof typeof paramsLive] as number;
                  // Map specific colors from our preset
                  const sliderColor = s.key.includes('mass') ? COLORS[idx % 4] : "#38bdf8";
                  return (
                    <SliderRow
                      key={s.key}
                      label={`${s.icon} ${s.label}`}
                      value={val}
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      unit={s.unit}
                      color={sliderColor}
                      onChange={(v) => updateParam(s.key as keyof typeof defaultParams, v)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Live Stats */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-400 mb-2">📊 LIVE COM DATA</div>
              {[
                ["COM x", liveStats.comX.toFixed(1) + " px"],
                ["COM y", liveStats.comY.toFixed(1) + " px"],
                ["Total Mass", liveStats.totalMass.toFixed(2) + " kg"],
                ["v_com x", liveStats.comVx.toFixed(3)],
                ["v_com y", liveStats.comVy.toFixed(3)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-1 border-b border-emerald-500/10 last:border-0">
                  <span className="text-xs text-neutral-400">{k}</span>
                  <span className="text-[13px] text-yellow-300 font-mono font-bold">{v}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
              <div className="font-bold text-amber-400 mb-2">💡 TRY THIS!</div>
              <ul className="text-xs space-y-2 list-disc pl-4 text-amber-100/80">
                <li><strong>Max COM motion:</strong> Set masses very different (m₁=10, m₂=0.5) — watch COM hug the heavy body!</li>
                <li><strong>4 Bodies:</strong> Set bodies=4, gravity=2 for orbital chaos!</li>
                <li><strong>Gravity:</strong> Set G=3 and watch bodies attract — COM stays fixed!</li>
              </ul>
            </div>
          </aside>
          </div>
        </div>

          {/* Bottom Row: Info Panel (Full width, 3 cols) */}
          <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Left: Theory */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-cyan-400 mb-3">✨ CENTER OF MASS — THEORY</h4>
                <p className="text-sm mb-3">
                  The <strong className="text-cyan-300">center of mass (COM)</strong> is the unique point where the weighted average position of all mass in a system lies. It moves as though all mass and all external forces were concentrated there.
                </p>
                <p className="text-sm mb-3">
                  In an <strong className="text-cyan-300">isolated system</strong> (no external forces), the COM moves at constant velocity — even when internal forces cause individual bodies to accelerate, collide, or orbit each other.
                </p>
                <p className="text-sm">
                  This follows directly from Newton's 3rd Law: internal forces cancel in pairs, so <strong className="text-yellow-400">M·a_com = F_external</strong>.
                </p>
              </div>

              {/* Middle: Key Formulas */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-cyan-400 mb-3">📐 KEY FORMULAS</h4>
                <div className="space-y-4">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                    <div className="text-xs font-bold text-yellow-400 mb-1">Position of COM</div>
                    <div className="text-sm font-mono text-neutral-200">x_com = (Σ mᵢxᵢ) / M</div>
                    <div className="text-sm font-mono text-neutral-200">y_com = (Σ mᵢyᵢ) / M</div>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                    <div className="text-xs font-bold text-yellow-400 mb-1">Velocity of COM</div>
                    <div className="text-sm font-mono text-neutral-200">v_com = (Σ mᵢvᵢ) / M</div>
                    <div className="text-sm font-mono text-neutral-200">p_total = M·v_com</div>
                  </div>
                </div>
              </div>

              {/* Right: Calculation & Key Facts */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-cyan-400 mb-3">🔢 LIVE CALCULATION</h4>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono space-y-1 mb-4">
                  <div className="text-xs text-neutral-400 truncate">x_com = ({xCOM_formula}) / {totalM.toFixed(2)}</div>
                  <div className="text-sm text-emerald-400 font-bold">→ x_com ≈ {liveStats.comX} px</div>
                  <div className="text-sm text-emerald-400 font-bold">→ y_com ≈ {liveStats.comY} px</div>
                  <div className="text-xs text-yellow-400 font-bold mt-2 pt-2 border-t border-neutral-800">M_total = {totalM.toFixed(2)} kg</div>
                </div>

                <h5 className="text-xs font-bold text-emerald-400 mb-2">🏆 Key Principles</h5>
                <ul className="text-xs text-neutral-400 space-y-1.5 list-disc pl-4">
                  <li>COM of isolated system moves at constant velocity</li>
                  <li>Internal forces (collisions) cannot shift COM</li>
                  <li>Heavier bodies attract COM towards them</li>
                  <li>Total momentum = M × v_com (conserved)</li>
                </ul>
              </div>

            </div>
          </div>
        </section>
    </main>
  );
}