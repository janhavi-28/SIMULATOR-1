"use client";

import React from "react";

/** Illustrated charge controller — meters, lights, lightning. Flat diagram style. */
export function ChargeControllerIllustration({
  active = false,
  meterValue = 0.5,
  className = "",
  width = 100,
  height = 70,
}: {
  active?: boolean;
  meterValue?: number;
  className?: string;
  width?: number;
  height?: number;
}) {
  const needleAngle = -90 + meterValue * 180;
  return (
    <svg viewBox="0 0 100 70" width={width} height={height} className={className}>
      <defs>
        <linearGradient id="controller-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <filter id="controller-glow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feFlood floodColor="#4ade80" floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="8" y="12" width="84" height="42" rx="4" fill="url(#controller-body)" stroke="#22c55e" strokeWidth="1" filter={active ? "url(#controller-glow)" : undefined} />
      <rect x="8" y="50" width="84" height="8" rx="2" fill="#334155" />
      {/* Two circular meters */}
      <circle cx="32" cy="32" r="12" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
      <circle cx="68" cy="32" r="12" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
      <line x1="32" y1="32" x2={32 + 10 * Math.cos((needleAngle * Math.PI) / 180)} y2={32 + 10 * Math.sin((needleAngle * Math.PI) / 180)} stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="68" y1="32" x2={68 + 10 * Math.cos(((needleAngle + 20) * Math.PI) / 180)} y2={32 + 10 * Math.sin(((needleAngle + 20) * Math.PI) / 180)} stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" />
      {/* Five indicator lights */}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={24 + i * 14} cy="52" r="3" fill={active && i < 3 ? "#facc15" : "#475569"} opacity={active && i < 3 ? 1 : 0.4}>
          {active && i < 3 && <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="indefinite" begin={`${i * 0.15}s`} />}
        </circle>
      ))}
      {/* Lightning icon */}
      <path d="M82 22 L78 32 L82 32 L76 42 L80 30 L76 30 Z" fill="#facc15" stroke="#eab308" strokeWidth="0.6" opacity={active ? 1 : 0.5} />
      <text x="50" y="68" textAnchor="middle" className="fill-slate-400 text-[9px] font-medium">
        Charge controller
      </text>
    </svg>
  );
}
