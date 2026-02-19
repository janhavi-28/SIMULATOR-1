"use client";

import React from "react";

/** Illustrated power distribution unit — box with outputs. Flat diagram style. */
export function DistributionUnitIllustration({
  active = false,
  pulse = 0,
  className = "",
  width = 100,
  height = 70,
}: {
  active?: boolean;
  pulse?: number;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg viewBox="0 0 100 70" width={width} height={height} className={className}>
      <defs>
        <linearGradient id="dist-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="dist-panel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <filter id="dist-glow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feFlood floodColor="#facc15" floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="12" y="14" width="76" height="38" rx="4" fill="url(#dist-body)" stroke="#0ea5e9" strokeWidth="1" filter={active ? "url(#dist-glow)" : undefined} />
      <rect x="28" y="20" width="44" height="26" rx="2" fill="url(#dist-panel)" stroke="#1e293b" strokeWidth="0.6" />
      {/* Output lines */}
      <line x1="38" y1="33" x2="38" y2="52" stroke={active ? "#facc15" : "#64748b"} strokeWidth={active ? 2 : 1} strokeLinecap="round" opacity={active ? 0.4 + 0.6 * pulse : 0.3} />
      <line x1="50" y1="33" x2="50" y2="52" stroke={active ? "#facc15" : "#64748b"} strokeWidth={active ? 2 : 1} strokeLinecap="round" opacity={active ? 0.4 + 0.6 * pulse : 0.3} />
      <line x1="62" y1="33" x2="62" y2="52" stroke={active ? "#facc15" : "#64748b"} strokeWidth={active ? 2 : 1} strokeLinecap="round" opacity={active ? 0.4 + 0.6 * pulse : 0.3} />
      {active && (
        <circle cx="50" cy="48" r="2" fill="#facc15">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
        </circle>
      )}
      <rect x="10" y="50" width="80" height="8" rx="2" fill="#334155" />
      <text x="50" y="68" textAnchor="middle" className="fill-slate-400 text-[9px] font-medium">
        Power distribution unit
      </text>
    </svg>
  );
}
