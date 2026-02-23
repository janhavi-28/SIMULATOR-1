"use client";

import React, { useState, useEffect } from "react";
import { SimulatorContainer, SimulatorCanvas } from "./EnergySimulatorLayout";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";
import { ChevronDown, ChevronRight } from "lucide-react";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

// ——— Collapsible section with slider + numeric input ———
function ParamSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-800/30">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-700/30 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
      </button>
      {open && <div className="px-3 pb-3 pt-0 space-y-3 border-t border-slate-700/60">{children}</div>}
    </div>
  );
}

function ParamRow({
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
  const [inputStr, setInputStr] = useState(String(value));
  useEffect(() => setInputStr(String(value)), [value]);
  const apply = () => {
    const v = parseFloat(inputStr);
    if (!Number.isFinite(v)) return;
    onChange(Math.min(max, Math.max(min, v)));
    setInputStr(String(Math.min(max, Math.max(min, v))));
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-[10px] text-slate-500">{unit}</span>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => { onChange(Number(e.target.value)); setInputStr(e.target.value); }}
          aria-label="Toggle reflection insight"
          className="flex-1 h-2 rounded-full bg-slate-700 accent-slate-400"
        />
        <input
          type="text"
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          aria-label="Toggle reflection insight"
          className="w-14 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-right text-xs font-mono text-slate-200"
        />
      </div>
    </div>
  );
}

// ——— Thick pipe with animated flow and arrow ———
function PipeSegment({
  x1,
  y1,
  x2,
  y2,
  colorId,
  isActive,
  dashOffset,
  pipeWidth = 22,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colorId: string;
  isActive: boolean;
  dashOffset: number;
  pipeWidth?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const perpX = -dy / len;
  const perpY = dx / len;
  const h = pipeWidth / 2;
  const path = `M ${x1 + perpX * h} ${y1 + perpY * h} L ${x2 + perpX * h} ${y2 + perpY * h} L ${x2 - perpX * h} ${y2 - perpY * h} L ${x1 - perpX * h} ${y1 - perpY * h} Z`;
  const arrowSize = 14;
  return (
    <g>
      <path d={path} fill="rgba(51,65,85,0.85)" stroke="rgba(100,116,139,0.5)" strokeWidth="1.5" />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={`url(#${colorId})`}
        strokeWidth={pipeWidth * 0.55}
        strokeLinecap="round"
        strokeDasharray="12 14"
        strokeDashoffset={-dashOffset}
        opacity={isActive ? 1 : 0.3}
      />
      <polygon
        points={`${x2 - arrowSize * Math.cos(angle) + 6 * perpX},${y2 - arrowSize * Math.sin(angle) + 6 * perpY} ${x2 - arrowSize * Math.cos(angle) - 6 * perpX},${y2 - arrowSize * Math.sin(angle) - 6 * perpY} ${x2},${y2}`}
        fill={`url(#${colorId})`}
        opacity={isActive ? 1 : 0.35}
      />
    </g>
  );
}

// ——— Live metric card: bright borders, bold luminous values, subtle transition on change ———
function LiveMetricCard({ label, value, unit, active, electrical }: { label: string; value: string; unit: string; active?: boolean; electrical?: boolean }) {
  const activeStyle = electrical && active
    ? "border-emerald-400/70 bg-emerald-500/15 shadow-[0_0_24px_rgba(16,185,129,0.15)]"
    : active
    ? "border-amber-400/60 bg-amber-500/15 shadow-[0_0_24px_rgba(245,158,11,0.12)]"
    : "border-slate-500/60 bg-slate-700/50";
  const valueStyle = electrical && active ? "text-emerald-300 font-bold" : active ? "text-amber-300 font-bold" : "text-slate-300 font-semibold";
  return (
    <div className={`rounded-lg border-2 px-4 py-2.5 flex flex-col items-center justify-center min-w-0 flex-1 transition-all duration-200 ${activeStyle}`}>
      <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate w-full text-center font-medium">{label}</div>
      <div className={`font-mono text-base tabular-nums mt-1 ${valueStyle}`}>
        <span className="inline-block transition-opacity duration-150">{value}</span> <span className="text-slate-400 text-sm font-normal">{unit}</span>
      </div>
    </div>
  );
}

// ——— Process canvas: 80% pipeline, 20% metrics strip ———
function ThermalProcessCanvas({
  isAnimating,
  elapsedTime,
  fuelRate,
  boilerEta,
  turbineEta,
  generatorEta,
  inputHeat,
  mechOut,
  elecOut,
  overallEta,
}: {
  isAnimating: boolean;
  elapsedTime: number;
  fuelRate: number;
  boilerEta: number;
  turbineEta: number;
  generatorEta: number;
  inputHeat: number;
  mechOut: number;
  elecOut: number;
  overallEta: number;
}) {
  const boilerTemp = 450 + fuelRate * 200;
  const steamPressure = 80 + (inputHeat * boilerEta / 60) * 120;
  const turbineRPM = 2500 + (mechOut / 35) * 1100;
  const flowSpeed = 0.5 + fuelRate * 0.5;
  const rotationSpeed = 0.35 + (steamPressure / 200) * 0.9;
  const dashOff = elapsedTime * flowSpeed * 25;

  const W = 900;
  const H = 200;
  const cy = 100;
  const pipeW = 22;

  const fuelX = 55;
  const boilerX = 185;
  const turbineX = 345;
  const genX = 505;
  const coolingX = 665;
  const gridX = 845;

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-gradient-to-b from-slate-800 via-slate-800/95 to-slate-900">
      <div className="flex-[3] min-h-0 w-full flex items-stretch justify-stretch">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full min-w-0 min-h-0 shrink-0" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="thermal-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="steam-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="1" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="mech-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="elec-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="teal-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <filter id="thermal-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#f97316" floodOpacity="0.6" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="turbine-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.55" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="gen-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feFlood floodColor="#22c55e" floodOpacity="0.55" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Stage labels above components */}
        <text x={fuelX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Fuel</text>
        <text x={boilerX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Boiler</text>
        <text x={turbineX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Turbine</text>
        <text x={genX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Generator</text>
        <text x={coolingX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Cooling</text>
        <text x={gridX} y={cy - 58} textAnchor="middle" fill="rgba(203,213,225,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">Grid</text>

        {/* Pipeline: Fuel → Boiler (thermal) */}
        <PipeSegment x1={fuelX + 24} y1={cy} x2={boilerX - 48} y2={cy} colorId="thermal-flow" isActive={isAnimating} dashOffset={dashOff} pipeWidth={pipeW} />

        {/* Fuel */}
        <g transform={`translate(${fuelX}, ${cy})`}>
          <path d="M -24 -28 L 24 -28 L 20 20 L -20 20 Z" fill="rgba(71,85,105,0.9)" stroke="rgba(148,163,184,0.6)" strokeWidth="1.5" />
          <text x={0} y={2} textAnchor="middle" fill="rgba(226,232,240,0.95)" fontSize="10" fontFamily="system-ui,sans-serif" fontWeight="600">FUEL</text>
        </g>

        {/* Pipeline: Boiler → Turbine (steam – cyan/white) */}
        <PipeSegment x1={boilerX + 48} y1={cy} x2={turbineX - 52} y2={cy} colorId="steam-flow" isActive={isAnimating} dashOffset={dashOff * 1.05} pipeWidth={pipeW} />

        {/* Boiler: warm orange/red glow when active */}
        <g transform={`translate(${boilerX}, ${cy})`}>
          <ellipse cx="0" cy="-10" rx="48" ry="28" fill="rgba(55,65,81,0.9)" stroke="rgba(251,146,60,0.5)" strokeWidth="1.5" />
          <rect x="-48" y="-10" width="96" height="34" fill="rgba(55,65,81,0.95)" stroke="rgba(251,146,60,0.5)" strokeWidth="1.5" />
          <ellipse cx="0" cy="24" rx="42" ry="14" fill="rgba(30,41,59,0.85)" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
          <ellipse cx="0" cy="38" rx="28" ry="12" fill={isAnimating ? "rgba(234,88,12,0.5)" : "rgba(234,88,12,0.12)"} stroke="rgba(251,146,60,0.8)" strokeWidth="1.5" filter={isAnimating ? "url(#thermal-glow)" : undefined} />
          {isAnimating && [0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={-10 + (i % 3) * 10} cy={40 + (elapsedTime * flowSpeed * 4 + i * 2) % 8} rx="5" ry="4" fill="rgba(253,186,116,0.9)" />
          ))}
          {isAnimating && [0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={-38 + (elapsedTime * flowSpeed * 14 + i * 10) % 76} cy={-4 - (i % 2) * 6} r="2.5" fill="rgba(224,242,254,0.9)" />
          ))}
        </g>

        {/* Pipeline: Turbine → Generator (mechanical – electric blue) */}
        <PipeSegment x1={turbineX + 52} y1={cy} x2={genX - 44} y2={cy} colorId="mech-flow" isActive={isAnimating} dashOffset={dashOff * 1.1} pipeWidth={pipeW} />

        {/* Turbine: bright electric blue, rotating */}
        <g transform={`translate(${turbineX}, ${cy})`}>
          <circle cx="0" cy="0" r="52" fill="rgba(30,58,138,0.4)" stroke="rgba(96,165,250,0.7)" strokeWidth="2" filter={isAnimating && mechOut > 1 ? "url(#turbine-glow)" : undefined} />
          <circle cx="0" cy="0" r="14" fill="rgba(30,41,59,0.95)" stroke="rgba(147,197,253,0.6)" strokeWidth="1.5" />
          <g transform={`rotate(${isAnimating ? (elapsedTime * rotationSpeed * 360) % 360 : 0})`}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <line key={i} x1="0" y1="0" x2="0" y2="-44" stroke="rgba(147,197,253,0.95)" strokeWidth="3" transform={`rotate(${i * 45})`} strokeLinecap="round" />
            ))}
          </g>
        </g>

        {/* Pipeline: Generator → Cooling (electrical – green) */}
        <PipeSegment x1={genX + 44} y1={cy} x2={coolingX - 40} y2={cy} colorId="elec-flow" isActive={isAnimating && elecOut > 0.5} dashOffset={dashOff * 1.2} pipeWidth={pipeW} />

        {/* Generator: green accent, subtle pulse when running */}
        <g transform={`translate(${genX}, ${cy})`}>
          <rect x="-44" y="-28" width="88" height="56" rx="5" fill="rgba(30,41,59,0.9)" stroke="rgba(74,222,128,0.6)" strokeWidth="1.5" filter={elecOut > 0.5 && isAnimating ? "url(#gen-glow)" : undefined} />
          <circle cx="0" cy="0" r="18" fill="none" stroke="rgba(74,222,128,0.85)" strokeWidth="2.5" opacity={elecOut > 0.5 && isAnimating ? 0.7 + 0.2 * Math.sin(elapsedTime * 5) : 0.6} />
          <path d="M -12 -12 L 12 12 M 12 -12 L -12 12 M -18 0 L 18 0 M 0 -18 L 0 18" stroke="rgba(74,222,128,0.6)" strokeWidth="1.5" />
        </g>

        {/* Pipeline: Cooling → Grid (teal) */}
        <PipeSegment x1={coolingX + 40} y1={cy} x2={gridX - 28} y2={cy} colorId="teal-flow" isActive={isAnimating && elecOut > 0.5} dashOffset={dashOff * 1.2} pipeWidth={pipeW} />

        {/* Cooling tower */}
        <g transform={`translate(${coolingX}, ${cy})`}>
          <path d="M -34 34 L -18 -22 L 0 -34 L 18 -22 L 34 34 Z" fill="rgba(71,85,105,0.6)" stroke="rgba(148,163,184,0.6)" strokeWidth="1.5" />
          {isAnimating && [0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={(elapsedTime * 4 + i * 10) % 28 - 14} cy={-10 - (i * 6) % 14} rx="8" ry="5" fill="none" stroke="rgba(226,232,240,0.6)" strokeWidth="1.2" />
          ))}
        </g>

        {/* Grid (output – teal highlight) */}
        <g transform={`translate(${gridX}, ${cy})`}>
          <rect x="-28" y="-22" width="56" height="44" rx="4" fill="rgba(20,184,166,0.15)" stroke="rgba(45,212,191,0.7)" strokeWidth="1.5" />
          <text x={0} y={6} textAnchor="middle" fill="rgba(94,234,212,0.95)" fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">GRID</text>
        </g>
      </svg>
      </div>
      <div className="flex-[1] min-h-0 shrink-0 flex items-center gap-3 px-3 py-2 border-t border-slate-500/50 bg-slate-800/40" aria-label="Live metrics">
        <LiveMetricCard label="Boiler" value={formatNum(boilerTemp, 0)} unit="°C" active={isAnimating} />
        <LiveMetricCard label="Steam pressure" value={formatNum(steamPressure, 0)} unit="bar" active={isAnimating} />
        <LiveMetricCard label="Turbine" value={formatNum(turbineRPM, 0)} unit="RPM" active={isAnimating} />
        <LiveMetricCard label="Output" value={formatNum(elecOut, 2)} unit="MW" active={elecOut > 0.5} electrical />
        <LiveMetricCard label="Efficiency" value={formatNum(overallEta, 1)} unit="%" active={overallEta > 0} electrical />
      </div>
    </div>
  );
}

