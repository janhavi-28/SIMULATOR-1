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

function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  defaultValue,
  icon,
  dramaticRange,
  onChange,
  onRecord,
}: Omit<ParameterSliderSpec, "paramKey"> & {
  onChange: (v: number) => void;
  onRecord?: (v: number) => void;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-medium text-gray-900"
      >
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(v);
            onRecord?.(v);
          }}
          className="h-3 w-full cursor-pointer appearance-none rounded-full border border-gray-200 bg-gray-200 align-middle [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #60A5FA ${((value - min) / (max - min)) * 100}%, #E5E7EB ${((value - min) / (max - min)) * 100}%, #E5E7EB 100%)`,
          }}
          aria-label={`${label}: ${value} ${unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
        />
        {dramaticRange && (
          <div
            className="pointer-events-none absolute top-0 h-3 rounded-full bg-blue-400/20"
            style={{
              left: `${((dramaticRange[0] - min) / (max - min)) * 100}%`,
              width: `${((dramaticRange[1] - dramaticRange[0]) / (max - min)) * 100}%`,
            }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min} {unit}</span>
        <span className="tabular-nums font-semibold text-gray-900">
          {formatNum(value, step < 1 ? 2 : 1)} {unit}
        </span>
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

    const gridColor = "rgba(203, 213, 225, 0.6)";
    const axisColor = "#475569";
    const textColor = "#1e293b";
    const primaryBlue = "#3B82F6";
    const cyan = "#06B6D4";
    const purple = "#8B5CF6";

    ctx.clearRect(0, 0, w, h);
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#E2E8F0");
    bgGrad.addColorStop(0.5, "#F1F5F9");
    bgGrad.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const tFlight = getTimeOfFlight(smoothParams);
    const t = clamp(simTime, 0, Math.max(tFlight, 0.01));
    const gridStep = Math.max(2, Math.round((range + maxHeight) / 20));
    const trainHalfLen = 18;

    if (variant === "train") {
      // ─── Train Frame (Observer inside train) ─────────────────────────────
      const groundYpxLeft = cyPx + originTrainY * sTrain;

      ctx.fillStyle = "rgba(233, 213, 255, 0.35)";
      ctx.fillRect(pad, pad, plotW, plotH);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(pad + 4, pad + 4, plotW - 8, plotH - 8);
      ctx.fillStyle = "rgba(245, 243, 255, 0.9)";
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

      ctx.fillStyle = "rgba(191, 219, 254, 0.2)";
      ctx.fillRect(pad, pad, plotW, plotH);
      ctx.fillStyle = "rgba(148, 163, 184, 0.25)";
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
      <rect width="480" height="180" fill="#FAFAFA" />
      {/* Left: Train frame */}
      <text x="120" y="18" textAnchor="middle" fill="#5b21b6" fontSize="13" fontWeight="600">Train Frame</text>
      <rect x="30" y="35" width="180" height="110" fill="#F5F3FF" stroke="#8B5CF6" strokeWidth="1.5" rx="4" />
      <line x1="120" y1="135" x2="120" y2="50" stroke="#8B5CF6" strokeWidth="2.5" strokeDasharray="5 4" />
      <circle cx="120" cy="52" r="5" fill="#A78BFA" stroke="#6D28D9" strokeWidth="1" />
      <text x="125" y="88" textAnchor="start" fill="#5b21b6" fontSize="11">Ball path: straight up &amp; down</text>
      {/* Right: Ground frame */}
      <text x="360" y="18" textAnchor="middle" fill="#1e40af" fontSize="13" fontWeight="600">Ground Frame</text>
      <rect x="270" y="35" width="180" height="110" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" rx="4" />
      <path d="M 290 135 Q 355 55 430 135" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="5 4" />
      <circle cx="355" cy="72" r="5" fill="#67e8f9" stroke="#0891B2" strokeWidth="1" />
      <line x1="270" y1="135" x2="315" y2="135" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#arrowhead-ref)" />
      <text x="278" y="128" fill="#1e40af" fontSize="10">v_train</text>
      <line x1="355" y1="72" x2="395" y2="55" stroke="#0891B2" strokeWidth="1.5" markerEnd="url(#arrowhead-ref)" />
      <text x="372" y="58" fill="#0e7490" fontSize="10">v_ball</text>
      <text x="360" y="95" textAnchor="middle" fill="#0e7490" fontSize="11">Ball path: parabola</text>
    </svg>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function FrameOfReferenceSimulation() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
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
    <div className="flex min-h-screen flex-col overflow-y-auto bg-[#F5F5F5]">
      {/* Top section: left = stacked simulations, right = parameter controls */}
      <section className="w-full border-b-2 border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-4 py-4 lg:flex-row lg:items-start lg:gap-8">
          {/* Left column: two simulations stacked vertically */}
          <div className="flex flex-1 flex-col gap-8">
            <div className="mx-auto w-full max-w-[650px]">
              <h2 className="mb-2 text-center text-base font-semibold text-gray-800">
                Train Frame (Observer Inside Train)
              </h2>
              <div className="overflow-hidden" style={{ aspectRatio: "16/10", minHeight: 260 }}>
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
            <div className="mx-auto w-full max-w-[650px]">
              <h2 className="mb-2 text-center text-base font-semibold text-gray-800">
                Ground Frame (Observer on Ground)
              </h2>
              <div className="overflow-hidden" style={{ aspectRatio: "16/10", minHeight: 260 }}>
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

          {/* Right column: parameter controls */}
          <div className="shrink-0 lg:w-[280px]">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 px-4 py-4 shadow-inner">
              <h2 className="mb-3 text-base font-semibold tracking-tight text-white">
                Parameter controls
              </h2>
              <div className="space-y-3">
                {sliderSpecs.map((spec) => (
                  <ParameterSlider
                    key={spec.paramKey}
                    label={spec.label}
                    value={spec.value}
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    unit={spec.unit}
                    defaultValue={spec.defaultValue}
                    icon={spec.icon}
                    dramaticRange={spec.dramaticRange}
                    onChange={(v) => setParams((p) => ({ ...p, [spec.paramKey]: v }))}
                  />
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <span className="font-semibold">💡 Try:</span> Train velocity = 0 → both show the same
                motion. Increase train velocity to see the ground-frame parabola.
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 font-semibold text-white shadow transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                aria-label="Reset to default"
              >
                <span aria-hidden>↺</span> Reset to Default
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom section: Student takeaway + static reference diagram — always in view when scrolling */}
      <section className="flex flex-col gap-4 border-t-2 border-gray-200 bg-[#F9FAFB] p-6 pb-12">
        <p className="text-center text-base font-medium italic text-gray-800">
          Motion depends on the observer&apos;s frame of reference. The same event can look different to observers in different frames.
        </p>
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-center text-sm font-semibold text-gray-700">Reference diagram</p>
          <div className="flex justify-center overflow-hidden rounded-lg bg-gray-50/50">
            <StaticReferenceDiagram />
          </div>
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
            <p><strong className="text-purple-700">Train frame (left):</strong> For someone inside the train, the train is at rest. The ball is thrown straight up, so its path is a vertical line—straight up and straight back down into the thrower&apos;s hand.</p>
            <p><strong className="text-blue-700">Ground frame (right):</strong> For someone standing on the ground, the train moves to the right with velocity v_train. The ball has the same vertical motion plus the train&apos;s horizontal motion, so its path is a parabola. The ball still lands back in the thrower&apos;s hand because the thrower is moving with the train.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
