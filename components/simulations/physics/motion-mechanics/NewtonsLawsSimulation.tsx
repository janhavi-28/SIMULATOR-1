"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorShell, SliderControl } from "./SimulatorShell";

type Law = "first" | "second" | "third";

export default function NewtonsLawsSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [law, setLaw] = useState<Law>("first");
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [frictionOn, setFrictionOn] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [force, setForce] = useState(20);
  const [mass, setMass] = useState(5);
  const lastTsRef = useRef<number | null>(null);
  const vRef = useRef(0);
  const xRef = useRef(0.15);

  useEffect(() => {
    if (!hasLaunched || paused) return;
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? Math.min(0.04, (ts - lastTsRef.current) / 1000) : 0;
      lastTsRef.current = ts;
      let a = 0;
      if (law === "first") a = frictionOn ? -0.5 * Math.sign(vRef.current) : 0;
      if (law === "second") a = mass > 0 ? force / mass : 0;
      vRef.current += a * dt;
      xRef.current += vRef.current * dt;
      xRef.current = Math.max(0.05, Math.min(0.9, xRef.current));
      if (frictionOn && law === "first") vRef.current *= 0.98;
      setSimTime((t) => t + dt);
    };
    lastTsRef.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused, law, frictionOn, force, mass]);

  const launch = () => {
    setSimTime(0);
    vRef.current = law === "first" ? 0.08 : 0;
    xRef.current = 0.15;
    setPaused(false);
    setHasLaunched(true);
  };
  const reset = () => {
    setSimTime(0);
    vRef.current = 0;
    xRef.current = 0.15;
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
    const plotW = w - 2 * pad;
    const cy = h / 2;
    const objX = pad + xRef.current * plotW;

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(148,163,184,0.3)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(pad, cy);
    ctx.lineTo(w - pad, cy);
    ctx.stroke();

    if (law === "first") {
      ctx.fillStyle = "#64748b";
      ctx.fillRect(objX - 24, cy - 20, 48, 40);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.strokeRect(objX - 24, cy - 20, 48, 40);
      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.font = `${10 * dpr}px system-ui`;
      ctx.fillText("No net F → constant v", pad, cy - 35);
      if (frictionOn) ctx.fillText("Friction on → slows down", pad, cy + 35);
    }

    if (law === "second") {
      const a = mass > 0 ? force / mass : 0;
      ctx.fillStyle = "#64748b";
      ctx.fillRect(objX - 24, cy - 20, 48, 40);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.strokeRect(objX - 24, cy - 20, 48, 40);
      ctx.fillStyle = "#22c55e";
      ctx.font = `${10 * dpr}px system-ui`;
      const fLen = Math.min(50, force * 1.2) * dpr;
      ctx.beginPath();
      ctx.moveTo(objX + 28, cy);
      ctx.lineTo(objX + 28 + fLen, cy);
      ctx.lineWidth = 3 * dpr;
      ctx.stroke();
      ctx.fillText("F", objX + 28 + fLen / 2 - 4, cy - 10);
      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.fillText(`a = F/m = ${a.toFixed(2)}`, pad, cy - 35);
    }

    if (law === "third") {
      const wallX = w - pad - 60;
      ctx.fillStyle = "rgba(71,85,105,0.9)";
      ctx.fillRect(wallX, cy - 50, 24, 100);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(objX - 24, cy - 18, 48, 36);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      ctx.moveTo(objX + 24, cy);
      ctx.lineTo(wallX - 20, cy);
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(wallX - 20, cy);
      ctx.lineTo(wallX - 20 - 35, cy);
      ctx.stroke();
      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.font = `${10 * dpr}px system-ui`;
      ctx.fillText("Action", objX + 30, cy - 12);
      ctx.fillText("Reaction", wallX - 55, cy - 12);
    }

    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.fillText(law === "first" ? "1st: Inertia" : law === "second" ? "2nd: F = ma" : "3rd: Action–reaction", pad, 24);
  }, [law, frictionOn, force, mass, simTime]);

  return (
    <SimulatorShell
      title="Newton's Laws of Motion"
      subtitle="Toggle First / Second / Third law. See cause and effect."
      onLaunch={launch}
      onPause={() => setPaused((p) => !p)}
      onReset={reset}
      paused={paused}
      hasLaunched={hasLaunched}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Law</h3>
          <div className="flex flex-col gap-2">
            {(["first", "second", "third"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLaw(l)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-medium border transition ${
                  law === l ? "border-cyan-400 bg-cyan-500/20 text-white" : "border-neutral-600 bg-neutral-800/60 text-neutral-400"
                }`}
              >
                {l === "first" && "First: Inertia (no net F → constant v)"}
                {l === "second" && "Second: F = ma"}
                {l === "third" && "Third: Action–reaction pairs"}
              </button>
            ))}
          </div>
          {law === "first" && (
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input type="checkbox" checked={frictionOn} onChange={(e) => setFrictionOn(e.target.checked)} className="rounded bg-neutral-700 border-neutral-600 text-cyan-500" />
              <span className="text-sm text-neutral-300">Friction</span>
            </label>
          )}
          {law === "second" && (
            <>
              <SliderControl label="F" value={force} min={5} max={50} step={2} unit="N" onChange={setForce} />
              <SliderControl label="m" value={mass} min={1} max={12} step={0.5} unit="kg" onChange={setMass} />
            </>
          )}
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm">
            {law === "first" && <div>Net F = 0 → v constant. Friction breaks that.</div>}
            {law === "second" && <div>a = F/m = {(mass > 0 ? force / mass : 0).toFixed(2)} m/s²</div>}
            {law === "third" && <div>Force on wall = − force on block.</div>}
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
