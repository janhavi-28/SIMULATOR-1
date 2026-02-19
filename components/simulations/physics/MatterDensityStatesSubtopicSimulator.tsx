"use client";

import React, { lazy, Suspense } from "react";
import type { MatterDensityStatesSubtopicSlug } from "@/lib/data/matter-density-states-subtopics";
import { MATTER_DENSITY_STATES_SUBTOPICS } from "@/lib/data/matter-density-states-subtopics";

const StatesOfMatterSimulation = lazy(() =>
  import("./matter-density-states/StatesOfMatterSimulation").then((m) => ({ default: m.default })),
);
const ChangeOfStateSimulation = lazy(() =>
  import("./matter-density-states/ChangeOfStateSimulation").then((m) => ({ default: m.default })),
);
const LatentHeatSimulation = lazy(() =>
  import("./matter-density-states/LatentHeatSimulation").then((m) => ({ default: m.default })),
);
const EvaporationSimulation = lazy(() =>
  import("./matter-density-states/EvaporationSimulation").then((m) => ({ default: m.default })),
);
const DensitySimulation = lazy(() =>
  import("./matter-density-states/DensitySimulation").then((m) => ({ default: m.default })),
);

const SIM_MAP: Partial<
  Record<MatterDensityStatesSubtopicSlug, React.LazyExoticComponent<React.ComponentType>>
> = {
  "states-of-matter": StatesOfMatterSimulation,
  "change-of-state": ChangeOfStateSimulation,
  "latent-heat": LatentHeatSimulation,
  evaporation: EvaporationSimulation,
  density: DensitySimulation,
};

const Fallback = () => (
  <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-8 text-center">
    <div className="animate-pulse text-neutral-500">Loading simulator…</div>
  </div>
);

type Props = { slug: MatterDensityStatesSubtopicSlug };

export default function MatterDensityStatesSubtopicSimulator({ slug }: Props) {
  const subtopic = MATTER_DENSITY_STATES_SUBTOPICS[slug];
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

