"use client";

import React, { useEffect, useRef, useState } from "react";
import { MagnetismShell, SliderControl } from "./MagnetismShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function ElectromagneticInductionSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState(80);
  const [strength, setStrength] = useState(1);
  const [turns, setTurns] = useState(50);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const emfHistoryRef = useRef<number[]>([]);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle({ onReset: () => (emfHistoryRef.current = []) });

  const t = isAnimating ? elapsedTime : 0;
  const magnetY = 0.25 * (1 + Math.sin(t * (speed / 40))) * 0.5 + 0.25;
  const dPhiDt = speed * strength * Math.cos(t * (speed / 40));
  const emf = dPhiDt * turns * 0.01;

  useEffect(() => {
    if (isAnimating) {
      const hist = emfHistoryRef.current;
      hist.push(emf);
      if (hist.length > 120) hist.shift();
    }
  }, [isAnimating, emf]);

  useEffect(() => {
    const c = containerRef.current;
    const canvas = canvasRef.current;
    if (!c || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    });
    ro.observe(c);
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = dimsRef.current;
    const coilX = w * 0.35;
    const coilW = 70 * dpr;
    const coilH = 100 * dpr;
    const my = h * magnetY;
    const mx = coilX + coilW / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0c1222";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(56,189,248,0.6)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const y = h * 0.25 + (i / 7) * coilH;
      ctx.beginPath();
      ctx.arc(coilX + coilW, y, coilW / 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(coilX, y, coilW / 2, Math.PI / 2, (Math.PI * 3) / 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`N = ${turns}`, coilX + coilW + 10, h * 0.5);

    const mw = 36 * dpr;
    const mh = 24 * dpr;
    ctx.fillStyle = "rgba(248,113,113,0.95)";
    ctx.fillRect(mx - mw / 2, my - mh / 2, mw / 2, mh);
    ctx.fillStyle = "rgba(56,189,248,0.95)";
    ctx.fillRect(mx, my - mh / 2, mw / 2, mh);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.fillText("N", mx - mw / 4 - 4, my - mh / 2 - 6);
    ctx.fillText("S", mx + mw / 4 - 4, my - mh / 2 - 6);

    const gx = w * 0.72;
    const gy = h * 0.5;
    const needleAngle = Math.max(-0.8, Math.min(0.8, emf * 0.3)) * Math.PI;
    ctx.strokeStyle = "rgba(148,163,184,0.8)";
    ctx.beginPath();
    ctx.arc(gx, gy, 35 * dpr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(251,191,36,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 30 * dpr * Math.cos(needleAngle), gy + 30 * dpr * Math.sin(needleAngle));
    ctx.stroke();
    ctx.fillStyle = "rgba(248,250,252,0.8)";
    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillText("G", gx - 4, gy + 45 * dpr);

    const hist = emfHistoryRef.current;
    const graphX = w * 0.55;
    const graphW = w * 0.35;
    const graphY = h * 0.72;
    const graphH = 50 * dpr;
    ctx.strokeStyle = "rgba(56,189,248,0.5)";
    ctx.strokeRect(graphX, graphY - graphH, graphW, graphH);
    if (hist.length > 1) {
      const maxE = Math.max(1, ...hist.map(Math.abs));
      ctx.strokeStyle = "rgba(56,189,248,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      hist.forEach((v, i) => {
        const x = graphX + (i / (hist.length - 1)) * graphW;
        const y = graphY - (v / maxE) * (graphH / 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${9 * dpr}px system-ui,sans-serif`;
    ctx.fillText("EMF ∝ dΦ/dt", graphX, graphY + 16 * dpr);
    ctx.fillText(`EMF (arb.) ≈ ${formatNum(emf, 2)}`, graphX, h - 8 * dpr);
  }, [speed, strength, turns, magnetY, emf, isAnimating]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Magnet speed" value={speed} min={20} max={150} step={10} unit="×" onChange={setSpeed} color="cyan" />
      <SliderControl label="Magnet strength" value={strength} min={0.5} max={2} step={0.1} unit="×" onChange={setStrength} color="violet" />
      <SliderControl label="Coil turns N" value={turns} min={20} max={100} step={10} unit="" onChange={setTurns} color="amber" />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">EMF ∝ rate of change of flux</div>
        <p className="mt-1 text-xs">Galvanometer deflects when magnet moves; direction reverses when motion reverses.</p>
      </div>
    </>
  );

  return (
    <MagnetismShell
      title="Electromagnetic Induction"
      subtitle="Magnet in coil: EMF vs time, galvanometer."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div ref={containerRef} className="w-full h-full min-h-0 flex-1 flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full max-h-full w-full h-full rounded-lg" style={{ width: "100%", height: "100%" }} />
      </div>
    </MagnetismShell>
  );
}
