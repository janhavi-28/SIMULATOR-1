"use client";

import React from "react";
import {
  MagnetismContainer,
  MagnetismCanvas,
  MagnetismSlider,
  MagnetismParamSection,
  MagnetismLiveCard,
} from "./MagnetismLayout";

type MagnetismShellProps = {
  title: string;
  subtitle?: string;
  onLaunch: () => void;
  onPause: () => void;
  onReset: () => void;
  paused: boolean;
  hasLaunched: boolean;
  children: React.ReactNode;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
  /** "generator" = same 2.6fr/1fr grid, 780px min-height, responsive */
  layoutVariant?: "default" | "generator";
};

/** 72% simulator | 28% control panel — 780px standard height, no viewport units; edtech standard */
export function MagnetismShell({
  title,
  subtitle,
  onLaunch,
  onPause,
  onReset,
  paused,
  hasLaunched,
  children,
  sidebar,
  footer,
  layoutVariant,
}: MagnetismShellProps) {
  return (
    <MagnetismContainer
      layoutVariant={layoutVariant}
      title={title}
      subtitle={subtitle}
      hasLaunched={hasLaunched}
      paused={paused}
      onLaunch={onLaunch}
      onPause={onPause}
      onReset={onReset}
      canvas={
        <MagnetismCanvas fullBleed>
          <div className="w-full h-full min-h-0 flex flex-col flex-1">
            {children}
          </div>
        </MagnetismCanvas>
      }
      sidebar={sidebar}
      footer={footer}
    />
  );
}

/** Slider control — backward compatible, uses glow when isActive */
export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  color = "cyan",
  title,
  isActive,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  color?: "cyan" | "amber" | "emerald" | "violet" | "rose" | "blue" | "orange" | "magenta";
  title?: string;
  isActive?: boolean;
}) {
  const theme =
    color === "blue" ? "field" : color === "rose" || color === "orange" ? "current" : color === "emerald" ? "output" : color === "violet" ? "violet" : "cyan";
  return (
    <MagnetismSlider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      unit={unit}
      onChange={onChange}
      theme={theme}
      isActive={isActive}
    />
  );
}

export { MagnetismParamSection, MagnetismLiveCard };
