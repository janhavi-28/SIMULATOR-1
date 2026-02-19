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
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = '#e2e8f0';
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
        ctx.strokeStyle = '#cbd5e1';
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
    <div className="flex flex-col w-full h-full bg-[#f1f5f9] p-6 font-sans antialiased text-slate-800">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Fundamental Forces of Nature Simulator</h1>
      </div>

      {/* Main Grid: Top Section (Canvas + Controls) */}
      <div className="grid grid-cols-12 gap-6 h-[500px] mb-6">
        {/* Left: Simulation Canvas (8 columns) */}
        <div className="col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Top-Left Badge */}
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur border border-slate-100 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
            <Atom className="text-blue-500" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dominant:</span>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter">{currentZone}</span>
          </div>

          {/* Bottom-Left Panel (Force Strengths) */}
          <div className="absolute bottom-4 left-4 w-64 bg-white/95 border border-slate-100 p-4 rounded-2xl shadow-lg">
            <h3 className="text-xs font-bold text-slate-600 mb-4 px-1">Force Strength (Relative)</h3>
            <div className="space-y-3">
              {[
                { label: 'Strong Nuclear', val: forceWeights.strong, color: 'bg-red-500' },
                { label: 'Electromagnetic', val: forceWeights.em, color: 'bg-blue-500' },
                { label: 'Weak Nuclear', val: forceWeights.weak, color: 'bg-green-500' },
                { label: 'Gravitational', val: forceWeights.gravity, color: 'bg-purple-500' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-full h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div className={`h-full ${f.color} transition-all duration-500 ease-out`} style={{ width: `${f.val}%` }} />
                    <div className="absolute inset-0 flex justify-between items-center px-3">
                      <span className="text-[9px] font-bold text-white drop-shadow-sm">{f.label}</span>
                      <span className="text-[9px] font-mono text-slate-400">{f.val.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Controls Panel (4 columns) */}
        <div className="col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-[#0ea5e9] to-[#06b6d4] px-6 py-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Settings size={18} /> Controls
            </h2>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6">
            {/* Scale Slider */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex justify-between mb-3">
                <span className="text-xs font-bold text-slate-700">Universal Scale (Zoom)</span>
                <span className="text-xs font-mono text-slate-400 px-2 py-0.5 bg-white border border-slate-200 rounded">10<sup>{scale.toFixed(0)}</sup> m</span>
              </div>
              <input
                type="range" min="-18" max="15" step="0.1" value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400">
                <span>Nuclear</span>
                <span>Atomic</span>
                <span>Planetary</span>
              </div>
            </div>

            {/* Speed Slider */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Simulation Speed</label>
              <input
                type="range" min="0" max="3" step="0.1" value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-bold text-slate-700">Show Force Vectors</span>
              <button
                onClick={() => setShowVectors(!showVectors)}
                className={`w-12 h-6 rounded-full transition-colors relative ${showVectors ? 'bg-blue-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showVectors ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {/* Play/Pause Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {isPlaying ? <Pause size={20} className="text-slate-700" fill="currentColor" /> : <Play size={20} className="text-slate-700" fill="currentColor" />}
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                Play/Pause
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => { setScale(-10); setSpeed(1); setShowVectors(true); }}
              className="w-full py-4 bg-[#0e7490] text-white font-bold rounded-xl shadow-inner hover:bg-[#0891b2] transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Info Cards (Three columns) */}
      <div className="grid grid-cols-3 gap-6">
        {/* 1. Scale Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            {activeMetadata.icon}
            <h3 className="text-lg font-bold text-slate-900">{activeMetadata.title}</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed min-h-[40px] mb-4">
            {activeMetadata.desc}
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-center italic text-sm font-serif text-slate-800">
            {currentZone === 'atomic' && <span>F = k (q<sub>1</sub>q<sub>2</sub>) / r²</span>}
            {currentZone === 'nuclear' && <span>F<sub>s</sub> ∝ e<sup>-r</sup> / r²</span>}
            {currentZone === 'planetary' && <span>F = G (m<sub>1</sub>m<sub>2</sub>) / r²</span>}
          </div>
        </div>

        {/* 2. Live Physics Data */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <LineChart className="text-blue-500" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Live Physics Data</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest">Current Scale:</span>
              <span className="font-mono text-slate-900 font-bold">10<sup>{scale.toFixed(0)}</sup> m</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest">Relative Strength:</span>
              <span className="font-mono text-slate-900 font-bold">{activeMetadata.strength}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest">Force Range:</span>
              <span className="font-mono text-slate-900 font-bold">{activeMetadata.range}</span>
            </div>
          </div>
        </div>

        {/* 3. Try This! */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="text-yellow-500" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Try This!</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Drag the slider from Nuclear to Planetary scales. Watch how vectors flip from subatomic bonds to gravitational pulls, and note the strength changes!
          </p>
        </div>
      </div>
    </div>
  );
}
