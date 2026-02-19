"use client";

import React, { lazy, Suspense } from "react";
import type { MagnetismSubtopicSlug } from "@/lib/data/magnetism-subtopics";
import { MAGNETISM_SUBTOPICS } from "@/lib/data/magnetism-subtopics";

const MagneticFieldSimulation = lazy(() =>
  import("./magnetism/MagneticFieldSimulation").then((m) => ({ default: m.default })),
);
const MagneticFieldLinesSimulation = lazy(() =>
  import("./magnetism/MagneticFieldLinesSimulation").then((m) => ({ default: m.default })),
);
const FieldDueToCurrentSimulation = lazy(() =>
  import("./magnetism/FieldDueToCurrentSimulation").then((m) => ({ default: m.default })),
);
const LeftHandRuleSimulation = lazy(() =>
  import("./magnetism/LeftHandRuleSimulation").then((m) => ({ default: m.default })),
);
const RightHandRuleSimulation = lazy(() =>
  import("./magnetism/RightHandRuleSimulation").then((m) => ({ default: m.default })),
);
const ElectromagneticInductionSimulation = lazy(() =>
  import("./magnetism/ElectromagneticInductionSimulation").then((m) => ({ default: m.default })),
);
const ElectricMotorSimulation = lazy(() =>
  import("./magnetism/ElectricMotorSimulation").then((m) => ({ default: m.default })),
);
const ElectricGeneratorSimulation = lazy(() =>
  import("./magnetism/ElectricGeneratorSimulation").then((m) => ({ default: m.default })),
);

const SIM_MAP: Partial<Record<MagnetismSubtopicSlug, React.LazyExoticComponent<React.ComponentType>>> =
  {
    "magnetic-field": MagneticFieldSimulation,
    "magnetic-field-lines": MagneticFieldLinesSimulation,
    "field-due-to-current": FieldDueToCurrentSimulation,
    "flemings-left-hand-rule": LeftHandRuleSimulation,
    "flemings-right-hand-rule": RightHandRuleSimulation,
    "electromagnetic-induction": ElectromagneticInductionSimulation,
    "electric-motor": ElectricMotorSimulation,
    "electric-generator": ElectricGeneratorSimulation,
  };

const Fallback = () => (
  <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-8 text-center">
    <div className="animate-pulse text-neutral-500">Loading simulator…</div>
  </div>
);

type Props = { slug: MagnetismSubtopicSlug };

export default function MagnetismSubtopicSimulator({ slug }: Props) {
  const subtopic = MAGNETISM_SUBTOPICS[slug];
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

