"use client";

import React, { useEffect, useRef, useState } from "react";
import { MatterShell, SliderControl } from "./MatterShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

type Phase = "solid" | "liquid" | "gas";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function StatesOfMatterSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("solid");
  const [temperature, setTemperature] = useState(20);
  const [particleCount, setParticleCount] = useState(40);
  const [boxScale, setBoxScale] = useState(1);
  const particlesRef = useRef<Particle[]>([]);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle({
    onReset: () => resetParticles(),
  });

  const tFactor = Math.max(0.2, (temperature + 273) / 293);

  function resetParticles() {
    const { w, h, dpr } = dimsRef.current;
    const margin = 30 * dpr;
    const boxW = (w - 2 * margin) / boxScale;
    const boxH = h - 2 * margin;
    const startX = (w - boxW) / 2;
    const startY = (h - boxH) / 2;

    const particles: Particle[] = [];
    if (phase === "solid") {
      const cols = Math.max(4, Math.round(Math.sqrt(particleCount)));
      const rows = Math.ceil(particleCount / cols);
      const dx = boxW / (cols + 1);
      const dy = boxH / (rows + 1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (particles.length >= particleCount) break;
          const x = startX + (c + 1) * dx;
          const y = startY + (r + 1) * dy;
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
          });
        }
      }
    } else {
      for (let i = 0; i < particleCount; i++) {
        const x = startX + Math.random() * boxW;
        const y = startY + Math.random() * boxH;
        const speedBase = phase === "liquid" ? 50 : 120;
        const speed = speedBase * tFactor * (0.5 + Math.random());
        const angle = Math.random() * Math.PI * 2;
        particles.push({
          x,
          y,
          vx: speed * Math.cos(angle),
          vy: speed * Math.sin(angle),
        });
      }
    }
    particlesRef.current = particles;
  }

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
      resetParticles();
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    resetParticles();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resetParticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, particleCount, boxScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = dimsRef.current;
    const margin = 30 * dpr;
    const boxW = (w - 2 * margin) / boxScale;
    const boxH = h - 2 * margin;
    const startX = (w - boxW) / 2;
    const startY = (h - boxH) / 2;

    const particles = particlesRef.current;
    const dt = isAnimating ? 0.016 : 0;

    if (isAnimating) {
      const damping = phase === "solid" ? 0.3 : phase === "liquid" ? 0.7 : 0.95;
      const tempScale = phase === "solid" ? 20 : phase === "liquid" ? 60 : 120;
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < startX) {
          p.x = startX;
          p.vx = Math.abs(p.vx) * damping;
        } else if (p.x > startX + boxW) {
          p.x = startX + boxW;
          p.vx = -Math.abs(p.vx) * damping;
        }
        if (p.y < startY) {
          p.y = startY;
          p.vy = Math.abs(p.vy) * damping;
        } else if (p.y > startY + boxH) {
          p.y = startY + boxH;
          p.vy = -Math.abs(p.vy) * damping;
        }
        if (phase === "solid") {
          p.vx += (Math.random() - 0.5) * tempScale * 0.2 * dt * tFactor;
          p.vy += (Math.random() - 0.5) * tempScale * 0.2 * dt * tFactor;
        } else if (phase === "liquid") {
          p.vx += (Math.random() - 0.5) * tempScale * 0.15 * dt * tFactor;
          p.vy += (Math.random() - 0.5) * tempScale * 0.15 * dt * tFactor;
        } else {
          p.vx += (Math.random() - 0.5) * tempScale * 0.25 * dt * tFactor;
          p.vy += (Math.random() - 0.5) * tempScale * 0.25 * dt * tFactor;
        }
      }
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050911";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(148,163,184,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, boxW, boxH);

    const speeds = particles.map((p) => Math.hypot(p.vx, p.vy));
    const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const avgKE = 0.5 * avgSpeed * avgSpeed;
    const spacingEstimate =
      particles.length > 0 ? Math.sqrt((boxW * boxH) / particles.length) / dpr : 0;

    const radius = phase === "solid" ? 4 * dpr : phase === "liquid" ? 3.5 * dpr : 3 * dpr;
    for (const p of particles) {
      let color: string;
      if (phase === "solid") color = "rgba(56,189,248,0.9)";
      else if (phase === "liquid") color = "rgba(34,197,94,0.9)";
      else color = "rgba(249,115,22,0.9)";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (phase === "gas") {
      const densityFactor = particles.length / (boxW * boxH);
      const pressure = densityFactor * avgKE * 1e3;
      ctx.fillStyle = "rgba(248,250,252,0.9)";
      ctx.font = `${10 * dpr}px system-ui,sans-serif`;
      ctx.fillText(
        `Avg KE (arb.) ≈ ${formatNum(avgKE, 1)}   Pressure (arb.) ↑ with T & density`,
        startX + 4 * dpr,
        startY + boxH + 18 * dpr,
      );
      ctx.fillText(
        `Inter-particle spacing ≈ ${formatNum(spacingEstimate, 1)} px`,
        startX + 4 * dpr,
        startY - 10 * dpr,
      );
    } else {
      ctx.fillStyle = "rgba(248,250,252,0.9)";
      ctx.font = `${10 * dpr}px system-ui,sans-serif`;
      ctx.fillText(
        `Avg KE (arb.) ≈ ${formatNum(avgKE, 1)}   Spacing ≈ ${formatNum(
          spacingEstimate,
          1,
        )} px`,
        startX + 4 * dpr,
        startY + boxH + 18 * dpr,
      );
    }
  }, [phase, temperature, particleCount, boxScale, isAnimating, elapsedTime, tFactor]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">State of matter</label>
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as Phase)}
          className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200"
        >
          <option value="solid">Solid</option>
          <option value="liquid">Liquid</option>
          <option value="gas">Gas</option>
        </select>
      </div>
      <SliderControl
        label="Temperature"
        value={temperature}
        min={-20}
        max={120}
        step={5}
        unit="°C"
        onChange={setTemperature}
        color="orange"
      />
      <SliderControl
        label="Particle count"
        value={particleCount}
        min={20}
        max={80}
        step={5}
        unit=""
        onChange={setParticleCount}
        color="cyan"
      />
      <SliderControl
        label="Container scale"
        value={boxScale}
        min={0.6}
        max={1.4}
        step={0.1}
        unit="×"
        onChange={setBoxScale}
        color="violet"
      />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">
          Live readouts (qualitative)
        </div>
        <p className="text-xs">
          Temperature controls average kinetic energy and motion. Gas: more spacing and higher
          speed; solid: ordered lattice with small vibrations.
        </p>
      </div>
    </>
  );

  return (
    <MatterShell
      title="States of Matter"
      subtitle="Particle-level view of solids, liquids, and gases."
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

