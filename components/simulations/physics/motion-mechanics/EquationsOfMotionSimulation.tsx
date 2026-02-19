"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

export default function EquationsOfMotionSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [u, setU] = useState(5);
  const [a, setA] = useState(2);
  const [tMax, setTMax] = useState(6);
  const lastTsRef = useRef<number | null>(null);

  const t = Math.min(simTime, tMax);
  const v = u + a * t;
  const s = u * t + 0.5 * a * t * t;
  const vSq = u * u + 2 * a * s;

  useEffect(() => {
    if (!hasLaunched || paused) return;
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      setSimTime((prev) => prev + dt);
    };
    lastTsRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused]);

  const launch = () => {
    setSimTime(0);
    setPaused(false);
    setHasLaunched(true);
  };
  const reset = () => {
    setSimTime(0);
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
    const pad = 32 * dpr;
    const trackY = h / 2;
    const trackLeft = pad;
    const trackRight = w - pad;
    const trackW = trackRight - trackLeft;
    const scale = trackW / Math.max(1, u * tMax + 0.5 * a * tMax * tMax);
    const x = (u * t + 0.5 * a * t * t) * scale;
    const objX = trackLeft + Math.min(x, trackW - 20);

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(148,163,184,0.4)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(trackLeft, trackY);
    ctx.lineTo(trackRight, trackY);
    ctx.stroke();

    ctx.fillStyle = "#22d3ee";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 14 * dpr;
    ctx.beginPath();
    ctx.arc(objX, trackY, 14 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `${12 * dpr}px system-ui`;
    ctx.textAlign = "left";
    ctx.fillText(`v = u + at = ${v.toFixed(2)} m/s`, trackLeft, trackY - 28);
    ctx.fillText(`s = ut + ½at² = ${s.toFixed(2)} m`, trackLeft, trackY - 14);
    ctx.fillText(`v² = u² + 2as ✓`, trackLeft, trackY + 28);
  }, [u, a, t, tMax, s, v]);

  return (
    <SimulatorShell
      title="Equations of Motion"
      subtitle="Motion from v = u + at, s = ut + ½at², v² = u² + 2as."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <SliderControl label="u (initial velocity)" value={u} min={0} max={15} step={0.5} unit="m/s" onChange={setU} />
          <SliderControl label="a (acceleration)" value={a} min={-2} max={5} step={0.25} unit="m/s²" onChange={setA} color="amber" />
          <SliderControl label="t max" value={tMax} min={2} max={12} step={0.5} unit="s" onChange={setTMax} color="emerald" />
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm space-y-1">
            <div>v = u + at = <span className="font-mono text-cyan-300">{v.toFixed(2)}</span></div>
            <div>s = ut + ½at² = <span className="font-mono text-cyan-300">{s.toFixed(2)}</span></div>
            <div>v² = u² + 2as → <span className="font-mono text-cyan-300">{vSq.toFixed(1)}</span></div>
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
