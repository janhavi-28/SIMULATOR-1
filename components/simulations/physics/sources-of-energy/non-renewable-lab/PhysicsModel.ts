/**
 * Physics model for the non-renewable power plant.
 * All calculations live here — no UI, no React.
 */

import type { FuelType } from "./types";

const BASE_EFFICIENCY = 0.4; // ~40% typical thermal plant
const OVERLOAD_THRESHOLD = 0.9; // input > 90% for overload risk
const OVERLOAD_TIME_SEC = 5;
const RESERVE_DEPLETION_BASE = 8; // % per second at 100% fuel rate

export const FUEL_CONFIG: Record<
  FuelType,
  { powerFactor: number; co2Factor: number; label: string }
> = {
  coal: { powerFactor: 1.0, co2Factor: 1.0, label: "Coal" },
  oil: { powerFactor: 0.95, co2Factor: 0.85, label: "Oil" },
  gas: { powerFactor: 0.9, co2Factor: 0.6, label: "Natural Gas" },
};

export interface PhysicsModelInput {
  fuelType: FuelType;
  fuelInputRate: number; // 0–100
  coolingLevel: number;  // 0–100
  airIntake: number;    // 0–100
  maintenanceLevel: number; // 0–100
  reservePercent: number;
  elapsedTimeSec: number;
  isRunning: boolean;
  overloadAccumulatedSec: number; // time spent above overload threshold
  /** Time step in seconds for this tick (for reserve depletion) */
  dtSec?: number;
}

export interface PhysicsModelOutput {
  powerMW: number;
  co2TonsPerHour: number;
  reservePercent: number;
  efficiencyPercent: number;
  temperatureNormalized: number;
  pressureNormalized: number;
  turbineRPMNormalized: number;
  voltageNormalized: number;
  overloadFactor: number;
  isOverheated: boolean;
  fuelDepletionRate: number;
  /** For state machine: recommend overload after this long above threshold */
  overloadAccumulatedSec: number;
}

/**
 * Nonlinear efficiency: efficiency = baseEfficiency × (1 − overloadFactor²)
 * High input rate reduces effective efficiency (overload).
 */
function computeEfficiency(
  inputRateNorm: number,
  coolingLevel: number,
  maintenanceLevel: number,
  isOverheated: boolean
): number {
  const overloadFactor = Math.max(0, (inputRateNorm - 0.7) / 0.3); // 0 at 70%, 1 at 100%
  const mult = 1 - overloadFactor * overloadFactor;
  const coolingBonus = 0.02 * (coolingLevel / 100);
  const maintenanceBonus = 0.02 * (maintenanceLevel / 100);
  let eta = BASE_EFFICIENCY * mult + coolingBonus + maintenanceBonus;
  if (isOverheated) eta *= 0.7; // penalty when overheated
  return Math.min(0.55, Math.max(0.2, eta));
}

/**
 * Compute one physics tick. Call from SimulationEngine with current inputs and state.
 */
export function computePhysicsTick(input: PhysicsModelInput): PhysicsModelOutput {
  const cfg = FUEL_CONFIG[input.fuelType];
  const inputNorm = input.fuelInputRate / 100;
  const isRunning = input.isRunning && input.reservePercent > 0;

  // Overload: if input > 90% for >5s → overheated
  const dt = input.dtSec ?? 1 / 60;
  const overThreshold = inputNorm >= OVERLOAD_THRESHOLD ? 1 : 0;
  const newOverloadAccum = isRunning
    ? input.overloadAccumulatedSec + (overThreshold ? dt : -dt * 0.5)
    : Math.max(0, input.overloadAccumulatedSec - dt * 2);
  const overloadAccumulatedSec = Math.max(0, Math.min(OVERLOAD_TIME_SEC + 2, newOverloadAccum));
  const isOverheated = overloadAccumulatedSec >= OVERLOAD_TIME_SEC && isRunning;

  const efficiency = computeEfficiency(
    inputNorm,
    input.coolingLevel,
    input.maintenanceLevel,
    isOverheated
  );

  const rawPowerMW = isRunning
    ? inputNorm * 12 * cfg.powerFactor * efficiency / BASE_EFFICIENCY
    : 0;
  const powerMW = isOverheated ? rawPowerMW * 0.6 : rawPowerMW; // turbine slows

  const co2TonsPerHour = isRunning
    ? inputNorm * 8 * cfg.co2Factor
    : 0;

  const depletionPerSec = (inputNorm * RESERVE_DEPLETION_BASE) / 100;
  const fuelDepletionRate = isRunning ? depletionPerSec : 0;
  const reservePercent = isRunning
    ? Math.max(0, input.reservePercent - fuelDepletionRate * dt)
    : input.reservePercent;

  const overloadFactor = Math.min(1, overloadAccumulatedSec / OVERLOAD_TIME_SEC);
  const temperatureNormalized = isRunning
    ? Math.min(1, 0.3 + inputNorm * 0.5 + overloadFactor * 0.4 - (input.coolingLevel / 100) * 0.2)
    : 0.1;
  const pressureNormalized = isRunning ? 0.2 + inputNorm * 0.6 : 0.1;
  const turbineRPMNormalized = isRunning ? (isOverheated ? 0.5 : 0.85) * (0.5 + inputNorm * 0.5) : 0;
  const voltageNormalized = powerMW > 0 ? Math.min(1, powerMW / 12) : 0;

  const efficiencyPercent = efficiency * 100;

  return {
    powerMW: Math.round(powerMW * 100) / 100,
    co2TonsPerHour: Math.round(co2TonsPerHour * 100) / 100,
    reservePercent: Math.round(reservePercent * 10) / 10,
    efficiencyPercent: Math.round(efficiencyPercent * 10) / 10,
    temperatureNormalized,
    pressureNormalized,
    turbineRPMNormalized,
    voltageNormalized,
    overloadFactor,
    isOverheated,
    fuelDepletionRate,
    overloadAccumulatedSec,
  };
}
