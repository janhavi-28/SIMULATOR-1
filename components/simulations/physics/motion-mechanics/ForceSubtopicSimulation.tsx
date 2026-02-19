"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

export default function ForceSubtopicSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [F1, setF1] = useState(30);
  const [F2, setF2] = useState(10);
  const [mass, setMass] = useState(5);
  const [friction, setFriction] = useState(2);
  const lastTsRef = useRef<number | null>(null);
  const vRef = useRef(0);
  const xRef = useRef(0.2);

  const netF = F1 - F2 - friction;
  const a = mass > 0 ? netF / mass : 0;

  useEffect(() => {
    if (!hasLaunched || paused) return;
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? Math.min(0.05, (ts - lastTsRef.current) / 1000) : 0;
      lastTsRef.current = ts;
      const ax = mass > 0 ? netF / mass : 0;
      vRef.current += ax * dt;
      xRef.current += vRef.current * dt;
      xRef.current = Math.max(0.05, Math.min(0.85, xRef.current));
      if (Math.abs(vRef.current) < 0.001 && Math.abs(ax) < 0.01) vRef.current *= 0.95;
      setSimTime((t) => t + dt);
    };
    lastTsRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused, netF, mass]);

  const launch = () => {
    setSimTime(0);
    vRef.current = 0;
    xRef.current = 0.2;
    setPaused(false);
    setHasLaunched(true);
  };
  const reset = () => {
    setSimTime(0);
    vRef.current = 0;
    xRef.current = 0.2;
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
    const scale = plotW * 0.08;
    const objX = pad + xRef.current * plotW;

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const drawArrow = (x0: number, y0: number, fx: number, color: string, label: string) => {
      const len = Math.min(80, Math.abs(fx) * 1.2) * dpr * (fx >= 0 ? 1 : -1);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = (2 + Math.min(2, Math.abs(fx) / 20)) * dpr;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + len, y0);
      ctx.stroke();
      const ang = len >= 0 ? 0 : Math.PI;
      const arr = 10 * dpr;
      ctx.beginPath();
      ctx.moveTo(x0 + len, y0);
      ctx.lineTo(x0 + len - arr * Math.cos(ang - 0.4), y0 - arr * Math.sin(ang - 0.4));
      ctx.lineTo(x0 + len - arr * Math.cos(ang + 0.4), y0 - arr * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.font = `${10 * dpr}px system-ui`;
      ctx.fillText(label, x0 + len / 2 - 12, y0 - 14);
    };

    drawArrow(pad, cy - 45, F1, "#22c55e", "F₁");
    drawArrow(objX + 25, cy - 45, -F2, "#ef4444", "F₂");
    drawArrow(objX + 25, cy + 45, -friction, "#f59e0b", "f");

    const netLen = Math.min(60, Math.abs(netF) * 1.5) * dpr * (netF >= 0 ? 1 : -1);
    ctx.strokeStyle = "#a78bfa";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(objX - 20, cy + 55);
    ctx.lineTo(objX - 20 + netLen, cy + 55);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(167,139,250,0.9)";
    ctx.fillText("F_net", objX - 20 + netLen / 2 - 14, cy + 70);

    ctx.fillStyle = "#64748b";
    ctx.fillRect(objX - 28, cy - 22, 56, 44);
    ctx.strokeStyle = "rgba(226,232,240,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(objX - 28, cy - 22, 56, 44);
    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.fillText(`m = ${mass} kg`, objX - 22, cy + 4);
    ctx.fillText(`a = F/m = ${a.toFixed(2)}`, pad, h - 12);
  }, [F1, F2, friction, mass, netF, a, simTime]);

  return (
    <SimulatorShell
      title="Force"
      subtitle="Forces as arrows. Net force → acceleration. F = ma."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
          <SliderControl label="F₁ (right)" value={F1} min={0} max={80} step={2} unit="N" onChange={setF1} color="emerald" />
          <SliderControl label="F₂ (left)" value={F2} min={0} max={50} step={2} unit="N" onChange={setF2} color="rose" />
          <SliderControl label="Friction" value={friction} min={0} max={20} step={1} unit="N" onChange={setFriction} color="amber" />
          <SliderControl label="Mass" value={mass} min={1} max={15} step={0.5} unit="kg" onChange={setMass} />
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm">
            <div>F_net = <span className="font-mono text-cyan-300">{netF.toFixed(1)} N</span></div>
            <div>a = F_net / m = <span className="font-mono text-cyan-300">{a.toFixed(2)} m/s²</span></div>
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
