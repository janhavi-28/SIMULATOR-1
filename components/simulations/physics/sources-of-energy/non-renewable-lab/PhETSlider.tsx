"use client";

import React, { useState } from "react";

/** Slider zone color: low = green, medium = yellow, high = red */
function zoneColor(percent: number): string {
  if (percent <= 33) return "#22c55e";
  if (percent <= 66) return "#eab308";
  return "#ef4444";
}

export interface PhETSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  tooltip?: string;
  minLabel?: string;
  maxLabel?: string;
}

export function PhETSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  tooltip,
  minLabel,
  maxLabel,
}: PhETSliderProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hover, setHover] = useState(false);
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const trackColor = zoneColor(percent);

  return (
    <div
      className="space-y-1.5 relative"
      title={tooltip}
      onMouseEnter={() => { setHover(true); setShowTooltip(true); }}
      onMouseLeave={() => { setHover(false); setShowTooltip(false); }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[11px] font-medium text-slate-300 truncate">
          {label}
        </label>
        <span
          className="text-xs font-mono tabular-nums text-slate-200 transition-all duration-200"
          style={{
            textShadow: hover ? `0 0 12px ${trackColor}66` : "none",
          }}
        >
          {typeof value === "number" && step < 1 ? value.toFixed(2) : value} {unit}
        </span>
      </div>
      <div className="relative h-3 w-full rounded-full overflow-hidden bg-slate-700/80">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            background: `linear-gradient(90deg, #22c55e, #eab308, #ef4444)`,
            opacity: 0.85,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent outline-none
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/80
            [&::-webkit-slider-thumb]:shadow-[0_0_14px_currentColor]
            [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-runnable-track]:bg-transparent"
          style={{
            color: trackColor,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{minLabel ?? `${min} ${unit}`}</span>
        <span>{maxLabel ?? `${max} ${unit}`}</span>
      </div>
      {showTooltip && tooltip && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-slate-800 border border-slate-600 text-[10px] text-slate-300 whitespace-nowrap z-50 pointer-events-none"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
