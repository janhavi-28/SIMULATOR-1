"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

export default function MomentumConservationSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [elastic, setElastic] = useState(true);
  const [m1, setM1] = useState(3);
  const [m2, setM2] = useState(5);
  const [u1, setU1] = useState(0.12);
  const [u2, setU2] = useState(-0.08);
  const [simTime, setSimTime] = useState(0);
  const lastTsRef = useRef<number | null>(null);
  const x1Ref = useRef(0.2);
  const x2Ref = useRef(0.7);
  const v1Ref = useRef(0.12);
  const v2Ref = useRef(-0.08);
  const collidedRef = useRef(false);

  const e = elastic ? 1 : 0.5;
  const pBefore = m1 * u1 + m2 * u2;
  const pAfter = m1 * v1Ref.current + m2 * v2Ref.current;

  useEffect(() => {
    if (!hasLaunched || paused) return;
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? Math.min(0.03, (ts - lastTsRef.current) / 1000) : 0;
      lastTsRef.current = ts;
      x1Ref.current += v1Ref.current * dt;
      x2Ref.current += v2Ref.current * dt;
      const gap = x2Ref.current - x1Ref.current;
      const rad = 0.04;
      if (gap < 2 * rad && !collidedRef.current) {
        collidedRef.current = true;
        const v1 = v1Ref.current;
        const v2 = v2Ref.current;
        const totalM = m1 + m2;
        const v1New = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / totalM;
        const v2New = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / totalM;
        v1Ref.current = v1New;
        v2Ref.current = v2New;
      }
      if (x1Ref.current < 0.05) { x1Ref.current = 0.05; v1Ref.current = -v1Ref.current * 0.5; }
      if (x2Ref.current > 0.95) { x2Ref.current = 0.95; v2Ref.current = -v2Ref.current * 0.5; }
      setSimTime((t) => t + dt);
    };
    lastTsRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused, m1, m2, e]);

  const launch = () => {
    setSimTime(0);
    v1Ref.current = u1;
    v2Ref.current = u2;
    x1Ref.current = 0.2;
    x2Ref.current = 0.7;
    collidedRef.current = false;
    setPaused(false);
    setHasLaunched(true);
  };
  const reset = () => {
    setSimTime(0);
    v1Ref.current = u1;
    v2Ref.current = u2;
    x1Ref.current = 0.2;
    x2Ref.current = 0.7;
    collidedRef.current = false;
    setPaused(true);
    setHasLaunched(false);
  };

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
    const dpr = canvas.width / (containerRef.current?.getBoundingClientRect().width || 1);
    const pad = 36 * dpr;
    const plotW = w - 2 * pad;
    const cy = h / 2;
    const r1 = 18 + m1 * 3;
    const r2 = 18 + m2 * 3;
    const x1 = pad + x1Ref.current * plotW;
    const x2 = pad + x2Ref.current * plotW;
    const scale = 120;

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(pad, cy);
    ctx.lineTo(w - pad, cy);
    ctx.stroke();

    const drawArrow = (cx: number, v: number, color: string) => {
      const len = Math.min(40, Math.abs(v) * scale) * dpr * (v >= 0 ? 1 : -1);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 35);
      ctx.lineTo(cx + len, cy - 35);
      ctx.stroke();
      const ang = len >= 0 ? 0 : Math.PI;
      const arr = 8 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx + len, cy - 35);
      ctx.lineTo(cx + len - arr * Math.cos(ang - 0.4), cy - 35 - arr * Math.sin(ang - 0.4));
      ctx.lineTo(cx + len - arr * Math.cos(ang + 0.4), cy - 35 - arr * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    drawArrow(x1, v1Ref.current, "#38bdf8");
    drawArrow(x2, v2Ref.current, "#f472b6");

    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(x1, cy, r1 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.stroke();
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText(`m₁=${m1} p=${(m1 * v1Ref.current).toFixed(2)}`, x1 - r1 * 0.6, cy + r1 * dpr + 14);

    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.arc(x2, cy, r2 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.stroke();
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.fillText(`m₂=${m2} p=${(m2 * v2Ref.current).toFixed(2)}`, x2 - r2 * 0.6, cy + r2 * dpr + 14);

    ctx.fillStyle = "rgba(167,139,250,0.9)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.fillText(`Total p (before) = ${pBefore.toFixed(2)}`, pad, 24);
    ctx.fillText(`Total p (after)  = ${pAfter.toFixed(2)}`, pad, 42);
  }, [m1, m2, u1, u2, pBefore, pAfter, simTime]);

  return (
    <SimulatorShell
      title="Momentum and Conservation of Momentum"
      subtitle="1D collision. Total momentum before = after. Elastic vs inelastic."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <SliderControl label="m₁" value={m1} min={1} max={8} step={0.5} unit="kg" onChange={setM1} />
          <SliderControl label="m₂" value={m2} min={1} max={10} step={0.5} unit="kg" onChange={setM2} color="violet" />
          <SliderControl label="u₁ (initial v)" value={u1} min={-0.2} max={0.2} step={0.02} unit="" onChange={setU1} color="cyan" />
          <SliderControl label="u₂ (initial v)" value={u2} min={-0.2} max={0.2} step={0.02} unit="" onChange={setU2} color="amber" />
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300 block">Collision type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setElastic(true)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition ${elastic ? "border-cyan-400 bg-cyan-500/20 text-white" : "border-neutral-600 bg-neutral-800/60 text-neutral-400"}`}
              >
                Elastic (e=1)
              </button>
              <button
                type="button"
                onClick={() => setElastic(false)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition ${!elastic ? "border-cyan-400 bg-cyan-500/20 text-white" : "border-neutral-600 bg-neutral-800/60 text-neutral-400"}`}
              >
                Inelastic (e=0.5)
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm space-y-1">
            <div>p_before = m₁u₁ + m₂u₂ = <span className="font-mono text-cyan-300">{pBefore.toFixed(2)}</span></div>
            <div>p_after = <span className="font-mono text-cyan-300">{pAfter.toFixed(2)}</span></div>
          </div>
        </>
      }
    >
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }} />
      </div>
    </SimulatorShell>
  );
}
