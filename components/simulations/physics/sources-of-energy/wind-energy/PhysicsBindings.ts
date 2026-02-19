/**
 * Wind Energy Simulator — physics-derived values only.
 * DO NOT change formulas; this module exposes existing calculations for visualization.
 */

const BETZ_LIMIT = 0.593;
const CP_TYPICAL = 0.59;
const MECH_LOSS = 0.03;
const GEAR_LOSS = 0.02;

export type WindParams = {
  wind: number;   // m/s
  bladeR: number; // m
  rho: number;    // kg/m³
  eta: number;    // overall efficiency 0..1
};

export type PipelineData = {
  pWind: number;
  pCaptured: number;
  pMech: number;
  pGear: number;
  pGenerator: number;
  pOutput: number;
  etaOverall: number;
};

/** Area = π R² (unchanged) */
export function areaFromRadius(bladeR: number): number {
  return Math.PI * bladeR * bladeR;
}

/** Available power in wind: ½ρAv³, scaled to kW (unchanged) */
export function availablePowerKW(rho: number, area: number, wind: number): number {
  return 0.5 * rho * area * wind * wind * wind * 0.0001;
}

/** Mechanical after Betz capture (unchanged) */
export function mechanicalPowerKW(availableKW: number): number {
  return availableKW * CP_TYPICAL;
}

/** Electrical output (unchanged) */
export function electricalPowerKW(mechKW: number, eta: number): number {
  return mechKW * eta;
}

/** Pipeline stage values from available (kW) and η — same logic as before */
export function computePipeline(availableKW: number, eta: number): PipelineData {
  const pCaptured = availableKW * CP_TYPICAL;
  const pMech = pCaptured * (1 - MECH_LOSS);
  const pGear = pMech * (1 - GEAR_LOSS);
  const etaGen = Math.min(0.99, eta / (CP_TYPICAL * (1 - MECH_LOSS) * (1 - GEAR_LOSS)));
  const pGenerator = pGear * etaGen;
  const pOutput = pGenerator;
  return {
    pWind: availableKW,
    pCaptured,
    pMech,
    pGear,
    pGenerator,
    pOutput,
    etaOverall: availableKW > 0 ? pOutput / availableKW : 0,
  };
}

/** Display-only: RPM proportional to wind when running (for gauges) */
export function rpmFromWind(wind: number, isRunning: boolean): number {
  if (!isRunning) return 0;
  return Math.min(1800, wind * 120);
}

/** Display-only: torque proportional to mechanical power (for gauges) */
export function torqueFromMech(mechKW: number, rpm: number): number {
  if (rpm <= 0) return 0;
  const omega = (rpm * Math.PI * 2) / 60;
  return (mechKW * 1000) / omega; // N⋅m
}

/** Wind too low to turn blades (display threshold) */
export const WIND_CUT_IN = 3;

/** Wind too high — warning / brake threshold */
export const WIND_CUT_OUT = 25;

export function isWindTooLow(wind: number): boolean {
  return wind < WIND_CUT_IN;
}

export function isWindTooHigh(wind: number): boolean {
  return wind >= WIND_CUT_OUT;
}
