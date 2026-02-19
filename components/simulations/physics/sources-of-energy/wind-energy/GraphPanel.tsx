"use client";

import React, { useMemo, useRef, useState } from "react";

export type GraphPanelProps = {
  /** Current wind speed (m/s) */
  windSpeed: number;
  /** Current electrical power (kW) */
  powerKW: number;
  /** For curve: same params as main sim */
  rho: number;
  area: number;
  eta: number;
  /** Axis label size / clarity */
  largeLabels?: boolean;
  /** Is sim running (live dot moves) */
  isAnimating?: boolean;
  /** Fixed height in px (e.g. 220 for wireframe). When set, graph fills width. */
  height?: number;
};

const CP = 0.59;

function powerAtWind(rho: number, area: number, eta: number, v: number): number {
  const avail = 0.5 * rho * area * v * v * v * 0.0001;
  return avail * CP * eta;
}

export function GraphPanel({
  windSpeed,
  powerKW,
  rho,
  area,
  eta,
  largeLabels,
  isAnimating,
  height: heightProp = 140,
}: GraphPanelProps) {
  const [hoverV, setHoverV] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const windMax = 22;
  const points = 60;
  const curve = useMemo(() => {
    const out: { v: number; p: number }[] = [];
    for (let i = 0; i <= points; i++) {
      const v = (i / points) * windMax;
      out.push({ v, p: powerAtWind(rho, area, eta, v) });
    }
    return out;
  }, [rho, area, eta]);

  const maxP = Math.max(1, ...curve.map((c) => c.p));
  const padding = { top: 24, right: 20, bottom: 32, left: 44 };
  const width = 280;
  const height = heightProp;
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const toX = (v: number) => padding.left + (v / windMax) * plotW;
  const toY = (p: number) => padding.top + plotH - (p / maxP) * plotH;

  const pathD = curve.map((pt, i) => `${i === 0 ? "M" : "L"} ${toX(pt.v)} ${toY(pt.p)}`).join(" ");
  const curvePoints = curve.map((pt) => `${toX(pt.v)} ${toY(pt.p)}`).join(" L ");
  const areaD = `M ${toX(0)} ${padding.top + plotH} L ${curvePoints} L ${toX(windMax)} ${padding.top + plotH} Z`;
  const currentX = toX(Math.min(windSpeed, windMax));
  const currentY = toY(powerKW);

  const tooltipV = hoverV ?? windSpeed;
  const tooltipP = hoverV != null ? powerAtWind(rho, area, eta, tooltipV) : powerKW;

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-700/80 bg-slate-800/40 p-3 shadow-inner">
      <div className="text-[13px] font-semibold text-slate-200 uppercase tracking-wide mb-1">
        Power vs Wind Speed
      </div>
      <div className="text-[11px] text-slate-500 mb-2">
        Y: Electrical power (kW) · X: Wind speed (m/s)
      </div>
      <div className="flex flex-1 min-h-0 gap-1">
        <div className="flex flex-col justify-between py-1 text-[11px] text-slate-500 font-medium shrink-0 w-9">
          <span title="Electrical power">P (kW)</span>
          <span className="tabular-nums text-[12px]">{maxP.toFixed(0)}</span>
          <span className="tabular-nums text-[12px]">0</span>
        </div>
      <svg
        ref={svgRef}
        width="100%"
        height={plotH + padding.top + padding.bottom}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible flex-1 min-h-0"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={(e) => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = e.clientX - rect.left;
          const v = ((x - padding.left) / plotW) * windMax;
          if (v >= 0 && v <= windMax) setHoverV(v);
          else setHoverV(null);
        }}
        onMouseLeave={() => setHoverV(null)}
      >
        {/* Shaded region under curve */}
        <path d={areaD} fill="rgba(56, 189, 248, 0.12)" />
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padding.left}
            y1={padding.top + plotH * (1 - f)}
            x2={padding.left + plotW}
            y2={padding.top + plotH * (1 - f)}
            stroke="rgba(148,163,184,0.15)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        ))}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padding.left + plotW * f}
            y1={padding.top}
            x2={padding.left + plotW * f}
            y2={padding.top + plotH}
            stroke="rgba(148,163,184,0.15)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        ))}
        {/* Curve */}
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Live current point */}
        <circle
          cx={currentX}
          cy={currentY}
          r={isAnimating ? 5 : 4}
          fill="#eab308"
          stroke="#facc15"
          strokeWidth="2"
          className={isAnimating ? "animate-pulse" : ""}
        />
        {/* Tooltip dot on hover */}
        {hoverV != null && (
          <circle cx={toX(tooltipV)} cy={toY(tooltipP)} r="4" fill="rgba(248,250,252,0.9)" stroke="#94a3b8" strokeWidth="1" />
        )}
      </svg>
      </div>
      {/* X-axis label */}
      <div className="flex justify-between mt-0.5 px-1 text-[10px] text-slate-500">
        <span>0</span>
        <span className="font-medium">Wind speed v (m/s)</span>
        <span>{windMax}</span>
      </div>
      <div className={`mt-1 font-mono tabular-nums text-amber-400/90 ${largeLabels ? "text-sm" : "text-xs"}`} title="Live point from current wind and turbine parameters">
        Current: {powerKW.toFixed(2)} kW @ {windSpeed.toFixed(1)} m/s
      </div>
      {hoverV != null && (
        <div className="mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1.5 text-[10px] text-slate-200">
          Hover: v = {tooltipV.toFixed(1)} m/s → P = {tooltipP.toFixed(2)} kW
        </div>
      )}
    </div>
  );
}
