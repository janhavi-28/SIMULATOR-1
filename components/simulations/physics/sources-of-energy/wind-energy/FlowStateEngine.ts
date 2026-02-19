/**
 * Wind Energy Simulator — flow state for visualization only.
 * Derives weak/strong/stop/warning from physics values. No physics changes.
 */

export type FlowState = "idle" | "weak" | "strong" | "warning";

export type FlowStateSnapshot = {
  state: FlowState;
  /** 0..1 for animation speed and brightness */
  flowLevel: number;
  /** Pulse speed multiplier (e.g. for connector animation) */
  pulseSpeed: number;
  /** Show overload/warning visual */
  showWarning: boolean;
};

const WIND_LOW = 3;
const WIND_HIGH = 25;
const WIND_STRONG = 12;

export function getFlowState(
  windSpeed: number,
  powerOutputKW: number,
  isAnimating: boolean,
  efficiency: number
): FlowStateSnapshot {
  const noWind = !isAnimating || windSpeed < 0.5;
  const tooLow = windSpeed < WIND_LOW;
  const tooHigh = windSpeed >= WIND_HIGH;
  const overload = tooHigh && isAnimating;

  if (noWind || (isAnimating && tooLow && windSpeed > 0)) {
    return {
      state: "idle",
      flowLevel: 0,
      pulseSpeed: 0,
      showWarning: false,
    };
  }

  if (overload) {
    return {
      state: "warning",
      flowLevel: 0.3,
      pulseSpeed: 1.5,
      showWarning: true,
    };
  }

  const windFrac = Math.min(1, windSpeed / 20);
  const effFrac = Math.max(0.2, efficiency);
  const flowLevel = windFrac * effFrac;
  const pulseSpeed = 0.4 + flowLevel * 1.2;

  const state: FlowState = flowLevel > 0.5 ? "strong" : flowLevel > 0.15 ? "weak" : "idle";

  return {
    state,
    flowLevel,
    pulseSpeed,
    showWarning: false,
  };
}
