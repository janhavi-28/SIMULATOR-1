"use client"
import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────
const G = 6.674e-11, M_EARTH = 5.972e24, R_EARTH = 6.371e6;
const SIM_DT = 40; // physics seconds per frame

function vEsc(m: number, r: number) { return Math.sqrt(2 * G * m / r); }
function vOrb(m: number, r: number) { return Math.sqrt(G * m / r); }

interface V2 { x: number; y: number }
interface Rocket {
  pos: V2; vel: V2; trail: V2[];
  launchMass: number; launchRadius: number; // FIXED: store at launch time
  escaped: boolean; crashed: boolean; active: boolean;
}
interface Params { speed: number; angle: number; mass: number; radius: number }
const DEFAULTS: Params = { speed: 8, angle: 45, mass: 1, radius: 1 };

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

// ── Rocket drawing ──────────────────────────────────────────────────────────
function drawRocket(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, thrust: boolean) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(7, 6); ctx.lineTo(-7, 6); ctx.closePath();
  ctx.fillStyle = "#fff"; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -20, 5.5, 0, Math.PI * 2); ctx.fillStyle = "#f87171"; ctx.fill();
  ctx.fillStyle = "#818cf8";
  [[-7, 6, -15, 16, -4, 9], [7, 6, 15, 16, 4, 9]].forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill();
  });
  if (thrust) {
    const fl = ctx.createLinearGradient(0, 6, 0, 34 + Math.random() * 8);
    fl.addColorStop(0, "rgba(251,191,36,1)"); fl.addColorStop(0.5, "rgba(249,115,22,0.75)"); fl.addColorStop(1, "rgba(239,68,68,0)");
    ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(0, 34 + Math.random() * 7); ctx.lineTo(5, 6); ctx.closePath();
    ctx.fillStyle = fl; ctx.fill();
  }
  ctx.restore();
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function EscapeVelocitySim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rocketRef = useRef<Rocket | null>(null);
  const pulseRef = useRef(0);
  const lastRef = useRef(0);

  const [target, setTarget] = useState<Params>({ ...DEFAULTS });
  const [smooth, setSmooth] = useState<Params>({ ...DEFAULTS });
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState({ speed: 0, alt: 0, status: "Ready", fps: 60 });

  // Smooth lerp for visual only
  useEffect(() => {
    const id = setInterval(() => setSmooth(p => ({
      speed: p.speed + (target.speed - p.speed) * 0.18,
      angle: p.angle + (target.angle - p.angle) * 0.18,
      mass: p.mass + (target.mass - p.mass) * 0.18,
      radius: p.radius + (target.radius - p.radius) * 0.18,
    })), 16);
    return () => clearInterval(id);
  }, [target]);

  const launch = useCallback(() => {
    const mass = target.mass * M_EARTH;
    const radius = target.radius * R_EARTH;
    const spd = target.speed * 1000;
    const ang = (target.angle * Math.PI) / 180;
    rocketRef.current = {
      pos: { x: 0, y: -(radius + 150000) },
      vel: { x: spd * Math.cos(ang), y: -spd * Math.sin(ang) },
      trail: [],
      launchMass: mass,     // physics uses these — never changes mid-flight
      launchRadius: radius,
      escaped: false, crashed: false, active: true,
    };
    setRunning(true);
  }, [target]);

  const reset = () => {
    setTarget({ ...DEFAULTS }); setRunning(false);
    rocketRef.current = null;
    setLive({ speed: 0, alt: 0, status: "Ready", fps: 60 });
  };

  // ── Render loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let fc = 0, ft = performance.now(), fps = 60;

    const draw = (now: number) => {
      animRef.current = requestAnimationFrame(draw);
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now; pulseRef.current += dt;
      fc++; if (now - ft > 700) { fps = Math.round(fc * 1000 / (now - ft)); fc = 0; ft = now; }

      const W = canvas.width, H = canvas.height;
      const cx = W * 0.38, cy = H * 0.60;

      // Use smooth for visuals, smooth.mass/radius for display
      const dispMass = smooth.mass * M_EARTH;
      const dispRadius = smooth.radius * R_EARTH;
      const pxR = Math.max(38, Math.min(108, dispRadius / 200000));

      // ── Physics step (uses launchMass/launchRadius fixed at launch) ───────
      const rocket = rocketRef.current;
      if (rocket && rocket.active && running) {
        const { launchMass: lm, launchRadius: lr } = rocket;
        const r2 = rocket.pos.x ** 2 + rocket.pos.y ** 2;
        const r = Math.sqrt(r2);
        const gm = G * lm / r2;
        rocket.vel.x += -gm * (rocket.pos.x / r) * SIM_DT;
        rocket.vel.y += -gm * (rocket.pos.y / r) * SIM_DT;
        rocket.pos.x += rocket.vel.x * SIM_DT;
        rocket.pos.y += rocket.vel.y * SIM_DT;

        const rNow = Math.sqrt(rocket.pos.x ** 2 + rocket.pos.y ** 2);
        const spd = Math.sqrt(rocket.vel.x ** 2 + rocket.vel.y ** 2);

        const sx = cx + rocket.pos.x / 200000;
        const sy = cy + rocket.pos.y / 200000;
        rocket.trail.push({ x: sx, y: sy });
        if (rocket.trail.length > 300) rocket.trail.shift();

        if (rNow > 44 * lr) { rocket.escaped = true; rocket.active = false; setRunning(false); }
        if (rNow < lr) { rocket.crashed = true; rocket.active = false; setRunning(false); }

        setLive({
          speed: spd / 1000,
          alt: Math.max(0, (rNow - lr) / 1000),
          status: rocket.escaped ? "✅ Escaped!" : rocket.crashed ? "💥 Crashed" : spd >= vEsc(lm, lr) ? "🚀 Escaping…" : "🌍 Bound",
          fps,
        });
      } else { setLive(l => ({ ...l, fps })); }

      // ── Background ─────────────────────────────────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#3b0764"); bg.addColorStop(0.5, "#7e22ce"); bg.addColorStop(1, "#9d174d");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.055)"; ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 52) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 52) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // Stars
      [[80, 42], [162, 23], [265, 59], [385, 29], [514, 53], [645, 19], [778, 44], [905, 37],
      [32, 96], [197, 109], [323, 83], [462, 99], [572, 89], [713, 113], [838, 79], [952, 103],
      [57, 157], [207, 149], [352, 169], [492, 143], [602, 163], [742, 153], [852, 169], [962, 141]
      ].forEach(([sx, sy], i) => {
        const tw = 0.4 + 0.6 * Math.sin(pulseRef.current * 1.3 + i * 1.7);
        ctx.globalAlpha = 0.15 + 0.5 * tw;
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx, sy, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Grav rings
      for (let i = 6; i >= 1; i--) {
        const rr = pxR * (1.25 + i * 0.55), a = (7 - i) * 0.015;
        ctx.strokeStyle = `rgba(216,180,254,${a})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      }

      // Escape ring
      const escR = pxR * 1.65, p2 = 0.65 + 0.35 * Math.sin(pulseRef.current * 2.2);
      ctx.save();
      ctx.shadowColor = "rgba(251,191,36,0.5)"; ctx.shadowBlur = 10;
      ctx.setLineDash([8, 10]);
      ctx.strokeStyle = `rgba(251,191,36,${0.65 * p2})`; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(cx, cy, escR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      ctx.save();
      ctx.font = "bold 10px 'Segoe UI',sans-serif"; ctx.fillStyle = "rgba(251,191,36,0.85)";
      ctx.fillText("⚡ Escape Threshold", cx + escR + 7, cy - 5); ctx.restore();

      // Atmosphere
      const atm = ctx.createRadialGradient(cx, cy, pxR * 0.75, cx, cy, pxR * 1.5);
      atm.addColorStop(0, "rgba(96,165,250,0.28)"); atm.addColorStop(0.6, "rgba(96,165,250,0.07)"); atm.addColorStop(1, "rgba(96,165,250,0)");
      ctx.beginPath(); ctx.arc(cx, cy, pxR * 1.5, 0, Math.PI * 2); ctx.fillStyle = atm; ctx.fill();

      // Earth body
      const eg = ctx.createRadialGradient(cx - pxR * 0.3, cy - pxR * 0.3, pxR * 0.08, cx, cy, pxR);
      eg.addColorStop(0, "#5bcfff"); eg.addColorStop(0.3, "#2196c7");
      eg.addColorStop(0.65, "#155e86"); eg.addColorStop(0.85, "#2d7a35"); eg.addColorStop(1, "#1a4820");
      ctx.beginPath(); ctx.arc(cx, cy, pxR, 0, Math.PI * 2); ctx.fillStyle = eg; ctx.fill();

      // Continents
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, pxR, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = "rgba(46,125,50,0.55)";
      [[-0.27, -0.28, 0.22, 0.26], [0.12, -0.16, 0.17, 0.21], [-0.1, 0.12, 0.19, 0.19]].forEach(([ex, ey, ew, eh]) => {
        ctx.beginPath(); ctx.ellipse(cx + pxR * ex, cy + pxR * ey, pxR * ew, pxR * eh, 0.5, 0, Math.PI * 2); ctx.fill();
      }); ctx.restore();
      ctx.strokeStyle = "rgba(147,210,255,0.55)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, pxR, 0, Math.PI * 2); ctx.stroke();

      // Planet labels
      ctx.save();
      ctx.font = "bold 11px 'Segoe UI',sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText(`M = ${smooth.mass.toFixed(2)}× M⊕`, cx + pxR + 12, cy - 10);
      ctx.fillText(`r  = ${smooth.radius.toFixed(2)}× R⊕`, cx + pxR + 12, cy + 8);
      ctx.restore();

      // Distance arrow (idle state)
      if (!rocket || (!running && !rocket.escaped && !rocket.crashed)) {
        const ay = cy + pxR + 42;
        ctx.save();
        ctx.strokeStyle = "rgba(251,191,36,0.65)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - pxR * 0.5, ay); ctx.lineTo(cx + pxR * 2.4, ay); ctx.stroke();
        [cx - pxR * 0.5, cx + pxR * 2.4].forEach((ex, i) => {
          ctx.beginPath(); ctx.moveTo(ex + (i === 0 ? -6 : 6), ay - 5); ctx.lineTo(ex, ay); ctx.lineTo(ex + (i === 0 ? -6 : 6), ay + 5); ctx.stroke();
        });
        ctx.font = "bold 10px 'Segoe UI',sans-serif"; ctx.fillStyle = "rgba(251,191,36,0.75)";
        ctx.fillText("DISTANCE FROM MASS M", cx - 10, ay + 17);
        ctx.restore();
      }

      // Trail
      if (rocket && rocket.trail.length > 2) {
        for (let i = 1; i < rocket.trail.length; i++) {
          const t = i / rocket.trail.length;
          ctx.beginPath(); ctx.moveTo(rocket.trail[i - 1].x, rocket.trail[i - 1].y);
          ctx.lineTo(rocket.trail[i].x, rocket.trail[i].y);
          ctx.strokeStyle = `rgba(${Math.round(129 + t * 126)},${Math.round(140 + t * 50)},255,${t * 0.75})`;
          ctx.lineWidth = 1.8 + t * 2.8; ctx.stroke();
        }
      }

      // Rocket idle
      if (!rocket || (!running && !rocket.escaped && !rocket.crashed)) {
        const ar = (target.angle * Math.PI) / 180;
        const rx = cx + Math.cos(ar) * (pxR + 6) * 0.5;
        const ry = cy - Math.sin(ar) * (pxR + 6) * 0.5 - pxR - 10;
        drawRocket(ctx, rx, ry, -ar - Math.PI / 2, false);
        ctx.save();
        ctx.strokeStyle = "rgba(251,191,36,0.6)"; ctx.lineWidth = 1.8; ctx.setLineDash([5, 7]);
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(ar) * 58, ry - Math.sin(ar) * 58); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
        ctx.save();
        ctx.font = "bold 11px 'Segoe UI',sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillText("ROCKET LEAVING", cx + pxR + 12, cy - pxR * 0.55 - 16);
        ctx.fillText("EARTH'S g FIELD", cx + pxR + 12, cy - pxR * 0.55);
        ctx.restore();
      } else if (rocket && !rocket.crashed) {
        const sx = cx + rocket.pos.x / 200000, sy = cy + rocket.pos.y / 200000;
        const ang = Math.atan2(rocket.vel.y, rocket.vel.x) + Math.PI / 2;
        drawRocket(ctx, sx, sy, ang, running);
        ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.lineTo(sx + rocket.vel.x * 0.000012, sy + rocket.vel.y * 0.000012); ctx.stroke();
      }

      // Banners
      if (rocket?.escaped) {
        ctx.save(); ctx.shadowColor = "#4ade80"; ctx.shadowBlur = 20;
        ctx.font = "bold 18px 'Segoe UI',sans-serif"; ctx.fillStyle = "#4ade80"; ctx.textAlign = "center";
        ctx.fillText("✅ ESCAPE VELOCITY ACHIEVED!", W / 2, 40); ctx.restore();
      }
      if (rocket?.crashed) {
        ctx.save(); ctx.shadowColor = "#f87171"; ctx.shadowBlur = 20;
        ctx.font = "bold 18px 'Segoe UI',sans-serif"; ctx.fillStyle = "#f87171"; ctx.textAlign = "center";
        ctx.fillText("💥 CRASHED — Increase Launch Speed!", W / 2, 40); ctx.restore();
      }

      // HUD
      ctx.font = "10px 'Segoe UI',sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.textAlign = "left";
      ctx.fillText(`${fps} fps`, 12, H - 10);
      const sbPx = 60;
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W - 86, H - 18); ctx.lineTo(W - 86 + sbPx, H - 18); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = "9px 'Segoe UI',sans-serif";
      ctx.fillText(`${Math.round(sbPx / 200000 * 1e6).toLocaleString()} km`, W - 86, H - 24);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [smooth, running]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const escNow = vEsc(target.mass * M_EARTH, target.radius * R_EARTH) / 1000;
  const orbNow = vOrb(target.mass * M_EARTH, target.radius * R_EARTH) / 1000;
  const ratio = target.speed / escNow;
  const willEsc = ratio >= 1;

  const tip = () => {
    if (target.speed < escNow * 0.75) return "⬆️ Increase Launch Speed above Escape Velocity to break free!";
    if (willEsc && ratio < 1.05) return "🌟 Right at escape velocity! Hit Launch to barely escape!";
    if (target.angle < 12) return "📐 Very low angle — rocket may skim surface. Try 30–75°!";
    if (target.mass > 4) return "🪐 Massive planet! You'll need much higher speed to escape.";
    return "🚀 Classic: speed = 11.2 km/s, angle = 45° for Earth escape!";
  };

  const tryCards = [
    { icon: "🎯", title: "Bare Minimum", desc: "Speed = 11.2 km/s, Angle = 45°, Mass = 1× Earth", sub: "→ Just barely escapes!", p: { speed: 11.2, angle: 45, mass: 1, radius: 1 } },
    { icon: "🪐", title: "Super Gravity", desc: "Mass = 5×, Radius = 1×, Speed = 30 km/s", sub: "→ Massive escape velocity!", p: { speed: 30, angle: 60, mass: 5, radius: 1 } },
    { icon: "💥", title: "No Escape", desc: "Speed = 5 km/s, Mass = 2×, Radius = 1×", sub: "→ Watch it crash!", p: { speed: 5, angle: 45, mass: 2, radius: 1 } },
  ];

  const rk = rocketRef.current;

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
                <span>Escape Velocity Simulation</span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300">
                  ⚡ {live.fps} FPS
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${willEsc ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                  {willEsc ? "✅ Will Escape" : "❌ Will Fall Back"}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={running ? () => setRunning(false) : launch}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {running ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0A0F1E] aspect-video">
              <canvas
                ref={canvasRef}
                width={960}
                height={520}
                className="w-full h-full block object-cover"
              />
            </div>
          </div>

          {/* Controls Panel (1 column) */}
          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Parameters</h3>
              <div className="flex flex-col gap-3">
                <SliderRow label="🚀 Launch Speed" value={target.speed} min={1} max={25} step={0.1} unit="km/s" color="#6366f1" onChange={v => setTarget(p => ({ ...p, speed: v }))} />
                <SliderRow label="📐 Launch Angle" value={target.angle} min={5} max={90} step={1} unit="°" color="#8b5cf6" onChange={v => setTarget(p => ({ ...p, angle: v }))} />
                <SliderRow label="⚖️ Planet Mass" value={target.mass} min={0.1} max={10} step={0.1} unit="× M⊕" color="#a21caf" onChange={v => setTarget(p => ({ ...p, mass: v }))} />
                <SliderRow label="⭕ Planet Radius" value={target.radius} min={0.3} max={5} step={0.1} unit="× R⊕" color="#db2777" onChange={v => setTarget(p => ({ ...p, radius: v }))} />
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
              <div className="text-xs font-bold text-violet-400">CALCULATED VALUES</div>
              <div className="flex justify-between items-center text-sm border-b border-neutral-800 pb-1">
                <span className="text-neutral-400">Escape Velocity</span>
                <span className="font-bold text-amber-500">{escNow.toFixed(2)} km/s</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-neutral-800 pb-1">
                <span className="text-neutral-400">Orbital Velocity</span>
                <span className="font-bold text-sky-500">{orbNow.toFixed(2)} km/s</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Speed / v_esc</span>
                <span className={`font-bold ${willEsc ? "text-emerald-500" : "text-red-500"}`}>{(ratio * 100).toFixed(0)}%</span>
              </div>

              {running && (
                <div className="pt-3 mt-1 border-t border-neutral-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Current Speed</span>
                    <span className="font-bold text-indigo-400">{live.speed.toFixed(2)} km/s</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Altitude</span>
                    <span className="font-bold text-violet-400">{live.alt.toFixed(0)} km</span>
                  </div>
                </div>
              )}
            </div>

            {(running || rk) && (
              <div className={`rounded-xl p-3 text-center text-sm font-bold ${rk?.escaped ? "bg-emerald-500/20 text-emerald-400" : rk?.crashed ? "bg-red-500/20 text-red-400" : "bg-violet-500/20 text-violet-400"}`}>
                {live.status}
              </div>
            )}

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
              <div className="font-bold text-amber-400 mb-2">💡 Tips</div>
              <p className="text-amber-100/80 text-xs leading-relaxed">{tip()}</p>
            </div>

            <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-3">
              <div className="font-bold text-sky-400 mb-2">💡 Try This for Drama!</div>
              {tryCards.map(({ icon, title, desc, sub, p }) => (
                <button
                  key={title}
                  onClick={() => setTarget(p)}
                  className="w-full text-left bg-neutral-900/40 hover:bg-sky-900/40 transition-colors border border-sky-500/20 rounded-lg p-2 flex flex-col gap-0.5"
                >
                  <div className="text-xs font-bold text-sky-300">{icon} {title}</div>
                  <div className="text-[10px] text-neutral-400">{desc}</div>
                  <div className="text-[10px] text-amber-500 font-semibold">{sub}</div>
                </button>
              ))}
            </div>
          </aside>
          </div>
        </div>

          {/* Bottom Row: Info Panel (Full width, 3 cols) */}
          <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Left: Concept */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-violet-400 mb-3">🌟 THE CONCEPT</h4>
                <p className="text-sm mb-3">
                  Escape velocity is the minimum speed needed to break free from a planet's gravity without further propulsion.
                  It depends only on the planet's mass and radius. At escape velocity, total mechanical energy = 0.
                </p>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                  <div className="text-xs font-bold text-violet-400 mb-1">📐 Key Formulae</div>
                  <div className="text-sm font-mono text-neutral-200">v_esc = √(2GM/r)</div>
                  <div className="text-sm font-mono text-neutral-200">KE = ½mv², PE = –GMm/r</div>
                </div>
              </div>

              {/* Middle: Live calc */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-cyan-400 mb-3">⚡ LIVE CALCULATION</h4>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono space-y-2 text-sm text-neutral-300">
                  <div className="truncate">v = {target.speed.toFixed(2)} km/s, r = {target.radius.toFixed(2)}× R⊕</div>
                  <div className="truncate">M = {target.mass.toFixed(2)}× M⊕</div>
                  <div className="mt-2 text-yellow-400">v_esc = √(2 × G × M / r)</div>
                  <div className="text-xs text-neutral-500 truncate">
                    = √(2 × 6.674e-11 × {(target.mass * M_EARTH).toExponential(2)} / {(target.radius * R_EARTH).toExponential(2)})
                  </div>
                  <div className="text-cyan-400 font-bold mt-2 pt-2 border-t border-neutral-800">
                    = {escNow.toFixed(3)} km/s ←
                  </div>
                  <div className={`mt-2 font-bold ${willEsc ? "text-emerald-500" : "text-red-500"}`}>
                    Ratio = {(ratio * 100).toFixed(1)}% {willEsc ? "✅ Escapes!" : "❌ Falls back"}
                  </div>
                </div>
              </div>

              {/* Right: Scale Context */}
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-violet-400 mb-3">📏 CONSTANTS & CONTEXT</h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-neutral-400">Gravitational Constant (G)</div>
                    <div className="text-sm font-mono text-neutral-200">6.6743 × 10⁻¹¹ N⋅m²/kg²</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Mass of Earth (M⊕)</div>
                    <div className="text-sm font-mono text-neutral-200">5.972 × 10²⁴ kg</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Radius of Earth (R⊕)</div>
                    <div className="text-sm font-mono text-neutral-200">6,371 km</div>
                  </div>
                  <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-800">
                    At exactly the escape velocity, the object will continue to slow down indefinitely but will never stop entirely, coasting out to an infinite distance.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
    </main>
  );
}