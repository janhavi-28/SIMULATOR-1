import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import { SITE_URL } from "@/lib/seo";
import {
  WORK_ENERGY_POWER_SUBTOPIC_SLUGS,
  WORK_ENERGY_POWER_SUBTOPICS,
} from "@/lib/data/work-energy-power-subtopics";
import type { WorkEnergyPowerSubtopicSlug } from "@/lib/data/work-energy-power-subtopics";
import WorkEnergyPowerKeyFormulas from "./components/WorkEnergyPowerKeyFormulas";
import WorkEnergyPowerMisconceptions from "./components/WorkEnergyPowerMisconceptions";
import WorkEnergyPowerRealWorldApps from "./components/WorkEnergyPowerRealWorldApps";
import WorkEnergyPowerPlaygroundLoader from "./components/WorkEnergyPowerPlaygroundLoader";

const SUBTOPIC_ICONS: Record<WorkEnergyPowerSubtopicSlug, string> = {
  work: "🧱",
  energy: "⚡",
  "kinetic-energy": "🏃",
  "potential-energy": "🪜",
  "conservation-of-energy": "🔁",
  power: "🔌",
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Work, Energy & Power | High School Physics",
  description:
    "High School Physics: Work, Energy & Power – work done by force, kinetic and potential energy, conservation of energy, power. Interactive simulators for work, KE, PE, and power.",
  keywords: [
    "high school physics",
    "work",
    "energy",
    "power",
    "kinetic energy",
    "potential energy",
    "conservation of energy",
    "interactive simulation",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/work-energy-power`,
  },
  openGraph: {
    title: "Work, Energy & Power | High School Physics",
    description:
      "Work, energy, power: W = F·s, KE = ½mv², PE = mgh, P = W/t. Interactive simulators.",
    url: `${SITE_URL}/high-school/physics/work-energy-power`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsWorkEnergyPowerPage() {
  const breadcrumbs = [{ label: "Work, Energy & Power", href: "/high-school/physics/work-energy-power" }];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Work, Energy & Power"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-cyan-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 mb-3 lg:mb-4 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
            Learn how forces cause work, how energy is stored and transferred, and how power measures the rate of doing work. Use interactive simulators to explore motion, height, mass, and time to understand real-world energy transformations.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(34,211,238,0.12)] flex flex-col justify-center">
          <ul className="text-sm text-neutral-400 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🧱</span>
              <span><strong className="text-cyan-200 font-bold">Work</strong> — force × displacement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⚡</span>
              <span><strong className="text-cyan-200 font-bold">Energy</strong> — ability to do work</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🏃</span>
              <span><strong className="text-cyan-200 font-bold">Kinetic Energy</strong> — energy of motion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🪜</span>
              <span><strong className="text-cyan-200 font-bold">Potential Energy</strong> — energy due to position</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🔁</span>
              <span><strong className="text-cyan-200 font-bold">Conservation of Energy</strong> — energy transforms, not lost</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🔌</span>
              <span><strong className="text-cyan-200 font-bold">Power</strong> — rate of doing work</span>
            </li>
          </ul>
        </div>
      </section>

      <div
        id="simulator"
        className="flex flex-col flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-visible mb-8 shadow-lg shadow-black/20 scroll-mt-24 transition-[box-shadow] duration-300 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] px-[clamp(16px,3vw,32px)]"
      >
        <WorkEnergyPowerPlaygroundLoader />
      </div>

      <WorkEnergyPowerKeyFormulas />
      <WorkEnergyPowerRealWorldApps />
      <WorkEnergyPowerMisconceptions />

      <section id="subtopics" className="mt-8 pt-6 border-t border-neutral-800/80 scroll-mt-24">
        <div className="mb-5 rounded-lg border border-neutral-700/40 bg-neutral-900/20 px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">Chapter Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-2">How to Study This Chapter</h4>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🟢</span>
                  Start with Work (W = F·s)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>⚡</span>
                  Build: Energy → KE and PE
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🔁</span>
                  Conservation of energy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🔌</span>
                  Power as rate of work
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔍</span>
                  Calculate work and when it is zero
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>📐</span>
                  Relate KE and PE to motion and height
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔁</span>
                  Apply conservation of energy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔌</span>
                  Compare power for same work, different time
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Work, Energy & Power</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with clear explanations and an interactive simulator.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORK_ENERGY_POWER_SUBTOPIC_SLUGS.map((slug) => {
            const sub = WORK_ENERGY_POWER_SUBTOPICS[slug as WorkEnergyPowerSubtopicSlug];
            const icon = SUBTOPIC_ICONS[slug as WorkEnergyPowerSubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/work-energy-power/subtopics/${slug}`}
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
