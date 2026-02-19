"use client";

import React, { lazy, Suspense } from "react";
import type { SoundSubtopicSlug } from "@/lib/data/sound-subtopics";
import { SOUND_SUBTOPICS } from "@/lib/data/sound-subtopics";

const NatureOfSoundSimulation = lazy(() => import("./sound/NatureOfSoundSimulation").then((m) => ({ default: m.default })));
const SoundAsWaveSimulation = lazy(() => import("./sound/SoundAsWaveSimulation").then((m) => ({ default: m.default })));
const LongitudinalWavesSimulation = lazy(() => import("./sound/LongitudinalWavesSimulation").then((m) => ({ default: m.default })));
const AmplitudeSimulation = lazy(() => import("./sound/AmplitudeSimulation").then((m) => ({ default: m.default })));
const TimePeriodSimulation = lazy(() => import("./sound/TimePeriodSimulation").then((m) => ({ default: m.default })));
const FrequencySimulation = lazy(() => import("./sound/FrequencySimulation").then((m) => ({ default: m.default })));
const WavelengthSimulation = lazy(() => import("./sound/WavelengthSimulation").then((m) => ({ default: m.default })));
const SpeedOfSoundSimulation = lazy(() => import("./sound/SpeedOfSoundSimulation").then((m) => ({ default: m.default })));
const ReflectionOfSoundSimulation = lazy(() => import("./sound/ReflectionOfSoundSimulation").then((m) => ({ default: m.default })));
const EchoAndReverberationSimulation = lazy(() => import("./sound/EchoAndReverberationSimulation").then((m) => ({ default: m.default })));

const SIM_MAP: Partial<Record<SoundSubtopicSlug, React.LazyExoticComponent<React.ComponentType>>> = {
  "nature-of-sound": NatureOfSoundSimulation,
  "sound-as-a-wave": SoundAsWaveSimulation,
  "longitudinal-waves": LongitudinalWavesSimulation,
  amplitude: AmplitudeSimulation,
  "time-period": TimePeriodSimulation,
  frequency: FrequencySimulation,
  wavelength: WavelengthSimulation,
  "speed-of-sound": SpeedOfSoundSimulation,
  "reflection-of-sound": ReflectionOfSoundSimulation,
  "echo-and-reverberation": EchoAndReverberationSimulation,
};

const Fallback = () => (
  <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-8 text-center">
    <div className="animate-pulse text-neutral-500">Loading simulator…</div>
  </div>
);

type Props = { slug: SoundSubtopicSlug };

export default function SoundSubtopicSimulator({ slug }: Props) {
  const subtopic = SOUND_SUBTOPICS[slug];
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
