"use client";

import React from "react";

/** Illustrated wind turbine — flat diagram style, soft shading. Blades rotate via CSS transform. */
export function WindTurbineIllustration({
  rotationDeg = 0,
  windActive = true,
  className = "",
  width = 120,
  height = 140,
}: {
  rotationDeg?: number;
  windActive?: boolean;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={width}
      height={height}
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="turbine-tower" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="turbine-blade" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <filter id="turbine-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Tower */}
      <path
        d="M52 75 L58 75 L60 138 L54 138 Z"
        fill="url(#turbine-tower)"
        filter="url(#turbine-soft-shadow)"
      />
      <rect x="54" y="70" width="6" height="8" rx="1" fill="#0c4a6e" />
      {/* Hub + blades (group rotates) */}
      <g transform={`translate(57, 52) rotate(${rotationDeg}) translate(-57, -52)`}>
        <circle cx="57" cy="52" r="8" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="1" />
        <circle cx="57" cy="52" r="4" fill="#0c4a6e" />
        {/* 3 blades */}
        {[0, 120, 240].map((angle) => (
          <g key={angle} transform={`translate(57, 52) rotate(${angle}) translate(0, -4)`}>
            <path
              d="M-3 0 L3 0 L4 38 L-4 38 Z"
              fill="url(#turbine-blade)"
              stroke="#0ea5e9"
              strokeWidth="0.8"
            />
            <rect x="-1" y="34" width="2" height="6" fill="#ef4444" rx="0.5" />
          </g>
        ))}
      </g>
      {/* Wind arrows (horizontal) */}
      {windActive && (
        <>
          <path d="M20 35 L35 35" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M20 48 L38 48" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M20 62 L35 62" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </>
      )}
      {/* Circular wind arrows around blades */}
      {windActive && (
        <g opacity="0.7">
          <path d="M45 30 A18 18 0 0 1 75 30" fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M75 52 A18 18 0 0 1 45 52" fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
      <text x="60" y="132" textAnchor="middle" className="fill-slate-400 text-[10px] font-medium">
        Wind turbine
      </text>
    </svg>
  );
}
