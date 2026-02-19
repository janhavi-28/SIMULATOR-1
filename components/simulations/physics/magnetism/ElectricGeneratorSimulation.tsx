"use client";

import React, { useEffect, useRef, useState } from "react";
import { MagnetismShell, MagnetismParamSection } from "./MagnetismShell";
import { MagnetismSlider } from "./MagnetismLayout";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

const N_TURNS = 100;

type EmfPhase = "zero" | "increasing" | "maximum" | "decreasing" | "minimum";

function getEmfPhase(angle: number, peakEmf: number, emf: number): EmfPhase {
  if (peakEmf < 0.001) return "zero";
  const norm = emf / peakEmf;
  if (Math.abs(norm) < 0.15) return "zero";
  if (norm > 0.85) return "maximum";
  if (norm < -0.85) return "minimum";
  return Math.cos(angle) > 0 ? "increasing" : "decreasing";
}

function getEmfLabel(phase: EmfPhase): string {
  switch (phase) {
    case "zero":
      return "EMF = 0 V (coil parallel to field)";
    case "increasing":
      return "EMF increasing";
    case "maximum":
      return "EMF maximum";
    case "decreasing":
      return "EMF decreasing";
    case "minimum":
      return "EMF negative maximum";
    default:
      return "EMF";
  }
}

const EXPLANATIONS = [
  "Rotating coil cuts magnetic field lines.",
  "This produces electric voltage (EMF).",
  "Maximum voltage occurs when cutting is fastest (coil perpendicular to field).",
];

