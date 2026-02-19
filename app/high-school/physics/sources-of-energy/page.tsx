import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import { SITE_URL } from "@/lib/seo";
import {
  SOURCES_OF_ENERGY_SUBTOPIC_SLUGS,
  SOURCES_OF_ENERGY_SUBTOPICS,
  type SourcesOfEnergySubtopicSlug,
} from "@/lib/data/sources-of-energy-subtopics";
import SourcesOfEnergyRealWorldApps from "./components/SourcesOfEnergyRealWorldApps";
import SourcesOfEnergyMisconceptions from "./components/SourcesOfEnergyMisconceptions";
import RenewableSourcesSimulation from "@/components/simulations/physics/sources-of-energy/RenewableSourcesSimulation";

const SOURCES_ICONS: Record<SourcesOfEnergySubtopicSlug, string> = {
  "renewable-sources-of-energy": "🌱",
  "non-renewable-sources-of-energy": "⛽",
  "thermal-power-plant": "🏭",
  "solar-energy": "☀️",
  "wind-energy": "🌬️",
  "biogas-plant": "🌾",
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sources of Energy | High School Physics",
  description:
    "High School Physics: Sources of Energy – renewable and non‑renewable sources, thermal power plants, solar energy, wind energy, and biogas. Interactive energy-flow and efficiency simulators.",
  keywords: [
    "high school physics",
    "sources of energy",
    "renewable energy",
    "non-renewable energy",
    "thermal power plant",
    "solar energy",
    "wind energy",
    "biogas",
    "interactive simulation",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/sources-of-energy`,
  },
  openGraph: {
    title: "Sources of Energy | High School Physics",
    description:
      "Sources of Energy: renewable and non-renewable sources, thermal plants, solar, wind, and biogas. Explore live energy-flow and efficiency simulators.",
    url: `${SITE_URL}/high-school/physics/sources-of-energy`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsSourcesOfEnergyPage() {
  const breadcrumbs = [{ label: "Sources of Energy", href: "/high-school/physics/sources-of-energy" }];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Sources of Energy"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-emerald-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 mb-3 lg:mb-4 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
            Compare renewable and non‑renewable sources of energy. See how solar panels, wind
            turbines, hydroelectric dams, thermal power plants, and biogas plants convert energy from
            one form to another. Use the interactive simulator below to adjust sunlight, wind, water
            flow, and efficiency and see power output and carbon impact in real time.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(16,185,129,0.3)] flex flex-col justify-center">
          <ul className="text-sm text-neutral-400 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🌱</span>
              <span><strong className="text-emerald-200 font-bold">Renewable sources</strong> — solar, wind, hydro, and biogas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⛽</span>
              <span><strong className="text-emerald-200 font-bold">Non‑renewable sources</strong> — coal, oil, and gas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🏭</span>
              <span><strong className="text-emerald-200 font-bold">Thermal power plants</strong> — fuel → boiler → turbine → generator</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⚡</span>
              <span><strong className="text-emerald-200 font-bold">Efficiency &amp; emissions</strong> — useful power vs losses and CO₂</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Flagship simulator */}
      <div
        id="simulator"
        className="flex flex-col flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-visible mb-8 shadow-lg shadow-black/20 scroll-mt-24 transition-[box-shadow] duration-300 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] px-[clamp(16px,3vw,32px)]"
      >
        <RenewableSourcesSimulation />
      </div>

      <SourcesOfEnergyRealWorldApps />
      <SourcesOfEnergyMisconceptions />

      <section id="subtopics" className="mt-8 pt-6 border-t border-neutral-800/80 scroll-mt-24">
        <div className="mb-5 rounded-lg border border-neutral-700/40 bg-neutral-900/20 px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">Chapter Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-2">
                How to Study This Chapter
              </h4>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400/80 shrink-0" aria-hidden>🟢</span>
                  Start with renewable vs non‑renewable sources and their pros/cons
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400/80 shrink-0" aria-hidden>🏭</span>
                  Study how thermal power plants convert fuel energy step by step
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400/80 shrink-0" aria-hidden>☀️</span>
                  Explore how solar and wind output depend on intensity, area, and speed
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400/80 shrink-0" aria-hidden>🌾</span>
                  See how biogas plants turn waste into usable energy and reduce pollution
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400/70 shrink-0 text-xs" aria-hidden>🌱</span>
                  Distinguish renewable and non‑renewable sources and their impacts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400/70 shrink-0 text-xs" aria-hidden>⚡</span>
                  Calculate and interpret power, energy, and efficiency (η)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400/70 shrink-0 text-xs" aria-hidden>🏭</span>
                  Explain how thermal plants, solar panels, and wind turbines work
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400/70 shrink-0 text-xs" aria-hidden>🌍</span>
                  Relate energy choices to environmental effects and sustainability
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Sources of Energy</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with explanations and an interactive simulator that shows
          energy flows, efficiencies, and impacts.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCES_OF_ENERGY_SUBTOPIC_SLUGS.map((slug) => {
            const sub = SOURCES_OF_ENERGY_SUBTOPICS[slug as SourcesOfEnergySubtopicSlug];
            const icon = SOURCES_ICONS[slug as SourcesOfEnergySubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/sources-of-energy/subtopics/${slug}`}
                className="block rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 transition hover:border-emerald-500/50 hover:bg-neutral-800 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5"
              >
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <span className="text-base text-emerald-300/80 shrink-0" aria-hidden>
                    {icon}
                  </span>
                  {sub.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-400 leading-snug line-clamp-2">
                  {sub.shortDescription}
                </p>
                <span className="mt-2 inline-block text-xs font-medium text-emerald-300">
                  Read more →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </SeniorSecondaryTopicLayout>
  );
}

