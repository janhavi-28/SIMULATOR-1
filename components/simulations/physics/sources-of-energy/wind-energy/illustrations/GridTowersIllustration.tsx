"use client";

import React from "react";

/** Illustrated transmission towers — flat diagram style. */
export function GridTowersIllustration({
  hasPower = false,
  className = "",
  width = 100,
  height = 100,
}: {
  hasPower?: boolean;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg viewBox="0 0 100 100" width={width} height={height} className={className}>
      <defs>
        <linearGradient id="tower-metal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <filter id="grid-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feFlood floodColor="#facc15" floodOpacity="0.35" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Left tower */}
      <path d="M22 95 L26 95 L28 25 L24 25 Z" fill="url(#tower-metal)" stroke="#475569" strokeWidth="0.6" />
      <path d="M18 28 L32 28 M20 50 L30 50 M18 72 L32 72" stroke="#475569" strokeWidth="0.8" />
      <line x1="24" y1="25" x2="20" y2="95" stroke="#475569" strokeWidth="0.5" opacity="0.7" />
      <line x1="28" y1="25" x2="32" y2="95" stroke="#475569" strokeWidth="0.5" opacity="0.7" />
      {/* Right tower */}
      <path d="M74 95 L78 95 L80 25 L76 25 Z" fill="url(#tower-metal)" stroke="#475569" strokeWidth="0.6" />
      <path d="M70 28 L84 28 M72 50 L82 50 M70 72 L84 72" stroke="#475569" strokeWidth="0.8" />
      <line x1="76" y1="25" x2="72" y2="95" stroke="#475569" strokeWidth="0.5" opacity="0.7" />
      <line x1="80" y1="25" x2="84" y2="95" stroke="#475569" strokeWidth="0.5" opacity="0.7" />
      {/* Power line between towers */}
      <line x1="28" y1="28" x2="76" y2="28" stroke={hasPower ? "#facc15" : "#64748b"} strokeWidth={hasPower ? 2 : 1} strokeLinecap="round" opacity={hasPower ? 0.9 : 0.5} filter={hasPower ? "url(#grid-glow)" : undefined} />
      {hasPower && (
        <circle cx="52" cy="28" r="3" fill="#facc15" opacity="0.8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
      <text x="50" y="98" textAnchor="middle" className="fill-slate-400 text-[10px] font-medium">
        Electrical grid
      </text>
    </svg>
  );
}
