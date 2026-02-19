"use client";

import React, { lazy, Suspense } from "react";
import type { MotionMechanicsSubtopicSlug } from "@/lib/data/motion-mechanics-subtopics";
import { MOTION_MECHANICS_SUBTOPICS } from "@/lib/data/motion-mechanics-subtopics";

const MotionSubtopicSimulation = lazy(() => import("./motion-mechanics/MotionSubtopicSimulation").then((m) => ({ default: m.default })));
const DistanceDisplacementSimulation = lazy(() => import("./motion-mechanics/DistanceDisplacementSimulation").then((m) => ({ default: m.default })));
const SpeedVelocitySimulation = lazy(() => import("./motion-mechanics/SpeedVelocitySimulation").then((m) => ({ default: m.default })));
const AccelerationSubtopicSimulation = lazy(() => import("./motion-mechanics/AccelerationSubtopicSimulation").then((m) => ({ default: m.default })));
const UniformNonUniformMotionSimulation = lazy(() => import("./motion-mechanics/UniformNonUniformMotionSimulation").then((m) => ({ default: m.default })));
const GraphicalRepresentationSimulation = lazy(() => import("./motion-mechanics/GraphicalRepresentationSimulation").then((m) => ({ default: m.default })));
const EquationsOfMotionSimulation = lazy(() => import("./motion-mechanics/EquationsOfMotionSimulation").then((m) => ({ default: m.default })));
const ForceSubtopicSimulation = lazy(() => import("./motion-mechanics/ForceSubtopicSimulation").then((m) => ({ default: m.default })));
const NewtonsLawsSimulation = lazy(() => import("./motion-mechanics/NewtonsLawsSimulation").then((m) => ({ default: m.default })));
const InertiaSubtopicSimulation = lazy(() => import("./motion-mechanics/InertiaSubtopicSimulation").then((m) => ({ default: m.default })));
const MomentumConservationSimulation = lazy(() => import("./motion-mechanics/MomentumConservationSimulation").then((m) => ({ default: m.default })));

const SIM_MAP: Partial<Record<MotionMechanicsSubtopicSlug, React.LazyExoticComponent<React.ComponentType>>> = {
  motion: MotionSubtopicSimulation,
  "distance-and-displacement": DistanceDisplacementSimulation,
  "speed-and-velocity": SpeedVelocitySimulation,
  acceleration: AccelerationSubtopicSimulation,
  "uniform-and-non-uniform-motion": UniformNonUniformMotionSimulation,
  "graphical-representation-of-motion": GraphicalRepresentationSimulation,
  "equations-of-motion": EquationsOfMotionSimulation,
  force: ForceSubtopicSimulation,
  "newtons-laws-of-motion": NewtonsLawsSimulation,
  inertia: InertiaSubtopicSimulation,
  "momentum-and-conservation-of-momentum": MomentumConservationSimulation,
};

const Fallback = () => (
  <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-8 text-center">
    <div className="animate-pulse text-neutral-500">Loading simulator…</div>
  </div>
);

type Props = { slug: MotionMechanicsSubtopicSlug };

export default function MotionMechanicsSubtopicSimulator({ slug }: Props) {
  const subtopic = MOTION_MECHANICS_SUBTOPICS[slug];
  const Sim = subtopic ? SIM_MAP[slug] : null;

  if (!subtopic) return null;
  if (!Sim) {
    return (
      <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-neutral-400 text-sm mb-2">Simulator for this subtopic</p>
        <h3 className="text-lg font-semibold text-white mb-2">{subtopic.title}</h3>
        <p className="text-neutral-500 text-sm max-w-md">
          Interactive simulation for {subtopic.title.toLowerCase()} is coming soon.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<Fallback />}>
      <Sim />
    </Suspense>
  );
}