export default function ElectricGeneratorSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState(1);
  const [B, setB] = useState(0.5);
  const [area, setArea] = useState(0.02);
  const [showExplanation, setShowExplanation] = useState(false);
  const [openParams, setOpenParams] = useState(true);
  const dimsRef = useRef({ w: 800, h: 320, dpr: 1 });
  const graphDimsRef = useRef({ w: 600, h: 140, dpr: 1 });
  const angleRef = useRef(0);

  const { hasLaunched, isPaused, launch, pause, reset, isAnimating } =
    useSimulationLifecycle({ onReset: () => (angleRef.current = 0) });

  if (isAnimating) angleRef.current += speed * 50 * 0.016;
  const angle = angleRef.current;
  const omega = speed * 50;
  const E0 = N_TURNS * B * area * omega * 1e-3;
  const emf = E0 * Math.sin(angle);
  const peakEmf = E0;
  const angleNorm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const emfPhase = getEmfPhase(angleNorm, peakEmf, emf);
  const emfLabel = getEmfLabel(emfPhase);
  const isEmfMax = emfPhase === "maximum" || emfPhase === "minimum";
  const showCurrentArrows = Math.abs(emf) > peakEmf * 0.2;
  const angleDeg = (angleNorm * 180) / Math.PI;
  const angleDegDisplay = formatNum(angleDeg, 1);

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
    const cx = w / 2;
    const cy = h * 0.42;
    const coilW = 88 * dpr;
    const coilH = 44 * dpr;
    const magnetW = 88 * dpr;
    const magnetH = 26 * dpr;
    const my = cy - magnetH - 40 * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    // Rectangular field region between N and S (no oval)
    const fieldLeft = cx - 95 * dpr;
    const fieldRight = cx + 95 * dpr;
    const fieldTop = my + magnetH;
    const fieldBottom = cy + 20 * dpr;

    // 4–6 straight horizontal field lines (N → S), evenly spaced, with arrows
    const lineCount = 5;
    const lineStep = (fieldBottom - fieldTop) / (lineCount + 1);
    const arrowSize = 8 * dpr;
    for (let i = 1; i <= lineCount; i++) {
      const ly = fieldTop + lineStep * i;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(fieldLeft, ly);
      ctx.lineTo(fieldRight, ly);
      ctx.stroke();
      // Arrow N → S (rightward)
      ctx.fillStyle = "rgba(59, 130, 246, 0.7)";
      ctx.beginPath();
      ctx.moveTo(fieldRight - arrowSize, ly - arrowSize * 0.5);
      ctx.lineTo(fieldRight, ly);
      ctx.lineTo(fieldRight - arrowSize, ly + arrowSize * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    // Magnet: N (red) and S (blue)
    ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
    ctx.fillRect(cx - magnetW / 2, my, magnetW / 2, magnetH);
    ctx.fillStyle = "rgba(59, 130, 246, 0.95)";
    ctx.fillRect(cx, my, magnetW / 2, magnetH);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - magnetW / 2, my, magnetW, magnetH);
    ctx.fillStyle = "#0f172a";
    ctx.font = `bold ${12 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("N", cx - magnetW / 4, my + magnetH / 2 + 4 * dpr);
    ctx.fillText("S", cx + magnetW / 4, my + magnetH / 2 + 4 * dpr);
    ctx.textAlign = "left";

    // Rotation axis (horizontal through coil center)
    const axisY = cy + 6 * dpr;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 100 * dpr, axisY);
    ctx.lineTo(cx + 100 * dpr, axisY);
    ctx.stroke();
    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.font = `${11 * dpr}px system-ui, sans-serif`;
    ctx.fillText("axis", cx + 102 * dpr, axisY + 4 * dpr);

    // Rotation direction arrow (ω)
    const ax = cx + 78 * dpr;
    const ay = axisY - 18 * dpr;
    ctx.strokeStyle = "rgba(34, 211, 238, 0.95)";
    ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ax, ay, 12 * dpr, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax + 10 * dpr, ay - 6 * dpr);
    ctx.lineTo(ax + 4 * dpr, ay);
    ctx.lineTo(ax + 10 * dpr, ay + 6 * dpr);
    ctx.fill();
    ctx.fillStyle = "rgba(148, 163, 184, 0.95)";
    ctx.fillText("ω", ax, ay + 22 * dpr);

    // Angle θ indicator: use normalized angle so arc stays 0–360°
    const angleNorm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * dpr, 0, angleNorm);
    ctx.stroke();
    ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
    ctx.font = `${10 * dpr}px system-ui, sans-serif`;
    const thetaX = cx + 36 * dpr * Math.cos(angleNorm / 2);
    const thetaY = cy - 36 * dpr * Math.sin(angleNorm / 2);
    ctx.fillText("θ", thetaX - 4 * dpr, thetaY + 4 * dpr);

    // Coil: slightly larger, thin stroke, centered (rotate by angle for smooth motion)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = isEmfMax ? "rgba(251, 191, 36, 0.2)" : "rgba(30, 41, 59, 0.9)";
    ctx.strokeStyle = isEmfMax ? "rgba(251, 191, 36, 0.9)" : "rgba(251, 191, 36, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-coilW / 2, -coilH / 2, coilW, coilH);
    ctx.fillRect(-coilW / 2, -coilH / 2, coilW, coilH);

    // Current direction: positive EMF → clockwise; negative EMF → anticlockwise
    if (showCurrentArrows) {
      const clockwise = emf >= 0;
      ctx.strokeStyle = "rgba(34, 197, 94, 0.95)";
      ctx.fillStyle = "rgba(34, 197, 94, 0.95)";
      ctx.lineWidth = 2;
      const a = 12 * dpr;
      const margin = 6 * dpr;
      // Arrows on each side of rectangle: top → right → bottom → left (CW) or reverse (CCW)
      const drawArrow = (x1: number, y1: number, x2: number, y2: number, tip: "end" | "start") => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const perpX = -uy;
        const perpY = ux;
        const tx = tip === "end" ? x2 : x1;
        const ty = tip === "end" ? y2 : y1;
        const back = tip === "end" ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + back * (a * ux - a * 0.5 * perpX), ty + back * (a * uy - a * 0.5 * perpY));
        ctx.lineTo(tx + back * (a * ux + a * 0.5 * perpX), ty + back * (a * uy + a * 0.5 * perpY));
        ctx.closePath();
        ctx.fill();
      };
      const halfW = coilW / 2 - margin;
      const halfH = coilH / 2 - margin;
      if (clockwise) {
        drawArrow(-halfW, -halfH, halfW, -halfH, "end");
        drawArrow(halfW, -halfH, halfW, halfH, "end");
        drawArrow(halfW, halfH, -halfW, halfH, "end");
        drawArrow(-halfW, halfH, -halfW, -halfH, "end");
      } else {
        drawArrow(-halfW, -halfH, -halfW, halfH, "end");
        drawArrow(-halfW, halfH, halfW, halfH, "end");
        drawArrow(halfW, halfH, halfW, -halfH, "end");
        drawArrow(halfW, -halfH, -halfW, -halfH, "end");
      }
    }
    ctx.restore();

    ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
    ctx.font = `${10 * dpr}px system-ui, sans-serif`;
    ctx.fillText("Coil", cx - 18 * dpr, cy + coilH / 2 + 20 * dpr);
  }, [angle, isEmfMax, showCurrentArrows, emf]);

  const sidebar = (
    <div className="space-y-4">
      <MagnetismParamSection
        title="Parameters"
        open={openParams}
        onToggle={() => setOpenParams(!openParams)}
        theme="field"
      >
        <div title="Faster rotation produces higher frequency electricity.">
          <MagnetismSlider
            label="Rotation speed"
            value={speed}
            min={0.3}
            max={2.5}
            step={0.2}
            unit="×"
            onChange={setSpeed}
            theme="cyan"
            isActive={isAnimating}
          />
        </div>
        <div title="Stronger magnetic field produces larger voltage.">
          <MagnetismSlider
            label="Magnetic field strength"
            value={B}
            min={0.2}
            max={1.2}
            step={0.1}
            unit="T"
            onChange={setB}
            theme="violet"
            isActive={isAnimating}
          />
        </div>
        <div title="Larger coil area cuts more field lines, producing more voltage.">
          <MagnetismSlider
            label="Coil area"
            value={area}
            min={0.01}
            max={0.05}
            step={0.005}
            unit="m²"
            onChange={setArea}
            theme="cyan"
            isActive={isAnimating}
          />
        </div>
      </MagnetismParamSection>

      <div className="rounded-lg border border-slate-600/60 bg-slate-800/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-700/40 transition-colors"
        >
          <span>Show explanation</span>
          <span className="text-slate-400 text-xs">{showExplanation ? "On" : "Off"}</span>
        </button>
        {showExplanation && (
          <ul className="px-3 pb-3 pt-0 border-t border-slate-700/60 space-y-2 text-xs text-slate-300 list-disc list-inside">
            {EXPLANATIONS.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <MagnetismShell
      title="Electric Generator"
      subtitle="Rotation → changing flux → EMF → AC waveform"
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
      layoutVariant="generator"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5 p-0">
        {/* 1. Generator (top) */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 rounded-xl overflow-hidden relative"
          style={{ backgroundColor: "#0f172a", minHeight: 260 }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-xl"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* 2. Live EMF + Angle (below generator) — Rotation → EMF */}
        <div className="shrink-0 px-4 py-3 rounded-xl border border-slate-600/60 bg-slate-800/60">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-sm font-medium text-slate-300">Live:</span>
            <span
              className={
                isEmfMax
                  ? "text-amber-300 font-semibold"
                  : "text-cyan-300 font-mono"
              }
            >
              {emfLabel}
            </span>
            <span className="text-slate-400 font-mono text-sm">
              EMF = {formatNum(emf, 2)} V
            </span>
            <span className="text-slate-400 font-mono text-sm">
              θ = {angleDegDisplay}°
            </span>
          </div>
        </div>

        {/* 3. Waveform (below) — EMF → Graph */}
        <div className="shrink-0 rounded-xl border border-slate-600/60 bg-slate-900/50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-slate-300">
              EMF vs Time (synchronized with coil rotation)
            </span>
          </div>
          <div className="relative h-[140px] px-4 py-3">
            <WaveformGraph
              graphRef={graphRef}
              angle={angle}
              peakEmf={peakEmf}
              emf={emf}
              isAnimating={isAnimating}
              graphDimsRef={graphDimsRef}
            />
          </div>
          <div className="px-4 py-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>X-axis: Time</span>
            <span>Y-axis: EMF (V)</span>
            <span>Peak: {formatNum(peakEmf, 2)} V</span>
          </div>
        </div>
      </div>
    </MagnetismShell>
  );
}

function WaveformGraph({
  graphRef,
  angle,
  peakEmf,
  emf,
  isAnimating,
  graphDimsRef,
}: {
  graphRef: React.RefObject<HTMLCanvasElement | null>;
  angle: number;
  peakEmf: number;
  emf: number;
  isAnimating: boolean;
  graphDimsRef: React.MutableRefObject<{ w: number; h: number; dpr: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = graphRef.current;
    if (!container || !canvas) return;
    const update = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);
      canvas.width = w;
      canvas.height = h;
      graphDimsRef.current = { w, h, dpr };
      setDims({ w, h });
    };
    const ro = new ResizeObserver(update);
    ro.observe(container);
    update();
    return () => ro.disconnect();
  }, [graphRef, graphDimsRef]);

  useEffect(() => {
    const canvas = graphRef.current;
    if (!canvas || dims.w === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = graphDimsRef.current;
    const padL = 36 * dpr;
    const padR = 12 * dpr;
    const padT = 12 * dpr;
    const padB = 28 * dpr;
    const gx = padL;
    const gy = padT;
    const gw = w - padL - padR;
    const gh = h - padT - padB;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(gx, gy + (gh * i) / 4);
      ctx.lineTo(gx + gw, gy + (gh * i) / 4);
      ctx.stroke();
    }
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(gx + (gw * i) / 4, gy);
      ctx.lineTo(gx + (gw * i) / 4, gy + gh);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gx, gy, gw, gh);

    const scale = peakEmf > 0 ? gh / (2 * peakEmf) : 1;
    const midY = gy + gh / 2;

    // Horizontal center line at 0 V
    ctx.strokeStyle = "rgba(100, 116, 139, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(gx, midY);
    ctx.lineTo(gx + gw, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sine wave
    const points = 150;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const t = (i / points) * 2 * Math.PI + angle;
      const e = peakEmf * Math.sin(t);
      const x = gx + (i / points) * gw;
      const y = midY - e * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Peak value labels on graph
    if (peakEmf >= 0.01) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
      ctx.font = `${10 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(`+${peakEmf.toFixed(2)} V`, gx + gw - 4, gy + 12 * dpr);
      ctx.fillText(`-${peakEmf.toFixed(2)} V`, gx + gw - 4, gy + gh - 4);
      ctx.textAlign = "left";
    }

    // Current time marker (vertical line)
    const angleNorm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const cursorX = gx + (angleNorm / (2 * Math.PI)) * gw;
    if (cursorX >= gx && cursorX <= gx + gw) {
      ctx.strokeStyle = "rgba(251, 191, 36, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cursorX, gy);
      ctx.lineTo(cursorX, gy + gh);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
      ctx.beginPath();
      ctx.arc(cursorX, midY - emf * scale, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axis labels: Y-axis "EMF (V)", X-axis "Time", 0 at center
    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.font = `${11 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("0 V", gx - 18 * dpr, midY + 4 * dpr);
    ctx.fillText("Time", gx + gw / 2, h - 6 * dpr);
    ctx.textAlign = "right";
    ctx.fillText("EMF (V)", gx - 8 * dpr, gy + 10 * dpr);
    ctx.textAlign = "left";
  }, [angle, peakEmf, emf, isAnimating, dims, graphDimsRef, graphRef]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <canvas
        ref={graphRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
