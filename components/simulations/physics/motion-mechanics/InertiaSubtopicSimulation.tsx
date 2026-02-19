"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

export default function InertiaSubtopicSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [force, setForce] = useState(25);
  const [mass1, setMass1] = useState(2);
  const [mass2, setMass2] = useState(8);
  const lastTsRef = useRef<number | null>(null);
  const v1Ref = useRef(0);
  const v2Ref = useRef(0);
  const x1Ref = useRef(0.2);
  const x2Ref = useRef(0.55);

  const a1 = mass1 > 0 ? force / mass1 : 0;
  const a2 = mass2 > 0 ? force / mass2 : 0;

  useEffect(() => {
    if (!hasLaunched || paused) return;
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? Math.min(0.04, (ts - lastTsRef.current) / 1000) : 0;
      lastTsRef.current = ts;
      v1Ref.current += a1 * dt;
      v2Ref.current += a2 * dt;
      x1Ref.current += v1Ref.current * dt;
      x2Ref.current += v2Ref.current * dt;
      x1Ref.current = Math.max(0.05, Math.min(0.45, x1Ref.current));
      x2Ref.current = Math.max(0.5, Math.min(0.9, x2Ref.current));
      setSimTime((t) => t + dt);
    };
    lastTsRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused, force, mass1, mass2, a1, a2]);

  const launch = () => {
    setSimTime(0);
    v1Ref.current = 0;
    v2Ref.current = 0;
    x1Ref.current = 0.2;
    x2Ref.current = 0.55;
    setPaused(false);
    setHasLaunched(true);
  };
  const reset = () => {
    setSimTime(0);
    v1Ref.current = 0;
    v2Ref.current = 0;
    x1Ref.current = 0.2;
    x2Ref.current = 0.55;
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
    const pad = 28 * dpr;
    const plotW = w - 2 * pad;
    const cy = h / 2;
    const size1 = 20 + mass1 * 4;
    const size2 = 20 + mass2 * 4;
    const x1 = pad + x1Ref.current * plotW;
    const x2 = pad + x2Ref.current * plotW;

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

    const fLen = Math.min(45, force * 0.8) * dpr;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(x1 - size1 - 10, cy);
    ctx.lineTo(x1 - size1 - 10 + fLen, cy);
    ctx.stroke();
    ctx.strokeStyle = "#22c55e";
    ctx.beginPath();
    ctx.moveTo(x2 - size2 - 10, cy);
    ctx.lineTo(x2 - size2 - 10 + fLen, cy);
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x1 - size1, cy - size1 * 0.8, size1 * 2, size1 * 1.6);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.strokeRect(x1 - size1, cy - size1 * 0.8, size1 * 2, size1 * 1.6);
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.fillText(`m = ${mass1}`, x1 - size1 * 0.5, cy + 4);
    ctx.fillText(`a = ${a1.toFixed(2)}`, x1 - size1 * 0.5, cy + 22);

    ctx.fillStyle = "#f472b6";
    ctx.fillRect(x2 - size2, cy - size2 * 0.8, size2 * 2, size2 * 1.6);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.strokeRect(x2 - size2, cy - size2 * 0.8, size2 * 2, size2 * 1.6);
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.fillText(`m = ${mass2}`, x2 - size2 * 0.5, cy + 4);
    ctx.fillText(`a = ${a2.toFixed(2)}`, x2 - size2 * 0.5, cy + 22);

    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.fillText("Same F: heavier → smaller a (more inertia)", pad, 28);
  }, [mass1, mass2, force, a1, a2, simTime]);

  return (
    <SimulatorShell
      title="Inertia"
      subtitle="Same force on different masses. Heavier resists more."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <SliderControl label="Force F (same on both)" value={force} min={10} max={50} step={2} unit="N" onChange={setForce} color="emerald" />
          <SliderControl label="Mass 1 (light)" value={mass1} min={1} max={5} step={0.5} unit="kg" onChange={setMass1} />
          <SliderControl label="Mass 2 (heavy)" value={mass2} min={4} max={15} step={0.5} unit="kg" onChange={setMass2} color="violet" />
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm space-y-1">
            <div>a₁ = F/m₁ = <span className="font-mono text-cyan-300">{a1.toFixed(2)}</span> m/s²</div>
            <div>a₂ = F/m₂ = <span className="font-mono text-cyan-300">{a2.toFixed(2)}</span> m/s²</div>
          </div>
          <p className="text-[11px] text-neutral-500">Heavier block accelerates less: more inertia.</p>
        </>
      }
    >
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }} />
      </div>
    </SimulatorShell>
  );
}
