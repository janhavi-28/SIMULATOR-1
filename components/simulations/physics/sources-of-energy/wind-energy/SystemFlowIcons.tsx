"use client";

import React from "react";

const stroke = "currentColor";
const strokeWidth = 2.2;
const strokeLinecap = "round";
const strokeLinejoin = "round";

export function IconController() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v1.5M12 13.5V15M9 12h-1.5M15.5 12H15M10.06 10.06l-1.06 1.06M14.94 14.94l-1.06 1.06M10.06 14.94l-1.06-1.06M14.94 10.06l-1.06 1.06" />
    </svg>
  );
}

export function IconBattery() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
      <rect x="2" y="7" width="18" height="10" rx="1.5" />
      <path d="M6 10v4M9 10v4M12 10v4M15 10v4" />
      <rect x="20" y="9" width="1.5" height="6" rx="0.5" />
    </svg>
  );
}

export function IconInverter() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
      <path d="M4 12h3l2-4 2 8 2-4 3 4" />
      <path d="M2 6v12M22 6v12" strokeWidth="1.5" />
    </svg>
  );
}

export function IconDistribution() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
      <path d="M12 2v4M12 18v4M4 12H2M22 12h-2M6.34 6.34L4.93 4.93M19.07 19.07l-1.41-1.41M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 8v2M12 14v2M8 12h2M14 12h2" strokeWidth="1.2" />
    </svg>
  );
}

export function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function IconHouse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
      <path d="M12 3l8 7v11H4V10l8-7z" />
      <path d="M10 21v-6h4v6" />
    </svg>
  );
}
