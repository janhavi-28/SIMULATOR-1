"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, Atom, Orbit, Zap,
  Microscope, HelpCircle, Scale, CheckCircle2,
  ChevronRight, Info, Activity, Maximize2,
  Settings, Lightbulb, LineChart
} from 'lucide-react';

/**
 * ==========================================
 * ACCURATE FUNDAMENTAL FORCES SIMULATOR
 * ==========================================
 * Replicated UI based on user-provided reference.
 */

// --- Types ---
type ScaleZone = 'nuclear' | 'atomic' | 'planetary';

interface Particle {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  type: string;
  orbitRadius?: number;
  angle?: number;
  angularSpeed?: number;
}

const FORCES = [
  { id: 'strong', name: 'Strong Nuclear', color: '#ef4444', textColor: 'text-red-600' },
  { id: 'em', name: 'Electromagnetic', color: '#3b82f6', textColor: 'text-blue-600' },
  { id: 'weak', name: 'Weak Nuclear', color: '#22c55e', textColor: 'text-green-600' },
  { id: 'gravity', name: 'Gravitational', color: '#a855f7', textColor: 'text-purple-600' }
];

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
  unit: string | React.ReactNode;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">{label}</span>
        <span className="text-sm text-neutral-400 tabular-nums">
          {unit}
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

