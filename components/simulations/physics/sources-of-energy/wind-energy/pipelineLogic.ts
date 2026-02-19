/**
 * Pipeline physics and flow logic from the Advanced Wind Energy Pipeline Simulator (HTML).
 * Gen from wind; battery charge/discharge; path states and grid export/import.
 */

export type FlowPathState = {
  active: boolean;
  color: string;
  reverse?: boolean;
};

export type PipelinePaths = {
  hc: FlowPathState;
  cc: FlowPathState;
  cs: FlowPathState;
  cg: FlowPathState;
  su: FlowPathState;
  cu: FlowPathState;
};

const COLORS = {
  cyan: "#22d3ee",
  orange: "#fb923c",
  yellow: "#facc15",
  green: "#4ade80",
  red: "#ef4444",
  muted: "#1e293b",
};

/** Generation (kW): 0 if wind < 3 or > 25; else (wind - 2.5)^1.4 * 0.5 */
export function genFromWind(wind: number): number {
  if (wind < 3) return 0;
  if (wind > 25) return 0;
  return Math.pow(wind - 2.5, 1.4) * 0.5;
}

/** Turbine spin period (seconds) for CSS animation */
export function spinSpeedFromWind(gen: number, wind: number): number {
  if (gen <= 0) return 0;
  return Math.max(0.3, 4 - wind / 5);
}

/** One tick: update battery and return path states + grid export */
export function tickPipeline(
  gen: number,
  load: number,
  battery: number,
  BATTERY_STEP = 0.05
): { battery: number; paths: PipelinePaths; gridEx: number } {
  let newBattery = battery;
  const paths: PipelinePaths = {
    hc: { active: gen > 0, color: COLORS.cyan },
    cc: { active: gen > 0, color: COLORS.orange },
    cs: { active: false, color: COLORS.green },
    cg: { active: false, color: COLORS.yellow, reverse: false },
    su: { active: false, color: COLORS.green },
    cu: { active: false, color: COLORS.yellow },
  };
  let gridEx = 0;

  const surplus = gen - load;

  if (gen >= load) {
    paths.cu.active = true;
    paths.cu.color = COLORS.yellow;
    paths.su.active = false;

    if (newBattery < 100) {
      newBattery = Math.min(100, newBattery + BATTERY_STEP);
      paths.cs.active = true;
      paths.cs.color = COLORS.green;
      paths.cg.active = false;
    } else {
      paths.cs.active = false;
      paths.cg.active = true;
      paths.cg.color = COLORS.yellow;
      paths.cg.reverse = false;
      gridEx = surplus;
    }
  } else {
    paths.cu.active = gen > 0;
    paths.cu.color = COLORS.yellow;
    const needed = load - gen;

    if (newBattery > 5) {
      newBattery = Math.max(0, newBattery - BATTERY_STEP);
      paths.su.active = true;
      paths.su.color = COLORS.green;
      paths.cg.active = false;
    } else {
      paths.su.active = false;
      paths.cg.active = true;
      paths.cg.color = COLORS.red;
      paths.cg.reverse = true;
      gridEx = -needed;
    }
  }

  return { battery: newBattery, paths, gridEx };
}
