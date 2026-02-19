"use client";

import React, { useEffect, useRef, useState } from "react";
import { MatterShell, SliderControl } from "./MatterShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

type Particle = { x: number; y: number; vx: number; vy: number; escaped: boolean };

export default function EvaporationSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [temperature, setTemperature] = useState(30);
  const [surfaceArea, setSurfaceArea] = useState(1);
  const [windSpeed, setWindSpeed] = useState(2);
  const particlesRef = useRef<Particle[]>([]);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle({
      onReset: () => initParticles(),
    });

  const t = isAnimating ? elapsedTime : 0;

  function initParticles() {
    const { w, h, dpr } = dimsRef.current;
    const baseY = h * 0.65;
    const width = (w * 0.6 * surfaceArea) / 2;
    const centerX = w * 0.5;
    const N = 40;
    const parts: Particle[] = [];
    for (let i = 0; i < N; i++) {
      const x = centerX - width + Math.random() * 2 * width;
      const y = baseY - Math.random() * 20 * dpr;
      const speed = (40 + temperature * 2) * (0.5 + Math.random());
      const angle = -Math.random() * (Math.PI / 2);
      parts.push({
        x,
        y,
        vx: speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        escaped: false,
      });
    }
    particlesRef.current = parts;
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
      initParticles();
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    initParticles();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initParticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceArea, temperature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = dimsRef.current;
    const baseY = h * 0.65;
    const width = (w * 0.6 * surfaceArea) / 2;
    const centerX = w * 0.5;
    const dt = isAnimating ? 0.016 : 0;

    const particles = particlesRef.current;
    let escapedCount = 0;

    if (isAnimating) {
      for (const p of particles) {
        if (p.escaped) {
          p.x += (windSpeed * 20 * dpr + p.vx * 0.1) * dt;
          p.y += p.vy * dt;
          if (p.y < 0 || p.x > w + 40 * dpr) continue;
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx += (Math.random() - 0.5) * 20 * dt;
          p.vy -= 10 * dt;
          if (p.y < baseY - 80 * dpr) {
            p.escaped = true;
          }
          if (p.y > baseY) {
            p.y = baseY - Math.random() * 10 * dpr;
            p.vy *= -0.3;
          }
        }
        if (p.escaped) escapedCount++;
      }
    } else {
      escapedCount = particles.filter((p) => p.escaped).length;
    }

    const rate = (escapedCount / (t + 0.1)) * (1 + 0.2 * windSpeed);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050911";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(59,130,246,0.85)";
    ctx.fillRect(centerX - width, baseY, 2 * width, h - baseY + 10 * dpr);

    for (const p of particles) {
      ctx.fillStyle = p.escaped ? "rgba(250,250,250,0.8)" : "rgba(191,219,254,0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(
      `Evaporation rate (arb.): ${formatNum(rate, 2)}   Temp: ${temperature} °C   Wind: ${windSpeed} m/s`,
      16 * dpr,
      h - 16 * dpr,
    );
  }, [temperature, surfaceArea, windSpeed, isAnimating, elapsedTime, t]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl
        label="Temperature"
        value={temperature}
        min={10}
        max={60}
        step={2}
        unit="°C"
        onChange={setTemperature}
        color="orange"
      />
      <SliderControl
        label="Surface area"
        value={surfaceArea}
        min={0.5}
        max={2}
        step={0.1}
        unit="×"
        onChange={setSurfaceArea}
        color="cyan"
      />
      <SliderControl
        label="Wind speed"
        value={windSpeed}
        min={0}
        max={5}
        step={0.5}
        unit="m/s"
        onChange={setWindSpeed}
        color="blue"
      />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">
          Cooling effect
        </div>
        <p className="mt-1 text-xs">
          Only high-energy particles escape. Remaining particles slow down → cooling. Higher
          temperature, larger area, and more wind increase evaporation.
        </p>
      </div>
    </>
  );

  return (
    <MatterShell
      title="Evaporation"
      subtitle="High-energy surface particles escape; remaining liquid cools."
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

