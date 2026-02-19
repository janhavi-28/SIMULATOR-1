import Link from "next/link";
import MotionSimulation from "@/components/simulations/physics/MotionSimulation";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import { SITE_URL } from "@/lib/seo";
import {
  MOTION_MECHANICS_SUBTOPIC_SLUGS,
  MOTION_MECHANICS_SUBTOPICS,
} from "@/lib/data/motion-mechanics-subtopics";
import type { MotionMechanicsSubtopicSlug } from "@/lib/data/motion-mechanics-subtopics";
import MotionKeyFormulas from "./components/MotionKeyFormulas";

/** Icons for subtopic cards – match Electricity style */
const MOTION_SUBTOPIC_ICONS: Record<MotionMechanicsSubtopicSlug, string> = {
  motion: "📐",
  "distance-and-displacement": "📏",
  "speed-and-velocity": "📈",
  acceleration: "📊",
  "uniform-and-non-uniform-motion": "🔁",
  "graphical-representation-of-motion": "📉",
  "equations-of-motion": "📐",
  force: "⚡",
  "newtons-laws-of-motion": "🔢",
  inertia: "🧱",
  "momentum-and-conservation-of-momentum": "🔄",
};
import MotionRealWorldApps from "./components/MotionRealWorldApps";
import MotionMisconceptions from "./components/MotionMisconceptions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Motion & Mechanics | High School Physics",
  description:
    "High School Physics: Motion & Mechanics – motion, distance and displacement, speed and velocity, acceleration, equations of motion, force, Newton's laws, inertia, momentum. Interactive speed–time simulator.",
  keywords: [
    "high school physics",
    "motion and mechanics",
    "kinematics",
    "speed and velocity",
    "acceleration",
    "equations of motion",
    "force",
    "Newton's laws",
    "momentum",
    "interactive simulation",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/motion`,
  },
  openGraph: {
    title: "Motion & Mechanics | High School Physics",
    description:
      "Motion & Mechanics: displacement, velocity, acceleration, force, momentum. Interactive speed–time simulator.",
    url: `${SITE_URL}/high-school/physics/motion`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsMotionPage() {
  const breadcrumbs = [{ label: "Motion & Mechanics", href: "/high-school/physics/motion" }];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Motion & Mechanics"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-cyan-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      {/* Hero: intro (left) + key concepts (right on desktop), same layout as Electricity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 mb-3 lg:mb-4 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
            Learn motion, distance and displacement, speed and velocity, acceleration, and equations of motion. Explore force, Newton&apos;s laws, inertia, and momentum. Use the simulator below: set initial velocity and acceleration, then <strong>Launch</strong> and <strong>Play</strong> / <strong>Pause</strong> to watch distance and speed over time.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(34,211,238,0.12)] flex flex-col justify-center">
          <ul className="text-sm text-neutral-400 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>📏</span>
              <span><strong className="text-cyan-200 font-bold">Displacement</strong> — shortest distance between positions (m)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>📈</span>
              <span><strong className="text-cyan-200 font-bold">Velocity</strong> — rate of change of displacement (m/s)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>📊</span>
              <span><strong className="text-cyan-200 font-bold">Acceleration</strong> — rate of change of velocity (m/s²)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⚡</span>
              <span><strong className="text-cyan-200 font-bold">Force</strong> — interaction causing motion or deformation (N)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🔄</span>
              <span><strong className="text-cyan-200 font-bold">Momentum</strong> — mass × velocity (kg·m/s)</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Simulator + parameters — same container and height as Electricity */}
      <div
        id="simulator"
        className="flex flex-col flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-visible mb-8 shadow-lg shadow-black/20 scroll-mt-24 transition-[box-shadow] duration-300 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] px-[clamp(16px,3vw,32px)]"
      >
        <MotionSimulation />
      </div>

      <MotionKeyFormulas />
      <MotionRealWorldApps />
      <MotionMisconceptions />

      <section id="subtopics" className="mt-8 pt-6 border-t border-neutral-800/80 scroll-mt-24">
        {/* Chapter Guide – single orientation unit, two columns (match Electricity) */}
        <div className="mb-5 rounded-lg border border-neutral-700/40 bg-neutral-900/20 px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">Chapter Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-2">How to Study This Chapter</h4>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🟢</span>
                  Start with Motion and reference frames
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>📏</span>
                  Build concepts: Displacement → Velocity → Acceleration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>📐</span>
                  Connect ideas using equations of motion
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>⚡</span>
                  Apply force, Newton&apos;s laws, and momentum in the simulator
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔍</span>
                  Relate displacement, velocity, and acceleration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>📐</span>
                  Use kinematic equations for constant acceleration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>⚡</span>
                  Apply Newton&apos;s laws and F = ma
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔄</span>
                  Interpret momentum and conservation
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Motion &amp; Mechanics</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with clear explanations and an interactive simulator where relevant.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOTION_MECHANICS_SUBTOPIC_SLUGS.map((slug) => {
            const sub = MOTION_MECHANICS_SUBTOPICS[slug as MotionMechanicsSubtopicSlug];
            const icon = MOTION_SUBTOPIC_ICONS[slug as MotionMechanicsSubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/motion/subtopics/${slug}`}
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
            href="/high-school/physics/electricity"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ➡️ Next: Electricity
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
