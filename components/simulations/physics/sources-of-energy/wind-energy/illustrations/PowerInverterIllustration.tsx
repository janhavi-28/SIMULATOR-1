"use client";

import React from "react";

/** Illustrated power inverter — screen, sine wave, indicators. Flat diagram style. */
export function PowerInverterIllustration({
  active = false,
  phase = 0,
  className = "",
  width = 100,
  height = 70,
}: {
  active?: boolean;
  phase?: number;
  className?: string;
  width?: number;
  height?: number;
}) {
  const wavePoints = Array.from({ length: 21 }, (_, i) => {
    const x = 24 + (i / 20) * 32;
    const y = 32 + 8 * Math.sin((i / 20) * Math.PI * 2 + phase);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 70" width={width} height={height} className={className}>
      <defs>
        <linearGradient id="inverter-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <filter id="inverter-glow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feFlood floodColor="#facc15" floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="10" y="12" width="80" height="42" rx="4" fill="url(#inverter-body)" stroke="#0d9488" strokeWidth="1" filter={active ? "url(#inverter-glow)" : undefined} />
      <rect x="14" y="18" width="36" height="24" rx="2" fill="#0f172a" stroke="#14b8a6" strokeWidth="0.6" />
      <polyline points={wavePoints} fill="none" stroke={active ? "#facc15" : "#64748b"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 1 : 0.5} />
      {active && <circle r="2" fill="#facc15"><animate attributeName="opacity" values="0.5;1;0.5" dur="0.6s" repeatCount="indefinite" /></circle>}
      <circle cx="72" cy="28" r="4" fill={active ? "#22c55e" : "#475569"} opacity={active ? 1 : 0.4}>
        {active && <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />}
      </circle>
      <circle cx="72" cy="42" r="4" fill={active ? "#facc15" : "#475569"} opacity={active ? 1 : 0.4}>
        {active && <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" begin="0.3s" />}
      </circle>
      <path d="M82 28 L78 36 L82 36 L76 46 L80 34 L76 34 Z" fill="#facc15" stroke="#eab308" strokeWidth="0.6" opacity={active ? 1 : 0.5} />
      <text x="50" y="68" textAnchor="middle" className="fill-slate-400 text-[9px] font-medium">
        Power inverter
      </text>
    </svg>
  );
}
