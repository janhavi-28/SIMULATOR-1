"use client";

import React, { useState, useEffect, useRef } from "react";
import { SimulatorContainer, SimulatorCanvas } from "./EnergySimulatorLayout";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";
import { ChevronDown, ChevronRight } from "lucide-react";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

const ETA_REF = 0.2;
const BETA = 0.004; // /°C
const T_REF = 25;

// ——— Collapsible param section ———
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
    const clamped = Math.min(max, Math.max(min, v));
    onChange(clamped);
    setInputStr(String(clamped));
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
          className="flex-1 h-2 rounded-full bg-slate-700 accent-amber-500"
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

// ——— Solar system canvas ———
function SolarSystemCanvas({
  isAnimating,
  elapsedTime,
  timeOfDay,
  intensity,
  cloudCover,
  area,
  tilt,
  orientation,
  temperature,
  inverterEta,
  irradianceWm2,
  panelTemp,
  eta,
  powerKW,
  powerHistory,
  angleOfIncidenceDeg,
}: {
  isAnimating: boolean;
  elapsedTime: number;
  timeOfDay: number;
  intensity: number;
  cloudCover: number;
  area: number;
  tilt: number;
  orientation: number;
  temperature: number;
  inverterEta: number;
  irradianceWm2: number;
  panelTemp: number;
  eta: number;
  powerKW: number;
  powerHistory: number[];
  angleOfIncidenceDeg: number;
}) {
  const viewW = 520;
  const viewH = 280;

  // Sun position on arc: 0 = dawn (left), 0.5 = noon (top), 1 = dusk (right)
  const sunT = isAnimating ? (elapsedTime / 60) % 1 : timeOfDay;
  const sunX = 0.15 * viewW + sunT * 0.7 * viewW;
  const sunY = 0.88 * viewH - 0.65 * viewH * Math.sin(sunT * Math.PI);

  const panelCX = 0.72 * viewW;
  const panelCY = 0.78 * viewH;
  const panelW = 100;
  const panelH = 32;
  const tiltRad = (tilt * Math.PI) / 180;

  const flowSpeed = 0.02 + (powerKW / 15) * 0.05;
  const dashOffset = isAnimating ? (elapsedTime * flowSpeed * 40) % 20 : 0;

  const tempOverlay = Math.max(0, (panelTemp - 35) / 40);

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col rounded-lg overflow-hidden bg-[#0c1220] border border-slate-700/60">
      {/* Sky gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 35%, #334155 70%, #1e293b 85%, #0f172a 100%)",
        }}
      />

      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="relative w-full flex-1 min-h-0 p-3" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="solar-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="rgba(148,163,184,0.6)" />
          </marker>
        </defs>
        {/* Ground line */}
        <path
          d={`M 0 ${viewH - 2} L ${viewW} ${viewH - 2}`}
          fill="none"
          stroke="rgba(71,85,105,0.6)"
          strokeWidth="1.5"
        />
        <path
          d={`M 0 ${viewH - 8} L ${viewW} ${viewH - 8}`}
          fill="rgba(30,41,59,0.5)"
          stroke="none"
        />

        {/* Sun arc path (subtle) */}
        <path
          d={`M ${0.12 * viewW} ${viewH - 5} Q ${0.5 * viewW} ${0.25 * viewH} ${0.88 * viewW} ${viewH - 5}`}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Sun */}
        <g transform={`translate(${sunX}, ${sunY})`}>
          <defs>
            <radialGradient id="sun-grad">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" />
            </radialGradient>
          </defs>
          <circle r="18" fill="url(#sun-grad)" stroke="rgba(251,191,36,0.4)" strokeWidth="0.8" />
          {isAnimating && (
            <>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const a = (i / 8) * Math.PI * 2 + elapsedTime * 0.5;
                const len = 28 + Math.sin(elapsedTime + i) * 4;
                return (
                  <line
                    key={i}
                    x1={0}
                    y1={0}
                    x2={Math.cos(a) * len}
                    y2={Math.sin(a) * len}
                    stroke="rgba(251,191,36,0.35)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                );
              })}
            </>
          )}
        </g>

        {/* Yellow rays toward panel (solar radiation) */}
        {isAnimating && powerKW > 0.1 && (
          <g stroke="rgba(251,191,36,0.25)" strokeWidth="1" fill="none">
            {[0, 1, 2, 3, 4].map((i) => {
              const frac = 0.2 + (i / 5) * 0.6 + (elapsedTime * 0.02) % 0.15;
              const x1 = sunX + (panelCX - sunX) * (frac - 0.1);
              const y1 = sunY + (panelCY - sunY) * (frac - 0.1);
              const x2 = sunX + (panelCX - sunX) * frac;
              const y2 = sunY + (panelCY - sunY) * frac;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </g>
        )}

        {/* Panel array (2 panels), with tilt and normal vector */}
        <g transform={`translate(${panelCX}, ${panelCY}) rotate(${-tilt})`}>
          <defs>
            <linearGradient id="panel-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect x={-panelW - 6} y={-panelH / 2} width={panelW} height={panelH} rx="2" fill="url(#panel-fill)" stroke="rgba(100,116,139,0.5)" strokeWidth="1" />
          <rect x={6} y={-panelH / 2} width={panelW} height={panelH} rx="2" fill="url(#panel-fill)" stroke="rgba(100,116,139,0.5)" strokeWidth="1" />
          {/* Normal vector */}
          <line x1={0} y1={0} x2={0} y2={-35} stroke="rgba(148,163,184,0.5)" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#solar-arrow)" />
          {/* Temperature overlay (red tint when hot) */}
          {tempOverlay > 0 && (
            <rect x={-panelW - 6} y={-panelH / 2} width={panelW * 2 + 12} height={panelH} rx="2" fill={`rgba(220,38,38,${tempOverlay * 0.2})`} />
          )}
        </g>

        {/* Angle of incidence label */}
        <text x={panelCX + 75} y={panelCY - 25} fill="rgba(148,163,184,0.8)" fontSize="10" fontFamily="system-ui,sans-serif">
          θ = {formatNum(angleOfIncidenceDeg, 1)}°
        </text>

        {/* Inverter box */}
        <g transform={`translate(${panelCX + 90}, ${panelCY + 25})`}>
          <rect x={-22} y={-14} width={44} height={28} rx="3" fill="rgba(30,41,59,0.9)" stroke="rgba(100,116,139,0.5)" strokeWidth="1" />
          <text x={0} y={4} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="9" fontFamily="system-ui,sans-serif">INV</text>
        </g>

        {/* DC line (panel → inverter) - blue */}
        <path
          d={`M ${panelCX + 55} ${panelCY} L ${panelCX + 68} ${panelCY} L ${panelCX + 68} ${panelCY + 25} L ${panelCX + 90} ${panelCY + 25}`}
          fill="none"
          stroke="rgba(34,211,238,0.7)"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeDashoffset={-dashOffset}
          opacity={powerKW > 0.1 ? 1 : 0.3}
        />

        {/* House (load) */}
        <g transform={`translate(${viewW - 55}, ${panelCY + 25})`}>
          <path d="M 0 -18 L 12 0 L 12 14 L -12 14 L -12 0 Z" fill="rgba(51,65,85,0.8)" stroke="rgba(100,116,139,0.5)" strokeWidth="1" />
          <rect x={-4} y={4} width={8} height={10} fill="rgba(30,41,59,0.9)" />
        </g>

        {/* AC line (inverter → house) - green */}
        <path
          d={`M ${panelCX + 112} ${panelCY + 25} L ${viewW - 55} ${panelCY + 25}`}
          fill="none"
          stroke="rgba(34,197,94,0.75)"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeDashoffset={-dashOffset * 1.2}
          opacity={powerKW > 0.1 ? 1 : 0.3}
        />
      </svg>

      {/* Top-left data panel */}
      <div className="absolute top-3 left-3 rounded-lg border border-slate-700/80 bg-slate-900/90 backdrop-blur-sm px-3 py-2 space-y-1 min-w-[140px]">
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-slate-500">Irradiance</span>
          <span className="font-mono text-slate-200 tabular-nums">{formatNum(irradianceWm2, 0)} W/m²</span>
        </div>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-slate-500">Panel T</span>
          <span className="font-mono text-slate-200 tabular-nums">{formatNum(panelTemp, 1)} °C</span>
        </div>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-slate-500">η (T)</span>
          <span className="font-mono text-slate-200 tabular-nums" title="η = η_ref [1 − β(T − T_ref)]">{formatNum(eta * 100, 1)} %</span>
        </div>
        <div className="flex justify-between gap-4 text-xs pt-1 border-t border-slate-700/60">
          <span className="text-slate-500">Output</span>
          <span className="font-mono text-emerald-400 tabular-nums font-medium">{formatNum(powerKW, 2)} kW</span>
        </div>
      </div>

      {/* Power vs time graph (bottom) */}
      <div className="h-16 shrink-0 px-3 pb-2 flex flex-col">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Power vs time</div>
        <div className="flex-1 min-h-0 rounded border border-slate-700/80 bg-slate-900/50 overflow-hidden">
          <svg viewBox="0 0 400 40" className="w-full h-full" preserveAspectRatio="none">
            {powerHistory.length >= 2 && (
              <polyline
                fill="none"
                stroke="rgba(34,197,94,0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={powerHistory
                  .map((p, i) => {
                    const x = (i / Math.max(1, powerHistory.length - 1)) * 400;
                    const y = 38 - Math.min(1, p / 15) * 34;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function SolarEnergySimulation() {
  const [intensity, setIntensity] = useState(0.8);
  const [timeOfDay, setTimeOfDay] = useState(0.5);
  const [cloudCover, setCloudCover] = useState(0);
  const [area, setArea] = useState(10);
  const [tilt, setTilt] = useState(30);
  const [orientation, setOrientation] = useState(0);
  const [temperature, setTemperature] = useState(30);
  const [inverterEta, setInverterEta] = useState(0.96);

  const [openSolar, setOpenSolar] = useState(true);
  const [openPanel, setOpenPanel] = useState(true);
  const [openTemp, setOpenTemp] = useState(true);
  const [openElec, setOpenElec] = useState(true);

  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } = useSimulationLifecycle();

  const powerHistoryRef = useRef<number[]>([]);
  const [powerHistory, setPowerHistory] = useState<number[]>([]);

  const irradianceWm2 = intensity * 1000 * (1 - cloudCover / 100);
  const panelTemp = temperature + (irradianceWm2 / 800) * 15;
  const etaTemp = 1 - BETA * Math.max(0, panelTemp - T_REF);
  const eta = ETA_REF * etaTemp;

  const sunElevationRad = (90 * Math.sin(timeOfDay * Math.PI) * Math.PI) / 180;
  const tiltRad = (tilt * Math.PI) / 180;
  const cosTheta = Math.cos(sunElevationRad) * Math.sin(tiltRad) + Math.sin(sunElevationRad) * Math.cos(tiltRad);
  const angleOfIncidenceRad = Math.acos(Math.max(0, Math.min(1, cosTheta)));
  const angleOfIncidenceDeg = (angleOfIncidenceRad * 180) / Math.PI;
  const effectiveI = irradianceWm2 * Math.max(0, Math.cos(angleOfIncidenceRad));
  const powerDC = eta * area * (effectiveI / 1000);
  const powerKW = powerDC * inverterEta;

  const lastPushRef = useRef(0);
  useEffect(() => {
    if (!isAnimating) return;
    if (elapsedTime - lastPushRef.current < 0.25) return;
    lastPushRef.current = elapsedTime;
    const arr = [...powerHistoryRef.current, powerKW];
    if (arr.length > 100) arr.shift();
    powerHistoryRef.current = arr;
    setPowerHistory(arr);
  }, [isAnimating, elapsedTime, powerKW]);

  useEffect(() => {
    if (!isAnimating) {
      powerHistoryRef.current = [];
      setPowerHistory([]);
    }
  }, [isAnimating]);

  const paramsPanel = (
    <div className="flex flex-col gap-3">
      <ParamSection title="Solar conditions" open={openSolar} onToggle={() => setOpenSolar(!openSolar)}>
        <ParamRow label="Irradiance" value={intensity} min={0.2} max={1.2} step={0.05} unit="kW/m²" onChange={setIntensity} />
        <ParamRow label="Time of day" value={timeOfDay} min={0} max={1} step={0.05} unit="—" onChange={setTimeOfDay} />
        <ParamRow label="Cloud cover" value={cloudCover} min={0} max={80} step={5} unit="%" onChange={setCloudCover} />
      </ParamSection>
      <ParamSection title="Panel setup" open={openPanel} onToggle={() => setOpenPanel(!openPanel)}>
        <ParamRow label="Area" value={area} min={2} max={30} step={1} unit="m²" onChange={setArea} />
        <ParamRow label="Tilt" value={tilt} min={0} max={60} step={5} unit="°" onChange={setTilt} />
        <ParamRow label="Orientation" value={orientation} min={-30} max={30} step={5} unit="°" onChange={setOrientation} />
      </ParamSection>
      <ParamSection title="Temperature" open={openTemp} onToggle={() => setOpenTemp(!openTemp)}>
        <ParamRow label="Cell temp" value={temperature} min={0} max={60} step={2} unit="°C" onChange={setTemperature} />
      </ParamSection>
      <ParamSection title="Electrical" open={openElec} onToggle={() => setOpenElec(!openElec)}>
        <ParamRow label="Inverter η" value={inverterEta} min={0.9} max={0.99} step={0.01} unit="—" onChange={setInverterEta} />
      </ParamSection>
    </div>
  );

  return (
    <SimulatorContainer
      title="Solar Energy"
      subtitle="System: sunlight → PV array → inverter → load. Incidence angle and temperature effects."
      hasLaunched={hasLaunched}
      paused={isPaused}
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      canvas={
        <SimulatorCanvas>
          <div className="w-full h-full min-h-0 flex flex-col">
            <SolarSystemCanvas
              isAnimating={isAnimating}
              elapsedTime={elapsedTime}
              timeOfDay={timeOfDay}
              intensity={intensity}
              cloudCover={cloudCover}
              area={area}
              tilt={tilt}
              orientation={orientation}
              temperature={temperature}
              inverterEta={inverterEta}
              irradianceWm2={irradianceWm2}
              panelTemp={panelTemp}
              eta={eta}
              powerKW={powerKW}
              powerHistory={powerHistory}
              angleOfIncidenceDeg={angleOfIncidenceDeg}
            />
          </div>
        </SimulatorCanvas>
      }
      sidebar={paramsPanel}
    />
  );
}
