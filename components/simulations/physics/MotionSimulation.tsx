"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function MotionSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [initialVelocity, setInitialVelocity] = useState(5);
  const [acceleration, setAcceleration] = useState(2);
  const [timeLimit, setTimeLimit] = useState(4);
  const [paused, setPaused] = useState(true);
  const [simTime, setSimTime] = useState(0);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [liveValueHighlight, setLiveValueHighlight] = useState(false);

  const t = Math.min(simTime, timeLimit);
  const finalVelocity = useMemo(() => initialVelocity + acceleration * t, [initialVelocity, acceleration, t]);
  const distance = useMemo(
    () => initialVelocity * t + 0.5 * acceleration * t * t,
    [initialVelocity, acceleration, t]
  );
  const averageSpeed = useMemo(() => (t > 0 ? distance / t : 0), [distance, t]);

  useEffect(() => {
    if (!liveValueHighlight) return;
    const id = setTimeout(() => setLiveValueHighlight(false), 500);
    return () => clearTimeout(id);
  }, [liveValueHighlight]);

  const handleInitialVelocityChange = (v: number) => {
    setInitialVelocity(v);
    setLiveValueHighlight(true);
  };
  const handleAccelerationChange = (a: number) => {
    setAcceleration(a);
    setLiveValueHighlight(true);
  };
  const handleTimeLimitChange = (x: number) => {
    setTimeLimit(x);
    setLiveValueHighlight(true);
  };
  const handleLaunch = () => {
    setSimTime(0);
    setPaused(false);
    setHasLaunched(true);
  };
  const handleReset = () => {
    setInitialVelocity(5);
    setAcceleration(2);
    setTimeLimit(4);
    setSimTime(0);
    setPaused(true);
    setHasLaunched(false);
  };

  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    let id: number;
    const tick = (now: number) => {
      id = requestAnimationFrame(tick);
      setSimTime((now - start) / 1000);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      draw(canvas, rect.width, rect.height, dpr, timeLimit);
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    draw(canvas, rect.width, rect.height, dpr, timeLimit);
    return () => ro.disconnect();
  }, [initialVelocity, acceleration, t, finalVelocity, distance, timeLimit]);

  function draw(
    canvas: HTMLCanvasElement,
    w: number,
    h: number,
    dpr: number,
    tMax: number
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const cx = cw / 2;
    const cy = ch / 2;
    ctx.clearRect(0, 0, cw, ch);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, cw, ch);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cw, ch) * 0.6);
    gradient.addColorStop(0, "rgba(34,211,238,0.04)");
    gradient.addColorStop(0.5, "transparent");
    gradient.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "rgba(148,163,184,0.2)";
    ctx.lineWidth = 1 * dpr;
    const grid = 24 * dpr;
    for (let x = 0; x <= cw; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y <= ch; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    const trackTop = cy + 20 * dpr;
    const trackBottom = cy + 40 * dpr;
    const trackLeft = 40 * dpr;
    const trackRight = cw - 40 * dpr;
    const trackW = trackRight - trackLeft;

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(trackLeft, (trackTop + trackBottom) / 2);
    ctx.lineTo(trackRight, (trackTop + trackBottom) / 2);
    ctx.stroke();

    const maxT = Math.max(0.01, tMax);
    const frac = Math.min(1, t / maxT);
    const dotX = trackLeft + frac * trackW;
    const dotY = (trackTop + trackBottom) / 2;

    ctx.fillStyle = "rgba(125,211,252,0.95)";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 8 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "left";
    const valuesY = trackBottom + 22 * dpr;
    const lineHeight = 14 * dpr;
    ctx.fillText(`v = ${formatNum(finalVelocity, 2)} m/s`, trackLeft, valuesY);
    ctx.fillText(`a = ${formatNum(acceleration, 2)} m/s²`, trackLeft, valuesY + lineHeight);
    ctx.fillText(`s = ${formatNum(distance, 2)} m`, trackLeft, valuesY + lineHeight * 2);
  }

  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-neutral-900 overflow-hidden rounded-xl ring-1 ring-cyan-500/15 shadow-[0_0_24px_-4px_rgba(34,211,238,0.08)]">
      <section className="flex flex-1 min-h-0 flex flex-col md:flex-row bg-neutral-900/95 rounded-xl overflow-hidden">
        <div className="w-full md:w-[65%] min-w-0 md:border-r border-neutral-600/80 flex flex-col p-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 mb-2 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span aria-hidden>⚙️</span>
                <span>Motion · Speed–Time Simulator</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Adjust velocity and acceleration to observe distance and speed.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-neutral-500 hidden sm:inline">Launch initializes the motion</span>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={hasLaunched}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  hasLaunched
                    ? "border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-default"
                    : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                }`}
              >
                Launch
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  hasLaunched
                    ? "bg-cyan-500 text-white hover:bg-cyan-400 shadow-sm"
                    : "bg-neutral-600 text-neutral-300 hover:bg-neutral-500"
                }`}
                aria-label={paused ? "Play" : "Pause"}
              >
                {paused ? "Play" : "Pause"}
              </button>
            </div>
          </div>
          <div ref={containerRef} className="relative flex-1 min-h-0 w-full rounded-xl border border-neutral-700 bg-[#0f172a] overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        <aside className="w-full md:w-[35%] md:min-w-[220px] flex flex-col gap-4 px-4 py-4 bg-neutral-900/80 overflow-auto min-h-0 border-t md:border-t-0 md:border-l border-neutral-600/80">
          <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shrink-0" aria-hidden />
                Velocity (m/s)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 tabular-nums w-6">0</span>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={initialVelocity}
                  onChange={(e) => handleInitialVelocityChange(Number(e.target.value))}
                  className="flex-1 h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-cyan-500/50"
                />
                <span className="text-[10px] text-neutral-500 tabular-nums w-6 text-right">20</span>
              </div>
              <div className="text-sm text-cyan-300 font-mono tabular-nums">{initialVelocity} m/s</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" aria-hidden />
                Acceleration (m/s²)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 tabular-nums w-6">0</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={acceleration}
                  onChange={(e) => handleAccelerationChange(Number(e.target.value))}
                  className="flex-1 h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-cyan-500/50"
                />
                <span className="text-[10px] text-neutral-500 tabular-nums w-6 text-right">10</span>
              </div>
              <div className="text-sm text-cyan-300 font-mono tabular-nums">{acceleration} m/s²</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" aria-hidden />
                Time (s)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 tabular-nums w-6">0</span>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={timeLimit}
                  onChange={(e) => handleTimeLimitChange(Number(e.target.value))}
                  className="flex-1 h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-cyan-500/50"
                />
                <span className="text-[10px] text-neutral-500 tabular-nums w-6 text-right">10</span>
              </div>
              <div className="text-sm text-cyan-300 font-mono tabular-nums">{timeLimit} s</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Live values</span>
            <div
              className={`rounded-lg border p-3 text-sm text-neutral-200 space-y-1 transition-all duration-300 ${
                liveValueHighlight
                  ? "border-cyan-400/50 bg-cyan-500/15 shadow-[0_0_12px_-2px_rgba(34,211,238,0.25)]"
                  : "border-cyan-500/25 bg-cyan-500/10"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span aria-hidden>📏</span>
                Distance = <span className="text-cyan-300 font-mono font-semibold">{formatNum(distance, 2)} m</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span aria-hidden>🚀</span>
                Final Velocity = <span className="text-cyan-300 font-mono font-semibold">{formatNum(finalVelocity, 2)} m/s</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span aria-hidden>📈</span>
                Average Speed = <span className="text-cyan-300 font-mono font-semibold">{formatNum(averageSpeed, 2)} m/s</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-auto rounded-xl border border-neutral-600 bg-neutral-800/80 px-3 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300 transition"
          >
            ↺ Reset
          </button>

          <p className="text-[11px] text-neutral-500 leading-snug border-t border-neutral-800 pt-3 mt-1">
            Try this: Increase acceleration while keeping time constant.
          </p>
        </aside>
      </section>
    </div>
  );
}
