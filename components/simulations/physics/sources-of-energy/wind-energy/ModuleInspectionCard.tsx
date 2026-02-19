"use client";

import React from "react";

export type ModuleInfo = {
  name: string;
  function: string;
  energyIn: string;
  energyOut: string;
};

const MODULES: Record<string, ModuleInfo> = {
  turbine: { name: "Wind turbine", function: "Converts kinetic wind energy to mechanical rotation.", energyIn: "Wind (kinetic)", energyOut: "Mechanical" },
  controller: { name: "Charge controller", function: "Regulates voltage and current to battery.", energyIn: "Mechanical / DC", energyOut: "DC" },
  battery: { name: "Battery pack", function: "Stores electrical energy for later use.", energyIn: "DC electricity", energyOut: "DC electricity" },
  inverter: { name: "Power inverter", function: "Converts DC to AC for household use.", energyIn: "DC", energyOut: "AC" },
  distribution: { name: "Distribution unit", function: "Splits power to home and grid.", energyIn: "AC", energyOut: "AC (Home + Grid)" },
  house: { name: "Consumer (Home)", function: "Receives AC power for loads.", energyIn: "AC", energyOut: "—" },
  grid: { name: "Electrical grid", function: "Receives surplus power; can supply back.", energyIn: "AC", energyOut: "—" },
};

export function ModuleInspectionCard({
  moduleId,
  onClose,
  className = "",
}: {
  moduleId: string | null;
  onClose: () => void;
  className?: string;
}) {
  if (!moduleId) return null;
  const info = MODULES[moduleId];
  if (!info) return null;

  return (
    <div
      className={`absolute z-[200] rounded-xl border border-slate-600 bg-slate-900/98 shadow-xl backdrop-blur-sm ${className}`}
      style={{ minWidth: 260, maxWidth: 320 }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
        <span className="text-sm font-semibold text-slate-200">{info.name}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="px-4 py-3 space-y-3 text-[13px]">
        <p className="text-slate-300">{info.function}</p>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-slate-400">
          <span>Input:</span>
          <span className="text-cyan-300">{info.energyIn}</span>
          <span>Output:</span>
          <span className="text-amber-300">{info.energyOut}</span>
        </div>
      </div>
    </div>
  );
}
