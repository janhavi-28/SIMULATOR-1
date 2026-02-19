"use client";

import React, { useEffect, useRef, useState } from "react";

const G = 6.674e-11;

function formatNum(n: number) {
  if (!Number.isFinite(n) || n === 0) return "—";
  if (Math.abs(n) >= 1e9) return n.toExponential(1);
  if (Math.abs(n) < 1e-6) return n.toExponential(2);
  return n.toFixed(2);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, t);
}

export default function UniversalGravitationSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [m1, setM1] = useState(10);
  const [m2, setM2] = useState(10);
  const [r, setR] = useState(5);
  const [animPhase, setAnimPhase] = useState(0);
  const arrowLenRef = useRef(20);
  const lastTsRef = useRef<number | null>(null);

  const F = G * m1 * m2 / (r * r);
  const F_at_2r = G * m1 * m2 / (4 * r * r);
  const targetArrowLen = Math.min(70, Math.max(12, Math.log10(1 + F * 1e12) * 14));

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? Math.min(0.06, (ts - lastTsRef.current) / 1000) : 0.016;
      lastTsRef.current = ts;
      arrowLenRef.current = lerp(arrowLenRef.current, targetArrowLen, dt * 8);
      setAnimPhase((p) => p + 0.018);
    };
    raf = requestAnimationFrame((ts) => { lastTsRef.current = ts; requestAnimationFrame(tick); });
    return () => cancelAnimationFrame(raf);
  }, [targetArrowLen]);

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
    const cy = h / 2;
    const dpr = canvas.width / (canvas.getBoundingClientRect().width || 1);

    ctx.clearRect(0, 0, w, h);
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.8);
    bgGrad.addColorStop(0, "#0c1222");
    bgGrad.addColorStop(0.6, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const maxR = 15;
    const scaleX = (w * 0.38) / maxR;
    const rPx = Math.max(24, r * scaleX);
    const ball1X = cx - rPx / 2;
    const ball2X = cx + rPx / 2;

    const rad1 = 12 + Math.log10(1 + m1) * 4;
    const rad2 = 12 + Math.log10(1 + m2) * 4;

    const pulse = 1 + Math.sin(animPhase) * 0.04;
    const arrowLen = arrowLenRef.current * pulse * dpr;
    const forceIntensity = Math.min(1, Math.log10(1 + F * 1e12) / 14);
    const arrowThickness = 2 + forceIntensity * 2.5;

    const drawArrow = (x: number, y: number, dx: number, dy: number, color: string, thick: number, glow = true) => {
      const len = Math.hypot(dx, dy) || 1;
      if (glow && len > 4) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 * dpr;
      }
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = thick * dpr;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const ux = dx / len;
      const uy = dy / len;
      const head = 12 * dpr;
      const wing = 6 * dpr;
      ctx.beginPath();
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x + dx - ux * head - uy * wing, y + dy - uy * head + ux * wing);
      ctx.lineTo(x + dx - ux * head + uy * wing, y + dy - uy * head - ux * wing);
      ctx.fill();
    };

    // Inverse-square visual: distance line with r and 2r markers (F at 2r = F/4)
    const lineY = cy + Math.max(rad1, rad2) * dpr + 32;
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(ball1X + rad1, lineY);
    ctx.lineTo(ball2X - rad2, lineY);
    ctx.stroke();
    ctx.setLineDash([]);
    const midX = (ball1X + rad1 + ball2X - rad2) / 2;
    ctx.fillStyle = "rgba(34,211,238,0.7)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("r →", midX - 15, lineY - 6);
    ctx.fillText("2r → F/4", midX + 20, lineY - 6);
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.fillText(`r = ${r} m`, cx, cy - Math.max(rad1, rad2) * dpr - 10);

    // Force arrows (dynamic length, thickness by F)
    drawArrow(ball1X + rad1, cy, arrowLen, 0, "#22d3ee", arrowThickness, true);
    drawArrow(ball2X - rad2, cy, -arrowLen, 0, "#a78bfa", arrowThickness, true);

    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(ball1X + rad1, cy);
    ctx.lineTo(ball2X - rad2, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Body 1 with glow
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 14 * dpr;
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(ball1X, cy, rad1 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    ctx.fillStyle = "#a78bfa";
    ctx.shadowColor = "#a78bfa";
    ctx.shadowBlur = 14 * dpr;
    ctx.beginPath();
    ctx.arc(ball2X, cy, rad2 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#8b5cf6";
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(`m₁ = ${m1} kg`, ball1X, cy + rad1 * dpr + 18);
    ctx.fillText(`m₂ = ${m2} kg`, ball2X, cy + rad2 * dpr + 18);
  }, [m1, m2, r, F, animPhase]);

  const slider = (label: string, value: number, min: number, max: number, set: (v: number) => void) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          className="flex-1 h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300"
        />
        <span className="text-sm text-cyan-300 font-mono w-14">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-neutral-900 overflow-hidden rounded-xl ring-1 ring-cyan-500/15 shadow-[0_0_24px_-4px_rgba(34,211,238,0.08)]">
      <section className="flex flex-1 min-h-0 flex-col md:flex-row bg-neutral-900/95 rounded-xl overflow-hidden">
        <div className="w-full md:w-[65%] min-w-0 md:border-r border-neutral-600/80 flex flex-col p-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span aria-hidden>🌍</span>
              <span>Universal Law of Gravitation · F = Gm₁m₂/r²</span>
            </h2>
          </div>
          <div ref={containerRef} className="relative flex-1 min-h-0 w-full rounded-xl border border-neutral-700 bg-[#0f172a] overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        <aside className="w-full md:w-[35%] md:min-w-[220px] flex flex-col gap-4 px-4 py-4 bg-neutral-900/80 overflow-auto min-h-0 border-t md:border-t-0 md:border-l border-neutral-600/80">
          <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h2>
          {slider("Mass m₁ (kg)", m1, 1, 50, setM1)}
          {slider("Mass m₂ (kg)", m2, 1, 50, setM2)}
          {slider("Distance r (m)", r, 2, 15, setR)}
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm">
            <div className="text-neutral-300">F = Gm₁m₂/r² =</div>
            <div className="text-cyan-300 font-mono font-semibold text-lg mt-1">{formatNum(F)} N</div>
            <div className="text-[10px] text-neutral-400 mt-1">At 2r → F/4 = {formatNum(F_at_2r)} N</div>
          </div>
          <p className="text-[11px] text-neutral-500">Double r → force quarters. Arrows scale with F.</p>
        </aside>
      </section>
    </div>
  );
}
