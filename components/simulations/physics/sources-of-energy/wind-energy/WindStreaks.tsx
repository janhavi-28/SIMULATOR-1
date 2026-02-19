"use client";

import React from "react";

/** Moving horizontal airflow streaks; density ∝ wind speed. Semantic color: cyan. */
export function WindStreaks({
  windSpeed,
  active,
  className = "",
}: {
  windSpeed: number;
  active: boolean;
  className?: string;
}) {
  const count = Math.min(12, Math.max(3, Math.round(windSpeed * 0.8)));
  const dur = Math.max(2, 4 - windSpeed * 0.15);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      {active && Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute h-px bg-cyan-400/60 rounded-full"
          style={{
            width: `${20 + (i % 3) * 15}%`,
            top: `${15 + (i / count) * 70}%`,
            left: "-20%",
            opacity: 0.3 + (windSpeed / 25) * 0.5,
            animation: `wind-streak-${i % 3} ${dur + (i % 3) * 0.3}s linear infinite`,
            animationDelay: `${(i / count) * 0.4}s`,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wind-streak-0 {
          from { transform: translateX(0) translateY(0); }
          to { transform: translateX(140%) translateY(2px); }
        }
        @keyframes wind-streak-1 {
          from { transform: translateX(0) translateY(0); }
          to { transform: translateX(140%) translateY(-1px); }
        }
        @keyframes wind-streak-2 {
          from { transform: translateX(0) translateY(0); }
          to { transform: translateX(140%) translateY(0); }
        }
      `}} />
    </div>
  );
}
