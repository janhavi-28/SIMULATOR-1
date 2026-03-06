"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ParameterRecord {
  timestamp: number;
  value: number;
  calculatedResults: { [key: string]: number };
}

interface ParameterState {
  current: number;
  history: ParameterRecord[];
  peak: ParameterRecord | null;
  average: number;
}

interface ParameterSliderSpec {
  label: string;
  paramKey: keyof SimParams;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  icon?: string;
  dramaticRange?: [number, number];
}

type SimParams = {
  trainVelocity: number;
  ballSpeed: number;
  ballAngleDeg: number;
  gravity: number;
};

const GRAVITY = 9.81;

const DEFAULT_PARAMS: SimParams = {
  trainVelocity: 10,
  ballSpeed: 12,
  ballAngleDeg: 90,
  gravity: GRAVITY,
};

// ─── Physics (Galilean transformation) ────────────────────────────────────────

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function getBallVelocityInGround(params: SimParams) {
  const theta = toRad(params.ballAngleDeg);
  const vxTrain = params.ballSpeed * Math.cos(theta);
  const vyTrain = params.ballSpeed * Math.sin(theta);
  return {
    vxGround: params.trainVelocity + vxTrain,
    vyGround: vyTrain,
    vxTrain,
    vyTrain,
  };
}

function getTimeOfFlight(params: SimParams): number {
  const { vyTrain } = getBallVelocityInGround(params);
  if (vyTrain <= 0) return 0;
  return (2 * vyTrain) / params.gravity;
}

function getGroundPosition(
  params: SimParams,
  t: number
): { x: number; y: number; xTrain: number } {
  const { vxGround, vyGround } = getBallVelocityInGround(params);
  const x = vxGround * t;
  const y = vyGround * t - 0.5 * params.gravity * t * t;
  const xTrain = params.trainVelocity * t;
  return { x, y, xTrain };
}

function getTrainFramePosition(
  params: SimParams,
  t: number
): { x: number; y: number } {
  const { x, xTrain } = getGroundPosition(params, t);
  const xPrime = x - xTrain;
  const yPrime =
    getBallVelocityInGround(params).vyTrain * t -
    0.5 * params.gravity * t * t;
  return { x: xPrime, y: yPrime };
}

// ─── Bounds for auto-scale ───────────────────────────────────────────────────

// Extra padding in world-units around the trajectory so that
// the full motion comfortably fits inside the visible frame.
const VIEW_PADDING = 36;

