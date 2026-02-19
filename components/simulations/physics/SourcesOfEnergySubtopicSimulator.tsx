"use client";

import React, { lazy, Suspense } from "react";
import type { SourcesOfEnergySubtopicSlug } from "@/lib/data/sources-of-energy-subtopics";
import { SOURCES_OF_ENERGY_SUBTOPICS } from "@/lib/data/sources-of-energy-subtopics";

const RenewableSourcesSimulation = lazy(() =>
  import("./sources-of-energy/RenewableSourcesSimulation").then((m) => ({ default: m.default })),
);
const NonRenewableSourcesSimulation = lazy(() =>
  import("./sources-of-energy/NonRenewableSourcesSimulation").then((m) => ({ default: m.default })),
);
const ThermalPowerPlantSimulation = lazy(() =>
  import("./sources-of-energy/ThermalPowerPlantSimulation").then((m) => ({ default: m.default })),
);
const SolarEnergySimulation = lazy(() =>
  import("./sources-of-energy/SolarEnergySimulation").then((m) => ({ default: m.default })),
);
const WindEnergySimulation = lazy(() =>
  import("./sources-of-energy/WindEnergySimulation").then((m) => ({ default: m.default })),
);
const BiogasPlantSimulation = lazy(() =>
  import("./sources-of-energy/BiogasPlantSimulation").then((m) => ({ default: m.default })),
);

const SIM_MAP: Partial<
  Record<SourcesOfEnergySubtopicSlug, React.LazyExoticComponent<React.ComponentType>>
> = {
  "renewable-sources-of-energy": RenewableSourcesSimulation,
  "non-renewable-sources-of-energy": NonRenewableSourcesSimulation,
  "thermal-power-plant": ThermalPowerPlantSimulation,
  "solar-energy": SolarEnergySimulation,
  "wind-energy": WindEnergySimulation,
  "biogas-plant": BiogasPlantSimulation,
};

const Fallback = () => (
  <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-8 text-center">
    <div className="animate-pulse text-neutral-500">Loading simulator…</div>
  </div>
);

type Props = { slug: SourcesOfEnergySubtopicSlug };

export default function SourcesOfEnergySubtopicSimulator({ slug }: Props) {
  const subtopic = SOURCES_OF_ENERGY_SUBTOPICS[slug];
  const Sim = subtopic ? SIM_MAP[slug] : null;

  if (!subtopic) return null;
  if (!Sim) {
    return (
      <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-neutral-400 text-sm mb-2">Simulator for this subtopic</p>
        <h3 className="text-lg font-semibold text-white mb-2">{subtopic.title}</h3>
        <p className="text-neutral-500 text-sm max-w-md">Interactive simulation coming soon.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<Fallback />}>
      <Sim />
    </Suspense>
  );
}

