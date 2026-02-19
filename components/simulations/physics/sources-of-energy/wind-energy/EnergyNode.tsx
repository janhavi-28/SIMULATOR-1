"use client";

import React, { useState } from "react";

/** Semantic color tokens — strict scientific palette */
const TOKENS = {
  wind: "#22d3ee",
  mechanical: "#f97316",
  electrical: "#facc15",
  stored: "#4ade80",
  loss: "#ef4444",
  panel: "#0f172a",
  panelDark: "#020617",
  border: "#1e293b",
  text: "#e2e8f0",
  muted: "#64748b",
  glowElectric: "rgba(250,204,21,.6)",
  glowStorage: "rgba(74,222,128,.6)",
  glowWind: "rgba(34,211,238,.6)",
} as const;

export type EnergyNodeProps = {
  id: string;
  title: string;
  label: string;
  icon: React.ReactNode;
  value?: string;
  energyIn: string;
  energyOut: string;
  functionText: string;
  isActive: boolean;
  accentColor: keyof typeof TOKENS;
  onClick?: () => void;
  showTooltip?: boolean;
  status?: "active" | "idle" | "warning" | "failure";
};

const CARD_WIDTH = 130;
const CARD_HEIGHT = 110;

export function EnergyNode({
  title,
  label,
  icon,
  value,
  energyIn,
  energyOut,
  functionText,
  isActive,
  accentColor,
  onClick,
  showTooltip = true,
  status = "idle",
}: EnergyNodeProps) {
  const [hover, setHover] = useState(false);
  const show = showTooltip && hover;
  const color = TOKENS[accentColor] ?? TOKENS.electrical;
  const glow = isActive ? (accentColor === "stored" ? TOKENS.glowStorage : accentColor === "wind" ? TOKENS.glowWind : TOKENS.glowElectric) : "transparent";

  const statusDot = {
    active: "bg-emerald-500",
    idle: "bg-sky-500",
    warning: "bg-amber-500",
    failure: "bg-red-500",
  }[status];

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative flex flex-col items-center justify-center rounded-[18px] p-4 text-left transition-all duration-[180ms] overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: "linear-gradient(180deg, #0f172a, #020617)",
        borderWidth: 1,
        borderColor: isActive ? color : "#1e293b",
        boxShadow: isActive
          ? `0 0 12px ${glow}, 0 0 40px ${glow}, 0 0 0 1px rgba(255,255,255,.03), 0 8px 30px rgba(0,0,0,.6)`
          : "0 0 0 1px rgba(255,255,255,.03), 0 8px 30px rgba(0,0,0,.6)",
        transform: hover ? "scale(1.04)" : "scale(1)",
        fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-[18px] opacity-60"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.4))",
        }}
      />
      {status !== "idle" && (
        <span
          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${statusDot} animate-pulse`}
          style={{ animationDuration: "1.6s" }}
          aria-hidden
        />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-1">
        <div className="flex items-center justify-center w-10 h-10 text-slate-300 [&_svg]:w-8 [&_svg]:h-8 [&_svg]:stroke-[2.2] [&_svg]:fill-none">
          {icon}
        </div>
        <span className="text-[13px] font-semibold uppercase tracking-wide text-[#e2e8f0]">
          {title}
        </span>
        <span className="text-[11px] text-[#64748b]">{label}</span>
        {value != null && (
          <span className="text-[12px] font-bold tabular-nums mt-0.5" style={{ color }}>
            {value}
          </span>
        )}
      </div>
      {show && (
        <div
          className="absolute z-[100] left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 rounded-xl border text-left pointer-events-none shadow-xl"
          style={{
            background: "#0f172a",
            borderColor: color,
            borderWidth: 1,
            fontSize: 13,
          }}
        >
          <div className="font-semibold text-[#e2e8f0]">{title}</div>
          <div className="text-[#64748b] mt-0.5">{functionText}</div>
          <div className="text-[11px] text-[#64748b] mt-2">
            In: {energyIn} → Out: {energyOut}
          </div>
        </div>
      )}
    </button>
  );
}

export { CARD_WIDTH, CARD_HEIGHT };
