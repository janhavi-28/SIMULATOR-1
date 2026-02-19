"use client";

import React, { useState } from "react";
import { SliderControl, LiveOutputCard, LiveValue } from "./SourcesOfEnergyShell";
import { SimulatorContainer, SimulatorCanvas } from "./EnergySimulatorLayout";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

// ——— Single continuous pipe track (full width) + flow line + arrowheads ———
function BiogasPipeTrack({
  x1,
  x2,
  cy,
  pipeWidth,
  isActive,
  dashOffset,
}: {
  x1: number;
  x2: number;
  cy: number;
  pipeWidth: number;
  isActive: boolean;
  dashOffset: number;
}) {
  const h = pipeWidth / 2;
  const trackPath = `M ${x1} ${cy - h} L ${x2} ${cy - h} L ${x2} ${cy + h} L ${x1} ${cy + h} Z`;
  const arrowhead = (ax: number) => (
    <polygon
      key={ax}
      points={`${ax - 6},${cy - 4} ${ax - 6},${cy + 4} ${ax},${cy}`}
      fill="rgba(74,222,128,0.6)"
      opacity={isActive ? 0.9 : 0.35}
    />
  );
  const arrows = [];
  for (let ax = x1 + 80; ax < x2; ax += 90) arrows.push(arrowhead(ax));
  return (
    <g>
      <path d={trackPath} fill="rgba(30,41,59,0.92)" stroke="rgba(71,85,105,0.7)" strokeWidth="1.5" />
      <line
        x1={x1}
        y1={cy}
        x2={x2}
        y2={cy}
        stroke="url(#biogas-flow)"
        strokeWidth={pipeWidth * 0.55}
        strokeLinecap="round"
        strokeDasharray="12 14"
        strokeDashoffset={-dashOffset}
        opacity={isActive ? 1 : 0.28}
      />
      {arrows}
      <polygon points={`${x2 - 10},${cy - 5} ${x2 - 10},${cy + 5} ${x2},${cy}`} fill="url(#biogas-flow)" opacity={isActive ? 1 : 0.35} />
    </g>
  );
}

