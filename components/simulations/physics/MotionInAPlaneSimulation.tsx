"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const G = 9.81;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function computeTrajectory(v0: number, angleDeg: number) {
  const theta = toRad(angleDeg);
  const vx = v0 * Math.cos(theta);
  const vy = v0 * Math.sin(theta);
  const tFlight = (2 * vy) / G;
  const range = vx * tFlight;
  const hMax = (vy * vy) / (2 * G);
  return { vx, vy, tFlight, range, hMax };
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="space-y-1 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-gray-900">
          {label}
        </label>
        <span className="text-sm font-bold tabular-nums text-gray-900">
          {value % 1 === 0 ? value : value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full appearance-none rounded-full bg-gray-200 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
        style={{ accentColor: "#3B82F6" }}
        aria-label={`${label}: ${value} ${unit}`}
      />
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

export default function MotionInAPlaneSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [v0, setV0] = useState(25);
  const [angleDeg, setAngleDeg] = useState(45);
  const [playing, setPlaying] = useState(true);
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const { vx, vy, tFlight, range, hMax } = computeTrajectory(v0, angleDeg);

  const reset = useCallback(() => {
    timeRef.current = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = container.clientWidth;
      h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const pad = 55;
    // Expand logical content so axes look longer; include negative y so
    // the y-axis extends below the origin (projectile has y-axis below it).
    const contentW = range * 1.4 + 30;
    const contentH = hMax * 1.4 + 25;
    const yMin = -Math.max(8, hMax * 0.15); // negative y below origin
    const rangeY = contentH - yMin;
    const scaleX = (w - pad * 2) / contentW;
    const scaleY = (h - pad * 2) / rangeY;
    const scale = Math.min(scaleX, scaleY, 8);
    const offsetX = pad + 15; // small margin so y-axis has room to the left
    const offsetY = pad + contentH * scale; // y=0 is here; y=contentH at top (pad), y=yMin at bottom (h-pad)

    const toPx = (x: number, y: number) => ({
      px: offsetX + x * scale,
      py: offsetY - y * scale,
    });

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      if (playing) {
        timeRef.current += 0.016;
        if (timeRef.current > tFlight) timeRef.current = 0;
      }

      const t = Math.min(timeRef.current, tFlight);
      const x = vx * t;
      const y = vy * t - 0.5 * G * t * t;

      ctx.fillStyle = "#E8EEF2";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(229, 231, 235, 0.6)";
      ctx.lineWidth = 1;
      const gridStep = 10;
      for (let gx = 0; gx <= contentW + 5; gx += gridStep) {
        const { px } = toPx(gx, 0);
        ctx.beginPath();
        ctx.moveTo(px, offsetY - contentH * scale);
        ctx.lineTo(px, offsetY - yMin * scale);
        ctx.stroke();
      }
      for (let gy = Math.ceil(yMin / gridStep) * gridStep; gy <= contentH + 5; gy += gridStep) {
        if (gy === 0) continue;
        const { px } = toPx(0, gy);
        const py = offsetY - gy * scale;
        ctx.beginPath();
        ctx.moveTo(offsetX, py);
        ctx.lineTo(offsetX + contentW * scale, py);
        ctx.stroke();
      }

      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#111827";
      ctx.font = "12px system-ui, sans-serif";
      // x-axis: extend left of origin and right (longer axis)
      const xAxisLen = 25;
      ctx.beginPath();
      ctx.moveTo(offsetX - xAxisLen, offsetY);
      ctx.lineTo(offsetX + contentW * scale + xAxisLen, offsetY);
      ctx.stroke();
      ctx.fillText("x", offsetX + contentW * scale + xAxisLen + 4, offsetY + 4);
      // y-axis: from below origin (yMin) to above (contentH) so projectile has y-axis below it
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY - yMin * scale);
      ctx.lineTo(offsetX, offsetY - contentH * scale);
      ctx.stroke();
      ctx.fillText("y", offsetX - 14, offsetY - contentH * scale - 4);

      const points: { x: number; y: number }[] = [];
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const ti = (i / steps) * tFlight;
        points.push({
          x: vx * ti,
          y: vy * ti - 0.5 * G * ti * ti,
        });
      }

      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      points.forEach((pt, i) => {
        const { px, py } = toPx(pt.x, pt.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const { px: ballPx, py: ballPy } = toPx(x, y);
      const grad = ctx.createRadialGradient(
        ballPx, ballPy, 0,
        ballPx, ballPy, 20
      );
      grad.addColorStop(0, "rgba(239, 68, 68, 0.95)");
      grad.addColorStop(0.5, "rgba(239, 68, 68, 0.6)");
      grad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ballPx, ballPy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.arc(ballPx, ballPy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const vxNow = vx;
      const vyNow = vy - G * t;
      const vMag = Math.sqrt(vxNow * vxNow + vyNow * vyNow);
      if (vMag > 1) {
        const ax = ballPx + (vxNow / vMag) * 25;
        const ay = ballPy - (vyNow / vMag) * 25;
        ctx.strokeStyle = "#059669";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ballPx, ballPy);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        const h = 8;
        const ux = vxNow / vMag;
        const uy = -vyNow / vMag;
        ctx.fillStyle = "#059669";
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - ux * h + uy * 4, ay - uy * h - ux * 4);
        ctx.lineTo(ax - ux * h - uy * 4, ay - uy * h + ux * 4);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = "#374151";
      ctx.font = "11px system-ui, sans-serif";
      // Info box well inside the canvas frame (clear margin from bottom edge)
      const infoY1 = h - 28;
      const infoY2 = h - 44;
      ctx.fillText(`t = ${t.toFixed(2)} s`, 10, infoY1);
      ctx.fillText(
        `Range: ${range.toFixed(1)} m  |  H = ${hMax.toFixed(1)} m`,
        10,
        infoY2
      );
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [v0, angleDeg, playing, tFlight, range, hMax, vx, vy]);

  return (
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Simulation Canvas (2 columns) */}
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-800 pb-4 mb-2">
                <div>
                  <div className="text-sm font-semibold text-white">Motion in a Plane</div>
                  <div className="text-xs text-neutral-400">Projectile trajectory (x, y)</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                  >
                    {playing ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0A0F1E]" style={{ aspectRatio: "16/10" }}>
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <canvas
                    ref={canvasRef}
                    className="max-h-full w-full rounded-lg object-contain"
                    style={{ aspectRatio: "16/10" }}
                    aria-label="Motion in a plane projectile simulation"
                  />
                </div>
              </div>
            </div>

            {/* Controls Panel (1 column) */}
            <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Parameters</h3>
                <div className="flex flex-col gap-3">
                  <SliderRow label="Initial speed" value={v0} min={5} max={60} step={1} unit="m/s"
                    onChange={(val) => { setV0(val); timeRef.current = 0; }} />
                  <SliderRow label="Launch angle" value={angleDeg} min={5} max={85} step={5} unit="°"
                    onChange={(val) => { setAngleDeg(val); timeRef.current = 0; }} />
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                <div className="text-xs font-bold text-cyan-400">LIVE VALUES</div>
                <div className="space-y-1 font-mono text-[11px] text-neutral-300">
                  <div>Range R = {range.toFixed(2)} m</div>
                  <div>Max height H = {hMax.toFixed(2)} m</div>
                  <div>Time of flight T = {tFlight.toFixed(2)} s</div>
                  <div>v₀ₓ = {vx.toFixed(2)} m/s, v₀ᵧ = {vy.toFixed(2)} m/s</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setV0(25); setAngleDeg(45); timeRef.current = 0; }}
                className="w-full rounded-xl border border-neutral-600 bg-neutral-800 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
              >
                Reset to default (25 m/s, 45°)
              </button>
            </aside>
          </div>
        </div>

        {/* Bottom Row: Info Panel */}
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">✨ THE CONCEPT</h4>
              <p className="text-sm mb-3">
                Motion in a plane is two-dimensional motion. For a projectile, position and velocity are vectors in the (x, y) plane. Horizontal motion is uniform; vertical motion is uniformly accelerated.
              </p>
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <div className="text-xs font-bold text-yellow-400 mb-1">📐 Projectile Relations</div>
                <div className="text-sm font-mono text-neutral-200">x = u cos θ · t, y = u sin θ · t − ½gt²</div>
                <div className="text-sm font-mono text-neutral-200">R = u² sin 2θ / g, H = u² sin²θ / (2g)</div>
              </div>
            </div>

            <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">⚡ ON THE GRAPH</h4>
              <p className="text-sm">
                The blue curve shows the full trajectory. The red ball marks the current position; the green arrow is the velocity vector. Changing u or θ updates the path and live R, H, T values.
              </p>
            </div>

            <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">💡 TRY THIS</h4>
              <div className="space-y-2 text-sm">
                <p>🎯 45° gives maximum range for a given speed.</p>
                <p>⚡ 90° gives straight up and down (zero range).</p>
                <p>🌟 Higher u → larger R and H.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