function getSimulationBounds(params: SimParams) {
  const tFlight = getTimeOfFlight(params);
  const { vxGround, vyGround, vxTrain } = getBallVelocityInGround(params);
  if (tFlight <= 0) return { width: 40, height: 20, centerX: 20, centerY: 10, range: 20, trainRange: 20, maxHeight: 10 };
  const range = vxGround * tFlight;
  const trainRange = Math.abs(vxTrain) * tFlight; // horizontal extent in train frame
  const maxHeight =
    vyGround > 0 ? (vyGround * vyGround) / (2 * params.gravity) : 0;
  const trainEnd = params.trainVelocity * tFlight;
  const minX = Math.min(0, trainEnd - 5);
  const maxX = Math.max(range, trainEnd + 5);
  const width = maxX - minX;
  const height = Math.max(20, maxHeight * 1.4);
  const centerX = (minX + maxX) / 2;
  const centerY = Math.max(10, maxHeight / 2);
  return { width, height, centerX, centerY, range, trainRange, maxHeight: Math.max(5, maxHeight) };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNum(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function interpolate(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

// ─── Slider component ────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  icon,
  dramaticRange,
  onChange,
  color = "#38bdf8",
}: Omit<ParameterSliderSpec, "paramKey" | "defaultValue"> & {
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {label}
        </span>
        <span className="text-sm text-neutral-400 tabular-nums">
          {formatNum(value, step < 1 ? 2 : 1)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="relative">
        {dramaticRange && (
          <div
            className="pointer-events-none absolute top-1.5 h-1.5 rounded-full bg-amber-500/30"
            style={{
              left: `${((dramaticRange[0] - min) / (max - min)) * 100}%`,
              width: `${((dramaticRange[1] - dramaticRange[0]) / (max - min)) * 100}%`,
            }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="physics-range w-full"
          style={{ accentColor: color }}
          aria-label={label}
        />
      </div>
      <div className="flex justify-between text-[10px] text-neutral-600">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

// ─── Simulation canvas (single panel: either Train frame OR Ground frame) ─────

function SimulationCanvas({
  variant,
  params,
  simTime,
  smoothParams,
  scale,
  setScale,
  trailPoints,
}: {
  variant: "train" | "ground";
  params: SimParams;
  simTime: number;
  smoothParams: SimParams;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  trailPoints: { x: number; y: number; xT: number; yT: number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef({ width: 800, height: 400 });

  const drawArrow = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      color: string,
      dpr: number
    ) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1e-6;
      const ux = dx / len;
      const uy = dy / len;
      const head = 10 * dpr;
      const wing = 6 * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - ux * head - uy * wing, y1 - uy * head + ux * wing);
      ctx.lineTo(x1 - ux * head + uy * wing, y1 - uy * head - ux * wing);
      ctx.closePath();
      ctx.fill();
    },
    []
  );

  const drawObserver = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      px: number,
      py: number,
      dpr: number,
      label: string,
      color: string
    ) => {
      const scale = dpr;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2 * scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const headR = 5 * scale;
      const bodyH = 12 * scale;
      ctx.beginPath();
      ctx.arc(px, py - headR - bodyH / 2, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, py - bodyH / 2);
      ctx.lineTo(px, py + bodyH / 2);
      ctx.moveTo(px - 6 * scale, py);
      ctx.lineTo(px + 6 * scale, py);
      ctx.moveTo(px, py + bodyH / 2);
      ctx.lineTo(px - 4 * scale, py + bodyH);
      ctx.moveTo(px, py + bodyH / 2);
      ctx.lineTo(px + 4 * scale, py + bodyH);
      ctx.stroke();
      ctx.font = `600 ${10 * scale}px system-ui, sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(label, px, py + bodyH + 12 * scale);
    },
    []
  );

  const render = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    }
    viewportRef.current = { width: rect.width, height: rect.height };
    const w = canvas.width;
    const h = canvas.height;
    const pad = 48 * dpr;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    const bounds = getSimulationBounds(smoothParams);
    const range = bounds.range ?? 20;
    const trainRange = bounds.trainRange ?? Math.max(10, range / 4);
    const maxHeight = bounds.maxHeight ?? 10;
    const padW = VIEW_PADDING;
    const padH = VIEW_PADDING;
    const halfExtentGroundX = range / 2 + padW;
    const halfExtentGroundY = maxHeight / 2 + padH;
    const halfExtentTrainX = trainRange / 2 + padW;
    const halfExtentTrainY = maxHeight / 2 + padH;
    const originGroundX = range / 2;
    const originGroundY = maxHeight / 2;
    const originTrainX = trainRange / 2;
    const originTrainY = maxHeight / 2;
    const scaleGroundX = (plotW / 2) / halfExtentGroundX;
    const scaleGroundY = (plotH / 2) / halfExtentGroundY;
    const scaleTrainX = (plotW / 2) / halfExtentTrainX;
    const scaleTrainY = (plotH / 2) / halfExtentTrainY;
    const GLOBAL_ZOOM = 0.75;
    const sGround = Math.min(scaleGroundX, scaleGroundY) * scale * GLOBAL_ZOOM;
    const sTrain = Math.min(scaleTrainX, scaleTrainY) * scale * GLOBAL_ZOOM;

    const cxPx = pad + plotW / 2;
    const cyPx = pad + plotH / 2;

    const toPxGroundRight = (x: number, y: number) => ({
      px: cxPx + (x - originGroundX) * sGround,
      py: cyPx - (y - originGroundY) * sGround,
    });

    const toPxTrain = (x: number, y: number) => ({
      px: cxPx + (x - originTrainX) * sTrain,
      py: cyPx - (y - originTrainY) * sTrain,
    });

    const gridColor = "rgba(148, 163, 184, 0.2)";
    const axisColor = "#64748B";
    const textColor = "#CBD5E1";
    const primaryBlue = "#38BDF8";
    const cyan = "#22D3EE";
    const purple = "#A78BFA";

    ctx.clearRect(0, 0, w, h);
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#0B1120");
    bgGrad.addColorStop(0.5, "#0F172A");
    bgGrad.addColorStop(1, "#1E293B");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const tFlight = getTimeOfFlight(smoothParams);
    const t = clamp(simTime, 0, Math.max(tFlight, 0.01));
    const gridStep = Math.max(2, Math.round((range + maxHeight) / 20));
    const trainHalfLen = 18;

    if (variant === "train") {
      // ─── Train Frame (Observer inside train) ─────────────────────────────
      const groundYpxLeft = cyPx + originTrainY * sTrain;

      ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
      ctx.fillRect(pad, pad, plotW, plotH);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(pad + 4, pad + 4, plotW - 8, plotH - 8);
      ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
      ctx.fillRect(pad, groundYpxLeft, plotW, pad + plotH - groundYpxLeft);
      ctx.strokeStyle = "rgba(100, 116, 139, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, groundYpxLeft);
      ctx.lineTo(pad + plotW, groundYpxLeft);
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, pad, plotW, plotH);
      ctx.clip();

      ctx.fillStyle = textColor;
      ctx.font = `600 ${12 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Ball path: straight up & down", cxPx, pad - 6);

      ctx.fillStyle = "#E9D5FF";
      ctx.strokeStyle = purple;
      ctx.lineWidth = 2.5;
      ctx.fillRect(cxPx - trainHalfLen * sTrain, groundYpxLeft - 6 * dpr, trainHalfLen * 2 * sTrain, 12 * dpr);
      ctx.strokeRect(cxPx - trainHalfLen * sTrain, groundYpxLeft - 6 * dpr, trainHalfLen * 2 * sTrain, 12 * dpr);
      drawObserver(ctx, cxPx, groundYpxLeft - 14 * dpr, dpr, "Thrower", purple);

      if (trailPoints.length > 1) {
        const n = trailPoints.length;
        for (let i = 0; i < n - 1; i++) {
          const a = i / (n - 1);
          const { px: p0x, py: p0y } = toPxTrain(trailPoints[i].xT, trailPoints[i].yT);
          const { px: p1x, py: p1y } = toPxTrain(trailPoints[i + 1].xT, trailPoints[i + 1].yT);
          const grad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
          grad.addColorStop(0, `rgba(139, 92, 246, ${0.3 + 0.7 * (1 - a)})`);
          grad.addColorStop(1, `rgba(196, 181, 253, ${0.5 * (1 - a)})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.lineTo(p1x, p1y);
          ctx.stroke();
        }
        ctx.strokeStyle = purple;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const { px: fx, py: fy } = toPxTrain(trailPoints[0].xT, trailPoints[0].yT);
        ctx.moveTo(fx, fy);
        for (let i = 1; i < trailPoints.length; i++) {
          const { px, py } = toPxTrain(trailPoints[i].xT, trailPoints[i].yT);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        const midIdxT = Math.floor(trailPoints.length / 2);
        const midPT = toPxTrain(trailPoints[midIdxT].xT, trailPoints[midIdxT].yT);
        ctx.fillStyle = "#5b21b6";
        ctx.font = `600 ${11 * dpr}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Ball path: straight up & down", cxPx, midPT.py - 18);
      }

      const trainPos = getTrainFramePosition(smoothParams, t);
      const ballPT = toPxTrain(trainPos.x, trainPos.y);
      const ballGlowT = ctx.createRadialGradient(ballPT.px, ballPT.py, 0, ballPT.px, ballPT.py, 28);
      ballGlowT.addColorStop(0, "rgba(139, 92, 246, 0.4)");
      ballGlowT.addColorStop(0.6, "rgba(139, 92, 246, 0.1)");
      ballGlowT.addColorStop(1, "transparent");
      ctx.fillStyle = ballGlowT;
      ctx.fillRect(ballPT.px - 32, ballPT.py - 32, 64, 64);
      const ballGradT = ctx.createRadialGradient(ballPT.px - 5, ballPT.py - 5, 0, ballPT.px, ballPT.py, 12);
      ballGradT.addColorStop(0, "#FFFFFF");
      ballGradT.addColorStop(0.5, "#C4B5FD");
      ballGradT.addColorStop(1, purple);
      ctx.fillStyle = ballGradT;
      ctx.beginPath();
      ctx.arc(ballPT.px, ballPT.py, 10 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = purple;
      ctx.lineWidth = 2;
      ctx.stroke();
      const vxTrainNow = getBallVelocityInGround(smoothParams).vxTrain;
      const vyTrainNow = getBallVelocityInGround(smoothParams).vyTrain - smoothParams.gravity * t;
      const vMagT = Math.hypot(vxTrainNow, vyTrainNow) || 1;
      const vScaleT = 0.22 * sTrain;
      const vLenT = Math.min(65, vMagT * vScaleT);
      drawArrow(ctx, ballPT.px, ballPT.py, ballPT.px + (vxTrainNow / vMagT) * vLenT, ballPT.py - (vyTrainNow / vMagT) * vLenT, purple, dpr);

      ctx.restore();
    }

    if (variant === "ground") {
      // ─── Ground Frame (Observer on ground) ───────────────────────────────
      const leftXMin = originGroundX - halfExtentGroundX;
      const leftXMax = originGroundX + halfExtentGroundX;
      const leftYMin = originGroundY - halfExtentGroundY;
      const leftYMax = originGroundY + halfExtentGroundY;
      const groundYpxRight = cyPx + originGroundY * sGround;

      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.fillRect(pad, pad, plotW, plotH);
      ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
      ctx.fillRect(pad, groundYpxRight, plotW, pad + plotH - groundYpxRight);
      ctx.strokeStyle = "rgba(100, 116, 139, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, groundYpxRight);
      ctx.lineTo(pad + plotW, groundYpxRight);
      ctx.stroke();

      ctx.strokeStyle = gridColor;
      for (let i = leftXMin; i <= leftXMax; i += gridStep) {
        const { px } = toPxGroundRight(i, 0);
        if (px < pad || px > pad + plotW) continue;
        ctx.beginPath();
        ctx.moveTo(px, pad);
        ctx.lineTo(px, pad + plotH);
        ctx.stroke();
      }
      for (let j = leftYMin; j <= leftYMax; j += gridStep) {
        const { py } = toPxGroundRight(0, j);
        if (py < pad || py > pad + plotH) continue;
        ctx.beginPath();
        ctx.moveTo(pad, py);
        ctx.lineTo(pad + plotW, py);
        ctx.stroke();
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, pad, plotW, plotH);
      ctx.clip();

      ctx.fillStyle = textColor;
      ctx.font = `600 ${12 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Ball path: parabola", cxPx, pad - 6);

      const trainX = smoothParams.trainVelocity * t;
      const trainP = toPxGroundRight(trainX, 0);
      const pulse = 0.92 + 0.08 * Math.sin(simTime * 4);
      ctx.fillStyle = "#BFDBFE";
      ctx.fillRect(trainP.px - trainHalfLen * sGround * pulse, trainP.py - 6 * dpr, trainHalfLen * 2 * sGround * pulse, 12 * dpr);
      ctx.strokeStyle = primaryBlue;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(trainP.px - trainHalfLen * sGround * pulse, trainP.py - 6 * dpr, trainHalfLen * 2 * sGround * pulse, 12 * dpr);
      drawObserver(ctx, trainP.px, trainP.py - 14 * dpr, dpr, "Thrower", primaryBlue);
      ctx.strokeStyle = primaryBlue;
      ctx.lineWidth = 2;
      const arrLen = 20 * dpr;
      ctx.beginPath();
      ctx.moveTo(trainP.px - trainHalfLen * sGround - 5, trainP.py + 14 * dpr);
      ctx.lineTo(trainP.px - trainHalfLen * sGround - 5 + arrLen, trainP.py + 14 * dpr);
      ctx.lineTo(trainP.px - trainHalfLen * sGround - 5 + arrLen - 8, trainP.py + 10 * dpr);
      ctx.moveTo(trainP.px - trainHalfLen * sGround - 5 + arrLen, trainP.py + 14 * dpr);
      ctx.lineTo(trainP.px - trainHalfLen * sGround - 5 + arrLen - 8, trainP.py + 18 * dpr);
      ctx.stroke();
      ctx.font = `${9 * dpr}px system-ui, sans-serif`;
      ctx.fillStyle = primaryBlue;
      ctx.fillText("v_train", trainP.px - trainHalfLen * sGround - 5 + arrLen / 2 - 14, trainP.py + 32 * dpr);

      const obsBpx = cxPx - halfExtentGroundX * sGround * 0.4;
      drawObserver(ctx, obsBpx, cyPx - 14 * dpr, dpr, "Observer", axisColor);

      if (trailPoints.length > 1) {
        const n = trailPoints.length;
        for (let i = 0; i < n - 1; i++) {
          const a = i / (n - 1);
          const { px: p0x, py: p0y } = toPxGroundRight(trailPoints[i].x, trailPoints[i].y);
          const { px: p1x, py: p1y } = toPxGroundRight(trailPoints[i + 1].x, trailPoints[i + 1].y);
          const grad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
          grad.addColorStop(0, `rgba(6, 182, 212, ${0.2 + 0.8 * (1 - a)})`);
          grad.addColorStop(1, `rgba(59, 130, 246, ${0.4 * (1 - a)})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.lineTo(p1x, p1y);
          ctx.stroke();
        }
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const first = trailPoints[0];
        const { px: fx, py: fy } = toPxGroundRight(first.x, first.y);
        ctx.moveTo(fx, fy);
        for (let i = 1; i < trailPoints.length; i++) {
          const { px, py } = toPxGroundRight(trailPoints[i].x, trailPoints[i].y);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        const midIdx = Math.floor(trailPoints.length / 2);
        const midP = toPxGroundRight(trailPoints[midIdx].x, trailPoints[midIdx].y);
        ctx.fillStyle = "#0e7490";
        ctx.font = `600 ${11 * dpr}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Ball path: parabola", midP.px, midP.py - 18);
      }

      const { x: ballX, y: ballY } = getGroundPosition(smoothParams, t);
      const ballP = toPxGroundRight(ballX, ballY);
      const ballGlow = ctx.createRadialGradient(ballP.px, ballP.py, 0, ballP.px, ballP.py, 28);
      ballGlow.addColorStop(0, "rgba(6, 182, 212, 0.4)");
      ballGlow.addColorStop(0.6, "rgba(59, 130, 246, 0.15)");
      ballGlow.addColorStop(1, "transparent");
      ctx.fillStyle = ballGlow;
      ctx.fillRect(ballP.px - 32, ballP.py - 32, 64, 64);
      const ballGrad = ctx.createRadialGradient(ballP.px - 5, ballP.py - 5, 0, ballP.px, ballP.py, 12);
      ballGrad.addColorStop(0, "#FFFFFF");
      ballGrad.addColorStop(0.4, "#67e8f9");
      ballGrad.addColorStop(0.8, cyan);
      ballGrad.addColorStop(1, primaryBlue);
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ballP.px, ballP.py, 10 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = primaryBlue;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.beginPath();
      ctx.ellipse(ballP.px, ballP.py + 12, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const { vxGround, vyGround } = getBallVelocityInGround(smoothParams);
      const vxNow = vxGround;
      const vyNow = vyGround - smoothParams.gravity * t;
      const vMag = Math.hypot(vxNow, vyNow) || 1;
      const vScale = 0.22 * sGround;
      const vLen = Math.min(65, vMag * vScale);
      drawArrow(ctx, ballP.px, ballP.py, ballP.px + (vxNow / vMag) * vLen, ballP.py - (vyNow / vMag) * vLen, primaryBlue, dpr);
      ctx.font = `${9 * dpr}px system-ui, sans-serif`;
      ctx.fillStyle = primaryBlue;
      ctx.fillText("v_ball", ballP.px + (vxNow / vMag) * vLen + 6, ballP.py - (vyNow / vMag) * vLen);

      ctx.restore();
    }
  }, [variant, smoothParams, simTime, scale, trailPoints, drawArrow, drawObserver]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => render());
    ro.observe(container);
    return () => ro.disconnect();
  }, [render]);

  useEffect(() => {
    const bounds = getSimulationBounds(smoothParams);
    const vw = viewportRef.current.width * 0.8;
    const vh = viewportRef.current.height * 0.8;
    const vw40 = viewportRef.current.width * 0.4;
    const vh40 = viewportRef.current.height * 0.4;
    setScale((prev) => {
      let s = prev;
      if (bounds.width > vw || bounds.height > vh) s *= 0.95;
      if (bounds.width < vw40 && bounds.height < vh40) s *= 1.05;
      return clamp(s, 0.1, 10);
    });
  }, [smoothParams, setScale]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ display: "block" }}
      />
    </div>
  );
}

// ─── Static reference diagram (textbook-style) ───────────────────────────────

function StaticReferenceDiagram() {
  return (
    <svg
      viewBox="0 0 480 180"
      className="mx-auto block w-full max-w-2xl"
      style={{ maxHeight: "200px", objectFit: "contain" }}
      aria-hidden
    >
      <defs>
        <marker id="arrowhead-ref" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
      </defs>
      <rect width="480" height="180" fill="#0A0F1E" />
      {/* Left: Train frame */}
      <text x="120" y="18" textAnchor="middle" fill="#A78BFA" fontSize="13" fontWeight="600">Train Frame</text>
      <rect x="30" y="35" width="180" height="110" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="1.5" rx="4" />
      <line x1="120" y1="135" x2="120" y2="50" stroke="#8B5CF6" strokeWidth="2.5" strokeDasharray="5 4" />
      <circle cx="120" cy="52" r="5" fill="#C4B5FD" stroke="#A78BFA" strokeWidth="1" />
      <text x="125" y="88" textAnchor="start" fill="#DDD6FE" fontSize="11">Ball path: straight up &amp; down</text>
      {/* Right: Ground frame */}
      <text x="360" y="18" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="600">Ground Frame</text>
      <rect x="270" y="35" width="180" height="110" fill="#0c4a6e" stroke="#0ea5e9" strokeWidth="1.5" rx="4" />
      <path d="M 290 135 Q 355 55 430 135" fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeDasharray="5 4" />
      <circle cx="355" cy="72" r="5" fill="#67e8f9" stroke="#06b6d4" strokeWidth="1" />
      <line x1="270" y1="135" x2="315" y2="135" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#arrowhead-ref)" />
      <text x="278" y="128" fill="#BAE6FD" fontSize="10">v_train</text>
      <line x1="355" y1="72" x2="395" y2="55" stroke="#22D3EE" strokeWidth="1.5" markerEnd="url(#arrowhead-ref)" />
      <text x="372" y="58" fill="#A5F3FC" fontSize="10">v_ball</text>
      <text x="360" y="95" textAnchor="middle" fill="#A5F3FC" fontSize="11">Ball path: parabola</text>
    </svg>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function FrameOfReferenceSimulation() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [playing, setPlaying] = useState(true);
  const [smoothParams, setSmoothParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [simTime, setSimTime] = useState(0);
  const [scale, setScale] = useState(1);
  const [trailPoints, setTrailPoints] = useState<{ x: number; y: number; xT: number; yT: number }[]>([]);
  const [fps, setFps] = useState(60);
  const lastFrameRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  const historyThrottleRef = useRef(0);

  const tFlight = getTimeOfFlight(smoothParams);
  const { vxGround, vyGround, vxTrain, vyTrain } = getBallVelocityInGround(smoothParams);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animSpeed = prefersReducedMotion ? 0.5 : 1;

  useEffect(() => {
    let raf: number;
    const targetDt = 1000 / 60;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const elapsed = now - lastFrameRef.current;
      if (elapsed < targetDt) return;
      lastFrameRef.current = now;
      frameCountRef.current++;
      if (now - lastFpsUpdateRef.current >= 500) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      setSmoothParams((prev) => ({
        trainVelocity: interpolate(prev.trainVelocity, params.trainVelocity, 0.12),
        ballSpeed: interpolate(prev.ballSpeed, params.ballSpeed, 0.12),
        ballAngleDeg: interpolate(prev.ballAngleDeg, params.ballAngleDeg, 0.12),
        gravity: interpolate(prev.gravity, params.gravity, 0.12),
      }));

      setSimTime((prev) => {
        let next = prev + (elapsed / 1000) * animSpeed;
        if (tFlight > 0 && next >= tFlight) next = 0;
        return next;
      });
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [params, tFlight, animSpeed]);

  useEffect(() => {
    const t = clamp(simTime, 0, Math.max(tFlight, 0.001));
    const points: { x: number; y: number; xT: number; yT: number }[] = [];
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const ti = (i / n) * t;
      const g = getGroundPosition(smoothParams, ti);
      const tr = getTrainFramePosition(smoothParams, ti);
      points.push({ x: g.x, y: g.y, xT: tr.x, yT: tr.y });
    }
    setTrailPoints(points);
  }, [simTime, tFlight, smoothParams]);

  useEffect(() => {
    setSimTime(0);
  }, [params.trainVelocity, params.ballSpeed, params.ballAngleDeg]);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setSmoothParams(DEFAULT_PARAMS);
    setSimTime(0);
  };

  const sliderSpecs: ParameterSliderSpec[] = [
    {
      label: "Train velocity",
      paramKey: "trainVelocity",
      value: params.trainVelocity,
      min: 0,
      max: 30,
      step: 0.5,
      unit: "m/s",
      defaultValue: DEFAULT_PARAMS.trainVelocity,
      icon: "🚂",
      dramaticRange: [8, 15],
    },
    {
      label: "Ball speed",
      paramKey: "ballSpeed",
      value: params.ballSpeed,
      min: 5,
      max: 25,
      step: 0.5,
      unit: "m/s",
      defaultValue: DEFAULT_PARAMS.ballSpeed,
      icon: "⚽",
      dramaticRange: [10, 18],
    },
    {
      label: "Throw angle",
      paramKey: "ballAngleDeg",
      value: params.ballAngleDeg,
      min: 0,
      max: 90,
      step: 5,
      unit: "°",
      defaultValue: DEFAULT_PARAMS.ballAngleDeg,
      icon: "📐",
      dramaticRange: [85, 90],
    },
  ];

  return (
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Top Row: Simulation Canvas (2 columns) side-by-side or stacked on sm */}
          <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-neutral-400 flex items-center gap-4">
                <span>Frame of Reference Simulation</span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300">
                  ⚡ {fps} FPS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying(p => !p)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 h-full">
              <div className="flex flex-1 flex-col gap-2 relative border border-purple-500/30 rounded-2xl bg-[#0A0F1E] overflow-hidden">
                <div className="absolute top-2 left-3 z-10 text-xs font-bold text-purple-400 bg-neutral-900/60 px-2 py-1 rounded backdrop-blur">
                  Train Frame (Observer Inside)
                </div>
                <div className="relative w-full h-full flex-1 min-h-[220px]">
                  <SimulationCanvas
                    variant="train"
                    params={params}
                    simTime={simTime}
                    smoothParams={smoothParams}
                    scale={scale}
                    setScale={setScale}
                    trailPoints={trailPoints}
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 relative border border-cyan-500/30 rounded-2xl bg-[#0A0F1E] overflow-hidden">
                <div className="absolute top-2 left-3 z-10 text-xs font-bold text-cyan-400 bg-neutral-900/60 px-2 py-1 rounded backdrop-blur">
                  Ground Frame (Observer on Ground)
                </div>
                <div className="relative w-full h-full flex-1 min-h-[220px]">
                  <SimulationCanvas
                    variant="ground"
                    params={params}
                    simTime={simTime}
                    smoothParams={smoothParams}
                    scale={scale}
                    setScale={setScale}
                    trailPoints={trailPoints}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Controls Panel (1 column) */}
          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Parameters</h3>
              <div className="flex flex-col gap-3">
                {sliderSpecs.map((spec, idx) => (
                  <SliderRow
                    key={spec.paramKey}
                    label={spec.label}
                    value={spec.value}
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    unit={spec.unit}
                    icon={spec.icon}
                    dramaticRange={spec.dramaticRange}
                    color={idx % 2 === 0 ? "#38bdf8" : "#a855f7"}
                    onChange={(v) => setParams((p) => ({ ...p, [spec.paramKey]: v }))}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 text-sm text-purple-200">
              <div className="font-bold text-purple-400 mb-2">💡 Note</div>
              <p className="text-purple-100/80 text-xs leading-relaxed">
                Train velocity = 0 → both show the same motion. Increase train velocity to see the ground-frame parabola diverge from the train-frame vertical bounce!
              </p>
            </div>

            {/* Calculations block */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
              <div className="text-xs font-bold text-neutral-400">Live Values</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">v_train</span>
                <span className="font-mono font-bold text-cyan-400">{smoothParams.trainVelocity.toFixed(1)} m/s</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">v_ball (t=0) ground x</span>
                <span className="font-mono font-bold text-purple-400">{vxGround.toFixed(1)} m/s</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">v_ball (t=0) ground y</span>
                <span className="font-mono font-bold text-purple-400">{vyGround.toFixed(1)} m/s</span>
              </div>
            </div>
          </aside>
          </div>
        </div>

          {/* Bottom Row: Info Panel */}
          <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">

              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5 lg:col-span-2">
                <h4 className="text-sm font-bold text-cyan-400 mb-2">✨ REFERENCE DIAGRAM</h4>
                <div className="mb-4 border border-neutral-800 rounded-xl bg-neutral-950 px-2 py-4">
                  <StaticReferenceDiagram />
                </div>
                <div className="text-sm text-neutral-300 space-y-2">
                  <p><strong className="text-purple-400">Train frame:</strong> For someone inside the train, the train is at rest. The ball is thrown straight up, so its path is a vertical line.</p>
                  <p><strong className="text-cyan-400">Ground frame:</strong> For someone standing on the ground, the train moves to the right. The ball has the same vertical motion plus the train&apos;s horizontal motion, creating a parabola.</p>
                </div>
              </div>

              <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5 h-full">
                <h4 className="text-sm font-bold text-amber-500 mb-3">📐 THE PHYSICS</h4>
                <p className="text-sm mb-4">
                  Motion depends on the observer&apos;s frame of reference. The exact same physical event is described differently varying on relative speeds.
                </p>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2 font-mono text-xs">
                  <div className="text-cyan-400">x_ground = v_train·t + x_train</div>
                  <div className="text-purple-400">v_ground = v_train + v_ball</div>
                  <div className="text-neutral-500 border-t border-neutral-800 pt-2 text-[10px]">
                    (Galilean Transformation)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
