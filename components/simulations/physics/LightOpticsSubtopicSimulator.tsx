"use client";

import React, { lazy, Suspense } from "react";
import type { SubtopicSlug } from "@/lib/data/light-optics-subtopics";
import { LIGHT_OPTICS_SUBTOPICS } from "@/lib/data/light-optics-subtopics";

const ReflectionOfLightSimulation = lazy(() => import("./light-optics/ReflectionOfLightSimulation").then((m) => ({ default: m.default })));
const LawsOfReflectionSimulation = lazy(() => import("./light-optics/LawsOfReflectionSimulation").then((m) => ({ default: m.default })));
const RefractionOfLightSimulation = lazy(() => import("./light-optics/RefractionOfLightSimulation").then((m) => ({ default: m.default })));
const LawsOfRefractionSimulation = lazy(() => import("./light-optics/LawsOfRefractionSimulation").then((m) => ({ default: m.default })));
const RefractionGlassSlabSimulation = lazy(() => import("./light-optics/RefractionGlassSlabSimulation").then((m) => ({ default: m.default })));
const RayDiagramsSimulation = lazy(() => import("./light-optics/RayDiagramsSimulation").then((m) => ({ default: m.default })));
const ImageFormationPlaneMirrorSimulation = lazy(() => import("./light-optics/ImageFormationPlaneMirrorSimulation").then((m) => ({ default: m.default })));
const ImageFormationSphericalMirrorsSimulation = lazy(() => import("./light-optics/ImageFormationSphericalMirrorsSimulation").then((m) => ({ default: m.default })));
const RefractionByLensesSimulation = lazy(() => import("./light-optics/RefractionByLensesSimulation").then((m) => ({ default: m.default })));
const MagnificationSimulation = lazy(() => import("./light-optics/MagnificationSimulation").then((m) => ({ default: m.default })));

const SIM_MAP: Partial<Record<SubtopicSlug, React.LazyExoticComponent<React.ComponentType>>> = {
  "reflection-of-light": ReflectionOfLightSimulation,
  "laws-of-reflection": LawsOfReflectionSimulation,
  "refraction-of-light": RefractionOfLightSimulation,
  "laws-of-refraction": LawsOfRefractionSimulation,
  "refraction-glass-slab": RefractionGlassSlabSimulation,
  "ray-diagrams": RayDiagramsSimulation,
  "image-formation-plane-mirror": ImageFormationPlaneMirrorSimulation,
  "image-formation-spherical-mirrors": ImageFormationSphericalMirrorsSimulation,
  "refraction-by-lenses": RefractionByLensesSimulation,
  magnification: MagnificationSimulation,
};

const Fallback = () => (
  <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-8 text-center">
    <div className="animate-pulse text-neutral-500">Loading simulator…</div>
  </div>
);

type Props = { slug: SubtopicSlug };

/** Ray Diagrams subtopic uses the standalone HTML simulator (Optics Pro) for exact UX. */
function RayDiagramIframe() {
  return (
    <iframe
      src="/ray-diagram-simulator.html"
      title="Ray Diagram Simulator — Optics Pro"
      className="w-full h-full min-h-[480px] border-0 rounded-xl bg-[#0f172a]"
      allow="fullscreen"
    />
  );
}

export default function LightOpticsSubtopicSimulator({ slug }: Props) {
  const subtopic = LIGHT_OPTICS_SUBTOPICS[slug];
  const Sim = subtopic ? SIM_MAP[slug] : null;

  if (!subtopic) return null;

  // Ray Diagrams: show the standalone HTML simulator (your Optics Pro version)
  if (slug === "ray-diagrams") {
    return <RayDiagramIframe />;
  }

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
