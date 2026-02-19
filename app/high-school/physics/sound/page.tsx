import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import { SITE_URL } from "@/lib/seo";
import { SOUND_SUBTOPIC_SLUGS, SOUND_SUBTOPICS } from "@/lib/data/sound-subtopics";
import type { SoundSubtopicSlug } from "@/lib/data/sound-subtopics";
import SoundKeyFormulas from "./components/SoundKeyFormulas";
import SoundMisconceptions from "./components/SoundMisconceptions";
import SoundRealWorldApps from "./components/SoundRealWorldApps";
import SoundSimulation from "@/components/simulations/physics/sound/SoundSimulation";

const SOUND_SUBTOPIC_ICONS: Record<SoundSubtopicSlug, string> = {
  "nature-of-sound": "🔊",
  "sound-as-a-wave": "〰️",
  "longitudinal-waves": "↔️",
  amplitude: "📈",
  "time-period": "⏱️",
  frequency: "📻",
  wavelength: "λ",
  "speed-of-sound": "💨",
  "reflection-of-sound": "🪞",
  "echo-and-reverberation": "🔁",
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sound | High School Physics",
  description:
    "High School Physics: Sound – nature of sound, sound as a wave, longitudinal waves, amplitude, time period, frequency, wavelength, speed of sound, reflection of sound, echo and reverberation. Interactive simulators with Launch, Pause, and Reset.",
  keywords: [
    "high school physics",
    "sound",
    "longitudinal wave",
    "frequency",
    "wavelength",
    "speed of sound",
    "echo",
    "reverberation",
    "interactive simulation",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/sound`,
  },
  openGraph: {
    title: "Sound | High School Physics",
    description:
      "Sound: nature of sound, waves, amplitude, frequency, wavelength, speed, reflection, echo and reverberation. Interactive sound simulators.",
    url: `${SITE_URL}/high-school/physics/sound`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsSoundPage() {
  const breadcrumbs = [{ label: "Sound", href: "/high-school/physics/sound" }];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Sound"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-cyan-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      {/* Hero: intro + key concepts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 mb-3 lg:mb-4 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
            Learn the nature of sound as a mechanical wave, longitudinal waves with compressions and rarefactions, amplitude, time period, frequency, wavelength, speed of sound in different media, reflection of sound, and echo and reverberation. Use the interactive simulator below to explore a travelling sound wave—toggle between wave view and particle view, change frequency and amplitude, and switch medium. Use <strong>Launch</strong> to start the animation and <strong>Play</strong> / <strong>Pause</strong> and <strong>Reset</strong> to control it.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(34,211,238,0.12)] flex flex-col justify-center">
          <ul className="text-sm text-neutral-400 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🔊</span>
              <span><strong className="text-cyan-200 font-bold">Sound</strong> — mechanical wave requiring a medium</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>〰️</span>
              <span><strong className="text-cyan-200 font-bold">Longitudinal wave</strong> — compressions and rarefactions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⏱️</span>
              <span><strong className="text-cyan-200 font-bold">Frequency & period</strong> — f (Hz), T = 1/f</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>λ</span>
              <span><strong className="text-cyan-200 font-bold">Wave speed</strong> — v = fλ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🪞</span>
              <span><strong className="text-cyan-200 font-bold">Reflection & echo</strong> — angle of incidence = angle of reflection</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Simulator */}
      <div
        id="simulator"
        className="flex flex-col flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-visible mb-8 shadow-lg shadow-black/20 scroll-mt-24 transition-[box-shadow] duration-300 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] px-[clamp(16px,3vw,32px)]"
      >
        <SoundSimulation />
      </div>

      <SoundKeyFormulas />
      <SoundRealWorldApps />
      <SoundMisconceptions />

      <section id="subtopics" className="mt-8 pt-6 border-t border-neutral-800/80 scroll-mt-24">
        <div className="mb-5 rounded-lg border border-neutral-700/40 bg-neutral-900/20 px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">Chapter Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-2">How to Study This Chapter</h4>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🟢</span>
                  Start with Nature of sound and Sound as a wave
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>〰️</span>
                  Build: Longitudinal waves → Amplitude → Period & frequency → Wavelength
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>💨</span>
                  Connect speed of sound to medium and temperature
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🔁</span>
                  Apply reflection, echo, and reverberation in the simulators
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔊</span>
                  Explain sound as a mechanical longitudinal wave
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>📐</span>
                  Use v = fλ, T = 1/f, and echo delay t = 2d/v
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🪞</span>
                  Understand reflection of sound and echo vs reverberation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>📈</span>
                  Relate amplitude to loudness and frequency to pitch
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Sound</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with clear explanations and an interactive simulator.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOUND_SUBTOPIC_SLUGS.map((slug) => {
            const sub = SOUND_SUBTOPICS[slug as SoundSubtopicSlug];
            const icon = SOUND_SUBTOPIC_ICONS[slug as SoundSubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/sound/subtopics/${slug}`}
                className="block rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 transition hover:border-cyan-500/50 hover:bg-neutral-800 hover:shadow-lg hover:shadow-cyan-500/15 hover:-translate-y-0.5"
              >
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <span className="text-base text-cyan-400/80 shrink-0" aria-hidden>{icon}</span>
                  {sub.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-400 leading-snug line-clamp-2">
                  {sub.shortDescription}
                </p>
                <span className="mt-2 inline-block text-xs font-medium text-cyan-300">Read more →</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center text-sm">
          <Link
            href="/high-school/physics/light"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ➡️ Next: Light &amp; Optics
          </Link>
          <Link
            href="/high-school/physics"
            className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 font-medium text-neutral-200 hover:bg-neutral-700 transition"
          >
            🧪 Explore more simulations
          </Link>
        </div>
      </section>
    </SeniorSecondaryTopicLayout>
  );
}
