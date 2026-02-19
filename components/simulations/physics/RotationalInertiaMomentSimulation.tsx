"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";

// ─── Constants & types ─────────────────────────────────────────────────────
const RAMP_LENGTH = 8; // m
const DEFAULT_ANGLE = 25;
const DEFAULT_MASS = 2;
const DEFAULT_RADIUS = 0.3;
const DEFAULT_G = 9.81;
const DEFAULT_FRICTION = 0.3; // surface friction (rolling resistance factor for visuals)
const TRACK_OFFSET = 0.4; // lateral offset of each track from ramp center (world units)
const BASE_MASS = 1;
const SLOWMO_DURATION = 3; // seconds at 0.25x after finish

interface Params {
  angleDeg: number;
  mass: number;
  radius: number;
  g: number;
  friction: number;
}

interface SliderSpec {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  icon?: string;
  dramaticRange?: [number, number];
}

// ─── Physics: rolling without slipping down incline ─────────────────────────
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Linear acceleration: a = g sin(θ) / (1 + I/(MR²))
// Disk: I = (1/2) M R² → factor 1.5; Ring: I = M R² → factor 2
function getAccelerationDisk(params: Params): number {
  const θ = toRad(params.angleDeg);
  return (params.g * Math.sin(θ)) / 1.5;
}

function getAccelerationRing(params: Params): number {
  const θ = toRad(params.angleDeg);
  return (params.g * Math.sin(θ)) / 2;
}

// At distance s from rest: v = sqrt(2 a s)
function getSpeedFromDistance(a: number, s: number): number {
  return Math.sqrt(2 * a * Math.max(0, s));
}

// Energy split: disk KE_trans = 2/3 total, KE_rot = 1/3; ring 50-50
function getDiskEnergyFractions(): { trans: number; rot: number } {
  return { trans: 2 / 3, rot: 1 / 3 };
}
function getRingEnergyFractions(): { trans: number; rot: number } {
  return { trans: 0.5, rot: 0.5 };
}

// Visual radius ∝ ∛mass for consistent volume scaling
function visualRadius(mass: number, baseRadiusPx: number): number {
  return baseRadiusPx * Math.cbrt(mass / BASE_MASS);
}

