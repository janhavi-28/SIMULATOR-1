"use client";

import React, { useEffect, useRef, useState } from "react";
import { MatterShell, SliderControl } from "./MatterShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function LatentHeatSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mass, setMass] = useState(1);
  const [L, setL] = useState(334); // kJ/kg (water fusion)
  const [heat, setHeat] = useState(0);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle();

  const t = isAnimating ? elapsedTime : 0;
  const Q = heat || mass * L;
  const fractionMelted = Math.min(1, Q / (mass * L || 1));

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
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
    const centerX = w * 0.35;
    const baseY = h * 0.7;
    const radius = 40 * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050911";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(148,163,184,0.5)";
    ctx.fillRect(centerX - radius, baseY, radius * 2, 10 * dpr);

    const iceHeight = (1 - fractionMelted) * radius * 1.5;
    const waterHeight = fractionMelted * radius * 1.5;

    ctx.fillStyle = "rgba(96,165,250,0.9)";
    ctx.fillRect(centerX - radius * 0.7, baseY - waterHeight, radius * 1.4, waterHeight);

    ctx.fillStyle = "rgba(191,219,254,0.9)";
    ctx.fillRect(centerX - radius * 0.5, baseY - waterHeight - iceHeight, radius, iceHeight);

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Ice", centerX - radius * 0.9, baseY - waterHeight - iceHeight - 6 * dpr);
    ctx.fillText("Water at 0°C", centerX - radius * 0.9, baseY - waterHeight - 4 * dpr);

    const barX = w * 0.6;
    const barY = h * 0.3;
    const barW = w * 0.28;
    const barH = 18 * dpr;
    ctx.strokeStyle = "rgba(34,211,238,0.6)";
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = "rgba(34,211,238,0.4)";
    ctx.fillRect(barX, barY, barW * fractionMelted, barH);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`Fraction melted: ${formatNum(fractionMelted, 2)}`, barX, barY - 8 * dpr);

    ctx.fillText(`Q = mL = ${formatNum(mass, 2)} kg × ${formatNum(L, 0)} kJ/kg`, barX, barY + 36 * dpr);
    ctx.fillText(`Q = ${formatNum(Q, 1)} kJ`, barX, barY + 52 * dpr);

    ctx.fillText("Temperature stays ~constant during phase change (latent heat).", 16 * dpr, h - 14 * dpr);
  }, [mass, L, heat, fractionMelted, Q]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl
        label="Mass m"
        value={mass}
        min={0.5}
        max={5}
        step={0.5}
        unit="kg"
        onChange={setMass}
        color="cyan"
      />
      <SliderControl
        label="Latent heat L"
        value={L}
        min={100}
        max={3000}
        step={50}
        unit="kJ/kg"
        onChange={setL}
        color="violet"
      />
      <SliderControl
        label="Heat added Q"
        value={heat}
        min={0}
        max={mass * L}
        step={mass * L * 0.05}
        unit="kJ"
        onChange={setHeat}
        color="amber"
      />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Formula</div>
        <p className="mt-1 text-xs font-mono">Q = mL</p>
        <p className="mt-1 text-xs">
          During the phase change, temperature does not rise even though energy Q is absorbed or
          released.
        </p>
      </div>
    </>
  );

  return (
    <MatterShell
      title="Latent Heat"
      subtitle="Energy in phase change without temperature change (Q = mL)."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div
        ref={containerRef}
        className="w-full h-full min-h-[280px] flex items-center justify-center p-2"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full w-full h-full rounded-lg"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </MatterShell>
  );
}

