"use client";

import React, { useEffect, useRef, useState } from "react";
import { MagnetismShell, SliderControl, MagnetismParamSection, MagnetismLiveCard } from "./MagnetismShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

type ViewMode = "vectors" | "filings" | "combined";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function MagneticFieldSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strength, setStrength] = useState(1.0);
  const [probeRadius, setProbeRadius] = useState(120);
  const [viewMode, setViewMode] = useState<ViewMode>("vectors");
  const [showField, setShowField] = useState(true);
  const [showFilings, setShowFilings] = useState(false);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [probeAngle, setProbeAngle] = useState(0);
  const [openField, setOpenField] = useState(true);
  const [openProbe, setOpenProbe] = useState(false);
  const [openView, setOpenView] = useState(false);
  const dimsRef = useRef({ w: 600, h: 320, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle();

  const t = isAnimating ? elapsedTime : 0;
  const pulse = 0.7 + 0.3 * Math.sin(t * 2.5);

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

  function fieldAt(x: number, y: number, cx: number, cy: number) {
    const dx = x - cx;
    const dy = y - cy;
    const r2 = dx * dx + dy * dy + 36 * 36;
    const m = 4200 * strength;
    const bx = (-3 * m * dx * dy) / (r2 * r2);
    const by = (m * (2 * dy * dy - dx * dx)) / (r2 * r2);
    const B = Math.sqrt(bx * bx + by * by);
    return { bx, by, B };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = dimsRef.current;
    const cx = w / 2;
    const cy = h / 2;

    // Darker background, higher contrast
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, w, h);

    // Bar magnet — ~12% larger, centered
    const magnetW = 100 * dpr;
    const magnetH = 32 * dpr;
    const my = cy - magnetH / 2;

    // Subtle pole glow (stronger field near poles)
    ctx.globalAlpha = 0.2 * (isAnimating ? pulse : 1);
    ctx.fillStyle = "rgba(239,68,68,0.5)";
    ctx.beginPath();
    ctx.ellipse(cx - magnetW / 4, cy, 22 * dpr, 16 * dpr, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(59,130,246,0.5)";
    ctx.beginPath();
    ctx.ellipse(cx + magnetW / 4, cy, 22 * dpr, 16 * dpr, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(239,68,68,0.95)";
    ctx.fillRect(cx - magnetW / 2, my, magnetW / 2, magnetH);
    ctx.fillStyle = "rgba(59,130,246,0.95)";
    ctx.fillRect(cx, my, magnetW / 2, magnetH);
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - magnetW / 2, my, magnetW, magnetH);
    ctx.fillStyle = "#080c14";
    ctx.font = `bold ${14 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", cx - magnetW / 4, cy);
    ctx.fillText("S", cx + magnetW / 4, cy);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Field lines — clearer, slightly higher opacity
    if (showFieldLines && (showField || viewMode === "combined")) {
      const lineCount = 10;
      for (let i = 0; i < lineCount; i++) {
        const seed = (i / lineCount) * 0.8 + 0.1;
        const startAngle = Math.PI * seed;
        const rx = magnetW * 1.2 + (i % 3) * 35 * dpr;
        const ry = magnetH * 3 + (i % 2) * 25 * dpr;
        ctx.strokeStyle = `rgba(34,211,238,${0.45 + 0.2 * (isAnimating ? pulse : 1)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, startAngle, startAngle + Math.PI * 2);
        ctx.stroke();
      }
    }

    // Vector arrows — ~28% fewer (grid 36), slightly larger (22), strength = opacity (strong near poles)
    if (showField && (viewMode === "vectors" || viewMode === "combined")) {
      const gridStep = 36 * dpr;
      let idx = 0;
      for (let gx = gridStep; gx < w - gridStep; gx += gridStep) {
        for (let gy = gridStep; gy < h - gridStep; gy += gridStep) {
          const { bx, by, B } = fieldAt(gx, gy, cx, cy);
          const scale = 100 * dpr;
          const len = Math.min(22 * dpr, B * scale);
          if (len < 3) continue;
          const ux = bx / (B || 1);
          const uy = by / (B || 1);
          const x2 = gx + ux * len;
          const y2 = gy + uy * len;
          const alpha = Math.min(0.95, 0.35 + B * 2.8);
          ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          const head = 8 * dpr;
          const ax = x2 - ux * head - uy * (head * 0.5);
          const ay = y2 - uy * head + ux * (head * 0.5);
          const bx2 = x2 - ux * head + uy * (head * 0.5);
          const by2 = y2 - uy * head - ux * (head * 0.5);
          ctx.fillStyle = `rgba(34,211,238,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(ax, ay);
          ctx.lineTo(bx2, by2);
          ctx.closePath();
          ctx.fill();
          idx++;
        }
      }
    }

    // Iron filings
    if (showFilings || viewMode === "filings") {
      const filingsCount = 200;
      for (let i = 0; i < filingsCount; i++) {
        const px = cx + (Math.random() - 0.5) * 280 * dpr;
        const py = cy + (Math.random() - 0.5) * 180 * dpr;
        const { bx, by, B } = fieldAt(px, py, cx, cy);
        if (B < 0.01) continue;
        const ux = bx / B;
        const uy = by / B;
        const half = 6 * dpr;
        ctx.strokeStyle = `rgba(148,163,184,${0.5 + 0.2 * Math.min(1, B * 2)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px - ux * half, py - uy * half);
        ctx.lineTo(px + ux * half, py + uy * half);
        ctx.stroke();
      }
    }

    // Probe position and field at probe
    const probeTheta = (probeAngle * Math.PI) / 180;
    const pr = probeRadius * (w / 600);
    const probeX = cx + pr * Math.cos(probeTheta);
    const probeY = cy + pr * Math.sin(probeTheta);
    const { bx: pbx, by: pby, B: pB } = fieldAt(probeX, probeY, cx, cy);
    const fieldAngleDeg = (Math.atan2(pby, pbx) * 180) / Math.PI;

    // Probe: clear circle + vector arrow with clear head + B label
    const probeCircleR = 14 * dpr;
    ctx.fillStyle = "rgba(30,41,59,0.95)";
    ctx.strokeStyle = "rgba(34,211,238,0.8)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(probeX, probeY, probeCircleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const needleLen = 40 * dpr;
    const ux = pbx / (pB || 1);
    const uy = pby / (pB || 1);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(34,211,238,0.95)";
    ctx.beginPath();
    ctx.moveTo(probeX - ux * needleLen, probeY - uy * needleLen);
    ctx.lineTo(probeX + ux * needleLen, probeY + uy * needleLen);
    ctx.stroke();
    ctx.fillStyle = "rgba(239,68,68,0.95)";
    ctx.beginPath();
    ctx.arc(probeX + ux * needleLen * 0.55, probeY + uy * needleLen * 0.55, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    const head = 10 * dpr;
    ctx.fillStyle = "rgba(34,211,238,0.95)";
    ctx.beginPath();
    ctx.moveTo(probeX + ux * needleLen, probeY + uy * needleLen);
    ctx.lineTo(probeX + ux * (needleLen - head) - uy * (head * 0.6), probeY + uy * (needleLen - head) + ux * (head * 0.6));
    ctx.lineTo(probeX + ux * (needleLen - head) + uy * (head * 0.6), probeY + uy * (needleLen - head) - ux * (head * 0.6));
    ctx.closePath();
    ctx.fill();

    // B value label near probe
    const BDisplay = (pB * 12 * strength) / 1000;
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `bold ${12 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`B ≈ ${formatNum(BDisplay, 2)} T`, probeX, probeY + probeCircleR + 16 * dpr);
    ctx.textAlign = "left";
  }, [strength, probeRadius, viewMode, showField, showFilings, showFieldLines, probeAngle, isAnimating, elapsedTime, pulse, t]);

  // Live readout and insight (logical coords)
  const cx = 600 / 2;
  const cy = 320 / 2;
  const probeTheta = (probeAngle * Math.PI) / 180;
  const probeX = cx + probeRadius * Math.cos(probeTheta);
  const probeY = cy + probeRadius * Math.sin(probeTheta);
  const { bx: pbx, by: pby, B: pB } = (function () {
    const dx = probeX - cx;
    const dy = probeY - cy;
    const r2 = dx * dx + dy * dy + 36 * 36;
    const m = 4200 * strength;
    const bx = (-3 * m * dx * dy) / (r2 * r2);
    const by = (m * (2 * dy * dy - dx * dx)) / (r2 * r2);
    return { bx, by, B: Math.sqrt(bx * bx + by * by) };
  })();
  const BDisplay = (pB * 12 * strength) / 1000;
  const fieldAngleDeg = (Math.atan2(pby, pbx) * 180) / Math.PI;
  const distFromCenter = Math.hypot(probeX - cx, probeY - cy);
  const nearPole = distFromCenter < 90;
  const farFromPole = distFromCenter > 160;
  const liveInsight =
    nearPole
      ? "Field strength: high (near pole)"
      : farFromPole
        ? "Field strength: low (far from poles)"
        : "Field is strongest near poles.";

  const sidebar = (
    <>
      <MagnetismParamSection title="Field" open={openField} onToggle={() => setOpenField(!openField)} theme="field">
        <SliderControl
          label="Magnet strength"
          value={strength}
          min={0.5}
          max={2}
          step={0.1}
          unit="×"
          onChange={setStrength}
          color="blue"
          isActive={isAnimating}
        />
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={showFieldLines}
              onChange={(e) => setShowFieldLines(e.target.checked)}
              className="rounded border-slate-500 accent-cyan-400"
            />
            Field lines ON/OFF
          </label>
        </div>
      </MagnetismParamSection>
      <MagnetismParamSection title="Probe settings" open={openProbe} onToggle={() => setOpenProbe(!openProbe)} theme="cyan">
        <SliderControl
          label="Probe distance"
          value={probeRadius}
          min={40}
          max={200}
          step={10}
          unit="px"
          onChange={setProbeRadius}
          color="violet"
        />
        <SliderControl
          label="Probe angle"
          value={probeAngle}
          min={0}
          max={360}
          step={15}
          unit="°"
          onChange={setProbeAngle}
          color="cyan"
        />
      </MagnetismParamSection>
      <MagnetismParamSection title="View (advanced)" open={openView} onToggle={() => setOpenView(!openView)} theme="output">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Mode</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            aria-label="Toggle reflection insight"
            className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-2.5 py-1.5 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          >
            <option value="vectors">Vectors + compass</option>
            <option value="filings">Iron filings</option>
            <option value="combined">Lines + vectors + filings</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={showField} onChange={(e) => setShowField(e.target.checked)} className="rounded border-slate-500 accent-cyan-400" />
            Vectors
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={showFilings} onChange={(e) => setShowFilings(e.target.checked)} className="rounded border-slate-500 accent-cyan-400" />
            Filings
          </label>
        </div>
      </MagnetismParamSection>
      <div className="border-t border-slate-700/60 pt-2">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">Live readouts</div>
        <div className="grid grid-cols-2 gap-2">
          <MagnetismLiveCard label="B" value={formatNum(BDisplay, 2)} unit="T" active={isAnimating} />
          <MagnetismLiveCard label="Angle" value={formatNum(fieldAngleDeg, 0)} unit="°" active={isAnimating} />
        </div>
      </div>
    </>
  );

  const footer = (
    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Live insight:</span>
      <p className="mt-1 text-sm text-slate-200">{liveInsight}</p>
    </div>
  );

  return (
    <MagnetismShell
      title="Magnetic Field (Bar Magnet)"
      subtitle="Direction N → S · Stronger near poles · Weaker with distance."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
      footer={footer}
      layoutVariant="generator"
    >
      <div ref={containerRef} className="flex min-h-0 w-full flex-1 flex-col p-4">
        <canvas
          ref={canvasRef}
          className="block h-full w-full flex-1 min-h-0 rounded-lg"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </MagnetismShell>
  );
}