// ——— Metric card: equal width, glass effect, subtle biogas green border ———
function BiogasMetricCard({ label, value, unit, active }: { label: string; value: string; unit: string; active?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 flex flex-col items-center justify-center min-w-0 flex-1 transition-all duration-200 backdrop-blur-sm ${
        active
          ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_16px_rgba(16,185,129,0.1)]"
          : "border-slate-600/50 bg-slate-800/50"
      }`}
    >
      <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate w-full text-center font-medium">{label}</div>
      <div className={`font-mono text-sm tabular-nums mt-0.5 font-bold ${active ? "text-emerald-300" : "text-slate-300"}`}>
        <span className="inline-block">{value}</span> <span className="text-slate-400 text-xs font-normal">{unit}</span>
      </div>
    </div>
  );
}

// ——— Process canvas: top 75% diagram (full width, centered), bottom 25% metrics ———
function BiogasProcessCanvas({
  isAnimating,
  elapsedTime,
  waste,
  retention,
  methane,
  gasRate,
  energy,
  fractionConverted,
}: {
  isAnimating: boolean;
  elapsedTime: number;
  waste: number;
  retention: number;
  methane: number;
  gasRate: number;
  energy: number;
  fractionConverted: number;
}) {
  const W = 920;
  const H = 200;
  const cy = 100;
  const pipeW = 20;
  const flowSpeed = 0.4 + waste * 0.3;
  const dashOff = elapsedTime * flowSpeed * 24;

  // Centered layout: content fits with padding, pipe connects all components
  const wasteX = 88;
  const digesterX = 228;
  const gasHolderX = 460; // center – largest element
  const burnerX = 612;
  const outputX = 808;
  const pipeStart = wasteX + 26;   // from waste right edge
  const pipeEnd = outputX - 28;    // to output left edge

  const fillLevel = 0.25 + 0.55 * waste;
  const bubbleCount = Math.min(12, Math.floor(8 * fractionConverted * (0.5 + methane)));

  // Flowing gas particles along full pipe (left → right)
  const particleCount = 5;
  const pipeLen = pipeEnd - pipeStart;

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-gradient-to-b from-slate-800 via-slate-800/98 to-slate-900">
      <div className="flex-[3] min-h-0 w-full flex justify-center items-center px-8 py-4" style={{ display: "flex", width: "100%" }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full min-w-0 min-h-0" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="biogas-flow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="50%" stopColor="#5ee96e" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
            <linearGradient id="digester-body" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <linearGradient id="digester-liquid" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
            <linearGradient id="gas-holder-dome" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
            <filter id="biogas-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feFlood floodColor="#4ade80" floodOpacity="0.55" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="gas-holder-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#2dd4bf" floodOpacity="0.4" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="flame-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feFlood floodColor="#fb923c" floodOpacity="0.45" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Single continuous pipe track + flow + arrowheads */}
          <BiogasPipeTrack x1={pipeStart} x2={pipeEnd} cy={cy} pipeWidth={pipeW} isActive={isAnimating} dashOffset={dashOff} />

          {/* Gas particles along full pipe when active */}
          {isAnimating && Array.from({ length: particleCount }).map((_, i) => {
            const t = ((elapsedTime * 18 + i * (pipeLen / particleCount)) % (pipeLen + 30)) / pipeLen;
            const px = pipeStart + t * pipeLen;
            return <circle key={i} cx={px} cy={cy} r="2.5" fill="rgba(167,243,208,0.95)" filter="url(#biogas-glow)" />;
          })}

          {/* Stage labels above */}
          <text x={wasteX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Waste</text>
          <text x={digesterX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Digester</text>
          <text x={gasHolderX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="12" fontFamily="system-ui,sans-serif" fontWeight="700">Gas holder</text>
          <text x={burnerX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Burner</text>
          <text x={outputX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Output</text>

          {/* Waste input */}
          <g transform={`translate(${wasteX}, ${cy})`}>
            <path d="M -24 -22 L 24 -22 L 20 18 L -20 18 Z" fill="rgba(51,65,85,0.95)" stroke="rgba(148,163,184,0.6)" strokeWidth="1.5" />
            <text x={0} y={3} textAnchor="middle" fill="rgba(226,232,240,0.95)" fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="600">WASTE</text>
          </g>

          {/* Digester: medium-large cylinder + bubbles */}
          <g transform={`translate(${digesterX}, ${cy})`}>
            <ellipse cx="0" cy="-10" rx="46" ry="26" fill="url(#digester-body)" stroke="rgba(74,222,128,0.7)" strokeWidth="1.5" />
            <rect x="-46" y="-10" width="92" height="34" fill="url(#digester-body)" stroke="rgba(74,222,128,0.7)" strokeWidth="1.5" />
            <ellipse cx="0" cy="24" rx="42" ry="16" fill="rgba(30,41,59,0.85)" stroke="rgba(74,222,128,0.4)" strokeWidth="1" />
            <rect x="-42" y={24 - 34 * fillLevel} width="84" height={34 * fillLevel} fill="url(#digester-liquid)" opacity="0.9" />
            <ellipse cx="0" cy={24 - 34 * fillLevel} rx="42" ry={16 * fillLevel} fill="url(#digester-liquid)" opacity="0.95" />
            {isAnimating && Array.from({ length: bubbleCount }).map((_, i) => {
              const bx = -36 + (i * 15 + elapsedTime * 8) % 72;
              const by = 18 - 32 * fillLevel - ((elapsedTime * 11 + i * 5) % (32 * fillLevel + 12));
              return <circle key={i} cx={bx} cy={by} r="3" fill="rgba(190,242,100,0.95)" filter="url(#biogas-glow)" />;
            })}
          </g>

          {/* Gas holder: largest – central focus + glow */}
          <g transform={`translate(${gasHolderX}, ${cy})`} filter={isAnimating ? "url(#gas-holder-glow)" : undefined}>
            <ellipse cx="0" cy="10" rx="58" ry="38" fill="url(#gas-holder-dome)" stroke="rgba(45,212,191,0.75)" strokeWidth="2" />
            <ellipse cx="0" cy="-6" rx="50" ry="24" fill="rgba(20,184,166,0.25)" stroke="rgba(45,212,191,0.5)" strokeWidth="1" />
            <circle cx={32} cy={-22} r="9" fill="rgba(30,41,59,0.95)" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
            <line x1={32} y1={-22} x2={32 + 6 * (isAnimating ? Math.sin(elapsedTime * 2) : 0)} y2={-22 - 6 * (isAnimating ? Math.cos(elapsedTime * 2) : 1)} stroke="rgba(74,222,128,0.9)" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Burner: slightly smaller, soft flame when active */}
          <g transform={`translate(${burnerX}, ${cy})`}>
            <rect x="-22" y="10" width="44" height="26" rx="3" fill="rgba(55,65,81,0.95)" stroke="rgba(251,146,60,0.6)" strokeWidth="1.5" />
            {isAnimating && gasRate > 0.3 && (
              <g filter="url(#flame-glow)">
                <path
                  d={`M 0 10 Q ${5 * Math.sin(elapsedTime * 4)} ${-14 - 6 * Math.sin(elapsedTime * 3)} 3 10 Q 0 6 -3 10 Z`}
                  fill="rgba(253,224,71,0.9)"
                  opacity={0.8 + 0.12 * Math.sin(elapsedTime * 4)}
                />
                <path
                  d={`M 0 10 Q ${3 * Math.sin(elapsedTime * 3 + 1)} ${-8 - 4 * Math.sin(elapsedTime * 2)} 2 10 Q 0 8 -2 10 Z`}
                  fill="rgba(251,146,60,0.85)"
                  opacity={0.88}
                />
              </g>
            )}
            {!isAnimating && <rect x="-6" y="14" width="12" height="10" rx="1" fill="rgba(100,116,139,0.5)" />}
          </g>

          {/* Energy output */}
          <g transform={`translate(${outputX}, ${cy})`}>
            <rect x="-28" y="-18" width="56" height="36" rx="4" fill="rgba(20,184,166,0.12)" stroke="rgba(45,212,191,0.65)" strokeWidth="1.5" />
            <text x={0} y={5} textAnchor="middle" fill="rgba(94,234,212,0.95)" fontSize="10" fontFamily="system-ui,sans-serif" fontWeight="600">OUTPUT</text>
          </g>
        </svg>
      </div>
      <div className="flex-[1] min-h-0 shrink-0 flex items-center gap-2 px-4 py-2 border-t border-slate-600/60 bg-slate-800/50 backdrop-blur-sm" aria-label="Live metrics">
        <BiogasMetricCard label="Gas production rate" value={formatNum(gasRate, 2)} unit="m³/h" active={isAnimating} />
        <BiogasMetricCard label="Methane" value={formatNum(methane * 100, 0)} unit="%" active={isAnimating} />
        <BiogasMetricCard label="Energy output" value={formatNum(energy, 2)} unit="kWh/h" active={energy > 0.5} />
        <BiogasMetricCard label="Retention time" value={formatNum(retention, 0)} unit="days" active={isAnimating} />
      </div>
    </div>
  );
}

export default function BiogasPlantSimulation() {
  const [waste, setWaste] = useState(1.0);
  const [retention, setRetention] = useState(20);
  const [methane, setMethane] = useState(0.6);
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle();

  const k = 0.12;
  const fractionConverted = 1 - Math.exp((-k * retention) / 20);
  const gasRate = waste * fractionConverted * methane;
  const energy = gasRate * 6;

  const sidebar = (
    <>
      <SliderControl
        label="Waste input"
        value={waste}
        min={0.5}
        max={3}
        step={0.25}
        unit="×"
        onChange={setWaste}
        isActive={isAnimating}
      />
      <SliderControl
        label="Retention time"
        value={retention}
        min={5}
        max={40}
        step={2}
        unit="days"
        onChange={setRetention}
        color="cyan"
        isActive={isAnimating}
      />
      <SliderControl
        label="Methane fraction"
        value={methane}
        min={0.4}
        max={0.8}
        step={0.05}
        unit=""
        onChange={setMethane}
        color="amber"
        isActive={isAnimating}
      />
      <LiveOutputCard title="Live output" isActive={isAnimating}>
        <p className="text-sm text-slate-200">
          Gas rate ≈ <LiveValue value={gasRate} decimals={2} /> (arb.), Energy ≈ <LiveValue value={energy} decimals={2} suffix=" kWh/h" />
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Biogas reduces methane release from waste and can replace firewood or LPG.
        </p>
      </LiveOutputCard>
    </>
  );

  return (
    <SimulatorContainer
      title="Biogas Plant"
      subtitle="Waste → anaerobic digestion → biogas → useful energy."
      hasLaunched={hasLaunched}
      paused={isPaused}
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      canvas={
        <SimulatorCanvas fullBleed>
          <div className="w-full h-full min-h-0 flex flex-col flex-1">
            <BiogasProcessCanvas
              isAnimating={isAnimating}
              elapsedTime={elapsedTime}
              waste={waste}
              retention={retention}
              methane={methane}
              gasRate={gasRate}
              energy={energy}
              fractionConverted={fractionConverted}
            />
          </div>
        </SimulatorCanvas>
      }
      sidebar={sidebar}
    />
  );
}
