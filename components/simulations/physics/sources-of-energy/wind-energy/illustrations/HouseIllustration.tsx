"use client";

import React from "react";

/** Illustrated house (consumer) — flat diagram style. */
export function HouseIllustration({
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
        <linearGradient id="house-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="house-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
        <filter id="house-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor="#facc15" floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Roof */}
      <path d="M10 42 L50 12 L90 42 L85 42 L50 18 L15 42 Z" fill="url(#house-roof)" stroke="#1e293b" strokeWidth="0.8" />
      {/* Body */}
      <path d="M18 42 L18 88 L82 88 L82 42 Z" fill="url(#house-body)" stroke="#1e293b" strokeWidth="0.8" />
      {/* Door */}
      <rect x="42" y="58" width="16" height="30" rx="1" fill="#1e3a5f" stroke="#334155" strokeWidth="0.6" />
      {/* Windows */}
      <rect x="26" y="52" width="12" height="14" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />
      <rect x="62" y="52" width="12" height="14" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />
      <rect x="44" y="48" width="12" height="8" rx="0.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />
      {/* Garage */}
      <rect x="26" y="72" width="20" height="16" rx="1" fill="#1e3a5f" stroke="#334155" strokeWidth="0.5" />
      {hasPower && (
        <rect x="18" y="42" width="64" height="46" fill="none" stroke="#facc15" strokeWidth="2" rx="2" opacity="0.6" filter="url(#house-glow)" />
      )}
      <text x="50" y="98" textAnchor="middle" className="fill-slate-400 text-[10px] font-medium">
        Consumer
      </text>
    </svg>
  );
}
