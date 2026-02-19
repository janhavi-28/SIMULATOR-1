"use client";

import React from "react";

/** Illustrated battery pack — terminals, charge bar, lightning. Flat diagram style. */
export function BatteryPackIllustration({
  active = false,
  chargeLevel = 0.7,
  className = "",
  width = 100,
  height = 70,
}: {
  active?: boolean;
  chargeLevel?: number;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg viewBox="0 0 100 70" width={width} height={height} className={className}>
      <defs>
        <linearGradient id="battery-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        <filter id="battery-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feFlood floodColor="#4ade80" floodOpacity="0.5" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="18" y="14" width="64" height="38" rx="3" fill="url(#battery-body)" stroke="#ca8a04" strokeWidth="1" filter={active ? "url(#battery-glow)" : undefined} />
      <rect x="20" y="20" width="60" height="26" rx="2" fill="#0f172a" />
      <rect x="22" y="22" width={56 * Math.max(0, Math.min(1, chargeLevel))} height="22" rx="1" fill="#4ade80" />
      {/* + terminal */}
      <rect x="44" y="8" width="12" height="8" rx="1" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.6" />
      <text x="50" y="14" textAnchor="middle" className="fill-white text-[8px] font-bold">+</text>
      {/* - terminal */}
      <rect x="44" y="52" width="12" height="8" rx="1" fill="#1e293b" stroke="#0f172a" strokeWidth="0.6" />
      <text x="50" y="58" textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">−</text>
      {/* Lightning */}
      <path d="M78 28 L74 36 L78 36 L72 46 L77 34 L73 34 Z" fill="#facc15" stroke="#eab308" strokeWidth="0.6" opacity={active ? 1 : 0.5} />
      <text x="50" y="68" textAnchor="middle" className="fill-slate-400 text-[9px] font-medium">
        Battery pack
      </text>
    </svg>
  );
}
