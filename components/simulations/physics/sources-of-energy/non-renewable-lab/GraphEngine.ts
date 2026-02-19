/**
 * Graph engine: maintains time-series data for live plots.
 * No physics — just data accumulation and trimming.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface DataPoint {
  t: number;
  powerMW: number;
  efficiencyPercent: number;
  emissionsTonsPerHour: number;
  fuelInputRate: number;
}

const MAX_POINTS = 300;
const SAMPLE_INTERVAL_MS = 500;

export function useGraphEngine(
  isRunning: boolean,
  data: { powerMW: number; efficiencyPercent: number; co2TonsPerHour: number; fuelInputRate: number },
  elapsedTimeSec: number
) {
  const [series, setSeries] = useState<DataPoint[]>([]);
  const lastSampleRef = useRef(0);

  useEffect(() => {
    if (!isRunning) return;
    const now = Date.now();
    if (now - lastSampleRef.current < SAMPLE_INTERVAL_MS) return;
    lastSampleRef.current = now;
    setSeries((prev) => {
      const next: DataPoint = {
        t: elapsedTimeSec,
        powerMW: data.powerMW,
        efficiencyPercent: data.efficiencyPercent,
        emissionsTonsPerHour: data.co2TonsPerHour,
        fuelInputRate: data.fuelInputRate,
      };
      const combined = [...prev, next];
      if (combined.length > MAX_POINTS) return combined.slice(-MAX_POINTS);
      return combined;
    });
  }, [isRunning, elapsedTimeSec, data.powerMW, data.efficiencyPercent, data.co2TonsPerHour, data.fuelInputRate]);

  const clearSeries = useCallback(() => setSeries([]), []);

  return { series, clearSeries };
}
