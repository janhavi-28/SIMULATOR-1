"use client";

import React, { useEffect, useRef, useState } from "react";

const PLANETS = [
  { id: "moon", name: "Moon", g: 1.62, color: "#93c5fd", glow: "rgba(147,197,253,0.5)" },
  { id: "earth", name: "Earth", g: 9.81, color: "#86efac", glow: "rgba(134,239,172,0.5)" },
  { id: "jupiter", name: "Jupiter", g: 24.79, color: "#fca5a5", glow: "rgba(252,165,165,0.6)" },
] as const;

// Ease toward target (spring-like smooth follow)
function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * Math.min(1, factor);
}

export default function MassAndWeightSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mass, setMass] = useState(10);
  const [planetId, setPlanetId] = useState<"moon" | "earth" | "jupiter">("earth");
  const [phase, setPhase] = useState(0);
  const stretchRef = useRef(0.4);
  const lastTsRef = useRef<number | null>(null);

  const planet = PLANETS.find((p) => p.id === planetId) ?? PLANETS[1];
  const weight = mass * planet.g;
  const targetStretch = 0.25 + (weight / 280) * 0.55;

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? Math.min(0.05, (ts - lastTsRef.current) / 1000) : 0.02;
      lastTsRef.current = ts;
      stretchRef.current = lerp(stretchRef.current, targetStretch, dt * 12);
      setPhase((p) => p + 0.025 * Math.sqrt(planet.g / 9.81));
    };
    raf = requestAnimationFrame((ts) => { lastTsRef.current = ts; requestAnimationFrame(tick); });
    return () => cancelAnimationFrame(raf);
  }, [targetStretch, planet.g]);

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const dpr = canvas.width / (canvas.getBoundingClientRect().width || 1);

    ctx.clearRect(0, 0, w, h);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const stretch = stretchRef.current + Math.sin(phase) * 0.02;
    const hookY = h * 0.2;
    const springTop = hookY;
    const springBottom = h * 0.48 + stretch * 90;
    const plateY = springBottom + 28;
    const springLen = springBottom - springTop;

    // Hook (foreground)
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.fillRect(cx - 24, hookY - 8, 48, 12);
    ctx.strokeStyle = "rgba(226,232,240,0.5)";
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(cx - 24, hookY - 8, 48, 12);

    // Spring with glow (weight encodes color intensity)
    const springIntensity = Math.min(1, weight / 350);
    ctx.shadowColor = planet.glow;
    ctx.shadowBlur = 8 * dpr + springIntensity * 12;
    ctx.strokeStyle = planet.color;
    ctx.lineWidth = 3.5 * dpr;
    ctx.lineCap = "round";
    ctx.beginPath();
    let y = springTop;
    const coils = 10;
    for (let i = 0; i <= coils; i++) {
      const t = i / coils;
      const sway = Math.sin(phase + t * 2) * 3 * dpr;
      const x = cx + (i % 2 === 0 ? 1 : -1) * (14 + springIntensity * 4) * dpr + sway;
      ctx.lineTo(x, y);
      y = springTop + (springBottom - springTop) * t;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Weight arrow (down) – length and thickness scale with W
    const arrowLen = 18 + (weight / 15) * 1.2;
    const arrowW = 2 + (weight / 120) * 2;
    ctx.strokeStyle = planet.color;
    ctx.fillStyle = planet.color;
    ctx.lineWidth = arrowW * dpr;
    ctx.beginPath();
    ctx.moveTo(cx, springBottom);
    ctx.lineTo(cx, springBottom + arrowLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 7, springBottom + arrowLen - 12);
    ctx.lineTo(cx, springBottom + arrowLen);
    ctx.lineTo(cx + 7, springBottom + arrowLen - 12);
    ctx.fill();
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(`W = ${weight.toFixed(1)} N`, cx, springBottom - 14);

    // Plate (fixed size = mass constant) – always same dimensions
    const plateW = 100;
    const plateH = 14;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = "#475569";
    ctx.fillRect(cx - plateW / 2, plateY - plateH / 2, plateW, plateH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(148,163,184,0.6)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.strokeRect(cx - plateW / 2, plateY - plateH / 2, plateW, plateH);

    // "m = constant" – emphasized so mass stays constant is obvious
    ctx.fillStyle = "#cbd5e1";
    ctx.font = `bold ${13 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(`m = ${mass} kg`, cx, plateY + 24);
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    ctx.fillText("(same everywhere)", cx, plateY + 40);

    // Subtle ground line
    ctx.strokeStyle = "rgba(71,85,105,0.4)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.stroke();
  }, [mass, planet, weight, phase]);

  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-neutral-900 overflow-hidden rounded-xl ring-1 ring-cyan-500/15 shadow-[0_0_24px_-4px_rgba(34,211,238,0.08)]">
      <section className="flex flex-1 min-h-0 flex-col md:flex-row bg-neutral-900/95 rounded-xl overflow-hidden">
        <div className="w-full md:w-[65%] min-w-0 md:border-r border-neutral-600/80 flex flex-col p-3 overflow-hidden">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-2 shrink-0">
            <span aria-hidden>⚖️</span>
            <span>Mass & Weight · W = mg</span>
          </h2>
          <div ref={containerRef} className="relative flex-1 min-h-0 w-full rounded-xl border border-neutral-700 bg-[#0f172a] overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        <aside className="w-full md:w-[35%] md:min-w-[220px] flex flex-col gap-4 px-4 py-4 bg-neutral-900/80 overflow-auto min-h-0 border-t md:border-t-0 md:border-l border-neutral-600/80">
          <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h2>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Mass m (kg)</label>
            <input
              type="range"
              min={1}
              max={30}
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              title="Mass m stays the same on any planet"
              className="w-full h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300"
            />
            <span className="text-sm text-cyan-300 font-mono">{mass} kg</span>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-2">Planet (changes g)</label>
            <div className="flex gap-2">
              {PLANETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanetId(p.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition ${
                    planetId === p.id ? "border-cyan-400 bg-cyan-500/20 text-white" : "border-neutral-600 bg-neutral-800/60 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  {p.name}
                  <br />
                  <span className="text-[10px] opacity-80">g = {p.g} m/s²</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm">
            <div>Weight W = mg =</div>
            <div className="text-cyan-300 font-mono font-semibold text-lg">{weight.toFixed(1)} N</div>
          </div>
          <p className="text-[11px] text-neutral-500">Same m, different g → different W.</p>
        </aside>
      </section>
    </div>
  );
}