function interpolate(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

function fmt(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

// ─── Parameter Slider ──────────────────────────────────────────────────────
function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  defaultValue,
  icon,
  onChange,
  dark,
}: SliderSpec & { onChange: (v: number) => void; dark?: boolean }) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  const textClass = dark ? "text-neutral-200" : "text-[#111827]";
  const muteClass = dark ? "text-neutral-400" : "text-[#6B7280]";
  const valueClass = dark ? "text-[#93C5FD]" : "text-[#3B82F6]";
  const trackClass = dark ? "bg-[#374151]" : "bg-[#E5E7EB]";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={`flex items-center gap-2 text-sm font-medium ${textClass}`}>
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className={`text-xs tabular-nums w-6 ${muteClass}`}>{fmt(min)}</span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-3 flex-1 min-w-0 cursor-pointer appearance-none rounded-full ${trackClass} accent-[#3B82F6] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3B82F6] [&::-webkit-slider-thumb]:shadow`}
          aria-label={`${label}: ${value} ${unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
        />
        <span className={`text-xs tabular-nums w-6 ${muteClass}`}>{fmt(max)}</span>
      </div>
      <div className="flex justify-end">
        <span className={`font-semibold tabular-nums text-sm ${valueClass}`}>
          {value < 1 ? fmt(value, 2) : fmt(value, 1)} {unit}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function RotationalInertiaMomentSimulation() {
  const [angleDeg, setAngleDeg] = useState(DEFAULT_ANGLE);
  const [mass, setMass] = useState(DEFAULT_MASS);
  const [friction, setFriction] = useState(DEFAULT_FRICTION);

  const [smoothAngle, setSmoothAngle] = useState(DEFAULT_ANGLE);
  const [smoothMass, setSmoothMass] = useState(DEFAULT_MASS);
  const [smoothFriction, setSmoothFriction] = useState(DEFAULT_FRICTION);

  // Live stats for UI (updated from animation loop, throttled)
  const [liveStats, setLiveStats] = useState({
    sDisk: 0,
    sRing: 0,
    vDisk: 0,
    vRing: 0,
    winner: null as "disk" | "ring" | null,
  });

  const [resetKey, setResetKey] = useState(0);

  const params: Params = {
    angleDeg: smoothAngle,
    mass: smoothMass,
    radius: DEFAULT_RADIUS,
    g: DEFAULT_G,
    friction: smoothFriction,
  };
  const aDisk = getAccelerationDisk(params);
  const aRing = getAccelerationRing(params);

  const resetRace = useCallback(() => {
    setResetKey((k) => k + 1);
    setLiveStats((prev) => ({ ...prev, sDisk: 0, sRing: 0, vDisk: 0, vRing: 0, winner: null }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothAngle((p) => interpolate(p, angleDeg, 0.12));
      setSmoothMass((p) => interpolate(p, mass, 0.12));
      setSmoothFriction((p) => interpolate(p, friction, 0.12));
    }, 16);
    return () => clearInterval(interval);
  }, [angleDeg, mass, friction]);

  useEffect(() => {
    resetRace();
  }, [angleDeg, mass, friction, resetRace]);

  const resetToDefault = useCallback(() => {
    setAngleDeg(DEFAULT_ANGLE);
    setMass(DEFAULT_MASS);
    setFriction(DEFAULT_FRICTION);
    resetRace();
  }, [resetRace]);

  // ─── Dynamic 3D Scene Import ───────────────────────────────────────────────
  const RotationalInertia3DView = dynamic(
    () =>
      import("./RotationalInertiaScene3D").then((m) => m.RotationalInertia3DView),
    { ssr: false }
  );

  const diskFrac = getDiskEnergyFractions();
  const ringFrac = getRingEnergyFractions();
  const { vDisk, vRing, winner } = liveStats;

  const sliders: SliderSpec[] = [
    {
      label: "Incline Angle",
      value: angleDeg,
      min: 5,
      max: 45,
      step: 1,
      unit: "°",
      defaultValue: DEFAULT_ANGLE,
      icon: "📐",
      dramaticRange: [20, 35],
    },
    {
      label: "Object Mass",
      value: mass,
      min: 0.5,
      max: 10,
      step: 0.5,
      unit: "kg",
      defaultValue: DEFAULT_MASS,
      icon: "📦",
      dramaticRange: [2, 5],
    },
    {
      label: "Surface Friction",
      value: friction,
      min: 0.1,
      max: 0.8,
      step: 0.05,
      unit: "",
      defaultValue: DEFAULT_FRICTION,
      icon: "🔄",
      dramaticRange: [0.2, 0.5],
    },
  ];

  const leadMeters = Math.abs(liveStats.sDisk - liveStats.sRing);
  const leaderText =
    liveStats.winner !== null
      ? `${liveStats.winner === "disk" ? "Disk" : "Ring"} Wins!`
      : liveStats.sDisk >= liveStats.sRing
        ? `Disk leading by ${fmt(leadMeters, 1)} m…`
        : `Ring leading by ${fmt(leadMeters, 1)} m…`;

  return (
    <div className="flex flex-col bg-[#1E1E1E] text-[#E5E7EB] min-h-screen">
      {/* Top: 70vh — Simulation (65%) + Controls (35%) */}
      <div className="flex flex-col lg:flex-row" style={{ height: "70vh", minHeight: 400 }}>
        {/* Simulation box — 65% width, fixed aspect */}
        <div className="w-full lg:w-[65%] flex flex-col h-full border border-[#374151] bg-[#1E1E1E] overflow-hidden">
          <div className="px-3 py-2 border-b border-[#374151] bg-[#252525]/80">
            <h2 className="text-sm font-semibold text-[#E5E7EB]">Interactive Rotational Inertia Lab</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Solid disk vs ring rolling down an inclined plane. Same mass and radius—different mass distribution.
            </p>
          </div>
          <div className="relative flex-1 min-h-0 w-full" style={{ aspectRatio: "16/10", minHeight: 280 }}>
            <RotationalInertia3DView
              angleDeg={smoothAngle}
              mass={smoothMass}
              friction={smoothFriction}
              onStatsChange={setLiveStats}
              resetKey={resetKey}
            />
            {/* Glassmorphism Live Energy overlay inside 3D canvas area */}
            <div
              className="absolute bottom-3 right-3 rounded-xl border border-white/20 p-3 shadow-xl backdrop-blur-md"
              style={{
                background: "rgba(30, 30, 30, 0.65)",
                maxWidth: "220px",
              }}
              aria-label="Live energy distribution"
            >
              <h4 className="text-xs font-semibold text-[#93C5FD] mb-2">Live Energy</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-neutral-400 mb-0.5">Disk</p>
                  <div className="h-14 rounded bg-black/30 overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-[#3B82F6] transition-all duration-150"
                      style={{ height: `${diskFrac.trans * 100}%` }}
                    />
                    <div
                      className="w-full bg-[#8B5CF6] transition-all duration-150"
                      style={{ height: `${diskFrac.rot * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 mb-0.5">Ring</p>
                  <div className="h-14 rounded bg-black/30 overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-[#3B82F6] transition-all duration-150"
                      style={{ height: `${ringFrac.trans * 100}%` }}
                    />
                    <div
                      className="w-full bg-[#8B5CF6] transition-all duration-150"
                      style={{ height: `${ringFrac.rot * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1.5">
                Blue ½mv² · Purple ½Iω² · Disk {fmt(vDisk, 2)} m/s · Ring {fmt(vRing, 2)} m/s
              </p>
            </div>
          </div>
        </div>

        {/* Data dashboard — 35%, dark panel */}
        <div className="w-full lg:w-[35%] flex flex-col gap-4 p-4 bg-[#252525] border border-[#374151] border-l-0 overflow-auto">
          <h3 className="text-sm font-semibold text-[#93C5FD]">Parameter Controls</h3>
          {sliders.map((spec) => (
            <ParameterSlider
              key={spec.label}
              {...spec}
              dark
              onChange={(v) => {
                if (spec.label === "Incline Angle") setAngleDeg(v);
                else if (spec.label === "Object Mass") setMass(v);
                else if (spec.label === "Surface Friction") setFriction(v);
              }}
            />
          ))}

          {/* Status bar ticker */}
          <div className="mt-auto pt-2 border-t border-[#374151]">
            <p className="text-xs text-[#9CA3AF] mb-1">Status</p>
            <p className="text-sm font-medium text-[#22C55E] tabular-nums truncate" title={leaderText}>
              {leaderText}
            </p>
            <button
              type="button"
              onClick={resetToDefault}
              className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#252525]"
              aria-label="Reset simulation to default"
            >
              ↩ Reset Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: 30vh — Educational content (dark theme) */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-[#252525] border-t border-[#374151]" style={{ minHeight: "30vh" }}>
        <div className="md:w-[40%] space-y-3">
          <h3 className="text-base font-bold text-[#93C5FD]">✨ The Concept</h3>
          <p className="text-sm text-[#D1D5DB]">
            When a disk and a ring of the same mass and radius roll down an incline without slipping,
            the disk wins because more of its mass is near the center—so it has lower rotational inertia (I = ½MR²).
            The ring has I = MR², so more energy goes into rotation and less into translation.
          </p>
          <h3 className="text-base font-bold text-[#93C5FD]">📐 Key Formula</h3>
          <p className="text-sm font-mono text-[#E5E7EB] bg-[#374151] p-2 rounded">
            a = g·sin(θ) / (1 + I/(MR²))
          </p>
          <p className="text-xs text-[#9CA3AF]">
            Disk: I = ½MR² → factor 1.5 → a = ⅔ g sin θ. Ring: I = MR² → factor 2 → a = ½ g sin θ.
          </p>
        </div>
        <div className="md:w-[30%] space-y-2">
          <h3 className="text-base font-bold text-[#93C5FD]">⚡ Live Stats</h3>
          <div className="text-xs font-mono bg-[#1E1E1E] border border-[#374151] rounded p-2 space-y-1 text-[#D1D5DB]">
            <p>Disk a = {fmt(aDisk, 2)} m/s²</p>
            <p>Ring a = {fmt(aRing, 2)} m/s²</p>
            <p>Disk v = {fmt(vDisk, 2)} m/s</p>
            <p>Ring v = {fmt(vRing, 2)} m/s</p>
            <p>Winner: {winner === "disk" ? "Disk" : winner === "ring" ? "Ring" : "—"}</p>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            θ = {fmt(smoothAngle, 0)}°, M = {fmt(smoothMass, 1)} kg
          </p>
        </div>
        <div className="md:w-[30%] space-y-2">
          <h3 className="text-base font-bold text-[#93C5FD]">💡 Try This for Drama!</h3>
          <ul className="text-sm text-[#D1D5DB] space-y-1.5 list-none">
            <li className="flex items-start gap-2">
              <span aria-hidden>🎯</span>
              <span><strong className="text-[#FCD34D]">Steep ramp:</strong> Angle = 40°, Mass = 2 kg → disk wins by a large margin.</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>⚡</span>
              <span><strong className="text-[#FCD34D]">Gentle ramp:</strong> Angle = 10° → slower race, same outcome.</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>🌟</span>
              <span><strong className="text-[#FCD34D]">Heavy objects:</strong> Mass = 8 kg → same physics, bigger visual size.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
