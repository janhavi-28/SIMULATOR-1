"use client";

import React from "react";

/** Semantic energy colors: Wind=cyan, Mechanical=orange, Electrical=yellow, Stored=green, Loss=red */
export const ENERGY_COLORS = {
  wind: "#22d3ee",
  mechanical: "#f97316",
  electrical: "#facc15",
  stored: "#4ade80",
  loss: "#ef4444",
} as const;

const COLORS = ENERGY_COLORS;

/** Energy shaft: turbine → pipeline. 6px, cyan→yellow gradient, blur glow, particles. Glow ∝ wind speed. */
export function EnergyShaft({
  active,
  flowLevel,
  windSpeed = 8,
  height = 120,
  className = "",
}: {
  active: boolean;
  flowLevel: number;
  windSpeed?: number;
  height?: number;
  className?: string;
}) {
  const glow = active ? 6 + (windSpeed / 25) * 18 : 0;
  const dur = Math.max(0.6, 1.8 - flowLevel * 1);
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="rounded-full relative overflow-visible"
        style={{
          width: 6,
          height,
          background: active
            ? "linear-gradient(180deg, #22d3ee 0%, #22d3ee 30%, #facc15 70%, #facc15 100%)"
            : "rgba(30,41,59,0.6)",
          boxShadow: active ? `0 0 ${glow}px rgba(34,211,238,0.5), 0 0 ${glow * 1.5}px rgba(250,204,21,0.25)` : "none",
        }}
      >
        {active && (
          <>
            <div
              className="absolute inset-0 rounded-full opacity-80"
              style={{
                background: "repeating-linear-gradient(180deg, transparent 0px, transparent 12px, rgba(255,255,255,0.5) 12px, rgba(255,255,255,0.5) 18px)",
                animation: `flow-vertical ${dur}s linear infinite`,
              }}
            />
            {/* Particle dots */}
            <div className="absolute inset-0 rounded-full" style={{ animation: `flow-vertical ${dur * 0.7}s linear infinite` }}>
              <div className="absolute left-1/2 top-0 w-1.5 h-1.5 rounded-full bg-cyan-300 -translate-x-1/2 shadow-[0_0_6px_#22d3ee]" />
            </div>
          </>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flow-vertical {
          from { transform: translateY(-24px); }
          to { transform: translateY(24px); }
        }
      `}} />
    </div>
  );
}

export function FlowArrowVertical({
  active,
  flowLevel,
  color = "wind",
  downward = true,
  className = "",
  height = 48,
  enlarged = false,
}: {
  active: boolean;
  flowLevel: number;
  color?: keyof typeof COLORS;
  downward?: boolean;
  className?: string;
  height?: number;
  enlarged?: boolean;
}) {
  const c = COLORS[color];
  const dur = Math.max(0.8, 2 - flowLevel * 1.2);
  const w = enlarged ? 12 : 8;
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="rounded-full relative overflow-hidden"
        style={{
          width: w,
          height,
          background: active ? `linear-gradient(${downward ? "180deg" : "0deg"}, ${c}, transparent)` : "rgba(30,41,59,0.5)",
          boxShadow: active ? `0 0 ${enlarged ? 16 : 12}px ${c}80` : "none",
        }}
      >
        {active && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `repeating-linear-gradient(180deg, transparent 0px, transparent 14px, rgba(255,255,255,0.6) 14px, rgba(255,255,255,0.6) 20px)`,
              animation: `flow-vertical ${dur}s linear infinite`,
            }}
          />
        )}
      </div>
      {active && (
        <span className={`font-bold mt-0.5 ${enlarged ? "text-xl" : "text-lg"}`} style={{ color: c }}>
          {downward ? "↓" : "↑"}
        </span>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flow-vertical {
          from { transform: translateY(-20px); }
          to { transform: translateY(20px); }
        }
      `}} />
    </div>
  );
}

export function FlowArrowHorizontal({
  active,
  flowLevel,
  colorFrom = "wind",
  colorTo = "electrical",
  className = "",
  width = 64,
  enlarged = false,
}: {
  active: boolean;
  flowLevel: number;
  colorFrom?: keyof typeof COLORS;
  colorTo?: keyof typeof COLORS;
  className?: string;
  width?: number;
  enlarged?: boolean;
}) {
  const from = COLORS[colorFrom];
  const to = COLORS[colorTo];
  const dur = Math.max(0.6, 1.8 - flowLevel * 1.2);
  const h = enlarged ? 10 : 8;
  return (
    <div className={`flex items-center ${className}`} style={{ width }}>
      <div
        className="flex-1 rounded-full relative overflow-hidden"
        style={{
          height: h,
          background: active ? `linear-gradient(90deg, ${from}, ${to})` : "rgba(30,41,59,0.5)",
          boxShadow: active ? `0 0 ${enlarged ? 14 : 10}px ${to}60` : "none",
        }}
      >
        {active && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "repeating-linear-gradient(90deg, transparent 0px, transparent 18px, rgba(255,255,255,0.6) 18px, rgba(255,255,255,0.6) 24px)",
              animation: `flow-horizontal ${dur}s linear infinite`,
            }}
          />
        )}
      </div>
      {active && <span className="font-bold text-sm ml-1 shrink-0" style={{ color: to }}>→</span>}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flow-horizontal {
          from { transform: translateX(-24px); }
          to { transform: translateX(24px); }
        }
      `}} />
    </div>
  );
}

export function FlowArrowCurved({ active, className = "" }: { active: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 80 50" className={className} width={80} height={50}>
      <defs>
        <linearGradient id="curve-flow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M 40 50 Q 10 25 0 0"
        fill="none"
        stroke={active ? "url(#curve-flow)" : "#334155"}
        strokeWidth={active ? 3 : 1}
        strokeLinecap="round"
        opacity={active ? 0.9 : 0.4}
      />
      {active && (
        <circle r="4" fill="#facc15">
          <animateMotion dur="1.5s" repeatCount="indefinite" path="M 40 50 Q 10 25 0 0" />
        </circle>
      )}
    </svg>
  );
}
