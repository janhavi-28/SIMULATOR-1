"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { GravitationFluidsSubtopicSlug } from "@/lib/data/gravitation-fluids-subtopics";

const GravityFreeFallSimulation = dynamic(
  () => import("@/components/simulations/physics/GravityFreeFallSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const UniversalGravitationSimulation = dynamic(
  () => import("@/components/simulations/physics/UniversalGravitationSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const MassAndWeightSimulation = dynamic(
  () => import("@/components/simulations/physics/MassAndWeightSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const ThrustPressureSimulation = dynamic(
  () => import("@/components/simulations/physics/ThrustPressureSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const PressureInFluidsSimulation = dynamic(
  () => import("@/components/simulations/physics/PressureInFluidsSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const BuoyancySimulation = dynamic(
  () => import("@/components/simulations/physics/BuoyancySimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);

const GRAVITATION_FLUIDS_SIM_MAP: Partial<Record<GravitationFluidsSubtopicSlug, React.ComponentType>> = {
  "universal-law-of-gravitation": UniversalGravitationSimulation,
  "acceleration-due-to-gravity": GravityFreeFallSimulation,
  "free-fall": GravityFreeFallSimulation,
  "mass-and-weight": MassAndWeightSimulation,
  "thrust-and-pressure": ThrustPressureSimulation,
  "pressure-in-fluids": PressureInFluidsSimulation,
  buoyancy: BuoyancySimulation,
  "archimedes-principle": BuoyancySimulation,
};

type Props = { slug: GravitationFluidsSubtopicSlug };

export default function GravitationFluidsSubtopicSimulator({ slug }: Props) {
  const Sim = GRAVITATION_FLUIDS_SIM_MAP[slug];
  if (!Sim) return null;

  return (
    <div className="w-full h-full min-h-[420px] flex flex-col">
      <Sim />
    </div>
  );
}