export default function ThermalPowerPlantSimulation() {
  const [fuelRate, setFuelRate] = useState(1.5);
  const [boilerEta, setBoilerEta] = useState(0.85);
  const [turbineEta, setTurbineEta] = useState(0.7);
  const [generatorEta, setGeneratorEta] = useState(0.9);
  const [coolingEff, setCoolingEff] = useState(0.88);

  const [openFuel, setOpenFuel] = useState(true);
  const [openTurbine, setOpenTurbine] = useState(true);
  const [openGenerator, setOpenGenerator] = useState(true);
  const [openCooling, setOpenCooling] = useState(false);

  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();

  const inputHeat = 50 * fuelRate;
  const mechOut = inputHeat * boilerEta * turbineEta;
  const elecOut = mechOut * generatorEta;
  const overallEta = (elecOut / inputHeat) * 100;

  const paramsPanel = (
    <div className="flex flex-col gap-3">
      <ParamSection title="Fuel & Boiler" open={openFuel} onToggle={() => setOpenFuel(!openFuel)}>
        <ParamRow label="Fuel rate" value={fuelRate} min={0.5} max={3} step={0.25} unit="×" onChange={setFuelRate} />
        <ParamRow label="Boiler efficiency" value={boilerEta} min={0.6} max={0.95} step={0.05} unit="—" onChange={setBoilerEta} />
      </ParamSection>
      <ParamSection title="Turbine" open={openTurbine} onToggle={() => setOpenTurbine(!openTurbine)}>
        <ParamRow label="Turbine efficiency" value={turbineEta} min={0.5} max={0.9} step={0.05} unit="—" onChange={setTurbineEta} />
      </ParamSection>
      <ParamSection title="Generator" open={openGenerator} onToggle={() => setOpenGenerator(!openGenerator)}>
        <ParamRow label="Generator efficiency" value={generatorEta} min={0.7} max={0.98} step={0.02} unit="—" onChange={setGeneratorEta} />
      </ParamSection>
      <ParamSection title="Cooling" open={openCooling} onToggle={() => setOpenCooling(!openCooling)}>
        <ParamRow label="Condenser effectiveness" value={coolingEff} min={0.7} max={0.98} step={0.02} unit="—" onChange={setCoolingEff} />
      </ParamSection>
    </div>
  );

  return (
    <SimulatorContainer
      title="Thermal Power Plant"
      subtitle="Process-based: fuel → steam → turbine → generator. Flow and rotation scale with parameters."
      hasLaunched={hasLaunched}
      paused={isPaused}
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      canvas={
        <SimulatorCanvas fullBleed>
          <div className="w-full h-full min-h-0 flex flex-col flex-1">
            <ThermalProcessCanvas
              isAnimating={isAnimating}
              elapsedTime={elapsedTime}
              fuelRate={fuelRate}
              boilerEta={boilerEta}
              turbineEta={turbineEta}
              generatorEta={generatorEta}
              inputHeat={inputHeat}
              mechOut={mechOut}
              elecOut={elecOut}
              overallEta={overallEta}
            />
          </div>
        </SimulatorCanvas>
      }
      sidebar={paramsPanel}
    />
  );
}
