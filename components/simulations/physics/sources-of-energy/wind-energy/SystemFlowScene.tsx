"use client";

import React from "react";
import { EnergyNode, CARD_WIDTH } from "./EnergyNode";
import { EnergyConnector } from "./EnergyConnector";
import { IconController, IconBattery, IconInverter, IconDistribution } from "./SystemFlowIcons";
import type { FlowStateSnapshot } from "./FlowStateEngine";

export type SystemFlowSceneProps = {
  /** Pipeline power values (kW) — from physics, not changed */
  pMech: number;
  pGear: number;
  pGenerator: number;
  pOutput: number;
  flowState: FlowStateSnapshot;
  /** When true, battery path is visually active */
  storageOn: boolean;
  explainMode: boolean;
  onNodeClick?: (id: string) => void;
};

export function SystemFlowScene({
  pMech,
  pGear,
  pGenerator,
  pOutput,
  flowState,
  storageOn,
  explainMode,
  onNodeClick,
}: SystemFlowSceneProps) {
  const { flowLevel, showWarning } = flowState;
  const active = flowLevel > 0 && !showWarning;

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col rounded-xl overflow-hidden" style={{ zIndex: 10 }}>
      {/* Environmental background — opacity < 0.15 */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: "linear-gradient(180deg, rgba(34,211,238,0.06) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)",
          opacity: 0.12,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "rgba(30,41,59,0.4)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.2)",
          opacity: 0.15,
        }}
      />

      {/* Centered flow row */}
      <div className="relative flex-1 flex items-center justify-center gap-0 py-4 px-2">
        <div className="flex items-center flex-wrap justify-center gap-0">
          {/* Connector from turbine (left) */}
          <EnergyConnector
            active={active}
            flowLevel={flowLevel}
            colorFrom="wind"
            colorTo="mechanical"
            showArrow
          />

          <EnergyNode
            id="controller"
            title="Charge Controller"
            label="Regulates power"
            icon={<IconController />}
            value={`${pGear.toFixed(1)} kW`}
            energyIn="Mechanical"
            energyOut="Mechanical"
            functionText="Controls rotor speed and power flow."
            isActive={active}
            accentColor="mechanical"
            onClick={() => onNodeClick?.("controller")}
            showTooltip={explainMode}
            status={active ? "active" : "idle"}
          />

          <EnergyConnector active={active} flowLevel={flowLevel} colorFrom="mechanical" colorTo="stored" showArrow />

          <EnergyNode
            id="battery"
            title="Battery"
            label="Stores energy"
            icon={<IconBattery />}
            value={storageOn ? `${pGenerator.toFixed(1)} kW` : "—"}
            energyIn="Electrical"
            energyOut="Electrical"
            functionText="Stores energy for when wind is low."
            isActive={active && storageOn}
            accentColor="stored"
            onClick={() => onNodeClick?.("battery")}
            showTooltip={explainMode}
            status={storageOn && active ? "active" : "idle"}
          />

          <EnergyConnector active={active} flowLevel={flowLevel} colorFrom="stored" colorTo="electrical" showArrow />

          <EnergyNode
            id="inverter"
            title="Inverter"
            label="DC → AC"
            icon={<IconInverter />}
            value={`${pGenerator.toFixed(1)} kW`}
            energyIn="DC"
            energyOut="AC"
            functionText="Converts DC to AC electricity."
            isActive={active}
            accentColor="electrical"
            onClick={() => onNodeClick?.("inverter")}
            showTooltip={explainMode}
            status={active ? "active" : "idle"}
          />

          <EnergyConnector active={active} flowLevel={flowLevel} colorFrom="electrical" colorTo="electrical" showArrow />

          <EnergyNode
            id="distribution"
            title="Distribution"
            label="To grid / load"
            icon={<IconDistribution />}
            value={`${pOutput.toFixed(1)} kW`}
            energyIn="AC"
            energyOut="Grid / Home"
            functionText="Sends power to grid or home."
            isActive={active}
            accentColor="electrical"
            onClick={() => onNodeClick?.("distribution")}
            showTooltip={explainMode}
            status={active ? "active" : "idle"}
          />

          <EnergyConnector active={active} flowLevel={flowLevel} colorFrom="electrical" colorTo="electrical" showArrow />
        </div>
      </div>

      {showWarning && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-amber-200 border border-amber-500/60 animate-pulse"
          style={{
            background: "rgba(245,158,11,0.15)",
            boxShadow: "0 0 20px rgba(245,158,11,0.3)",
            animationDuration: "1s",
          }}
        >
          High wind — brake
        </div>
      )}
    </div>
  );
}
