"use client";

import React, { useRef, useState, useCallback } from "react";

export interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Tick every N units (e.g. 5). */
  tickStep?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Fill color for track (e.g. cyan). */
  accentColor?: string;
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = " cm",
  tickStep = 5,
  onChange,
  disabled = false,
  accentColor = "#06b6d4",
}: SliderProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [thumbX, setThumbX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillPct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const updateThumbPosition = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = (value - min) / (max - min);
    setThumbX(rect.left + pct * rect.width);
  }, [value, min, max]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) onChange(v);
    requestAnimationFrame(updateThumbPosition);
  };

  const ticks: number[] = [];
  for (let t = min; t <= max; t += tickStep) {
    ticks.push(t);
  }
  if (ticks[ticks.length - 1] !== max) ticks.push(max);

  return (
    <div className="lens-slider-wrap">
      <div className="lens-slider-header">
        <label className="lens-slider-label" htmlFor={id}>
          {label}
        </label>
        <span className="lens-slider-value" style={{ color: accentColor }}>
          {value}
          {unit}
        </span>
      </div>
      <div
        className="lens-slider-tooltip"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "100%",
          marginBottom: 6,
          opacity: tooltipVisible ? 1 : 0,
          pointerEvents: "none",
        }}
      >
        {value}
        {unit}
      </div>
      <div
        ref={trackRef}
        className="lens-slider-track-wrap"
        onMouseEnter={() => {
          setTooltipVisible(true);
          updateThumbPosition();
        }}
        onMouseLeave={() => setTooltipVisible(false)}
        onMouseMove={updateThumbPosition}
      >
        <input
          id={id}
          type="range"
          className="lens-slider-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInput}
          disabled={disabled}
          style={
            {
              "--fill-pct": `${fillPct}%`,
              "--accent": accentColor,
            } as React.CSSProperties
          }
        />
      </div>
      <div className="lens-slider-ticks">
        {ticks.map((t) => (
          <span key={t} className="lens-slider-tick">
            {t}
          </span>
        ))}
      </div>
      <div className="lens-slider-minmax">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