export default function FundamentalForcesSimulation() {
  // --- State ---
  const [scale, setScale] = useState<number>(-10);
  const [speed, setSpeed] = useState<number>(1);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // --- Derived Calculations ---
  const currentZone: ScaleZone = useMemo(() => {
    if (scale <= -13) return 'nuclear';
    if (scale >= 5) return 'planetary';
    return 'atomic';
  }, [scale]);

  const forceWeights = useMemo(() => {
    const gaussian = (x: number, mean: number, sigma: number) => Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
    const s = gaussian(scale, -15, 1.2) * 100;
    const em = gaussian(scale, -10, 3.5) * 60;
    const w = gaussian(scale, -14.5, 1.5) * 30;
    const g = scale > -2 ? Math.min(100, (scale + 2) * 10) : 10;

    // Normalize roughly to look like image
    return { strong: s, em, weak: w, gravity: g };
  }, [scale]);

  const activeMetadata = useMemo(() => {
    switch (currentZone) {
      case 'nuclear':
        return {
          title: "Nuclear Scale",
          icon: <Atom className="text-red-500" size={24} />,
          desc: "Strong Nuclear force dominates at this scale to bind quarks and hold the nucleus together. It is very short-ranged but powerful.",
          formula: "F_s \\approx g_s \\cdot e^{-r/R}",
          strength: "1.0",
          range: "~10⁻¹⁵ m"
        };
      case 'atomic':
        return {
          title: "Atomic Scale",
          icon: <Zap className="text-blue-500" size={24} />,
          desc: "Electromagnetic force dominates as electrons orbit the nucleus. The formula describes the attraction between opposite charges.",
          formula: "F = k \\frac{(q_1 q_2)}{r^2}",
          strength: "0.01",
          range: "Infinite"
        };
      case 'planetary':
      default:
        return {
          title: "Planetary Scale",
          icon: <Orbit className="text-purple-500" size={24} />,
          desc: "Gravitational force dominates at high masses. Despite being the weakest force, it is infinite in range and always attractive.",
          formula: "F = G \\frac{(M_1 M_2)}{r^2}",
          strength: "10⁻³⁸",
          range: "Infinite"
        };
    }
  }, [currentZone]);

  // --- Animation Logic ---
  const initParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    if (currentZone === 'nuclear') {
      const colors = ['#ef4444', '#3b82f6', '#f59e0b'];
      for (let i = 0; i < 3; i++) {
        newParticles.push({
          id: i, type: 'quark', x: 0, y: 0, radius: 12,
          color: colors[i], glowColor: colors[i],
          angle: (i * Math.PI * 2) / 3, orbitRadius: 35
        });
      }
    } else if (currentZone === 'atomic') {
      newParticles.push({ id: 0, type: 'nucleus', x: 0, y: 0, radius: 20, color: '#ef4444', glowColor: '#fca5a5' });
      for (let i = 1; i <= 4; i++) {
        newParticles.push({
          id: i, type: 'electron', x: 0, y: 0, radius: 6,
          color: '#3b82f6', glowColor: '#93c5fd',
          orbitRadius: 80 + i * 30, angle: Math.random() * Math.PI * 2, angularSpeed: 0.02 - i * 0.003
        });
      }
    } else {
      newParticles.push({ id: 0, type: 'star', x: 0, y: 0, radius: 30, color: '#fbbf24', glowColor: '#fde68a' });
      const colors = ['#a855f7', '#6366f1', '#ec4899'];
      for (let i = 1; i <= 3; i++) {
        newParticles.push({
          id: i, type: 'planet', x: 0, y: 0, radius: 8 + i * 2,
          color: colors[i - 1], glowColor: colors[i - 1],
          orbitRadius: 100 + i * 50, angle: Math.random() * Math.PI * 2, angularSpeed: 0.01 - i * 0.002
        });
      }
    }
    particlesRef.current = newParticles;
  }, [currentZone]);

  useEffect(() => { initParticles(); }, [initParticles]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // 1. Clear & Background Grid
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < ctx.canvas.width; x += 30) { ctx.moveTo(x, 0); ctx.lineTo(x, ctx.canvas.height); }
    for (let y = 0; y < ctx.canvas.height; y += 30) { ctx.moveTo(0, y); ctx.lineTo(ctx.canvas.width, y); }
    ctx.stroke();

    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;

    // 2. Render Particles
    particlesRef.current.forEach(p => {
      if (isPlaying) {
        if (p.type === 'quark') {
          const jitter = Math.sin(timeRef.current * 0.1) * 2;
          p.angle! += 0.05 * speed;
          p.x = Math.cos(p.angle!) * (p.orbitRadius! + jitter);
          p.y = Math.sin(p.angle!) * (p.orbitRadius! + jitter);
        } else if (p.orbitRadius && p.angle !== undefined) {
          p.angle += p.angularSpeed! * speed;
          p.x = Math.cos(p.angle) * p.orbitRadius;
          p.y = Math.sin(p.angle) * p.orbitRadius;
        }
      }

      const x = cx + p.x;
      const y = cy + p.y;

      // Draw Orbit Path
      if (p.orbitRadius && p.type !== 'quark') {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, p.orbitRadius, p.orbitRadius * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Force Vector
      if (showVectors && p.orbitRadius) {
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const forceX = (dx / dist) * 40;
        const forceY = (dy / dist) * 40;

        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + forceX, y + forceY);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(forceY, forceX);
        ctx.beginPath();
        ctx.moveTo(x + forceX, y + forceY);
        ctx.lineTo(x + forceX - 8 * Math.cos(angle - Math.PI / 6), y + forceY - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x + forceX - 8 * Math.cos(angle + Math.PI / 6), y + forceY - 8 * Math.sin(angle + Math.PI / 6));
        ctx.fill();
      }

      // Draw Particle
      // Glow
      const grad = ctx.createRadialGradient(x, y, 0, x, y, p.radius * 3);
      grad.addColorStop(0, p.glowColor);
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, p.radius * 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;

      // Body
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(x, y, p.radius, 0, Math.PI * 2); ctx.fill();

      // Symbol for electron/quark
      if (p.type === 'electron' || p.type === 'quark') {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('-', x, y);
      }
    });

    if (isPlaying) timeRef.current += 1;
  }, [isPlaying, speed, showVectors]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    draw(ctx);
    requestRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

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
                <span>Fundamental Forces Simulation</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${!isPlaying ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  type="button"
                  onClick={() => { setScale(-10); setSpeed(1); setShowVectors(true); }}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0A0F1E] aspect-video group">
              <canvas ref={canvasRef} className="w-full h-full block object-cover" />

              {/* Top-Left Badge */}
              <div className="absolute top-4 left-4 bg-neutral-900/80 backdrop-blur border border-neutral-700 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
                <Atom className="text-cyan-400" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Dominant:</span>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-tighter">{currentZone}</span>
              </div>

              {/* Bottom-Left Panel (Force Strengths) */}
              <div className="absolute bottom-4 left-4 w-64 bg-neutral-950/90 border border-neutral-800 p-4 rounded-2xl shadow-lg">
                <h3 className="text-xs font-bold text-neutral-400 mb-4 px-1">Force Strength (Relative)</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Strong Nuclear', val: forceWeights.strong, from: 'from-red-500/50', to: 'to-red-500' },
                    { label: 'Electromagnetic', val: forceWeights.em, from: 'from-blue-500/50', to: 'to-blue-500' },
                    { label: 'Weak Nuclear', val: forceWeights.weak, from: 'from-green-500/50', to: 'to-green-500' },
                    { label: 'Gravitational', val: forceWeights.gravity, from: 'from-purple-500/50', to: 'to-purple-500' },
                  ].map(f => (
                    <div key={f.label} className="w-full h-7 bg-neutral-900 rounded-lg overflow-hidden relative border border-neutral-800">
                      <div className={`h-full bg-gradient-to-r ${f.from} ${f.to} transition-all duration-500 ease-out`} style={{ width: `${f.val}%` }} />
                      <div className="absolute inset-0 flex justify-between items-center px-3">
                        <span className="text-[9px] font-bold text-white drop-shadow-sm">{f.label}</span>
                        <span className="text-[9px] font-mono text-neutral-300">{f.val.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Panel (1 column) */}
          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Controls</h3>
              <div className="flex flex-col gap-5">
                <SliderRow
                  label="🔭 Universal Scale (Zoom)"
                  value={scale} min={-18} max={15} step={0.1}
                  unit={<span>10<sup className="ml-0.5">{scale.toFixed(0)}</sup> m</span>}
                  color="#38bdf8"
                  onChange={(v) => setScale(v)}
                />

                <div className="flex justify-between text-[10px] font-bold text-neutral-500 px-2 mt-[-10px]">
                  <span>Nuclear</span>
                  <span>Atomic</span>
                  <span>Planetary</span>
                </div>

                <SliderRow
                  label="⏱ Simulation Speed"
                  value={speed} min={0} max={3} step={0.1}
                  unit={`${speed.toFixed(1)}x`}
                  color="#a855f7"
                  onChange={(v) => setSpeed(v)}
                />

                <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 shadow-sm">
                  <span className="text-sm font-medium text-neutral-200">Show Force Vectors</span>
                  <button
                    onClick={() => setShowVectors(!showVectors)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${showVectors ? 'bg-cyan-500' : 'bg-neutral-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${showVectors ? 'left-1 translate-x-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-800">
                <LineChart className="text-cyan-400" size={16} />
                <h3 className="text-sm font-bold text-white">Live Data</h3>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-500 uppercase">Scale:</span>
                <span className="font-mono text-cyan-400 font-bold">10<sup className="ml-0.5">{scale.toFixed(0)}</sup> m</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-500 uppercase">Relative Strength:</span>
                <span className="font-mono text-purple-400 font-bold">{activeMetadata.strength}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-500 uppercase">Force Range:</span>
                <span className="font-mono text-emerald-400 font-bold">{activeMetadata.range}</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                <Lightbulb size={16} /> Try This!
              </div>
              <p className="text-amber-100/80 text-xs leading-relaxed">
                Drag the zoom slider from Nuclear to Planetary scales. Watch how vectors flip from subatomic bonds to gravitational pulls, and note the strength changes!
              </p>
            </div>
          </aside>
          </div>
        </div>

          {/* Bottom Row: Info Panel */}
          <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  {activeMetadata.icon}
                  <h3 className="text-lg font-bold text-white">{activeMetadata.title}</h3>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed mb-4">
                  {activeMetadata.desc}
                </p>
              </div>

              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5 h-full flex flex-col justify-center items-center">
                <h4 className="text-sm font-bold text-purple-400 mb-4 w-full text-left">📐 EQUATION</h4>
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 italic text-sm font-serif text-neutral-300 w-full text-center">
                  {currentZone === 'atomic' && <span>F = k (q<sub>1</sub>q<sub>2</sub>) / r²</span>}
                  {currentZone === 'nuclear' && <span>F<sub>s</sub> ∝ e<sup>-r</sup> / r²</span>}
                  {currentZone === 'planetary' && <span>F = G (m<sub>1</sub>m<sub>2</sub>) / r²</span>}
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
